import mongoose from "mongoose";

function getMongoErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (/Could not connect to any servers in your MongoDB Atlas cluster/i.test(message)) {
    return "MongoDB Atlas connection failed. Add 0.0.0.0/0 to Atlas Network Access (whitelist) so Cloudflare Workers can connect.";
  }

  if (/querySrv|ETIMEOUT|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|timed out/i.test(message)) {
    return "MongoDB Atlas DNS lookup timed out. Check your network/DNS access or switch to a reachable Atlas connection string.";
  }

  return message;
}

function normalizeMongoUri(uri) {
  const value = (uri || "").trim();

  if (!value) return "";

  if (value.startsWith("mongodb+srv://")) {
    const directUri = value.replace("mongodb+srv://", "mongodb://");
    return directUri.includes("tls=true")
      ? directUri
      : `${directUri}${directUri.includes("?") ? "&" : "?"}tls=true`;
  }

  if (value.startsWith("mongodb://") && !/[?&]tls=true/i.test(value)) {
    return `${value}${value.includes("?") ? "&" : "?"}tls=true`;
  }

  return value;
}

const MONGODB_URL = normalizeMongoUri(
  process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URI_DIRECT || ""
);

const CONNECT_OPTIONS = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 10000,
  retryWrites: true,
};

// Cloudflare Workers close sockets between requests, so a cached mongoose
// connection goes stale ("Cannot perform I/O on behalf of a different request").
// We validate with a ping on every request and force a brand-new client when stale.
// State lives on globalThis because each route chunk bundles its own copy of this module.

const state = globalThis.__mongoConnState || (globalThis.__mongoConnState = { connecting: null });

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("op timed out")), ms)),
  ]);
}

async function isConnectionAlive() {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return false;
    await withTimeout(mongoose.connection.db.admin().command({ ping: 1 }), 3000);
    return true;
  } catch {
    return false;
  }
}

function freshConnect() {
  if (!state.connecting) {
    state.connecting = (async () => {
      // On Workers, closing a stale socket can itself throw or hang because the
      // old socket belongs to a previous request. Try briefly, then move on.
      try {
        await withTimeout(mongoose.connection.close(true), 1500);
      } catch {}

      // If close failed, mongoose still thinks it is "connected" and
      // mongoose.connect() would short-circuit and return the dead connection.
      // Force-reset internal state so openUri creates a brand-new MongoClient.
      if (mongoose.connection.readyState !== 0) {
        try {
          mongoose.connection.readyState = 0;
        } catch {}
      }

      await mongoose.connect(MONGODB_URL, CONNECT_OPTIONS);

      // mongoose never resets this flag after a force close; without this,
      // all model queries throw "Connection was force closed" forever.
      mongoose.connection.$wasForceClosed = false;
      return mongoose.connection;
    })().finally(() => {
      state.connecting = null;
    });
  }
  return state.connecting;
}

export const connectDB = async () => {
  if (!MONGODB_URL) {
    throw new Error("MONGODB_URI is not set in the environment. Add your Atlas connection string.");
  }

  if (await isConnectionAlive()) return mongoose.connection;

  try {
    return await freshConnect();
  } catch {
    try {
      return await freshConnect();
    } catch (error) {
      throw new Error(getMongoErrorMessage(error));
    }
  }
};
