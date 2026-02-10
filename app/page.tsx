"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolCard } from "@/components/tools/ToolCard";
import { SearchBar } from "@/components/search/SearchBar";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { DigitalClock } from "@/components/home/DigitalClock";
import { ToolGridOverlay } from "@/components/mobile/ToolGridOverlay";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { PRODUCTIVITY_TOOLS, INTELLIGENCE_TOOLS } from "@/lib/tool-categories";
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
  const [showToolGrid, setShowToolGrid] = useState(false);
  const { customizations, loading, getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin, loading: authLoading } = useAuth();
  const searchBarRef = useRef<{ setQuery: (q: string) => void; setSource: (s: string) => void } | null>(null);

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
          paddingTop: "80px",
          paddingBottom: isMobile ? "96px" : "32px",
          padding: isMobile ? "80px 16px 96px 16px" : "80px 24px 32px 24px",
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
            marginBottom: "32px",
          }}>
            <DigitalClock />
          </div>

          {/* Trending Topics */}
          <TrendingTopics onTagClick={handleTrendingClick} />

          {/* Search Section */}
          <div id="search-section" style={{ marginBottom: "40px" }}>
            <SearchBar ref={searchBarRef} />
          </div>

          {/* Tool Categories - Hidden on Mobile */}
          {!isMobile && !loading && customizedCategories.map((category) => {
            if (category.tools.length === 0) return null;

            return (
              <div key={category.name} style={{ marginBottom: "48px" }}>
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                    marginBottom: "16px",
                  }}
                >
                  {category.name}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {category.tools.map((tool) => (
                    <ToolCard key={tool.id} {...tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>

      {/* FAB Button - Mobile Only */}
      {isMobile && (
        <button
          onClick={() => setShowToolGrid(true)}
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00aaff 0%, #0088cc 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(0, 170, 255, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            transition: "all 0.2s",
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = "scale(0.9)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
      )}

      {/* Tool Grid Overlay */}
      <ToolGridOverlay isOpen={showToolGrid} onClose={() => setShowToolGrid(false)} />
    </ProtectedRoute>
  );
}
