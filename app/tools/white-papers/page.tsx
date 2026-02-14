"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";

export default function WhitePapersPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('white-papers', 'White Papers', '#6366f1');
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);

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
      <div style={{ paddingTop: "144px", paddingBottom: "80px", minHeight: "calc(100vh - 144px)" }}>
        <TopNav />
        <ToolNav currentToolId="white-papers" />
      <ToolBackground color={toolCustom.color} />
        
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 12px" }}>
          {/* Input Form */}
          <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 700 }}>
              📄 {toolCustom.name}
            </h2>
            <p style={{ marginBottom: "20px", color: "var(--muted)", fontSize: "14px" }}>
              Find 6 relevant white papers on any topic (3 general + 3 worldview-aligned)
            </p>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g., Bitcoin monetary policy, Austrian business cycle theory)"
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
                {loading ? "Processing... (check history)" : "Find Papers"}
              </button>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: 700 }}>
                Results: {result.topic}
              </h3>
              
              {/* Worldview-Aligned */}
              <h4 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: 600, color: "#00aaff" }}>
                🎯 Worldview-Aligned (3)
              </h4>
              {result.papers?.worldview_aligned?.map((paper: any, i: number) => (
                <div key={i} style={{ marginBottom: "16px", paddingLeft: "12px", borderLeft: "2px solid #00aaff" }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                    {i + 1}. {paper.title}
                  </div>
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" 
                     style={{ color: "#00aaff", fontSize: "13px", wordBreak: "break-all" }}>
                    {paper.url}
                  </a>
                  {paper.description && (
                    <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
                      {paper.description}
                    </div>
                  )}
                </div>
              ))}

              {/* General */}
              <h4 style={{ marginTop: "24px", marginBottom: "12px", fontSize: "16px", fontWeight: 600 }}>
                📊 General / Popular (3)
              </h4>
              {result.papers?.general_popular?.map((paper: any, i: number) => (
                <div key={i} style={{ marginBottom: "16px", paddingLeft: "12px", borderLeft: "2px solid var(--muted)" }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                    {i + 1}. {paper.title}
                  </div>
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" 
                     style={{ color: "#00aaff", fontSize: "13px", wordBreak: "break-all" }}>
                    {paper.url}
                  </a>
                  {paper.description && (
                    <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
                      {paper.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* History - Show by default when no result */}
          {!result && history.length > 0 && (
            <div className="glass card" style={{ padding: "24px" }}>
              <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 700 }}>
                History
              </h3>
              
              {/* Search Input */}
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  borderRadius: "6px",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                  color: "var(--foreground)",
                  fontSize: "14px"
                }}
              />
              
              {/* History Items */}
              {filteredHistory.length > 0 ? (
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
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00aaff"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      <div style={{ fontWeight: 600 }}>{item.topic}</div>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(item.timestamp).toLocaleString()} • {item.total} papers
                      </div>
                    </div>
                  ))}
                  
                  {/* Show More Button */}
                  {!historySearch && historyLimit < 50 && (
                    <button
                      onClick={() => setHistoryLimit(historyLimit + 25)}
                      style={{
                        width: "100%",
                        marginTop: "12px",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid var(--glass-border)",
                        background: "transparent",
                        color: "var(--foreground)",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      Show More
                    </button>
                  )}
                </>
              ) : (
                <div style={{ fontSize: "14px", color: "var(--muted)", textAlign: "center", padding: "20px" }}>
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
