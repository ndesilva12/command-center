"use client";

import { useState, FormEvent, useEffect, forwardRef, useImperativeHandle } from "react";
import { Search, Clock, X } from "lucide-react";
import { UnifiedSourceId, getSearchUrl, getSourceConfig, getAIModelUrl } from "@/lib/unified-sources";
import { SourceSelector } from "./SourceSelector";

const RECENT_SEARCHES_KEY = "cc-recent-searches";
const MAX_RECENT = 5;

export interface SearchBarRef {
  setQuery: (q: string) => void;
  setSource: (s: UnifiedSourceId) => void;
}

export const SearchBar = forwardRef<SearchBarRef, {}>(function SearchBar(props, ref) {
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
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const sourceConfig = getSourceConfig(selectedSource);
    if (!sourceConfig) return;

    saveToRecent(query);

    if (sourceConfig.type === "web") {
      // Open web search in new tab
      const searchUrl = getSearchUrl(selectedSource, query.trim());
      window.open(searchUrl, "_blank");
    } else if (sourceConfig.type === "ai") {
      // Open AI model in new tab
      const aiUrl = getAIModelUrl(selectedSource);
      window.open(aiUrl, "_blank");
    }

    setQuery("");
    setShowRecent(false);
  };

  // Handle recent search click
  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    setShowRecent(false);
  };

  return (
    <div style={{ width: "100%", maxWidth: isMobile ? "none" : "800px", margin: "0 auto", padding: isMobile ? "0 12px" : "0" }}>
      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ position: "relative" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "10px" : "12px", alignItems: isMobile ? "stretch" : "center" }}>
          {/* Search Input */}
          <div
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: isMobile ? "10px 16px" : "14px 20px",
              borderRadius: "50px",
              border: "1px solid var(--glass-border)",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              flex: 1,
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
            <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />

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
                fontSize: "15px",
                fontWeight: 400,
              }}
            />

            <button
              type="submit"
              disabled={!query.trim()}
              style={{
                padding: isMobile ? "6px 12px" : "0 8px",
                borderRadius: isMobile ? "20px" : "0",
                border: "none",
                background: isMobile && query.trim() ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: query.trim() ? "#00aaff" : "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: query.trim() ? "pointer" : "not-allowed",
                transition: "all 0.3s ease",
                textDecoration: "none",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (query.trim()) {
                  e.currentTarget.style.textDecoration = isMobile ? "none" : "underline";
                  if (isMobile) {
                    e.currentTarget.style.background = "rgba(0, 170, 255, 0.25)";
                  }
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
                if (isMobile && query.trim()) {
                  e.currentTarget.style.background = "rgba(0, 170, 255, 0.15)";
                }
              }}
            >
              {isMobile ? <Search style={{ width: "16px", height: "16px" }} /> : "Search"}
            </button>
          </div>

          {/* Source Selector - Outside search bar on desktop, separate row on mobile */}
          {isMobile ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SourceSelector selectedSource={selectedSource} onSelectSource={setSelectedSource} />
            </div>
          ) : (
            <SourceSelector selectedSource={selectedSource} onSelectSource={setSelectedSource} />
          )}
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
