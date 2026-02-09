"use client";

import { useState, useEffect } from "react";
import { Users, Plus, RefreshCw, ExternalLink, Search, X, Mail, Phone, MapPin, Briefcase } from "lucide-react";
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

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredPeople(
        people.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.nickname?.toLowerCase().includes(query) ||
            p.email?.toLowerCase().includes(query) ||
            p.profession?.toLowerCase().includes(query) ||
            p.location?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredPeople(people);
    }
  }, [searchQuery, people]);

  const fetchPeople = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/people");
      if (!response.ok) throw new Error("Failed to fetch people");
      const data = await response.json();
      setPeople(data.people || []);
      setFilteredPeople(data.people || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load people");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/people/import", { method: "POST" });
      const data = await response.json();
      
      if (response.ok) {
        await fetchPeople(); // Refresh list
        alert(`✅ Imported ${data.count} people from Notion`);
      } else {
        throw new Error(data.error || "Failed to sync");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync from Notion");
      alert("❌ " + (err instanceof Error ? err.message : "Failed to sync from Notion"));
    } finally {
      setSyncing(false);
    }
  };

  const displayPeople = searchQuery ? filteredPeople : people;

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="people" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              People {people.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({people.length})</span>}
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://www.notion.so/2fbbedd4141981deaf93da2dee6e098a"
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
              Open in Notion
            </a>
            
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: syncing ? "not-allowed" : "pointer",
                fontSize: "13px",
                opacity: syncing ? 0.5 : 1,
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px", animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? "Syncing..." : "Sync from Notion"}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "14px" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            )}
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
                onClick={fetchPeople}
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
          ) : displayPeople.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Users style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                {searchQuery ? "No people found" : "No people yet"}
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                {searchQuery ? "Try a different search" : "Click 'Sync from Notion' to import your contacts"}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", padding: "20px" }}>
              {displayPeople.map((person) => (
                <div
                  key={person.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    padding: "16px",
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                    e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                      {person.name}
                    </h3>
                    {person.nickname && (
                      <p style={{ fontSize: "13px", color: "var(--foreground-muted)", fontStyle: "italic" }}>
                        "{person.nickname}"
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {person.relationship && (
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <span style={{ color: "#00aaff", fontWeight: 500 }}>{person.relationship}</span>
                        {person.relationshipDetail && <span> • {person.relationshipDetail}</span>}
                      </div>
                    )}
                    
                    {person.profession && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <Briefcase style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span>{person.profession}</span>
                      </div>
                    )}

                    {person.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <MapPin style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span>{person.location}</span>
                      </div>
                    )}

                    {person.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <Mail style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <a href={`mailto:${person.email}`} style={{ color: "#00aaff", textDecoration: "none" }}>
                          {person.email}
                        </a>
                      </div>
                    )}

                    {person.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <Phone style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <a href={`tel:${person.phone}`} style={{ color: "#00aaff", textDecoration: "none" }}>
                          {person.phone}
                        </a>
                      </div>
                    )}

                    {person.interests && (
                      <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <span style={{ fontWeight: 500 }}>Interests:</span> {person.interests}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
