import { initializeApp, cert } from 'firebase-admin/app';
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
const db = getFirestore(app);

async function main() {
  const doc = await db.collection('user-settings').doc('default').get();
  if (!doc.exists) {
    console.log('No user-settings/default doc found — all tools default to visible:true');
    process.exit(0);
  }
  const data = doc.data();
  const customizations = data?.toolCustomizations || {};
  
  console.log('=== Tool Customizations (user-settings/default) ===');
  
  // Find any hidden tools
  const hidden = Object.entries(customizations).filter(([_, v]) => !v.visible);
  const cinderellaEntry = customizations['cinderella'];
  
  console.log(`\nTotal customized tools: ${Object.keys(customizations).length}`);
  console.log(`Hidden tools: ${hidden.length}`);
  if (hidden.length > 0) {
    console.log('Hidden tool IDs:', hidden.map(([id]) => id));
  }
  
  console.log(`\nCinderella entry: ${JSON.stringify(cinderellaEntry, null, 2)}`);
  
  if (cinderellaEntry && !cinderellaEntry.visible) {
    console.log('\n🚨 FOUND IT: cinderella has visible:false in tool customizations!');
    console.log('   This hides it even for admins, before permissions are checked.');
    
    // Fix it
    customizations['cinderella'] = {
      ...cinderellaEntry,
      visible: true,
      mobileVisible: true,
    };
    
    await db.collection('user-settings').doc('default').update({
      toolCustomizations: customizations,
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Fixed! Set cinderella.visible = true in Firestore.');
  } else if (!cinderellaEntry) {
    console.log('\n✅ No cinderella entry (defaults to visible:true) — visibility is not the issue.');
  } else {
    console.log('\n✅ Cinderella is visible:true — visibility is not the issue.');
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
