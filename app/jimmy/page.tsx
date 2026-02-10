"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TaskCard } from "@/components/jimmy/TaskCard";
import { TaskList } from "@/components/jimmy/TaskList";
import { ChatInterface } from "@/components/jimmy/ChatInterface";
import { Sparkles, Grid3X3, List, MessageSquare, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

interface Task {
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
  createdBy?: string;
  content?: string;
  commandText?: string;
  createdAt?: any;
}

type TabType = "chat" | "output";

export default function JimmyPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load tasks from Firestore with real-time updates
    const loadTasksFromFirestore = () => {
      try {
        const deliveriesRef = collection(db, "jimmy_deliverables");
        const q = query(
          deliveriesRef,
          where("createdBy", "==", "cc_jimmy_command"),
          orderBy("createdAt", "desc")
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const loadedTasks: Task[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title || "Untitled",
                date: data.date || new Date().toISOString().split("T")[0],
                status: data.status || "completed",
                preview: data.preview || "",
                content: data.content || "",
                commandText: data.commandText || "",
                createdBy: data.createdBy,
                createdAt: data.createdAt,
              };
            });
            
            setTasks(loadedTasks);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error("Error loading tasks from Firestore:", err);
            setError("Failed to load deliverables from Firestore");
            setLoading(false);
            // Fallback to localStorage if Firestore fails
            loadTasksFromLocalStorage();
          }
        );

        // Clean up listener on unmount
        return unsubscribe;
      } catch (err) {
        console.error("Error setting up Firestore listener:", err);
        setError("Failed to connect to Firestore");
        setLoading(false);
        loadTasksFromLocalStorage();
      }
    };

    const unsubscribe = loadTasksFromFirestore();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fallback to localStorage if Firestore is unavailable
  const loadTasksFromLocalStorage = () => {
    const savedTasks = localStorage.getItem("jimmy-tasks");
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed.tasks || []);
      } catch (e) {
        console.error("Failed to parse tasks from localStorage:", e);
      }
    }
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
              {/* Error State */}
              {error && (
                <div
                  className="glass"
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "20px" }}>⚠️</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        Error Loading Deliverables
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks/Deliverables */}
              {loading ? (
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
                      width: "40px",
                      height: "40px",
                      border: "3px solid var(--glass-border)",
                      borderTop: "3px solid var(--accent)",
                      borderRadius: "50%",
                      margin: "0 auto 16px",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    Loading deliverables from Firestore...
                  </div>
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

              {!loading && tasks.length === 0 && !error && (
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
