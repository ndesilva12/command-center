"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TaskCard } from "@/components/jimmy/TaskCard";
import { TaskList } from "@/components/jimmy/TaskList";
import { Sparkles, Grid3X3, List, MessageSquare } from "lucide-react";
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

export default function JimmyPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
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
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <TopNav />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "80px 20px 100px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Sparkles
              style={{ width: "32px", height: "32px", color: "#00aaff" }}
            />
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              Jimmy Deliverables
            </h1>
          </div>

          {/* Telegram Chat Button */}
          <a
            href="https://t.me/jimmy_chief_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #00aaff 0%, #0088cc 100%)",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 170, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <MessageSquare style={{ width: "18px", height: "18px" }} />
            Chat with Jimmy
          </a>
        </div>

        {/* View Toggle & Filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setView("grid")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: view === "grid" ? "rgba(0, 170, 255, 0.1)" : "transparent",
                color: view === "grid" ? "#00aaff" : "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s",
              }}
            >
              <Grid3X3 style={{ width: "16px", height: "16px" }} />
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: view === "list" ? "rgba(0, 170, 255, 0.1)" : "transparent",
                color: view === "list" ? "#00aaff" : "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s",
              }}
            >
              <List style={{ width: "16px", height: "16px" }} />
              List
            </button>
          </div>
        </div>

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
                width: "48px",
                height: "48px",
                border: "3px solid rgba(0, 170, 255, 0.2)",
                borderTop: "3px solid #00aaff",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--foreground-muted)",
              }}
            >
              Loading deliverables...
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div
            className="glass"
            style={{
              padding: "60px 40px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: "8px",
              }}
            >
              No Deliverables Yet
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--foreground-muted)",
              }}
            >
              Use &quot;cc jimmy [task]&quot; to create research deliverables
            </div>
          </div>
        ) : view === "grid" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>

      <BottomNav />

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
