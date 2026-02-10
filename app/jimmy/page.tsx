"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TaskCard } from "@/components/jimmy/TaskCard";
import { TaskList } from "@/components/jimmy/TaskList";
import { ChatInterface } from "@/components/jimmy/ChatInterface";
import { Sparkles, Grid3X3, List, MessageSquare, FileText } from "lucide-react";

interface Task {
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
  createdBy?: string;
}

type TabType = "chat" | "output";

export default function JimmyPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<TabType>("chat");
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
        createdBy: "cc_jimmy_command",
      },
      {
        id: "2",
        title: "Competitor Research Summary",
        date: "2026-02-08",
        status: "completed",
        preview: "Deep dive into top 5 competitors' strategies, product roadmaps, and market positioning. Identified key differentiators and potential partnership opportunities. Recommendations for strategic positioning included.",
        createdBy: "cc_jimmy_command",
      },
      {
        id: "3",
        title: "Customer Insights Dashboard",
        date: "2026-02-07",
        status: "in-progress",
        preview: "Aggregated customer feedback from multiple sources, sentiment analysis, and trend identification. Currently analyzing patterns in user behavior and feature requests to inform product development priorities.",
        createdBy: "cc_jimmy_command",
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
                  {activeTab === "chat" ? "AI Assistant Chat" : "Work deliverables & insights"}
                </p>
              </div>
            </div>

            {/* View Toggle (only show on Output tab) */}
            {activeTab === "output" && (
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
            )}
          </div>

          {/* Tab Toggle */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "24px",
              padding: "6px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--glass-border)",
              width: "fit-content",
            }}
          >
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "chat" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
                color: activeTab === "chat" ? "white" : "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <MessageSquare style={{ width: "16px", height: "16px" }} />
              Jimmy
            </button>
            <button
              onClick={() => setActiveTab("output")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "output" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
                color: activeTab === "output" ? "white" : "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FileText style={{ width: "16px", height: "16px" }} />
              Output
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "chat" ? (
            <div
              className="glass"
              style={{
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <ChatInterface />
            </div>
          ) : (
            <>
              {/* Tasks/Deliverables */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
                  Loading tasks...
                </div>
              ) : view === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                  {tasks
                    .filter((task) => task.createdBy === "cc_jimmy_command")
                    .map((task) => (
                      <TaskCard key={task.id} {...task} />
                    ))}
                </div>
              ) : (
                <TaskList tasks={tasks} />
              )}

              {!loading && tasks.filter((task) => task.createdBy === "cc_jimmy_command").length === 0 && view === "grid" && (
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
            </>
          )}
        </div>
      </main>
    </>
  );
}
