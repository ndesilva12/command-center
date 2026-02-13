"use client";

import { useState, useEffect } from "react";
import { Trophy, Target, Users, Building2, FileText, TrendingUp, ExternalLink, Mail, Calendar, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CinderellaPage() {
  return (
    <ProtectedRoute>
      <CinderellaContent />
    </ProtectedRoute>
  );
}

function CinderellaContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('cinderella', 'Cinderella Project', '#3b82f6');
  const [activeTab, setActiveTab] = useState<'overview' | 'communications' | 'calendar' | 'targets' | 'legal' | 'tasks' | 'financials'>('overview');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="cinderella" />
      <main
        style={{
          paddingTop: isMobile ? "64px" : "136px",
          paddingBottom: isMobile ? "88px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: "100vh",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Trophy style={{ width: "32px", height: "32px", color: "#3b82f6" }} />
            <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              {toolCustom.name}
            </h1>
          </div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
            PE-backed NCAA basketball acquisition • UIC + Tim Grover • "Welcome to Wrexham" for college hoops
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: isMobile ? "8px" : "12px",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'communications', label: 'Communications', icon: Mail },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'targets', label: 'Targets', icon: Target },
            { id: 'legal', label: 'Legal', icon: Scale },
            { id: 'tasks', label: 'Tasks', icon: FileText },
            { id: 'financials', label: 'Financials', icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              style={{
                padding: isMobile ? "8px 16px" : "10px 20px",
                borderRadius: "8px",
                border: activeTab === id ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                background: activeTab === id ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.03)",
                color: activeTab === id ? "#3b82f6" : "rgba(255, 255, 255, 0.7)",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: activeTab === id ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab isMobile={isMobile} />}
        {activeTab === 'communications' && <CommunicationsTab isMobile={isMobile} />}
        {activeTab === 'calendar' && <CalendarTab isMobile={isMobile} />}
        {activeTab === 'targets' && <TargetsTab isMobile={isMobile} />}
        {activeTab === 'legal' && <LegalTab isMobile={isMobile} />}
        {activeTab === 'tasks' && <TasksTab isMobile={isMobile} />}
        {activeTab === 'financials' && <FinancialsTab isMobile={isMobile} />}
      </main>
    </>
  );
}

