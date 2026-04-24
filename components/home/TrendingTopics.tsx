"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Loader2 } from "lucide-react";

interface TrendingTopic {
  text: string;
  source: "x" | "google";
}

export interface TrendingTopicsRef {
  refresh: () => void;
}

// Color schemes for each source - light blue and darker blue
const SOURCE_COLORS = {
  x: {
    bg: "rgba(0, 170, 255, 0.08)",
    border: "rgba(0, 170, 255, 0.15)",
    text: "rgba(255, 255, 255, 0.9)",
    hoverBg: "rgba(0, 170, 255, 0.15)",
    hoverBorder: "rgba(0, 170, 255, 0.28)",
  },
  google: {
    bg: "rgba(0, 100, 180, 0.12)",
    border: "rgba(0, 100, 180, 0.2)",
    text: "rgba(255, 255, 255, 0.9)",
    hoverBg: "rgba(0, 100, 180, 0.2)",
    hoverBorder: "rgba(0, 100, 180, 0.32)",
  },
};

export const TrendingTopics = forwardRef<TrendingTopicsRef, { onTagClick: (query: string, source: "x" | "google") => void }>(
  ({ onTagClick }, ref) => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchTrending();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchTrending,
  }));

  const fetchTrending = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/trending', {
        signal: controller.signal,
        next: { revalidate: 300 }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Get 10 from each source
      const xTopics: TrendingTopic[] = (data.xTrends || []).slice(0, 10).map((t: any) => ({
        text: t.topic || t.title,
        source: "x" as const
      }));

      const googleTopics: TrendingTopic[] = (data.googleTrends || []).slice(0, 10).map((t: any) => ({
        text: t.title || t.topic,
        source: "google" as const
      }));

      // Interleave them for visual variety
      const combined: TrendingTopic[] = [];
      const maxLen = Math.max(xTopics.length, googleTopics.length);
      for (let i = 0; i < maxLen; i++) {
        if (googleTopics[i]) combined.push(googleTopics[i]);
        if (xTopics[i]) combined.push(xTopics[i]);
      }
      
      if (combined.length > 0) {
        setTopics(combined);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching trending topics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
        <Loader2 
          style={{ 
            width: "20px", 
            height: "20px", 
            color: "rgba(255, 255, 255, 0.3)",
            animation: "spin 1s linear infinite" 
          }} 
        />
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || topics.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: isMobile ? "8px" : "10px",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: isMobile ? "0 12px" : "0",
    }}>
      {topics.slice(0, 20).map((topic, index) => {
        const colors = SOURCE_COLORS[topic.source];
        return (
          <button
            key={index}
            onClick={() => onTagClick(topic.text, topic.source)}
            style={{
              padding: isMobile ? "10px 16px" : "12px 20px",
              borderRadius: "12px",
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: colors.text,
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.hoverBg;
              e.currentTarget.style.borderColor = colors.hoverBorder;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.bg;
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            {topic.text}
          </button>
        );
      })}
    </div>
  );
});

TrendingTopics.displayName = "TrendingTopics";
