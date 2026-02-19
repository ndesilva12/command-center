"use client";

import { useEffect, useState } from "react";
import { ALL_TOOLS } from "@/lib/tool-categories";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
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
  Briefcase,
  Building2,
  Image,
  BarChart3,
  UserSearch,
  Network,
  Target,
  TrendingDown,
  Handshake,
  Scale,
  ChefHat,
  Rss,
  Smartphone,
  Check,
  FileText,
  ShoppingBag,
  Send,
  Globe,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  "curate": Sparkles,
  "l3d": TrendingUp,
  "deep-search": Search,
  "dark-search": Lock,
  "image-lookup": Image,
  "contact-finder": UserSearch,
  "relationships": Network,
  "mission": Target,
  "investors": TrendingDown,
  "business-info": Building2,
  "corporate": Briefcase,
  "politicorp": Globe,
  "jimmy": Sparkles,
  "emails": Mail,
  "calendar": Calendar,
  "contacts": Users,
  "people": Users,
  "recommendations": Handshake,
  "read": Rss,
  "bookmarks": Droplets,
  "market": DollarSign,
  "notes": StickyNote,
  "files": FolderOpen,
  "legal": Scale,
  "spotify": Music,
  "trending": TrendingUp,
  "rosters": BarChart3,
  "meals": ChefHat,
  "summarizer": FileText,
  "shopping": ShoppingBag,
  "emailer": Send,
  "white-papers": FileText,
  "one-pager": FileText,
  "cinderella": BarChart3,
  "business": Building2,
  "war-room": Target,
};

interface ToolCustomization {
  name: string;
  color: string;
  visible: boolean;
  mobileVisible: boolean;
  order: number;
}

interface Tool {
  id: string;
  name: string;
  color: string;
}

// Default colors for tools
const DEFAULT_COLORS: Record<string, string> = {
  "curate": "#8b5cf6",
  "l3d": "#10b981",
  "deep-search": "#6366f1",
  "dark-search": "#dc2626",
  "image-lookup": "#a78bfa",
  "contact-finder": "#6366f1",
  "relationships": "#14b8a6",
  "mission": "#6366f1",
  "investors": "#3b82f6",
  "business-info": "#8b5cf6",
  "corporate": "#10b981",
  "politicorp": "#ef4444",
  "emails": "#3b82f6",
  "calendar": "#10b981",
  "contacts": "#8b5cf6",
  "people": "#06b6d4",
  "recommendations": "#ec4899",
  "read": "#10b981",
  "bookmarks": "#06b6d4",
  "market": "#3b82f6",
  "notes": "#a78bfa",
  "files": "#6366f1",
  "legal": "#f59e0b",
  "spotify": "#1DB954",
  "trending": "#14b8a6",
  "rosters": "#3b82f6",
  "meals": "#10b981",
  "summarizer": "#8b5cf6",
  "shopping": "#10b981",
  "emailer": "#3b82f6",
  "white-papers": "#6366f1",
  "one-pager": "#7c3aed",
  "cinderella": "#ef4444",
  "business": "#6366f1",
  "war-room": "#dc2626",
};

// Build flat DEFAULT_TOOLS from ALL_TOOLS (no category separation)
const DEFAULT_TOOLS: Tool[] = ALL_TOOLS.map(tool => ({
  id: tool.id,
  name: tool.name,
  color: DEFAULT_COLORS[tool.id] || "#6366f1",
}));

