"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

export default function CuratePage() {
  const [topic, setTopic] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [count, setCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);

  const sourceOptions = [
    { value: "x", label: "X (Twitter)" },
    { value: "reddit", label: "Reddit" },
    { value: "video", label: "Videos (YouTube)" },
    { value: "article", label: "Articles" },
  ];

  useEffect(() => {
    loadHistory(historyLimit);
  }, [historyLimit]);

  const loadHistory = async (limitCount: number = 10) => {
    try {
      const q = query(
        collection(db, "curate_history"),
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
      const response = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          sources: sources.length > 0 ? sources : null,
          count
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
            alert("Curation is taking longer than expected. Check history in a few minutes.");
            return;
          }
          
          // Query Firestore for the most recent result matching our topic
          const q = query(
            collection(db, "curate_history"),
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
        alert(data.error || "Failed to start curation");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start curation");
      setLoading(false);
    }
  };

  const toggleSource = (source: string) => {
    setSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const categoryColors: Record<string, string> = {
    popular: "#ff6b6b",
    technology: "#4ecdc4",
    politics: "#00aaff",
    culture: "#95e1d3"
  };

  const sourceTypeEmojis: Record<string, string> = {
    x: "🐦",
    video: "📹",
    reddit: "👽",
    article: "📰",
    podcast: "🎙️",
    pdf: "📄"
  };

  return (
    <>
      <div style={{ paddingTop: "144px", paddingBottom: "80px", minHeight: "calc(100vh - 144px)" }}>
        <TopNav />
        <ToolNav currentToolId="curate" />
        
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 12px" }}>
          {/* Input Form */}
          <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 700 }}>
              ✨ Curate
            </h2>
            <p style={{ marginBottom: "20px", color: "var(--muted)", fontSize: "14px" }}>
              Intelligent content curation with Ron Paul lens and diversity enforcement
            </p>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g., Bitcoin, Federal Reserve, Austrian Economics)"
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

              {/* Source Filters */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                  Source Types (optional - leave empty for diverse mix)
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {sourceOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleSource(option.value)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--glass-border)",
                        background: sources.includes(option.value) ? "#00aaff" : "transparent",
                        color: sources.includes(option.value) ? "#fff" : "var(--foreground)",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count Selector */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                  Number of Items (must be multiple of 4)
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
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
                  <option value={4}>4 items</option>
                  <option value={8}>8 items</option>
                  <option value={12}>12 items</option>
                  <option value={16}>16 items</option>
                  <option value={20}>20 items</option>
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
                {loading ? "Processing... (check history)" : "Curate Content"}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && result.items && (
            <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: 700 }}>
                {result.topic}
              </h3>
              
              {/* Diversity Stats */}
              {result.diversity && (
                <div style={{ 
                  marginBottom: "24px", 
                  padding: "12px", 
                  background: "var(--glass-bg)", 
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "var(--muted)"
                }}>
                  Mix: {result.diversity.x_posts || 0} X posts • {result.diversity.videos || 0} videos • {result.diversity.reddit || 0} Reddit • {result.diversity.articles || 0} articles
                </div>
              )}

              {/* Categories */}
              {["popular", "technology", "politics", "culture"].map(category => {
                const categoryItems = result.items.filter((item: any) => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} style={{ marginBottom: "32px" }}>
                    <h4 style={{ 
                      marginBottom: "16px", 
                      fontSize: "16px", 
                      fontWeight: 600,
                      color: categoryColors[category] || "#00aaff",
                      textTransform: "capitalize"
                    }}>
                      {category}
                    </h4>
                    
                    {categoryItems.map((item: any, i: number) => (
                      <div 
                        key={i}
                        style={{
                          marginBottom: "16px",
                          paddingBottom: "16px",
                          borderBottom: i < categoryItems.length - 1 ? "1px solid var(--glass-border)" : "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "18px" }}>
                            {sourceTypeEmojis[item.source_type] || "📄"}
                          </span>
                          <div style={{ flex: 1 }}>
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
                            {item.excerpt && (
                              <p style={{ 
                                fontSize: "13px", 
                                color: "var(--muted)", 
                                lineHeight: 1.5,
                                marginBottom: "6px"
                              }}>
                                {item.excerpt}
                              </p>
                            )}
                            {item.why && (
                              <p style={{ 
                                fontSize: "12px", 
                                color: "var(--muted)", 
                                fontStyle: "italic"
                              }}>
                                💡 {item.why}
                              </p>
                            )}
                            {item.score && (
                              <div style={{ 
                                fontSize: "12px", 
                                color: categoryColors[category] || "#00aaff",
                                marginTop: "4px"
                              }}>
                                Score: {item.score}/10
                              </div>
                            )}
                          </div>
                        </div>
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
                  {historySearch.trim() ? "No results found" : "No curations yet"}
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
                        {new Date(item.timestamp).toLocaleString()} • {item.total || item.items?.length || 0} items
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
