"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Eye, Search, ExternalLink, ChevronDown, ChevronUp, Clock, AlertTriangle } from "lucide-react";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { ExportPDFButton } from "@/components/tools/ExportPDFButton";

interface DarkSearchReport {
  topic: string;
  mode: "long" | "short" | "links";
  summary: string;
  sections?: { title: string; content: string; }[];
  keyTakeaways?: string[];
  alternativePerspectives?: string[];
  unansweredQuestions?: string[];
  socialMediaHighlights?: { platform: string; author: string; content: string; url: string }[];
  podcastReferences?: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
  timestamp: number;
}

export default function DarkSearchPage() {
  return (
    <ProtectedRoute>
      <DarkSearchContent />
    </ProtectedRoute>
  );
}

function DarkSearchContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('dark-search', 'Dark Search', '#6366f1');
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"long" | "short" | "links">("long");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DarkSearchReport | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"search" | "history">("search");
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
        collection(db, "dark_search_history"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const filteredHistory = historySearch.trim()
    ? history.filter(item =>
        (item.query || item.results?.topic || "").toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const loadFromHistory = (item: any) => {
    const results = item.results || item;
    setReport({
      topic: results.topic || item.query || "Unknown",
      mode: results.mode || item.mode || "long",
      summary: results.summary || "",
      sections: results.sections,
      keyTakeaways: results.keyTakeaways,
      alternativePerspectives: results.alternativePerspectives,
      unansweredQuestions: results.unansweredQuestions,
      socialMediaHighlights: results.socialMediaHighlights,
      podcastReferences: results.podcastReferences,
      links: results.links,
      timestamp: results.timestamp || (item.timestamp ? new Date(item.timestamp).getTime() : Date.now()),
    });
    if (results.sections) {
      setExpandedSections(new Set(results.sections.map((_: any, i: number) => i)));
    }
    setActiveTab("search");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setReport(null);
    
    try {
      const response = await fetch('/api/dark-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, mode }),
      });

      const data = await response.json();
      
      if (data.report) {
        setReport(data.report);
        if (data.report.sections) {
          setExpandedSections(new Set(data.report.sections.map((_: any, i: number) => i)));
        }
        // Refresh history
        setTimeout(() => loadHistory(historyLimit), 3000);
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
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedSections(newExpanded);
  };

  const sectionColors = [toolCustom.color, "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#dc2626"];

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="dark-search" />
      <ToolBackground color={toolCustom.color} />
      
      <main style={{
        paddingTop: isMobile ? "64px" : "calc(64px + var(--tool-nav-height, 56px) + 16px)",
        paddingBottom: isMobile ? "80px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: "100vh",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: isMobile ? "12px" : "16px" }}>
          <Eye size={isMobile ? 32 : 40} style={{ color: toolCustom.color }} />
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: "bold", color: "white", margin: 0 }}>
              {toolCustom.name}
            </h1>
            <p style={{ fontSize: isMobile ? "12px" : "14px", color: "#94a3b8", margin: 0 }}>
              Uncensored research exploring all perspectives
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["search", "history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: activeTab === tab ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(148, 163, 184, 0.2)",
                background: activeTab === tab ? "rgba(239, 68, 68, 0.15)" : "rgba(30, 41, 59, 0.6)",
                color: activeTab === tab ? toolCustom.color : "#94a3b8",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "search" && (
          <>
            {/* Warning */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              padding: isMobile ? "10px 12px" : "12px 16px",
              background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px", marginBottom: isMobile ? "16px" : "20px",
            }}>
              <AlertTriangle size={18} style={{ color: toolCustom.color, marginTop: "2px", flexShrink: 0 }} />
              <p style={{ fontSize: isMobile ? "12px" : "13px", color: "#fca5a5", margin: 0, lineHeight: "1.5" }}>
                This tool explores alternative perspectives, conspiracy theories, and fringe viewpoints. Results may include controversial or unverified claims. Think critically.
              </p>
            </div>

            {/* Mode Selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[
                { id: "long" as const, label: "Long Report", desc: "Comprehensive analysis" },
                { id: "short" as const, label: "Short Summary", desc: "Brief overview" },
                { id: "links" as const, label: "Links Only", desc: "Curated sources" },
              ].map((modeOption) => (
                <button
                  key={modeOption.id}
                  onClick={() => setMode(modeOption.id)}
                  style={{
                    flex: isMobile ? "1 1 100%" : "0 0 auto",
                    padding: isMobile ? "12px 16px" : "12px 20px",
                    background: mode === modeOption.id
                      ? "linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3))"
                      : "rgba(30, 41, 59, 0.6)",
                    border: mode === modeOption.id
                      ? "1px solid rgba(239, 68, 68, 0.5)"
                      : "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px", color: "white", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: "600", marginBottom: "2px" }}>{modeOption.label}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{modeOption.desc}</div>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Enter your research query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
                  style={{
                    width: "100%", padding: isMobile ? "14px 14px 14px 48px" : "18px 20px 18px 52px",
                    background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "12px", color: "white", fontSize: isMobile ? "14px" : "16px", outline: "none",
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                style={{
                  padding: isMobile ? "14px 24px" : "18px 32px",
                  background: loading || !searchQuery.trim() ? "rgba(239, 68, 68, 0.3)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "none", borderRadius: "12px", color: "white",
                  fontSize: isMobile ? "14px" : "16px", fontWeight: "600",
                  cursor: loading || !searchQuery.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !searchQuery.trim() ? 0.6 : 1,
                }}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{
                  width: "40px", height: "40px",
                  border: "3px solid rgba(148, 163, 184, 0.2)", borderTop: "3px solid #ef4444",
                  borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite",
                }} />
                <p style={{ fontSize: "14px", margin: 0 }}>Conducting uncensored research...</p>
              </div>
            )}

            {/* Results */}
            {report && !loading && <ReportDisplay report={report} isMobile={isMobile} expandedSections={expandedSections} toggleSection={toggleSection} sectionColors={sectionColors} accentColor={toolCustom.color} />}
          </>
        )}

        {activeTab === "history" && (
          <div>
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history..."
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "8px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(30, 41, 59, 0.6)", color: "white",
                fontSize: "14px", marginBottom: "16px", outline: "none",
              }}
            />

            {filteredHistory.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
                {historySearch.trim() ? "No results found" : "No dark searches yet"}
              </p>
            ) : (
              <>
                {filteredHistory.map((item) => {
                  const topic = item.query || item.results?.topic || item.topic || "Untitled Search";
                  const summary = item.results?.summary || item.summary || item.preview || "";
                  const ts = item.timestamp || item.results?.timestamp || item.completed_at;
                  const itemMode = item.mode || item.results?.mode;
                  return (
                    <div
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      style={{
                        padding: "16px", marginBottom: "8px", borderRadius: "8px",
                        background: "rgba(30, 41, 59, 0.6)", cursor: "pointer",
                        border: "1px solid transparent", transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "white", marginBottom: "4px" }}>
                        🔴 {topic}
                      </div>
                      {summary && (
                        <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 8px", lineHeight: 1.5,
                          overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                        }}>
                          {summary}
                        </p>
                      )}
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {ts ? new Date(typeof ts === 'number' ? ts : ts).toLocaleString() : "Unknown date"}
                        {itemMode && ` • ${itemMode}`}
                      </div>
                    </div>
                  );
                })}

                {!historySearch.trim() && historyLimit < 50 && history.length >= historyLimit && (
                  <button
                    onClick={() => setHistoryLimit(historyLimit + 25)}
                    style={{
                      width: "100%", padding: "12px", marginTop: "8px", borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.3)", background: "transparent",
                      color: toolCustom.color, fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Show More
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function ReportDisplay({ report, isMobile, expandedSections, toggleSection, sectionColors, accentColor }: {
  report: DarkSearchReport; isMobile: boolean; expandedSections: Set<number>;
  toggleSection: (i: number) => void; sectionColors: string[]; accentColor: string;
}) {
  return (
    <div>
      {/* Topic & Summary */}
      <div style={{
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))",
        border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "16px",
        padding: isMobile ? "20px" : "24px", marginBottom: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
          <Eye size={24} style={{ color: accentColor }} />
          <h2 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "bold", color: "white", margin: 0, flex: 1 }}>{report.topic}</h2>
          <ExportPDFButton title={`Dark Search: ${report.topic}`} />
        </div>
        <div style={{ fontSize: isMobile ? "13px" : "14px", color: "#cbd5e1", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{report.summary}</div>
        {report.timestamp && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "12px", color: "#94a3b8" }}>
            <Clock size={14} />
            {new Date(report.timestamp).toLocaleString()} • Mode: {report.mode}
          </div>
        )}
      </div>

      {/* Sections */}
      {report.sections?.filter(s => s.content && s.content.trim()).map((section, idx) => {
        const color = sectionColors[idx % sectionColors.length];
        const isExpanded = expandedSections.has(idx);
        return (
          <div key={idx} style={{
            background: `linear-gradient(135deg, ${color}15, ${color}08)`,
            border: `1px solid ${color}40`, borderRadius: "12px", marginBottom: "12px", overflow: "hidden",
          }}>
            <button onClick={() => toggleSection(idx)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: isMobile ? "14px 16px" : "16px 20px", background: "transparent",
              border: "none", cursor: "pointer", color, textAlign: "left",
            }}>
              <h3 style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{section.title}</h3>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isExpanded && (
              <div style={{ padding: isMobile ? "0 16px 16px" : "0 20px 20px", fontSize: isMobile ? "13px" : "14px", color: "#cbd5e1", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                {section.content}
              </div>
            )}
          </div>
        );
      })}

      {/* Key Takeaways */}
      {report.keyTakeaways && report.keyTakeaways.length > 0 && (
        <ListSection title="Key Takeaways" items={report.keyTakeaways} color="#6366f1" isMobile={isMobile} />
      )}

      {/* Alternative Perspectives */}
      {report.alternativePerspectives && report.alternativePerspectives.length > 0 && (
        <ListSection title="Alternative Perspectives" items={report.alternativePerspectives} color="#8b5cf6" isMobile={isMobile} />
      )}

      {/* Unanswered Questions */}
      {report.unansweredQuestions && report.unansweredQuestions.length > 0 && (
        <ListSection title="Unanswered Questions" items={report.unansweredQuestions} color="#ec4899" isMobile={isMobile} />
      )}

      {/* Social Media */}
      {report.socialMediaHighlights && report.socialMediaHighlights.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08))",
          border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px",
          padding: isMobile ? "16px" : "20px", marginBottom: "16px",
        }}>
          <h3 style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#3b82f6", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Social Media Highlights</h3>
          {report.socialMediaHighlights.map((h, idx) => (
            <div key={idx} style={{ background: "rgba(30, 41, 59, 0.5)", borderRadius: "8px", padding: isMobile ? "12px" : "14px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "600" }}>{h.platform} - {h.author}</span>
                {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}><ExternalLink size={14} /></a>}
              </div>
              <p style={{ fontSize: isMobile ? "13px" : "14px", color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>{h.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Podcast References */}
      {report.podcastReferences && report.podcastReferences.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.08))",
          border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "12px",
          padding: isMobile ? "16px" : "20px", marginBottom: "16px",
        }}>
          <h3 style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#a855f7", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Podcast References</h3>
          {report.podcastReferences.map((p, idx) => (
            <div key={idx} style={{ background: "rgba(30, 41, 59, 0.5)", borderRadius: "8px", padding: isMobile ? "12px" : "14px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div>
                  <h4 style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: "600", color: "white", margin: "0 0 4px" }}>{p.title}</h4>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>{p.episode}{p.timestamp && ` • ${p.timestamp}`}</p>
                </div>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: "#c084fc" }}><ExternalLink size={14} /></a>}
              </div>
              <p style={{ fontSize: isMobile ? "13px" : "14px", color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>{p.summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      {report.links && report.links.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.08))",
          border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "12px",
          padding: isMobile ? "16px" : "20px",
        }}>
          <h3 style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sources ({report.links.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: "8px" }}>
            {report.links.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px",
                background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "8px", color: "#60a5fa", fontSize: "13px", textDecoration: "none",
              }}>
                <ExternalLink size={14} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.title}</span>
                <span style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(59, 130, 246, 0.2)", borderRadius: "4px", textTransform: "uppercase", fontWeight: "600" }}>{link.type}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListSection({ title, items, color, isMobile }: { title: string; items: string[]; color: string; isMobile: boolean }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}26, ${color}14)`,
      border: `1px solid ${color}4d`, borderRadius: "12px",
      padding: isMobile ? "16px" : "20px", marginBottom: "16px",
    }}>
      <h3 style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
      <ul style={{ fontSize: isMobile ? "13px" : "14px", color: "#cbd5e1", lineHeight: "1.7", paddingLeft: "20px", margin: 0 }}>
        {items.map((item, idx) => <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>)}
      </ul>
    </div>
  );
}
