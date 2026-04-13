"use client";

import { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Music, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Track {
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

interface PlaybackState {
  is_playing: boolean;
  item: Track | null;
  progress_ms: number;
}

export function SpotifyWidget() {
  const [authenticated, setAuthenticated] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    
    const fetchPlayback = async () => {
      try {
        const res = await fetch('/api/spotify?action=now-playing');
        if (res.ok) {
          const data = await res.json();
          setPlayback(data);
        }
      } catch (err) {
        console.error('Spotify widget error:', err);
      }
    };

    fetchPlayback();
    const interval = setInterval(fetchPlayback, 5000);
    return () => clearInterval(interval);
  }, [authenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/spotify?action=status');
      const data = await res.json();
      setAuthenticated(data.authenticated);
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const control = async (action: string) => {
    try {
      await fetch(`/api/spotify?action=${action}`, { method: 'POST' });
      // Refresh playback state
      const res = await fetch('/api/spotify?action=now-playing');
      if (res.ok) {
        const data = await res.json();
        setPlayback(data);
      }
    } catch (err) {
      console.error('Control error:', err);
    }
  };

  if (loading) {
    return null;
  }

  if (!authenticated) {
    return (
      <Link
        href="/tools/spotify"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "12px",
          background: "rgba(29, 185, 84, 0.1)",
          border: "1px solid rgba(29, 185, 84, 0.2)",
          textDecoration: "none",
          transition: "all 0.2s",
        }}
      >
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          background: "#1DB954",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Music style={{ width: "20px", height: "20px", color: "white" }} />
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "white" }}>
            Connect Spotify
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            Control your music
          </div>
        </div>
      </Link>
    );
  }

  if (!playback?.item) {
    return (
      <Link
        href="/tools/spotify"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          textDecoration: "none",
          transition: "all 0.2s",
        }}
      >
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          background: "rgba(29, 185, 84, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Music style={{ width: "20px", height: "20px", color: "#1DB954" }} />
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
            Nothing playing
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            Open Spotify
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div style={{
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "12px",
      }}>
        {/* Album Art */}
        <img
          src={playback.item.album.images[playback.item.album.images.length - 1]?.url || '/placeholder.png'}
          alt={playback.item.album.name}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "8px",
          }}
        />
        
        {/* Track Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href="/tools/spotify"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "white",
              textDecoration: "none",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {playback.item.name}
          </Link>
          <div style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {playback.item.artists.map(a => a.name).join(', ')}
          </div>
          
          {/* Progress Bar */}
          <div style={{
            marginTop: "8px",
            height: "3px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${(playback.progress_ms / playback.item.duration_ms) * 100}%`,
              background: "#1DB954",
              transition: "width 1s linear",
            }} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}>
        <button
          onClick={() => control('previous')}
          style={{
            padding: "8px",
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
          }}
        >
          <SkipBack style={{ width: "18px", height: "18px" }} />
        </button>

        <button
          onClick={() => control(playback.is_playing ? 'pause' : 'play')}
          style={{
            padding: "10px",
            borderRadius: "50%",
            border: "none",
            background: "#1DB954",
            color: "white",
            cursor: "pointer",
          }}
        >
          {playback.is_playing ? (
            <Pause style={{ width: "20px", height: "20px" }} />
          ) : (
            <Play style={{ width: "20px", height: "20px", marginLeft: "2px" }} />
          )}
        </button>

        <button
          onClick={() => control('next')}
          style={{
            padding: "8px",
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
          }}
        >
          <SkipForward style={{ width: "18px", height: "18px" }} />
        </button>

        <Link
          href="/tools/spotify"
          style={{
            marginLeft: "auto",
            padding: "6px",
            borderRadius: "50%",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <ExternalLink style={{ width: "14px", height: "14px" }} />
        </Link>
      </div>
    </div>
  );
}
