"use client";

import { useState, useEffect } from "react";
import { Bookmark, Plus, RefreshCw, ExternalLink, Search, Folder, Tag, Clock, Grid3x3, List } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface RaindropItem {
  _id: number;
  link: string;
  title: string;
  excerpt: string;
  domain: string;
  tags: string[];
  collection: {
    $id: number;
  };
  created: string;
  cover: string;
}

interface Collection {
  _id: number;
  title: string;
  count: number;
}

export default function BookmarksPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [bookmarks, setBookmarks] = useState<RaindropItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("0");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    if (authenticated) {
      fetchCollections();
      fetchBookmarks();
    }
  }, [authenticated, selectedCollection, searchQuery]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/raindrop/status');
      setAuthenticated(res.ok);
      setLoading(false);
    } catch {
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/raindrop');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to initiate auth:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/raindrop/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        collection: selectedCollection,
        perpage: '50',
      });

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/raindrop?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
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
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  };

  if (!authenticated && !loading) {
    return (
      <ProtectedRoute>
        <TopNav />
        <BottomNav />
        <ToolNav currentToolId="bookmarks" />

        <main style={{
          paddingTop: isMobile ? "80px" : "136px",
          paddingBottom: isMobile ? "80px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            textAlign: "center",
            padding: "48px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}>
            <Bookmark style={{ width: "64px", height: "64px", color: "#00aaff", margin: "0 auto 24px" }} />
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "12px" }}>
              Connect Raindrop.io
            </h2>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
              Link your Raindrop.io account to access your bookmarks from Command Center
            </p>
            <button
              onClick={handleConnect}
              style={{
                padding: "12px 32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #00aaff, #0088cc)",
                border: "none",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Connect Raindrop.io
            </button>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="bookmarks" />

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
            <Bookmark style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Bookmarks
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://app.raindrop.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                textDecoration: "none",
                fontSize: "13px",
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open Raindrop
            </a>
            
            <button
              onClick={fetchBookmarks}
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

        {/* Search + Collection Filter */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px", position: "relative" }}>
            <Search size={18} style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }} />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <div style={{ position: "relative" }}>
            <Folder size={18} style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
              pointerEvents: "none",
            }} />
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              style={{
                padding: "10px 40px 10px 44px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="0">All Bookmarks</option>
              {collections.map(col => (
                <option key={col._id} value={col._id}>
                  {col.title} ({col.count})
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div style={{ display: "flex", gap: "4px", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "2px", background: "rgba(255, 255, 255, 0.03)" }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === 'grid' ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === 'grid' ? "#00aaff" : "var(--foreground-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <Grid3x3 size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === 'list' ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === 'list' ? "#00aaff" : "var(--foreground-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <List size={16} />
              List
            </button>
          </div>
        </div>

        {/* Bookmarks Display */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            Loading bookmarks...
          </div>
        ) : bookmarks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            {searchQuery ? "No bookmarks found" : "No bookmarks yet"}
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "16px",
          }}>
            {bookmarks.map(bookmark => (
              <a
                key={bookmark._id}
                href={bookmark.link}
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
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    marginBottom: "6px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {bookmark.title}
                  </div>
                  {bookmark.excerpt && (
                    <div style={{
                      fontSize: "13px",
                      color: "var(--foreground-muted)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {bookmark.excerpt}
                    </div>
                  )}
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: bookmark.tags.length > 0 ? "8px" : 0,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <ExternalLink size={12} />
                    {bookmark.domain}
                  </span>
                  <span>•</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    {formatDate(bookmark.created)}
                  </span>
                </div>

                {bookmark.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {bookmark.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: "rgba(0, 170, 255, 0.1)",
                          color: "#00aaff",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          /* List View */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {bookmarks.map(bookmark => (
              <a
                key={bookmark._id}
                href={bookmark.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  padding: "16px 20px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  alignItems: "center",
                  gap: "16px",
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {bookmark.title}
                  </div>
                  
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "12px",
                    color: "#64748b",
                    flexWrap: "wrap",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <ExternalLink size={12} />
                      {bookmark.domain}
                    </span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      {formatDate(bookmark.created)}
                    </span>
                    {bookmark.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {bookmark.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: "rgba(0, 170, 255, 0.1)",
                                color: "#00aaff",
                                fontSize: "11px",
                                fontWeight: 500,
                              }}
                            >
                              <Tag size={9} />
                              {tag}
                            </span>
                          ))}
                          {bookmark.tags.length > 3 && (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              +{bookmark.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
