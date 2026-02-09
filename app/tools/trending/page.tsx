"use client";

import { useState, useEffect } from "react";
import { TrendingUp, ExternalLink, RefreshCw, Twitter, Search as SearchIcon } from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);
  const [filterSource, setFilterSource] = useState<"all" | "google" | "x">("all");

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trending');
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrends();
    setRefreshing(false);
  };

  const filteredTrends = filterSource === "all" 
    ? trends 
    : trends.filter(t => t.source === filterSource);

  const googleCount = trends.filter(t => t.source === "google").length;
  const xCount = trends.filter(t => t.source === "x").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "80px 20px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <TrendingUp size={48} style={{ color: "var(--primary)" }} />
            <div>
              <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>
                Trending
              </h1>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "4px" }}>
                Top {trends.length} trending topics
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.open('https://trends.google.com', '_blank')}
              style={{
                padding: "10px 20px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ExternalLink size={16} />
              Google Trends
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: "10px 20px",
                background: refreshing ? "var(--glass-bg)" : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: refreshing ? "1px solid var(--glass-border)" : "none",
                borderRadius: "8px",
                color: "white",
                cursor: refreshing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button
            onClick={() => setFilterSource("all")}
            style={{
              padding: "8px 16px",
              background: filterSource === "all" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--glass-bg)",
              border: filterSource === "all" ? "none" : "1px solid var(--glass-border)",
              borderRadius: "8px",
              color: filterSource === "all" ? "white" : "var(--foreground)",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            All ({trends.length})
          </button>
          
          <button
            onClick={() => setFilterSource("google")}
            style={{
              padding: "8px 16px",
              background: filterSource === "google" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--glass-bg)",
              border: filterSource === "google" ? "none" : "1px solid var(--glass-border)",
              borderRadius: "8px",
              color: filterSource === "google" ? "white" : "var(--foreground)",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <SearchIcon size={14} />
            Google ({googleCount})
          </button>
          
          <button
            onClick={() => setFilterSource("x")}
            style={{
              padding: "8px 16px",
              background: filterSource === "x" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--glass-bg)",
              border: filterSource === "x" ? "none" : "1px solid var(--glass-border)",
              borderRadius: "8px",
              color: filterSource === "x" ? "white" : "var(--foreground)",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Twitter size={14} />
            X ({xCount})
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>Loading trending topics...</p>
        ) : filteredTrends.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>No trending topics found</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "16px" }}>
            {filteredTrends.map((trend, idx) => (
              <a
                key={idx}
                href={trend.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  padding: "20px",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg-hover)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  padding: "4px 10px",
                  background: trend.source === "google" ? "rgba(66, 133, 244, 0.1)" : "rgba(29, 155, 240, 0.1)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: trend.source === "google" ? "#4285f4" : "#1d9bf0",
                  textTransform: "uppercase",
                }}>
                  {trend.source === "google" ? "Google" : "X"}
                </div>

                <div style={{ paddingRight: "60px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--foreground)", marginBottom: "8px", lineHeight: "1.3" }}>
                    {trend.title || trend.topic}
                  </h3>
                  
                  {trend.description && (
                    <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.5", marginTop: "8px" }}>
                      {trend.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "12px", color: "var(--primary)", fontWeight: "600" }}>
                  <ExternalLink size={12} />
                  Search this topic
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
