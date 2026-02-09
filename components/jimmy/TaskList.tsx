"use client";

import { CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface TaskListProps {
  tasks: Array<{
    id: string;
    title: string;
    date: string;
    status: "completed" | "in-progress";
    preview: string;
  }>;
}

export function TaskList({ tasks }: TaskListProps) {
  const statusColors = {
    completed: "#10b981",
    "in-progress": "#f59e0b",
  };

  const statusIcons = {
    completed: CheckCircle,
    "in-progress": Clock,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {tasks.map((task) => {
        const StatusIcon = statusIcons[task.status];

        return (
          <Link
            key={task.id}
            href={`/jimmy/tasks/${task.id}`}
            style={{
              display: "block",
              textDecoration: "none",
            }}
          >
            <div
              className="glass"
              style={{
                padding: "20px",
                borderRadius: "12px",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <StatusIcon style={{ width: "20px", height: "20px", color: statusColors[task.status], flexShrink: 0, marginTop: "2px" }} />
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                      {task.title}
                    </h3>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: `${statusColors[task.status]}20`,
                        fontSize: "11px",
                        fontWeight: 600,
                        color: statusColors[task.status],
                        textTransform: "capitalize",
                        flexShrink: 0,
                      }}
                    >
                      {task.status.replace("-", " ")}
                    </div>
                  </div>

                  <div style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6, marginBottom: "12px" }}>
                    {task.preview.substring(0, 200)}{task.preview.length > 200 ? "..." : ""}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FileText style={{ width: "14px", height: "14px" }} />
                      Full Report
                    </div>
                    <span>•</span>
                    <div>
                      {new Date(task.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
          No tasks yet
        </div>
      )}
    </div>
  );
}