export function ToolCustomization() {
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [customizations, setCustomizations] = useState<Record<string, ToolCustomization>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadCustomizations();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadCustomizations = async () => {
    try {
      const res = await fetch('/api/settings/tools');
      if (res.ok) {
        const data = await res.json();

        const validToolIds = new Set(DEFAULT_TOOLS.map(t => t.id));
        const filteredCustomizations: Record<string, ToolCustomization> = {};

        for (const [toolId, customization] of Object.entries(data.customizations || {})) {
          if (validToolIds.has(toolId)) {
            filteredCustomizations[toolId] = customization as ToolCustomization;
          }
        }

        setCustomizations(filteredCustomizations);

        if (Object.keys(filteredCustomizations).length > 0) {
          const sortedTools = [...DEFAULT_TOOLS].sort((a, b) => {
            const orderA = filteredCustomizations[a.id]?.order ?? DEFAULT_TOOLS.findIndex(t => t.id === a.id);
            const orderB = filteredCustomizations[b.id]?.order ?? DEFAULT_TOOLS.findIndex(t => t.id === b.id);
            return orderA - orderB;
          });
          setTools(sortedTools);
        } else {
          setTools(DEFAULT_TOOLS);
        }
      }
    } catch (error) {
      console.error('Failed to load customizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToolCustomization = (toolId: string): ToolCustomization => {
    const tool = DEFAULT_TOOLS.find(t => t.id === toolId);
    return customizations[toolId] || {
      name: tool?.name || toolId,
      color: tool?.color || "#3b82f6",
      visible: true,
      mobileVisible: true,
      order: DEFAULT_TOOLS.findIndex(t => t.id === toolId),
    };
  };

  const updateCustomization = (toolId: string, updates: Partial<ToolCustomization>) => {
    setCustomizations(prev => ({
      ...prev,
      [toolId]: {
        ...getToolCustomization(toolId),
        ...updates,
      },
    }));
  };

  const moveToolUp = (index: number) => {
    if (index === 0) return;
    const newTools = [...tools];
    [newTools[index - 1], newTools[index]] = [newTools[index], newTools[index - 1]];
    setTools(newTools);
    newTools.forEach((tool, i) => {
      const existing = getToolCustomization(tool.id);
      updateCustomization(tool.id, {
        name: existing.name,
        color: existing.color,
        visible: existing.visible,
        mobileVisible: existing.mobileVisible,
        order: i,
      });
    });
  };

  const moveToolDown = (index: number) => {
    if (index === tools.length - 1) return;
    const newTools = [...tools];
    [newTools[index], newTools[index + 1]] = [newTools[index + 1], newTools[index]];
    setTools(newTools);
    newTools.forEach((tool, i) => {
      const existing = getToolCustomization(tool.id);
      updateCustomization(tool.id, {
        name: existing.name,
        color: existing.color,
        visible: existing.visible,
        mobileVisible: existing.mobileVisible,
        order: i,
      });
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const validToolIds = new Set(DEFAULT_TOOLS.map(t => t.id));
      const filteredCustomizations: Record<string, ToolCustomization> = {};

      for (const [toolId, customization] of Object.entries(customizations)) {
        if (validToolIds.has(toolId)) {
          const tool = DEFAULT_TOOLS.find(t => t.id === toolId);
          filteredCustomizations[toolId] = {
            name: customization.name || tool?.name || toolId,
            color: customization.color || tool?.color || "#3b82f6",
            visible: typeof customization.visible === 'boolean' ? customization.visible : true,
            mobileVisible: typeof customization.mobileVisible === 'boolean' ? customization.mobileVisible : true,
            order: typeof customization.order === 'number' ? customization.order : 0,
          };
        }
      }

      const res = await fetch('/api/settings/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customizations: filteredCustomizations,
          cleanupOldTools: true,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Network error: Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "24px" }}>
        <p style={{ color: "var(--muted)" }}>Loading tool settings...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h2 style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "4px",
            color: "var(--foreground)",
          }}>
            Tool Customization
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>
            Rename, reorder, change colors, and toggle visibility{!isMobile && " (desktop & mobile)"}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 20px",
            background: saved
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #00aaff, #0088cc)",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            opacity: saving ? 0.6 : 1,
            transition: "all 0.3s ease",
          }}
        >
          {saved ? (
            <><Check style={{ width: "16px", height: "16px" }} />Saved!</>
          ) : (
            <><Save style={{ width: "16px", height: "16px" }} />{saving ? "Saving..." : "Save Changes"}</>
          )}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(220, 38, 38, 0.1)",
          border: "1px solid rgba(220, 38, 38, 0.2)",
          borderRadius: "8px",
          color: "#dc2626",
          fontSize: "14px",
          marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      {/* Single unified tool list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {tools.map((tool, index) => {
          const Icon = ICON_MAP[tool.id] || Sparkles;
          const customization = getToolCustomization(tool.id);

          return (
            <div
              key={tool.id}
              className="card"
              style={{
                padding: "16px",
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "40px 1fr 120px 80px 80px"
                  : "40px 1fr 120px 80px 80px 80px",
                gap: "12px",
                alignItems: "center",
                background: customization.visible
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.02)",
                opacity: customization.visible ? 1 : 0.5,
              }}
            >
              {/* Icon */}
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: `${customization.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Icon style={{ width: "20px", height: "20px", color: customization.color }} />
              </div>

              {/* Name Input */}
              <input
                type="text"
                value={customization.name}
                onChange={(e) => updateCustomization(tool.id, { name: e.target.value })}
                style={{
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />

              {/* Color Picker */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="color"
                  value={customization.color}
                  onChange={(e) => updateCustomization(tool.id, { color: e.target.value })}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    background: "transparent",
                    padding: 0,
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>
                  {customization.color}
                </span>
              </div>

              {/* Reorder Buttons */}
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => moveToolUp(index)}
                  disabled={index === 0}
                  style={{
                    padding: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: index === 0 ? "var(--muted)" : "var(--foreground)",
                    cursor: index === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronUp style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  onClick={() => moveToolDown(index)}
                  disabled={index === tools.length - 1}
                  style={{
                    padding: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: index === tools.length - 1 ? "var(--muted)" : "var(--foreground)",
                    cursor: index === tools.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronDown style={{ width: "16px", height: "16px" }} />
                </button>
              </div>

              {/* Visibility Toggle */}
              <button
                onClick={() => updateCustomization(tool.id, { visible: !customization.visible })}
                style={{
                  padding: "8px",
                  background: customization.visible
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(220, 38, 38, 0.1)",
                  border: `1px solid ${customization.visible ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
                  borderRadius: "6px",
                  color: customization.visible ? "#10b981" : "#dc2626",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Toggle desktop visibility"
              >
                {customization.visible ? (
                  <Eye style={{ width: "16px", height: "16px" }} />
                ) : (
                  <EyeOff style={{ width: "16px", height: "16px" }} />
                )}
              </button>

              {/* Mobile Visibility Toggle (Desktop Only) */}
              {!isMobile && (
                <button
                  onClick={() => updateCustomization(tool.id, { mobileVisible: !customization.mobileVisible })}
                  style={{
                    padding: "8px",
                    background: customization.mobileVisible
                      ? "rgba(59, 130, 246, 0.1)"
                      : "rgba(220, 38, 38, 0.1)",
                    border: `1px solid ${customization.mobileVisible ? 'rgba(59, 130, 246, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
                    borderRadius: "6px",
                    color: customization.mobileVisible ? "#3b82f6" : "#dc2626",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Toggle mobile visibility"
                >
                  <Smartphone style={{ width: "16px", height: "16px" }} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
