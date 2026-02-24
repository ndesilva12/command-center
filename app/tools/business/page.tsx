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

export default function BusinessPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('business', 'Business Intel', '#6366f1');
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
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
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

  useEffect(() => {
    loadHistory(historyLimit);
  }, [historyLimit]);

  const loadHistory = async (limitCount: number = 10) => {
    try {
      const q = query(
        collection(db, "business_history"),
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
        item.businessName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.location?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !location.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), location: location.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const startTime = Date.now();
        const maxWaitTime = 180000;
        const pollInterval = 3000;

        const pollForResults = async () => {
          if (Date.now() - startTime > maxWaitTime) {
            setLoading(false);
            alert("Investigation is taking longer than expected. Check history in a few minutes.");
            return;
          }

          const q = query(
            collection(db, "business_history"),
            orderBy("timestamp", "desc"),
            limit(5)
          );

          const snapshot = await getDocs(q);
          const recentResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const matchingResult = recentResults.find((item: any) =>
            item.businessName?.toLowerCase() === businessName.trim().toLowerCase() &&
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
        alert(data.error || "Failed to start investigation");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start investigation");
      setLoading(false);
    }
  };

  const renderResult = (data: any) => (
    <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
              🏢 {data.businessName}
            </h3>
            <ExportPDFButton title={`Business Intel: ${data.businessName}`} />
          </div>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>📍 {data.location}</p>
        </div>
        {data.confidenceScore != null && (
          <div style={{
            padding: "6px 14px",
            borderRadius: "20px",
            background: data.confidenceScore >= 70 ? "rgba(16, 185, 129, 0.15)" : data.confidenceScore >= 40 ? "rgba(245, 158, 11, 0.15)" : "rgba(220, 38, 38, 0.15)",
            color: data.confidenceScore >= 70 ? toolCustom.color : data.confidenceScore >= 40 ? "#f59e0b" : "#dc2626",
            fontSize: "13px",
            fontWeight: 700,
          }}>
            Confidence: {data.confidenceScore}%
          </div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "var(--glass-bg)", borderRadius: "8px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: toolCustom.color }}>Summary</h4>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--foreground)" }}>{data.summary}</p>
        </div>
      )}

      {/* Key Facts */}
      {data.keyFacts?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: toolCustom.color }}>📋 Key Facts</h4>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {data.keyFacts.map((fact: string, i: number) => (
              <li key={i} style={{ fontSize: "14px", lineHeight: 1.6, marginBottom: "4px", color: "var(--foreground)" }}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Officers */}
      {data.officers?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: toolCustom.color }}>👤 Officers / Principals</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.officers.map((officer: any, i: number) => (
              <div key={i} style={{ padding: "10px 14px", background: "var(--glass-bg)", borderRadius: "6px", fontSize: "14px" }}>
                <span style={{ fontWeight: 600 }}>{officer.name}</span>
                {officer.title && <span style={{ color: "var(--muted)" }}> — {officer.title}</span>}
                {officer.source && <span style={{ color: "var(--muted)", fontSize: "12px" }}> ({officer.source})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filings */}
      {data.filings?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: toolCustom.color }}>📄 Filings & Registrations</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Source</th>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Type</th>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Details</th>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {data.filings.map((filing: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "8px", color: "var(--foreground)" }}>{filing.source}</td>
                    <td style={{ padding: "8px", color: "var(--foreground)" }}>{filing.type}</td>
                    <td style={{ padding: "8px", color: "var(--foreground)" }}>{filing.details}</td>
                    <td style={{ padding: "8px" }}>
                      {filing.url && (
                        <a href={filing.url} target="_blank" rel="noopener noreferrer" style={{ color: toolCustom.color, textDecoration: "none" }}>
                          View →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Public Records */}
      {data.publicRecords?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: toolCustom.color }}>🔍 Public Records</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Source</th>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Type</th>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Summary</th>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: 600 }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {data.publicRecords.map((record: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "8px", color: "var(--foreground)" }}>{record.source}</td>
                    <td style={{ padding: "8px", color: "var(--foreground)" }}>{record.type}</td>
                    <td style={{ padding: "8px", color: "var(--foreground)" }}>{record.summary}</td>
                    <td style={{ padding: "8px" }}>
                      {record.url && (
                        <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: toolCustom.color, textDecoration: "none" }}>
                          View →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related Entities */}
      {data.relatedEntities?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: toolCustom.color }}>🔗 Related Entities</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {data.relatedEntities.map((entity: any, i: number) => (
              <div key={i} style={{
                padding: "8px 14px",
                background: "var(--glass-bg)",
                borderRadius: "6px",
                fontSize: "13px",
                border: "1px solid var(--glass-border)"
              }}>
                <span style={{ fontWeight: 600 }}>{entity.name}</span>
                <span style={{ color: "var(--muted)", marginLeft: "6px" }}>({entity.relationship})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspicious Findings */}
      {data.suspiciousFindings && (
        <div style={{
          marginBottom: "20px",
          padding: "16px",
          background: "rgba(220, 38, 38, 0.08)",
          border: "1px solid rgba(220, 38, 38, 0.25)",
          borderRadius: "8px"
        }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#dc2626" }}>
            🚨 Suspicious Findings
          </h4>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--foreground)", whiteSpace: "pre-wrap" }}>
            {data.suspiciousFindings}
          </p>
        </div>
      )}

      {/* AI Insights */}
      {data.insights && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "rgba(99, 102, 241, 0.08)", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: toolCustom.color }}>💡 AI Insights</h4>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--foreground)", whiteSpace: "pre-wrap" }}>{data.insights}</p>
        </div>
      )}

      {/* Sources */}
      {data.sources?.length > 0 && (
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "var(--muted)" }}>📎 Sources ({data.sources.length})</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {data.sources.map((source: any, i: number) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13px", color: toolCustom.color, textDecoration: "none" }}
              >
                {source.title || source.url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <TopNav />
      <BottomNav />
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main style={{ flex: 1, minHeight: "100vh", paddingTop: isMobile ? "72px" : "80px", paddingBottom: isMobile ? "88px" : "24px", paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 16px)", paddingRight: isMobile ? "12px" : "16px" }}>
        <ToolBackground color={toolCustom.color} />

        <div style={{ height: isMobile ? "auto" : "calc(100vh - 104px)", display: "flex", flexDirection: "column" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {(['search', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: activeTab === tab ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: activeTab === tab ? toolCustom.color : "var(--muted)",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {tab === 'search' ? '🔍 Search' : '📜 History'}
              </button>
            ))}
          </div>

          {/* Main content area */}
          <div style={{ flex: 1, overflow: "auto" }}>
          {activeTab === 'search' && (
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px", height: "100%" }}>
              {/* Left: Input Form */}
              <div style={{ width: isMobile ? "100%" : "380px", minWidth: isMobile ? "100%" : "380px" }}>
              <div className="glass card" style={{ padding: "20px" }}>
                <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 700 }}>
                  🕵️ {toolCustom.name}
                </h2>
                <p style={{ marginBottom: "20px", color: "var(--muted)", fontSize: "14px" }}>
                  Private business intelligence — public records, filings, ownership, and deep analysis
                </p>

                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Business name (e.g., Acme Construction LLC)"
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

                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g., Boston, MA or 123 Main St, Springfield, IL)"
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

                  <button
                    type="submit"
                    disabled={loading || !businessName.trim() || !location.trim()}
                    style={{
                      padding: "12px 24px",
                      borderRadius: "8px",
                      border: "none",
                      background: loading ? "var(--muted)" : "linear-gradient(135deg, #6366f1, #4f46e5)",
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer"
                    }}
                  >
                    {loading ? "🔍 Investigating... (polling for results)" : "Investigate Business"}
                  </button>
                </form>
              </div>
              </div>

              {/* Right: Result */}
              <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
                {result ? renderResult(result) : (
                  <div className="glass card" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", color: "var(--muted)" }}>
                    {loading ? (
                      <>
                        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(148, 163, 184, 0.2)", borderTop: `3px solid ${toolCustom.color}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        <p style={{ fontSize: "14px", margin: 0 }}>Investigating...</p>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "48px", opacity: 0.3 }}>🕵️</span>
                        <p style={{ fontSize: "15px", margin: 0 }}>Enter a business name and location to investigate</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="glass card" style={{ padding: "24px" }}>
              <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 700 }}>History</h3>

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
                  {historySearch.trim() ? "No results found" : "No investigations yet"}
                </p>
              ) : (
                <>
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => { setResult(item); setActiveTab('search'); }}
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
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>🏢 {item.businessName || "Untitled Business"}</div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                        {item.location ? `📍 ${item.location} • ` : ""}{item.timestamp ? new Date(item.timestamp).toLocaleString() : "Unknown date"}
                        {item.confidenceScore != null && ` • Confidence: ${item.confidenceScore}%`}
                      </div>
                      {item.summary && (
                        <div style={{ fontSize: "13px", color: "var(--foreground)", marginTop: "6px", opacity: 0.8 }}>
                          {item.summary.slice(0, 120)}...
                        </div>
                      )}
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
                      Show More
                    </button>
                  )}
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
