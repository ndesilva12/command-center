import { OAuth2Client } from 'google-auth-library';
import { adminDb } from '@/lib/firebase-admin';
import fs from 'fs';

const LOCAL_TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const FIRESTORE_ACCOUNT_EMAIL = 'norman.desilva@gmail.com';

/**
 * Get Google OAuth2 client for Cinderella Sheets API access.
 * Tries Firestore first (works on Vercel), falls back to local file (dev).
 */
export async function getCinderellaAuth(): Promise<OAuth2Client> {
  // Try Firestore first (production / Vercel)
  try {
    const accountId = FIRESTORE_ACCOUNT_EMAIL.replace(/[^a-zA-Z0-9@.]/g, '_');
    const doc = await adminDb.collection('google-accounts').doc(accountId).get();
    
    if (doc.exists) {
      const data = doc.data();
      if (data?.access_token && data?.refresh_token) {
        const clientId = process.env.GOOGLE_CLIENT_ID || data.client_id;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || data.client_secret;
        
        const auth = new OAuth2Client(clientId, clientSecret);
        auth.setCredentials({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        return auth;
      }
    }
  } catch (e) {
    // Firestore not available, fall through to local file
  }

  // Fallback: local token file (development)
  try {
    const token = JSON.parse(fs.readFileSync(LOCAL_TOKEN_PATH, 'utf8'));
    const auth = new OAuth2Client(token.client_id, token.client_secret);
    auth.setCredentials({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
    });
    return auth;
  } catch (e) {
    throw new Error('No Google credentials available. Connect a Google account or ensure local token file exists.');
  }
}
