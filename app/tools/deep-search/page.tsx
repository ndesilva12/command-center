"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Radar, Search, ExternalLink, ChevronDown, ChevronUp, Clock, Lightbulb } from "lucide-react";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface DeepSearchReport {
  topic: string;
  briefOverview: string;
  sections: {
    title: string;
    content: string;
    links?: { title: string; url: string; type: string }[];
  }[];
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  keyTakeaways?: string[];
  socialMediaHighlights?: { platform: string; author: string; content: string; url: string }[];
  podcastReferences?: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
  sources?: { title: string; url: string; type: string }[];
  timestamp: number;
}

export default function DeepSearchPage() {
  return (
    <ProtectedRoute>
      <DeepSearchContent />
    </ProtectedRoute>
  );
}

function DeepSearchContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('deep-search', 'Deep Search', '#6366f1');
  const [query_text, setQuery] = useState("");
  const [pageTarget, setPageTarget] = useState(15);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DeepSearchReport | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  
  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadHistory(historyLimit);
  }, [historyLimit]);

  const loadHistory = async (limitCount: number = 10) => {
    try {
      const q = query(
        collection(db, "deep_search_history"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(items);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const filteredHistory = historySearch.trim()
    ? history.filter(item =>
        (item.topic || item.query || "").toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const loadFromHistory = (item: any) => {
    // History items may have results nested or flat
    const r = item.results || item;
    setReport({
      topic: r.topic || item.topic || item.query || "",
      briefOverview: r.briefOverview || "",
      sections: r.sections || [],
      hiddenMechanics: r.hiddenMechanics || [],
      counterintuitiveInsights: r.counterintuitiveInsights || [],
      expertDebates: r.expertDebates || [],
      underreportedAngles: r.underreportedAngles || [],
      keyTakeaways: r.keyTakeaways || [],
      socialMediaHighlights: r.socialMediaHighlights || [],
      podcastReferences: r.podcastReferences || [],
      links: r.links || [],
      sources: r.sources || [],
      timestamp: r.timestamp || (item.timestamp?.seconds ? item.timestamp.seconds * 1000 : Date.now()),
    });
    setExpandedSections(new Set((r.sections || []).map((_: any, i: number) => i)));
  };

  const handleSearch = async () => {
    if (!query_text.trim()) return;

    setLoading(true);
    setReport(null);
    
    try {
      const response = await fetch('/api/deep-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query_text, pageTarget }),
      });

      const data = await response.json();
      
      if (data.report) {
        setReport(data.report);
        setExpandedSections(new Set(data.report.sections?.map((_: any, i: number) => i) || []));
        loadHistory(historyLimit);
      } else if (data.error) {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to complete search');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const sectionColors = [
    "#8b5cf6", "#10b981", "#06b6d4", "#ef4444", "#ec4899", "#6366f1",
  ];

  const allLinks = report?.links || report?.sources || [];

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="deep-search" />
      <ToolBackground color={toolCustom.color} />
      
      <main style={{
        paddingTop: isMobile ? "64px" : "136px",
        paddingBottom: isMobile ? "88px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          marginBottom: isMobile ? "16px" : "24px",
        }}>
          <Radar size={isMobile ? 32 : 40} style={{ color: "#6366f1" }} />
          <div>
            <h1 style={{
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: "bold",
              color: "white",
              margin: 0,
            }}>{toolCustom.name}</h1>
            <p style={{ 
              fontSize: isMobile ? "12px" : "14px", 
              color: "#94a3b8", 
              margin: 0 
            }}>
              Expert-level deep dive research reports
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          marginBottom: "16px",
          flexDirection: isMobile ? "column" : "row",
        }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} style={{ 
              position: "absolute", 
              left: "16px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#64748b" 
            }} />
            <input
              type="text"
              placeholder="Enter your research query..."
              value={query_text}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
              style={{
                width: "100%",
                padding: isMobile ? "14px 14px 14px 48px" : "18px 20px 18px 52px",
                background: "rgba(30, 41, 59, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "12px",
                color: "white",
                fontSize: isMobile ? "14px" : "16px",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query_text.trim()}
            style={{
              padding: isMobile ? "14px 24px" : "18px 32px",
              background: loading || !query_text.trim()
                ? "rgba(99, 102, 241, 0.3)"
                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "600",
              cursor: loading || !query_text.trim() ? "not-allowed" : "pointer",
              opacity: loading || !query_text.trim() ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Page Target Slider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "32px",
          padding: "12px 16px",
          background: "rgba(30, 41, 59, 0.4)",
          borderRadius: "10px",
          border: "1px solid rgba(148, 163, 184, 0.1)",
        }}>
          <span style={{ fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" }}>
            Page Target:
          </span>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={pageTarget}
            onChange={(e) => setPageTarget(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: "#6366f1",
              height: "6px",
              cursor: "pointer",
            }}
          />
          <span style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#6366f1",
            minWidth: "40px",
            textAlign: "center",
          }}>
            {pageTarget}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#94a3b8",
          }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              border: "3px solid rgba(148, 163, 184, 0.2)",
              borderTop: "3px solid #6366f1",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }} />
            <p style={{ fontSize: "14px", margin: 0 }}>
              Conducting deep research...
            </p>
          </div>
        )}

        {/* Results */}
        {report && !loading && (
          <div>
            {/* Topic Header */}
            <div style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "24px",
              marginBottom: "24px",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px",
                marginBottom: "12px",
              }}>
                <Radar size={24} style={{ color: "#6366f1" }} />
                <h2 style={{
                  fontSize: isMobile ? "20px" : "24px",
                  fontWeight: "bold",
                  color: "white",
                  margin: 0,
                }}>
                  {report.topic}
                </h2>
              </div>
              <div style={{ 
                fontSize: isMobile ? "13px" : "14px", 
                color: "#cbd5e1", 
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}>
                {report.briefOverview}
              </div>
              {report.timestamp && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px",
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#94a3b8",
                }}>
                  <Clock size={14} />
                  {new Date(report.timestamp).toLocaleString()}
                </div>
              )}
            </div>

            {/* Key Takeaways */}
            {report.keyTakeaways && report.keyTakeaways.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.08) 100%)",
                border: "1px solid rgba(250, 204, 21, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginBottom: "24px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Lightbulb size={18} style={{ color: "#facc15" }} />
                  <h3 style={{
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: "700",
                    color: "#facc15",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    Key Takeaways
                  </h3>
                </div>
                <ul style={{
                  fontSize: isMobile ? "13px" : "14px",
                  color: "#cbd5e1",
                  lineHeight: "1.7",
                  paddingLeft: "20px",
                  margin: 0,
                }}>
                  {report.keyTakeaways.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Sections */}
            {report.sections && report.sections.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                {report.sections.map((section, idx) => {
                  const sectionColor = sectionColors[idx % sectionColors.length];
                  const isExpanded = expandedSections.has(idx);

                  return (
                    <div
                      key={idx}
                      style={{
                        background: `linear-gradient(135deg, ${sectionColor}15 0%, ${sectionColor}08 100%)`,
                        border: `1px solid ${sectionColor}40`,
                        borderRadius: "12px",
                        marginBottom: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => toggleSection(idx)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: isMobile ? "14px 16px" : "16px 20px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: sectionColor,
                          textAlign: "left",
                        }}
                      >
                        <h3 style={{
                          fontSize: isMobile ? "14px" : "16px",
                          fontWeight: "700",
                          margin: 0,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {section.title}
                        </h3>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {isExpanded && (
                        <div style={{
                          padding: isMobile ? "0 16px 16px" : "0 20px 20px",
                          fontSize: isMobile ? "13px" : "14px",
                          color: "#cbd5e1",
                          lineHeight: "1.7",
                          whiteSpace: "pre-wrap",
                        }}>
                          {section.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hidden Mechanics */}
            {report.hiddenMechanics && report.hiddenMechanics.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "700",
                  color: "#10b981",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Hidden Mechanics
                </h3>
                <ul style={{
                  fontSize: isMobile ? "13px" : "14px",
                  color: "#cbd5e1",
                  lineHeight: "1.7",
                  paddingLeft: "20px",
                  margin: 0,
                }}>
                  {report.hiddenMechanics.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Counterintuitive Insights */}
            {report.counterintuitiveInsights && report.counterintuitiveInsights.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "700",
                  color: "#ef4444",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Counterintuitive Insights
                </h3>
                <ul style={{
                  fontSize: isMobile ? "13px" : "14px",
                  color: "#cbd5e1",
                  lineHeight: "1.7",
                  paddingLeft: "20px",
                  margin: 0,
                }}>
                  {report.counterintuitiveInsights.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expert Debates */}
            {report.expertDebates && report.expertDebates.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%)",
                border: "1px solid rgba(236, 72, 153, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "700",
                  color: "#ec4899",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Expert Debates
                </h3>
                <ul style={{
                  fontSize: isMobile ? "13px" : "14px",
                  color: "#cbd5e1",
                  lineHeight: "1.7",
                  paddingLeft: "20px",
                  margin: 0,
                }}>
                  {report.expertDebates.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Underreported Angles */}
            {report.underreportedAngles && report.underreportedAngles.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "700",
                  color: "#06b6d4",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Underreported Angles
                </h3>
                <ul style={{
                  fontSize: isMobile ? "13px" : "14px",
                  color: "#cbd5e1",
                  lineHeight: "1.7",
                  paddingLeft: "20px",
                  margin: 0,
                }}>
                  {report.underreportedAngles.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources */}
            {allLinks.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(148, 163, 184, 0.08) 100%)",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
              }}>
                <h3 style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "700",
                  color: "#94a3b8",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Sources ({allLinks.length})
                </h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "8px",
                }}>
                  {allLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 12px",
                        background: "rgba(30, 41, 59, 0.5)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "8px",
                        color: "#60a5fa",
                        fontSize: "13px",
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={14} />
                      <span style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {link.title}
                      </span>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        background: "rgba(59, 130, 246, 0.2)",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        fontWeight: "600",
                      }}>
                        {link.type}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {!loading && (
          <div style={{
            marginTop: "32px",
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.15)",
            borderRadius: "16px",
            padding: isMobile ? "16px" : "24px",
          }}>
            <h3 style={{
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: 700,
              color: "white",
              marginBottom: "16px",
            }}>
              History
            </h3>

            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(30, 41, 59, 0.6)",
                color: "white",
                fontSize: "14px",
                marginBottom: "16px",
                outline: "none",
              }}
            />

            {filteredHistory.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                {historySearch.trim() ? "No results found" : "No searches yet"}
              </p>
            ) : (
              <>
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      background: "rgba(30, 41, 59, 0.5)",
                      cursor: "pointer",
                      border: "1px solid transparent",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#6366f1"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                  >
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "white" }}>
                      {item.topic || item.query || "Untitled"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                      {item.timestamp?.seconds
                        ? new Date(item.timestamp.seconds * 1000).toLocaleString()
                        : item.timestamp
                          ? new Date(item.timestamp).toLocaleString()
                          : ""
                      }
                      {item.status && ` • ${item.status}`}
                    </div>
                  </div>
                ))}

                {!historySearch.trim() && historyLimit < 50 && history.length >= historyLimit && (
                  <button
                    onClick={() => setHistoryLimit(historyLimit + 25)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      background: "transparent",
                      color: "#6366f1",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Show More (currently showing {historyLimit})
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
