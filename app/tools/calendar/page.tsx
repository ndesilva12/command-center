"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
}

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    // Placeholder events
    setEvents([
      {
        id: "1",
        title: "Team Meeting",
        date: "2026-02-10",
        time: "10:00 AM",
        duration: "1h",
      },
      {
        id: "2",
        title: "Project Review",
        date: "2026-02-11",
        time: "2:00 PM",
        duration: "2h",
      },
      {
        id: "3",
        title: "Client Call",
        date: "2026-02-12",
        time: "3:00 PM",
        duration: "30m",
      },
    ]);
  }, []);

  const upcomingEvents = events.slice(0, 5);

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <CalendarIcon style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Calendar</h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
            {/* Main Calendar View */}
            <div className="glass" style={{ padding: "24px", borderRadius: "12px" }}>
              {/* Calendar Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "transparent", color: "var(--foreground)", cursor: "pointer" }}>
                    <ChevronLeft style={{ width: "16px", height: "16px" }} />
                  </button>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                  <button style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "transparent", color: "var(--foreground)", cursor: "pointer" }}>
                    <ChevronRight style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setView("month")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: view === "month" ? "var(--accent)" : "transparent",
                      color: view === "month" ? "var(--background)" : "var(--foreground)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setView("week")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: view === "week" ? "var(--accent)" : "transparent",
                      color: view === "week" ? "var(--background)" : "var(--foreground)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView("day")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: view === "day" ? "var(--accent)" : "transparent",
                      color: view === "day" ? "var(--background)" : "var(--foreground)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Day
                  </button>
                </div>
              </div>

              {/* Simplified Calendar Grid (placeholder) */}
              <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
                {view.charAt(0).toUpperCase() + view.slice(1)} view calendar grid coming soon
              </div>
            </div>

            {/* Upcoming Events Sidebar */}
            <div className="glass" style={{ padding: "24px", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <Clock style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                  Upcoming Events
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                      {event.time} • {event.duration}
                    </div>
                  </div>
                ))}

                {upcomingEvents.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)", fontSize: "13px" }}>
                    No upcoming events
                  </div>
                )}
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--accent)",
                  color: "var(--background)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
