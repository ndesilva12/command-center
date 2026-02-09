"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export function ToolCard({ id, name, description, icon: Icon, href, color }: ToolCardProps) {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => router.push(href)}
      style={{
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="card glass-hover"
        style={{
          padding: "20px",
          transition: "all 0.3s ease",
          borderColor: "var(--glass-border)",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 8px 32px ${color}33`;
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          const overlay = e.currentTarget.querySelector(".tool-overlay") as HTMLElement;
          if (overlay) overlay.style.opacity = "0.08";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--glass-border)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
          const overlay = e.currentTarget.querySelector(".tool-overlay") as HTMLElement;
          if (overlay) overlay.style.opacity = "0";
        }}
      >
        <div
          className="tool-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: color,
            opacity: 0,
            transition: "opacity 0.2s",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: `${color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: "20px", height: "20px", color: color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  marginBottom: "2px",
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.4" }}>
                {description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
