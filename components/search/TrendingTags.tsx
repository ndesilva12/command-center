"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { UnifiedSourceId } from "@/lib/unified-sources";

interface TrendingTopic {
  title?: string;
  topic?: string;
  description?: string;
  searchUrl: string;
  source: "google" | "x";
}

interface TrendingTagsProps {
  onTagClick: (query: string, source: UnifiedSourceId) => void;
}

export function TrendingTags({ onTagClick }: TrendingTagsProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchTrends = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/trending", {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }

      const data = await response.json();

      // Get exactly 5 from each source to make 10 total
      const googleTrends = (data.googleTrends || []).slice(0, 5);
      const xTrends = (data.xTrends || []).slice(0, 5);

      // Merge and interleave to get exactly 10
      const merged: TrendingTopic[] = [];
      for (let i = 0; i < 5; i++) {
        if (googleTrends[i]) merged.push(googleTrends[i]);
        if (xTrends[i]) merged.push(xTrends[i]);
      }

      setTopics(merged.slice(0, 10));
    } catch (error) {
      console.error("Error fetching trends:", error);
      // Keep existing topics on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrends();
    
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchTrends, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && topics.length === 0) {
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
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            border: "none",
            background: "transparent",
            color: refreshing ? "var(--accent)" : "var(--foreground-muted)",
            cursor: refreshing ? "default" : "pointer",
            transition: "color 0.2s",
          }}
          title="Refresh trends"
        >
          <RefreshCw 
            style={{ 
              width: "14px", 
              height: "14px",
              animation: refreshing ? "spin 1s linear infinite" : "none"
            }} 
          />
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
        {topics.map((topic, index) => {
          const displayText = topic.title || topic.topic || "";
          const sourceColor = topic.source === "google" ? "#4285f4" : "#ffffff";
          
          return (
            <button
              key={`${topic.source}-${index}`}
              onClick={() => onTagClick(displayText, "news")}
              title={topic.description || displayText}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: isMobile ? "6px 12px" : "8px 14px",
                borderRadius: isMobile ? "16px" : "20px",
                border: "1px solid var(--glass-border)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "var(--foreground)",
                fontSize: isMobile ? "12px" : "13px",
                cursor: "pointer",
                transition: "all 0.15s",
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
                  background: sourceColor,
                  flexShrink: 0,
                }}
              />
              {displayText}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
