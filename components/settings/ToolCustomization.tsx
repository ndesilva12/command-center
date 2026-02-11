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
  Smartphone,
  Check,
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
  mobileVisible: boolean;
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
        
        // Filter customizations to ONLY include tools that exist in DEFAULT_TOOLS
        const validToolIds = new Set(DEFAULT_TOOLS.map(t => t.id));
        const filteredCustomizations: Record<string, ToolCustomization> = {};
        
        for (const [toolId, customization] of Object.entries(data.customizations || {})) {
          if (validToolIds.has(toolId)) {
            filteredCustomizations[toolId] = customization as ToolCustomization;
          }
        }
        
        setCustomizations(filteredCustomizations);

        // Apply saved order if available
        if (Object.keys(filteredCustomizations).length > 0) {
          const sortedTools = [...DEFAULT_TOOLS].sort((a, b) => {
            const orderA = filteredCustomizations[a.id]?.order ?? DEFAULT_TOOLS.findIndex(t => t.id === a.id);
            const orderB = filteredCustomizations[b.id]?.order ?? DEFAULT_TOOLS.findIndex(t => t.id === b.id);
            return orderA - orderB;
          });
          setTools(sortedTools);
        } else {
          // No customizations, use default order
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
    setError(null);
    setSaved(false);
    
    try {
      // Only save customizations for tools that currently exist
      const validToolIds = new Set(DEFAULT_TOOLS.map(t => t.id));
      const filteredCustomizations: Record<string, ToolCustomization> = {};
      
      for (const [toolId, customization] of Object.entries(customizations)) {
        if (validToolIds.has(toolId)) {
          filteredCustomizations[toolId] = customization;
        }
      }
      
      const res = await fetch('/api/settings/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customizations: filteredCustomizations,
          cleanupOldTools: true // Signal to API to remove old tools
        }),
      });

      if (res.ok) {
        setSaved(true);
        // Clear saved message after 3 seconds
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

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "12px"
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
            <>
              <Check style={{ width: "16px", height: "16px" }} />
              Saved!
            </>
          ) : (
            <>
              <Save style={{ width: "16px", height: "16px" }} />
              {saving ? "Saving..." : "Save Changes"}
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
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

      {renderToolSection("Productivity", productivityTools)}
      {renderToolSection("Intelligence", intelligenceTools)}
    </div>
  );
}
