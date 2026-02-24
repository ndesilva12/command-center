"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { ExportPDFButton } from "@/components/tools/ExportPDFButton";

export default function L3DPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('l3d', 'L3D', '#6366f1');
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState(30);
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
        collection(db, "l3d_history"),
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
        item.query?.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.topic?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/l3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          days
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Fire-and-forget: Start polling Firestore for results
        const startTime = Date.now();
        const maxWaitTime = 180000; // 3 minutes
        const pollInterval = 2500; // 2.5 seconds
        
        const pollForResults = async () => {
          // Check if we've exceeded max wait time
          if (Date.now() - startTime > maxWaitTime) {
            setLoading(false);
            alert("Research is taking longer than expected. Check history in a few minutes.");
            return;
          }
          
          // Query Firestore for the most recent result matching our topic
          const q = query(
            collection(db, "l3d_history"),
            orderBy("timestamp", "desc"),
            limit(5)
          );
          
          const snapshot = await getDocs(q);
          const recentResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Find a result that matches our topic and was created after we started
          const matchingResult = recentResults.find((item: any) => 
            (item.query?.toLowerCase() === topic.trim().toLowerCase() ||
             item.topic?.toLowerCase() === topic.trim().toLowerCase()) &&
            new Date(item.timestamp).getTime() > startTime - 5000 // 5s buffer
          );
          
          if (matchingResult) {
            // Found result!
            setResult(matchingResult);
            setLoading(false);
            loadHistory(historyLimit);
          } else {
            // Keep polling
            setTimeout(pollForResults, pollInterval);
          }
        };
        
        // Start polling
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

  const categoryColors: Record<string, string> = {
    major_developments: "#ff6b6b",
    analysis_commentary: "#4ecdc4",
    discussions: toolCustom.color,
    data_research: "#95e1d3"
  };

  const categoryLabels: Record<string, string> = {
    major_developments: "📰 Major Developments",
    analysis_commentary: "🧠 Analysis & Commentary",
    discussions: "💬 Discussions",
    data_research: "📊 Data & Research"
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main style={{ flex: 1, minHeight: "100vh", paddingTop: isMobile ? "64px" : "68px", paddingBottom: isMobile ? "80px" : "16px", paddingLeft: isMobile ? "8px" : "calc(var(--sidebar-width, 240px) + 8px)", paddingRight: isMobile ? "8px" : "8px" }}>
          <ToolBackground color={toolCustom.color} />
        
          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row",
            gap: "12px",
            height: isMobile ? "auto" : "calc(100vh - 84px)",
          }}>
            {/* Left Panel: Input + History */}
            <div style={{ 
              width: isMobile ? "100%" : "280px",
              minWidth: isMobile ? "100%" : "280px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "auto",
            }}>
              {/* Input Form */}
              <div className="glass card" style={{ padding: "14px" }}>
                <h2 style={{ marginBottom: "12px", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📅</span> {toolCustom.name}
                </h2>
                <p style={{ marginBottom: "16px", color: "var(--muted)", fontSize: "13px" }}>
                  Recent developments with Ron Paul lens
                </p>
                
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Bitcoin ETF, Federal Reserve..."
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

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
                      Time Range
                    </label>
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--glass-border)",
                        background: "var(--glass-bg)",
                        color: "var(--foreground)",
                        fontSize: "13px"
                      }}
                      disabled={loading}
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={14}>Last 14 days</option>
                      <option value={30}>Last 30 days</option>
                      <option value={60}>Last 60 days</option>
                      <option value={90}>Last 90 days</option>
                    </select>
                  </div>
                  
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
                    {loading ? "Processing..." : "Research"}
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
                      {historySearch.trim() ? "No results" : "No research yet"}
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
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>
                            {item.query || item.topic || "Untitled"}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "?"} • {item.days || "?"} days
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
                <div className="glass card" style={{ padding: "16px", flex: 1, overflow: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
                      {result.topic}
                    </h3>
                    <ExportPDFButton title={`L3D: ${result.topic}`} />
                  </div>
                  <p style={{ marginBottom: "24px", fontSize: "13px", color: "var(--muted)" }}>
                    Last {result.days} days • {result.total_items || 0} items
                  </p>

                  {/* Key Takeaways - Full width */}
                  {result.key_takeaways && result.key_takeaways.length > 0 && (
                    <div style={{ 
                      marginBottom: "28px", 
                      padding: "14px", 
                      background: "var(--glass-bg)", 
                      borderRadius: "10px",
                      borderLeft: `4px solid ${toolCustom.color}`
                    }}>
                      <h4 style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700 }}>
                        🎯 Key Takeaways
                      </h4>
                      <ul style={{ paddingLeft: "20px", margin: 0, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "8px 24px" }}>
                        {result.key_takeaways.map((takeaway: string, i: number) => (
                          <li key={i} style={{ fontSize: "14px", lineHeight: 1.6 }}>
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Categories as Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "12px" }}>
                    {result.categories && Object.entries(result.categories).map(([category, items]: [string, any]) => {
                      if (!items || items.length === 0) return null;

                      return (
                        <div key={category} style={{ 
                          padding: "14px",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: "12px",
                          border: "1px solid rgba(255,255,255,0.06)"
                        }}>
                          <h4 style={{ 
                            marginBottom: "16px", 
                            fontSize: "14px", 
                            fontWeight: 700,
                            color: categoryColors[category] || toolCustom.color,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}>
                            {categoryLabels[category] || category}
                          </h4>
                          
                          {items.map((item: any, i: number) => (
                            <div 
                              key={i}
                              style={{
                                marginBottom: i < items.length - 1 ? "16px" : "0",
                                paddingBottom: i < items.length - 1 ? "16px" : "0",
                                borderBottom: i < items.length - 1 ? "1px solid var(--glass-border)" : "none"
                              }}
                            >
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  color: "var(--foreground)", 
                                  textDecoration: "none",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  display: "block",
                                  marginBottom: "6px",
                                  lineHeight: 1.4
                                }}
                              >
                                {item.title}
                              </a>
                              
                              {item.date && (
                                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "6px" }}>
                                  📅 {item.date} {item.source && `• ${item.source}`}
                                </div>
                              )}
                              
                              {item.summary && (
                                <p style={{ 
                                  fontSize: "12px", 
                                  color: "var(--muted)", 
                                  lineHeight: 1.5,
                                  marginBottom: "6px"
                                }}>
                                  {item.summary}
                                </p>
                              )}
                              
                              {item.worldview_note && (
                                <p style={{ 
                                  fontSize: "11px", 
                                  color: categoryColors[category] || toolCustom.color,
                                  fontStyle: "italic"
                                }}>
                                  💡 {item.worldview_note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
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
                      <p style={{ fontSize: "14px", margin: 0 }}>Researching...</p>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "48px", opacity: 0.3 }}>📅</span>
                      <p style={{ fontSize: "15px", margin: 0 }}>Enter a topic to research recent developments</p>
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
