"use client";

import { useState, FormEvent, useEffect, forwardRef, useImperativeHandle } from "react";
import { Search, Clock, X } from "lucide-react";
import { UnifiedSourceId, getSearchUrl, getSourceConfig, UNIFIED_SOURCES } from "@/lib/unified-sources";

const RECENT_SEARCHES_KEY = "cc-recent-searches";
const MAX_RECENT = 5;

export interface SearchBarRef {
  setQuery: (q: string) => void;
  setSource: (s: UnifiedSourceId) => void;
}

interface SearchBarProps {
  onAISearch?: (query: string, model: string) => void;
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(function SearchBar(props, ref) {
  const { onAISearch } = props;
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<UnifiedSourceId>("google");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    setQuery: (q: string) => setQuery(q),
    setSource: (s: UnifiedSourceId) => setSelectedSource(s),
  }));

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);

  // Save to recent searches
  const saveToRecent = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Clear recent searches
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Handle search submission
  const handleSearch = (e?: FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const sourceConfig = getSourceConfig(selectedSource);
    if (!sourceConfig) return;

    saveToRecent(query);

    // Check if this is an AI source we can handle in-house
    if (sourceConfig.type === "ai" && selectedSource !== "claude" && onAISearch) {
      // Use in-house AI search for chatgpt, grok, gemini
      onAISearch(query.trim(), selectedSource);
    } else {
      // Open search URL in new tab (for web sources and Claude)
      const searchUrl = getSearchUrl(selectedSource, query.trim());
      if (searchUrl) {
        window.open(searchUrl, "_blank");
      }
    }

    setQuery("");
    setShowRecent(false);
  };

  // Handle recent search click
  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    setShowRecent(false);
  };

  // Group sources by type
  const webSources = UNIFIED_SOURCES.filter(s => s.type === "web");
  const aiSources = UNIFIED_SOURCES.filter(s => s.type === "ai");

  return (
    <div style={{ width: "100%", maxWidth: isMobile ? "none" : "800px", margin: "0 auto", padding: isMobile ? "0 8px" : "0" }}>
      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ position: "relative", width: "100%" }}>
        {/* Search Input */}
        <div
          className={isMobile ? "" : "glass"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "10px",
            padding: isMobile ? "8px 16px" : "12px 20px",
            borderRadius: isMobile ? "25px" : "50px",
            border: "1px solid var(--glass-border)",
            background: isMobile ? "rgba(255, 255, 255, 0.05)" : undefined,
            backdropFilter: isMobile ? "blur(12px)" : undefined,
            WebkitBackdropFilter: isMobile ? "blur(12px)" : undefined,
            transition: "all 0.3s ease",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            width: "100%",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 170, 255, 0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
          }}
        >
          {/* Left side: X button when text present, Search icon when empty */}
          {query.trim() ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                padding: 0,
                border: "none",
                background: "rgba(255, 255, 255, 0.1)",
                color: "var(--foreground-muted)",
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <X style={{ width: "14px", height: "14px" }} />
            </button>
          ) : (
            !isMobile && <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowRecent(true)}
            placeholder={isMobile ? "Search..." : "Search anything..."}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--foreground)",
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: 400,
              minWidth: 0,
            }}
          />

          {/* Right side: Blue "Search" button when text present */}
          {query.trim() && (
            <button
              type="submit"
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                border: "none",
                background: "#00aaff",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0099ee";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#00aaff";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Search
            </button>
          )}
        </div>

        {/* Source Selector - Text links below search bar */}
        <div style={{
          marginTop: "12px",
          display: "flex",
          gap: isMobile ? "8px" : "12px",
          flexWrap: "wrap",
          justifyContent: "center",
          fontSize: isMobile ? "12px" : "13px",
        }}>
          {/* Web Sources */}
          {webSources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => setSelectedSource(source.id)}
              style={{
                padding: "4px 8px",
                border: "none",
                background: "transparent",
                color: selectedSource === source.id ? "#00aaff" : "rgba(255, 255, 255, 0.5)",
                fontSize: "inherit",
                fontWeight: selectedSource === source.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                textDecoration: selectedSource === source.id ? "underline" : "none",
                textUnderlineOffset: "3px",
              }}
              onMouseEnter={(e) => {
                if (selectedSource !== source.id) {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSource !== source.id) {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                }
              }}
            >
              {source.name}
            </button>
          ))}
          
          {/* Separator */}
          <span style={{ color: "rgba(255, 255, 255, 0.2)", userSelect: "none" }}>|</span>

          {/* AI Sources */}
          {aiSources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => setSelectedSource(source.id)}
              style={{
                padding: "4px 8px",
                border: "none",
                background: "transparent",
                color: selectedSource === source.id ? "#00aaff" : "rgba(255, 255, 255, 0.5)",
                fontSize: "inherit",
                fontWeight: selectedSource === source.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                textDecoration: selectedSource === source.id ? "underline" : "none",
                textUnderlineOffset: "3px",
              }}
              onMouseEnter={(e) => {
                if (selectedSource !== source.id) {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSource !== source.id) {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                }
              }}
            >
              {source.name}
            </button>
          ))}
        </div>

        {/* Recent Searches Dropdown */}
        {showRecent && recentSearches.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              borderRadius: "14px",
              padding: "12px",
              zIndex: 1000,
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
              background: "rgba(10, 10, 10, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)" }}>
                  Recent Searches
                </span>
              </div>
              <button
                type="button"
                onClick={clearRecent}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "none",
                  background: "transparent",
                  color: "var(--foreground-muted)",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: "12px", height: "12px" }} />
                Clear
              </button>
            </div>

            {recentSearches.map((recent, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleRecentClick(recent)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Clock style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                {recent}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Click outside to close recent searches */}
      {showRecent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
          }}
          onClick={() => setShowRecent(false)}
        />
      )}
    </div>
  );
});
