"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";

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
    discussions: "#00aaff",
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
      <div style={{ paddingTop: "144px", paddingBottom: "80px", minHeight: "calc(100vh - 144px)" }}>
        <TopNav />
        <ToolNav currentToolId="l3d" />
      <ToolBackground color={toolCustom.color} />
        
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 12px" }}>
          {/* Input Form */}
          <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 700 }}>
              📅 {toolCustom.name}
            </h2>
            <p style={{ marginBottom: "20px", color: "var(--muted)", fontSize: "14px" }}>
              Research recent developments with Ron Paul lens and intelligent analysis
            </p>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g., Bitcoin ETF, Federal Reserve, Ukraine conflict)"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  marginBottom: "16px"
                }}
                disabled={loading}
              />

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                  Time Range
                </label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--foreground)",
                    fontSize: "14px"
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
                {loading ? "Processing... (check history)" : "Research"}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ marginBottom: "8px", fontSize: "18px", fontWeight: 700 }}>
                {result.topic}
              </h3>
              <p style={{ marginBottom: "24px", fontSize: "13px", color: "var(--muted)" }}>
                Last {result.days} days • {result.total_items || 0} items
              </p>

              {/* Key Takeaways */}
              {result.key_takeaways && result.key_takeaways.length > 0 && (
                <div style={{ 
                  marginBottom: "32px", 
                  padding: "16px", 
                  background: "var(--glass-bg)", 
                  borderRadius: "8px",
                  borderLeft: "4px solid #00aaff"
                }}>
                  <h4 style={{ marginBottom: "12px", fontSize: "15px", fontWeight: 600 }}>
                    🎯 Key Takeaways
                  </h4>
                  <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {result.key_takeaways.map((takeaway: string, i: number) => (
                      <li key={i} style={{ marginBottom: "8px", fontSize: "14px", lineHeight: 1.6 }}>
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Categories */}
              {result.categories && Object.entries(result.categories).map(([category, items]: [string, any]) => {
                if (!items || items.length === 0) return null;

                return (
                  <div key={category} style={{ marginBottom: "32px" }}>
                    <h4 style={{ 
                      marginBottom: "16px", 
                      fontSize: "16px", 
                      fontWeight: 600,
                      color: categoryColors[category] || "#00aaff"
                    }}>
                      {categoryLabels[category] || category}
                    </h4>
                    
                    {items.map((item: any, i: number) => (
                      <div 
                        key={i}
                        style={{
                          marginBottom: "16px",
                          paddingBottom: "16px",
                          borderBottom: i < items.length - 1 ? "1px solid var(--glass-border)" : "none"
                        }}
                      >
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: "#00aaff", 
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "15px",
                            display: "block",
                            marginBottom: "6px"
                          }}
                        >
                          {item.title}
                        </a>
                        
                        {item.date && (
                          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px" }}>
                            📅 {item.date} {item.source && `• ${item.source}`}
                          </div>
                        )}
                        
                        {item.summary && (
                          <p style={{ 
                            fontSize: "13px", 
                            color: "var(--muted)", 
                            lineHeight: 1.5,
                            marginBottom: "6px"
                          }}>
                            {item.summary}
                          </p>
                        )}
                        
                        {item.worldview_note && (
                          <p style={{ 
                            fontSize: "12px", 
                            color: categoryColors[category] || "#00aaff",
                            fontStyle: "italic",
                            paddingLeft: "12px",
                            borderLeft: `2px solid ${categoryColors[category] || "#00aaff"}`
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
                  {historySearch.trim() ? "No results found" : "No research yet"}
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
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00aaff"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>
                        {item.query || item.topic}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                        {new Date(item.timestamp).toLocaleString()} • Last {item.days} days
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
                        color: "#00aaff",
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
      </div>
      <BottomNav />
    </>
  );
}
