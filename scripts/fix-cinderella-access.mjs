// fix-cinderella-access.mjs
// Grants Norman admin access so ALL tools (including Cinderella) are visible
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually parse .env.local (no dotenv dependency)
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
  } catch (e) {
    console.error('Could not read .env.local:', e.message);
  }
  return env;
}

const env = loadEnv(join(__dirname, '../.env.local'));
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error('❌ Missing Firebase env vars. Check .env.local');
  console.error({ privateKey: !!privateKey, clientEmail, projectId });
  process.exit(1);
}

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const authClient = getAuth(app);
const db = getFirestore(app);

const NORMAN_EMAIL = 'normandesilva@gmail.com';

async function fixAccess() {
  console.log(`🔍 Looking up: ${NORMAN_EMAIL}`);

  try {
    const userRecord = await authClient.getUserByEmail(NORMAN_EMAIL);
    console.log(`✅ Found Firebase user: ${userRecord.uid}`);

    const userRef = db.collection('users').doc(userRecord.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log(`📄 Current role: ${data.role} | permissions: ${JSON.stringify(data.permissions)}`);

      const updates = { lastUpdated: Date.now() };
      const needsAdminUpgrade = data.role !== 'admin';
      const perms = data.permissions || [];
      const needsCinderella = !perms.includes('cinderella');

      if (needsAdminUpgrade) {
        updates.role = 'admin';
        console.log('⬆️  Setting role → admin (will unlock ALL tools)');
      }

      if (needsCinderella) {
        updates.permissions = [...perms, 'cinderella'];
        console.log('🎯 Adding cinderella to permissions array (belt-and-suspenders)');
      }

      if (needsAdminUpgrade || needsCinderella) {
        await userRef.update(updates);
        console.log('✅ Firestore updated successfully.');
      } else {
        console.log('✅ Norman already has admin + cinderella permission — no changes needed.');
        console.log('   If you still cannot see Cinderella, try signing out and back in.');
      }

    } else {
      console.log('⚠️  No Firestore doc found — creating admin doc...');
      await userRef.set({
        email: NORMAN_EMAIL,
        displayName: 'Norman de Silva',
        role: 'admin',
        permissions: ['cinderella'],
        createdAt: Date.now(),
        lastLogin: Date.now(),
      });
      console.log('✅ Created admin user doc in Firestore.');
    }

    console.log('\n🎉 Done! Norman should now see Cinderella at:');
    console.log('   https://normandesilva.vercel.app/tools/cinderella');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'auth/user-not-found') {
      console.log('\n⚠️  No Firebase Auth user found for', NORMAN_EMAIL);
      console.log('   Make sure Norman has signed in to the app at least once.');
    }
    process.exit(1);
  }

  process.exit(0);
}

fixAccess();
