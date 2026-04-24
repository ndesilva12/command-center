import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/x/callback`
  : 'https://normancdesilva.vercel.app/api/auth/x/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for errors from X
  if (error) {
    console.error('X OAuth error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(new URL('/settings?error=x_auth_denied', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?error=x_missing_params', request.url));
  }

  // Verify state
  const storedState = request.cookies.get('x_oauth_state')?.value;
  if (state !== storedState) {
    console.error('State mismatch:', { received: state, stored: storedState });
    return NextResponse.redirect(new URL('/settings?error=x_state_mismatch', request.url));
  }

  // Get code verifier
  const codeVerifier = request.cookies.get('x_code_verifier')?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/settings?error=x_missing_verifier', request.url));
  }

  if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/settings?error=x_not_configured', request.url));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorData);
      return NextResponse.redirect(new URL('/settings?error=x_token_failed', request.url));
    }

    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    let userData = { id: 'unknown', username: 'unknown', name: 'Unknown' };
    if (userResponse.ok) {
      const userJson = await userResponse.json();
      userData = userJson.data;
    }

    // Store tokens in Firestore
    await adminDb.collection('x_oauth_tokens').doc('primary').set({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      user_id: userData.id,
      username: userData.username,
      name: userData.name,
      created_at: new Date(),
      expires_at: new Date(Date.now() + (tokens.expires_in * 1000)),
    });

    console.log(`X OAuth connected for @${userData.username}`);

    // Clear cookies and redirect to settings
    const response = NextResponse.redirect(new URL('/settings?x_connected=true', request.url));
    response.cookies.delete('x_code_verifier');
    response.cookies.delete('x_oauth_state');
    
    return response;
  } catch (error) {
    console.error('X OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=x_callback_failed', request.url));
  }
}
