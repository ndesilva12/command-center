"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { ExportPDFButton } from "@/components/tools/ExportPDFButton";

function PoliticalCompass({ economicScore, governmentScore, color = "#10b981" }: { economicScore: number; governmentScore: number; color?: string }) {
  const cx = 150 + (economicScore / 100) * 130;
  const cy = 150 + (governmentScore / 100) * 130;

  return (
    <svg width="300" height="300" viewBox="0 0 300 300" style={{ background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
      {/* Grid */}
      <rect x="20" y="20" width="260" height="260" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="150" y1="20" x2="150" y2="280" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1="20" y1="150" x2="280" y2="150" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* Quadrant fills */}
      <rect x="20" y="20" width="130" height="130" fill="rgba(239,68,68,0.08)" />
      <rect x="150" y="20" width="130" height="130" fill="rgba(59,130,246,0.08)" />
      <rect x="20" y="150" width="130" height="130" fill="rgba(16,185,129,0.08)" />
      <rect x="150" y="150" width="130" height="130" fill="rgba(168,85,247,0.08)" />

      {/* Labels */}
      <text x="85" y="45" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="600">Auth-Left</text>
      <text x="215" y="45" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="600">Auth-Right</text>
      <text x="85" y="270" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="600">Lib-Left</text>
      <text x="215" y="270" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="600">Lib-Right</text>

      {/* Axis labels */}
      <text x="150" y="14" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">Authoritarian</text>
      <text x="150" y="296" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">Libertarian</text>
      <text x="10" y="153" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" transform="rotate(-90,10,153)">Left</text>
      <text x="295" y="153" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" transform="rotate(90,295,153)">Right</text>

      {/* Dot */}
      <circle cx={cx} cy={cy} r="8" fill={color} stroke="#fff" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="3" fill="#fff" />
    </svg>
  );
}

function LeaningBadge({ leaning, confidence }: { leaning: string; confidence: number }) {
  const colorMap: Record<string, string> = {
    "Far Left": "#dc2626",
    "Left": "#ef4444",
    "Center-Left": "#f97316",
    "Center": "#a855f7",
    "Center-Right": "#10b981",
    "Right": "#2563eb",
    "Far Right": "#1d4ed8",
  };
  const color = colorMap[leaning] || "#6b7280";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
      <span style={{
        padding: "6px 16px",
        borderRadius: "20px",
        background: `${color}30`,
        border: `1px solid ${color}60`,
        color,
        fontWeight: 700,
        fontSize: "15px"
      }}>
        {leaning}
      </span>
      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
        {confidence}% confidence
      </span>
    </div>
  );
}

