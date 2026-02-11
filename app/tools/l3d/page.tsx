"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, ChevronDown, ChevronRight, ExternalLink, Clock, Hash, MessageCircle, ThumbsUp, BarChart3 } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface L3DResults {
  topic: string;
  targetTool?: string;
  queryType: string;
  parsed: {
    topic: string;
    targetTool: string;
    queryType: string;
  };
  learned: Array<{
    title: string;
    content: string;
    sources?: string[];
  }>;
  keyPatterns: string[];
  stats: {
    reddit: { threads: number; upvotes: number; comments: number };
    x: { posts: number; likes: number; reposts: number };
    web: { pages: number };
    topVoices: string[];
  };
  sources: {
    reddit: Array<{
      title: string;
      url: string;
      upvotes: number;
      comments: number;
      subreddit: string;
    }>;
    x: Array<{
      author: string;
      content: string;
      url: string;
      likes: number;
      reposts: number;
    }>;
    web: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  };
  invitation: string;
  rawOutput?: string;
}

interface HistoryItem {
  id: string;
  topic: string;
  targetTool?: string;
  mode: string;
  days: number;
  queryType: string;
  results: L3DResults;
  createdAt: number;
}

export default function L3DPage() {
  const [topic, setTopic] = useState("");
  const [targetTool, setTargetTool] = useState("");
  const [mode, setMode] = useState<"quick" | "balanced" | "deep">("balanced");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<L3DResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedSources, setExpandedSources] = useState<{ reddit: boolean; x: boolean; web: boolean }>({
    reddit: false,
    x: false,
    web: false,
  });
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/l3d/history');
      const data = await response.json();
      setHistory(data.items || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleResearch = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/l3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          targetTool: targetTool.trim() || undefined,
          mode,
          days,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Research failed');
      }

      setResults(data.results);
      loadHistory(); // Refresh history
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute research');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setTopic(item.topic);
    setTargetTool(item.targetTool || "");
    setMode(item.mode as any);
    setDays(item.days);
    setResults(item.results);
    setError(null);
  };

  const toggleSource = (source: 'reddit' | 'x' | 'web') => {
    setExpandedSources(prev => ({ ...prev, [source]: !prev[source] }));
  };

  return (
    <>
      <TopNav />
      <ToolNav currentToolId="l3d" />

      <main
        style={{
          paddingTop: isMobile ? "80px" : "136px",
          paddingBottom: isMobile ? "80px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "8px",
            background: "linear-gradient(135deg, #00aaff, #00ddaa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <TrendingUp style={{ width: "32px", height: "32px", color: "#00aaff" }} />
            L3D Research
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "16px" }}>
            Research any topic from the last 30 days across Reddit, X, and the web
          </p>
        </div>

        {/* Input Form */}
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          padding: isMobile ? "16px" : "24px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          marginBottom: "24px",
        }}>
          {/* Topic Input */}
          <input
            type="text"
            placeholder="What do you want to research? (e.g., 'best Claude Code skills', 'kanye west')"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "var(--foreground)",
              marginBottom: "16px",
              outline: "none",
            }}
          />

          {/* Target Tool (Optional) */}
          <input
            type="text"
            placeholder="Target tool (optional, e.g., 'Midjourney', 'ChatGPT')"
            value={targetTool}
            onChange={(e) => setTargetTool(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "14px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "var(--foreground)",
              marginBottom: "16px",
              outline: "none",
            }}
          />

          {/* Mode Selector */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {(["quick", "balanced", "deep"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={loading}
                style={{
                  flex: isMobile ? "1 1 calc(33.33% - 6px)" : 1,
                  padding: "10px",
                  background: mode === m ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  border: mode === m ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: mode === m ? "#00aaff" : "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  textTransform: "capitalize",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Days Selector */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                disabled={loading}
                style={{
                  flex: isMobile ? "1 1 calc(25% - 6px)" : 1,
                  padding: "10px",
                  background: days === d ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  border: days === d ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: days === d ? "#00aaff" : "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {d} days
              </button>
            ))}
          </div>

          {/* Research Button */}
          <button
            onClick={handleResearch}
            disabled={loading || !topic.trim()}
            style={{
              width: "100%",
              padding: "16px",
              background: loading || !topic.trim()
                ? "rgba(0, 170, 255, 0.3)"
                : "linear-gradient(135deg, #00aaff, #0088cc)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <RefreshCw style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
                Researching... (2-8 minutes)
              </>
            ) : (
              <>
                <TrendingUp style={{ width: "20px", height: "20px" }} />
                Research
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "16px",
            background: "rgba(255, 0, 0, 0.1)",
            border: "1px solid rgba(255, 0, 0, 0.3)",
            borderRadius: "8px",
            color: "#ff6b6b",
            marginBottom: "24px",
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ marginBottom: "32px" }}>
            {/* Parsed Intent */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              padding: isMobile ? "16px" : "24px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "16px",
            }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#00aaff" }}>
                Research Summary
              </h2>
              <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.6" }}>
                <p><strong>Topic:</strong> {results.parsed.topic}</p>
                {results.parsed.targetTool && <p><strong>Target Tool:</strong> {results.parsed.targetTool}</p>}
                <p><strong>Query Type:</strong> {results.queryType}</p>
              </div>
            </div>

            {/* What I Learned */}
            {results.learned && results.learned.length > 0 && (
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: isMobile ? "16px" : "24px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "16px",
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#00aaff" }}>
                  📚 What I Learned
                </h2>
                {results.learned.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: idx < results.learned.length - 1 ? "20px" : "0" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                      {section.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Key Patterns */}
            {results.keyPatterns && results.keyPatterns.length > 0 && (
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: isMobile ? "16px" : "24px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "16px",
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#00aaff" }}>
                  🔑 Key Patterns
                </h2>
                <ol style={{ paddingLeft: "20px", margin: 0 }}>
                  {results.keyPatterns.map((pattern, idx) => (
                    <li key={idx} style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", lineHeight: "1.6", marginBottom: "8px" }}>
                      {pattern}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Stats */}
            {results.stats && (
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: isMobile ? "16px" : "24px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "16px",
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#00aaff" }}>
                  📊 Stats
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
                  {/* Reddit */}
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#ff4500" }}>Reddit</div>
                    <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Hash style={{ width: "14px", height: "14px" }} />
                        {results.stats.reddit.threads} threads
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <ThumbsUp style={{ width: "14px", height: "14px" }} />
                        {results.stats.reddit.upvotes} upvotes
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MessageCircle style={{ width: "14px", height: "14px" }} />
                        {results.stats.reddit.comments} comments
                      </div>
                    </div>
                  </div>

                  {/* X */}
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1da1f2" }}>X (Twitter)</div>
                    <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Hash style={{ width: "14px", height: "14px" }} />
                        {results.stats.x.posts} posts
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <ThumbsUp style={{ width: "14px", height: "14px" }} />
                        {results.stats.x.likes} likes
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <RefreshCw style={{ width: "14px", height: "14px" }} />
                        {results.stats.x.reposts} reposts
                      </div>
                    </div>
                  </div>

                  {/* Web */}
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#00aaff" }}>Web</div>
                    <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <BarChart3 style={{ width: "14px", height: "14px" }} />
                        {results.stats.web.pages} pages
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Voices */}
                {results.stats.topVoices && results.stats.topVoices.length > 0 && (
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                      Top Voices
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {results.stats.topVoices.map((voice, idx) => (
                        <span key={idx} style={{
                          background: "rgba(0, 170, 255, 0.15)",
                          border: "1px solid rgba(0, 170, 255, 0.3)",
                          borderRadius: "6px",
                          padding: "4px 12px",
                          fontSize: "13px",
                          color: "#00aaff",
                        }}>
                          {voice}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Invitation */}
            {results.invitation && (
              <div style={{
                background: "rgba(0, 170, 255, 0.1)",
                padding: isMobile ? "16px" : "24px",
                borderRadius: "12px",
                border: "1px solid rgba(0, 170, 255, 0.3)",
                marginBottom: "16px",
              }}>
                <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {results.invitation}
                </div>
              </div>
            )}

            {/* Sources (Expandable) */}
            {results.sources && (
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: isMobile ? "16px" : "24px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#00aaff" }}>
                  Sources
                </h2>

                {/* Reddit Sources */}
                {results.sources.reddit && results.sources.reddit.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <button
                      onClick={() => toggleSource('reddit')}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        background: "rgba(255, 69, 0, 0.1)",
                        border: "1px solid rgba(255, 69, 0, 0.3)",
                        borderRadius: "8px",
                        color: "#ff4500",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <span>Reddit Sources ({results.sources.reddit.length})</span>
                      {expandedSources.reddit ? <ChevronDown style={{ width: "16px", height: "16px" }} /> : <ChevronRight style={{ width: "16px", height: "16px" }} />}
                    </button>
                    {expandedSources.reddit && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {results.sources.reddit.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "block",
                              padding: "12px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "6px",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px", color: "rgba(255, 255, 255, 0.9)" }}>
                                  {source.title}
                                </div>
                                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                                  r/{source.subreddit} • ↑{source.upvotes} • 💬{source.comments}
                                </div>
                              </div>
                              <ExternalLink style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* X Posts */}
                {results.sources.x && results.sources.x.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <button
                      onClick={() => toggleSource('x')}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        background: "rgba(29, 161, 242, 0.1)",
                        border: "1px solid rgba(29, 161, 242, 0.3)",
                        borderRadius: "8px",
                        color: "#1da1f2",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <span>X Posts ({results.sources.x.length})</span>
                      {expandedSources.x ? <ChevronDown style={{ width: "16px", height: "16px" }} /> : <ChevronRight style={{ width: "16px", height: "16px" }} />}
                    </button>
                    {expandedSources.x && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {results.sources.x.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "block",
                              padding: "12px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "6px",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "4px", color: "#1da1f2" }}>
                                  {source.author}
                                </div>
                                <div style={{ fontSize: "13px", marginBottom: "4px", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.4" }}>
                                  {source.content}
                                </div>
                                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                                  ♥{source.likes} • ↻{source.reposts}
                                </div>
                              </div>
                              <ExternalLink style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Web Pages */}
                {results.sources.web && results.sources.web.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSource('web')}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        background: "rgba(0, 170, 255, 0.1)",
                        border: "1px solid rgba(0, 170, 255, 0.3)",
                        borderRadius: "8px",
                        color: "#00aaff",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <span>Web Pages ({results.sources.web.length})</span>
                      {expandedSources.web ? <ChevronDown style={{ width: "16px", height: "16px" }} /> : <ChevronRight style={{ width: "16px", height: "16px" }} />}
                    </button>
                    {expandedSources.web && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {results.sources.web.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "block",
                              padding: "12px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "6px",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px", color: "rgba(255, 255, 255, 0.9)" }}>
                                  {source.title}
                                </div>
                                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.4" }}>
                                  {source.snippet}
                                </div>
                              </div>
                              <ExternalLink style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            padding: isMobile ? "16px" : "24px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#00aaff" }}>
              <Clock style={{ width: "20px", height: "20px", display: "inline", marginRight: "8px" }} />
              Recent Researches
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {history.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px", color: "rgba(255, 255, 255, 0.9)" }}>
                    {item.topic}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                    {item.queryType} • {item.mode} • {item.days} days • {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <BottomNav />
    </>
  );
}
