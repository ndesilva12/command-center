"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

export default function OnePagerPage() {
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
      const response = await fetch("/api/one-pager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), save: true })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        loadHistory(historyLimit); // Reload history
      } else {
        alert(data.error || "Failed to generate one-pager");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate one-pager");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ paddingTop: "144px", paddingBottom: "80px", minHeight: "calc(100vh - 144px)" }}>
        <TopNav />
        <ToolNav currentToolId="one-pager" />
        
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 12px" }}>
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
                {loading ? "Researching..." : "Generate"}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: 700 }}>
                {result.topic}
              </h3>
              
              {/* Executive Summary */}
              <div style={{ marginBottom: "24px", padding: "16px", background: "var(--glass-bg)", borderRadius: "8px" }}>
                <h4 style={{ marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#00aaff" }}>
                  📋 EXECUTIVE SUMMARY
                </h4>
                <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{result.executive_summary}</p>
              </div>

              {/* Key Data */}
              {result.key_data && result.key_data.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#00aaff" }}>
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
                  <h4 style={{ marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#00aaff" }}>
                    📈 VISUAL CONCEPT
                  </h4>
                  <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--muted)" }}>{result.visual_concept}</p>
                </div>
              )}

              {/* Key Points */}
              {result.key_points && result.key_points.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#00aaff" }}>
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
                  <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#00aaff" }}>
                    🔍 CONTEXT & IMPLICATIONS
                  </h4>
                  <p style={{ fontSize: "14px", lineHeight: 1.7 }}>{result.context}</p>
                </div>
              )}

              {/* Further Reading */}
              {result.further_reading && result.further_reading.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#00aaff" }}>
                    📚 FURTHER READING
                  </h4>
                  {result.further_reading.map((link: any, i: number) => (
                    <div key={i} style={{ marginBottom: "12px", paddingLeft: "12px", borderLeft: "2px solid var(--glass-border)" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
                        {link.title}
                      </div>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" 
                         style={{ color: "#00aaff", fontSize: "12px", wordBreak: "break-all" }}>
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

              {/* Search */}
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
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00aaff"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{item.topic}</div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {/* Show More Button */}
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
