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

  const allTools = getToolsInCategory(currentToolId);
  const currentCategory = getToolCategory(currentToolId);
  
  // Category switch button: shows OWN category name, links to OTHER category's first tool
  const ownLabel = currentCategory === 'productivity' ? 'Productivity' : 'Intelligence';
  const otherTools = currentCategory === 'productivity' ? INTELLIGENCE_TOOLS : PRODUCTIVITY_TOOLS;
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

  // All buttons: category switch + tools
  const allButtons = [
    { id: '__category_switch__', name: ownLabel, href: otherFirstHref, isCategorySwitch: true },
    ...tools.map(t => ({ id: t.id, name: t.name, href: t.href, isCategorySwitch: false })),
  ];

  // Check if buttons exceed 80% of window width
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current) return;
      const threshold = window.innerWidth * 0.8;
      const buttons = containerRef.current.querySelectorAll('.tool-nav-button');
      let totalWidth = 0;
      buttons.forEach((btn, i) => {
        totalWidth += (btn as HTMLElement).offsetWidth + (i > 0 ? 8 : 0);
      });
      const wrapping = totalWidth > threshold;
      setNeedsWrap(wrapping);
      // Set CSS variable so content can adjust padding
      document.documentElement.style.setProperty('--tool-nav-height', wrapping ? '100px' : '56px');
    };
    const timer = setTimeout(checkOverflow, 100);
    window.addEventListener("resize", checkOverflow);
    return () => { 
      clearTimeout(timer); 
      window.removeEventListener("resize", checkOverflow);
      document.documentElement.style.removeProperty('--tool-nav-height');
    };
  }, [currentToolId, tools.length]);

  if (isMobile) return null;
  if (tools.length === 0) return null;

  // Split into two equal rows if wrapping needed
  if (needsWrap) {
    const half = Math.ceil(allButtons.length / 2);
    const row1 = allButtons.slice(0, half);
    const row2 = allButtons.slice(half);

    return (
      <div ref={containerRef} className="tool-nav-container tool-nav-wrap">
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", width: "100%", flexWrap: "nowrap" }}>
          {row1.map((btn) => (
            <Link
              key={btn.id}
              href={btn.href}
              prefetch={true}
              className={`tool-nav-button ${btn.isCategorySwitch ? 'tool-nav-category-switch' : ''} ${btn.id === currentToolId ? 'active' : ''}`}
            >
              {btn.name}{btn.isCategorySwitch ? ' →' : ''}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", width: "100%", flexWrap: "nowrap" }}>
          {row2.map((btn) => (
            <Link
              key={btn.id}
              href={btn.href}
              prefetch={true}
              className={`tool-nav-button ${btn.isCategorySwitch ? 'tool-nav-category-switch' : ''} ${btn.id === currentToolId ? 'active' : ''}`}
            >
              {btn.name}{btn.isCategorySwitch ? ' →' : ''}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="tool-nav-container">
      {allButtons.map((btn) => (
        <Link
          key={btn.id}
          href={btn.href}
          prefetch={true}
          className={`tool-nav-button ${btn.isCategorySwitch ? 'tool-nav-category-switch' : ''} ${btn.id === currentToolId ? 'active' : ''}`}
        >
          {btn.name}{btn.isCategorySwitch ? ' →' : ''}
        </Link>
      ))}
    </div>
  );
});
