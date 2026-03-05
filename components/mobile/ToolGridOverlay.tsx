"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Home as HomeIcon, Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { ALL_TOOLS } from "@/lib/tool-categories";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { useAuth } from "@/hooks/useAuth";

interface ToolGridOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapping
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
  FileText,
  ShoppingBag,
  Globe,
  Send,
  BookOpen,
  LucideIcon,
} from "lucide-react";

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
  legal: BookOpen,
  'one-pager': FileText,
  'white-papers': BookOpen,
  politicorp: Globe,
  'war-room': Target,
  business: Building2,
  emailer: Send,
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
  'deep-search': "#6366f1",
  'dark-search': "#7c3aed",
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

export function ToolGridOverlay({ isOpen, onClose }: ToolGridOverlayProps) {
  const router = useRouter();
  const { getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin } = useAuth();
  const [showAllTools, setShowAllTools] = useState(false);

  // Build all tools with customizations
  const allTools = ALL_TOOLS
    .map((tool) => {
      const custom = getCustomization(tool.id, tool.name, TOOL_COLORS[tool.id] || "#6366f1");
      const Icon = TOOL_ICONS[tool.id] || Sparkles;
      return {
        id: tool.id,
        name: custom.name,
        href: tool.href,
        icon: Icon,
        color: custom.color,
        visible: custom.visible,
        mobileVisible: custom.mobileVisible !== false,
        order: custom.order,
      };
    })
    .filter((tool) => isAdmin || hasPermission(tool.id))
    .sort((a, b) => a.order - b.order);

  const visibleTools = allTools.filter((tool) => tool.mobileVisible);
  const hiddenTools = allTools.filter((tool) => !tool.mobileVisible);

  const handleToolClick = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: "rgba(10, 10, 14, 0.98)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto",
          padding: "20px",
          paddingTop: "calc(env(safe-area-inset-top) + 20px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 92px)",
          flex: "0 0 auto",
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
            <Sparkles style={{ width: "24px", height: "24px", color: "#00aaff" }} />
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

        {/* Home */}
        <MobileToolItem
          label="Home"
          icon={HomeIcon}
          color="#00aaff"
          onClick={() => handleToolClick("/")}
        />

        {/* Jimmy */}
        <MobileToolItem
          label="Jimmy"
          icon={Sparkles}
          color="#8b5cf6"
          onClick={() => handleToolClick("/jimmy")}
        />

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "16px 0" }} />

        {/* Visible Tools */}
        {visibleTools.map((tool) => (
          <MobileToolItem
            key={tool.id}
            label={tool.name}
            icon={tool.icon}
            color={tool.color}
            onClick={() => handleToolClick(tool.href)}
          />
        ))}

        {/* Hidden Tools (when showAllTools is true) */}
        {showAllTools && hiddenTools.map((tool) => (
          <MobileToolItem
            key={tool.id}
            label={tool.name}
            icon={tool.icon}
            color={tool.color}
            onClick={() => handleToolClick(tool.href)}
          />
        ))}

        {/* Show All / Hide Button */}
        {hiddenTools.length > 0 && (
          <button
            onClick={() => setShowAllTools(!showAllTools)}
            style={{
              width: "100%",
              padding: "12px 16px",
              marginTop: "12px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {showAllTools ? (
              <>
                <EyeOff style={{ width: "16px", height: "16px" }} />
                Hide {hiddenTools.length}
              </>
            ) : (
              <>
                <Eye style={{ width: "16px", height: "16px" }} />
                Show All ({hiddenTools.length})
              </>
            )}
          </button>
        )}

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "16px 0" }} />

        {/* Settings */}
        <MobileToolItem
          label="Settings"
          icon={SettingsIcon}
          color="#6366f1"
          onClick={() => handleToolClick("/settings")}
        />
      </div>
    </div>,
    document.body
  );
}

function MobileToolItem({
  label,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "10px",
        background: "transparent",
        border: "none",
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "16px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "left",
        marginBottom: "4px",
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon
        style={{
          width: "22px",
          height: "22px",
          flexShrink: 0,
          color: color,
        }}
      />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
    </button>
  );
}
