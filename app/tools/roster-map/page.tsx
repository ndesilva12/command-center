"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { MapPin, Users, Search, Filter, ChevronDown, Globe, Building2 } from "lucide-react";

// Dynamic import for Leaflet (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface Player {
  name: string;
  position: string;
  height: string;
  weight: string;
  year: string;
  hometown: string;
  highSchool: string;
  lat?: number;
  lng?: number;
}

interface Team {
  id: string;
  name: string;
  conference: string;
  players: Player[];
}

interface TeamOption {
  id: string;
  name: string;
  conference: string;
}

export default function RosterMapPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization("roster-map", "Roster Map", "#f97316");

  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [conferences, setConferences] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState<string>("all");
  const [mapReady, setMapReady] = useState(false);

  // Load team list on mount
  useEffect(() => {
    fetch("/api/roster-map?action=teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data.teams || []);
        setConferences(data.conferences || []);
      })
      .catch(console.error);

    // Give Leaflet CSS time to load
    setTimeout(() => setMapReady(true), 100);
  }, []);

  // Filter teams by search and conference
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch = team.name
        .toLowerCase()
        .includes(teamSearch.toLowerCase());
      const matchesConference =
        conferenceFilter === "all" || team.conference === conferenceFilter;
      return matchesSearch && matchesConference;
    });
  }, [teams, teamSearch, conferenceFilter]);

  // Players with valid coordinates
  const mappedPlayers = useMemo(() => {
    if (!selectedTeam) return [];
    return selectedTeam.players.filter(
      (p) => p.lat !== undefined && p.lng !== undefined
    );
  }, [selectedTeam]);

  const handleSelectTeam = async (teamId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roster-map?action=roster&teamId=${teamId}`);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setSelectedTeam(data);
      }
    } catch (error) {
      console.error("Error fetching roster:", error);
      alert("Failed to fetch team roster");
    } finally {
      setLoading(false);
    }
  };

  // Calculate map center based on players
  const mapCenter = useMemo(() => {
    if (mappedPlayers.length === 0) return { lat: 39.8283, lng: -98.5795 }; // US center
    const avgLat =
      mappedPlayers.reduce((sum, p) => sum + (p.lat || 0), 0) /
      mappedPlayers.length;
    const avgLng =
      mappedPlayers.reduce((sum, p) => sum + (p.lng || 0), 0) /
      mappedPlayers.length;
    return { lat: avgLat, lng: avgLng };
  }, [mappedPlayers]);

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
      <div style={{ display: isMobile ? "block" : "flex", minHeight: "100vh" }}>
        {!isMobile && <Sidebar />}
        <main
          style={{
            flex: 1,
            minHeight: "100vh",
            paddingTop: isMobile ? "72px" : "76px",
            paddingBottom: isMobile ? "88px" : "24px",
            paddingLeft: isMobile ? "12px" : "24px",
            paddingRight: isMobile ? "12px" : "20px",
          }}
        >
        <ToolBackground color={toolCustom.color} />

        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <MapPin size={32} style={{ color: toolCustom.color }} />
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
                {toolCustom.name}
              </h1>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
                Visualize where college basketball players come from
              </p>
            </div>
          </div>

          {/* Main Layout: Sidebar + Map */}
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
            {/* Left: Team Selector */}
            <div className="glass card" style={{ padding: "20px", height: "fit-content" }}>
              {/* Search */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <Search size={16} style={{ color: "var(--muted)" }} />
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    Find Team
                  </span>
                </div>
                <input
                  type="text"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Search teams..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Conference Filter */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <Filter size={16} style={{ color: "var(--muted)" }} />
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    Conference
                  </span>
                </div>
                <select
                  value={conferenceFilter}
                  onChange={(e) => setConferenceFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                >
                  <option value="all">All Conferences</option>
                  {conferences.map((conf) => (
                    <option key={conf} value={conf}>
                      {conf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team List */}
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {filteredTeams.map((team) => (
                  <button
                    key={`${team.id}-${team.name}`}
                    onClick={() => handleSelectTeam(team.id)}
                    disabled={loading}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border:
                        selectedTeam?.name === team.name
                          ? `2px solid ${toolCustom.color}`
                          : "1px solid var(--glass-border)",
                      background:
                        selectedTeam?.name === team.name
                          ? `${toolCustom.color}15`
                          : "var(--glass-bg)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: selectedTeam?.name === team.name ? 600 : 400,
                      cursor: loading ? "not-allowed" : "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{team.name}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        background: "var(--glass-bg)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {team.conference}
                    </span>
                  </button>
                ))}
              </div>

              {filteredTeams.length === 0 && (
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "14px",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No teams found
                </p>
              )}
            </div>

            {/* Right: Map + Roster */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Map */}
              <div
                className="glass card"
                style={{
                  padding: "0",
                  height: "500px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {loading && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1000,
                    }}
                  >
                    <div style={{ textAlign: "center", color: "#fff" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "3px solid rgba(255,255,255,0.2)",
                          borderTop: `3px solid ${toolCustom.color}`,
                          borderRadius: "50%",
                          margin: "0 auto 12px",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      <p style={{ margin: 0 }}>Loading roster...</p>
                    </div>
                  </div>
                )}

                {mapReady && (
                  <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                    crossOrigin=""
                  />
                )}

                {mapReady && typeof window !== "undefined" && (
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={4}
                    style={{ height: "100%", width: "100%" }}
                    key={`${mapCenter.lat}-${mapCenter.lng}`}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mappedPlayers.map((player, idx) => (
                      <Marker
                        key={`${player.name}-${idx}`}
                        position={[player.lat!, player.lng!]}
                      >
                        <Popup>
                          <div style={{ minWidth: "150px" }}>
                            <strong style={{ fontSize: "14px" }}>{player.name}</strong>
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                              {player.position} • {player.year}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {player.hometown}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {player.height} • {player.weight} lbs
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}

                {!selectedTeam && !loading && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--glass-bg)",
                    }}
                  >
                    <div style={{ textAlign: "center", color: "var(--muted)" }}>
                      <Globe size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>Select a team to view player hometowns</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Roster Table */}
              {selectedTeam && (
                <div className="glass card" style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Building2 size={20} style={{ color: toolCustom.color }} />
                      <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                        {selectedTeam.name} Roster
                      </h3>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        color: "var(--muted)",
                      }}
                    >
                      <Users size={14} />
                      {selectedTeam.players.length} players •{" "}
                      {mappedPlayers.length} mapped
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "13px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid var(--glass-border)",
                          }}
                        >
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              fontWeight: 600,
                              color: "var(--muted)",
                            }}
                          >
                            Name
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              fontWeight: 600,
                              color: "var(--muted)",
                            }}
                          >
                            Pos
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              fontWeight: 600,
                              color: "var(--muted)",
                            }}
                          >
                            Year
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              fontWeight: 600,
                              color: "var(--muted)",
                            }}
                          >
                            Height
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              fontWeight: 600,
                              color: "var(--muted)",
                            }}
                          >
                            Hometown
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              padding: "10px 12px",
                              fontWeight: 600,
                              color: "var(--muted)",
                            }}
                          >
                            📍
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeam.players.map((player, idx) => (
                          <tr
                            key={`${player.name}-${idx}`}
                            style={{
                              borderBottom: "1px solid var(--glass-border)",
                            }}
                          >
                            <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                              {player.name}
                            </td>
                            <td style={{ padding: "10px 12px" }}>{player.position}</td>
                            <td style={{ padding: "10px 12px" }}>{player.year}</td>
                            <td style={{ padding: "10px 12px" }}>{player.height}</td>
                            <td style={{ padding: "10px 12px" }}>{player.hometown}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              {player.lat && player.lng ? (
                                <span style={{ color: "#22c55e" }}>✓</span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .leaflet-container {
          background: #1a1a2e;
        }
      `}</style>
    </>
  );
}
