"use client";

import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, ChevronDown } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
  source: string;
}

interface Feed {
  id: string;
  name: string;
  category: string;
}

// Main feeds to display as toggle buttons
const MAIN_FEEDS = ['zerohedge', 'mises', 'reason'];

export default function ReadPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState('zerohedge');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    if (selectedFeed) {
      loadFeedItems(selectedFeed);
    }
  }, [selectedFeed]);

  const loadFeeds = async () => {
    try {
      const res = await fetch('/api/rss');
      const data = await res.json();
      setFeeds(data.feeds || []);
    } catch (err) {
      console.error("Failed to load feeds:", err);
    }
  };

  const loadFeedItems = async (feedId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rss?source=${feedId}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load feed items:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentFeed = feeds.find(f => f.id === selectedFeed);
  const mainFeeds = feeds.filter(f => MAIN_FEEDS.includes(f.id));
  const otherFeeds = feeds.filter(f => !MAIN_FEEDS.includes(f.id));

  return (
    <>
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
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpen style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Read {items.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({items.length})</span>}
            </h1>
          </div>

          <button
            onClick={() => loadFeedItems(selectedFeed)}
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
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Feed Source Toggles */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Main Feeds */}
          {mainFeeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => setSelectedFeed(feed.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: selectedFeed === feed.id ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                color: selectedFeed === feed.id ? "#00aaff" : "var(--foreground-muted)",
                border: selectedFeed === feed.id ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: selectedFeed === feed.id ? 600 : 500,
                transition: "all 0.15s",
              }}
            >
              {feed.name}
            </button>
          ))}

          {/* Dropdown for Other Feeds */}
          {otherFeeds.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: !MAIN_FEEDS.includes(selectedFeed) ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  color: !MAIN_FEEDS.includes(selectedFeed) ? "#00aaff" : "var(--foreground-muted)",
                  border: !MAIN_FEEDS.includes(selectedFeed) ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: !MAIN_FEEDS.includes(selectedFeed) ? 600 : 500,
                  transition: "all 0.15s",
                }}
              >
                {!MAIN_FEEDS.includes(selectedFeed) ? currentFeed?.name : 'More Feeds'}
                <ChevronDown style={{ width: "14px", height: "14px", transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>

              {showDropdown && (
                <>
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 99,
                    }}
                    onClick={() => setShowDropdown(false)}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      minWidth: "200px",
                      borderRadius: "12px",
                      padding: "8px",
                      zIndex: 100,
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                      background: "rgba(10, 10, 10, 0.95)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {otherFeeds.map((feed) => (
                      <button
                        key={feed.id}
                        onClick={() => {
                          setSelectedFeed(feed.id);
                          setShowDropdown(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          padding: "10px 14px",
                          borderRadius: "6px",
                          border: "none",
                          background: selectedFeed === feed.id ? "rgba(0, 170, 255, 0.15)" : "transparent",
                          color: selectedFeed === feed.id ? "#00aaff" : "var(--foreground)",
                          fontSize: "14px",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedFeed !== feed.id) {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedFeed !== feed.id) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <span>{feed.name}</span>
                        <span style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>
                          {feed.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", animation: "spin 1s linear infinite" }} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <BookOpen style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No articles found
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                Try selecting a different feed
              </p>
            </div>
          ) : (
            <div>
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    gap: "16px",
                    padding: "16px 20px",
                    borderBottom: index < items.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item.image && (
                    <div style={{
                      width: "120px",
                      height: "80px",
                      flexShrink: 0,
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px", lineHeight: 1.4 }}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {item.description}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{new Date(item.pubDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
