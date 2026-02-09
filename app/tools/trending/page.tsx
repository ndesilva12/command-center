"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, ExternalLink } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface TrendingTopic {
  title?: string;
  topic?: string;
  description?: string;
  searchUrl: string;
  source: "google" | "x";
}

export default function TrendingPage() {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
    const interval = setInterval(fetchTrends, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trending");
      if (!response.ok) throw new Error("Failed to fetch trending topics");
      const data = await response.json();
      setTrends(data.trends || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trending topics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="trending" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Trending {trends.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({trends.length})</span>}
            </h1>
          </div>
          
          <button
            onClick={fetchTrends}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--foreground-muted)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "13px",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button
                onClick={fetchTrends}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : trends.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <TrendingUp style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No trending topics
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                Unable to fetch trending topics at this time
              </p>
            </div>
          ) : (
            <div>
              {trends.map((trend, index) => (
                <a
                  key={index}
                  href={trend.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "start",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: index < trends.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                        {trend.title || trend.topic}
                      </h3>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: trend.source === "google" ? "#4285f4" : "#1da1f2",
                          backgroundColor: trend.source === "google" ? "rgba(66, 133, 244, 0.15)" : "rgba(29, 161, 242, 0.15)",
                          border: `1px solid ${trend.source === "google" ? "rgba(66, 133, 244, 0.3)" : "rgba(29, 161, 242, 0.3)"}`,
                          textTransform: "uppercase",
                        }}
                      >
                        {trend.source === "google" ? "Google" : "X"}
                      </span>
                    </div>
                    {trend.description && (
                      <p style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                        {trend.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0, marginLeft: "12px" }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
