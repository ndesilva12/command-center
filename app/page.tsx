"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { TrendingTopics, TrendingTopicsRef } from "@/components/home/TrendingTopics";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Settings,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Globe,
  ChevronRight,
  Zap,
} from "lucide-react";

// Simple markdown to HTML converter
function simpleMarkdownToHtml(markdown: string): string {
  let html = markdown;
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/^## (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/([^>])\n([^<])/g, '$1<br>$2');
  return html;
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  relativeTime: string;
  isFeatured?: boolean;
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const { loading: authLoading } = useAuth();
  const searchBarRef = useRef<{ setQuery: (q: string) => void; setSource: (s: string) => void } | null>(null);
  const trendingTopicsRef = useRef<TrendingTopicsRef>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [time, setTime] = useState(new Date());

  // News state
  const [zeroHedge, setZeroHedge] = useState<{ items: NewsItem[]; loading: boolean }>({ items: [], loading: true });
  const [googleNews, setGoogleNews] = useState<{ items: NewsItem[]; loading: boolean }>({ items: [], loading: true });

  // AI Search state
  const [aiSearchQuery, setAiSearchQuery] = useState<string>("");
  const [aiSearchModel, setAiSearchModel] = useState<string>("");
  const [aiSearchResult, setAiSearchResult] = useState<string>("");
  const [aiSearchLoading, setAiSearchLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch news
  useEffect(() => {
    fetchZeroHedge();
    fetchGoogleNews();
  }, []);

  const fetchZeroHedge = async () => {
    try {
      const response = await fetch('/api/news?feed=zerohedge&limit=8');
      const data = await response.json();
      setZeroHedge({ items: data.items || [], loading: false });
    } catch {
      setZeroHedge({ items: [], loading: false });
    }
  };

  const fetchGoogleNews = async () => {
    try {
      const response = await fetch('/api/news?feed=top&limit=6');
      const data = await response.json();
      setGoogleNews({ items: data.items || [], loading: false });
    } catch {
      setGoogleNews({ items: [], loading: false });
    }
  };

  const handleTrendingClick = (query: string) => {
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (searchBarRef.current) {
      searchBarRef.current.setQuery(query);
      searchBarRef.current.setSource('news');
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    trendingTopicsRef.current?.refresh();
    await Promise.all([fetchZeroHedge(), fetchGoogleNews()]);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAISearch = async (query: string, model: string) => {
    setAiSearchQuery(query);
    setAiSearchModel(model);
    setAiSearchResult("");
    setAiSearchLoading(true);

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, model }),
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setAiSearchResult(prev => prev + chunk);
      }
    } catch (error: any) {
      console.error('AI search error:', error);
      setAiSearchResult(`Error: ${error.message}`);
    } finally {
      setAiSearchLoading(false);
    }
  };

  const handleCloseAISearch = () => {
    setAiSearchQuery("");
    setAiSearchModel("");
    setAiSearchResult("");
    setAiSearchLoading(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Split ZeroHedge into featured and regular
  const featuredStories = zeroHedge.items.filter(item => item.isFeatured).slice(0, 3);
  const regularStories = zeroHedge.items.filter(item => !item.isFeatured).slice(0, 5);

  return (
    <ProtectedRoute>
      <TopNav />
      <BottomNav />
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main
          style={{
            flex: 1,
            minHeight: "100vh",
            paddingTop: isMobile ? "72px" : "76px",
            paddingBottom: isMobile ? "88px" : "24px",
            paddingLeft: isMobile ? "16px" : "32px",
            paddingRight: isMobile ? "16px" : "32px",
            background: "linear-gradient(180deg, rgba(10,10,15,1) 0%, rgba(5,5,10,1) 100%)",
          }}
        >
        {authLoading ? (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--muted)" }}>
            Loading...
          </div>
        ) : (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* Hero Section - Time & Search */}
          <div style={{
            textAlign: "center",
            paddingTop: isMobile ? "20px" : "40px",
            paddingBottom: isMobile ? "24px" : "40px",
          }}>
            {/* Minimal Clock */}
            <div style={{ marginBottom: isMobile ? "20px" : "32px" }}>
              <div style={{
                fontSize: isMobile ? "56px" : "80px",
                fontWeight: 200,
                fontFamily: "system-ui, -apple-system, sans-serif",
                color: "rgba(255, 255, 255, 0.95)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}>
                {formatTime(time)}
              </div>
              <div style={{
                fontSize: isMobile ? "13px" : "15px",
                color: "rgba(255, 255, 255, 0.4)",
                marginTop: "8px",
                fontWeight: 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {formatDate(time)}
              </div>
            </div>

            {/* Search */}
            <div id="search-section" style={{ maxWidth: "680px", margin: "0 auto" }}>
              <SearchBar ref={searchBarRef} onAISearch={handleAISearch} />
            </div>

            {/* Trending Topics */}
            {!aiSearchQuery && (
              <div style={{ marginTop: isMobile ? "20px" : "28px" }}>
                <TrendingTopics ref={trendingTopicsRef} onTagClick={handleTrendingClick} />
              </div>
            )}
          </div>

          {/* AI Search Response */}
          {aiSearchQuery && (
            <div style={{
              maxWidth: "800px",
              margin: "0 auto 40px",
              padding: isMobile ? "20px" : "28px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "16px",
                marginBottom: "16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}>
                <Sparkles style={{ width: "18px", height: "18px", color: "#60a5fa" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#60a5fa", textTransform: "capitalize" }}>
                    {aiSearchModel}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)", marginTop: "2px" }}>
                    {aiSearchQuery}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255, 255, 255, 0.85)",
                minHeight: "80px",
              }}>
                {aiSearchResult ? (
                  <div
                    className="ai-response"
                    dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(aiSearchResult) }}
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255, 255, 255, 0.4)" }}>
                    <div className="pulse-dot" />
                    Thinking...
                  </div>
                )}
                {aiSearchLoading && <span className="cursor-blink" />}
              </div>
              <div style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              }}>
                <button onClick={handleCloseAISearch} className="btn-secondary">Close</button>
                <button
                  onClick={() => navigator.clipboard.writeText(aiSearchResult)}
                  disabled={!aiSearchResult || aiSearchLoading}
                  className="btn-primary"
                  style={{ opacity: (!aiSearchResult || aiSearchLoading) ? 0.5 : 1 }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* News Content */}
          {!aiSearchQuery && (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
              gap: isMobile ? "24px" : "32px",
              marginTop: "8px",
            }}>
              
              {/* Main Column - ZeroHedge */}
              <div>
                {/* Section Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}>
                  <a
                    href="https://www.zerohedge.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Zap style={{ width: "16px", height: "16px", color: "white" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255, 255, 255, 0.95)" }}>
                        ZeroHedge
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>
                        Markets • Finance • Politics
                      </div>
                    </div>
                  </a>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      color: "rgba(255, 255, 255, 0.5)",
                      cursor: refreshing ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RefreshCw style={{
                      width: "14px",
                      height: "14px",
                      animation: refreshing ? "spin 1s linear infinite" : "none",
                    }} />
                  </button>
                </div>

                {/* Featured Stories */}
                {zeroHedge.loading ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div className="spinner" style={{ borderColor: "#f97316" }} />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {/* Featured - Large Typography */}
                    {featuredStories.map((item, index) => (
                      <a
                        key={item.link}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-item-featured"
                        style={{
                          display: "block",
                          padding: isMobile ? "16px 0" : "20px 0",
                          borderBottom: index < featuredStories.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                          textDecoration: "none",
                        }}
                      >
                        <div style={{
                          fontSize: isMobile ? "18px" : "22px",
                          fontWeight: 600,
                          color: "rgba(255, 255, 255, 0.95)",
                          lineHeight: 1.35,
                          marginBottom: "8px",
                          transition: "color 0.2s",
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.35)",
                        }}>
                          <span style={{ color: "#f97316", fontWeight: 500 }}>Featured</span>
                          <span>•</span>
                          <span>{item.relativeTime}</span>
                        </div>
                      </a>
                    ))}

                    {/* Separator */}
                    {featuredStories.length > 0 && regularStories.length > 0 && (
                      <div style={{
                        height: "1px",
                        background: "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                        margin: "12px 0",
                      }} />
                    )}

                    {/* Regular Stories - Compact */}
                    {regularStories.map((item) => (
                      <a
                        key={item.link}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-item"
                        style={{
                          display: "block",
                          padding: "12px 0",
                          textDecoration: "none",
                        }}
                      >
                        <div style={{
                          fontSize: isMobile ? "14px" : "15px",
                          fontWeight: 500,
                          color: "rgba(255, 255, 255, 0.8)",
                          lineHeight: 1.45,
                          marginBottom: "4px",
                          transition: "color 0.2s",
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: "rgba(255, 255, 255, 0.3)",
                        }}>
                          {item.relativeTime}
                        </div>
                      </a>
                    ))}

                    {/* View More Link */}
                    <a
                      href="https://www.zerohedge.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "16px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#f97316",
                        textDecoration: "none",
                      }}
                    >
                      View all on ZeroHedge
                      <ExternalLink style={{ width: "12px", height: "12px" }} />
                    </a>
                  </div>
                )}
              </div>

              {/* Sidebar Column - Google News */}
              <div>
                {/* Section Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}>
                  <a
                    href="https://news.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Globe style={{ width: "14px", height: "14px", color: "white" }} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>
                      Top Stories
                    </span>
                  </a>
                  <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.3)" }} />
                </div>

                {/* Google News Items */}
                {googleNews.loading ? (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <div className="spinner" style={{ borderColor: "#22c55e" }} />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {googleNews.items.map((item) => (
                      <a
                        key={item.link}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-item-small"
                        style={{
                          display: "block",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          transition: "background 0.15s",
                        }}
                      >
                        <div style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "rgba(255, 255, 255, 0.8)",
                          lineHeight: 1.4,
                          marginBottom: "4px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: "10px",
                          color: "rgba(255, 255, 255, 0.35)",
                        }}>
                          {item.source} • {item.relativeTime}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Footer Actions */}
          {!aiSearchQuery && isMobile && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "40px",
              marginBottom: "20px",
            }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-secondary"
                style={{ flex: 1, maxWidth: "160px", padding: "14px" }}
              >
                <RefreshCw style={{
                  width: "16px",
                  height: "16px",
                  marginRight: "8px",
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }} />
                Refresh
              </button>
              <Link href="/settings" className="btn-secondary" style={{ flex: 1, maxWidth: "160px", padding: "14px", textDecoration: "none" }}>
                <Settings style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                Settings
              </Link>
            </div>
          )}
        </div>
        )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #60a5fa;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 16px;
          margin-left: 2px;
          background: #60a5fa;
          animation: blink 1s step-end infinite;
          vertical-align: text-bottom;
        }
        
        .btn-primary {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid rgba(96, 165, 250, 0.3);
          background: rgba(96, 165, 250, 0.1);
          color: #60a5fa;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: rgba(96, 165, 250, 0.2);
        }
        
        .btn-secondary {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .news-item-featured:hover div:first-child {
          color: #f97316 !important;
        }
        
        .news-item:hover div:first-child {
          color: rgba(255, 255, 255, 0.95) !important;
        }
        
        .news-item-small:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .news-item-small:hover div:first-child {
          color: rgba(255, 255, 255, 0.95) !important;
        }
        
        .ai-response h3 {
          font-size: 17px;
          font-weight: 600;
          margin: 16px 0 8px;
          color: rgba(255, 255, 255, 0.95);
        }
        .ai-response h4 {
          font-size: 15px;
          font-weight: 600;
          margin: 12px 0 6px;
          color: rgba(255, 255, 255, 0.9);
        }
        .ai-response strong {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
        }
        .ai-response em { font-style: italic; }
        .ai-response ul { margin: 8px 0; padding-left: 20px; }
        .ai-response li { margin: 4px 0; list-style-type: disc; }
        .ai-response pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .ai-response code {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
        }
      `}</style>
    </ProtectedRoute>
  );
}
