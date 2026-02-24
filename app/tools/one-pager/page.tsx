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
            paddingTop: isMobile ? "72px" : "76px",
            paddingBottom: isMobile ? "88px" : "24px",
            paddingLeft: isMobile ? "12px" : "24px",
            paddingRight: isMobile ? "12px" : "20px",
          }}
        >
          <ToolBackground color={toolCustom.color} />
          
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            {/* Input Form */}
            <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 700 }}>
                📑 One-Pager
              </h2>
              <p style={{ marginBottom: "20px", color: "var(--muted)", fontSize: "14px" }}>
                Generate comprehensive summaries with data, analysis, and Ron Paul lens
              </p>
              
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic (e.g., Federal Reserve monetary policy, Iran-Contra affair)"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--foreground)",
                    fontSize: "15px",
                    marginBottom: "12px"
                  }}
                  disabled={loading}
                />
                
                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: loading ? "var(--muted)" : "linear-gradient(135deg, #00aaff, #0088cc)",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Processing... (check history)" : "Generate"}
                </button>
              </form>
            </div>

            {/* Result */}
            {result && (
              <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                    {result.topic}
                  </h3>
                  <ExportPDFButton title={`One-Pager: ${result.topic}`} />
                </div>
                
                {/* Executive Summary */}
                <div style={{ marginBottom: "24px", padding: "16px", background: "var(--glass-bg)", borderRadius: "8px" }}>
                  <h4 style={{ marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: toolCustom.color }}>
                    📋 EXECUTIVE SUMMARY
                  </h4>
                  <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{result.executive_summary}</p>
                </div>

                {/* Key Data */}
                {result.key_data && result.key_data.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: toolCustom.color }}>
                      📊 KEY DATA
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {result.key_data.map((item: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                            <td style={{ padding: "10px", fontWeight: 600, fontSize: "14px" }}>{item.metric}</td>
                            <td style={{ padding: "10px", fontSize: "14px" }}>{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Visual Concept */}
                {result.visual_concept && (
                  <div style={{ marginBottom: "24px", padding: "16px", background: "var(--glass-bg)", borderRadius: "8px" }}>
                    <h4 style={{ marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: toolCustom.color }}>
                      📈 VISUAL CONCEPT
                    </h4>
                    <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--muted)" }}>{result.visual_concept}</p>
                  </div>
                )}

                {/* Key Points */}
                {result.key_points && result.key_points.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: toolCustom.color }}>
                      🎯 KEY POINTS
                    </h4>
                    <ul style={{ paddingLeft: "20px" }}>
                      {result.key_points.map((point: string, i: number) => (
                        <li key={i} style={{ marginBottom: "8px", fontSize: "14px", lineHeight: 1.6 }}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Context */}
                {result.context && (
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: toolCustom.color }}>
                      🔍 CONTEXT & IMPLICATIONS
                    </h4>
                    <p style={{ fontSize: "14px", lineHeight: 1.7 }}>{result.context}</p>
                  </div>
                )}

                {/* Further Reading */}
                {result.further_reading && result.further_reading.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: toolCustom.color }}>
                      📚 FURTHER READING
                    </h4>
                    {result.further_reading.map((link: any, i: number) => (
                      <div key={i} style={{ marginBottom: "12px", paddingLeft: "12px", borderLeft: "2px solid var(--glass-border)" }}>
                        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
                          {link.title}
                        </div>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" 
                           style={{ color: toolCustom.color, fontSize: "12px", wordBreak: "break-all" }}>
                          {link.url}
                        </a>
                        {link.source && (
                          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                            Source: {link.source}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {!loading && (
              <div className="glass card" style={{ padding: "24px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 700 }}>
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
                    borderRadius: "6px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    marginBottom: "16px"
                  }}
                />

                {filteredHistory.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                    {historySearch.trim() ? "No results found" : "No one-pagers yet"}
                  </p>
                ) : (
                  <>
                    {filteredHistory.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => setResult(item)}
                        style={{
                          padding: "12px",
                          marginBottom: "8px",
                          borderRadius: "6px",
                          background: "var(--glass-bg)",
                          cursor: "pointer",
                          border: "1px solid transparent"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = toolCustom.color}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                      >
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{item.topic || "Untitled One-Pager"}</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Unknown date"}
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
                          borderRadius: "6px",
                          border: "1px solid var(--glass-border)",
                          background: "transparent",
                          color: toolCustom.color,
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Show More (currently showing {historyLimit})
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
