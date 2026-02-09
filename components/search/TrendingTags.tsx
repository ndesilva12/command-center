"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { UnifiedSourceId } from "@/lib/unified-sources";

interface TrendingTopic {
  title?: string;
  topic?: string;
  searchUrl: string;
  source: "google" | "x";
}

interface TrendingTagsProps {
  onTagClick: (query: string, source: UnifiedSourceId) => void;
}

export function TrendingTags({ onTagClick }: TrendingTagsProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trending");
      const data = await response.json();

      const googleTrends: TrendingTopic[] = (data.trends || []).slice(0, 4).map((t: { title: string; searchUrl: string }) => ({
        title: t.title,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));

      const xTrends: TrendingTopic[] = (data.topics || []).slice(0, 4).map((t: { topic: string; searchUrl: string }) => ({
        topic: t.topic,
        searchUrl: t.searchUrl,
        source: "x" as const,
      }));

      // Interleave trends
      const mixed: TrendingTopic[] = [];
      const maxLen = Math.max(googleTrends.length, xTrends.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < googleTrends.length) mixed.push(googleTrends[i]);
        if (i < xTrends.length) mixed.push(xTrends[i]);
      }

      setTopics(mixed.slice(0, 8));
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <TrendingUp style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
        <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>Loading trends...</span>
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
            Trending Now
          </span>
        </div>
        <button
          onClick={fetchTrends}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            border: "none",
            background: "transparent",
            color: "var(--foreground-muted)",
            cursor: "pointer",
          }}
          title="Refresh"
        >
          <RefreshCw style={{ width: "14px", height: "14px" }} />
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {topics.map((topic, index) => (
          <button
            key={`${topic.source}-${index}`}
            onClick={() => onTagClick(topic.title || topic.topic || "", "news")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "20px",
              border: "1px solid var(--glass-border)",
              background: "rgba(255, 255, 255, 0.03)",
              color: "var(--foreground)",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.borderColor = "var(--glass-border)";
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: topic.source === "google" ? "#4285f4" : "#ffffff",
              }}
            />
            {topic.title || topic.topic}
          </button>
        ))}
      </div>
    </div>
  );
}
