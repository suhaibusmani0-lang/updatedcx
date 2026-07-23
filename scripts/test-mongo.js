async function loadEnvLocal() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const envPath = path.join(process.cwd(), '.env.local');
  try {
    return fs.readFileSync(envPath, 'utf8');
  } catch {
    return '';
  }
}

function parseMongoUri(envContent) {
  const match = envContent.match(/^MONGODB_URI\s*=\s*(.*)$/m);
  if (!match) return null;
  let val = match[1].trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return val;
}

async function main() {
  const envContent = await loadEnvLocal();
  const uri = parseMongoUri(envContent) || process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI not found in .env.local or process.env');
    process.exit(2);
  }

  console.log('Attempting to connect to MongoDB...');

  const mongoose = (await import('mongoose')).default;

  try {
    await mongoose.connect(uri, {
      dbName: 'ecommerce',
      bufferCommands: false,
    });
    console.log('MongoDB connection successful');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
