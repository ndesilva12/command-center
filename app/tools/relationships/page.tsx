"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Network, Plus, Loader2, Users, ArrowRight, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  keywords: string[];
  dateFrom?: string;
  contactCount: number;
  needsFollowUp?: number;
  lastDiscovery?: string;
}

export default function RelationshipsPage() {
  return (
    <ProtectedRoute>
      <RelationshipsContent />
    </ProtectedRoute>
  );
}

function RelationshipsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectKeywords, setNewProjectKeywords] = useState("");
  const [newProjectDateFrom, setNewProjectDateFrom] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/relationships/projects");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const keywords = newProjectKeywords.split(",").map(k => k.trim()).filter(Boolean);
      const response = await fetch("/api/relationships/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          keywords,
          dateFrom: newProjectDateFrom || undefined,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewProjectName("");
        setNewProjectDescription("");
        setNewProjectKeywords("");
        setNewProjectDateFrom("");
        loadProjects();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This will also delete all contacts and analysis for this project.`)) {
      return;
    }

    setDeleting(projectId);
    try {
      const response = await fetch(`/api/relationships/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadProjects();
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="relationships" />
      <ToolBackground color="#14b8a6" />
      <main
        style={{
          paddingTop: isMobile ? "64px" : "136px",
          paddingBottom: isMobile ? "88px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
          maxWidth: "1400px",
          margin: "0 auto",
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
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Network style={{ width: "32px", height: "32px", color: "#14b8a6" }} />
              <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                Relationship Intelligence
              </h1>
            </div>
            <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
              AI-powered relationship tracking • Auto-discover contacts from your emails & calendar
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "flex",
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
            <Plus style={{ width: "16px", height: "16px" }} />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
            <Loader2 style={{ width: "32px", height: "32px", color: "#14b8a6", animation: "spin 1s linear infinite" }} />
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
            }}
          >
            <Network style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              No projects yet
            </h3>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
              Create your first project and let AI discover your relationships
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
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
              <Plus style={{ width: "16px", height: "16px" }} />
              Create Project
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/tools/relationships/${project.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "24px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(20, 184, 166, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                      {project.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                        disabled={deleting === project.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          padding: 0,
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: "6px",
                          cursor: deleting === project.id ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          opacity: deleting === project.id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (deleting !== project.id) {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                        }}
                      >
                        {deleting === project.id ? (
                          <Loader2 style={{ width: "16px", height: "16px", color: "#ef4444", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Trash2 style={{ width: "16px", height: "16px", color: "#ef4444" }} />
                        )}
                      </button>
                      <ArrowRight style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                    </div>
                  </div>

                  {project.description && (
                    <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
                      {project.description}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Users style={{ width: "16px", height: "16px", color: "#14b8a6" }} />
                      <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                        {project.contactCount} contacts
                      </span>
                    </div>
                    {project.needsFollowUp && project.needsFollowUp > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles style={{ width: "16px", height: "16px", color: "#ef4444" }} />
                        <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: 600 }}>
                          {project.needsFollowUp} need follow-up
                        </span>
                      </div>
                    )}
                  </div>

                  {project.keywords.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {project.keywords.slice(0, 3).map((keyword, idx) => (
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
                        {project.keywords.length > 3 && (
                          <span
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              background: "rgba(255, 255, 255, 0.05)",
                              color: "var(--foreground-muted)",
                              borderRadius: "4px",
                            }}
                          >
                            +{project.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                    {project.lastDiscovery 
                      ? `Last analyzed: ${new Date(project.lastDiscovery).toLocaleDateString()}`
                      : "Not yet analyzed"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>
              Create New Project
            </h2>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
              AI will analyze your emails and calendar to discover all relationships for this project
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Project Name *
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Cinderella Fundraising"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Description
              </label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Brief description to help AI understand what this project is about"
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={newProjectKeywords}
                onChange={(e) => setNewProjectKeywords(e.target.value)}
                placeholder="e.g., cinderella, fundraising, PE, investors"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
                AI will search for these keywords in email subjects, bodies, and calendar events
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Start Date (optional)
              </label>
              <input
                type="date"
                value={newProjectDateFrom}
                onChange={(e) => setNewProjectDateFrom(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
                Only analyze emails/events from this date forward (leave empty for all time)
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: creating || !newProjectName.trim()
                    ? "rgba(20, 184, 166, 0.3)"
                    : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: creating || !newProjectName.trim() ? "not-allowed" : "pointer",
                }}
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
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
