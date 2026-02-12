"use client";

import Link from "next/link";
import { getToolsInCategory } from "@/lib/tool-categories";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { useAuth } from "@/hooks/useAuth";
import { memo, useState, useEffect } from "react";

interface ToolNavProps {
  currentToolId: string;
}

export const ToolNav = memo(function ToolNav({ currentToolId }: ToolNavProps) {
  const { getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
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

  // Hide on mobile
  if (isMobile) return null;
  
  if (tools.length === 0) return null;

  return (
    <div className="tool-nav-container">
      {tools.map((tool) => {
        const isActive = tool.id === currentToolId;
        return (
          <Link
            key={tool.id}
            href={tool.href}
            prefetch={true}
            className={`tool-nav-button ${isActive ? 'active' : ''}`}
          >
            {tool.name}
          </Link>
        );
      })}
    </div>
  );
});