function CommunicationsTab({ isMobile }: { isMobile: boolean }) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'vc' | 'pe' | 'production' | 'other'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'waiting' | 'scheduled' | 'cold'>('all');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const communications = [
    {
      contact: "Adrian Williams",
      company: "SC Holdings",
      category: "PE" as const,
      status: "Scheduled" as const,
      priority: "High" as const,
      threadId: "19c2049e6c14d96c",
      lastEmail: "2026-02-12",
      subject: "Cinderella - Next meeting scheduled",
      snippet: "Perfect – just sent an invite for next Weds. Looking forward to speaking then!",
      nextStep: "Meeting Feb 19 @ 12:30pm ET",
      notes: "Had initial call Feb 4. Lots to update on. SC interested in lead vs follow positioning.",
    },
    {
      contact: "Deepen Parikh",
      company: "Courtside VC",
      category: "VC" as const,
      status: "Active" as const,
      priority: "High" as const,
      threadId: "19c04fa08ff819ad",
      lastEmail: "2026-02-11",
      subject: "Follow Up - Good momentum",
      snippet: "Quite a bit of momentum. I think your point proved spot on - smaller check sizes opens door to far more groups.",
      nextStep: "Share UIC update + celebrity progress",
      notes: "Positive feedback. Interested in workshopping name/school combos with Avenue, SC, TCG.",
    },
    {
      contact: "Todd Marcy",
      company: "Avenue Capital",
      category: "PE" as const,
      status: "Waiting" as const,
      priority: "Medium" as const,
      threadId: "19bd56ec09715f00",
      lastEmail: "2026-02-04",
      subject: "NCAA Investment - Deck shared",
      snippet: "Pleasure to meet you. Sent decks. We're on similar pages - low-end Power 4 or low-end D1, not blue bloods.",
      nextStep: "Wait for feedback, follow up in 1 week if no response",
      notes: "Had call Feb 4. Aligned on thesis (arbitrage vs. blue bloods).",
    },
    {
      contact: "Andy Howard",
      company: "Shamrock Capital",
      category: "PE" as const,
      status: "Waiting" as const,
      priority: "Medium" as const,
      threadId: "19c20315cbfde5d5",
      lastEmail: "2026-02-04",
      subject: "NCAA - Intro from Steve Royer",
      snippet: "Look forward to talking. Let me know how best to get on your calendar.",
      nextStep: "Schedule call",
      notes: "Intro from Steve Royer. Need to find time to connect.",
    },
    {
      contact: "Donella Madrid",
      company: "Shamrock Capital",
      category: "PE" as const,
      status: "Scheduled" as const,
      priority: "Medium" as const,
      threadId: "19c20315cbfde5d5",
      lastEmail: "2026-02-04",
      subject: "NCAA - Call scheduled",
      snippet: "Let's do Friday 2/6 @ 130p PT. Invite sent.",
      nextStep: "Call Feb 6 @ 1:30pm PT (past - need status update)",
      notes: "Scheduled via Andy Howard intro.",
    },
    {
      contact: "Jesse Jacobs",
      company: "TCG",
      category: "VC" as const,
      status: "Waiting" as const,
      priority: "Medium" as const,
      threadId: "19bd57878e137203",
      lastEmail: "2026-01-23",
      subject: "NCAA Investment - Deck shared",
      snippet: "Thanks for the call. Sent video deck and PDF deck with specific examples.",
      nextStep: "Follow up - it's been 3 weeks",
      notes: "Had call in late Jan. Radio silence since deck send.",
    },
  ];

  const toggleThread = (threadId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const filtered = communications.filter(c => {
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'vc' && c.category !== 'VC') return false;
      if (categoryFilter === 'pe' && c.category !== 'PE') return false;
      if (categoryFilter === 'production' || categoryFilter === 'other') return false; // No production/other comms yet
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && c.status !== 'Active') return false;
      if (statusFilter === 'waiting' && c.status !== 'Waiting') return false;
      if (statusFilter === 'scheduled' && c.status !== 'Scheduled') return false;
      if (statusFilter === 'cold') return false; // No cold comms yet
    }
    
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10b981';
      case 'Scheduled': return '#3b82f6';
      case 'Waiting': return '#f59e0b';
      case 'Cold': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "12px",
        flexWrap: isMobile ? "wrap" : "nowrap",
        padding: isMobile ? "12px" : "16px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }}>
          <label style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "6px", display: "block" }}>
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "14px",
            }}
          >
            <option value="all">All Categories</option>
            <option value="vc">VC</option>
            <option value="pe">PE</option>
            <option value="production">Production</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }}>
          <label style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "6px", display: "block" }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "14px",
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="waiting">Waiting</option>
            <option value="cold">Cold</option>
          </select>
        </div>
      </div>

      {/* Communications List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((comm) => {
          const isExpanded = expandedThreads.has(comm.threadId);
          const gmailLink = `https://mail.google.com/mail/u/0/#all/${comm.threadId}`;
          
          return (
            <div
              key={comm.threadId}
              style={{
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}
            >
              {/* Header - Always visible */}
              <div
                onClick={() => toggleThread(comm.threadId)}
                style={{
                  padding: isMobile ? "12px" : "16px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 600, color: "var(--foreground)" }}>
                        {comm.contact}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                        @ {comm.company}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                      {comm.subject}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isExpanded ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: `${getPriorityColor(comm.priority)}20`,
                    color: getPriorityColor(comm.priority),
                  }}>
                    {comm.priority} Priority
                  </span>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: `${getStatusColor(comm.status)}20`,
                    color: getStatusColor(comm.status),
                  }}>
                    {comm.status}
                  </span>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "rgba(139, 92, 246, 0.2)",
                    color: "#8b5cf6",
                  }}>
                    {comm.category}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{
                  padding: isMobile ? "12px" : "16px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.2)",
                }}>
                  {/* Latest Snippet */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                      Latest Email ({comm.lastEmail})
                    </div>
                    <div style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.03)",
                      fontSize: "13px",
                      color: "var(--foreground)",
                      fontStyle: "italic",
                    }}>
                      "{comm.snippet}"
                    </div>
                  </div>

                  {/* Next Step */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                      Next Step
                    </div>
                    <div style={{ fontSize: "14px", color: "#10b981", fontWeight: 500 }}>
                      → {comm.nextStep}
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                      Notes
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--foreground)", lineHeight: 1.5 }}>
                      {comm.notes}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a
                      href={gmailLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #00aaff, #0088cc)",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ExternalLink size={14} />
                      View in Gmail
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarTab({ isMobile }: { isMobile: boolean }) {
  const upcomingMeetings = [
    {
      title: "Norm / Adrian Sync (Cinderella)",
      date: "2026-02-18",
      time: "12:00 PM - 12:30 PM ET",
      with: "Adrian Williams (SC Holdings)",
      type: "Zoom Meeting",
      link: "https://us02web.zoom.us/j/83657963266",
      calendarLink: "https://www.google.com/calendar/event?eid=XzYwcTMwYzFnNjBvMzBlMWk2MG80YWMxZzYwcmo4Z3BsODhyajJjMWg4NHMzNGg5ZzYwczMwYzFnNjBvMzBjMWc3NG80MmRoaTZjcjM4Y3BsNzUxazhncGc2NG8zMGMxZzYwbzMwYzFnNjBvMzBjMWc2MG8zMmMxZzYwbzMwYzFnNjhvamdncTI2Y3NqMmVhMThsMWs4ZHBrNjhzM2NlMjI4OG8zNmQyMThoMjNlaGkxOGdwZyBub3JtYW4uZGVzaWx2YUBt",
      notes: "Follow-up from Feb 4 initial call. Update on UIC progress, celebrity targets, VC discussions.",
    },
  ];

  const taskDeadlines = [
    { task: "Schedule UIC athletic director call", due: "2026-02-15", priority: "High", status: "⚪ Todo" },
    { task: "Draft Grover commitment letter", due: "2026-02-17", priority: "High", status: "🟡 In Progress" },
    { task: "Round structure slide", due: "2026-02-18", priority: "Medium", status: "⚪ Todo" },
    { task: "Draft UIC MOU (non-binding)", due: "2026-02-20", priority: "High", status: "⚪ Todo" },
    { task: "Build 1-page financial model", due: "2026-02-20", priority: "Medium", status: "🟡 In Progress" },
    { task: "Legal structure memo (2-pager)", due: "2026-02-20", priority: "Medium", status: "⚪ Todo" },
    { task: "Finalize Grover commitment", due: "2026-02-20", priority: "High", status: "⚪ Todo" },
    { task: "VC pitch update", due: "2026-02-22", priority: "Medium", status: "⚪ Todo" },
  ];

  const milestones = [
    { title: "Lock UIC + Grover", target: "This Week (Feb 17)", status: "In Progress", color: "#f59e0b" },
    { title: "Pre-Term Sheet Package Complete", target: "Next 2 Weeks (Feb 22)", status: "In Progress", color: "#3b82f6" },
    { title: "Celebrity Outreach Launch", target: "Feb 20", status: "Pending", color: "#6b7280" },
    { title: "Secure Lead Investor ($750K-$1M)", target: "March 2026", status: "Pending", color: "#6b7280" },
    { title: "First Close ($2.5M Seed)", target: "Q1 2026", status: "Pending", color: "#6b7280" },
  ];

  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Upcoming Meetings */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={20} />
          Upcoming Meetings
        </h2>

        {upcomingMeetings.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
            No upcoming meetings scheduled.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {upcomingMeetings.map((meeting, i) => {
              const daysUntil = getDaysUntil(meeting.date);
              return (
                <div
                  key={i}
                  style={{
                    padding: isMobile ? "14px" : "16px",
                    borderRadius: "10px",
                    background: "rgba(59, 130, 246, 0.05)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 600, color: "#3b82f6", marginBottom: "4px" }}>
                        {meeting.title}
                      </h3>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "2px" }}>
                        📅 {meeting.date} • {meeting.time}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        👤 {meeting.with}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      background: daysUntil <= 1 ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                      color: daysUntil <= 1 ? "#ef4444" : "#3b82f6",
                      fontSize: "12px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>
                      {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                    </div>
                  </div>

                  {meeting.notes && (
                    <div style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "rgba(0, 0, 0, 0.2)",
                      fontSize: "13px",
                      color: "var(--foreground)",
                      marginBottom: "10px",
                    }}>
                      📝 {meeting.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {meeting.link && (
                      <a
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "linear-gradient(135deg, #00aaff, #0088cc)",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ExternalLink size={12} />
                        Join {meeting.type}
                      </a>
                    )}
                    <a
                      href={meeting.calendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Calendar size={12} />
                      View in Calendar
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Deadlines */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={20} />
          Task Deadlines
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {taskDeadlines.map((task, i) => {
            const daysUntil = getDaysUntil(task.due);
            const isOverdue = daysUntil < 0;
            const isUrgent = daysUntil <= 2 && daysUntil >= 0;

            return (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: isOverdue ? "rgba(239, 68, 68, 0.05)" : isUrgent ? "rgba(245, 158, 11, 0.05)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${isOverdue ? "rgba(239, 68, 68, 0.2)" : isUrgent ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.1)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                      {task.task}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                      {task.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      background: `${getPriorityColor(task.priority)}20`,
                      color: getPriorityColor(task.priority),
                      fontWeight: 600,
                    }}>
                      {task.priority}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                      Due: {task.due}
                    </span>
                  </div>
                </div>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: isOverdue ? "#ef4444" : isUrgent ? "#f59e0b" : "var(--foreground-muted)",
                  whiteSpace: "nowrap",
                }}>
                  {isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Due today" : `${daysUntil}d left`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Milestones */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Target size={20} />
          Project Milestones
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {milestones.map((milestone, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Progress bar background */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: milestone.status === "In Progress" ? "40%" : "0%",
                  background: `linear-gradient(90deg, ${milestone.color}10, ${milestone.color}05)`,
                  transition: "width 0.5s ease",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
                    {milestone.title}
                  </span>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: `${milestone.color}20`,
                    color: milestone.color,
                  }}>
                    {milestone.status}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  🎯 Target: {milestone.target}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegalTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Legal Documents */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Scale size={20} />
          Legal Documents
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Legal Structure Memo */}
          <a
            href="https://docs.google.com/document/d/1DXSwlvDqoGkgp9T09-T9UY60_iH3Vqbvx7smgALaBXk/edit"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "16px",
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.05)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)";
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#3b82f6" }}>
                Legal Structure Memo
              </span>
              <ExternalLink size={16} color="#3b82f6" />
            </div>
            <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: 0 }}>
              2-page memo: LLC structure, production rights, Title IX compliance
            </p>
          </a>

          {/* UIC MOU Draft */}
          <a
            href="https://docs.google.com/document/d/1rVoJOmspnhjri6w1rrITb95k4BF1s643IQtyHC9udN8/edit"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "16px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.05)";
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.2)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#10b981" }}>
                UIC MOU Draft
              </span>
              <ExternalLink size={16} color="#10b981" />
            </div>
            <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: 0 }}>
              Non-binding MOU framework (Title IX compliant, Utah/Otro model)
            </p>
          </a>
        </div>
      </div>

      {/* Legal Considerations */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          Key Legal Considerations
        </h3>
        <ul style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.8, paddingLeft: "20px" }}>
          <li>LLC owns team revenue rights (49% PE, 51% University)</li>
          <li>1-year renewable contracts, 10-year expiration</li>
          <li>PE funds entire program ($13M Year 1)</li>
          <li>University retains operational control (NCAA requirement)</li>
          <li>Title IX compliance: savings redistributed to other sports</li>
        </ul>
      </div>
    </div>
  );
}

// (Rest of the component functions remain the same: OverviewTab, TargetsTab, TasksTab, FinancialsTab)

function OverviewTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Status Card */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(245, 158, 11, 0.05)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f59e0b", marginBottom: "12px" }}>
          🎯 Current Status
        </h2>
        <div style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.6 }}>
          <p><strong>First Target:</strong> Tim Grover + University of Illinois-Chicago (UIC)</p>
          <p><strong>VC Traction:</strong> Courtside VC, SC Holdings (both following up)</p>
          <p><strong>Phase:</strong> Pre-seed/seed discovery (VCs "soft circling")</p>
        </div>
      </div>

      {/* Economics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: "16px",
      }}>
        <StatCard
          label="Year 1 Investment"
          value="$13M"
          color="#3b82f6"
        />
        <StatCard
          label="Year 1 Revenue"
          value="$19M"
          color="#10b981"
        />
        <StatCard
          label="Year 1 Investor Return"
          value="$4.3M (33% ROI)"
          color="#f59e0b"
        />
      </div>

      {/* IRR Card */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          📈 Exit IRR Scenarios
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Year 1 Exit</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#10b981" }}>264%</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Year 3 Exit</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#f59e0b" }}>91%</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Year 5 Exit</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#3b82f6" }}>52%</div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          🚀 Next Steps
        </h2>
        <ol style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.8, paddingLeft: "20px" }}>
          <li>Lock UIC + Grover (LOI/MOU)</li>
          <li>Build pre-term sheet package</li>
          <li>Launch celebrity outreach campaign</li>
          <li>Secure lead investor ($750K-$1M)</li>
        </ol>
      </div>

      {/* Workspace Link */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          📁 Project Files
        </h2>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
          All project files are in the workspace at:
        </p>
        <code style={{
          display: "block",
          padding: "8px 12px",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#00aaff",
          fontFamily: "monospace",
        }}>
          /home/ubuntu/.openclaw/workspace/cinderella/
        </code>
      </div>
    </div>
  );
}

