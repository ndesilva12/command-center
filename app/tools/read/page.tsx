"use client";

import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, Settings, ExternalLink, Calendar, User } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
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
  const [entries, setEntries] = useState<MinifeedEntry[]>([]);
  const [allFeeds, setAllFeeds] = useState<MinifeedFeed[]>([]);
  const [topFeeds, setTopFeeds] = useState<number[]>(DEFAULT_TOP_FEEDS);
  const [loading, setLoading] = useState(true);
  const [selectedFeedId, setSelectedFeedId] = useState<number>(DEFAULT_TOP_FEEDS[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  const topFeedObjs = topFeeds.map(id => allFeeds.find(f => f.id === id)).filter(Boolean) as MinifeedFeed[];
  const otherFeeds = allFeeds.filter(f => !topFeeds.includes(f.id));
  const currentFeed = allFeeds.find(f => f.id === selectedFeedId);

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
    </ProtectedRoute>
  );
}
