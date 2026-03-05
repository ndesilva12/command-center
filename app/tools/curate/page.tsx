"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { ExportPDFButton } from "@/components/tools/ExportPDFButton";

export default function CuratePage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('curate', 'Curate', '#6366f1');
  const [topic, setTopic] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [count, setCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const deleteHistoryItem = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteDoc(doc(db, "curate_history", id));
      setHistory(prev => prev.filter(item => item.id !== id));
      if (result?.id === id) setResult(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete");
    }
  };

  const clearAllHistory = async () => {
    if (!confirm(`Delete all ${history.length} entries?`)) return;
    try {
      await Promise.all(history.map(item => deleteDoc(doc(db, "curate_history", item.id))));
      setHistory([]);
      setResult(null);
    } catch (error) {
      console.error("Error clearing history:", error);
      alert("Failed to clear history");
    }
  };

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
      
      if (response.ok && data.success && data.items) {
        // Use the returned data directly
        setResult(data);
        setLoading(false);
        loadHistory(historyLimit);
      } else if (response.ok && data.success) {
        // Fallback: poll Firestore if no items in response
        const startTime = Date.now();
        const maxWaitTime = 180000;
        const pollInterval = 2500;
        
        const pollForResults = async () => {
          if (Date.now() - startTime > maxWaitTime) {
            setLoading(false);
            alert("Curation is taking longer than expected. Check history in a few minutes.");
            return;
          }
          
          const q = query(
            collection(db, "curate_history"),
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
    short_popular: "#ff6b6b",
    short_unpopular: "#ffd93d",
    long_popular: "#4ecdc4",
    long_unpopular: "#a855f7",
    // Legacy
    popular: "#ff6b6b",
    technology: "#4ecdc4",
    politics: toolCustom.color,
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
      <TopNav />
      <BottomNav />
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main
          style={{
            flex: 1,
            minHeight: "100vh",
            paddingTop: isMobile ? "64px" : "68px",
            paddingBottom: isMobile ? "80px" : "16px",
            paddingLeft: isMobile ? "8px" : "calc(var(--sidebar-width, 240px) + 8px)",
            paddingRight: isMobile ? "8px" : "8px",
          }}
        >
          <ToolBackground color={toolCustom.color} />
          
          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row",
            gap: "12px",
            height: isMobile ? "auto" : "calc(100vh - 84px)",
          }}>
            {/* Left Panel: Input + History */}
            <div style={{ 
              width: isMobile ? "100%" : "300px",
              minWidth: isMobile ? "100%" : "300px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "auto",
            }}>
              {/* Input Form */}
              <div className="glass card" style={{ padding: "14px" }}>
                <h2 style={{ marginBottom: "12px", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: toolCustom.color }}>✨</span> {toolCustom.name}
                </h2>
                <p style={{ marginBottom: "16px", color: "var(--muted)", fontSize: "13px" }}>
                  Intelligent curation with Ron Paul lens
                </p>
                
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic (e.g., Bitcoin, Federal Reserve)"
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

                  {/* Source Filters */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
                      Sources (optional)
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {sourceOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleSource(option.value)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--glass-border)",
                            background: sources.includes(option.value) ? toolCustom.color : "transparent",
                            color: sources.includes(option.value) ? "#fff" : "var(--foreground)",
                            fontSize: "12px",
                            cursor: "pointer"
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Count Selector */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
                      Items
                    </label>
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
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
                    {loading ? "Processing..." : "Curate"}
                  </button>
                </form>
              </div>

              {/* History */}
              {!loading && (
                <div className="glass card" style={{ padding: "16px", flex: 1, overflow: "auto", minHeight: isMobile ? "auto" : "0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                      History
                    </h3>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {editMode && history.length > 0 && (
                        <button
                          onClick={clearAllHistory}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "none",
                            background: "transparent",
                            color: "#7c3aed",
                            cursor: "pointer",
                            fontSize: "11px"
                          }}
                        >
                          Clear All
                        </button>
                      )}
                      {history.length > 0 && (
                        <button
                          onClick={() => setEditMode(!editMode)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "none",
                            background: editMode ? toolCustom.color : "transparent",
                            color: editMode ? "#fff" : "var(--muted)",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 500
                          }}
                        >
                          {editMode ? "Done" : "Edit"}
                        </button>
                      )}
                    </div>
                  </div>

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
                      {historySearch.trim() ? "No results" : "No curations yet"}
                    </p>
                  ) : (
                    <>
                      {filteredHistory.map((item) => (
                        <div 
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "6px"
                          }}
                        >
                          <div 
                            onClick={() => setResult(item)}
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: "6px",
                              background: result?.id === item.id ? `${toolCustom.color}15` : "var(--glass-bg)",
                              cursor: "pointer",
                              border: result?.id === item.id ? `1px solid ${toolCustom.color}40` : "1px solid transparent"
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: "13px" }}>{item.topic || "Untitled"}</div>
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                              {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "?"} • {item.total || item.items?.length || 0} items
                            </div>
                          </div>
                          {editMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                              title="Delete"
                              style={{
                                padding: "6px 8px",
                                borderRadius: "4px",
                                border: "none",
                                background: "transparent",
                                color: "#7c3aed",
                                cursor: "pointer",
                                fontSize: "14px"
                              }}
                            >
                              🗑️
                            </button>
                          )}
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

            {/* Right Panel: Results */}
            <div style={{ 
              flex: 1,
              minWidth: 0,
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "auto",
              display: "flex",
              flexDirection: "column",
            }}>
              {result && result.items ? (
                <div className="glass card" style={{ padding: "16px", flex: 1, overflow: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
                      {result.topic}
                    </h3>
                    <ExportPDFButton title={`Curate: ${result.topic}`} />
                  </div>
                  
                  {/* Diversity Stats */}
                  {result.diversity && (
                    <div style={{ 
                      marginBottom: "24px", 
                      padding: "12px 16px", 
                      background: "var(--glass-bg)", 
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "var(--muted)",
                      display: "flex",
                      gap: "16px",
                      flexWrap: "wrap"
                    }}>
                      <span>🐦 {result.diversity.x_posts || 0} X</span>
                      <span>📹 {result.diversity.videos || 0} Videos</span>
                      <span>👽 {result.diversity.reddit || 0} Reddit</span>
                      <span>📰 {result.diversity.articles || 0} Articles</span>
                    </div>
                  )}

                  {/* Categories as Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "16px" }}>
                    {["short_popular", "short_unpopular", "long_popular", "long_unpopular"].map(category => {
                      const categoryItems = result.items.filter((item: any) => item.category === category);
                      if (categoryItems.length === 0) return null;

                      const categoryLabels: Record<string, string> = {
                        short_popular: "🔥 Short • Popular",
                        short_unpopular: "💡 Short • Contrarian",
                        long_popular: "📺 Long • Popular",
                        long_unpopular: "🧠 Long • Contrarian"
                      };

                      return (
                        <div key={category} style={{ 
                          padding: "14px",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: "12px",
                          border: "1px solid rgba(255,255,255,0.06)"
                        }}>
                          <h4 style={{ 
                            marginBottom: "16px", 
                            fontSize: "15px", 
                            fontWeight: 700,
                            color: categoryColors[category] || toolCustom.color,
                            textTransform: "none",
                            letterSpacing: "0.5px"
                          }}>
                            {categoryLabels[category] || category}
                          </h4>
                          
                          {categoryItems.map((item: any, i: number) => (
                            <div 
                              key={i}
                              style={{
                                marginBottom: i < categoryItems.length - 1 ? "16px" : "0",
                                paddingBottom: i < categoryItems.length - 1 ? "16px" : "0",
                                borderBottom: i < categoryItems.length - 1 ? "1px solid var(--glass-border)" : "none"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                <span style={{ fontSize: "16px", marginTop: "2px" }}>
                                  {sourceTypeEmojis[item.source_type] || "📄"}
                                </span>
                                <div style={{ flex: 1 }}>
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
                                  {item.excerpt && (
                                    <p style={{ 
                                      fontSize: "12px", 
                                      color: "var(--muted)", 
                                      lineHeight: 1.5,
                                      marginBottom: "6px"
                                    }}>
                                      {item.excerpt}
                                    </p>
                                  )}
                                  {item.why && (
                                    <p style={{ 
                                      fontSize: "11px", 
                                      color: categoryColors[category] || toolCustom.color,
                                      fontStyle: "italic"
                                    }}>
                                      💡 {item.why}
                                    </p>
                                  )}
                                </div>
                              </div>
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
                      <p style={{ fontSize: "14px", margin: 0 }}>Curating content...</p>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "48px", opacity: 0.3 }}>✨</span>
                      <p style={{ fontSize: "15px", margin: 0 }}>Enter a topic to curate content</p>
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
