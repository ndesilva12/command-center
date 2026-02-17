import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(filePath) {
  const env = {};
  try {
    const lines = readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[key] = val;
    }
  } catch (e) { console.error('env read error:', e.message); }
  return env;
}

const env = loadEnv(join(__dirname, '../.env.local'));
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const authClient = getAuth(app);
const db = getFirestore(app);

async function main() {
  // List all auth users
  console.log('=== Firebase Auth Users ===');
  const listResult = await authClient.listUsers(100);
  for (const user of listResult.users) {
    console.log(`  uid=${user.uid} | email=${user.email} | displayName=${user.displayName}`);
  }

  // List all Firestore user docs
  console.log('\n=== Firestore /users docs ===');
  const snap = await db.collection('users').get();
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(`  uid=${doc.id} | email=${d.email} | role=${d.role} | permissions=${JSON.stringify(d.permissions)}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
