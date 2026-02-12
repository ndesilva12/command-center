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
    <>
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
          gap: 12px;
          padding: 0 16px;
          z-index: 40;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tool-nav-button {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          flex-shrink: 0;
          text-decoration: none !important;
          display: inline-block;
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 2px 4px rgba(0, 0, 0, 0.1),
            inset 0 1px 1px rgba(255, 255, 255, 0.15);
          position: relative;
        }

        .tool-nav-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          pointer-events: none;
        }

        .tool-nav-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          color: #ffffff;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 6px 24px rgba(0, 0, 0, 0.25),
            0 4px 8px rgba(0, 0, 0, 0.15),
            inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }

        .tool-nav-button.active {
          border-color: #00aaff;
          background: linear-gradient(
            135deg,
            rgba(0, 170, 255, 0.3),
            rgba(0, 136, 204, 0.2)
          );
          color: #ffffff;
          box-shadow: 
            0 6px 28px rgba(0, 170, 255, 0.5),
            0 4px 12px rgba(0, 170, 255, 0.3),
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            inset 0 -1px 2px rgba(0, 0, 0, 0.2);
        }

        .tool-nav-button.active:hover {
          background: linear-gradient(
            135deg,
            rgba(0, 170, 255, 0.35),
            rgba(0, 136, 204, 0.25)
          );
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 8px 32px rgba(0, 170, 255, 0.6),
            0 6px 16px rgba(0, 170, 255, 0.4),
            inset 0 1px 2px rgba(255, 255, 255, 0.35),
            inset 0 -1px 2px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
});
