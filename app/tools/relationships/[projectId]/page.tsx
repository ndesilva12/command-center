"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { 
  Network, Loader2, Mail, Calendar, Building, ArrowLeft, 
  Sparkles, ExternalLink, AlertCircle, TrendingUp, ChevronDown, 
  ChevronUp, RefreshCw 
} from "lucide-react";
import Link from "next/link";

interface EmailThread {
  threadId: string;
  subject: string;
  snippet: string;
  date: string;
  gmailLink: string;
}

interface CalendarEvent {
  eventId: string;
  summary: string;
  start: string;
  calendarLink: string;
}

interface Contact {
  email: string;
  name: string;
  company?: string;
  title?: string;
  emailThreads: EmailThread[];
  calendarEvents: CalendarEvent[];
  lastContact: string;
  firstContact: string;
  interactionCount: number;
  needsFollowUp: boolean;
  urgencyScore: number;
  notes: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  dateFrom?: string;
  contactCount: number;
  needsFollowUp?: number;
  lastDiscovery?: string;
}

interface DiscoverySummary {
  totalContacts: number;
  needsFollowUp: number;
  avgUrgency: number;
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectDetailContent />
    </ProtectedRoute>
  );
}

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [summary, setSummary] = useState<DiscoverySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'urgency' | 'recent' | 'name'>('urgency');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/relationships/projects/${projectId}`);
      const data = await response.json();
      setProject(data.project);
      
      if (data.contacts) {
        setContacts(data.contacts);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    if (!project) return;

    setDiscovering(true);
    try {
      const response = await fetch("/api/relationships/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          projectName: project.name,
          keywords: project.keywords,
          description: project.description,
          dateFrom: project.dateFrom,
        }),
      });

      if (response.ok) {
        // Poll for results
        const pollInterval = setInterval(async () => {
          const data = await fetch(`/api/relationships/projects/${projectId}`);
          const result = await data.json();
          
          if (result.contacts && result.contacts.length > 0) {
            clearInterval(pollInterval);
            setContacts(result.contacts);
            setSummary(result.summary);
            setDiscovering(false);
            setProject({ ...project, lastDiscovery: new Date().toISOString() });
          }
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (discovering) {
            setDiscovering(false);
            alert("Discovery is taking longer than expected. Please check back in a few minutes.");
          }
        }, 300000);
      } else {
        throw new Error("Failed to start discovery");
      }
    } catch (error) {
      console.error("Discovery error:", error);
      alert("Failed to start discovery");
      setDiscovering(false);
    }
  };

  const toggleContact = (email: string) => {
    const newExpanded = new Set(expandedContacts);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedContacts(newExpanded);
  };

  const getSortedContacts = () => {
    const sorted = [...contacts];
    switch (sortBy) {
      case 'urgency':
        return sorted.sort((a, b) => b.urgencyScore - a.urgencyScore);
      case 'recent':
        return sorted.sort((a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime());
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 8) return '#ef4444';
    if (score >= 5) return '#f59e0b';
    return '#10b981';
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="relationships" />
      <main
        style={{
          paddingTop: isMobile ? "80px" : "136px",
          paddingBottom: isMobile ? "80px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
            <Loader2 style={{ width: "32px", height: "32px", color: "#14b8a6", animation: "spin 1s linear infinite" }} />
          </div>
        ) : !project ? (
          <div style={{ textAlign: "center", padding: "64px" }}>
            <p style={{ color: "var(--foreground-muted)" }}>Project not found</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
              <Link
                href="/tools/relationships"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--foreground-muted)",
                  textDecoration: "none",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                <ArrowLeft style={{ width: "16px", height: "16px" }} />
                Back to Projects
              </Link>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <Network style={{ width: "32px", height: "32px", color: "#14b8a6" }} />
                    <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                      {project.name}
                    </h1>
                  </div>
                  {project.description && (
                    <p style={{ fontSize: "15px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                      {project.description}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {project.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: "rgba(20, 184, 166, 0.1)",
                          color: "#14b8a6",
                          borderRadius: "4px",
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleDiscover}
                  disabled={discovering}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: discovering
                      ? "rgba(20, 184, 166, 0.3)"
                      : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: discovering ? "not-allowed" : "pointer",
                  }}
                >
                  {discovering ? (
                    <>
                      <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Sparkles style={{ width: "16px", height: "16px" }} />
                      {contacts.length > 0 ? "Re-discover" : "Discover Contacts"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            {summary && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    padding: "20px",
                    background: "rgba(20, 184, 166, 0.1)",
                    border: "1px solid rgba(20, 184, 166, 0.2)",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "#14b8a6", marginBottom: "8px" }}>Total Contacts</div>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#14b8a6" }}>{summary.totalContacts}</div>
                </div>
                <div
                  style={{
                    padding: "20px",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "#f59e0b", marginBottom: "8px" }}>Need Follow-up</div>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#f59e0b" }}>{summary.needsFollowUp}</div>
                </div>
                <div
                  style={{
                    padding: "20px",
                    background: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "#6366f1", marginBottom: "8px" }}>Avg Urgency</div>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#6366f1" }}>{summary.avgUrgency.toFixed(1)}/10</div>
                </div>
              </div>
            )}

            {/* Sort Controls */}
            {contacts.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "16px",
                  padding: "16px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                }}
              >
                <label style={{ fontSize: "14px", color: "var(--foreground-muted)", marginRight: "8px" }}>
                  Sort by:
                </label>
                {(['urgency', 'recent', 'name'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    style={{
                      padding: "8px 16px",
                      background: sortBy === sort ? "rgba(20, 184, 166, 0.2)" : "rgba(255, 255, 255, 0.05)",
                      border: sortBy === sort ? "1px solid rgba(20, 184, 166, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      color: sortBy === sort ? "#14b8a6" : "var(--foreground-muted)",
                      fontSize: "13px",
                      fontWeight: sortBy === sort ? 600 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Contacts List */}
            {contacts.length === 0 && !discovering ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 24px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                }}
              >
                <Sparkles style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  No contacts discovered yet
                </h3>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
                  Click "Discover Contacts" to let AI analyze your emails and calendar
                </p>
                <button
                  onClick={handleDiscover}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Sparkles style={{ width: "16px", height: "16px" }} />
                  Discover Contacts
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {getSortedContacts().map((contact) => {
                  const isExpanded = expandedContacts.has(contact.email);
                  const urgencyColor = getUrgencyColor(contact.urgencyScore);

                  return (
                    <div
                      key={contact.email}
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${contact.needsFollowUp ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      {/* Contact Header */}
                      <div
                        onClick={() => toggleContact(contact.email)}
                        style={{
                          padding: isMobile ? "16px" : "20px",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                                {contact.name}
                              </h3>
                              {contact.needsFollowUp && (
                                <AlertCircle style={{ width: "18px", height: "18px", color: "#f59e0b" }} />
                              )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Mail style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                                <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>{contact.email}</span>
                              </div>

                              {contact.company && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <Building style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                                  <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                                    {contact.title ? `${contact.title} at ${contact.company}` : contact.company}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  background: `${urgencyColor}20`,
                                  color: urgencyColor,
                                }}
                              >
                                Urgency: {contact.urgencyScore}/10
                              </span>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  background: "rgba(99, 102, 241, 0.2)",
                                  color: "#6366f1",
                                }}
                              >
                                {contact.interactionCount} interactions
                              </span>
                              {contact.needsFollowUp && (
                                <span
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    background: "rgba(245, 158, 11, 0.2)",
                                    color: "#f59e0b",
                                  }}
                                >
                                  Needs follow-up
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            {isExpanded ? (
                              <ChevronUp style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                            ) : (
                              <ChevronDown style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                            )}
                          </div>
                        </div>

                        {!isExpanded && contact.notes && (
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--foreground-muted)",
                              fontStyle: "italic",
                              lineHeight: 1.5,
                            }}
                          >
                            {contact.notes.substring(0, 120)}{contact.notes.length > 120 ? "..." : ""}
                          </div>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: isMobile ? "16px" : "20px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                            background: "rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          {/* Notes */}
                          {contact.notes && (
                            <div style={{ marginBottom: "20px" }}>
                              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px" }}>
                                Relationship Notes
                              </h4>
                              <div
                                style={{
                                  padding: "12px",
                                  background: "rgba(255, 255, 255, 0.03)",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  color: "var(--foreground)",
                                  lineHeight: 1.6,
                                }}
                              >
                                {contact.notes}
                              </div>
                            </div>
                          )}

                          {/* Email Threads */}
                          {contact.emailThreads.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px" }}>
                                📧 Email Threads ({contact.emailThreads.length})
                              </h4>
                              <div style={{ display: "grid", gap: "8px" }}>
                                {contact.emailThreads.slice(0, 5).map((thread, idx) => (
                                  <a
                                    key={idx}
                                    href={thread.gmailLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: "12px",
                                      background: "rgba(255, 255, 255, 0.03)",
                                      border: "1px solid rgba(255, 255, 255, 0.1)",
                                      borderRadius: "8px",
                                      textDecoration: "none",
                                      display: "block",
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", flex: 1 }}>
                                        {thread.subject}
                                      </span>
                                      <ExternalLink style={{ width: "14px", height: "14px", color: "#14b8a6", flexShrink: 0, marginLeft: "8px" }} />
                                    </div>
                                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                                      {thread.snippet}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                                      {new Date(thread.date).toLocaleDateString()}
                                    </div>
                                  </a>
                                ))}
                                {contact.emailThreads.length > 5 && (
                                  <div style={{ fontSize: "13px", color: "var(--foreground-muted)", textAlign: "center", padding: "8px" }}>
                                    +{contact.emailThreads.length - 5} more emails
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Calendar Events */}
                          {contact.calendarEvents.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px" }}>
                                📅 Calendar Events ({contact.calendarEvents.length})
                              </h4>
                              <div style={{ display: "grid", gap: "8px" }}>
                                {contact.calendarEvents.slice(0, 5).map((event, idx) => (
                                  <a
                                    key={idx}
                                    href={event.calendarLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: "12px",
                                      background: "rgba(255, 255, 255, 0.03)",
                                      border: "1px solid rgba(255, 255, 255, 0.1)",
                                      borderRadius: "8px",
                                      textDecoration: "none",
                                      display: "block",
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", flex: 1 }}>
                                        {event.summary}
                                      </span>
                                      <ExternalLink style={{ width: "14px", height: "14px", color: "#14b8a6", flexShrink: 0, marginLeft: "8px" }} />
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                                      {new Date(event.start).toLocaleDateString()}
                                    </div>
                                  </a>
                                ))}
                                {contact.calendarEvents.length > 5 && (
                                  <div style={{ fontSize: "13px", color: "var(--foreground-muted)", textAlign: "center", padding: "8px" }}>
                                    +{contact.calendarEvents.length - 5} more events
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Timeline */}
                          <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            First contact: {new Date(contact.firstContact).toLocaleDateString()} • 
                            Last contact: {new Date(contact.lastContact).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
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
