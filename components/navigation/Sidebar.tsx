"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Sparkles, Settings as SettingsIcon, LucideIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { ALL_TOOLS } from "@/lib/tool-categories";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { useAuth } from "@/hooks/useAuth";
import {
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
  Network,
  Target,
  TrendingDown,
  Handshake,
  Rss,
  ChefHat,
  Search,
  Lock,
  TrendingUp,
  ShoppingBag,
  FileText,
  Globe,
  Send,
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update CSS variable for sidebar width so content can adjust
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.setProperty('--sidebar-width', collapsed ? '60px' : '240px');
    }
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
    };
  }, [collapsed, isMobile]);

  // Don't render sidebar on mobile
  if (isMobile) return null;

  // Build all tools with customizations
  const allTools = ALL_TOOLS
    .map((tool) => {
      const custom = getCustomization(tool.id, tool.name, TOOL_COLORS[tool.id] || "#6366f1");
      return {
        id: tool.id,
        name: custom.name,
        href: tool.href,
        icon: TOOL_ICONS[tool.id] || Sparkles,
        color: custom.color,
        visible: custom.visible,
        order: custom.order,
      };
    })
    .filter((tool) => isAdmin || hasPermission(tool.id))
    .sort((a, b) => a.order - b.order);

  const visibleTools = allTools.filter((tool) => tool.visible);
  const hiddenTools = allTools.filter((tool) => !tool.visible);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <aside
      className="sidebar-scroll"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: collapsed ? "60px" : "240px",
        background: "rgba(10, 10, 14, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
        padding: collapsed ? "76px 8px 16px 8px" : "76px 12px 16px 12px",
        transition: "width 0.3s ease, padding 0.3s ease",
        zIndex: 100,
      }}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute",
          top: "80px",
          right: collapsed ? "50%" : "8px",
          transform: collapsed ? "translateX(50%)" : "none",
          padding: "6px",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "6px",
          color: "rgba(255, 255, 255, 0.7)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.color = "#00aaff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
        }}
      >
        {collapsed ? (
          <ChevronRight style={{ width: "16px", height: "16px" }} />
        ) : (
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
        )}
      </button>

      {/* Home */}
      <SidebarItem
        label="Home"
        icon={Home}
        color="#00aaff"
        href="/"
        active={isActive("/")}
        onClick={() => router.push("/")}
        collapsed={collapsed}
      />

      {/* Jimmy */}
      <SidebarItem
        label="Jimmy"
        icon={Sparkles}
        color="#8b5cf6"
        href="/jimmy"
        active={isActive("/jimmy")}
        onClick={() => router.push("/jimmy")}
        collapsed={collapsed}
      />

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "12px 0" }} />

      {/* Visible Tools */}
      {visibleTools.map((tool) => (
        <SidebarItem
          key={tool.id}
          label={tool.name}
          icon={tool.icon}
          color={tool.color}
          href={tool.href}
          active={isActive(tool.href)}
          onClick={() => router.push(tool.href)}
          collapsed={collapsed}
        />
      ))}

      {/* Hidden Tools (when showAllTools is true) */}
      {showAllTools && hiddenTools.map((tool) => (
        <SidebarItem
          key={tool.id}
          label={tool.name}
          icon={tool.icon}
          color={tool.color}
          href={tool.href}
          active={isActive(tool.href)}
          onClick={() => router.push(tool.href)}
          collapsed={collapsed}
        />
      ))}

      {/* Show All / Hide Button (only if there are hidden tools) */}
      {hiddenTools.length > 0 && !collapsed && (
        <button
          onClick={() => setShowAllTools(!showAllTools)}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginTop: "8px",
            borderRadius: "6px",
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            textAlign: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          {showAllTools ? `Hide ${hiddenTools.length}` : `Show All (${hiddenTools.length})`}
        </button>
      )}

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "12px 0" }} />

      {/* Settings */}
      <SidebarItem
        label="Settings"
        icon={SettingsIcon}
        color="#6366f1"
        href="/settings"
        active={isActive("/settings")}
        onClick={() => router.push("/settings")}
        collapsed={collapsed}
      />
    </aside>
  );
}

function SidebarItem({
  label,
  icon: Icon,
  color,
  href,
  active,
  onClick,
  collapsed,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  href: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: collapsed ? "11px" : "11px 12px",
        borderRadius: "9px",
        background: active ? "rgba(0, 170, 255, 0.12)" : "transparent",
        border: "1px solid transparent",
        color: active ? "#00aaff" : "rgba(255, 255, 255, 0.75)",
        fontSize: "14px",
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "left",
        justifyContent: collapsed ? "center" : "flex-start",
        marginBottom: "2px",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
        }
      }}
    >
      <Icon
        style={{
          width: "18px",
          height: "18px",
          flexShrink: 0,
          color: color,
        }}
      />
      {!collapsed && (
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </span>
      )}
    </button>
  );
}
