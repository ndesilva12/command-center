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
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
        gap: isMobile ? "8px" : "10px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onTagClick(topic.text)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? "6px 10px" : "8px 12px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              color: "#93c5fd",
              fontSize: isMobile ? "12px" : "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#bfdbfe";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#93c5fd";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{topic.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

TrendingTopics.displayName = "TrendingTopics";
