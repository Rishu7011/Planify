const fs = require('fs');
const { MongoClient } = require('mongodb');

const envPath = './.env.local';

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error(`.env.local not found at: ${envPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
  return env;
}

async function main() {
  const env = loadEnv();
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🎉 Successfully connected to MongoDB!');
    
    const db = client.db();
    console.log(`📁 Target Database: "${db.databaseName}"`);
    
    const collections = await db.listCollections().toArray();
    console.log('📋 Existing collections:');
    if (collections.length === 0) {
      console.log('  (none yet)');
    } else {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.close();
  }
}

main();
