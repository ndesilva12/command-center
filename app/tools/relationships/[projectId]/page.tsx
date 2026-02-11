"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Network, Plus, Loader2, Mail, Building, ArrowLeft, Trash2, Edit2, User } from "lucide-react";
import Link from "next/link";

interface Contact {
  email: string;
  name: string;
  company?: string;
  title?: string;
  tags: string[];
  keywords: string[];
  notes: string;
  lastContact: string;
  firstContact: string;
  interactionCount: number;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  keywords: string[];
  tags: string[];
  contactCount: number;
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
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    company: "",
    title: "",
    tags: "",
    keywords: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

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
      setContacts(data.contacts || []);
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!formData.email.trim() || !formData.name.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/relationships/projects/${projectId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          company: formData.company,
          title: formData.title,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          email: "",
          name: "",
          company: "",
          title: "",
          tags: "",
          keywords: "",
          notes: "",
        });
        loadProjectData();
      }
    } catch (error) {
      console.error("Failed to add contact:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/relationships/projects/${projectId}/contacts/${encodeURIComponent(editingContact.email)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            company: formData.company,
            title: formData.title,
            tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
            keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
            notes: formData.notes,
          }),
        }
      );

      if (response.ok) {
        setEditingContact(null);
        loadProjectData();
      }
    } catch (error) {
      console.error("Failed to update contact:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (email: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(
        `/api/relationships/projects/${projectId}/contacts/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        loadProjectData();
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      email: contact.email,
      name: contact.name,
      company: contact.company || "",
      title: contact.title || "",
      tags: contact.tags.join(", "),
      keywords: contact.keywords.join(", "),
      notes: contact.notes,
    });
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
                  <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
                    {contacts.length} contacts
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
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
                  Add Contact
                </button>
              </div>
            </div>

            {/* Contacts List */}
            {contacts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 24px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                }}
              >
                <User style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  No contacts yet
                </h3>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
                  Add your first contact to start tracking relationships
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
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
                  Add Contact
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {contacts.map((contact) => (
                  <div
                    key={contact.email}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                          {contact.name}
                        </h3>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
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

                        {contact.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                            {contact.tags.map((tag, idx) => (
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
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {contact.notes && (
                          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "12px" }}>
                            {contact.notes}
                          </p>
                        )}

                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "12px" }}>
                          Last contact: {new Date(contact.lastContact).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => openEditModal(contact)}
                          style={{
                            padding: "8px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            color: "var(--foreground-muted)",
                            cursor: "pointer",
                          }}
                        >
                          <Edit2 style={{ width: "16px", height: "16px" }} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.email)}
                          style={{
                            padding: "8px",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "6px",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add/Edit Contact Modal */}
      {(showAddModal || editingContact) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            overflow: "auto",
          }}
          onClick={() => {
            setShowAddModal(false);
            setEditingContact(null);
          }}
        >
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </h2>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingContact}
                  placeholder="contact@example.com"
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

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
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

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Inc"
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

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="CEO"
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

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="investor, advisor, mentor"
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

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="fintech, AI, SaaS"
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

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
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
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingContact(null);
                }}
                disabled={saving}
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
                onClick={editingContact ? handleUpdateContact : handleAddContact}
                disabled={saving || !formData.email.trim() || !formData.name.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: saving || !formData.email.trim() || !formData.name.trim()
                    ? "rgba(20, 184, 166, 0.3)"
                    : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: saving || !formData.email.trim() || !formData.name.trim() ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : editingContact ? "Update Contact" : "Add Contact"}
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
