"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolCard } from "@/components/tools/ToolCard";
import { SearchBar } from "@/components/search/SearchBar";
import { TrendingTopics, TrendingTopicsRef } from "@/components/home/TrendingTopics";
import { DigitalClock } from "@/components/home/DigitalClock";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { PRODUCTIVITY_TOOLS, INTELLIGENCE_TOOLS } from "@/lib/tool-categories";
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
};

// Simple markdown to HTML converter
function simpleMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // Code blocks (must be done before inline code)
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Headers
  html = html.replace(/^## (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');

  // List items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Double newlines
  html = html.replace(/\n\n/g, '<br><br>');

  // Single newlines (in non-pre contexts)
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
  'dark-search': "#dc2626",
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
};

const TOOL_CATEGORIES = [
  {
    name: "Productivity",
    tools: PRODUCTIVITY_TOOLS.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description || "",
      icon: TOOL_ICONS[tool.id] || Users,
      href: tool.href,
      color: TOOL_COLORS[tool.id] || "#6366f1",
    })),
  },
  {
    name: "Intelligence",
    tools: INTELLIGENCE_TOOLS.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description || "",
      icon: TOOL_ICONS[tool.id] || Sparkles,
      href: tool.href,
      color: TOOL_COLORS[tool.id] || "#8b5cf6",
    })),
  },
];

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const { customizations, loading, getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin, loading: authLoading } = useAuth();
  const searchBarRef = useRef<{ setQuery: (q: string) => void; setSource: (s: string) => void } | null>(null);
  const trendingTopicsRef = useRef<TrendingTopicsRef>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Default all categories to expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Productivity": true,
    "Intelligence": true,
  });

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
    // Scroll to search bar
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Populate search with query and set source to news
    if (searchBarRef.current) {
      searchBarRef.current.setQuery(query);
      searchBarRef.current.setSource('news');
    }
  };

  const handleRefresh = async () => {
    if (refreshing || !trendingTopicsRef.current) return;
    setRefreshing(true);
    trendingTopicsRef.current.refresh();
    // Reset refreshing state after animation completes
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle AI search
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

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

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

  // Close AI search
  const handleCloseAISearch = () => {
    setAiSearchQuery("");
    setAiSearchModel("");
    setAiSearchResult("");
    setAiSearchLoading(false);
  };

  // Copy AI response
  const handleCopyAIResponse = () => {
    navigator.clipboard.writeText(aiSearchResult);
  };

  // Apply customizations and filter by permissions
  const customizedCategories = TOOL_CATEGORIES.map(category => ({
    ...category,
    tools: category.tools
      .map(tool => {
        const custom = getCustomization(tool.id, tool.name, tool.color);
        return {
          ...tool,
          name: custom.name,
          color: custom.color,
          visible: custom.visible,
          order: custom.order,
        };
      })
      .filter(tool => tool.visible)
      .filter(tool => isAdmin || hasPermission(tool.id)) // Filter by permissions
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <ProtectedRoute>
      <TopNav />
      <BottomNav />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: isMobile ? "72px" : "76px",
          paddingBottom: isMobile ? "88px" : "24px",
          paddingLeft: isMobile ? "12px" : "20px",
          paddingRight: isMobile ? "12px" : "20px",
        }}
      >
        {authLoading ? (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--muted)" }}>
            Loading...
          </div>
        ) : (
        <div className="container" style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Clock Section - Centered */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: isMobile ? "12px" : "20px",
          }}>
            <DigitalClock />
          </div>

          {/* Search Section - Above on Mobile */}
          <div id="search-section" style={{ marginBottom: isMobile ? "12px" : "24px" }}>
            <SearchBar ref={searchBarRef} onAISearch={handleAISearch} />
          </div>

          {/* Trending Topics - Below on Mobile */}
          {!aiSearchQuery && (
            <div style={{ marginBottom: isMobile ? "16px" : "24px" }}>
              <TrendingTopics ref={trendingTopicsRef} onTagClick={handleTrendingClick} />
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
              {/* Header */}
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

              {/* Body */}
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
                    style={{
                      whiteSpace: "pre-wrap",
                    }}
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

              {/* Footer */}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
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
                    if (aiSearchResult && !aiSearchLoading) {
                      e.currentTarget.style.background = "rgba(0, 170, 255, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (aiSearchResult && !aiSearchLoading) {
                      e.currentTarget.style.background = "rgba(0, 170, 255, 0.1)";
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Tool Categories - Desktop: Toggle all on/off */}
          {!aiSearchQuery && !isMobile && !loading && customizedCategories.map((category, index) => {
            if (category.tools.length === 0) return null;

            const expanded = expandedCategories[category.name] !== undefined 
              ? expandedCategories[category.name] 
              : true;

            return (
              <div key={category.name} style={{ marginBottom: "32px", marginTop: index === 0 ? "32px" : "0" }}>
                {/* Clickable Header with underline */}
                <div
                  onClick={() => setExpandedCategories({...expandedCategories, [category.name]: !expanded})}
                  style={{
                    textAlign: "center",
                    paddingBottom: "10px",
                    marginBottom: "20px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <h2
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "rgba(255, 255, 255, 0.4)",
                      margin: 0,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
                    }}
                  >
                    {category.name}
                  </h2>
                </div>
                
                {/* All Tools - Show when expanded */}
                {expanded && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                      gap: "6px",
                    }}
                  >
                    {category.tools.map((tool) => (
                      <ToolCard key={tool.id} {...tool} compact />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Tool Categories - Mobile: Toggle all on/off */}
          {!aiSearchQuery && isMobile && !loading && customizedCategories.map((category, index) => {
            if (category.tools.length === 0) return null;

            const expanded = expandedCategories[category.name] !== undefined 
              ? expandedCategories[category.name] 
              : true;

            return (
              <div key={category.name} style={{ marginBottom: "24px", marginTop: index === 0 ? "24px" : "0" }}>
                {/* Clickable Header with underline */}
                <div
                  onClick={() => setExpandedCategories({...expandedCategories, [category.name]: !expanded})}
                  style={{
                    textAlign: "center",
                    paddingBottom: "8px",
                    marginBottom: "16px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "rgba(255, 255, 255, 0.4)",
                      margin: 0,
                    }}
                  >
                    {category.name}
                  </h2>
                </div>
                
                {/* All Tools - Show when expanded */}
                {expanded && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "6px",
                    }}
                  >
                    {category.tools.map((tool) => (
                      <ToolCard key={tool.id} {...tool} compact />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

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
            /* AI response markdown styling */
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
            .ai-response em {
              font-style: italic;
            }
            .ai-response ul {
              margin: 8px 0;
              padding-left: 20px;
            }
            .ai-response li {
              margin: 4px 0;
              list-style-type: disc;
            }
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
    </ProtectedRoute>
  );
}
