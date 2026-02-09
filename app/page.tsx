"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolCard } from "@/components/tools/ToolCard";
import { SearchBar } from "@/components/search/SearchBar";
import { useEffect, useState } from "react";
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
  Newspaper,
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
} from "lucide-react";

const TOOL_CATEGORIES = [
  {
    name: "Intelligence",
    tools: [
      {
        id: "curate",
        name: "Curate",
        description: "Curated intelligence",
        icon: Sparkles,
        href: "/tools/curate",
        color: "#8b5cf6",
      },
      {
        id: "l3d",
        name: "L3D",
        description: "Last 30 days research",
        icon: TrendingUp,
        href: "/tools/l3d",
        color: "#10b981",
      },
      {
        id: "deep-search",
        name: "Deep Search",
        description: "Deep web search",
        icon: Search,
        href: "/tools/deep-search",
        color: "#6366f1",
      },
      {
        id: "dark-search",
        name: "Dark Search",
        description: "Dark web search",
        icon: Lock,
        href: "/tools/dark-search",
        color: "#dc2626",
      },
      {
        id: "image-lookup",
        name: "Image Lookup",
        description: "Reverse image search",
        icon: Image,
        href: "/tools/image-lookup",
        color: "#a78bfa",
      },
      {
        id: "contact-finder",
        name: "Contact Finder",
        description: "Find contact info",
        icon: UserSearch,
        href: "/tools/contact-finder",
        color: "#6366f1",
      },
      {
        id: "relationships",
        name: "Relationships",
        description: "Contact insights",
        icon: Network,
        href: "/tools/relationships",
        color: "#14b8a6",
      },
      {
        id: "mission",
        name: "Mission",
        description: "Task management",
        icon: Target,
        href: "/tools/mission",
        color: "#f59e0b",
      },
      {
        id: "investors",
        name: "Investors",
        description: "Fundraising pipeline",
        icon: TrendingDown,
        href: "/tools/investors",
        color: "#3b82f6",
      },
      {
        id: "business-info",
        name: "Business Info",
        description: "Company research",
        icon: Building2,
        href: "/tools/business-info",
        color: "#8b5cf6",
      },
      {
        id: "corporate",
        name: "Corporate",
        description: "Corporate insights",
        icon: Briefcase,
        href: "/tools/corporate",
        color: "#10b981",
      },
      {
        id: "jimmy",
        name: "Jimmy",
        description: "AI work dashboard",
        icon: Sparkles,
        href: "/jimmy",
        color: "#667eea",
      },
    ],
  },
  {
    name: "Productivity",
    tools: [
      {
        id: "emails",
        name: "Emails",
        description: "Email management",
        icon: Mail,
        href: "/tools/emails",
        color: "#3b82f6",
      },
      {
        id: "calendar",
        name: "Calendar",
        description: "Schedule & events",
        icon: Calendar,
        href: "/tools/calendar",
        color: "#10b981",
      },
      {
        id: "contacts",
        name: "Contacts",
        description: "Contact database",
        icon: Users,
        href: "/tools/contacts",
        color: "#8b5cf6",
      },
      {
        id: "people",
        name: "People",
        description: "Manage contacts",
        icon: Users,
        href: "/tools/people",
        color: "#06b6d4",
      },
      {
        id: "recommendations",
        name: "Recommendations",
        description: "Track suggestions",
        icon: Handshake,
        href: "/tools/recommendations",
        color: "#ec4899",
      },
      {
        id: "news",
        name: "News",
        description: "News aggregation",
        icon: Newspaper,
        href: "/tools/news",
        color: "#64748b",
      },
      {
        id: "rss",
        name: "RSS",
        description: "Feed reader",
        icon: BookOpen,
        href: "/tools/rss",
        color: "#10b981",
      },
      {
        id: "bookmarks",
        name: "Bookmarks",
        description: "Bookmark manager",
        icon: Droplets,
        href: "/tools/bookmarks",
        color: "#06b6d4",
      },
      {
        id: "market",
        name: "Market",
        description: "Market data",
        icon: DollarSign,
        href: "/tools/market",
        color: "#3b82f6",
      },
      {
        id: "notes",
        name: "Notes",
        description: "Note taking",
        icon: StickyNote,
        href: "/tools/notes",
        color: "#a78bfa",
      },
      {
        id: "files",
        name: "Files",
        description: "File storage",
        icon: FolderOpen,
        href: "/tools/files",
        color: "#6366f1",
      },
      {
        id: "spotify",
        name: "Spotify",
        description: "Music streaming",
        icon: Music,
        href: "/tools/spotify",
        color: "#1DB954",
      },
      {
        id: "trending",
        name: "Trending",
        description: "What's trending",
        icon: TrendingUp,
        href: "/tools/trending",
        color: "#14b8a6",
      },
      {
        id: "rosters",
        name: "Rosters",
        description: "Team rosters",
        icon: BarChart3,
        href: "/tools/rosters",
        color: "#3b82f6",
      },
    ],
  },
];

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
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
        <div className="container" style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Welcome Section */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              marginBottom: "8px" 
            }}>
              <img
                src="/signature.jpg"
                alt="Norman C. de Silva"
                style={{
                  height: isMobile ? "48px" : "64px",
                  width: "auto",
                  mixBlendMode: "multiply",
                  filter: "invert(1) brightness(1.5) contrast(1.2) hue-rotate(180deg) saturate(3)",
                }}
              />
            </div>
            <p style={{ fontSize: "16px", color: "var(--muted)", textAlign: "center", marginBottom: "40px" }}>
              Your personal intelligence and productivity hub
            </p>
            
            {/* Multi-Source Search */}
            <SearchBar />
          </div>

          {/* Tool Categories */}
          {TOOL_CATEGORIES.map((category) => (
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
                  gridTemplateColumns: isMobile
                    ? "repeat(2, 1fr)"
                    : "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "16px",
                }}
              >
                {category.tools.map((tool) => (
                  <ToolCard key={tool.id} {...tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
