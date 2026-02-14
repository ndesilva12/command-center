"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FileText, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface Summary {
  id: string;
  url: string;
  title: string;
  targetPages: number;
  status: 'processing' | 'completed' | 'failed';
  content?: string;
  createdAt: string;
  completedAt?: string;
}

export default function SummarizerPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('summarizer', 'Summarizer', '#8b5cf6');
  
  const [url, setUrl] = useState("");
  const [targetPages, setTargetPages] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const { collection, getDocs, orderBy, query: fbQuery } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const q = fbQuery(collection(db, "summaries"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const sums: Summary[] = [];
      snapshot.forEach((doc) => {
        sums.push({ id: doc.id, ...doc.data() } as Summary);
      });
      setSummaries(sums);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }
    
    if (targetPages < 1 || targetPages > 100) {
      setError("Target pages must be between 1 and 100");
      return;
    }
    
    setProcessing(true);
    try {
      const response = await fetch("/api/summarizer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, targetPages }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create summary request");
      }
      
      setUrl("");
      setTargetPages(10);
      await fetchSummaries();
    } catch (error) {
      console.error("Error creating summary:", error);
      setError("Failed to create summary request");
    } finally {
      setProcessing(false);
    }
  };

  const downloadSummary = (summary: Summary) => {
    if (!summary.content) return;
    
    const blob = new Blob([summary.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.title || 'summary'}_${summary.targetPages}pages.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        minHeight: `calc(100vh - ${isMobile ? "160px" : "232px"})`
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "0 12px" : "0 24px"
        }}>
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
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

          {/* Input Form */}
          <div className="glass" style={{ padding: isMobile ? "20px" : "32px", borderRadius: "16px", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Create New Summary
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Content URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/... or https://example.com/article.pdf"
                  disabled={processing}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                />
                <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
                  PDFs, articles, books, YouTube videos (with captions), or podcasts (with transcripts)
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Target Pages: {targetPages}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={targetPages}
                  onChange={(e) => setTargetPages(parseInt(e.target.value))}
                  disabled={processing}
                  style={{
                    width: "100%",
                    accentColor: "#8b5cf6",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
                  <span>1 page</span>
                  <span>50 pages</span>
                </div>
              </div>

              {error && (
                <div style={{ 
                  padding: "12px", 
                  borderRadius: "8px", 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertCircle style={{ width: "16px", height: "16px", color: "#ef4444", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#ef4444" }}>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={processing || !url.trim()}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "none",
                  background: processing || !url.trim()
                    ? "rgba(139, 92, 246, 0.3)"
                    : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: processing || !url.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!processing && url.trim()) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {processing ? (
                  <>
                    <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText style={{ width: "18px", height: "18px" }} />
                    Create Summary
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Summaries List */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Recent Summaries
            </h2>
            
            {summaries.length === 0 ? (
              <div className="glass" style={{ padding: "48px 24px", borderRadius: "12px", textAlign: "center" }}>
                <FileText style={{ width: "48px", height: "48px", color: "#8b5cf6", margin: "0 auto 16px" }} />
                <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                  No summaries yet. Create your first summary above.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {summaries.map((summary) => (
                  <div
                    key={summary.id}
                    className="glass"
                    style={{
                      padding: "20px",
                      borderRadius: "12px",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                          {summary.title || summary.url}
                        </h3>
                        <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                          {summary.url}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          <span style={{ 
                            fontSize: "12px", 
                            padding: "4px 8px", 
                            borderRadius: "4px",
                            backgroundColor: "rgba(139, 92, 246, 0.1)",
                            color: "#8b5cf6",
                            border: "1px solid rgba(139, 92, 246, 0.3)"
                          }}>
                            {summary.targetPages} pages
                          </span>
                          <span style={{ 
                            fontSize: "12px", 
                            padding: "4px 8px", 
                            borderRadius: "4px",
                            backgroundColor: summary.status === 'completed' 
                              ? "rgba(16, 185, 129, 0.1)" 
                              : summary.status === 'failed'
                              ? "rgba(239, 68, 68, 0.1)"
                              : "rgba(0, 170, 255, 0.1)",
                            color: summary.status === 'completed' 
                              ? "#10b981" 
                              : summary.status === 'failed'
                              ? "#ef4444"
                              : "#00aaff",
                            border: `1px solid ${summary.status === 'completed' 
                              ? "rgba(16, 185, 129, 0.3)" 
                              : summary.status === 'failed'
                              ? "rgba(239, 68, 68, 0.3)"
                              : "rgba(0, 170, 255, 0.3)"}`,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {summary.status === 'completed' && <CheckCircle style={{ width: "12px", height: "12px" }} />}
                            {summary.status === 'processing' && <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />}
                            {summary.status === 'failed' && <AlertCircle style={{ width: "12px", height: "12px" }} />}
                            {summary.status === 'completed' ? 'Completed' : summary.status === 'failed' ? 'Failed' : 'Processing'}
                          </span>
                        </div>
                      </div>
                      
                      {summary.status === 'completed' && (
                        <button
                          onClick={() => downloadSummary(summary)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            backgroundColor: "rgba(139, 92, 246, 0.1)",
                            color: "#8b5cf6",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
                          }}
                        >
                          <Download style={{ width: "14px", height: "14px" }} />
                          Download
                        </button>
                      )}
                    </div>
                    
                    {summary.content && (
                      <div style={{
                        marginTop: "16px",
                        padding: "16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}>
                        <pre style={{
                          fontSize: "13px",
                          lineHeight: 1.6,
                          color: "var(--foreground-muted)",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                          margin: 0,
                          fontFamily: "inherit"
                        }}>
                          {summary.content.substring(0, 500)}...
                        </pre>
                      </div>
                    )}
                    
                    <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "12px" }}>
                      Created: {new Date(summary.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ProtectedRoute>
  );
}
