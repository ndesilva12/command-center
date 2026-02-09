"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TaskCard } from "@/components/jimmy/TaskCard";
import { TaskList } from "@/components/jimmy/TaskList";
import { Sparkles, Grid3X3, List, Plus } from "lucide-react";

interface Task {
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
}

export default function JimmyPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load tasks from localStorage or API
    const savedTasks = localStorage.getItem("jimmy-tasks");
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed.tasks || []);
      } catch (e) {
        console.error("Failed to parse tasks:", e);
        loadDefaultTasks();
      }
    } else {
      loadDefaultTasks();
    }
    setLoading(false);
  }, []);

  const loadDefaultTasks = () => {
    const defaultTasks: Task[] = [
      {
        id: "1",
        title: "Market Analysis Report",
        date: "2026-02-09",
        status: "completed",
        preview: "Comprehensive analysis of Q1 2026 market trends, including technology sector performance, emerging opportunities, and competitive landscape assessment. Key findings highlight a 15% growth in AI-driven solutions and increased demand for sustainable technologies.",
      },
      {
        id: "2",
        title: "Competitor Research Summary",
        date: "2026-02-08",
        status: "completed",
        preview: "Deep dive into top 5 competitors' strategies, product roadmaps, and market positioning. Identified key differentiators and potential partnership opportunities. Recommendations for strategic positioning included.",
      },
      {
        id: "3",
        title: "Customer Insights Dashboard",
        date: "2026-02-07",
        status: "in-progress",
        preview: "Aggregated customer feedback from multiple sources, sentiment analysis, and trend identification. Currently analyzing patterns in user behavior and feature requests to inform product development priorities.",
      },
    ];
    setTasks(defaultTasks);
    localStorage.setItem("jimmy-tasks", JSON.stringify({ tasks: defaultTasks }));
  };

  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem("jimmy-tasks", JSON.stringify({ tasks: updatedTasks }));
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles style={{ width: "20px", height: "20px", color: "white" }} />
              </div>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", lineHeight: 1 }}>
                  Jimmy
                </h1>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                  Work deliverables & insights
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              {/* View Toggle */}
              <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--glass-border)" }}>
                <button
                  onClick={() => setView("grid")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: view === "grid" ? "var(--accent)" : "transparent",
                    color: view === "grid" ? "var(--background)" : "var(--foreground-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Grid3X3 style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  onClick={() => setView("list")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: view === "list" ? "var(--accent)" : "transparent",
                    color: view === "list" ? "var(--background)" : "var(--foreground-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <List style={{ width: "16px", height: "16px" }} />
                </button>
              </div>

              {/* Add Task Button */}
              <button
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                New Task
              </button>
            </div>
          </div>

          {/* Tasks */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
              Loading tasks...
            </div>
          ) : view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {tasks.map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
            </div>
          ) : (
            <TaskList tasks={tasks} />
          )}

          {!loading && tasks.length === 0 && (
            <div
              className="glass"
              style={{
                padding: "60px 40px",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <Sparkles style={{ width: "48px", height: "48px", color: "var(--accent)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No tasks yet
              </h3>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
                Jimmy will populate this dashboard with insights and deliverables
              </p>
              <button
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--accent)",
                  color: "var(--background)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create First Task
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
