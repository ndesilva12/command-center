import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/x/callback`
  : 'https://normancdesilva.vercel.app/api/auth/x/callback';

// Scopes needed for personalized content
const SCOPES = [
  'tweet.read',
  'users.read', 
  'offline.access',
  'follows.read',
  'like.read',
].join(' ');

export async function GET(request: NextRequest) {
  if (!X_CLIENT_ID) {
    return NextResponse.json({ error: 'X OAuth not configured' }, { status: 503 });
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Build authorization URL
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', X_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  // Store code verifier and state in cookies for callback
  const response = NextResponse.redirect(authUrl.toString());
  
  response.cookies.set('x_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });
  
  response.cookies.set('x_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
