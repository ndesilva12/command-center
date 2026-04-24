const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let value = match[2];
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
}

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey || !env.FIREBASE_CLIENT_EMAIL || !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('Missing Firebase credentials in .env.local');
  process.exit(1);
}

initializeApp({ 
  credential: cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
  })
});

const db = getFirestore();

db.collection('x_oauth_tokens').doc('primary').set({
  access_token: 'LURwdjVhSUt4dE5jZVJlelZDd1BYZDNEMDhXWm1qNDFpUFFNUkFNTXFKazE1OjE3NzcwNjEyMzk0Njc6MTowOmF0OjE',
  refresh_token: 'UlZfTDBVT0poLXp0SDVqV0J3SU5VbU1ZeVh5WDRBTVRLNC1EOW00bXZrYUxtOjE3NzcwNjEyMzk0Njc6MToxOnJ0OjE',
  token_type: 'bearer',
  expires_in: 7200,
  scope: 'tweet.read users.read offline.access follows.read like.read',
  user_id: 'normancdesilva',
  username: 'normancdesilva', 
  name: 'Norman de Silva',
  created_at: new Date(),
  expires_at: new Date(Date.now() + 7200 * 1000),
}).then(() => {
  console.log('✅ X tokens saved to Firestore!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
