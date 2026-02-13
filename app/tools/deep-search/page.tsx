"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Radar, Search, ExternalLink, ChevronDown, ChevronUp, Clock } from "lucide-react";

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
  socialMediaHighlights: { platform: string; author: string; content: string; url: string }[];
  podcastReferences: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DeepSearchReport | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setReport(null);
    
    try {
      const response = await fetch('/api/deep-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (data.report) {
        setReport(data.report);
        // Expand all sections by default
        setExpandedSections(new Set(data.report.sections?.map((_: any, i: number) => i) || []));
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
    "#8b5cf6", // purple
    "#10b981", // green
    "#06b6d4", // cyan
    "#ef4444", // red
    "#ec4899", // pink
    "#6366f1", // indigo
  ];

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="deep-search" />
      
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
              Expert-level research with Google Search grounding
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          marginBottom: "32px",
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
              value={query}
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
            disabled={loading || !query.trim()}
            style={{
              padding: isMobile ? "14px 24px" : "18px 32px",
              background: loading || !query.trim()
                ? "rgba(99, 102, 241, 0.3)"
                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "600",
              cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              opacity: loading || !query.trim() ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
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

            {/* Social Media Highlights */}
            {report.socialMediaHighlights && report.socialMediaHighlights.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "700",
                  color: "#3b82f6",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Social Media Highlights
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {report.socialMediaHighlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(30, 41, 59, 0.5)",
                        borderRadius: "8px",
                        padding: isMobile ? "12px" : "14px",
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}>
                        <span style={{
                          fontSize: "12px",
                          color: "#60a5fa",
                          fontWeight: "600",
                        }}>
                          {highlight.platform} - {highlight.author}
                        </span>
                        {highlight.url && (
                          <a
                            href={highlight.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#60a5fa" }}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <p style={{
                        fontSize: isMobile ? "13px" : "14px",
                        color: "#cbd5e1",
                        lineHeight: "1.6",
                        margin: 0,
                      }}>
                        {highlight.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Podcast References */}
            {report.podcastReferences && report.podcastReferences.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "700",
                  color: "#8b5cf6",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Podcast References
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {report.podcastReferences.map((podcast, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(30, 41, 59, 0.5)",
                        borderRadius: "8px",
                        padding: isMobile ? "12px" : "14px",
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "6px",
                      }}>
                        <div>
                          <h4 style={{
                            fontSize: isMobile ? "13px" : "14px",
                            fontWeight: "600",
                            color: "white",
                            margin: "0 0 4px 0",
                          }}>
                            {podcast.title}
                          </h4>
                          <p style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                            margin: 0,
                          }}>
                            {podcast.episode}
                            {podcast.timestamp && ` • ${podcast.timestamp}`}
                          </p>
                        </div>
                        {podcast.url && (
                          <a
                            href={podcast.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#a78bfa" }}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <p style={{
                        fontSize: isMobile ? "13px" : "14px",
                        color: "#cbd5e1",
                        lineHeight: "1.6",
                        margin: 0,
                      }}>
                        {podcast.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grounded Links */}
            {report.links && report.links.length > 0 && (
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
                  Sources ({report.links.length})
                </h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "8px",
                }}>
                  {report.links.map((link, idx) => (
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
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(30, 41, 59, 0.5)";
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
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
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
