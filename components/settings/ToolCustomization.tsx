"use client";

import { useEffect, useState } from "react";
import { PRODUCTIVITY_TOOLS, INTELLIGENCE_TOOLS } from "@/lib/tool-categories";
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
};

interface ToolCustomization {
  name: string;
  color: string;
  visible: boolean;
  order: number;
}

interface Tool {
  id: string;
  name: string;
  color: string;
  category: string;
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
  "mission": "#f59e0b",
  "investors": "#3b82f6",
  "business-info": "#8b5cf6",
  "corporate": "#10b981",
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
};

// Build DEFAULT_TOOLS from tool-categories.ts
const DEFAULT_TOOLS: Tool[] = [
  ...PRODUCTIVITY_TOOLS.map(tool => ({
    id: tool.id,
    name: tool.name,
    color: DEFAULT_COLORS[tool.id] || "#3b82f6",
    category: "Productivity"
  })),
  ...INTELLIGENCE_TOOLS.map(tool => ({
    id: tool.id,
    name: tool.name,
    color: DEFAULT_COLORS[tool.id] || "#8b5cf6",
    category: "Intelligence"
  }))
];

export function ToolCustomization() {
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [customizations, setCustomizations] = useState<Record<string, ToolCustomization>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomizations();
  }, []);

  const loadCustomizations = async () => {
    try {
      const res = await fetch('/api/settings/tools');
      if (res.ok) {
        const data = await res.json();
        setCustomizations(data.customizations || {});

        // Apply saved order if available
        if (data.customizations && Object.keys(data.customizations).length > 0) {
          const sortedTools = [...DEFAULT_TOOLS].sort((a, b) => {
            const orderA = data.customizations[a.id]?.order ?? DEFAULT_TOOLS.findIndex(t => t.id === a.id);
            const orderB = data.customizations[b.id]?.order ?? DEFAULT_TOOLS.findIndex(t => t.id === b.id);
            return orderA - orderB;
          });
          setTools(sortedTools);
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

  const moveToolUp = (index: number, category: string) => {
    const categoryTools = tools.filter(t => t.category === category);
    if (index === 0) return;

    const toolToMove = categoryTools[index];
    const toolToSwap = categoryTools[index - 1];

    const newTools = tools.map(t => {
      if (t.id === toolToMove.id) return toolToSwap;
      if (t.id === toolToSwap.id) return toolToMove;
      return t;
    });

    setTools(newTools);

    // Update order in customizations
    newTools.forEach((tool, i) => {
      updateCustomization(tool.id, { order: i });
    });
  };

  const moveToolDown = (index: number, category: string) => {
    const categoryTools = tools.filter(t => t.category === category);
    if (index === categoryTools.length - 1) return;

    const toolToMove = categoryTools[index];
    const toolToSwap = categoryTools[index + 1];

    const newTools = tools.map(t => {
      if (t.id === toolToMove.id) return toolToSwap;
      if (t.id === toolToSwap.id) return toolToMove;
      return t;
    });

    setTools(newTools);

    // Update order in customizations
    newTools.forEach((tool, i) => {
      updateCustomization(tool.id, { order: i });
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customizations }),
      });

      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
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

  const productivityTools = tools.filter(t => t.category === "Productivity");
  const intelligenceTools = tools.filter(t => t.category === "Intelligence");

  const renderToolSection = (categoryName: string, categoryTools: Tool[]) => (
    <div key={categoryName} style={{ marginBottom: "32px" }}>
      <h3 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--foreground)",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        opacity: 0.7
      }}>
        {categoryName}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {categoryTools.map((tool, categoryIndex) => {
          const Icon = ICON_MAP[tool.id] || Sparkles;
          const customization = getToolCustomization(tool.id);

          return (
            <div
              key={tool.id}
              className="card"
              style={{
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "40px 1fr 120px 80px 80px",
                gap: "12px",
                alignItems: "center",
                background: customization.visible
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.02)",
                opacity: customization.visible ? 1 : 0.5,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: `${customization.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
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
                    border: "1px solid var(--glass-border)",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>
                  {customization.color}
                </span>
              </div>

              {/* Reorder Buttons */}
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => moveToolUp(categoryIndex, categoryName)}
                  disabled={categoryIndex === 0}
                  style={{
                    padding: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: categoryIndex === 0 ? "var(--muted)" : "var(--foreground)",
                    cursor: categoryIndex === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronUp style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  onClick={() => moveToolDown(categoryIndex, categoryName)}
                  disabled={categoryIndex === categoryTools.length - 1}
                  style={{
                    padding: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: categoryIndex === categoryTools.length - 1 ? "var(--muted)" : "var(--foreground)",
                    cursor: categoryIndex === categoryTools.length - 1 ? "not-allowed" : "pointer",
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
              >
                {customization.visible ? (
                  <Eye style={{ width: "16px", height: "16px" }} />
                ) : (
                  <EyeOff style={{ width: "16px", height: "16px" }} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px"
      }}>
        <div>
          <h2 style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "4px",
            color: "var(--foreground)"
          }}>
            Tool Customization
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>
            Rename, reorder, change colors, and toggle visibility of tools
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #10b981, #059669)",
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
          }}
        >
          <Save style={{ width: "16px", height: "16px" }} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {renderToolSection("Productivity", productivityTools)}
      {renderToolSection("Intelligence", intelligenceTools)}
    </div>
  );
}
