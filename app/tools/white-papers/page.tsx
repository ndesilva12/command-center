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

export default function WhitePapersPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('white-papers', 'White Papers', '#6366f1');
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
        collection(db, "white_papers_history"),
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
  
  // Filter history based on search
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
      const response = await fetch("/api/white-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), save: true })
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
            collection(db, "white_papers_history"),
            orderBy("timestamp", "desc"),
            limit(5)
          );
          
          const snapshot = await getDocs(q);
          const recentResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Find a result that matches our topic and was created after we started
          const matchingResult = recentResults.find((item: any) => 
            item.topic?.toLowerCase() === topic.trim().toLowerCase() &&
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

  return (
    <>
      <TopNav />
      <BottomNav />
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main style={{ flex: 1, minHeight: "100vh", paddingTop: isMobile ? "72px" : "80px", paddingBottom: isMobile ? "88px" : "24px", paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 16px)", paddingRight: isMobile ? "12px" : "16px" }}>
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
                <span>📄</span> {toolCustom.name}
              </h2>
              <p style={{ marginBottom: "16px", color: "var(--muted)", fontSize: "13px" }}>
                6 white papers (3 general + 3 worldview-aligned)
              </p>
              
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Bitcoin monetary policy, Austrian economics..."
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
                  {loading ? "Processing..." : "Find Papers"}
                </button>
              </form>
            </div>

            {/* History */}
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
                  {historySearch.trim() ? "No results" : "No papers yet"}
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
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "?"} • {item.total || 0} papers
                      </div>
                    </div>
                  ))}
                  
                  {!historySearch && historyLimit < 50 && history.length >= historyLimit && (
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
          </div>

          {/* Right Panel: Results */}
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
                  <ExportPDFButton title={`White Papers: ${result.topic}`} />
                </div>
                
                {/* Two column layout */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                  {/* Worldview-Aligned */}
                  <div style={{ padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h4 style={{ marginBottom: "16px", fontSize: "15px", fontWeight: 700, color: toolCustom.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      🎯 Worldview-Aligned
                    </h4>
                    {result.papers?.worldview_aligned?.map((paper: any, i: number) => (
                      <div key={i} style={{ marginBottom: i < result.papers.worldview_aligned.length - 1 ? "16px" : "0", paddingBottom: i < result.papers.worldview_aligned.length - 1 ? "16px" : "0", borderBottom: i < result.papers.worldview_aligned.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                        <a href={paper.url} target="_blank" rel="noopener noreferrer" 
                           style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "block", marginBottom: "6px", lineHeight: 1.4 }}>
                          {paper.title}
                        </a>
                        {paper.description && (
                          <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                            {paper.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* General */}
                  <div style={{ padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h4 style={{ marginBottom: "16px", fontSize: "15px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      📊 General / Popular
                    </h4>
                    {result.papers?.general_popular?.map((paper: any, i: number) => (
                      <div key={i} style={{ marginBottom: i < result.papers.general_popular.length - 1 ? "16px" : "0", paddingBottom: i < result.papers.general_popular.length - 1 ? "16px" : "0", borderBottom: i < result.papers.general_popular.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                        <a href={paper.url} target="_blank" rel="noopener noreferrer" 
                           style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "block", marginBottom: "6px", lineHeight: 1.4 }}>
                          {paper.title}
                        </a>
                        {paper.description && (
                          <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                            {paper.description}
                          </div>
                        )}
                      </div>
                    ))}
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
                    <p style={{ fontSize: "14px", margin: 0 }}>Finding papers...</p>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "48px", opacity: 0.3 }}>📄</span>
                    <p style={{ fontSize: "15px", margin: 0 }}>Enter a topic to find white papers</p>
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
