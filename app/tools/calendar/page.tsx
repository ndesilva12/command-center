"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, RefreshCw, ExternalLink, Clock, MapPin, Users, List, Grid3x3, FileText, Trash2, Edit3, X } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string }>;
  htmlLink?: string;
  accountEmail?: string;
}

interface EventFormData {
  summary: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
}

const emptyFormData: EventFormData = {
  summary: "",
  description: "",
  location: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  allDay: false,
};

export default function CalendarPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('calendar', 'Calendar', '#6366f1');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("week");
  const [viewMode, setViewMode] = useState<"event" | "full">("event");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Create/Edit modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const savedTimeRange = localStorage.getItem("calendar_timeRange");
    const savedViewMode = localStorage.getItem("calendar_viewMode");
    if (savedTimeRange) setTimeRange(savedTimeRange as "today" | "week" | "month");
    if (savedViewMode) setViewMode(savedViewMode as "event" | "full");
    fetchEvents();
  }, []);

  useEffect(() => {
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
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const timeMin = startOfToday.toISOString();
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
        `/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&_t=${Date.now()}`,
        { cache: 'no-store' }
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

  const openCreateModal = () => {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setEditingEvent(null);
    setFormData({
      ...emptyFormData,
      startDate: now.toISOString().split('T')[0],
      startTime: now.toTimeString().slice(0, 5),
      endDate: later.toISOString().split('T')[0],
      endTime: later.toTimeString().slice(0, 5),
    });
    setShowEventModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    const startDT = event.start.dateTime || event.start.date || "";
    const endDT = event.end.dateTime || event.end.date || "";
    const isAllDay = !event.start.dateTime;

    let startDate = "", startTime = "", endDate = "", endTime = "";
    
    if (startDT) {
      const sd = new Date(startDT);
      startDate = sd.toISOString().split('T')[0];
      startTime = isAllDay ? "" : sd.toTimeString().slice(0, 5);
    }
    if (endDT) {
      const ed = new Date(endDT);
      endDate = ed.toISOString().split('T')[0];
      endTime = isAllDay ? "" : ed.toTimeString().slice(0, 5);
    }

    setEditingEvent(event);
    setFormData({
      summary: event.summary || "",
      description: event.description || "",
      location: event.location || "",
      startDate,
      startTime,
      endDate,
      endTime,
      allDay: isAllDay,
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const closeModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setFormData(emptyFormData);
  };

  const handleSave = async () => {
    if (!formData.summary.trim()) {
      alert("Please enter an event title");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        summary: formData.summary,
        description: formData.description || undefined,
        location: formData.location || undefined,
      };

      if (formData.allDay) {
        payload.start = { date: formData.startDate };
        payload.end = { date: formData.endDate || formData.startDate };
      } else {
        payload.start = { dateTime: `${formData.startDate}T${formData.startTime}:00`, timeZone: 'America/New_York' };
        payload.end = { dateTime: `${formData.endDate}T${formData.endTime}:00`, timeZone: 'America/New_York' };
      }

      if (editingEvent) {
        payload.eventId = editingEvent.id;
        payload.account = editingEvent.accountEmail;
      }

      const response = await fetch('/api/calendar/events', {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      closeModal();
      fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    if (!confirm('Are you sure you want to delete this event?')) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/calendar/events?eventId=${editingEvent.id}&account=${editingEvent.accountEmail || ''}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      closeModal();
      fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeleting(false);
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
    const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    let dateStr = "";
    if (isToday) dateStr = "Today";
    else if (isTomorrow) dateStr = "Tomorrow";
    else dateStr = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    if (event.start.dateTime) {
      const timeStr = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const endTimeStr = endDate ? endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
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

    if (endDate && now > endDate) return { label: "Past", color: "var(--foreground-muted)" };
    if (now >= startDate && (!endDate || now < endDate)) return { label: "Now", color: "#00ff88" };

    const hoursUntil = (startDate.getTime() - now.getTime()) / 1000 / 60 / 60;
    if (hoursUntil < 1) return { label: "Soon", color: "#ff9500" };
    return null;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const start = event.start.dateTime || event.start.date;
      if (!start) return false;
      return new Date(start).toDateString() === date.toDateString();
    });
  };

  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const start = event.start.dateTime;
      if (!start) return false;
      const eventDate = new Date(start);
      return eventDate.toDateString() === date.toDateString() && eventDate.getHours() === hour;
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
            <div key={hour} style={{ display: "flex", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", minHeight: "60px" }}>
              <div style={{ width: "80px", padding: "12px", fontSize: "13px", color: "var(--foreground-muted)", fontWeight: 500, borderRight: "1px solid rgba(255, 255, 255, 0.05)", flexShrink: 0 }}>
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              <div style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => openEditModal(event)}
                    style={{ padding: "8px 10px", background: "rgba(0, 170, 255, 0.15)", border: "1px solid rgba(0, 170, 255, 0.3)", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.25)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.15)")}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600, color: toolCustom.color, marginBottom: "2px" }}>{event.summary}</div>
                    {event.location && <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>{event.location}</div>}
                  </div>
                ))}
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
            <div key={date.toISOString()} style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px", minHeight: "150px", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: isToday ? toolCustom.color : "var(--foreground)", flexShrink: 0 }}>
                <div>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div style={{ fontSize: "18px", marginTop: "2px" }}>{date.getDate()}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, overflow: "hidden" }}>
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => openEditModal(event)}
                    style={{ padding: "6px 8px", background: "rgba(0, 170, 255, 0.15)", border: "1px solid rgba(0, 170, 255, 0.3)", borderRadius: "4px", fontSize: "11px", fontWeight: 500, color: toolCustom.color, cursor: "pointer", transition: "all 0.15s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
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
            <div key={day} style={{ padding: "12px", fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", textAlign: "center", background: "rgba(255, 255, 255, 0.03)" }}>{day}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "rgba(255, 255, 255, 0.05)" }}>
          {days.map((date) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const isCurrentMonth = date.getMonth() === month;
            return (
              <div key={date.toISOString()} style={{ background: "rgba(255, 255, 255, 0.02)", padding: "8px", minHeight: "100px", display: "flex", flexDirection: "column", opacity: isCurrentMonth ? 1 : 0.5, minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: isToday ? toolCustom.color : "var(--foreground)", flexShrink: 0 }}>{date.getDate()}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, overflow: "hidden" }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => openEditModal(event)}
                      style={{ padding: "4px 6px", background: "rgba(0, 170, 255, 0.15)", border: "1px solid rgba(0, 170, 255, 0.3)", borderRadius: "3px", fontSize: "10px", fontWeight: 500, color: toolCustom.color, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "all 0.15s", minWidth: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.25)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 170, 255, 0.15)")}
                    >
                      {event.summary}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div style={{ fontSize: "10px", color: "var(--foreground-muted)", paddingLeft: "6px" }}>+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "var(--foreground)",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--foreground-muted)",
    marginBottom: "6px",
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />

      <main style={{
        paddingTop: isMobile ? "72px" : "80px",
        paddingBottom: isMobile ? "80px" : "32px",
        paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 24px)",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: isMobile ? "100vh" : "calc(100vh - 136px)",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarIcon style={{ width: "24px", height: "24px", color: toolCustom.color }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Calendar {events.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({events.length})</span>}
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={openCreateModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: `linear-gradient(135deg, ${toolCustom.color} 0%, ${toolCustom.color}cc 100%)`,
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              Create Event
            </button>
            
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
              Google Calendar
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
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["today", "week", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: timeRange === range ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  color: timeRange === range ? toolCustom.color : "var(--foreground-muted)",
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

          <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <button
              onClick={() => setViewMode("event")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 12px", borderRadius: "6px",
                backgroundColor: viewMode === "event" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === "event" ? toolCustom.color : "var(--foreground-muted)",
                border: "none", cursor: "pointer", transition: "all 0.15s", fontSize: "12px", gap: "4px",
              }}
            >
              <List style={{ width: "14px", height: "14px" }} />Events
            </button>
            <button
              onClick={() => setViewMode("full")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 12px", borderRadius: "6px",
                backgroundColor: viewMode === "full" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === "full" ? toolCustom.color : "var(--foreground-muted)",
                border: "none", cursor: "pointer", transition: "all 0.15s", fontSize: "12px", gap: "4px",
              }}
            >
              <Grid3x3 style={{ width: "14px", height: "14px" }} />Full
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: toolCustom.color, animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button onClick={fetchEvents} style={{ marginTop: "16px", padding: "8px 16px", borderRadius: "6px", backgroundColor: "rgba(255, 255, 255, 0.1)", color: "var(--foreground)", border: "none", cursor: "pointer" }}>Try Again</button>
            </div>
          ) : viewMode === "full" ? (
            <div>
              {timeRange === "today" && renderFullDayView()}
              {timeRange === "week" && renderFullWeekView()}
              {timeRange === "month" && renderFullMonthView()}
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <CalendarIcon style={{ width: "48px", height: "48px", color: toolCustom.color, margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>{toolCustom.name}</h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "16px" }}>No events scheduled for the selected time range</p>
              <button onClick={openCreateModal} style={{ padding: "10px 20px", borderRadius: "8px", background: toolCustom.color, color: "white", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                <Plus style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />Create Event
              </button>
            </div>
          ) : (
            <div>
              {events.map((event, index) => {
                const status = getTimeStatus(event);
                return (
                  <div
                    key={event.id}
                    style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px 20px", borderBottom: index < events.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none", transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => openEditModal(event)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>{event.summary}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                          <Clock style={{ width: "13px", height: "13px" }} />
                          <span>{formatEventTime(event)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {status && (
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, color: status.color, backgroundColor: `${status.color}22`, border: `1px solid ${status.color}44` }}>{status.label}</span>
                        )}
                        <Edit3 style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                      </div>
                    </div>
                    {event.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <MapPin style={{ width: "13px", height: "13px" }} /><span>{event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <p style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>{event.description.substring(0, 150)}{event.description.length > 150 && "..."}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)", zIndex: 2000 }} onClick={closeModal} />
          <div
            style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "500px", maxHeight: "85vh", overflowY: "auto", background: "rgba(15, 15, 15, 0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "24px", zIndex: 2001, boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)" }}>{editingEvent ? "Edit Event" : "Create Event"}</h2>
              <button onClick={closeModal} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "rgba(255, 255, 255, 0.1)", color: "var(--foreground)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  type="text"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Event title"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: toolCustom.color }}
                />
                <label htmlFor="allDay" style={{ fontSize: "13px", color: "var(--foreground)" }}>All day</label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: formData.allDay ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} style={inputStyle} />
                </div>
                {!formData.allDay && (
                  <div>
                    <label style={labelStyle}>Start Time</label>
                    <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} style={inputStyle} />
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: formData.allDay ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} style={inputStyle} />
                </div>
                {!formData.allDay && (
                  <div>
                    <label style={labelStyle}>End Time</label>
                    <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} style={inputStyle} />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Add location"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add description"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              {editingEvent && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "14px", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: deleting ? 0.5 : 1 }}
                >
                  <Trash2 style={{ width: "14px", height: "14px" }} />{deleting ? "Deleting..." : "Delete"}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={closeModal} style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.05)", color: "var(--foreground)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg, ${toolCustom.color} 0%, ${toolCustom.color}cc 100%)`, color: "white", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
              </button>
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
