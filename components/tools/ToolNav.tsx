"use client";

import Link from "next/link";
import { ALL_TOOLS } from "@/lib/tool-categories";
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

  // All visible tools across both categories, sorted by settings order
  const tools = ALL_TOOLS
    .map((tool) => {
      const custom = getCustomization(tool.id, tool.name, "#6366f1");
      return { ...tool, name: custom.name, visible: custom.visible, order: custom.order };
    })
    .filter((tool) => tool.visible)
    .filter((tool) => isAdmin || hasPermission(tool.id))
    .sort((a, b) => a.order - b.order);

  // Check if buttons exceed 80% of window width → split into two rows
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

  if (needsWrap) {
    const half = Math.ceil(tools.length / 2);
    const row1 = tools.slice(0, half);
    const row2 = tools.slice(half);

    return (
      <>
        <div ref={containerRef} className="tool-nav-container tool-nav-wrap">
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", width: "100%", flexWrap: "nowrap" }}>
            {row1.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                prefetch={true}
                className={`tool-nav-button ${tool.id === currentToolId ? 'active' : ''}`}
              >
                {tool.name}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", width: "100%", flexWrap: "nowrap" }}>
            {row2.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                prefetch={true}
                className={`tool-nav-button ${tool.id === currentToolId ? 'active' : ''}`}
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="tool-nav-content-fade" />
      </>
    );
  }

  return (
    <>
      <div ref={containerRef} className="tool-nav-container">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            prefetch={true}
            className={`tool-nav-button ${tool.id === currentToolId ? 'active' : ''}`}
          >
            {tool.name}
          </Link>
        ))}
      </div>
      <div className="tool-nav-content-fade" />
    </>
  );
});
