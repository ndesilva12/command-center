"use client";

import Link from "next/link";
import { getToolsInCategory, getToolCategory, PRODUCTIVITY_TOOLS, INTELLIGENCE_TOOLS } from "@/lib/tool-categories";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { useAuth } from "@/hooks/useAuth";
import { memo, useState, useEffect, useRef } from "react";

interface ToolNavProps {
  currentToolId: string;
}

export const ToolNav = memo(function ToolNav({ currentToolId }: ToolNavProps) {
  const { getCustomization } = useToolCustomizations();
  const { hasPermission, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [needsWrap, setNeedsWrap] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check if buttons exceed 80% of window width
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current) return;
      const threshold = window.innerWidth * 0.8;
      const buttons = containerRef.current.querySelectorAll('.tool-nav-button');
      let totalWidth = 0;
      buttons.forEach((btn, i) => {
        totalWidth += (btn as HTMLElement).offsetWidth + (i > 0 ? 8 : 0); // 8px gap
      });
      setNeedsWrap(totalWidth > threshold);
    };
    // Delay to let DOM render
    const timer = setTimeout(checkOverflow, 100);
    window.addEventListener("resize", checkOverflow);
    return () => { clearTimeout(timer); window.removeEventListener("resize", checkOverflow); };
  }, [currentToolId]);
  
  const allTools = getToolsInCategory(currentToolId);
  const currentCategory = getToolCategory(currentToolId);
  
  // Determine cross-category link
  const otherCategory = currentCategory === 'productivity' ? 'intelligence' : 'productivity';
  const otherLabel = otherCategory === 'productivity' ? 'Productivity' : 'Intelligence';
  const otherTools = otherCategory === 'productivity' ? PRODUCTIVITY_TOOLS : INTELLIGENCE_TOOLS;
  const otherFirstHref = otherTools[0]?.href || '/';

  // Filter by visibility and permissions
  const tools = allTools
    .map((tool) => {
      const custom = getCustomization(tool.id, tool.name, "#6366f1");
      return { ...tool, name: custom.name, visible: custom.visible, order: custom.order };
    })
    .filter((tool) => tool.visible)
    .filter((tool) => isAdmin || hasPermission(tool.id))
    .sort((a, b) => a.order - b.order);

  if (isMobile) return null;
  if (tools.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`tool-nav-container ${needsWrap ? 'tool-nav-wrap' : ''}`}
    >
      {/* Cross-category link button */}
      <Link
        href={otherFirstHref}
        prefetch={true}
        className="tool-nav-button tool-nav-category-switch"
      >
        {otherLabel} →
      </Link>

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