function TargetsTab({ isMobile }: { isMobile: boolean }) {
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(['elite']));

  const toggleTier = (tier: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tier)) {
      newExpanded.delete(tier);
    } else {
      newExpanded.add(tier);
    }
    setExpandedTiers(newExpanded);
  };

  const eliteTier = [
    { rank: 1, name: "Steph Curry", school: "Davidson", reasoning: "Basketball royalty returns to alma mater. Perfect narrative, massive global appeal, Davidson already has infrastructure." },
    { rank: 2, name: "Kevin Hart", school: "Temple", reasoning: "Hart is HUGE (250M+ social), basketball fanatic, Philly market, fiercely loyal to Temple. This would break the internet." },
    { rank: 3, name: "Denzel Washington", school: "Fordham", reasoning: "A-list legend, NYC market, 'prestige meets grit' story. Denzel brings gravitas + investment capacity." },
    { rank: 4, name: "Bill Murray", school: "Charleston", reasoning: "Murray is universally beloved, Charleston has recent momentum (2022 tournament), perfect personality fit. Wrexham vibes." },
    { rank: 5, name: "Adam Sandler", school: "New Hampshire", reasoning: "Sandler LOVES basketball (Hustle, constant pickup games), massive fanbase, loyal alum. Would go all-in." },
    { rank: 6, name: "Jon Stewart", school: "William & Mary", reasoning: "Stewart has influence + platform (Apple show), W&M is historic/respected, great David vs Goliath story." },
    { rank: 7, name: "Dana White", school: "UMass", reasoning: "White built UFC brand from scratch, understands promotion, Boston market, UMass needs this energy." },
    { rank: 8, name: "Ben Affleck", school: "Vermont", reasoning: "A-list, Boston connection, Vermont is scrappy underdog. Affleck loves sports + New England." },
    { rank: 9, name: "Jason Sudeikis", school: "Loyola Chicago", reasoning: "Post-Ted Lasso, basketball is his brand now, Loyola had 2018 Final Four run, Chicago market." },
    { rank: 10, name: "Ludacris", school: "Georgia St", reasoning: "Atlanta market, hip-hop appeal, ATL basketball culture is deep. Ludacris is culturally relevant + loyal." },
  ];

  const strongContenders = [
    { rank: 11, name: "Luke Bryan", school: "Georgia Southern", reasoning: "Country megastar, Georgia market, fiercely loyal to school, huge fanbase in Southeast." },
    { rank: 12, name: "Bruno Mars", school: "Hawaii", reasoning: "Global superstar, unique market/story, Hawaii basketball has potential, Mars is beloved everywhere." },
    { rank: 13, name: "Tom Hanks", school: "Sacramento St", reasoning: "American treasure, Sacramento market, Hanks brings instant credibility. Everyone trusts Hanks." },
    { rank: 14, name: "CJ McCollum", school: "Lehigh", reasoning: "ACTIVE NBA player, went to Lehigh (#15 seed upset Duke), basketball credibility is unmatched." },
    { rank: 15, name: "Taylor Sheridan", school: "Texas St", reasoning: "Hottest creator in TV (Yellowstone), Texas market is massive, Sheridan understands storytelling." },
    { rank: 16, name: "Michael Strahan", school: "Texas Southern", reasoning: "Sports credibility (NFL HOF + media), HBCU angle, Houston market, Strahan is beloved." },
    { rank: 17, name: "Seth MacFarlane", school: "URI", reasoning: "Creative genius (Family Guy/Ted), loyal to URI, New England market, has resources + quirky appeal." },
    { rank: 18, name: "Darius Rucker", school: "Charleston", reasoning: "Country star + Hootie nostalgia, basketball fan, Charleston has momentum, great cultural fit." },
    { rank: 19, name: "Dr. Phil", school: "North Texas", reasoning: "Name recognition, Dallas market, media empire, knows how to build brands. Polarizing but powerful." },
    { rank: 20, name: "George Clooney", school: "Northern Kentucky", reasoning: "A-list legend, Cincinnati market, NKU is young/hungry program, Clooney brings prestige." },
  ];

  const tier2 = [
    { name: "Vince Vaughn", school: "Miami Ohio" },
    { name: "Sandra Bullock", school: "Eastern Carolina" },
    { name: "Andy Garcia", school: "FIU" },
    { name: "Tim McGraw", school: "Louisiana Monroe" },
    { name: "Adam McKay", school: "Temple" },
    { name: "Charlie Day", school: "URI" },
    { name: "Conan O'Brien", school: "URI" },
    { name: "Paul Giamatti", school: "New Haven" },
    { name: "Ken Jeong", school: "UNC Greensboro" },
    { name: "Walton Goggins", school: "Georgia Southern" },
    { name: "Brad Pitt", school: "Missouri St" },
    { name: "Rick Ross", school: "Bethune-Cookman" },
    { name: "Danny McBride", school: "Charleston" },
    { name: "Jim Nantz", school: "Ball St" },
    { name: "Steve Nash", school: "Santa Clara" },
    { name: "Kevin Costner", school: "Cal St Fullerton" },
    { name: "Liev Schreiber", school: "UMass" },
    { name: "Ray Romano", school: "Hofstra" },
    { name: "Shane Gillis", school: "Elon" },
    { name: "Bill Simmons", school: "Holy Cross" },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return '#3b82f6'; // Light blue
      case 'strong': return '#10b981'; // Green
      case 'tier2': return '#8b5cf6'; // Purple
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(59, 130, 246, 0.05)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#3b82f6", marginBottom: "8px" }}>
          🎯 Celebrity + School Rankings
        </h2>
        <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
          Weighing: celebrity appeal × basketball fit × school market × storytelling
        </p>
      </div>

      {/* Elite Tier (1-10) */}
      <div style={{
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}>
        <div
          onClick={() => toggleTier('elite')}
          style={{
            padding: isMobile ? "14px 16px" : "16px 20px",
            cursor: "pointer",
            background: expandedTiers.has('elite') ? "rgba(59, 130, 246, 0.08)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: expandedTiers.has('elite') ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#3b82f6",
              }} />
              <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "#3b82f6", margin: 0 }}>
                THE ELITE TIER
              </h3>
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                (1-10)
              </span>
            </div>
            {expandedTiers.has('elite') ? <ChevronUp size={18} color="#3b82f6" /> : <ChevronDown size={18} color="#6b7280" />}
          </div>
        </div>

        {expandedTiers.has('elite') && (
          <div style={{ padding: isMobile ? "12px" : "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {eliteTier.map((target) => (
                <div
                  key={target.rank}
                  style={{
                    padding: isMobile ? "12px" : "14px 16px",
                    borderRadius: "8px",
                    background: "rgba(59, 130, 246, 0.05)",
                    border: "1px solid rgba(59, 130, 246, 0.15)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                    <span style={{
                      minWidth: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {target.rank}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <span style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 600, color: "var(--foreground)" }}>
                          {target.name}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                          ⚪ Not Contacted
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#3b82f6", marginBottom: "6px" }}>
                        📍 {target.school}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground)", lineHeight: 1.5, opacity: 0.9 }}>
                        {target.reasoning}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strong Contenders (11-20) */}
      <div style={{
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}>
        <div
          onClick={() => toggleTier('strong')}
          style={{
            padding: isMobile ? "14px 16px" : "16px 20px",
            cursor: "pointer",
            background: expandedTiers.has('strong') ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: expandedTiers.has('strong') ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10b981",
              }} />
              <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "#10b981", margin: 0 }}>
                STRONG CONTENDERS
              </h3>
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                (11-20)
              </span>
            </div>
            {expandedTiers.has('strong') ? <ChevronUp size={18} color="#10b981" /> : <ChevronDown size={18} color="#6b7280" />}
          </div>
        </div>

        {expandedTiers.has('strong') && (
          <div style={{ padding: isMobile ? "12px" : "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {strongContenders.map((target) => (
                <div
                  key={target.rank}
                  style={{
                    padding: isMobile ? "12px" : "14px 16px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.05)",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                    <span style={{
                      minWidth: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {target.rank}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <span style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 600, color: "var(--foreground)" }}>
                          {target.name}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                          ⚪ Not Contacted
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#10b981", marginBottom: "6px" }}>
                        📍 {target.school}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground)", lineHeight: 1.5, opacity: 0.9 }}>
                        {target.reasoning}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tier 2 (21-40) */}
      <div style={{
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}>
        <div
          onClick={() => toggleTier('tier2')}
          style={{
            padding: isMobile ? "14px 16px" : "16px 20px",
            cursor: "pointer",
            background: expandedTiers.has('tier2') ? "rgba(139, 92, 246, 0.08)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: expandedTiers.has('tier2') ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#8b5cf6",
              }} />
              <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "#8b5cf6", margin: 0 }}>
                TIER 2: SOLID OPTIONS
              </h3>
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                (21-40)
              </span>
            </div>
            {expandedTiers.has('tier2') ? <ChevronUp size={18} color="#8b5cf6" /> : <ChevronDown size={18} color="#6b7280" />}
          </div>
        </div>

        {expandedTiers.has('tier2') && (
          <div style={{ padding: isMobile ? "12px" : "16px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "8px",
            }}>
              {tier2.map((target, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: "rgba(139, 92, 246, 0.05)",
                    border: "1px solid rgba(139, 92, 246, 0.15)",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>
                    {target.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8b5cf6" }}>
                    📍 {target.school}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TasksTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      padding: isMobile ? "16px" : "24px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
        ✅ Task Tracker
      </h2>
      <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
        View full task tracker in TASKS.md
      </p>

      {/* Priority 1 */}
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f59e0b", marginBottom: "12px" }}>
        Priority 1: Lock UIC + Grover (THIS WEEK)
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        <TaskItem task="Draft Grover commitment letter" status="🟡 In Progress" due="2026-02-17" />
        <TaskItem task="Schedule UIC athletic director call" status="⚪ Todo" due="2026-02-15" />
        <TaskItem task="Draft UIC MOU (non-binding)" status="⚪ Todo" due="2026-02-20" />
        <TaskItem task="Finalize Grover commitment" status="⚪ Todo" due="2026-02-20" />
      </div>

      {/* Priority 2 */}
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#3b82f6", marginBottom: "12px" }}>
        Priority 2: Pre-Term Sheet Package (NEXT 2 WEEKS)
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <TaskItem task="Build 1-page financial model" status="🟡 In Progress" due="2026-02-20" />
        <TaskItem task="Legal structure memo (2-pager)" status="⚪ Todo" due="2026-02-20" />
        <TaskItem task="Round structure slide" status="⚪ Todo" due="2026-02-18" />
        <TaskItem task="VC pitch update" status="⚪ Todo" due="2026-02-22" />
      </div>
    </div>
  );
}

function FinancialsTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Year 1 Model */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
          💰 Year 1 Financial Model
        </h2>

        {/* Revenue */}
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px" }}>
          Revenue Sources
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          <FinancialRow label="Streaming/Media Rights" value="$4M" />
          <FinancialRow label="Jersey Sponsors" value="$2M" />
          <FinancialRow label="Sponsorships/Licensing" value="$5M" />
          <FinancialRow label="Donations" value="$4M" />
          <FinancialRow label="Conference Distribution" value="$1M" />
          <FinancialRow label="Ticket Sales" value="$1M" />
          <FinancialRow label="Other" value="$2M" />
          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
          <FinancialRow label="TOTAL REVENUE" value="$19M" bold />
        </div>

        {/* Investment */}
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px" }}>
          Investment Uses
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <FinancialRow label="NIL/Player Compensation" value="$6M" />
          <FinancialRow label="Coaching/Staff" value="$1.5M" />
          <FinancialRow label="Scholarships" value="$950K" />
          <FinancialRow label="Facilities Upgrades" value="$1M" />
          <FinancialRow label="Recruiting" value="$800K" />
          <FinancialRow label="Operations" value="$2.75M" />
          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
          <FinancialRow label="TOTAL INVESTMENT" value="$13M" bold />
        </div>
      </div>

      {/* Returns */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(16, 185, 129, 0.05)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#10b981", marginBottom: "12px" }}>
          📊 Returns
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <FinancialRow label="Net Profit" value="$6M" />
          <FinancialRow label="Investor Share (49%)" value="$2.94M" />
          <FinancialRow label="Investor Return" value="$4.3M" color="#10b981" bold />
          <FinancialRow label="ROI" value="33%" color="#10b981" bold />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: "8px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}>
      <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}

function TaskItem({ task, status, due }: { task: string; status: string; due: string }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: "6px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div>
        <span style={{ fontSize: "14px", color: "var(--foreground)" }}>{task}</span>
        <span style={{ fontSize: "12px", color: "var(--foreground-muted)", marginLeft: "8px" }}>
          {status}
        </span>
      </div>
      <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
        {due}
      </span>
    </div>
  );
}

function FinancialRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
      <span style={{ color: "var(--foreground)", fontWeight: bold ? 600 : 400 }}>
        {label}
      </span>
      <span style={{ color: color || "var(--foreground)", fontWeight: bold ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}
