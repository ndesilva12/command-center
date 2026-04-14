"use client";

import { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, ExternalLink } from "lucide-react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Don't render on mobile
  if (isMobile) {
    return null;
  }

  // Don't render while loading
  if (loading) {
    return null;
  }

  // Don't render if not authenticated or nothing playing
  if (!authenticated || !playback?.item) {
    return null;
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

        {/* External Link */}
        <Link
          href="/tools/spotify"
          style={{
            padding: "6px",
            color: "rgba(255,255,255,0.4)",
            alignSelf: "flex-start",
          }}
        >
          <ExternalLink style={{ width: "14px", height: "14px" }} />
        </Link>
      </div>

      {/* Controls - Centered */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
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
      </div>
    </div>
  );
}
