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
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
        <Loader2 
          style={{ 
            width: "16px", 
            height: "16px", 
            color: "rgba(255, 255, 255, 0.2)",
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
      gap: isMobile ? "6px 12px" : "8px 20px",
      maxWidth: "900px",
      margin: "0 auto",
    }}>
      {topics.slice(0, isMobile ? 6 : 10).map((topic, index) => (
        <button
          key={index}
          onClick={() => onTagClick(topic.text)}
          style={{
            padding: "4px 0",
            border: "none",
            background: "transparent",
            color: "rgba(147, 197, 253, 0.7)",
            fontSize: isMobile ? "12px" : "13px",
            fontWeight: 400,
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#93c5fd";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(147, 197, 253, 0.7)";
          }}
        >
          {topic.text}
        </button>
      ))}
    </div>
  );
});

TrendingTopics.displayName = "TrendingTopics";
