"use client";

import { useState, useEffect } from "react";
import { Users, Plus, RefreshCw, ExternalLink, Search, X, Mail, Phone, MapPin, Briefcase, Grid, List, ArrowUpDown, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

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
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('people', 'People', '#6366f1');
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "relationship" | "location" | "profession">("name");
  const [filterRelationship, setFilterRelationship] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Load preferences from localStorage
    const savedViewMode = localStorage.getItem("people_viewMode");
    const savedSortBy = localStorage.getItem("people_sortBy");
    const savedFilter = localStorage.getItem("people_filterRelationship");

    if (savedViewMode) setViewMode(savedViewMode as "grid" | "list");
    if (savedSortBy) setSortBy(savedSortBy as "name" | "relationship" | "location" | "profession");
    if (savedFilter) setFilterRelationship(savedFilter);

    fetchPeople();
  }, []);

  useEffect(() => {
    // Save preferences to localStorage
    localStorage.setItem("people_viewMode", viewMode);
    localStorage.setItem("people_sortBy", sortBy);
    localStorage.setItem("people_filterRelationship", filterRelationship);
  }, [viewMode, sortBy, filterRelationship]);

  useEffect(() => {
    let filtered = people;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.nickname?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.profession?.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query)
      );
    }

    // Apply relationship filter
    if (filterRelationship !== "all") {
      filtered = filtered.filter((p) => p.relationship === filterRelationship);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      switch (sortBy) {
        case "name":
          aVal = a.name || "";
          bVal = b.name || "";
          break;
        case "relationship":
          aVal = a.relationship || "";
          bVal = b.relationship || "";
          break;
        case "location":
          aVal = a.location || "";
          bVal = b.location || "";
          break;
        case "profession":
          aVal = a.profession || "";
          bVal = b.profession || "";
          break;
      }

      return aVal.localeCompare(bVal);
    });

    setFilteredPeople(filtered);
  }, [searchQuery, people, sortBy, filterRelationship]);

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

  const displayPeople = filteredPeople;

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="people" />

      <main style={{
        paddingTop: isMobile ? "64px" : "136px",
        paddingBottom: isMobile ? "88px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              {toolCustom.name} {people.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({people.length})</span>}
            </h1>
          </div>
          
        </div>

        {/* Search Bar and Controls */}
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", flex: "1 1 300px", minWidth: "250px" }}>
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

          {/* Sort Dropdown */}
          <div style={{ position: "relative" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "relationship" | "location" | "profession")}
              className="people-select"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 32px 10px 36px",
                borderRadius: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--foreground)",
                fontSize: "13px",
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="name" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Sort: Name</option>
              <option value="relationship" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Sort: Relationship</option>
              <option value="location" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Sort: Location</option>
              <option value="profession" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Sort: Profession</option>
            </select>
            <ArrowUpDown style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--foreground-muted)", pointerEvents: "none" }} />
          </div>

          {/* Filter Dropdown */}
          <div style={{ position: "relative" }}>
            <select
              value={filterRelationship}
              onChange={(e) => setFilterRelationship(e.target.value)}
              className="people-select"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 32px 10px 36px",
                borderRadius: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--foreground)",
                fontSize: "13px",
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="all" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>All Relationships</option>
              <option value="Family" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Family</option>
              <option value="Friend" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Friend</option>
              <option value="Professional" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Professional</option>
              <option value="Acquaintance" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", color: "var(--foreground)" }}>Acquaintance</option>
            </select>
            <Filter style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--foreground-muted)", pointerEvents: "none" }} />
          </div>

          {/* View Toggle */}
          <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: "6px",
                backgroundColor: viewMode === "grid" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === "grid" ? "#00aaff" : "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Grid style={{ width: "16px", height: "16px" }} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: "6px",
                backgroundColor: viewMode === "list" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                color: viewMode === "list" ? "#00aaff" : "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <List style={{ width: "16px", height: "16px" }} />
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
                {searchQuery ? "Try a different search" : "Your people will appear here once you add them"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", padding: "20px" }}>
              {displayPeople.map((person) => (
                <div
                  key={person.id}
                  onClick={() => router.push(`/tools/people/${person.id}`)}
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
                        <span style={{ color: "#00aaff" }}>
                          {person.email}
                        </span>
                      </div>
                    )}

                    {person.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <Phone style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span style={{ color: "#00aaff" }}>
                          {person.phone}
                        </span>
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
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {displayPeople.map((person, index) => (
                <div
                  key={person.id}
                  onClick={() => router.push(`/tools/people/${person.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    padding: "16px 20px",
                    borderBottom: index < displayPeople.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ flex: "0 0 200px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>
                      {person.name}
                    </h3>
                    {person.nickname && (
                      <p style={{ fontSize: "12px", color: "var(--foreground-muted)", fontStyle: "italic" }}>
                        "{person.nickname}"
                      </p>
                    )}
                  </div>

                  <div style={{ flex: "0 0 150px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                    {person.relationship && (
                      <span style={{ color: "#00aaff", fontWeight: 500 }}>{person.relationship}</span>
                    )}
                  </div>

                  <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                    {person.profession && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Briefcase style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span>{person.profession}</span>
                      </div>
                    )}

                    {person.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span>{person.location}</span>
                      </div>
                    )}

                    {person.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Mail style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span style={{ color: "#00aaff" }}>{person.email}</span>
                      </div>
                    )}

                    {person.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Phone style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <span style={{ color: "#00aaff" }}>{person.phone}</span>
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
        .people-select option {
          background-color: rgb(10, 10, 10);
          color: #e0e0e0;
        }
      `}</style>
    </>
  );
}
