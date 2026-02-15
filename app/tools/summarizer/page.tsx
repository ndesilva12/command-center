"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FileText, Download, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { ExportPDFButton } from "@/components/tools/ExportPDFButton";

interface Summary {
  id: string;
  url: string;
  title: string;
  targetPages: number;
  status: 'processing' | 'completed' | 'failed';
  content?: string;
  createdAt: string;
  completedAt?: string;
  timestamp?: string;
}

export default function SummarizerPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('summarizer', 'Summarizer', '#8b5cf6');
  
  const [url, setUrl] = useState("");
  const [targetPages, setTargetPages] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [history, setHistory] = useState<Summary[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      // Try summaries collection (existing) and summarizer_history
      const collections = ["summaries", "summarizer_history"];
      const allItems: Summary[] = [];
      
      for (const col of collections) {
        try {
          const q = query(collection(db, col), orderBy(col === "summaries" ? "createdAt" : "timestamp", "desc"), limit(limitCount));
          const snapshot = await getDocs(q);
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            allItems.push({
              id: doc.id,
              url: data.url || "",
              title: data.title || data.url || "Untitled",
              targetPages: data.targetPages || data.pageTarget || 10,
              status: data.status || "completed",
              content: data.content || data.summary || "",
              createdAt: data.createdAt || data.timestamp || "",
              timestamp: data.timestamp || data.createdAt || "",
            });
          });
        } catch { /* collection may not exist */ }
      }

      // Dedupe by id and sort by date
      const seen = new Set<string>();
      const deduped = allItems.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      deduped.sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
      
      setHistory(deduped.slice(0, limitCount));
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const filteredHistory = historySearch.trim()
    ? history.filter(item =>
        (item.title || item.url || "").toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) { setError("Please enter a URL"); return; }
    if (targetPages < 1 || targetPages > 100) { setError("Target pages must be between 1 and 100"); return; }
    
    setProcessing(true);
    try {
      const response = await fetch("/api/summarizer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, targetPages }),
      });
      
      if (!response.ok) throw new Error("Failed to create summary request");
      
      setUrl("");
      setTargetPages(10);
      // Switch to history and refresh
      setActiveTab("history");
      setTimeout(() => loadHistory(historyLimit), 2000);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to create summary request");
    } finally {
      setProcessing(false);
    }
  };

  const downloadSummary = (summary: Summary) => {
    if (!summary.content) return;
    const blob = new Blob([summary.content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${summary.title || 'summary'}_${summary.targetPages}pages.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ProtectedRoute requiredPermission="summarizer">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="summarizer" />
      <ToolBackground color={toolCustom.color} />

      <main style={{
        paddingTop: isMobile ? "64px" : "136px",
        paddingBottom: isMobile ? "80px" : "96px",
        minHeight: "100vh",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "0 12px" : "0 24px" }}>
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <FileText style={{ width: "32px", height: "32px", color: "#8b5cf6" }} />
              <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                {toolCustom.name}
              </h1>
            </div>
            <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
              Condense any written material into a comprehensive summary
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            {(["create", "history"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  border: activeTab === tab ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                  background: activeTab === tab ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  color: activeTab === tab ? "#8b5cf6" : "var(--foreground-muted)",
                  fontSize: "14px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                }}
              >
                {tab === "create" ? "New Summary" : "History"}
              </button>
            ))}
          </div>

          {activeTab === "create" && (
            <div className="glass" style={{ padding: isMobile ? "20px" : "32px", borderRadius: "16px" }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    Content URL *
                  </label>
                  <input
                    type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/... or https://example.com/article.pdf"
                    disabled={processing}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)", backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)", fontSize: "14px",
                    }}
                  />
                  <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
                    PDFs, articles, books, YouTube videos, or podcasts
                  </p>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    Target Pages: {targetPages}
                  </label>
                  <input type="range" min="1" max="50" value={targetPages}
                    onChange={(e) => setTargetPages(parseInt(e.target.value))}
                    disabled={processing} style={{ width: "100%", accentColor: "#8b5cf6" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
                    <span>1 page</span><span>50 pages</span>
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle style={{ width: "16px", height: "16px", color: "#ef4444", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#ef4444" }}>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={processing || !url.trim()} style={{
                  width: "100%", padding: "14px", borderRadius: "8px", border: "none",
                  background: processing || !url.trim() ? "rgba(139, 92, 246, 0.3)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  color: "white", fontSize: "15px", fontWeight: 600,
                  cursor: processing || !url.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}>
                  {processing ? (<><Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />Processing...</>) : (<><FileText style={{ width: "18px", height: "18px" }} />Create Summary</>)}
                </button>
              </form>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <input
                type="text" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search summaries..."
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--foreground)", fontSize: "14px", marginBottom: "16px", outline: "none",
                }}
              />

              {filteredHistory.length === 0 ? (
                <div className="glass" style={{ padding: "48px 24px", borderRadius: "12px", textAlign: "center" }}>
                  <FileText style={{ width: "48px", height: "48px", color: "#8b5cf6", margin: "0 auto 16px" }} />
                  <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                    {historySearch.trim() ? "No results found" : "No summaries yet"}
                  </p>
                </div>
              ) : (
                <>
                  {filteredHistory.map((summary) => {
                    const isExpanded = expandedId === summary.id;
                    return (
                      <div key={summary.id} className="glass" style={{
                        padding: "20px", borderRadius: "12px", marginBottom: "12px",
                        border: isExpanded ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid transparent",
                      }}>
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : summary.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                                {summary.title || summary.url || "Untitled Summary"}
                              </h3>
                              {summary.url && summary.title && (
                                <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {summary.url}
                                </p>
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{
                                  fontSize: "12px", padding: "3px 8px", borderRadius: "4px",
                                  backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6",
                                  border: "1px solid rgba(139, 92, 246, 0.3)",
                                }}>
                                  {summary.targetPages} pages
                                </span>
                                <span style={{
                                  fontSize: "12px", padding: "3px 8px", borderRadius: "4px",
                                  backgroundColor: summary.status === 'completed' ? "rgba(16, 185, 129, 0.1)" : summary.status === 'failed' ? "rgba(239, 68, 68, 0.1)" : "rgba(0, 170, 255, 0.1)",
                                  color: summary.status === 'completed' ? "#10b981" : summary.status === 'failed' ? "#ef4444" : "#00aaff",
                                  display: "flex", alignItems: "center", gap: "4px",
                                }}>
                                  {summary.status === 'completed' && <CheckCircle style={{ width: "12px", height: "12px" }} />}
                                  {summary.status === 'processing' && <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />}
                                  {summary.status === 'completed' ? 'Completed' : summary.status === 'failed' ? 'Failed' : 'Processing'}
                                </span>
                                <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                                  {new Date(summary.createdAt || summary.timestamp || "").toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                              {summary.content && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadSummary(summary); }}
                                  style={{
                                    padding: "6px 12px", borderRadius: "6px",
                                    border: "1px solid rgba(139, 92, 246, 0.3)", backgroundColor: "rgba(139, 92, 246, 0.1)",
                                    color: "#8b5cf6", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: "4px",
                                  }}
                                >
                                  <Download style={{ width: "12px", height: "12px" }} />
                                </button>
                              )}
                              {isExpanded ? <ChevronUp size={18} style={{ color: "var(--foreground-muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--foreground-muted)" }} />}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{
                            marginTop: "16px", padding: "16px", borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)",
                            maxHeight: "400px", overflowY: "auto",
                          }}>
                            {summary.content && (
                              <div style={{ marginBottom: "12px" }}>
                                <ExportPDFButton title={`Summary: ${summary.title || summary.url || "Untitled"}`} />
                              </div>
                            )}
                            <pre style={{
                              fontSize: "13px", lineHeight: 1.6, color: "var(--foreground-muted)",
                              whiteSpace: "pre-wrap", wordWrap: "break-word", margin: 0, fontFamily: "inherit",
                            }}>
                              {summary.content || (summary.status === 'processing' ? 'Processing... check back shortly.' : 'No content available.')}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!historySearch.trim() && historyLimit < 50 && history.length >= historyLimit && (
                    <button
                      onClick={() => setHistoryLimit(historyLimit + 25)}
                      style={{
                        width: "100%", padding: "12px", marginTop: "8px", borderRadius: "8px",
                        border: "1px solid rgba(139, 92, 246, 0.3)", background: "transparent",
                        color: "#8b5cf6", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Show More
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </ProtectedRoute>
  );
}
