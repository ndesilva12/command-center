"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sparkles, ArrowLeft, Download, Copy, CheckCircle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
  content?: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load task from localStorage
    const savedTasks = localStorage.getItem("jimmy-tasks");
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        const foundTask = parsed.tasks?.find((t: Task) => t.id === params.id);
        if (foundTask) {
          setTask(foundTask);
        }
      } catch (e) {
        console.error("Failed to load task:", e);
      }
    }
  }, [params.id]);

  const handleCopy = () => {
    if (task?.content) {
      navigator.clipboard.writeText(task.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!task) {
    return (
      <>
        <TopNav />
        <BottomNav />
        <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
          <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
            Task not found
          </div>
        </main>
      </>
    );
  }

  const statusColors = {
    completed: "#10b981",
    "in-progress": "#f59e0b",
  };

  const StatusIcon = task.status === "completed" ? CheckCircle : Clock;

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Back Button */}
          <button
            onClick={() => router.push("/jimmy")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              marginBottom: "24px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              background: "transparent",
              color: "var(--foreground-muted)",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Jimmy
          </button>

          {/* Header */}
          <div className="glass" style={{ padding: "32px", borderRadius: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)", marginBottom: "12px", lineHeight: 1.2 }}>
                  {task.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: `${statusColors[task.status]}20`,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: statusColors[task.status],
                      textTransform: "capitalize",
                    }}
                  >
                    <StatusIcon style={{ width: "14px", height: "14px" }} />
                    {task.status.replace("-", " ")}
                  </div>
                  <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    {new Date(task.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "20px", borderTop: "1px solid var(--glass-border)" }}>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: copied ? "#10b981" : "transparent",
                  color: copied ? "white" : "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {copied ? <CheckCircle style={{ width: "16px", height: "16px" }} /> : <Copy style={{ width: "16px", height: "16px" }} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Download style={{ width: "16px", height: "16px" }} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="glass" style={{ padding: "32px", borderRadius: "12px" }}>
            <div style={{ fontSize: "16px", color: "var(--foreground)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {task.content || task.preview}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
