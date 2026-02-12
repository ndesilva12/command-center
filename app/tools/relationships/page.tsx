"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Network, Plus, Loader2, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  keywords: string[];
  tags: string[];
  contactCount: number;
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
  const [newProjectKeywords, setNewProjectKeywords] = useState("");
  const [creating, setCreating] = useState(false);

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
          keywords,
          tags: [],
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewProjectName("");
        setNewProjectKeywords("");
        loadProjects();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="relationships" />
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
                Relationships
              </h1>
            </div>
            <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
              Track and analyze your professional relationships across projects
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
              Create your first project to start tracking relationships
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
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
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
                    <ArrowRight style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Users style={{ width: "16px", height: "16px", color: "#14b8a6" }} />
                    <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                      {project.contactCount} contacts
                    </span>
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
                    Updated: {new Date(project.updatedAt).toLocaleDateString()}
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
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>
              Create New Project
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Fundraising Campaign"
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

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={newProjectKeywords}
                onChange={(e) => setNewProjectKeywords(e.target.value)}
                placeholder="e.g., fundraising, investors, seed round"
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
