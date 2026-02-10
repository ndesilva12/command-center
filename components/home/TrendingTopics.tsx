"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

interface TrendingTopic {
  text: string;
  source: "x" | "google";
}

export function TrendingTopics({ onTagClick }: { onTagClick: (query: string) => void }) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trending');
      const data = await response.json();

      // Combine X and Google trends (top 5 from each)
      const xTopics: TrendingTopic[] = (data.xTrends || []).slice(0, 5).map((t: any) => ({
        text: t.topic || t.title,
        source: "x" as const
      }));

      const googleTopics: TrendingTopic[] = (data.googleTrends || []).slice(0, 5).map((t: any) => ({
        text: t.title || t.topic,
        source: "google" as const
      }));

      setTopics([...xTopics, ...googleTopics]);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || topics.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "8px",
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onTagClick(topic.text)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: topic.source === "x"
                ? "rgba(0, 170, 255, 0.08)"
                : "rgba(167, 139, 250, 0.08)",
              color: "var(--foreground)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = topic.source === "x"
                ? "rgba(0, 170, 255, 0.15)"
                : "rgba(167, 139, 250, 0.15)";
              e.currentTarget.style.borderColor = topic.source === "x"
                ? "rgba(0, 170, 255, 0.3)"
                : "rgba(167, 139, 250, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = topic.source === "x"
                ? "rgba(0, 170, 255, 0.08)"
                : "rgba(167, 139, 250, 0.08)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }}
          >
            <TrendingUp style={{ width: "12px", height: "12px" }} />
            {topic.text}
          </button>
        ))}
      </div>
    </div>
  );
}
