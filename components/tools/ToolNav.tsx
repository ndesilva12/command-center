"use client";

import { useRouter } from "next/navigation";
import { getToolsInCategory } from "@/lib/tool-categories";
import { memo, useCallback } from "react";

interface ToolNavProps {
  currentToolId: string;
}

export const ToolNav = memo(function ToolNav({ currentToolId }: ToolNavProps) {
  const router = useRouter();
  const tools = getToolsInCategory(currentToolId);

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
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: var(--foreground);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tool-nav-button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #00aaff;
        }

        .tool-nav-button.active {
          border-color: #00aaff;
          background: rgba(0, 170, 255, 0.15);
          color: #00aaff;
        }

        .tool-nav-button.active:hover {
          background: rgba(0, 170, 255, 0.15);
          color: #00aaff;
        }
      `}</style>
    </>
  );
});
