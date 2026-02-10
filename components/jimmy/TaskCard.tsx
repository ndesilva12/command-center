"use client";

import { CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface TaskCardProps {
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
  createdBy?: string;
}

export function TaskCard({ id, title, date, status, preview, createdBy }: TaskCardProps) {
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
        style={{
          padding: "24px",
          borderRadius: "16px",
          transition: "all 0.3s ease",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 170, 255, 0.2)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px", lineHeight: 1.3 }}>
              {title}
            </h3>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {createdBy === "cc_jimmy_command" && (
                <>
                  <span>•</span>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(102, 126, 234, 0.2)",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#667eea",
                    }}
                  >
                    cc jimmy
                  </span>
                </>
              )}
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
