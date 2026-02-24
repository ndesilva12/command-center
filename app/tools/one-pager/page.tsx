"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { ExportPDFButton } from "@/components/tools/ExportPDFButton";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

export default function OnePagerPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('one-pager', 'One-Pager', '#7c3aed');
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

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
        collection(db, "one_pagers_history"),
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
        item.topic?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/one-pager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), save: true })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const startTime = Date.now();
        const maxWaitTime = 180000;
        const pollInterval = 2500;
        
        const pollForResults = async () => {
          if (Date.now() - startTime > maxWaitTime) {
            setLoading(false);
            alert("Research is taking longer than expected. Check history in a few minutes.");
            return;
          }
          
          const q = query(
            collection(db, "one_pagers_history"),
            orderBy("timestamp", "desc"),
            limit(5)
          );
          
          const snapshot = await getDocs(q);
          const recentResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          const matchingResult = recentResults.find((item: any) => 
            item.topic?.toLowerCase() === topic.trim().toLowerCase() &&
            new Date(item.timestamp).getTime() > startTime - 5000
          );
          
          if (matchingResult) {
            setResult(matchingResult);
            setLoading(false);
            loadHistory(historyLimit);
          } else {
            setTimeout(pollForResults, pollInterval);
          }
        };
        
        pollForResults();
      } else {
        alert(data.error || "Failed to start research");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start research");
      setLoading(false);
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main
          style={{
            flex: 1,
            minHeight: "100vh",
            paddingTop: isMobile ? "72px" : "80px",
            paddingBottom: isMobile ? "88px" : "24px",
            paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 16px)",
            paddingRight: isMobile ? "12px" : "16px",
          }}
        >
          <ToolBackground color={toolCustom.color} />
          
          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row",
            gap: "20px",
            height: isMobile ? "auto" : "calc(100vh - 104px)",
          }}>
            {/* Left Panel: Input + History */}
            <div style={{ 
              width: isMobile ? "100%" : "340px",
              minWidth: isMobile ? "100%" : "340px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "auto",
            }}>
              {/* Input Form */}
              <div className="glass card" style={{ padding: "20px" }}>
                <h2 style={{ marginBottom: "12px", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📑</span> One-Pager
                </h2>
                <p style={{ marginBottom: "16px", color: "var(--muted)", fontSize: "13px" }}>
                  Comprehensive summaries with Ron Paul lens
                </p>
                
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Federal Reserve, Iran-Contra..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "var(--glass-bg)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      marginBottom: "12px"
                    }}
                    disabled={loading}
                  />
                  
                  <button
                    type="submit"
                    disabled={loading || !topic.trim()}
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      borderRadius: "8px",
                      border: "none",
                      background: loading ? "var(--muted)" : `linear-gradient(135deg, ${toolCustom.color}, ${toolCustom.color}dd)`,
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer"
                    }}
                  >
                    {loading ? "Processing..." : "Generate"}
                  </button>
                </form>
              </div>

              {/* History */}
              {!loading && (
                <div className="glass card" style={{ padding: "16px", flex: 1, overflow: "auto", minHeight: isMobile ? "auto" : "0" }}>
                  <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700 }}>
                    History
                  </h3>

                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--glass-border)",
                      background: "var(--glass-bg)",
                      color: "var(--foreground)",
                      fontSize: "13px",
                      marginBottom: "12px"
                    }}
                  />

                  {filteredHistory.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                      {historySearch.trim() ? "No results" : "No one-pagers yet"}
                    </p>
                  ) : (
                    <>
                      {filteredHistory.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => setResult(item)}
                          style={{
                            padding: "10px",
                            marginBottom: "6px",
                            borderRadius: "6px",
                            background: result?.id === item.id ? `${toolCustom.color}15` : "var(--glass-bg)",
                            cursor: "pointer",
                            border: result?.id === item.id ? `1px solid ${toolCustom.color}40` : "1px solid transparent"
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>{item.topic || "Untitled"}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "?"}
                          </div>
                        </div>
                      ))}

                      {!historySearch.trim() && historyLimit < 50 && history.length >= historyLimit && (
                        <button
                          onClick={() => setHistoryLimit(historyLimit + 25)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            marginTop: "4px",
                            borderRadius: "6px",
                            border: "1px solid var(--glass-border)",
                            background: "transparent",
                            color: toolCustom.color,
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Load more
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Right Panel: Result */}
            <div style={{ 
              flex: 1,
              minWidth: 0,
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "auto",
              display: "flex",
              flexDirection: "column",
            }}>
              {result ? (
                <div className="glass card" style={{ padding: "24px", flex: 1, overflow: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
                      {result.topic}
                    </h3>
                    <ExportPDFButton title={`One-Pager: ${result.topic}`} />
                  </div>
                  
                  {/* Two column layout for larger screens */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                    {/* Left column */}
                    <div>
                      {/* Executive Summary */}
                      <div style={{ marginBottom: "24px", padding: "20px", background: "var(--glass-bg)", borderRadius: "10px" }}>
                        <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700, color: toolCustom.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          📋 Executive Summary
                        </h4>
                        <p style={{ fontSize: "15px", lineHeight: 1.8 }}>{result.executive_summary}</p>
                      </div>

                      {/* Key Points */}
                      {result.key_points && result.key_points.length > 0 && (
                        <div style={{ marginBottom: "24px" }}>
                          <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700, color: toolCustom.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            🎯 Key Points
                          </h4>
                          <ul style={{ paddingLeft: "20px", margin: 0 }}>
                            {result.key_points.map((point: string, i: number) => (
                              <li key={i} style={{ marginBottom: "10px", fontSize: "14px", lineHeight: 1.7 }}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Context */}
                      {result.context && (
                        <div>
                          <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700, color: toolCustom.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            🔍 Context & Implications
                          </h4>
                          <p style={{ fontSize: "14px", lineHeight: 1.8 }}>{result.context}</p>
                        </div>
                      )}
                    </div>

                    {/* Right column */}
                    <div>
                      {/* Key Data */}
                      {result.key_data && result.key_data.length > 0 && (
                        <div style={{ marginBottom: "24px", padding: "20px", background: "var(--glass-bg)", borderRadius: "10px" }}>
                          <h4 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: 700, color: toolCustom.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            📊 Key Data
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {result.key_data.map((item: any, i: number) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < result.key_data.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{item.metric}</span>
                                <span style={{ fontSize: "14px", fontWeight: 600 }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visual Concept */}
                      {result.visual_concept && (
                        <div style={{ marginBottom: "24px", padding: "16px", background: `${toolCustom.color}10`, borderRadius: "10px", borderLeft: `3px solid ${toolCustom.color}` }}>
                          <h4 style={{ marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: toolCustom.color }}>
                            📈 Visual Concept
                          </h4>
                          <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--muted)", lineHeight: 1.6 }}>{result.visual_concept}</p>
                        </div>
                      )}

                      {/* Further Reading */}
                      {result.further_reading && result.further_reading.length > 0 && (
                        <div>
                          <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700, color: toolCustom.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            📚 Further Reading
                          </h4>
                          {result.further_reading.map((link: any, i: number) => (
                            <div key={i} style={{ marginBottom: "12px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                              <a href={link.url} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "4px" }}>
                                {link.title}
                              </a>
                              {link.source && (
                                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                  {link.source}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass card" style={{ 
                  flex: 1, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "16px",
                  color: "var(--muted)"
                }}>
                  {loading ? (
                    <>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        border: "3px solid rgba(148, 163, 184, 0.2)",
                        borderTop: `3px solid ${toolCustom.color}`,
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }} />
                      <p style={{ fontSize: "14px", margin: 0 }}>Generating one-pager...</p>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "48px", opacity: 0.3 }}>📑</span>
                      <p style={{ fontSize: "15px", margin: 0 }}>Enter a topic to generate a one-pager</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