export default function PoliticorpPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('politicorp', 'Politicorp', '#10b981');
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<"result" | "history">("result");

  useEffect(() => {
    loadHistory(historyLimit);
  }, [historyLimit]);

  const loadHistory = async (limitCount: number = 10) => {
    try {
      const q = query(
        collection(db, "politicorp_history"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const filteredHistory = historySearch.trim()
    ? history.filter(item =>
        item.companyName?.toLowerCase().includes(historySearch.toLowerCase())
      )
    : history;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setResult(null);
    setActiveTab("result");

    try {
      const response = await fetch("/api/politicorp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const startTime = Date.now();
        const maxWaitTime = 180000;
        const pollInterval = 3000;

        const pollForResults = async () => {
          if (Date.now() - startTime > maxWaitTime) {
            setLoading(false);
            alert("Analysis is taking longer than expected. Check history in a few minutes.");
            return;
          }

          const q = query(
            collection(db, "politicorp_history"),
            orderBy("timestamp", "desc"),
            limit(5)
          );

          const snapshot = await getDocs(q);
          const recentResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const matchingResult = recentResults.find((item: any) =>
            item.companyName?.toLowerCase() === company.trim().toLowerCase() &&
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
        alert(data.error || "Failed to start analysis");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start analysis");
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ paddingTop: "144px", paddingBottom: "80px", minHeight: "calc(100vh - 144px)" }}>
        <TopNav />
        <ToolNav currentToolId="politicorp" />
        <ToolBackground color={toolCustom.color} />

        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 12px" }}>
          {/* Input Form */}
          <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 700 }}>
              🏛️ {toolCustom.name}
            </h2>
            <p style={{ marginBottom: "20px", color: "var(--muted)", fontSize: "14px" }}>
              Corporate political analysis — donations, lobbying, executive statements, and political compass
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter company name (e.g., Google, Goldman Sachs, Lockheed Martin)"
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
                disabled={loading || !company.trim()}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: loading ? "var(--muted)" : `linear-gradient(135deg, ${toolCustom.color}, ${toolCustom.color}cc)`,
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Analyzing... (polling for results)" : "Analyze Company"}
              </button>
            </form>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {(["result", "history"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "6px",
                  border: "1px solid var(--glass-border)",
                  background: activeTab === tab ? toolCustom.color : "transparent",
                  color: activeTab === tab ? "#fff" : "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Result Tab */}
          {activeTab === "result" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Compass + Overview */}
              <div className="glass card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>{result.companyName}</h3>
                  <ExportPDFButton title={`Politicorp: ${result.companyName}`} />
                </div>
                {result.ticker && <span style={{ color: "var(--muted)", fontSize: "13px" }}>{result.ticker} • </span>}
                <span style={{ color: "var(--muted)", fontSize: "13px" }}>{result.industry}</span>
                <p style={{ marginTop: "8px", marginBottom: "16px", fontSize: "14px", color: "var(--muted)" }}>{result.description}</p>

                <LeaningBadge leaning={result.overallLeaning} confidence={result.confidenceScore} />

                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <PoliticalCompass economicScore={result.economicScore || 0} governmentScore={result.governmentScore || 0} color={toolCustom.color} />
                </div>
                <div style={{ textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
                  Economic: {result.economicScore} • Government: {result.governmentScore}
                </div>
              </div>

              {/* Positions */}
              {result.positions?.length > 0 && (
                <div className="glass card" style={{ padding: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>📋 Policy Positions</h4>
                  {result.positions.map((p: any, i: number) => (
                    <div key={i} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: i < result.positions.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{p.topic} — <span style={{ color: toolCustom.color }}>{p.stance}</span></div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{p.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Donations */}
              {result.donations?.length > 0 && (
                <div className="glass card" style={{ padding: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>💰 Political Donations</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)" }}>Recipient</th>
                          <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)" }}>Amount</th>
                          <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)" }}>Party</th>
                          <th style={{ textAlign: "left", padding: "8px", color: "var(--muted)" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.donations.map((d: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                            <td style={{ padding: "8px" }}>{d.recipient}</td>
                            <td style={{ padding: "8px" }}>{d.amount}</td>
                            <td style={{ padding: "8px" }}>
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "12px",
                                background: d.party === "Democrat" ? "rgba(59,130,246,0.2)" : d.party === "Republican" ? "rgba(239,68,68,0.2)" : "rgba(168,85,247,0.2)",
                                color: d.party === "Democrat" ? toolCustom.color : d.party === "Republican" ? "#ef4444" : "#a855f7"
                              }}>
                                {d.party}
                              </span>
                            </td>
                            <td style={{ padding: "8px", color: "var(--muted)" }}>{d.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Public Statements */}
              {result.publicStatements?.length > 0 && (
                <div className="glass card" style={{ padding: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>🎙️ Public Statements</h4>
                  {result.publicStatements.map((s: any, i: number) => (
                    <div key={i} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: i < result.publicStatements.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{s.speaker} <span style={{ fontWeight: 400, color: "var(--muted)" }}>— {s.role}</span></div>
                      <blockquote style={{ margin: "8px 0", paddingLeft: "12px", borderLeft: `3px solid ${toolCustom.color}`, fontSize: "13px", fontStyle: "italic" }}>
                        &ldquo;{s.statement}&rdquo;
                      </blockquote>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>{s.topic} • {s.date}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lobbying */}
              {result.lobbyingActivities?.length > 0 && (
                <div className="glass card" style={{ padding: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>🏛️ Lobbying Activities</h4>
                  {result.lobbyingActivities.map((l: any, i: number) => (
                    <div key={i} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: i < result.lobbyingActivities.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{l.issue}</span>
                        <span style={{ fontSize: "13px", color: toolCustom.color }}>{l.amount} ({l.year})</span>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{l.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* News */}
              {result.newsItems?.length > 0 && (
                <div className="glass card" style={{ padding: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>📰 News</h4>
                  {result.newsItems.map((n: any, i: number) => (
                    <div key={i} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: i < result.newsItems.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{n.headline}</div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                        {n.source} • {n.date} •{" "}
                        <span style={{
                          color: n.sentiment === "positive" ? toolCustom.color : n.sentiment === "negative" ? "#ef4444" : "var(--muted)"
                        }}>
                          {n.sentiment}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{n.summary}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subsidiaries & Affiliates */}
              {(result.subsidiaries?.length > 0 || result.affiliates?.length > 0) && (
                <div className="glass card" style={{ padding: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>🏢 Subsidiaries & Affiliates</h4>
                  {result.subsidiaries?.map((s: any, i: number) => (
                    <div key={`sub-${i}`} style={{ marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>{s.name}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}> — {s.industry}</span>
                      <div style={{ fontSize: "13px", color: "var(--muted)" }}>{s.description}</div>
                    </div>
                  ))}
                  {result.affiliates?.map((a: any, i: number) => (
                    <div key={`aff-${i}`} style={{ marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>{a.name}</span>
                      <span style={{ fontSize: "12px", color: toolCustom.color }}> — {a.relationship}</span>
                      <div style={{ fontSize: "13px", color: "var(--muted)" }}>{a.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "result" && !result && !loading && (
            <div className="glass card" style={{ padding: "48px", textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>Enter a company name to analyze its political leanings</p>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
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
                  {historySearch.trim() ? "No results found" : "No analyses yet"}
                </p>
              ) : (
                <>
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => { setResult(item); setActiveTab("result"); }}
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{item.companyName || "Untitled Company"}</div>
                        {item.overallLeaning && (
                          <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "10px", background: "rgba(255,255,255,0.1)" }}>
                            {item.overallLeaning}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Unknown date"} {item.confidenceScore != null ? `• Confidence: ${item.confidenceScore}%` : ""}
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
      </div>
      <BottomNav />
    </>
  );
}
