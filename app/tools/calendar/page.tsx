"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, RefreshCw, ExternalLink, Clock, MapPin, Users } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string }>;
  htmlLink?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("week");

  useEffect(() => {
    fetchEvents();
  }, [timeRange]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      let timeMax: Date;

      switch (timeRange) {
        case "today":
          timeMax = new Date(now);
          timeMax.setHours(23, 59, 59);
          break;
        case "week":
          timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const response = await fetch(
        `/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}`
      );

      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;

    if (!start) return "";

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const isTomorrow =
      startDate.toDateString() ===
      new Date(now.getTime() + 86400000).toDateString();

    let dateStr = "";
    if (isToday) {
      dateStr = "Today";
    } else if (isTomorrow) {
      dateStr = "Tomorrow";
    } else {
      dateStr = startDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    if (event.start.dateTime) {
      const timeStr = startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const endTimeStr = endDate
        ? endDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "";
      return `${dateStr}, ${timeStr} - ${endTimeStr}`;
    }

    return dateStr + " (All Day)";
  };

  const getTimeStatus = (event: CalendarEvent) => {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;

    if (!start) return null;

    const now = new Date();
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (endDate && now > endDate) {
      return { label: "Past", color: "var(--foreground-muted)" };
    }

    if (now >= startDate && (!endDate || now < endDate)) {
      return { label: "Now", color: "#00ff88" };
    }

    const hoursUntil = (startDate.getTime() - now.getTime()) / 1000 / 60 / 60;
    if (hoursUntil < 1) {
      return { label: "Soon", color: "#ff9500" };
    }

    return null;
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="calendar" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarIcon style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Calendar {events.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({events.length})</span>}
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                textDecoration: "none",
                fontSize: "13px",
                transition: "all 0.15s",
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open in Google Calendar
            </a>
            
            <button
              onClick={fetchEvents}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Time Range Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
          {(["today", "week", "month"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: timeRange === range ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                color: timeRange === range ? "#00aaff" : "var(--foreground-muted)",
                border: timeRange === range ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: timeRange === range ? 500 : 400,
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button
                onClick={fetchEvents}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <CalendarIcon style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No events
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                No events scheduled for the selected time range
              </p>
            </div>
          ) : (
            <div>
              {events.map((event, index) => {
                const status = getTimeStatus(event);
                return (
                  <div
                    key={event.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      padding: "16px 20px",
                      borderBottom: index < events.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => event.htmlLink && window.open(event.htmlLink, "_blank")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                          {event.summary}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                          <Clock style={{ width: "13px", height: "13px" }} />
                          <span>{formatEventTime(event)}</span>
                        </div>
                      </div>
                      
                      {status && (
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: status.color,
                            backgroundColor: `${status.color}22`,
                            border: `1px solid ${status.color}44`,
                          }}
                        >
                          {status.label}
                        </span>
                      )}
                    </div>

                    {event.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <MapPin style={{ width: "13px", height: "13px" }} />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.description && (
                      <p style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                        {event.description.substring(0, 150)}
                        {event.description.length > 150 && "..."}
                      </p>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                        <Users style={{ width: "12px", height: "12px" }} />
                        <span>{event.attendees.length} attendees</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
