"use client";

import { useState, useEffect, FormEvent } from "react";
import { Search, X, Mail, Calendar, Users, StickyNote, FileText, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: "email" | "calendar" | "contact" | "person" | "note" | "page";
  url: string;
  icon: any;
}

export function UniversalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open will be handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search/universal?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    onClose();
    setQuery("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 2000,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: "600px",
          zIndex: 2001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            background: "rgba(10, 10, 10, 0.98)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: results.length > 0 ? "1px solid rgba(255, 255, 255, 0.1)" : "none"
          }}>
            <Search style={{ width: "20px", height: "20px", color: "var(--foreground-muted)", flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search emails, calendar, contacts, notes..."
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--foreground)",
                fontSize: "16px",
                fontWeight: 400,
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                <X style={{ width: "14px", height: "14px" }} />
              </button>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto",
              padding: "8px"
            }}>
              {results.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      color: "var(--foreground)",
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
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      background: "rgba(0, 170, 255, 0.1)",
                      flexShrink: 0
                    }}>
                      <Icon style={{ width: "16px", height: "16px", color: "#00aaff" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "2px" }}>
                        {result.title}
                      </div>
                      {result.description && (
                        <div style={{
                          fontSize: "12px",
                          color: "var(--foreground-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {result.description}
                        </div>
                      )}
                    </div>
                    <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--foreground-muted)",
              fontSize: "14px"
            }}>
              Searching...
            </div>
          )}

          {/* No results */}
          {query && !loading && results.length === 0 && (
            <div style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--foreground-muted)",
              fontSize: "14px"
            }}>
              No results found
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        <div style={{
          marginTop: "12px",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--foreground-muted)"
        }}>
          Press <kbd style={{
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            fontFamily: "monospace"
          }}>ESC</kbd> to close
        </div>
      </div>
    </>
  );
}

// Helper to get icon for result type
function getIconForType(type: SearchResult["type"]) {
  switch (type) {
    case "email": return Mail;
    case "calendar": return Calendar;
    case "contact": return Users;
    case "person": return Users;
    case "note": return StickyNote;
    case "page": return FileText;
    default: return FileText;
  }
}
