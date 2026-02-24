"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Target, Users, Building2, FileText, TrendingUp, ExternalLink, Mail, Calendar, Scale, ChevronDown, ChevronUp, UserCheck, RefreshCw, Search, Plus, X, Check } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ToolBackground } from "@/components/tools/ToolBackground";

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
  const [activeTab, setActiveTab] = useState<'overview' | 'communications' | 'calendar' | 'targets' | 'legal' | 'financials' | 'reps'>('overview');
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
      <Sidebar />
      <ToolBackground color={toolCustom.color} />
      <main
        style={{
          paddingTop: isMobile ? "72px" : "80px",
          paddingBottom: isMobile ? "88px" : "32px",
          paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 24px)",
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
            { id: 'reps', label: 'Reps', icon: UserCheck },
            { id: 'legal', label: 'Legal', icon: Scale },
            { id: 'financials', label: 'Financials', icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              style={{
                padding: isMobile ? "8px 16px" : "10px 20px",
                borderRadius: "8px",
                border: activeTab === id ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                background: activeTab === id ? "rgba(59, 130, 246, 0.12)" : "rgba(255, 255, 255, 0.03)",
                color: activeTab === id ? "#60a5fa" : "rgba(255, 255, 255, 0.7)",
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
        {activeTab === 'reps' && <RepsTab isMobile={isMobile} />}
        {activeTab === 'legal' && <LegalTab isMobile={isMobile} />}
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
      case 'Medium': return '#6366f1';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10b981';
      case 'Scheduled': return '#3b82f6';
      case 'Waiting': return '#8b5cf6';
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
    { title: "Lock UIC + Grover", target: "This Week (Feb 17)", status: "In Progress", color: "#6366f1" },
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
      case 'Medium': return '#6366f1';
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

      {/* Task deadlines removed — see War Room for project tracking */}

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
        background: "rgba(99, 102, 241, 0.05)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#6366f1", marginBottom: "12px" }}>
          Current Status
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
          color="#6366f1"
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
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#6366f1" }}>91%</div>
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
          color: "#3b82f6",
          fontFamily: "monospace",
        }}>
          /home/ubuntu/.openclaw/workspace/cinderella/
        </code>
      </div>
    </div>
  );
}

