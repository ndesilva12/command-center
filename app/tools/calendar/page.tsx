"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, RefreshCw, ExternalLink, Clock, MapPin, Users, List, Grid3x3, FileText } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"event" | "full">("event");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    // Load preferences from localStorage
    const savedTimeRange = localStorage.getItem("calendar_timeRange");
    const savedViewMode = localStorage.getItem("calendar_viewMode");

    if (savedTimeRange) setTimeRange(savedTimeRange as "today" | "week" | "month");
    if (savedViewMode) setViewMode(savedViewMode as "event" | "full");

    fetchEvents();
  }, []);

  useEffect(() => {
    // Save preferences to localStorage
    localStorage.setItem("calendar_timeRange", timeRange);
    localStorage.setItem("calendar_viewMode", viewMode);
  }, [timeRange, viewMode]);

  useEffect(() => {
    if (timeRange) fetchEvents();
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

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const start = event.start.dateTime || event.start.date;
      if (!start) return false;
      const eventDate = new Date(start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const start = event.start.dateTime;
      if (!start) return false;
      const eventDate = new Date(start);
      return (
        eventDate.toDateString() === date.toDateString() &&
        eventDate.getHours() === hour
      );
    });
  };

  const renderFullDayView = () => {
    const today = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(today, hour);
          return (
            <div
              key={hour}
              style={{
                display: "flex",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                minHeight: "60px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  padding: "12px",
                  fontSize: "13px",
                  color: "var(--foreground-muted)",
                  fontWeight: 500,
                  borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                  flexShrink: 0,
                }}
              >
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              <div style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {hourEvents.length > 0 ? (
                  hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        padding: "8px 10px",
                        background: "rgba(0, 170, 255, 0.15)",
                        border: "1px solid rgba(0, 170, 255, 0.3)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.25)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.15)")}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#00aaff", marginBottom: "2px" }}>
                        {event.summary}
                      </div>
                      {event.location && (
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFullWeekView = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "rgba(255, 255, 255, 0.05)" }}>
        {days.map((date) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div
              key={date.toISOString()}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "12px",
                minHeight: "150px",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: isToday ? "#00aaff" : "var(--foreground)",
                  flexShrink: 0,
                }}
              >
                <div>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div style={{ fontSize: "18px", marginTop: "2px" }}>{date.getDate()}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, overflow: "hidden" }}>
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => event.htmlLink && window.open(event.htmlLink, "_blank")}
                    style={{
                      padding: "6px 8px",
                      background: "rgba(0, 170, 255, 0.15)",
                      border: "1px solid rgba(0, 170, 255, 0.3)",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#00aaff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.25)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.15)")}
                  >
                    {event.summary}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFullMonthView = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const currentDate = new Date(startDate);

    while (days.length < 35) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "rgba(255, 255, 255, 0.1)", marginBottom: "1px" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              style={{
                padding: "12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--foreground-muted)",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              {day}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "rgba(255, 255, 255, 0.05)" }}>
          {days.map((date) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const isCurrentMonth = date.getMonth() === month;

            return (
              <div
                key={date.toISOString()}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "8px",
                  minHeight: "100px",
                  display: "flex",
                  flexDirection: "column",
                  opacity: isCurrentMonth ? 1 : 0.5,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: isToday ? "#00aaff" : "var(--foreground)",
                    flexShrink: 0,
                  }}
                >
                  {date.getDate()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, overflow: "hidden" }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        padding: "4px 6px",
                        background: "rgba(0, 170, 255, 0.15)",
                        border: "1px solid rgba(0, 170, 255, 0.3)",
                        borderRadius: "3px",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "#00aaff",
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                        minWidth: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.25)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.15)")}
                    >
                      {event.summary}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: "10px", color: "var(--foreground-muted)", paddingLeft: "6px" }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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

        {/* Time Range Tabs and View Toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px" }}>
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

          {/* View Mode Toggle */}
          <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <button
              onClick={() => setViewMode("event")}
              title="Event View"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: viewMode === "event" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === "event" ? "#00aaff" : "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                fontSize: "12px",
                gap: "4px",
              }}
            >
              <List style={{ width: "14px", height: "14px" }} />
              Events
            </button>
            <button
              onClick={() => setViewMode("full")}
              title="Full View"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: viewMode === "full" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === "full" ? "#00aaff" : "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                fontSize: "12px",
                gap: "4px",
              }}
            >
              <Grid3x3 style={{ width: "14px", height: "14px" }} />
              Full
            </button>
          </div>
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
          ) : viewMode === "full" ? (
            <div>
              {timeRange === "today" && renderFullDayView()}
              {timeRange === "week" && renderFullWeekView()}
              {timeRange === "month" && renderFullMonthView()}
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 2000,
            }}
            onClick={() => setSelectedEvent(null)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              background: "rgba(10, 10, 10, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "32px",
              zIndex: 2001,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(255, 255, 255, 0.1)",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
            >
              ×
            </button>

            {/* Event title */}
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px", paddingRight: "40px" }}>
              {selectedEvent.summary}
            </h2>

            {/* Event details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Time */}
              <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                <Clock style={{ width: "20px", height: "20px", color: "#00aaff", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Time
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    {formatEventTime(selectedEvent)}
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <MapPin style={{ width: "20px", height: "20px", color: "#00aaff", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                      Location
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                      {selectedEvent.location}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <FileText style={{ width: "20px", height: "20px", color: "#00aaff", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                      Description
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: "1.6" }}>
                      {selectedEvent.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Attendees */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <Users style={{ width: "20px", height: "20px", color: "#00aaff", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                      Attendees
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                      {selectedEvent.attendees.map((a, i) => (
                        <div key={i}>{a.email}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
              >
                Close
              </button>
              {selectedEvent.htmlLink && (
                <button
                  onClick={() => {
                    window.open(selectedEvent.htmlLink, "_blank");
                    setSelectedEvent(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #00aaff 0%, #0088cc 100%)",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 170, 255, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <ExternalLink style={{ width: "16px", height: "16px" }} />
                  View in Google Calendar
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
