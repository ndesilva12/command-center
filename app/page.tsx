"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { TrendingTopics, TrendingTopicsRef } from "@/components/home/TrendingTopics";
import { DigitalClock } from "@/components/home/DigitalClock";
import LocalNews from "@/components/home/LocalNews";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { ALL_TOOLS } from "@/lib/tool-categories";
import Link from "next/link";
import { isInHouseAI } from "@/lib/unified-sources";
import {
  Sparkles,
  TrendingUp,
  Search,
  Lock,
  Mail,
  Calendar,
  Users,
  FolderOpen,
  StickyNote,
  Droplets,
  Music,
  DollarSign,
  BookOpen,
  Briefcase,
  Building2,
  Image,
  BarChart3,
  UserSearch,
  Globe,
  Network,
  Target,
  TrendingDown,
  Handshake,
  LucideIcon,
  Rss,
  ChefHat,
  Settings,
  RefreshCw,
  ShoppingBag,
  FileText,
} from "lucide-react";

// Icon mapping for tools
const TOOL_ICONS: Record<string, LucideIcon> = {
  emails: Mail,
  calendar: Calendar,
  contacts: Users,
  people: Users,
  recommendations: Handshake,
  read: Rss,
  bookmarks: Droplets,
  market: DollarSign,
  notes: StickyNote,
  files: FolderOpen,
  spotify: Music,
  trending: TrendingUp,
  rosters: BarChart3,
  meals: ChefHat,
  curate: Sparkles,
  l3d: TrendingUp,
  'deep-search': Search,
  'dark-search': Lock,
  'jmail': Mail,
  'image-lookup': Image,
  'contact-finder': UserSearch,
  relationships: Network,
  mission: Target,
  investors: TrendingDown,
  'business-info': Building2,
  corporate: Briefcase,
  analyze: BarChart3,
  insights: Sparkles,
  cinderella: TrendingUp,
  shopping: ShoppingBag,
  summarizer: FileText,
  legal: BookOpen,
  'one-pager': FileText,
  'white-papers': BookOpen,
  politicorp: Globe,
  'war-room': Target,
  business: Building2,
  emailer: Mail,
};

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

