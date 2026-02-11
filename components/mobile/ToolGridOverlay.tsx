"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { PRODUCTIVITY_TOOLS, INTELLIGENCE_TOOLS } from "@/lib/tool-categories";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { useAuth } from "@/hooks/useAuth";

interface ToolGridOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapping (same as homepage)
import {
  Mail,
  Calendar,
  Users,
  Handshake,
  Rss,
  Droplets,
  DollarSign,
  StickyNote,
  FolderOpen,
  Music,
  TrendingUp,
  BarChart3,
  ChefHat,
  Search,
  Lock,
  Image,
  UserSearch,
  Network,
  Target,
  TrendingDown,
  Building2,
  Briefcase,
} from "lucide-react";

const TOOL_ICONS: Record<string, any> = {
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
  "deep-search": Search,
  "dark-search": Lock,
  "image-lookup": Image,
  "contact-finder": UserSearch,
  relationships: Network,
  mission: Target,
  investors: TrendingDown,
  "business-info": Building2,
  corporate: Briefcase,
};

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
  "deep-search": "#6366f1",
  "dark-search": "#dc2626",
  "image-lookup": "#a78bfa",
  "contact-finder": "#6366f1",
  relationships: "#14b8a6",
  mission: "#f59e0b",
  investors: "#3b82f6",
  "business-info": "#8b5cf6",
  corporate: "#10b981",
};

export function ToolGridOverlay({ isOpen, onClose }: ToolGridOverlayProps) {
  const router = useRouter();
  const { customizations, getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter tools by mobile visibility and permissions
  const getMobileTools = () => {
    const allTools = [...PRODUCTIVITY_TOOLS, ...INTELLIGENCE_TOOLS];
    return allTools
      .map((tool) => {
        const custom = getCustomization(tool.id, tool.name, TOOL_COLORS[tool.id] || "#6366f1");
        const Icon = TOOL_ICONS[tool.id] || Sparkles;
        return {
          ...tool,
          name: custom.name,
          color: custom.color,
          visible: custom.visible,
          mobileVisible: custom.mobileVisible !== false, // Default to true if not set
          order: custom.order,
          icon: Icon,
        };
      })
      .filter((tool) => {
        // On mobile, check mobileVisible; otherwise check visible
        const visibilityCheck = isMobile ? tool.mobileVisible : tool.visible;
        const permissionCheck = isAdmin || hasPermission(tool.id);
        return visibilityCheck && permissionCheck;
      })
      .sort((a, b) => a.order - b.order);
  };

  const tools = getMobileTools();

  const handleToolClick = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
      onClick={onClose}
    >
      {/* Content */}
      <div
        style={{
          minHeight: "100vh",
          padding: "20px",
          paddingBottom: "100px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Zap style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            Tools
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              transition: "all 0.15s",
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Tool Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.href)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 8px",
                  borderRadius: "16px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  minHeight: "100px",
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `${tool.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon style={{ width: "24px", height: "24px", color: tool.color }} />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {tool.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
