"use client";

import { CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface TaskCardProps {
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
}

export function TaskCard({ id, title, date, status, preview }: TaskCardProps) {
  const statusColors = {
    completed: "#10b981",
    "in-progress": "#f59e0b",
  };

  const statusIcons = {
    completed: CheckCircle,
    "in-progress": Clock,
  };

  const StatusIcon = statusIcons[status];

  return (
    <Link
      href={`/jimmy/tasks/${id}`}
      style={{
        display: "block",
        textDecoration: "none",
      }}
    >
      <div
        className="glass"
        style={{
          padding: "24px",
          borderRadius: "12px",
          transition: "all 0.15s",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px", lineHeight: 1.3 }}>
              {title}
            </h3>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
              {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <StatusIcon style={{ width: "20px", height: "20px", color: statusColors[status], flexShrink: 0 }} />
        </div>

        {/* Preview */}
        <div style={{ flex: 1, fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
          {preview.substring(0, 120)}{preview.length > 120 ? "..." : ""}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "16px", borderTop: "1px solid var(--glass-border)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: `${statusColors[status]}20`,
              fontSize: "11px",
              fontWeight: 600,
              color: statusColors[status],
              textTransform: "capitalize",
            }}
          >
            {status.replace("-", " ")}
          </div>
          <FileText style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
        </div>
      </div>
    </Link>
  );
}
