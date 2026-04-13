import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'e2b725dd97f8477bb93787502b1c5693';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '793fd21ebc8a4b019165946323c6c004';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://normandesilva.vercel.app/api/spotify/callback';

// In-memory token storage (use Redis/DB in production)
let tokenData: {
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!tokenData?.refresh_token) return null;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text());
      return null;
    }

    const data = await response.json();
    tokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokenData.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
    };

    return tokenData.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  if (!tokenData) return null;
  
  // Refresh if expiring in next 5 minutes
  if (Date.now() > tokenData.expires_at - 300000) {
    return await refreshAccessToken();
  }
  
  return tokenData.access_token;
}

async function spotifyApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getValidToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify API error: ${response.status} ${error}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'auth-url': {
        const scopes = [
          'user-read-playback-state',
          'user-modify-playback-state',
          'user-read-currently-playing',
          'streaming',
          'playlist-read-private',
          'playlist-read-collaborative',
          'user-library-read',
          'user-top-read',
          'user-read-recently-played',
        ].join(' ');

        const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
          response_type: 'code',
          client_id: CLIENT_ID,
          scope: scopes,
          redirect_uri: REDIRECT_URI,
          show_dialog: 'true',
        })}`;

        return NextResponse.json({ url: authUrl });
      }

      case 'status': {
        return NextResponse.json({ 
          authenticated: !!tokenData,
          expires_at: tokenData?.expires_at,
        });
      }

      case 'now-playing': {
        const data = await spotifyApi('/me/player/currently-playing');
        return NextResponse.json(data || { is_playing: false });
      }

      case 'playback-state': {
        const data = await spotifyApi('/me/player');
        return NextResponse.json(data || { is_playing: false });
      }

      case 'devices': {
        const data = await spotifyApi('/me/player/devices');
        return NextResponse.json(data);
      }

      case 'playlists': {
        const limit = searchParams.get('limit') || '50';
        const data = await spotifyApi(`/me/playlists?limit=${limit}`);
        return NextResponse.json(data);
      }

      case 'playlist': {
        const playlistId = searchParams.get('id');
        if (!playlistId) {
          return NextResponse.json({ error: 'Playlist ID required' }, { status: 400 });
        }
        const data = await spotifyApi(`/playlists/${playlistId}`);
        return NextResponse.json(data);
      }

      case 'recently-played': {
        const limit = searchParams.get('limit') || '20';
        const data = await spotifyApi(`/me/player/recently-played?limit=${limit}`);
        return NextResponse.json(data);
      }

      case 'top-tracks': {
        const timeRange = searchParams.get('time_range') || 'medium_term';
        const limit = searchParams.get('limit') || '20';
        const data = await spotifyApi(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
        return NextResponse.json(data);
      }

      case 'search': {
        const q = searchParams.get('q');
        const type = searchParams.get('type') || 'track,artist,album,playlist';
        const limit = searchParams.get('limit') || '10';
        if (!q) {
          return NextResponse.json({ error: 'Search query required' }, { status: 400 });
        }
        const data = await spotifyApi(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`);
        return NextResponse.json(data);
      }

      case 'queue': {
        const data = await spotifyApi('/me/player/queue');
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'play': {
        const body = await request.json().catch(() => ({}));
        await spotifyApi('/me/player/play', {
          method: 'PUT',
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        });
        return NextResponse.json({ success: true });
      }

      case 'pause': {
        await spotifyApi('/me/player/pause', { method: 'PUT' });
        return NextResponse.json({ success: true });
      }

      case 'next': {
        await spotifyApi('/me/player/next', { method: 'POST' });
        return NextResponse.json({ success: true });
      }

      case 'previous': {
        await spotifyApi('/me/player/previous', { method: 'POST' });
        return NextResponse.json({ success: true });
      }

      case 'seek': {
        const { position_ms } = await request.json();
        await spotifyApi(`/me/player/seek?position_ms=${position_ms}`, { method: 'PUT' });
        return NextResponse.json({ success: true });
      }

      case 'volume': {
        const { volume_percent } = await request.json();
        await spotifyApi(`/me/player/volume?volume_percent=${volume_percent}`, { method: 'PUT' });
        return NextResponse.json({ success: true });
      }

      case 'shuffle': {
        const { state } = await request.json();
        await spotifyApi(`/me/player/shuffle?state=${state}`, { method: 'PUT' });
        return NextResponse.json({ success: true });
      }

      case 'repeat': {
        const { state } = await request.json();
        await spotifyApi(`/me/player/repeat?state=${state}`, { method: 'PUT' });
        return NextResponse.json({ success: true });
      }

      case 'transfer': {
        const { device_id, play } = await request.json();
        await spotifyApi('/me/player', {
          method: 'PUT',
          body: JSON.stringify({ device_ids: [device_id], play }),
        });
        return NextResponse.json({ success: true });
      }

      case 'add-to-queue': {
        const { uri } = await request.json();
        await spotifyApi(`/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: 'POST' });
        return NextResponse.json({ success: true });
      }

      case 'set-token': {
        // Manual token setting (for development)
        const { access_token, refresh_token, expires_in } = await request.json();
        tokenData = {
          access_token,
          refresh_token,
          expires_at: Date.now() + (expires_in * 1000),
        };
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