// Color mapping for tools
const TOOL_COLORS: Record<string, string> = {
  emails: "#3b82f6",
  calendar: "#10b981",
  contacts: "#8b5cf6",
  people: "#06b6d4",
  recommendations: "#ec4899",
  read: "#10b981",
  bookmarks: "#06b6d4",
  market: "#3b82f6",
  notes: "#a78bfa",
  files: "#6366f1",
  spotify: "#1DB954",
  trending: "#14b8a6",
  rosters: "#3b82f6",
  meals: "#10b981",
  curate: "#8b5cf6",
  l3d: "#10b981",
  'deep-search': "#6366f1",
  'dark-search': "#7c3aed",
  'jmail': "#7c3aed",
  'image-lookup': "#a78bfa",
  'contact-finder': "#6366f1",
  relationships: "#14b8a6",
  mission: "#6366f1",
  investors: "#3b82f6",
  'business-info': "#8b5cf6",
  corporate: "#10b981",
  cinderella: "#3b82f6",
  analyze: "#6366f1",
  insights: "#a78bfa",
  shopping: "#10b981",
  summarizer: "#8b5cf6",
  legal: "#d4af37",
  'one-pager': "#6366f1",
  'white-papers': "#8b5cf6",
  politicorp: "#7c3aed",
  'war-room': "#7c3aed",
  business: "#6366f1",
  emailer: "#3b82f6",
};

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const { customizations, loading, getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin, loading: authLoading } = useAuth();
  const searchBarRef = useRef<{ setQuery: (q: string) => void; setSource: (s: string) => void } | null>(null);
  const trendingTopicsRef = useRef<TrendingTopicsRef>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    if (refreshing || !trendingTopicsRef.current) return;
    setRefreshing(true);
    trendingTopicsRef.current.refresh();
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

  const handleCopyAIResponse = () => {
    navigator.clipboard.writeText(aiSearchResult);
  };

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
            paddingLeft: isMobile ? "12px" : "24px",
            paddingRight: isMobile ? "12px" : "20px",
          }}
        >
        {authLoading ? (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--muted)" }}>
            Loading...
          </div>
        ) : (
        <div className="container" style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Clock Section */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: isMobile ? "12px" : "20px",
          }}>
            <DigitalClock />
          </div>

          {/* Search Section */}
          <div id="search-section" style={{ marginBottom: isMobile ? "12px" : "24px" }}>
            <SearchBar ref={searchBarRef} onAISearch={handleAISearch} />
          </div>

          {/* Trending Topics + Local News */}
          {!aiSearchQuery && (
            <div style={{ 
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "16px" : "24px",
              marginBottom: isMobile ? "16px" : "24px" 
            }}>
              <TrendingTopics ref={trendingTopicsRef} onTagClick={handleTrendingClick} />
              <LocalNews />
            </div>
          )}

          {/* AI Search Response Area */}
          {aiSearchQuery && (
            <div style={{
              maxWidth: "900px",
              margin: "0 auto 32px",
              padding: isMobile ? "16px" : "24px",
              borderRadius: "16px",
              background: "rgba(10, 10, 10, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "16px",
                marginBottom: "16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}>
                <Sparkles style={{ width: "20px", height: "20px", color: "#00aaff" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#00aaff", textTransform: "capitalize" }}>
                    {aiSearchModel}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                    {aiSearchQuery}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "var(--foreground)",
                minHeight: "100px",
              }}>
                {aiSearchResult ? (
                  <div
                    className="ai-response"
                    dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(aiSearchResult) }}
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--foreground-muted)" }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#00aaff",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                    Thinking...
                  </div>
                )}
                {aiSearchLoading && (
                  <span style={{
                    display: "inline-block",
                    width: "8px",
                    height: "16px",
                    marginLeft: "2px",
                    background: "#00aaff",
                    animation: "blink 1s step-end infinite",
                  }} />
                )}
              </div>
              <div style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}>
                <button
                  onClick={handleCloseAISearch}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; }}
                >
                  Close
                </button>
                <button
                  onClick={handleCopyAIResponse}
                  disabled={!aiSearchResult || aiSearchLoading}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 170, 255, 0.3)",
                    background: "rgba(0, 170, 255, 0.1)",
                    color: "#00aaff",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: (!aiSearchResult || aiSearchLoading) ? "not-allowed" : "pointer",
                    opacity: (!aiSearchResult || aiSearchLoading) ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (aiSearchResult && !aiSearchLoading) e.currentTarget.style.background = "rgba(0, 170, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    if (aiSearchResult && !aiSearchLoading) e.currentTarget.style.background = "rgba(0, 170, 255, 0.1)";
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Settings & Refresh - Bottom on Mobile */}
          {!aiSearchQuery && isMobile && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "32px",
              marginBottom: "32px",
            }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  flex: 1,
                  maxWidth: "200px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: refreshing ? "not-allowed" : "pointer",
                  opacity: refreshing ? 0.5 : 1,
                }}
              >
                <RefreshCw
                  style={{
                    width: "20px",
                    height: "20px",
                    animation: refreshing ? "spin 1s linear infinite" : "none",
                  }}
                />
                Refresh
              </button>
              <Link
                href="/settings"
                style={{
                  flex: 1,
                  maxWidth: "200px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  fontSize: "16px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <Settings style={{ width: "20px", height: "20px" }} />
                Settings
              </Link>
            </div>
          )}

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
            .ai-response h3 {
              font-size: 18px;
              font-weight: 600;
              margin: 16px 0 8px;
              color: var(--foreground);
            }
            .ai-response h4 {
              font-size: 16px;
              font-weight: 600;
              margin: 12px 0 6px;
              color: var(--foreground);
            }
            .ai-response strong {
              font-weight: 600;
              color: var(--foreground);
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
        </div>
        )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
