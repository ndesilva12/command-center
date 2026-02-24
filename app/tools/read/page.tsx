"use client";

import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, Settings, ExternalLink, Calendar, User, X, Search, Plus, Trash2 } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ToolBackground } from "@/components/tools/ToolBackground";

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

const DEFAULT_TOP_FEEDS = [
  5,    // Zero Hedge
  17,   // Breitbart
  70,   // Builders
  39,   // Adam Smith Institute
  36,   // Cato @ Liberty
  13,   // BBC News
];

type SourceType = "all" | "youtube" | "twitter" | "reddit" | "substack" | "podcast";

const SOURCE_TYPE_FILTERS: { type: SourceType; label: string; patterns: string[] }[] = [
  { type: "all", label: "All", patterns: [] },
  { type: "youtube", label: "YouTube", patterns: ["youtube.com", "youtu.be"] },
  { type: "twitter", label: "X/Twitter", patterns: ["twitter.com", "x.com", "nitter"] },
  { type: "reddit", label: "Reddit", patterns: ["reddit.com"] },
  { type: "substack", label: "Substack", patterns: ["substack.com"] },
  { type: "podcast", label: "Podcasts", patterns: ["podcast", "anchor.fm", "transistor.fm", "spotify.com/show"] },
];

const getSourceType = (feed: MinifeedFeed): SourceType => {
  const url = (feed.site_url + " " + feed.feed_url + " " + feed.title).toLowerCase();
  for (const filter of SOURCE_TYPE_FILTERS) {
    if (filter.type === "all") continue;
    if (filter.patterns.some(p => url.includes(p))) {
      return filter.type;
    }
  }
  return "all";
};

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
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType>("all");
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [addingFeed, setAddingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [deletingFeedId, setDeletingFeedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
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
    if (!tempTopFeeds.includes(selectedFeedId)) {
      const firstTopFeed = tempTopFeeds[0];
      if (firstTopFeed) {
        setSelectedFeedId(firstTopFeed);
      }
    }
  };

  const toggleTopFeed = (feedId: number) => {
    if (tempTopFeeds.includes(feedId)) {
      setTempTopFeeds(tempTopFeeds.filter(id => id !== feedId));
    } else {
      setTempTopFeeds([...tempTopFeeds, feedId]);
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

  const handleAddFeed = async () => {
    if (!newFeedUrl.trim()) return;
    
    setAddingFeed(true);
    setFeedError(null);
    
    try {
      const res = await fetch('/api/miniflux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed_url: newFeedUrl.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setFeedError(data.error || 'Failed to add feed');
        return;
      }
      
      // Refresh feeds list
      await loadFeeds();
      setNewFeedUrl("");
      setShowAddFeed(false);
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : 'Failed to add feed');
    } finally {
      setAddingFeed(false);
    }
  };

  const handleDeleteFeed = async (feedId: number) => {
    setDeletingFeedId(feedId);
    
    try {
      const res = await fetch(`/api/miniflux?feedId=${feedId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete feed');
        return;
      }
      
      // Remove from top feeds if present
      if (topFeeds.includes(feedId)) {
        const newTopFeeds = topFeeds.filter(id => id !== feedId);
        setTopFeeds(newTopFeeds);
        setTempTopFeeds(newTopFeeds);
        localStorage.setItem('read_top_feeds', JSON.stringify(newTopFeeds));
      }
      
      // Refresh feeds list
      await loadFeeds();
      
      // If we deleted the selected feed, select another
      if (selectedFeedId === feedId) {
        const remaining = allFeeds.filter(f => f.id !== feedId);
        if (remaining.length > 0) {
          setSelectedFeedId(remaining[0].id);
        }
      }
      
      setConfirmDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete feed');
    } finally {
      setDeletingFeedId(null);
    }
  };

  const topFeedObjs = topFeeds.map(id => allFeeds.find(f => f.id === id)).filter(Boolean) as MinifeedFeed[];
  const otherFeeds = allFeeds.filter(f => !topFeeds.includes(f.id));
  const currentFeed = allFeeds.find(f => f.id === selectedFeedId);
  
  const filteredFeeds = allFeeds.filter(feed => 
    feed.title.toLowerCase().includes(settingsSearch.toLowerCase()) ||
    feed.category.toLowerCase().includes(settingsSearch.toLowerCase())
  );

  const filteredOtherFeeds = otherFeeds.filter(feed => {
    // Source type filter
    if (sourceTypeFilter !== "all" && getSourceType(feed) !== sourceTypeFilter) {
      return false;
    }
    // Text search filter
    if (sourceSearch !== "" && 
        !feed.title.toLowerCase().includes(sourceSearch.toLowerCase()) &&
        !feed.category.toLowerCase().includes(sourceSearch.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  // Count feeds per source type (for filter badges)
  const sourceTypeCounts = SOURCE_TYPE_FILTERS.reduce((acc, filter) => {
    if (filter.type === "all") {
      acc[filter.type] = otherFeeds.length;
    } else {
      acc[filter.type] = otherFeeds.filter(f => getSourceType(f) === filter.type).length;
    }
    return acc;
  }, {} as Record<SourceType, number>);

  // Group other feeds by category
  const categorizedOtherFeeds = filteredOtherFeeds.reduce((acc, feed) => {
    const cat = feed.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(feed);
    return acc;
  }, {} as Record<string, MinifeedFeed[]>);

  return (
    <ProtectedRoute>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />

      <main style={{
        paddingTop: isMobile ? "64px" : "68px",
        paddingBottom: isMobile ? "80px" : "16px",
        paddingLeft: isMobile ? "8px" : "calc(var(--sidebar-width, 240px) + 8px)",
        paddingRight: isMobile ? "8px" : "8px",
        minHeight: "100vh",
      }}>
        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
          height: isMobile ? "auto" : "calc(100vh - 84px)",
        }}>
          {/* Left Panel: Sources */}
          <div style={{ 
            width: isMobile ? "100%" : "280px",
            minWidth: isMobile ? "100%" : "280px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            height: isMobile ? "auto" : "100%",
            overflow: isMobile ? "visible" : "auto",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen style={{ width: "20px", height: "20px", color: toolCustom.color }} />
                <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Read</h1>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => {
                    setTempTopFeeds(topFeeds);
                    setSettingsSearch("");
                    setShowSettings(true);
                  }}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Settings style={{ width: "14px", height: "14px" }} />
                </button>
                <button
                  onClick={() => loadEntries(selectedFeedId)}
                  disabled={loading}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <RefreshCw style={{ width: "14px", height: "14px" }} />
                </button>
              </div>
            </div>

            {/* All Sources - Single Scrollable Section */}
            <div className="glass card" style={{ padding: "12px", flex: 1, overflow: "auto", minHeight: isMobile ? "300px" : "0" }}>
              {/* Quick Access */}
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Quick Access
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
                {topFeedObjs.map(feed => (
                  <button
                    key={feed.id}
                    onClick={() => setSelectedFeedId(feed.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: selectedFeedId === feed.id 
                        ? `2px solid ${toolCustom.color}` 
                        : '1px solid transparent',
                      background: selectedFeedId === feed.id 
                        ? `${toolCustom.color}15` 
                        : 'rgba(255, 255, 255, 0.03)',
                      color: selectedFeedId === feed.id ? toolCustom.color : 'var(--foreground)',
                      fontSize: '13px',
                      fontWeight: selectedFeedId === feed.id ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {feed.title}
                  </button>
                ))}
              </div>

              {/* Separator */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                marginBottom: "10px",
              }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Other ({filteredOtherFeeds.length})
                </span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Source Type Filters */}
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "6px", 
                marginBottom: "10px",
              }}>
                {SOURCE_TYPE_FILTERS.filter(f => f.type === "all" || sourceTypeCounts[f.type] > 0).map(filter => (
                  <button
                    key={filter.type}
                    onClick={() => setSourceTypeFilter(filter.type)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "12px",
                      border: sourceTypeFilter === filter.type 
                        ? `1px solid ${toolCustom.color}` 
                        : "1px solid rgba(255,255,255,0.1)",
                      background: sourceTypeFilter === filter.type 
                        ? `${toolCustom.color}20` 
                        : "rgba(255,255,255,0.03)",
                      color: sourceTypeFilter === filter.type 
                        ? toolCustom.color 
                        : "var(--foreground-muted)",
                      fontSize: "11px",
                      fontWeight: sourceTypeFilter === filter.type ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {filter.label}
                    {filter.type !== "all" && (
                      <span style={{ 
                        marginLeft: "4px", 
                        opacity: 0.7,
                        fontSize: "10px",
                      }}>
                        {sourceTypeCounts[filter.type]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <Search size={12} style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--foreground-muted)",
                }} />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px 8px 28px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Categorized feeds */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(categorizedOtherFeeds).sort(([a], [b]) => a.localeCompare(b)).map(([category, feeds]) => (
                  <div key={category}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "6px", textTransform: "uppercase" }}>
                      {category}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {feeds.map(feed => (
                        <button
                          key={feed.id}
                          onClick={() => setSelectedFeedId(feed.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: selectedFeedId === feed.id 
                              ? `1px solid ${toolCustom.color}40` 
                              : '1px solid transparent',
                            background: selectedFeedId === feed.id 
                              ? `${toolCustom.color}10` 
                              : 'transparent',
                            color: selectedFeedId === feed.id ? toolCustom.color : 'var(--foreground-muted)',
                            fontSize: '12px',
                            fontWeight: selectedFeedId === feed.id ? 600 : 400,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                        >
                          {feed.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Content */}
          <div style={{ 
            flex: 1,
            minWidth: 0,
            height: isMobile ? "auto" : "100%",
            overflow: isMobile ? "visible" : "auto",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Current Feed Header */}
            {currentFeed && (
              <div style={{
                padding: "12px 16px",
                background: `${toolCustom.color}10`,
                borderRadius: "10px",
                border: `1px solid ${toolCustom.color}20`,
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: toolCustom.color, marginBottom: "2px" }}>
                    {currentFeed.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                    {currentFeed.category} • {entries.length} articles
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
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: `${toolCustom.color}15`,
                      color: toolCustom.color,
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    <ExternalLink style={{ width: "12px", height: "12px" }} />
                    Visit
                  </a>
                )}
              </div>
            )}

            {/* Entries */}
            <div className="glass card" style={{ flex: 1, padding: "12px", overflow: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--foreground-muted)" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid rgba(148, 163, 184, 0.2)",
                    borderTop: `3px solid ${toolCustom.color}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: "12px"
                  }} />
                  Loading articles...
                </div>
              ) : entries.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--foreground-muted)" }}>
                  No articles found
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {entries.map(entry => (
                    <a
                      key={entry.id}
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        padding: "14px 16px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        textDecoration: "none",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${toolCustom.color}40`;
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                      }}
                    >
                      <div style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "6px",
                        lineHeight: 1.4,
                      }}>
                        {entry.title}
                      </div>
                      {entry.content && (
                        <div style={{
                          fontSize: "13px",
                          color: "var(--foreground-muted)",
                          lineHeight: 1.5,
                          marginBottom: "8px",
                        }}>
                          {stripHtml(entry.content)}...
                        </div>
                      )}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "11px",
                        color: "#64748b",
                      }}>
                        {entry.published_at && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={11} />
                            {formatDate(entry.published_at)}
                          </span>
                        )}
                        {entry.author && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <User size={11} />
                            {entry.author}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
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
              maxWidth: "700px",
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              backdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "white", margin: 0 }}>Manage Feeds</h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, marginTop: "4px" }}>
                  Add, remove, or select Quick Access feeds
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  width: "36px",
                  height: "36px",
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
                <X size={18} />
              </button>
            </div>

            {/* Add New Feed */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              {showAddFeed ? (
                <div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: feedError ? "8px" : "0" }}>
                    <input
                      type="text"
                      placeholder="Paste RSS feed URL..."
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFeed()}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: feedError ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleAddFeed}
                      disabled={addingFeed || !newFeedUrl.trim()}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        background: addingFeed ? "rgba(255,255,255,0.1)" : toolCustom.color,
                        border: "none",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: addingFeed ? "not-allowed" : "pointer",
                        opacity: !newFeedUrl.trim() ? 0.5 : 1,
                      }}
                    >
                      {addingFeed ? "Adding..." : "Add"}
                    </button>
                    <button
                      onClick={() => { setShowAddFeed(false); setNewFeedUrl(""); setFeedError(null); }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {feedError && (
                    <div style={{ color: "#ef4444", fontSize: "12px" }}>{feedError}</div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAddFeed(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: `${toolCustom.color}15`,
                    border: `1px solid ${toolCustom.color}30`,
                    color: toolCustom.color,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={16} />
                  Add New Feed
                </button>
              )}
            </div>

            {/* Search */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{
                  position: "absolute",
                  left: "12px",
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
                    padding: "10px 12px 10px 40px",
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

            {/* Current Quick Access */}
            {tempTopFeeds.length > 0 && (
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", maxHeight: "200px", overflowY: "auto" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "10px", textTransform: "uppercase" }}>
                  Quick Access ({tempTopFeeds.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {tempTopFeeds.map((feedId, index) => {
                    const feed = allFeeds.find(f => f.id === feedId);
                    if (!feed) return null;
                    return (
                      <div
                        key={feedId}
                        style={{
                          padding: "6px 10px",
                          background: `${toolCustom.color}15`,
                          border: `1px solid ${toolCustom.color}30`,
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: toolCustom.color, fontWeight: 600 }}>#{index + 1}</span>
                        <span style={{ color: "white" }}>{feed.title}</span>
                        <button
                          onClick={() => toggleTopFeed(feedId)}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Feeds */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "10px", textTransform: "uppercase" }}>
                All Feeds ({filteredFeeds.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px" }}>
                {filteredFeeds.map(feed => {
                  const isSelected = tempTopFeeds.includes(feed.id);
                  const isDeleting = deletingFeedId === feed.id;
                  return (
                    <div
                      key={feed.id}
                      style={{
                        padding: "10px 12px",
                        background: isSelected ? `${toolCustom.color}10` : "rgba(255, 255, 255, 0.03)",
                        border: isSelected ? `1px solid ${toolCustom.color}30` : "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => toggleTopFeed(feed.id)}
                        style={{
                          flex: 1,
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 600, color: isSelected ? toolCustom.color : "white", marginBottom: "2px" }}>
                          {isSelected && "✓ "}{feed.title}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          {feed.category}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ id: feed.id, title: feed.title });
                        }}
                        disabled={isDeleting}
                        style={{
                          padding: "4px",
                          borderRadius: "4px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "none",
                          color: "#ef4444",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          opacity: isDeleting ? 0.5 : 0.7,
                          flexShrink: 0,
                        }}
                        title="Delete feed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "14px 20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${toolCustom.color}, ${toolCustom.color}cc)`,
                  border: "none",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: "20px",
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: "rgba(30, 41, 59, 0.98)",
              borderRadius: "12px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              maxWidth: "400px",
              width: "100%",
              padding: "24px",
              backdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "12px" }}>
              Delete Feed?
            </div>
            <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "20px" }}>
              Are you sure you want to delete <strong style={{ color: "white" }}>{confirmDelete.title}</strong>? This will unsubscribe from this feed.
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFeed(confirmDelete.id)}
                disabled={deletingFeedId === confirmDelete.id}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: deletingFeedId === confirmDelete.id ? "rgba(239, 68, 68, 0.3)" : "#ef4444",
                  border: "none",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: deletingFeedId === confirmDelete.id ? "not-allowed" : "pointer",
                }}
              >
                {deletingFeedId === confirmDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ProtectedRoute>
  );
}
