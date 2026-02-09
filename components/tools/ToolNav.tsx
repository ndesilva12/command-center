"use client";

import { useRouter, usePathname } from "next/navigation";
import { getToolsInCategory, ToolDefinition } from "@/lib/tool-categories";

interface ToolNavProps {
  currentToolId: string;
}

export function ToolNav({ currentToolId }: ToolNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tools = getToolsInCategory(currentToolId);

  if (tools.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "64px",
        left: 0,
        right: 0,
        height: "56px",
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "0 16px",
        zIndex: 40,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {tools.map((tool) => {
        const isActive = tool.id === currentToolId;
        return (
          <button
            key={tool.id}
            onClick={() => router.push(tool.href)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: `1px solid ${isActive ? "#00aaff" : "rgba(255, 255, 255, 0.1)"}`,
              background: isActive ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
              color: isActive ? "#00aaff" : "var(--foreground)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "#00aaff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "var(--foreground)";
              }
            }}
          >
            {tool.name}
          </button>
        );
      })}
    </div>
  );
}
