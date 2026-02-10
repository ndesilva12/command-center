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
    createdBy?: string; // Filter for "cc_jimmy_command"
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

  // CRITICAL FILTER: Only show tasks created via "cc jimmy" command
  const filteredTasks = tasks.filter((task) => task.createdBy === "cc_jimmy_command");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {filteredTasks.map((task) => {
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
                    <span>•</span>
                    <div
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      {filteredTasks.length === 0 && (
        <div
          className="glass"
          style={{
            padding: "60px 40px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "28px",
            }}
          >
            📋
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            No deliverables yet
          </h3>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>
            Use the <strong style={{ color: "var(--accent)" }}>"cc jimmy"</strong> command in any conversation
            <br />
            to create deliverables that will appear here
          </p>
        </div>
      )}
    </div>
  );
}
