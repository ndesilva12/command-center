"use client";

import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, Settings, ExternalLink, Calendar, User, X, Search } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface MinifeedEntry {
  id: number;
  title: string;
  url: string;
  content: string;
  author: string;
  published_at: string;
  feed_id: number;
}

interface MinifeedFeed {
  id: number;
  title: string;
  site_url: string;
  feed_url: string;
  category: string;
}

// Default top feeds (ZeroHedge always #1)
const DEFAULT_TOP_FEEDS = [
  5,    // Zero Hedge
  17,   // Breitbart
  70,   // Builders
  39,   // Adam Smith Institute
  36,   // Cato @ Liberty
  13,   // BBC News
];

export default function ReadPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('read', 'Read', '#6366f1');
  const [entries, setEntries] = useState<MinifeedEntry[]>([]);
  const [allFeeds, setAllFeeds] = useState<MinifeedFeed[]>([]);
  const [topFeeds, setTopFeeds] = useState<number[]>(DEFAULT_TOP_FEEDS);
  const [loading, setLoading] = useState(true);
  const [selectedFeedId, setSelectedFeedId] = useState<number>(DEFAULT_TOP_FEEDS[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSearch, setSettingsSearch] = useState("");
  const [tempTopFeeds, setTempTopFeeds] = useState<number[]>(DEFAULT_TOP_FEEDS);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Load saved top feeds from localStorage
    const saved = localStorage.getItem('read_top_feeds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTopFeeds(parsed);
          setTempTopFeeds(parsed);
          setSelectedFeedId(parsed[0]);
        }
      } catch (e) {
        console.error('Failed to parse saved top feeds:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    if (selectedFeedId) {
      loadEntries(selectedFeedId);
    }
  }, [selectedFeedId]);

  const loadFeeds = async () => {
    try {
      const res = await fetch('/api/miniflux?action=feeds');
      const data = await res.json();
      setAllFeeds(data.feeds || []);
    } catch (err) {
      console.error("Failed to load feeds:", err);
    }
  };

  const loadEntries = async (feedId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/miniflux?action=entries&feedId=${feedId}&limit=50`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 200);
  };

  const handleSaveSettings = () => {
    setTopFeeds(tempTopFeeds);
    localStorage.setItem('read_top_feeds', JSON.stringify(tempTopFeeds));
    setShowSettings(false);
    // If current feed is not in top feeds anymore and not selected, switch to first top feed
    if (!tempTopFeeds.includes(selectedFeedId)) {
      const firstTopFeed = tempTopFeeds[0];
      if (firstTopFeed) {
        setSelectedFeedId(firstTopFeed);
      }
    }
  };

  const toggleTopFeed = (feedId: number) => {
    if (tempTopFeeds.includes(feedId)) {
      // Remove from top feeds
      setTempTopFeeds(tempTopFeeds.filter(id => id !== feedId));
    } else {
      // Add to top feeds (max 6)
      if (tempTopFeeds.length < 6) {
        setTempTopFeeds([...tempTopFeeds, feedId]);
      }
    }
  };

  const moveFeedUp = (feedId: number) => {
    const index = tempTopFeeds.indexOf(feedId);
    if (index > 0) {
      const newFeeds = [...tempTopFeeds];
      [newFeeds[index - 1], newFeeds[index]] = [newFeeds[index], newFeeds[index - 1]];
      setTempTopFeeds(newFeeds);
    }
  };

  const moveFeedDown = (feedId: number) => {
    const index = tempTopFeeds.indexOf(feedId);
    if (index < tempTopFeeds.length - 1) {
      const newFeeds = [...tempTopFeeds];
      [newFeeds[index], newFeeds[index + 1]] = [newFeeds[index + 1], newFeeds[index]];
      setTempTopFeeds(newFeeds);
    }
  };

  const topFeedObjs = topFeeds.map(id => allFeeds.find(f => f.id === id)).filter(Boolean) as MinifeedFeed[];
  const otherFeeds = allFeeds.filter(f => !topFeeds.includes(f.id));
  const currentFeed = allFeeds.find(f => f.id === selectedFeedId);
  
  const filteredFeeds = allFeeds.filter(feed => 
    feed.title.toLowerCase().includes(settingsSearch.toLowerCase()) ||
    feed.category.toLowerCase().includes(settingsSearch.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="read" />

      <main style={{
        paddingTop: isMobile ? "80px" : "136px",
        paddingBottom: isMobile ? "80px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpen style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Read {entries.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({entries.length})</span>}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => {
                setTempTopFeeds(topFeeds);
                setSettingsSearch("");
                setShowSettings(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              <Settings style={{ width: "14px", height: "14px" }} />
              Settings
            </button>
            <button
              onClick={() => loadEntries(selectedFeedId)}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Current Feed Info */}
        {currentFeed && (
          <div style={{
            padding: "16px 20px",
            background: "rgba(0, 170, 255, 0.1)",
            borderRadius: "12px",
            border: "1px solid rgba(0, 170, 255, 0.2)",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#00aaff", marginBottom: "4px" }}>
                {currentFeed.title}
              </div>
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                {currentFeed.category}
              </div>
            </div>
            {currentFeed.site_url && (
              <a
                href={currentFeed.site_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 170, 255, 0.15)",
                  color: "#00aaff",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <ExternalLink style={{ width: "14px", height: "14px" }} />
                Visit Site
              </a>
            )}
          </div>
        )}

        {/* Feed Selector */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "12px", fontWeight: 600 }}>
            TOP FEEDS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {topFeedObjs.map(feed => (
              <button
                key={feed.id}
                onClick={() => setSelectedFeedId(feed.id)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: selectedFeedId === feed.id 
                    ? '2px solid #00aaff' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  background: selectedFeedId === feed.id 
                    ? 'rgba(0, 170, 255, 0.15)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: selectedFeedId === feed.id ? '#00aaff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: selectedFeedId === feed.id ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {feed.title}
              </button>
            ))}
          </div>

          {otherFeeds.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px", fontWeight: 600 }}>
                ALL OTHER FEEDS ({otherFeeds.length})
              </div>
              <select
                value={selectedFeedId}
                onChange={(e) => setSelectedFeedId(Number(e.target.value))}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">Select a feed...</option>
                {otherFeeds.map(feed => (
                  <option key={feed.id} value={feed.id}>
                    {feed.title} ({feed.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Entries List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            Loading articles...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            No articles found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {entries.map(entry => (
              <a
                key={entry.id}
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    marginBottom: "8px",
                    lineHeight: 1.4,
                  }}>
                    {entry.title}
                  </div>
                  {entry.content && (
                    <div style={{
                      fontSize: "14px",
                      color: "var(--foreground-muted)",
                      lineHeight: 1.6,
                    }}>
                      {stripHtml(entry.content)}...
                    </div>
                  )}
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "12px",
                  color: "#64748b",
                }}>
                  {entry.published_at && (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={12} />
                        {formatDate(entry.published_at)}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  {entry.author && (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <User size={12} />
                        {entry.author}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <ExternalLink size={12} />
                    Read More
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              background: "rgba(30, 41, 59, 0.98)",
              borderRadius: "16px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              backdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "white", margin: 0, marginBottom: "4px" }}>{toolCustom.name}</h2>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                  Select up to 6 feeds for quick access buttons
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }} />
                <input
                  type="text"
                  placeholder="Search feeds..."
                  value={settingsSearch}
                  onChange={(e) => setSettingsSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 44px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Top Feeds (Selected) */}
            {tempTopFeeds.length > 0 && (
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "12px" }}>
                  QUICK ACCESS BUTTONS ({tempTopFeeds.length}/6)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tempTopFeeds.map((feedId, index) => {
                    const feed = allFeeds.find(f => f.id === feedId);
                    if (!feed) return null;
                    return (
                      <div
                        key={feedId}
                        style={{
                          padding: "12px 16px",
                          background: "rgba(0, 170, 255, 0.1)",
                          border: "1px solid rgba(0, 170, 255, 0.3)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#00aaff", minWidth: "20px" }}>
                          #{index + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>
                            {feed.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {feed.category}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => moveFeedUp(feedId)}
                            disabled={index === 0}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: index === 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                              border: "none",
                              color: index === 0 ? "#64748b" : "white",
                              cursor: index === 0 ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveFeedDown(feedId)}
                            disabled={index === tempTopFeeds.length - 1}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: index === tempTopFeeds.length - 1 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                              border: "none",
                              color: index === tempTopFeeds.length - 1 ? "#64748b" : "white",
                              cursor: index === tempTopFeeds.length - 1 ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => toggleTopFeed(feedId)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Feeds (Scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "12px" }}>
                ALL FEEDS ({filteredFeeds.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {filteredFeeds.map(feed => {
                  const isSelected = tempTopFeeds.includes(feed.id);
                  const canAdd = tempTopFeeds.length < 6;
                  return (
                    <button
                      key={feed.id}
                      onClick={() => toggleTopFeed(feed.id)}
                      disabled={!isSelected && !canAdd}
                      style={{
                        padding: "12px 16px",
                        background: isSelected ? "rgba(0, 170, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
                        border: isSelected ? "1px solid rgba(0, 170, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        textAlign: "left",
                        cursor: (!isSelected && !canAdd) ? "not-allowed" : "pointer",
                        opacity: (!isSelected && !canAdd) ? 0.5 : 1,
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: isSelected ? "#00aaff" : "white", marginBottom: "2px" }}>
                        {isSelected && "✓ "}{feed.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {feed.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #00aaff, #0088cc)",
                  border: "none",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
