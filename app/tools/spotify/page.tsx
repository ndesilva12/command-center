"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, ListMusic, Search, Clock,
  Music, Smartphone, Speaker, ExternalLink, RefreshCw,
  ChevronRight, Heart, Plus
} from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  uri: string;
}

interface PlaybackState {
  is_playing: boolean;
  item: Track | null;
  progress_ms: number;
  device?: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  };
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

interface Device {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export default function SpotifyPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('spotify', 'Spotify', '#1DB954');
  
  const [isMobile, setIsMobile] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<'now-playing' | 'playlists' | 'search' | 'recent'>('now-playing');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [showDevices, setShowDevices] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check auth status
  useEffect(() => {
    checkAuth();
  }, []);

  // Poll playback state
  useEffect(() => {
    if (!authenticated) return;
    
    const fetchPlayback = async () => {
      try {
        const res = await fetch('/api/spotify?action=playback-state');
        if (res.ok) {
          const data = await res.json();
          setPlayback(data);
        }
      } catch (err) {
        console.error('Playback fetch error:', err);
      }
    };

    fetchPlayback();
    const interval = setInterval(fetchPlayback, 3000);
    return () => clearInterval(interval);
  }, [authenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/spotify?action=status');
      const data = await res.json();
      setAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadPlaylists();
        loadDevices();
        loadRecentTracks();
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const res = await fetch('/api/spotify?action=auth-url');
    const data = await res.json();
    window.location.href = data.url;
  };

  const loadPlaylists = async () => {
    try {
      const res = await fetch('/api/spotify?action=playlists');
      const data = await res.json();
      setPlaylists(data.items || []);
    } catch (err) {
      console.error('Playlists error:', err);
    }
  };

  const loadDevices = async () => {
    try {
      const res = await fetch('/api/spotify?action=devices');
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error('Devices error:', err);
    }
  };

  const loadRecentTracks = async () => {
    try {
      const res = await fetch('/api/spotify?action=recently-played&limit=20');
      const data = await res.json();
      setRecentTracks(data.items?.map((i: any) => i.track) || []);
    } catch (err) {
      console.error('Recent tracks error:', err);
    }
  };

  const loadPlaylistTracks = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/spotify?action=playlist&id=${playlistId}`);
      const data = await res.json();
      setPlaylistTracks(data.tracks?.items?.map((i: any) => i.track) || []);
      setSelectedPlaylist(playlistId);
    } catch (err) {
      console.error('Playlist tracks error:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/spotify?action=search&q=${encodeURIComponent(searchQuery)}&type=track&limit=20`);
      const data = await res.json();
      setSearchResults(data.tracks?.items || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const control = async (action: string, body?: any) => {
    try {
      await fetch(`/api/spotify?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      console.error('Control error:', err);
    }
  };

  const playTrack = async (uri: string) => {
    await control('play', { uris: [uri] });
  };

  const playPlaylist = async (playlistUri: string) => {
    await control('play', { context_uri: playlistUri });
  };

  const addToQueue = async (uri: string) => {
    await control('add-to-queue', { uri });
  };

  const transferPlayback = async (deviceId: string) => {
    await control('transfer', { device_id: deviceId, play: true });
    setShowDevices(false);
    loadDevices();
  };

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <TopNav />
        <BottomNav />
        <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
          {!isMobile && <Sidebar />}
          <main style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "64px",
            paddingBottom: isMobile ? "88px" : "24px",
          }}>
            <div style={{ color: "rgba(255,255,255,0.5)" }}>Loading...</div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!authenticated) {
    return (
      <ProtectedRoute>
        <TopNav />
        <BottomNav />
        <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
          {!isMobile && <Sidebar />}
          <main style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "24px",
            paddingTop: "64px",
            paddingBottom: isMobile ? "88px" : "24px",
          }}>
            <ToolBackground color={toolCustom.color} />
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "#1DB954",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Music style={{ width: "40px", height: "40px", color: "white" }} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "white", margin: 0 }}>
              Connect Spotify
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: "300px" }}>
              Control your music, browse playlists, and see what's playing
            </p>
            <button
              onClick={handleLogin}
              style={{
                padding: "14px 32px",
                borderRadius: "50px",
                border: "none",
                background: "#1DB954",
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Music style={{ width: "20px", height: "20px" }} />
              Connect with Spotify
            </button>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TopNav />
      <BottomNav />
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main style={{
          flex: 1,
          paddingTop: isMobile ? "72px" : "76px",
          paddingBottom: isMobile ? "180px" : "140px",
          paddingLeft: isMobile ? "16px" : "32px",
          paddingRight: isMobile ? "16px" : "32px",
        }}>
          <ToolBackground color={toolCustom.color} />
          
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: "8px",
              marginBottom: "24px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}>
              {[
                { id: 'now-playing', label: 'Now Playing', icon: Music },
                { id: 'playlists', label: 'Playlists', icon: ListMusic },
                { id: 'search', label: 'Search', icon: Search },
                { id: 'recent', label: 'Recent', icon: Clock },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "20px",
                    border: "none",
                    background: activeTab === tab.id ? "rgba(29, 185, 84, 0.2)" : "rgba(255,255,255,0.05)",
                    color: activeTab === tab.id ? "#1DB954" : "rgba(255,255,255,0.7)",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <tab.icon style={{ width: "16px", height: "16px" }} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Now Playing Tab */}
            {activeTab === 'now-playing' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {playback?.item ? (
                  <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "24px",
                    alignItems: isMobile ? "center" : "flex-start",
                  }}>
                    {/* Album Art */}
                    <img
                      src={playback.item.album.images[0]?.url || '/placeholder.png'}
                      alt={playback.item.album.name}
                      style={{
                        width: isMobile ? "200px" : "280px",
                        height: isMobile ? "200px" : "280px",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                      }}
                    />
                    
                    {/* Track Info */}
                    <div style={{ flex: 1, textAlign: isMobile ? "center" : "left" }}>
                      <h2 style={{
                        fontSize: isMobile ? "20px" : "28px",
                        fontWeight: 700,
                        color: "white",
                        margin: "0 0 8px 0",
                      }}>
                        {playback.item.name}
                      </h2>
                      <p style={{
                        fontSize: "16px",
                        color: "rgba(255,255,255,0.7)",
                        margin: "0 0 4px 0",
                      }}>
                        {playback.item.artists.map(a => a.name).join(', ')}
                      </p>
                      <p style={{
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.5)",
                        margin: "0 0 24px 0",
                      }}>
                        {playback.item.album.name}
                      </p>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: "24px" }}>
                        <div style={{
                          height: "4px",
                          background: "rgba(255,255,255,0.2)",
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
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.5)",
                        }}>
                          <span>{formatTime(playback.progress_ms)}</span>
                          <span>{formatTime(playback.item.duration_ms)}</span>
                        </div>
                      </div>

                      {/* Device Info */}
                      {playback.device && (
                        <button
                          onClick={() => setShowDevices(!showDevices)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "20px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.05)",
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "12px",
                            cursor: "pointer",
                            margin: isMobile ? "0 auto" : "0",
                          }}
                        >
                          <Speaker style={{ width: "14px", height: "14px" }} />
                          {playback.device.name}
                          <ChevronRight style={{ width: "14px", height: "14px" }} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "rgba(255,255,255,0.5)",
                  }}>
                    <Music style={{ width: "48px", height: "48px", marginBottom: "16px", opacity: 0.3 }} />
                    <p>Nothing playing</p>
                    <p style={{ fontSize: "14px" }}>Start playing something on Spotify</p>
                  </div>
                )}

                {/* Devices Modal */}
                {showDevices && (
                  <div style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Available Devices</h3>
                      <button
                        onClick={loadDevices}
                        style={{
                          padding: "6px",
                          borderRadius: "6px",
                          border: "none",
                          background: "transparent",
                          color: "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                        }}
                      >
                        <RefreshCw style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                    {devices.map(device => (
                      <button
                        key={device.id}
                        onClick={() => transferPlayback(device.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "none",
                          background: device.is_active ? "rgba(29, 185, 84, 0.2)" : "transparent",
                          color: device.is_active ? "#1DB954" : "rgba(255,255,255,0.8)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {device.type === 'Smartphone' ? (
                          <Smartphone style={{ width: "20px", height: "20px" }} />
                        ) : (
                          <Speaker style={{ width: "20px", height: "20px" }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{device.name}</div>
                          <div style={{ fontSize: "12px", opacity: 0.6 }}>{device.type}</div>
                        </div>
                        {device.is_active && (
                          <span style={{ marginLeft: "auto", fontSize: "12px" }}>Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Playlists Tab */}
            {activeTab === 'playlists' && (
              <div>
                {selectedPlaylist ? (
                  <div>
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      style={{
                        padding: "8px 16px",
                        marginBottom: "16px",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "transparent",
                        color: "rgba(255,255,255,0.7)",
                        cursor: "pointer",
                      }}
                    >
                      ← Back to Playlists
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {playlistTracks.map((track, i) => (
                        <TrackRow
                          key={`${track.id}-${i}`}
                          track={track}
                          onPlay={() => playTrack(track.uri)}
                          onQueue={() => addToQueue(track.uri)}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "16px",
                  }}>
                    {playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => loadPlaylistTracks(playlist.id)}
                        style={{
                          padding: "12px",
                          borderRadius: "12px",
                          border: "none",
                          background: "rgba(255,255,255,0.05)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <img
                          src={playlist.images[0]?.url || '/placeholder.png'}
                          alt={playlist.name}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            borderRadius: "8px",
                            marginBottom: "12px",
                            objectFit: "cover",
                          }}
                        />
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "white",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {playlist.name}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.5)",
                        }}>
                          {playlist.tracks.total} tracks
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div>
                <div style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "24px",
                }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for songs..."
                    style={{
                      flex: 1,
                      padding: "14px 20px",
                      borderRadius: "50px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      color: "white",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSearch}
                    style={{
                      padding: "14px 24px",
                      borderRadius: "50px",
                      border: "none",
                      background: "#1DB954",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <Search style={{ width: "20px", height: "20px" }} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {searchResults.map((track, i) => (
                    <TrackRow
                      key={`${track.id}-${i}`}
                      track={track}
                      onPlay={() => playTrack(track.uri)}
                      onQueue={() => addToQueue(track.uri)}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tab */}
            {activeTab === 'recent' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {recentTracks.map((track, i) => (
                  <TrackRow
                    key={`${track.id}-${i}`}
                    track={track}
                    onPlay={() => playTrack(track.uri)}
                    onQueue={() => addToQueue(track.uri)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Fixed Player Controls */}
        {playback && (
          <div style={{
            position: "fixed",
            bottom: isMobile ? "72px" : "0",
            left: isMobile ? "0" : "240px",
            right: "0",
            padding: "16px 24px",
            background: "rgba(18, 18, 18, 0.95)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            zIndex: 100,
          }}>
            {/* Shuffle */}
            <button
              onClick={() => control('shuffle', { state: !playback.shuffle_state })}
              style={{
                padding: "8px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: playback.shuffle_state ? "#1DB954" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
              }}
            >
              <Shuffle style={{ width: "20px", height: "20px" }} />
            </button>

            {/* Previous */}
            <button
              onClick={() => control('previous')}
              style={{
                padding: "8px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.9)",
                cursor: "pointer",
              }}
            >
              <SkipBack style={{ width: "24px", height: "24px" }} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => control(playback.is_playing ? 'pause' : 'play')}
              style={{
                padding: "14px",
                borderRadius: "50%",
                border: "none",
                background: "white",
                color: "black",
                cursor: "pointer",
              }}
            >
              {playback.is_playing ? (
                <Pause style={{ width: "28px", height: "28px" }} />
              ) : (
                <Play style={{ width: "28px", height: "28px", marginLeft: "3px" }} />
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => control('next')}
              style={{
                padding: "8px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.9)",
                cursor: "pointer",
              }}
            >
              <SkipForward style={{ width: "24px", height: "24px" }} />
            </button>

            {/* Repeat */}
            <button
              onClick={() => {
                const states = ['off', 'context', 'track'];
                const next = states[(states.indexOf(playback.repeat_state) + 1) % 3];
                control('repeat', { state: next });
              }}
              style={{
                padding: "8px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: playback.repeat_state !== 'off' ? "#1DB954" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
              }}
            >
              {playback.repeat_state === 'track' ? (
                <Repeat1 style={{ width: "20px", height: "20px" }} />
              ) : (
                <Repeat style={{ width: "20px", height: "20px" }} />
              )}
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function TrackRow({ 
  track, 
  onPlay, 
  onQueue,
  formatTime 
}: { 
  track: Track; 
  onPlay: () => void; 
  onQueue: () => void;
  formatTime: (ms: number) => string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 12px",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onClick={onPlay}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <img
        src={track.album.images[track.album.images.length - 1]?.url || '/placeholder.png'}
        alt={track.album.name}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "4px",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "white",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {track.name}
        </div>
        <div style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.5)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {track.artists.map(a => a.name).join(', ')}
        </div>
      </div>
      <div style={{
        fontSize: "12px",
        color: "rgba(255,255,255,0.4)",
      }}>
        {formatTime(track.duration_ms)}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onQueue(); }}
        style={{
          padding: "6px",
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
        }}
        title="Add to queue"
      >
        <Plus style={{ width: "16px", height: "16px" }} />
      </button>
    </div>
  );
}
