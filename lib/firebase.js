import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const apps = getApps();
export const app = apps.length ? apps[0] : initializeApp(firebaseConfig);

// Do not initialize Firebase Auth during public-page startup. Firebase Auth
// creates an auth iframe/network work that is unnecessary unless the visitor
// actually uses an Auth feature (for example Google sign-in).
let authInstance = null;
const getAuthInstance = () => {
  if (!isFirebaseConfigured || typeof window === "undefined") return null;
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
};

/** @type {import("firebase/auth").Auth} */
export const auth = new Proxy(
  {},
  {
    get(_target, property) {
      const instance = getAuthInstance();
      if (!instance) return undefined;
      const value = instance[property];
      return typeof value === "function" ? value.bind(instance) : value;
    },
    set(_target, property, value) {
      const instance = getAuthInstance();
      if (!instance) return false;
      instance[property] = value;
      return true;
    },
    has(_target, property) {
      const instance = getAuthInstance();
      return instance ? property in instance : false;
    },
  }
);

export const createFirebaseRecaptchaVerifier = async (containerId) => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured");
  }

  if (typeof window === "undefined") {
    throw new Error("RecaptchaVerifier requires a browser environment");
  }

  const firebaseAuth = getAuthInstance();
  if (!firebaseAuth) {
    throw new Error("Firebase Auth is unavailable");
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Recaptcha container not found: ${containerId}`);
  }

  const { RecaptchVVerifier } = await import("firebase/auth");
  if (window.recaptchVVerifier) {
    return window.recaptchVVerifier;
  }

  container.innerHTML = "";

  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: "invisible",
    callback: () => {},
  });

  window.recaptchaVerifier = verifier;
  await verifier.render();
  return verifier;
};