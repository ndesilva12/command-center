"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  RefreshCw,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  GripVertical,
} from "lucide-react";

interface BigBoardPlayer {
  Player: string;
  Team: string;
  Conference: string;
  Position: string;
  Year: string;
  PPG: string;
  RPG: string;
  APG: string;
  "FG%": string;
  "3P%": string;
  "School History": string;
}

interface DepthSlot {
  player: BigBoardPlayer | null;
}

interface DepthChart {
  PG: DepthSlot[];
  SG: DepthSlot[];
  SF: DepthSlot[];
  PF: DepthSlot[];
  C: DepthSlot[];
}

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const DEPTH_LEVELS = ["Starter", "2nd", "3rd", "4th"];
const POSITION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PG: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", text: "#60a5fa" },
  SG: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", text: "#818cf8" },
  SF: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#34d399" },
  PF: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
  C: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
};

export function DepthChartBuilder({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [bigBoardPlayers, setBigBoardPlayers] = useState<BigBoardPlayer[]>([]);
  const [depthChart, setDepthChart] = useState<DepthChart>({
    PG: [{ player: null }, { player: null }, { player: null }, { player: null }],
    SG: [{ player: null }, { player: null }, { player: null }, { player: null }],
    SF: [{ player: null }, { player: null }, { player: null }, { player: null }],
    PF: [{ player: null }, { player: null }, { player: null }, { player: null }],
    C: [{ player: null }, { player: null }, { player: null }, { player: null }],
  });
  const [loading, setLoading] = useState(true);
  const [showPlayerPicker, setShowPlayerPicker] = useState<{ pos: typeof POSITIONS[number]; depth: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load depth chart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cinderella-depth-chart");
    if (saved) {
      try {
        setDepthChart(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load depth chart:", e);
      }
    }
  }, []);

  // Save depth chart to localStorage
  const saveDepthChart = useCallback((chart: DepthChart) => {
    localStorage.setItem("cinderella-depth-chart", JSON.stringify(chart));
    setDepthChart(chart);
  }, []);

  // Fetch Big Board players
  useEffect(() => {
    setLoading(true);
    fetch(`/api/cinderella/rankings?bust=${syncTrigger}`)
      .then(r => r.json())
      .then(data => {
        setBigBoardPlayers(data.players || []);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

  const assignPlayer = (pos: typeof POSITIONS[number], depth: number, player: BigBoardPlayer | null) => {
    const newChart = { ...depthChart };
    newChart[pos] = [...newChart[pos]];
    newChart[pos][depth] = { player };
    saveDepthChart(newChart);
    setShowPlayerPicker(null);
    setSearchQuery("");
  };

  const removePlayer = (pos: typeof POSITIONS[number], depth: number) => {
    assignPlayer(pos, depth, null);
  };

  const clearAll = () => {
    const emptyChart: DepthChart = {
      PG: [{ player: null }, { player: null }, { player: null }, { player: null }],
      SG: [{ player: null }, { player: null }, { player: null }, { player: null }],
      SF: [{ player: null }, { player: null }, { player: null }, { player: null }],
      PF: [{ player: null }, { player: null }, { player: null }, { player: null }],
      C: [{ player: null }, { player: null }, { player: null }, { player: null }],
    };
    saveDepthChart(emptyChart);
  };

  // Get players already on depth chart
  const assignedPlayers = new Set<string>();
  POSITIONS.forEach(pos => {
    depthChart[pos].forEach(slot => {
      if (slot.player) assignedPlayers.add(slot.player.Player);
    });
  });

  // Filter available players for picker
  const availablePlayers = bigBoardPlayers.filter(p => {
    if (assignedPlayers.has(p.Player)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.Player.toLowerCase().includes(q) || p.Team.toLowerCase().includes(q);
    }
    return true;
  });

  // Count filled slots
  const filledCount = POSITIONS.reduce((acc, pos) => {
    return acc + depthChart[pos].filter(s => s.player).length;
  }, 0);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#34d399" }} />
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>Loading roster builder…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", alignItems: "center" }}>
        <Users size={16} style={{ color: "#34d399" }} />
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#34d399" }}>{filledCount}/20</strong> slots filled
          {" · "}<strong style={{ color: "#d1d5db" }}>{bigBoardPlayers.length}</strong> players on Big Board
        </span>
        <button
          onClick={clearAll}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: "12px", cursor: "pointer" }}
        >
          <Trash2 size={12} />
          Clear All
        </button>
      </div>

      {bigBoardPlayers.length === 0 && (
        <div style={{ padding: "24px", borderRadius: "10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", fontSize: "14px", textAlign: "center" }}>
          Add players to your <strong>Big Board</strong> first, then build your depth chart from those selections.
        </div>
      )}

      {/* Depth Chart Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", 
        gap: "12px",
      }}>
        {POSITIONS.map(pos => {
          const colors = POSITION_COLORS[pos];
          return (
            <div key={pos} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Position Header */}
              <div style={{
                padding: "10px",
                borderRadius: "8px",
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                textAlign: "center",
              }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: colors.text, letterSpacing: "0.1em" }}>
                  {pos}
                </span>
              </div>

              {/* Depth Slots */}
              {depthChart[pos].map((slot, depth) => {
                const isStarter = depth === 0;
                const player = slot.player;

                return (
                  <div
                    key={depth}
                    style={{
                      padding: player ? "10px" : "12px",
                      borderRadius: "8px",
                      background: player ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                      border: player 
                        ? `1px solid ${isStarter ? colors.border : "rgba(255,255,255,0.1)"}` 
                        : "1px dashed rgba(255,255,255,0.15)",
                      minHeight: player ? "auto" : "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      position: "relative",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onClick={() => !player && setShowPlayerPicker({ pos, depth })}
                  >
                    {player ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f3f4f6", marginBottom: "2px" }}>
                              {player.Player}
                            </div>
                            <div style={{ fontSize: "10px", color: "#6b7280" }}>
                              {player.Team}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removePlayer(pos, depth); }}
                            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px" }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "6px", fontSize: "11px", color: "#9ca3af" }}>
                          <span><strong style={{ color: "#d1d5db" }}>{player.PPG}</strong> PPG</span>
                          <span><strong style={{ color: "#d1d5db" }}>{player.RPG}</strong> RPG</span>
                          <span><strong style={{ color: "#d1d5db" }}>{player.APG}</strong> APG</span>
                        </div>
                        {isStarter && (
                          <div style={{ position: "absolute", top: "-8px", right: "8px", padding: "2px 6px", borderRadius: "4px", background: colors.bg, border: `1px solid ${colors.border}`, fontSize: "9px", fontWeight: 700, color: colors.text, letterSpacing: "0.05em" }}>
                            STARTER
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#4b5563" }}>
                        <Plus size={14} />
                        <span style={{ fontSize: "11px" }}>{DEPTH_LEVELS[depth]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Player Picker Modal */}
      {showPlayerPicker && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }} onClick={() => { setShowPlayerPicker(null); setSearchQuery(""); }}>
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "70vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#f3f4f6" }}>
                  Select {showPlayerPicker.pos} · {DEPTH_LEVELS[showPlayerPicker.depth]}
                </span>
                <button onClick={() => { setShowPlayerPicker(null); setSearchQuery(""); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players…"
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#f3f4f6",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
              {availablePlayers.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
                  {bigBoardPlayers.length === 0 
                    ? "No players on Big Board yet"
                    : searchQuery 
                      ? "No players match your search"
                      : "All players are already assigned"
                  }
                </div>
              ) : (
                availablePlayers.map(player => (
                  <div
                    key={player.Player}
                    onClick={() => assignPlayer(showPlayerPicker.pos, showPlayerPicker.depth, player)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginBottom: "4px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#f3f4f6" }}>{player.Player}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{player.Team} · {player.Position} · {player.Year}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>{player.PPG}</div>
                        <div style={{ fontSize: "10px", color: "#6b7280" }}>PPG</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
