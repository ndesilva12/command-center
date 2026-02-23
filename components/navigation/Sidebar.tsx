"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Sparkles, Settings as SettingsIcon, LucideIcon } from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't render sidebar on mobile
  if (isMobile) return null;

  // Build tool list
  const tools = ALL_TOOLS
    .map((tool) => {
      const custom = getCustomization(tool.id, tool.name, "#6366f1");
      return {
        id: tool.id,
        name: custom.name,
        href: tool.href,
        icon: TOOL_ICONS[tool.id] || Sparkles,
        visible: custom.visible,
        order: custom.order,
      };
    })
    .filter((tool) => tool.visible)
    .filter((tool) => isAdmin || hasPermission(tool.id))
    .sort((a, b) => a.order - b.order);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 64,
        bottom: 0,
        width: "240px",
        background: "rgba(10, 10, 14, 0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        overflowY: "auto",
        zIndex: 50,
        padding: "16px 12px",
      }}
    >
      {/* Home */}
      <SidebarItem
        label="Home"
        icon={Home}
        href="/"
        active={isActive("/")}
        onClick={() => router.push("/")}
      />

      {/* Jimmy */}
      <SidebarItem
        label="Jimmy"
        icon={Sparkles}
        href="/jimmy"
        active={isActive("/jimmy")}
        onClick={() => router.push("/jimmy")}
      />

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "12px 0" }} />

      {/* Tools */}
      {tools.map((tool) => (
        <SidebarItem
          key={tool.id}
          label={tool.name}
          icon={tool.icon}
          href={tool.href}
          active={isActive(tool.href)}
          onClick={() => router.push(tool.href)}
        />
      ))}

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "12px 0" }} />

      {/* Settings */}
      <SidebarItem
        label="Settings"
        icon={SettingsIcon}
        href="/settings"
        active={isActive("/settings")}
        onClick={() => router.push("/settings")}
      />
    </aside>
  );
}

function SidebarItem({
  label,
  icon: Icon,
  href,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  href: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: active ? "rgba(0, 170, 255, 0.12)" : "transparent",
        border: "1px solid transparent",
        color: active ? "#00aaff" : "rgba(255, 255, 255, 0.6)",
        fontSize: "14px",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
        }
      }}
    >
      <Icon style={{ width: "18px", height: "18px", flexShrink: 0 }} />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
    </button>
  );
}