// Known reps data for celebrity targets
const CELEBRITY_REPS: Record<string, { agent?: string; manager?: string; agency?: string }> = {
  "Liev Schreiber": { agent: "Bryan Lourd", agency: "CAA", manager: "Rick Yorn (LBI Entertainment)" },
  "Mark Wahlberg": { agent: "Patrick Whitesell", agency: "WME", manager: "Stephen Levinson (Leverage Management)" },
  "Drake": { manager: "Adel 'Future' Nur (OVO)" },
  "Kevin Hart": { agent: "Dave Becky (3 Arts)", manager: "Scooter Braun (SB Projects)" },
  "Ryan Reynolds": { agent: "Joe Machota", agency: "CAA", manager: "George Dewey" },
  "Will Ferrell": { agent: "Jimmy Miller", agency: "Mosaic", manager: "Jimmy Miller (Mosaic)" },
  "Adam Sandler": { agent: "Brad Slater", agency: "WME" },
  "Ice Cube": { agent: "Jeff Kwatinetz (Prospect Park)", manager: "Self (Cube Vision)" },
  "Snoop Dogg": { agency: "WME", manager: "Nick Adler" },
  "Shaquille O'Neal": { manager: "Perry Rogers (PRP Management)" },
  "LeBron James": { agent: "Rich Paul", agency: "Klutch Sports", manager: "Maverick Carter (SpringHill)" },
  "Michael Jordan": { agent: "David Falk (FAME)", manager: "Curtis Polk" },
  "Jay-Z": { agency: "Roc Nation (self)" },
  "Travis Scott": { manager: "David Stromberg (Cactus Jack)", agent: "David Grutman" },
  "Tim Grover": { manager: "Self — Attack Athletics" },
  "Jason Sudeikis": { agency: "WME" },
  "Dana White": { manager: "Self" },
  "CJ McCollum": { agency: "CAA" },
  "Taylor Sheridan": { agency: "WME" },
};

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

  const tier3 = [
    { name: "David Letterman", school: "Ball St" },
    { name: "Jay Leno", school: "URI" },
    { name: "Dennis Leary", school: "Holy Cross" },
    { name: "Ryen Russillo", school: "Vermont" },
    { name: "Brad Paisley", school: "Belmont" },
    { name: "Luke Combs", school: "Appalachian St" },
    { name: "Eric Church", school: "Appalachian St" },
    { name: "Steve Martin", school: "Long Beach State" },
    { name: "Forest Whitaker", school: "Cal Poly" },
    { name: "Seth Meyers", school: "New Hampshire" },
    { name: "Adrien Brody", school: "Stony Brook" },
    { name: "Gucci Mane", school: "Georgia St" },
    { name: "Tim Allen", school: "Western Michigan" },
    { name: "John Goodman", school: "Missouri St" },
    { name: "Christopher Walken", school: "Hofstra" },
    { name: "Patton Oswalt", school: "William & Mary" },
    { name: "Jay Bilas", school: "Davidson" },
    { name: "Dan Patrick", school: "Dayton" },
    { name: "Jason Mraz", school: "VCU" },
    { name: "Billy Crystal", school: "Marshall" },
  ];

  const tier4 = [
    { name: "Cole Swindell", school: "Georgia Southern" },
    { name: "Dierks Bentley", school: "Vermont" },
    { name: "Druski", school: "Georgia Southern" },
    { name: "Paul Reiser", school: "Binghamton" },
    { name: "Tony Kornheiser", school: "Binghamton" },
    { name: "Casey Affleck", school: "GW" },
    { name: "Alec Baldwin", school: "GW" },
    { name: "Shawn Michaels", school: "Texas St" },
    { name: "George Strait", school: "Texas St" },
    { name: "Lori Greiner", school: "Loyola Chicago" },
    { name: "Bridget Moynahan", school: "UMass" },
    { name: "Brandy Clark", school: "Belmont" },
    { name: "Will Cain", school: "Pepperdine" },
    { name: "Michael Bolton", school: "New Haven" },
    { name: "Sage Steele", school: "Loyola Maryland" },
    { name: "Tom Selleck", school: "Loyola Marymount" },
    { name: "Paul Wight (Big Show)", school: "Wichita St" },
    { name: "Billy Beane", school: "UC San Diego" },
    { name: "Chris Matthews", school: "Holy Cross" },
    { name: "Jason Alexander", school: "Boston University" },
  ];

  const tier5 = [
    { name: "Chuck Norris", school: "Liberty" },
    { name: "Wally Szczerbiak", school: "Miami Ohio" },
    { name: "Bill O'Reilly", school: "Marist" },
    { name: "Eric Adams", school: "Marist" },
    { name: "Matt Bonner", school: "New Hampshire" },
    { name: "Triple H", school: "New Hampshire" },
    { name: "James Woods", school: "URI" },
    { name: "Olivia Culpo", school: "URI" },
    { name: "Pauly D", school: "URI" },
    { name: "Jeremy Piven", school: "Drake" },
    { name: "Rami Malek", school: "Evansville" },
    { name: "Scottie Pippen", school: "Central Arkansas" },
    { name: "Fred VanVleet", school: "Wichita St" },
    { name: "Montell Jordan", school: "Pepperdine" },
    { name: "Steve Wynn", school: "New Haven" },
    { name: "Julia Roberts", school: "Georgia St" },
    { name: "Julie Ertz", school: "Santa Clara" },
    { name: "Michael Smerconish", school: "Lehigh" },
    { name: "Steve Forbes", school: "Lehigh" },
    { name: "Leslie Baker", school: "Loyola Chicago" },
    { name: "Mike Breen", school: "Fordham" },
    { name: "John Grisham", school: "Arkansas St" },
    { name: "Tim Conway", school: "Bowling Green" },
    { name: "Wolf Blitzer", school: "Buffalo" },
    { name: "Michael Kelly", school: "Coastal Carolina" },
    { name: "Ken Ball", school: "George Mason" },
    { name: "Bob Saget", school: "Temple" },
    { name: "Hall & Oates", school: "Temple" },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return '#3b82f6'; // Light blue
      case 'strong': return '#10b981'; // Green
      case 'tier2': return '#8b5cf6'; // Purple
      case 'tier3': return '#6366f1'; // Orange
      case 'tier4': return '#ec4899'; // Pink
      case 'tier5': return '#6b7280'; // Gray
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
                      <div style={{ fontSize: "13px", color: "#3b82f6", marginBottom: "4px" }}>
                        📍 {target.school}
                      </div>
                      {CELEBRITY_REPS[target.name] && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                          {CELEBRITY_REPS[target.name].agent && (
                            <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", background: "rgba(59,130,246,0.1)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>
                              Agent: {CELEBRITY_REPS[target.name].agent}{CELEBRITY_REPS[target.name].agency ? ` · ${CELEBRITY_REPS[target.name].agency}` : ""}
                            </span>
                          )}
                          {CELEBRITY_REPS[target.name].manager && (
                            <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", background: "rgba(139,92,246,0.1)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>
                              Manager: {CELEBRITY_REPS[target.name].manager}
                            </span>
                          )}
                        </div>
                      )}
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
                      <div style={{ fontSize: "13px", color: "#10b981", marginBottom: "4px" }}>
                        📍 {target.school}
                      </div>
                      {CELEBRITY_REPS[target.name] && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                          {CELEBRITY_REPS[target.name].agent && (
                            <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", background: "rgba(59,130,246,0.1)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>
                              Agent: {CELEBRITY_REPS[target.name].agent}{CELEBRITY_REPS[target.name].agency ? ` · ${CELEBRITY_REPS[target.name].agency}` : ""}
                            </span>
                          )}
                          {CELEBRITY_REPS[target.name].manager && (
                            <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", background: "rgba(139,92,246,0.1)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>
                              Manager: {CELEBRITY_REPS[target.name].manager}
                            </span>
                          )}
                        </div>
                      )}
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

      {/* Tier 3 (41-60) */}
      <div style={{
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}>
        <div
          onClick={() => toggleTier('tier3')}
          style={{
            padding: isMobile ? "14px 16px" : "16px 20px",
            cursor: "pointer",
            background: expandedTiers.has('tier3') ? "rgba(107, 114, 128, 0.08)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: expandedTiers.has('tier3') ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#6366f1",
              }} />
              <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "#6366f1", margin: 0 }}>
                TIER 3: NOTABLE OPTIONS
              </h3>
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                (41-60)
              </span>
            </div>
            {expandedTiers.has('tier3') ? <ChevronUp size={18} color="#6366f1" /> : <ChevronDown size={18} color="#6b7280" />}
          </div>
        </div>

        {expandedTiers.has('tier3') && (
          <div style={{ padding: isMobile ? "12px" : "16px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "8px",
            }}>
              {tier3.map((target, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: "rgba(107, 114, 128, 0.05)",
                    border: "1px solid rgba(107, 114, 128, 0.15)",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>
                    {target.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6366f1" }}>
                    📍 {target.school}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tier 4 (61-80) */}
      <div style={{
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}>
        <div
          onClick={() => toggleTier('tier4')}
          style={{
            padding: isMobile ? "14px 16px" : "16px 20px",
            cursor: "pointer",
            background: expandedTiers.has('tier4') ? "rgba(236, 72, 153, 0.08)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: expandedTiers.has('tier4') ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#ec4899",
              }} />
              <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "#ec4899", margin: 0 }}>
                TIER 4: DEEPER CUTS
              </h3>
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                (61-80)
              </span>
            </div>
            {expandedTiers.has('tier4') ? <ChevronUp size={18} color="#ec4899" /> : <ChevronDown size={18} color="#6b7280" />}
          </div>
        </div>

        {expandedTiers.has('tier4') && (
          <div style={{ padding: isMobile ? "12px" : "16px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "8px",
            }}>
              {tier4.map((target, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: "rgba(236, 72, 153, 0.05)",
                    border: "1px solid rgba(236, 72, 153, 0.15)",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>
                    {target.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#ec4899" }}>
                    📍 {target.school}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tier 5 (81-100+) */}
      <div style={{
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}>
        <div
          onClick={() => toggleTier('tier5')}
          style={{
            padding: isMobile ? "14px 16px" : "16px 20px",
            cursor: "pointer",
            background: expandedTiers.has('tier5') ? "rgba(107, 114, 128, 0.08)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: expandedTiers.has('tier5') ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#6b7280",
              }} />
              <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "#6b7280", margin: 0 }}>
                TIER 5: LONG SHOTS
              </h3>
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                (81-100+)
              </span>
            </div>
            {expandedTiers.has('tier5') ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
          </div>
        </div>

        {expandedTiers.has('tier5') && (
          <div style={{ padding: isMobile ? "12px" : "16px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "8px",
            }}>
              {tier5.map((target, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: "rgba(107, 114, 128, 0.05)",
                    border: "1px solid rgba(107, 114, 128, 0.15)",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>
                    {target.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    📍 {target.school}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(59, 130, 246, 0.05)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#3b82f6", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          💡 Key Insights
        </h2>
        <ul style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.8, paddingLeft: "20px", margin: 0 }}>
          <li><strong>Top targets combine:</strong> A-list appeal + basketball connection + strong school market + compelling story</li>
          <li><strong>Surprise high rankings:</strong> Dana White, Jason Sudeikis, CJ McCollum (underrated basketball credibility)</li>
          <li><strong>HBCU angle:</strong> Michael Strahan + Texas Southern could be powerful</li>
          <li><strong>Multiple options at one school:</strong> URI has 6 options (Seth MacFarlane strongest), Charleston has 3 (Murray #1)</li>
        </ul>
        <div style={{
          marginTop: "16px",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
        }}>
          <p style={{ fontSize: "14px", color: "#10b981", margin: 0, fontWeight: 600 }}>
            ✅ Recommendation: Start outreach on the top 10 first
          </p>
          <p style={{ fontSize: "13px", color: "var(--foreground)", margin: "6px 0 0 0" }}>
            Focus on Elite Tier for maximum impact. Once we secure 1-2 commitments from this group, we can expand to Strong Contenders.
          </p>
        </div>
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
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#6366f1", marginBottom: "12px" }}>
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

// ─── REPS TAB ─────────────────────────────────────────────────────────────────

interface Rep {
  id: string;
  name: string;
  agency: string;
  role: string;
  clients: string;
  phone: string;
  email: string;
  notes: string;
}

function RepsTab({ isMobile }: { isMobile: boolean }) {
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterAgency, setFilterAgency] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cinderella/reps")
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setReps(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const agencies = ["All", ...Array.from(new Set(reps.map(r => r.agency).filter(Boolean))).sort()];

  const filtered = reps.filter(r => {
    if (filterAgency !== "All" && r.agency !== filterAgency) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.agency.toLowerCase().includes(q) || r.clients.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by agency
  const byAgency = filtered.reduce((acc, rep) => {
    const agency = rep.agency || "Independent";
    if (!acc[agency]) acc[agency] = [];
    acc[agency].push(rep);
    return acc;
  }, {} as Record<string, Rep[]>);

  const AGENCY_COLORS: Record<string, string> = {
    "CAA": "#3b82f6",
    "WME": "#10b981",
    "UTA": "#8b5cf6",
    "ICM": "#f59e0b",
    "3 Arts": "#ec4899",
    "Mosaic": "#6366f1",
    "Klutch Sports": "#ef4444",
    "Roc Nation": "#f59e0b",
    "OVO": "#a78bfa",
    "SB Projects": "#06b6d4",
  };

  const getAgencyColor = (agency: string) => AGENCY_COLORS[agency] || "#6b7280";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
      <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#3b82f6" }} />
      <span style={{ color: "#9ca3af", fontSize: "14px" }}>Loading reps…</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "14px" }}>{error}</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ padding: isMobile ? "16px" : "20px 24px", borderRadius: "12px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <UserCheck size={20} color="#a78bfa" />
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Celebrity Reps Directory</h2>
        </div>
        <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: 0 }}>
          Inverse view of Targets — organized by agent/manager. {reps.length} reps tracked across {agencies.length - 1} agencies.
        </p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by rep name, agency, or client…"
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--foreground)", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={filterAgency}
          onChange={e => setFilterAgency(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--foreground)", fontSize: "13px", outline: "none" }}
        >
          {agencies.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Reps grouped by agency */}
      {filterAgency !== "All" ? (
        // Flat list when filtering by agency
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(rep => (
            <RepCard key={rep.id} rep={rep} expanded={expandedId === rep.id} onToggle={() => setExpandedId(expandedId === rep.id ? null : rep.id)} isMobile={isMobile} agencyColor={getAgencyColor(rep.agency)} />
          ))}
        </div>
      ) : (
        // Grouped by agency
        Object.entries(byAgency).sort(([a], [b]) => a.localeCompare(b)).map(([agency, agencyReps]) => {
          const color = getAgencyColor(agency);
          return (
            <div key={agency} style={{ borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.08)`, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: `${color}10`, borderBottom: `1px solid ${color}25`, display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                <span style={{ fontSize: "14px", fontWeight: 700, color }}>{agency}</span>
                <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{agencyReps.length} rep{agencyReps.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {agencyReps.map(rep => (
                  <RepCard key={rep.id} rep={rep} expanded={expandedId === rep.id} onToggle={() => setExpandedId(expandedId === rep.id ? null : rep.id)} isMobile={isMobile} agencyColor={color} />
                ))}
              </div>
            </div>
          );
        })
      )}

      {filtered.length === 0 && !loading && (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "14px" }}>No reps found matching your filters.</div>
      )}
    </div>
  );
}

function RepCard({ rep, expanded, onToggle, isMobile, agencyColor }: { rep: Rep; expanded: boolean; onToggle: () => void; isMobile: boolean; agencyColor: string }) {
  const clientList = rep.clients.split(",").map(c => c.trim()).filter(Boolean);
  return (
    <div style={{ borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{rep.name}</span>
            <span style={{ padding: "1px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, background: `${agencyColor}20`, color: agencyColor }}>{rep.role}</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--foreground-muted)", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {clientList.length > 0 && (
              <span>
                <span style={{ color: "#6b7280" }}>Clients: </span>
                {clientList.slice(0, 3).join(", ")}{clientList.length > 3 ? ` +${clientList.length - 3} more` : ""}
              </span>
            )}
          </div>
        </div>
        <div style={{ color: "#6b7280", flexShrink: 0 }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
      </div>
      {expanded && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)" }}>
          {clientList.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "6px" }}>ALL CLIENTS</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {clientList.map((client, i) => (
                  <span key={i} style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", background: `${agencyColor}15`, color: agencyColor, border: `1px solid ${agencyColor}30` }}>{client}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }}>
            {rep.email && <a href={`mailto:${rep.email}`} style={{ color: "#60a5fa", textDecoration: "none" }}>{rep.email}</a>}
            {rep.phone && <span style={{ color: "var(--foreground-muted)" }}>{rep.phone}</span>}
            {rep.notes && <span style={{ color: "var(--foreground-muted)", fontStyle: "italic" }}>{rep.notes}</span>}
          </div>
        </div>
      )}
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
