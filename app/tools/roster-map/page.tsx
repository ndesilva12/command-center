"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { MapPin, Users, Search, Filter, Globe, Building2, RefreshCw, ChevronRight } from "lucide-react";

// Dynamic import for Leaflet (no SSR)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

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
  const [isMobile, setIsMobile] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetch("/api/roster-map?action=teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data.teams || []);
        setConferences(data.conferences || []);
      })
      .catch(console.error);

    setTimeout(() => setMapReady(true), 100);
  }, []);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch = team.name.toLowerCase().includes(teamSearch.toLowerCase());
      const matchesConference = conferenceFilter === "all" || team.conference === conferenceFilter;
      return matchesSearch && matchesConference;
    });
  }, [teams, teamSearch, conferenceFilter]);

  const mappedPlayers = useMemo(() => {
    if (!selectedTeam) return [];
    return selectedTeam.players.filter((p) => p.lat !== undefined && p.lng !== undefined);
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
        if (isMobile) setShowTeamPanel(false);
      }
    } catch (error) {
      console.error("Error fetching roster:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = useMemo(() => {
    if (mappedPlayers.length === 0) return { lat: 39.8283, lng: -98.5795 };
    const avgLat = mappedPlayers.reduce((sum, p) => sum + (p.lat || 0), 0) / mappedPlayers.length;
    const avgLng = mappedPlayers.reduce((sum, p) => sum + (p.lng || 0), 0) / mappedPlayers.length;
    return { lat: avgLat, lng: avgLng };
  }, [mappedPlayers]);

  return (
    <>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />

      <main style={{
        paddingTop: isMobile ? "64px" : "68px",
        paddingBottom: isMobile ? "80px" : "16px",
        paddingLeft: isMobile ? "0" : "calc(var(--sidebar-width, 240px) + 8px)",
        paddingRight: isMobile ? "0" : "8px",
        minHeight: "100vh",
      }}>
        {/* Full-width layout */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          height: isMobile ? "calc(100vh - 144px)" : "calc(100vh - 84px)",
          padding: isMobile ? "0" : "0",
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 16px" : "0 0 16px 0",
            borderBottom: isMobile ? "1px solid rgba(255,255,255,0.1)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <MapPin size={28} style={{ color: toolCustom.color }} />
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
                  {toolCustom.name}
                </h1>
                {selectedTeam && (
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", margin: 0 }}>
                    {selectedTeam.name} • {mappedPlayers.length} of {selectedTeam.players.length} mapped
                  </p>
                )}
              </div>
            </div>
            {selectedTeam && (
              <button
                onClick={() => setSelectedTeam(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--foreground-muted)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Main Content */}
          <div style={{ 
            display: "flex", 
            flex: 1, 
            gap: "10px",
            overflow: "hidden",
          }}>
            {/* Left Panel: Team Selector */}
            <div style={{
              width: isMobile ? (showTeamPanel ? "100%" : "0") : "300px",
              minWidth: isMobile ? "0" : "300px",
              transition: "width 0.3s",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {/* Search & Filter */}
              <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Search size={16} style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--foreground-muted)",
                    }} />
                    <input
                      type="text"
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      placeholder="Search teams..."
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 36px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "var(--foreground)",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
                <select
                  value={conferenceFilter}
                  onChange={(e) => setConferenceFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="all">All Conferences</option>
                  {conferences.map((conf) => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </select>
              </div>

              {/* Team List */}
              <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
                {filteredTeams.map((team) => (
                  <button
                    key={`${team.id}-${team.name}`}
                    onClick={() => handleSelectTeam(team.id)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      marginBottom: "4px",
                      borderRadius: "8px",
                      border: selectedTeam?.name === team.name
                        ? `2px solid ${toolCustom.color}`
                        : "1px solid transparent",
                      background: selectedTeam?.name === team.name
                        ? `${toolCustom.color}15`
                        : "rgba(255,255,255,0.03)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: selectedTeam?.name === team.name ? 600 : 400,
                      cursor: loading ? "wait" : "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{team.name}</span>
                    <span style={{
                      fontSize: "11px",
                      color: "var(--foreground-muted)",
                      background: "rgba(255,255,255,0.08)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                    }}>
                      {team.conference}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Map & Roster */}
            <div style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              gap: "10px",
              minWidth: 0,
            }}>
              {/* Large Map */}
              <div style={{
                flex: selectedTeam ? "0 0 55%" : "1",
                minHeight: "400px",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                {loading && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <RefreshCw size={32} style={{ 
                        color: toolCustom.color, 
                        animation: "spin 1s linear infinite" 
                      }} />
                      <p style={{ margin: "12px 0 0", color: "var(--foreground-muted)" }}>
                        Loading roster & geocoding hometowns...
                      </p>
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
                    zoom={mappedPlayers.length > 0 ? 4 : 4}
                    style={{ height: "100%", width: "100%" }}
                    key={`${mapCenter.lat}-${mapCenter.lng}-${selectedTeam?.id || 'none'}`}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {mappedPlayers.map((player, idx) => (
                      <CircleMarker
                        key={`${player.name}-${idx}`}
                        center={[player.lat!, player.lng!]}
                        radius={10}
                        pathOptions={{
                          color: "#fff",
                          fillColor: toolCustom.color,
                          fillOpacity: 0.9,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div style={{ minWidth: "180px", padding: "4px" }}>
                            <strong style={{ fontSize: "15px", display: "block", marginBottom: "6px" }}>
                              {player.name}
                            </strong>
                            <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
                              <div>{player.position} • {player.year}</div>
                              <div>{player.height} • {player.weight} lbs</div>
                              <div style={{ marginTop: "4px", fontWeight: 500 }}>📍 {player.hometown}</div>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                )}

                {!selectedTeam && !loading && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                  }}>
                    <div style={{ textAlign: "center", color: "var(--foreground-muted)" }}>
                      <Globe size={64} style={{ marginBottom: "16px", opacity: 0.4 }} />
                      <p style={{ margin: 0, fontSize: "16px" }}>Select a team to map player hometowns</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Roster Table - Only shown when team selected */}
              {selectedTeam && (
                <div style={{
                  flex: 1,
                  minHeight: "200px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}>
                  <div style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Building2 size={20} style={{ color: toolCustom.color }} />
                      <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                        {selectedTeam.name} Roster
                      </h3>
                    </div>
                    <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                      {selectedTeam.players.length} players
                    </span>
                  </div>

                  <div style={{ flex: 1, overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                          <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "13px", color: "var(--foreground-muted)" }}>Player</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "13px", color: "var(--foreground-muted)" }}>Pos</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "13px", color: "var(--foreground-muted)" }}>Year</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "13px", color: "var(--foreground-muted)" }}>Height</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "13px", color: "var(--foreground-muted)" }}>Hometown</th>
                          <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 600, fontSize: "13px", color: "var(--foreground-muted)" }}>Map</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeam.players.map((player, idx) => (
                          <tr key={`${player.name}-${idx}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 500, fontSize: "14px" }}>{player.name}</td>
                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "var(--foreground-muted)" }}>{player.position}</td>
                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "var(--foreground-muted)" }}>{player.year}</td>
                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "var(--foreground-muted)" }}>{player.height}</td>
                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "var(--foreground-muted)" }}>{player.hometown}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              {player.lat && player.lng ? (
                                <span style={{ color: "#22c55e", fontSize: "16px" }}>●</span>
                              ) : (
                                <span style={{ color: "var(--foreground-muted)", opacity: 0.4 }}>—</span>
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

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .leaflet-container {
          background: #1a1a2e;
        }
      `}</style>
    </>
  );
}
