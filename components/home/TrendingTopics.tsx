"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { TrendingUp, Loader2 } from "lucide-react";

interface TrendingTopic {
  text: string;
  source: "x" | "google";
}

export interface TrendingTopicsRef {
  refresh: () => void;
}

export const TrendingTopics = forwardRef<TrendingTopicsRef, { onTagClick: (query: string) => void }>(
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
      // Add aggressive timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second max wait

      const response = await fetch('/api/trending', {
        signal: controller.signal,
        // Use client-side cache for 5 minutes
        next: { revalidate: 300 }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

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

      const combinedTopics = [...xTopics, ...googleTopics];
      
      if (combinedTopics.length > 0) {
        setTopics(combinedTopics);
      } else {
        // If no topics, consider it an error state
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching trending topics:', err);
      setError(true);
      // Don't show error to user, just hide the component gracefully
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner briefly (improves perceived performance)
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
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

  // Hide component if no topics or error
  if (error || topics.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: isMobile ? "6px" : "8px",
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
              gap: isMobile ? "4px" : "6px",
              padding: isMobile ? "6px 12px" : "8px 18px",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: topic.source === "x"
                ? "rgba(0, 170, 255, 0.08)"
                : "rgba(167, 139, 250, 0.08)",
              color: "var(--foreground)",
              fontSize: isMobile ? "13px" : "15px",
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
            <TrendingUp style={{ width: isMobile ? "12px" : "14px", height: isMobile ? "12px" : "14px" }} />
            {topic.text}
          </button>
        ))}
      </div>
    </div>
  );
});

TrendingTopics.displayName = "TrendingTopics";
