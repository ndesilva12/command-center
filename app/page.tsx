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
};

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
  mission: "#f59e0b",
  investors: "#3b82f6",
  'business-info': "#8b5cf6",
  corporate: "#10b981",
  cinderella: "#3b82f6",
  analyze: "#6366f1",
  insights: "#a78bfa",
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
            <SearchBar ref={searchBarRef} />
          </div>

          {/* Trending Topics - Below on Mobile */}
          <div style={{ marginBottom: isMobile ? "16px" : "24px" }}>
            <TrendingTopics ref={trendingTopicsRef} onTagClick={handleTrendingClick} />
          </div>

          {/* Tool Categories - Desktop: Toggle all on/off */}
          {!isMobile && !loading && customizedCategories.map((category, index) => {
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
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "10px",
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
          {isMobile && !loading && customizedCategories.map((category, index) => {
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
                      gap: "8px",
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
          {isMobile && (
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
          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
