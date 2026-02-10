"use client";

import { useRouter } from "next/navigation";
import { getToolsInCategory } from "@/lib/tool-categories";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { useAuth } from "@/hooks/useAuth";
import { memo, useCallback } from "react";

interface ToolNavProps {
  currentToolId: string;
}

export const ToolNav = memo(function ToolNav({ currentToolId }: ToolNavProps) {
  const router = useRouter();
  const { getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin } = useAuth();
  
  const allTools = getToolsInCategory(currentToolId);
  
  // Filter by visibility and permissions (same logic as homepage)
  const tools = allTools
    .map((tool) => {
      const custom = getCustomization(tool.id, tool.name, "#6366f1");
      return {
        ...tool,
        name: custom.name,
        visible: custom.visible,
        order: custom.order,
      };
    })
    .filter((tool) => tool.visible)
    .filter((tool) => isAdmin || hasPermission(tool.id))
    .sort((a, b) => a.order - b.order);

  const handleToolClick = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  if (tools.length === 0) return null;

  return (
    <>
      <div className="tool-nav-container">
        {tools.map((tool) => {
          const isActive = tool.id === currentToolId;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.href)}
              className={`tool-nav-button ${isActive ? 'active' : ''}`}
            >
              {tool.name}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .tool-nav-container {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          height: 56px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          z-index: 40;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tool-nav-button {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tool-nav-button:hover {
          background: var(--glass-bg);
          color: var(--foreground);
        }

        .tool-nav-button.active {
          border-color: var(--glass-border);
          background: var(--glass-bg);
          color: var(--foreground);
        }

        .tool-nav-button.active:hover {
          background: var(--glass-bg);
          color: var(--foreground);
        }
      `}</style>
    </>
  );
});
