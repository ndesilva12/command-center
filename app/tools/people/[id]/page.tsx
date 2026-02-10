"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Calendar,
  FileText,
  Users,
  Sparkles
} from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface Person {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  relationship?: string;
  relationshipDetail?: string;
  location?: string;
  profession?: string;
  almaMater?: string;
  interests?: string;
  notes?: string;
}

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PersonDetailPage({ params }: PersonDetailPageProps) {
  const router = useRouter();
  const [personId, setPersonId] = useState<string | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Person>>({});

  useEffect(() => {
    params.then((p) => setPersonId(p.id));
  }, [params]);

  useEffect(() => {
    if (personId) {
      fetchPerson();
    }
  }, [personId]);

  const fetchPerson = async () => {
    if (!personId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/people/${personId}`);
      if (!response.ok) throw new Error("Failed to fetch person");
      const data = await response.json();
      setPerson(data.person);
      setFormData(data.person);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load person");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!personId) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update person");
      const data = await response.json();
      setPerson(data.person);
      setFormData(data.person);
      alert("Person updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update person");
      alert("Failed to update person: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!personId) return;

    if (!confirm(`Are you sure you want to delete ${person?.name}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/people/${personId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete person");
      router.push("/tools/people");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete person");
      alert("Failed to delete person: " + (err instanceof Error ? err.message : "Unknown error"));
      setDeleting(false);
    }
  };

  const handleInputChange = (field: keyof Person, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <>
        <TopNav />
        <BottomNav />
        <ToolNav currentToolId="people" />
        <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "900px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
            <div style={{ animation: "spin 1s linear infinite", width: "32px", height: "32px", border: "3px solid rgba(0, 170, 255, 0.3)", borderTop: "3px solid #00aaff", borderRadius: "50%" }}></div>
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

  if (error && !person) {
    return (
      <>
        <TopNav />
        <BottomNav />
        <ToolNav currentToolId="people" />
        <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "900px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
            <p>{error}</p>
            <button
              onClick={() => router.push("/tools/people")}
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
              Back to List
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="people" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "900px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => router.push("/tools/people")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
                color: "var(--foreground-muted)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <ArrowLeft style={{ width: "18px", height: "18px" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <User style={{ width: "24px", height: "24px", color: "#00aaff" }} />
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
                {person?.name || "Person Details"}
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(248, 113, 113, 0.1)",
                color: "#f87171",
                border: "1px solid rgba(248, 113, 113, 0.3)",
                cursor: deleting ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 500,
                opacity: deleting ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.1)";
              }}
            >
              <Trash2 style={{ width: "14px", height: "14px" }} />
              {deleting ? "Deleting..." : "Delete"}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 170, 255, 0.15)",
                color: "#00aaff",
                border: "1px solid rgba(0, 170, 255, 0.3)",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 500,
                opacity: saving ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = "rgba(0, 170, 255, 0.25)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 170, 255, 0.15)";
              }}
            >
              <Save style={{ width: "14px", height: "14px" }} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          {/* Basic Information */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User style={{ width: "16px", height: "16px", color: "#00aaff" }} />
              Basic Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Nickname
                </label>
                <input
                  type="text"
                  value={formData.nickname || ""}
                  onChange={(e) => handleInputChange("nickname", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail style={{ width: "16px", height: "16px", color: "#00aaff" }} />
              Contact Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart style={{ width: "16px", height: "16px", color: "#00aaff" }} />
              Personal Details
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Birthday
                </label>
                <input
                  type="text"
                  value={formData.birthday || ""}
                  onChange={(e) => handleInputChange("birthday", e.target.value)}
                  placeholder="e.g., January 15, 1990"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.relationship || ""}
                  onChange={(e) => handleInputChange("relationship", e.target.value)}
                  placeholder="e.g., Friend, Family, Colleague"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase style={{ width: "16px", height: "16px", color: "#00aaff" }} />
              Professional Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Profession
                </label>
                <input
                  type="text"
                  value={formData.profession || ""}
                  onChange={(e) => handleInputChange("profession", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Alma Mater
                </label>
                <input
                  type="text"
                  value={formData.almaMater || ""}
                  onChange={(e) => handleInputChange("almaMater", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles style={{ width: "16px", height: "16px", color: "#00aaff" }} />
              Additional Information
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Interests
                </label>
                <input
                  type="text"
                  value={formData.interests || ""}
                  onChange={(e) => handleInputChange("interests", e.target.value)}
                  placeholder="e.g., Photography, Travel, Cooking"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                />
              </div>
            </div>
          </div>
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
