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
      // Open search URL - same tab on mobile to avoid overlay issues
      const searchUrl = getSearchUrl(selectedSource, query.trim());
      if (searchUrl) {
        if (isMobile) {
          window.location.href = searchUrl;
        } else {
          window.open(searchUrl, "_blank");
        }
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
        {/* Search Input - Larger and softer glass effect */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "10px" : "14px",
            padding: isMobile ? "16px 22px" : "22px 32px",
            borderRadius: "32px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            transition: "all 0.3s ease",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            width: "100%",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.25)";
            e.currentTarget.style.boxShadow = "0 12px 48px rgba(0, 170, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
          }}
        >
          {/* Left side: Search icon or X button */}
          {query.trim() ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                padding: 0,
                border: "none",
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.8)",
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "28px" : "32px",
                height: isMobile ? "28px" : "32px",
                borderRadius: "50%",
                transition: "all 0.2s ease",
              }}
            >
              <X style={{ width: isMobile ? "16px" : "18px", height: isMobile ? "16px" : "18px", strokeWidth: 2 }} />
            </button>
          ) : (
            <Search style={{ 
              width: isMobile ? "20px" : "22px", 
              height: isMobile ? "20px" : "22px", 
              color: "rgba(255, 255, 255, 0.4)", 
              flexShrink: 0 
            }} />
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
              fontSize: isMobile ? "17px" : "22px",
              fontWeight: 400,
              minWidth: 0,
              letterSpacing: "0.01em",
            }}
          />

          {/* Right side: Blue "Search" button when text present */}
          {query.trim() && (
            <button
              type="submit"
              style={{
                padding: isMobile ? "10px 20px" : "12px 24px",
                borderRadius: "24px",
                border: "none",
                background: "linear-gradient(135deg, #00aaff 0%, #0088dd 100%)",
                color: "white",
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(0, 170, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(0, 170, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 170, 255, 0.3)";
              }}
            >
              Search
            </button>
          )}
        </div>

        {/* Source Selector - Dropdown on mobile, text links on desktop */}
        {isMobile ? (
          <div style={{
            marginTop: "14px",
            display: "flex",
            justifyContent: "center",
          }}>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as UnifiedSourceId)}
              style={{
                padding: "10px 14px",
                paddingRight: "36px",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#00aaff",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300aaff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                minWidth: "150px",
              }}
            >
              <optgroup label="Web Search">
                {webSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="AI">
                {aiSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        ) : (
          <div style={{
            marginTop: "20px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
            fontSize: "15px",
          }}>
            {/* Web Sources */}
            {webSources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => setSelectedSource(source.id)}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  background: "transparent",
                  color: selectedSource === source.id ? "#00aaff" : "rgba(255, 255, 255, 0.55)",
                  fontSize: "inherit",
                  fontWeight: selectedSource === source.id ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textDecoration: selectedSource === source.id ? "underline" : "none",
                  textUnderlineOffset: "4px",
                }}
                onMouseEnter={(e) => {
                  if (selectedSource !== source.id) {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSource !== source.id) {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.55)";
                  }
                }}
              >
                {source.name}
              </button>
            ))}
            
            {/* Separator */}
            <span style={{ color: "rgba(255, 255, 255, 0.2)", userSelect: "none", fontSize: "18px", lineHeight: 1 }}>|</span>

            {/* AI Sources */}
            {aiSources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => setSelectedSource(source.id)}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  background: "transparent",
                  color: selectedSource === source.id ? "#00aaff" : "rgba(255, 255, 255, 0.55)",
                  fontSize: "inherit",
                  fontWeight: selectedSource === source.id ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textDecoration: selectedSource === source.id ? "underline" : "none",
                  textUnderlineOffset: "4px",
                }}
                onMouseEnter={(e) => {
                  if (selectedSource !== source.id) {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSource !== source.id) {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.55)";
                  }
                }}
              >
                {source.name}
              </button>
            ))}
          </div>
        )}

        {/* Recent Searches Dropdown */}
        {showRecent && recentSearches.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 12px)",
              left: 0,
              right: 0,
              borderRadius: "20px",
              padding: "14px",
              zIndex: 1000,
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
              background: "rgba(15, 15, 18, 0.95)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.4)" }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255, 255, 255, 0.5)" }}>
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
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "rgba(255, 255, 255, 0.4)",
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
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "none",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Clock style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.35)" }} />
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
