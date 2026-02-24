"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { ExportPDFButton } from "@/components/tools/ExportPDFButton";
import { Mail, Search, MessageSquare, Clock, User, Calendar, FileText } from "lucide-react";

interface EmailResult {
  id: string;
  doc_id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  sent_at: string;
  content_markdown: string;
  to_recipients: string;
  cc_recipients: string;
}

interface SearchResult {
  query: string;
  mode: "keyword" | "jimmy";
  results: EmailResult[];
  timestamp: string;
  jimmy_response?: string;
}

export default function JMailPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('jmail', 'JMail', '#dc2626');
  const [keywordQuery, setKeywordQuery] = useState("");
  const [jimmyQuery, setJimmyQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [jimmyResponse, setJimmyResponse] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);
  const [selectedEmail, setSelectedEmail] = useState<EmailResult | null>(null);
  const [activeMode, setActiveMode] = useState<"keyword" | "jimmy" | null>(null);
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
        collection(db, "jmail_history"),
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
        (item.query || "").toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.results?.[0]?.subject || "").toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const handleKeywordSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordQuery.trim()) return;

    setLoading(true);
    setResults([]);
    setJimmyResponse("");
    setActiveMode("keyword");

    try {
      const response = await fetch("/api/jmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: keywordQuery.trim(),
          mode: "keyword"
        })
      });

      const data = await response.json();
      
      if (response.ok && data.results) {
        setResults(data.results);
        
        // Save to history
        await addDoc(collection(db, "jmail_history"), {
          query: keywordQuery.trim(),
          mode: "keyword",
          results: data.results,
          timestamp: new Date().toISOString()
        });
        
        loadHistory(historyLimit);
      } else {
        alert(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to search emails");
    } finally {
      setLoading(false);
    }
  };

  const handleJimmySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jimmyQuery.trim()) return;

    setLoading(true);
    setResults([]);
    setJimmyResponse("");
    setActiveMode("jimmy");

    try {
      const response = await fetch("/api/jmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: jimmyQuery.trim(),
          mode: "jimmy"
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.results) setResults(data.results);
        if (data.jimmy_response) setJimmyResponse(data.jimmy_response);
        
        // Save to history
        await addDoc(collection(db, "jmail_history"), {
          query: jimmyQuery.trim(),
          mode: "jimmy",
          results: data.results || [],
          jimmy_response: data.jimmy_response || "",
          timestamp: new Date().toISOString()
        });
        
        loadHistory(historyLimit);
      } else {
        alert(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to ask Jimmy");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: any) => {
    setActiveMode(item.mode);
    setResults(item.results || []);
    setJimmyResponse(item.jimmy_response || "");
    if (item.mode === "keyword") {
      setKeywordQuery(item.query);
    } else {
      setJimmyQuery(item.query);
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
            paddingBottom: isMobile ? "80px" : "16px",
            paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 24px)",
            paddingRight: isMobile ? "12px" : "20px",
          }}
        >
        <ToolBackground color={toolCustom.color} />
        
        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
          height: isMobile ? "auto" : "calc(100vh - 84px)",
        }}>
          {/* Left Panel: Search + History */}
          <div style={{ 
            width: isMobile ? "100%" : "300px",
            minWidth: isMobile ? "100%" : "300px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            height: isMobile ? "auto" : "100%",
            overflow: isMobile ? "visible" : "auto",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Mail size={28} style={{ color: toolCustom.color }} />
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
                  {toolCustom.name}
                </h1>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  193K Epstein emails (2002-2011)
                </p>
              </div>
            </div>

            {/* Keyword Search */}
            <div className="glass card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Search size={16} style={{ color: toolCustom.color }} />
                <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Keyword Search</h3>
              </div>
              <form onSubmit={handleKeywordSearch}>
                <input
                  type="text"
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  placeholder="Bill Clinton, Virgin Islands, flight..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--foreground)",
                    fontSize: "13px",
                    marginBottom: "10px"
                  }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !keywordQuery.trim()}
                  style={{
                    width: "100%",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: loading && activeMode === "keyword" ? "var(--muted)" : `linear-gradient(135deg, ${toolCustom.color}, #b91c1c)`,
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading || !keywordQuery.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {loading && activeMode === "keyword" ? "Searching..." : "Search"}
                </button>
              </form>
            </div>

            {/* Ask Jimmy */}
            <div className="glass card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <MessageSquare size={16} style={{ color: "#3b82f6" }} />
                <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Ask Jimmy</h3>
              </div>
              <form onSubmit={handleJimmySearch}>
                <input
                  type="text"
                  value={jimmyQuery}
                  onChange={(e) => setJimmyQuery(e.target.value)}
                  placeholder="Who did he email most about politics?"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--foreground)",
                    fontSize: "13px",
                    marginBottom: "10px"
                  }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !jimmyQuery.trim()}
                  style={{
                    width: "100%",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: loading && activeMode === "jimmy" ? "var(--muted)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading || !jimmyQuery.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {loading && activeMode === "jimmy" ? "Asking..." : "Ask Jimmy"}
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
                    {historySearch.trim() ? "No results" : "No searches yet"}
                  </p>
                ) : (
                  <>
                    {filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        style={{
                          padding: "10px",
                          marginBottom: "6px",
                          borderRadius: "6px",
                          background: "var(--glass-bg)",
                          cursor: "pointer",
                          border: "1px solid transparent"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                          {item.mode === "keyword" ? (
                            <Search size={12} style={{ color: toolCustom.color }} />
                          ) : (
                            <MessageSquare size={12} style={{ color: "#3b82f6" }} />
                          )}
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>{item.query}</div>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "18px" }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "?"} • {item.results?.length || 0} results
                        </div>
                      </div>
                    ))}
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
            {/* Jimmy Response */}
            {jimmyResponse && (
              <div className="glass card" style={{ padding: "14px", marginBottom: "16px", background: "rgba(59, 130, 246, 0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <MessageSquare size={18} style={{ color: "#3b82f6" }} />
                  <h4 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "#3b82f6" }}>Jimmy's Analysis</h4>
                </div>
                <div style={{ fontSize: "14px", lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--foreground)" }}>
                  {jimmyResponse}
                </div>
              </div>
            )}

            {/* Results */}
            {results.length > 0 ? (
              <div className="glass card" style={{ padding: "14px", flex: 1, overflow: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                    Results ({results.length})
                  </h3>
                  <ExportPDFButton title={`JMail: ${activeMode === "keyword" ? keywordQuery : jimmyQuery}`} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(400px, 1fr))", gap: "12px" }}>
                  {results.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        background: selectedEmail?.id === email.id ? "var(--glass-bg)" : "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${selectedEmail?.id === email.id ? toolCustom.color : "rgba(255,255,255,0.06)"}`,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                        <User size={16} style={{ color: toolCustom.color, marginTop: "2px" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>
                            {email.sender_name || email.sender_email}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {email.sender_email}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
                          <Calendar size={11} />
                          {new Date(email.sent_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ marginLeft: "28px" }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px", color: "var(--foreground)" }}>
                          {email.subject || "(No Subject)"}
                        </div>
                        
                        {email.to_recipients && (
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                            <strong>To:</strong> {email.to_recipients.substring(0, 60)}...
                          </div>
                        )}

                        {selectedEmail?.id === email.id && (
                          <div style={{
                            marginTop: "12px",
                            paddingTop: "12px",
                            borderTop: "1px solid var(--glass-border)",
                            fontSize: "13px",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                            maxHeight: "300px",
                            overflowY: "auto"
                          }}>
                            {email.content_markdown || "(No content)"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                    <p style={{ fontSize: "14px", margin: 0 }}>
                      {activeMode === "keyword" ? "Searching emails..." : "Asking Jimmy..."}
                    </p>
                  </>
                ) : (
                  <>
                    <Mail size={48} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: "15px", margin: 0 }}>Search 193K Epstein emails</p>
                    <p style={{ fontSize: "12px", margin: 0, opacity: 0.7 }}>Keyword search or ask Jimmy a question</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
