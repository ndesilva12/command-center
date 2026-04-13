import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'e2b725dd97f8477bb93787502b1c5693';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '793fd21ebc8a4b019165946323c6c004';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://normandesilva.vercel.app/api/spotify/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/tools/spotify?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/tools/spotify?error=no_code', request.url));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(new URL('/tools/spotify?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Store tokens via the main API
    await fetch(new URL('/api/spotify?action=set-token', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      }),
    });

    // Redirect to Spotify tool page
    return NextResponse.redirect(new URL('/tools/spotify?connected=true', request.url));
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(new URL('/tools/spotify?error=callback_error', request.url));
  }
}
