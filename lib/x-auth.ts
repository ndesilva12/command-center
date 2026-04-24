import { adminDb } from './firebase-admin';

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

export interface XTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
}

export async function getXAccessToken(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('x_oauth_tokens').doc('primary').get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data?.access_token) {
      return null;
    }

    const expiresAt = data.expires_at?.toDate?.() || new Date(data.expires_at);
    
    // If token expires in less than 5 minutes, try to refresh
    if (expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
      if (data.refresh_token) {
        const newTokens = await refreshXToken(data.refresh_token);
        if (newTokens) {
          return newTokens.access_token;
        }
      }
      return null; // Token expired and couldn't refresh
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting X access token:', error);
    return null;
  }
}

async function refreshXToken(refreshToken: string): Promise<XTokens | null> {
  if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
    console.error('X OAuth credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('X token refresh failed:', response.status, errorText);
      return null;
    }

    const tokens = await response.json();
    
    // Update stored tokens
    await adminDb.collection('x_oauth_tokens').doc('primary').update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || refreshToken,
      expires_in: tokens.expires_in,
      expires_at: new Date(Date.now() + (tokens.expires_in * 1000)),
      refreshed_at: new Date(),
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || refreshToken,
      expires_at: new Date(Date.now() + (tokens.expires_in * 1000)),
    };
  } catch (error) {
    console.error('Error refreshing X token:', error);
    return null;
  }
}
