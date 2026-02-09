"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TrendingUp, ExternalLink, RefreshCw, Loader2 } from "lucide-react";

interface TrendingTopic {
  topic?: string;
  title?: string;
  searchUrl: string;
  source: "google" | "x";
}

export default function TrendingPage() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trending");
      const data = await response.json();

      const googleTrends: TrendingTopic[] = (data.trends || []).map((t: { title: string; searchUrl: string }) => ({
        title: t.title,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));

      const xTrends: TrendingTopic[] = (data.topics || []).map((t: { topic: string; searchUrl: string }) => ({
        topic: t.topic,
        searchUrl: t.searchUrl,
        source: "x" as const,
      }));

      setTopics([...googleTrends, ...xTrends]);
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <TrendingUp style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Trending</h1>
            </div>
            <button onClick={fetchTrends} disabled={loading} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "var(--background)", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
              <RefreshCw style={{ width: "16px", height: "16px", animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {topics.map((topic, index) => (
                <a key={`${topic.source}-${index}`} href={topic.searchUrl} target="_blank" rel="noopener noreferrer" className="glass" style={{ display: "block", padding: "20px", borderRadius: "12px", textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                        {topic.title || topic.topic}
                      </div>
                      <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: "4px", background: topic.source === "google" ? "rgba(66, 133, 244, 0.15)" : "rgba(255, 255, 255, 0.1)", color: topic.source === "google" ? "#4285f4" : "var(--foreground-muted)", fontSize: "11px", fontWeight: 500 }}>
                        {topic.source === "google" ? "Google" : "X"}
                      </span>
                    </div>
                    <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                  </div>
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
