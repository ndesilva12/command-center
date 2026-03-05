"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, LogOut, X, ChevronDown } from "lucide-react";
import { UniversalSearch } from "@/components/search/UniversalSearch";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UNIFIED_SOURCES, UnifiedSourceId, getSearchUrl, getSourceConfig } from "@/lib/unified-sources";

export function TopNav() {
  const [isMobile, setIsMobile] = useState(false);
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<UnifiedSourceId>("google");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowUniversalSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    const searchUrl = getSearchUrl(selectedSource, query.trim());
    if (searchUrl) {
      window.open(searchUrl, "_blank");
    }
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const selectedSourceConfig = UNIFIED_SOURCES.find(s => s.id === selectedSource);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "linear-gradient(180deg, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 40%, rgba(0, 0, 0, 0) 100%)",
          backdropFilter: "blur(12px)",
          borderBottom: "none",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            height: "100%",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          {/* Left Side - Title + Universal Search Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {!isMobile && (
              <>
                <button
                  onClick={() => setShowUniversalSearch(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    color: "var(--foreground-muted)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                    e.currentTarget.style.color = "#00aaff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "var(--foreground-muted)";
                  }}
                >
                  <Search style={{ width: "18px", height: "18px" }} />
                </button>
                <Link
                  href="/"
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    letterSpacing: "0.02em",
                    fontFamily: "var(--font-orbitron, 'Orbitron', system-ui)",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#00aaff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--foreground)";
                  }}
                >
                  Command Center
                </Link>
              </>
            )}
          </div>

          {/* Center - Compact Search Bar (Desktop only) */}
          {!isMobile && (
            <div style={{ flex: 1, maxWidth: "500px", display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Source Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  {selectedSourceConfig?.name || "Google"}
                  <ChevronDown style={{ width: "14px", height: "14px" }} />
                </button>

                {showSourceDropdown && (
                  <>
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 99,
                      }}
                      onClick={() => setShowSourceDropdown(false)}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        minWidth: "180px",
                        borderRadius: "8px",
                        padding: "6px",
                        zIndex: 100,
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                        background: "rgba(10, 10, 10, 0.98)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        maxHeight: "400px",
                        overflowY: "auto",
                      }}
                    >
                      {UNIFIED_SOURCES.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => {
                            setSelectedSource(source.id);
                            setShowSourceDropdown(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: selectedSource === source.id
                              ? "rgba(0, 170, 255, 0.15)"
                              : "transparent",
                            border: "none",
                            color: selectedSource === source.id
                              ? "#00aaff"
                              : "rgba(255, 255, 255, 0.8)",
                            fontSize: "13px",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedSource !== source.id) {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedSource !== source.id) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {source.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Search Input */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  transition: "all 0.2s",
                }}
              >
                {query.trim() && (
                  <button
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
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <X style={{ width: "12px", height: "12px" }} />
                  </button>
                )}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Quick search..."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    fontWeight: 400,
                    minWidth: 0,
                  }}
                />
                {query.trim() && (
                  <button
                    onClick={handleSearch}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#00aaff",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Search
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Side - Logout (Desktop only) */}
          {!isMobile && user && (
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                color: "var(--muted)",
                background: "transparent",
                border: "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#7c3aed";
                e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut style={{ width: "18px", height: "18px" }} />
            </button>
          )}
        </div>
      </nav>

      {/* Universal Search Modal */}
      <UniversalSearch
        isOpen={showUniversalSearch}
        onClose={() => setShowUniversalSearch(false)}
      />
    </>
  );
}
