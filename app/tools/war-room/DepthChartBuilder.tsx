"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  RefreshCw,
  Plus,
  X,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import { fmt } from "./utils";

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
  id: string;
  name: string;
  PG: DepthSlot[];
  SG: DepthSlot[];
  SF: DepthSlot[];
  PF: DepthSlot[];
  C: DepthSlot[];
}

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const POSITION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PG: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", text: "#60a5fa" },
  SG: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", text: "#818cf8" },
  SF: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#34d399" },
  PF: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
  C: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
};

const createEmptyChart = (id: string, name: string, rows: number = 4): DepthChart => ({
  id,
  name,
  PG: Array(rows).fill(null).map(() => ({ player: null })),
  SG: Array(rows).fill(null).map(() => ({ player: null })),
  SF: Array(rows).fill(null).map(() => ({ player: null })),
  PF: Array(rows).fill(null).map(() => ({ player: null })),
  C: Array(rows).fill(null).map(() => ({ player: null })),
});

const DEFAULT_CHARTS: DepthChart[] = [
  createEmptyChart("chart-1", "Scenario A"),
  createEmptyChart("chart-2", "Scenario B"),
  createEmptyChart("chart-3", "Scenario C"),
];

export function DepthChartBuilder({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [bigBoardPlayers, setBigBoardPlayers] = useState<BigBoardPlayer[]>([]);
  const [charts, setCharts] = useState<DepthChart[]>(DEFAULT_CHARTS);
  const [activeChartId, setActiveChartId] = useState<string>("chart-1");
  const [loading, setLoading] = useState(true);
  const [showPlayerPicker, setShowPlayerPicker] = useState<{ pos: typeof POSITIONS[number]; depth: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [hoveredAddRow, setHoveredAddRow] = useState(false);

  const activeChart = charts.find(c => c.id === activeChartId) || charts[0];

  // Load charts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cinderella-depth-charts-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCharts(parsed);
          setActiveChartId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load depth charts:", e);
      }
    }
  }, []);

  // Save charts to localStorage
  const saveCharts = useCallback((newCharts: DepthChart[]) => {
    localStorage.setItem("cinderella-depth-charts-v2", JSON.stringify(newCharts));
    setCharts(newCharts);
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

  const updateChart = (chartId: string, updates: Partial<DepthChart>) => {
    const newCharts = charts.map(c => 
      c.id === chartId ? { ...c, ...updates } : c
    );
    saveCharts(newCharts);
  };

  const assignPlayer = (pos: typeof POSITIONS[number], depth: number, player: BigBoardPlayer | null) => {
    const newPositionSlots = [...activeChart[pos]];
    newPositionSlots[depth] = { player };
    updateChart(activeChartId, { [pos]: newPositionSlots });
    setShowPlayerPicker(null);
    setSearchQuery("");
  };

  const removePlayer = (pos: typeof POSITIONS[number], depth: number) => {
    assignPlayer(pos, depth, null);
  };

  const clearChart = (chartId: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;
    const rowCount = chart.PG.length;
    updateChart(chartId, {
      PG: Array(rowCount).fill(null).map(() => ({ player: null })),
      SG: Array(rowCount).fill(null).map(() => ({ player: null })),
      SF: Array(rowCount).fill(null).map(() => ({ player: null })),
      PF: Array(rowCount).fill(null).map(() => ({ player: null })),
      C: Array(rowCount).fill(null).map(() => ({ player: null })),
    });
  };

  const addRow = () => {
    const newCharts = charts.map(c => {
      if (c.id === activeChartId) {
        return {
          ...c,
          PG: [...c.PG, { player: null }],
          SG: [...c.SG, { player: null }],
          SF: [...c.SF, { player: null }],
          PF: [...c.PF, { player: null }],
          C: [...c.C, { player: null }],
        };
      }
      return c;
    });
    saveCharts(newCharts);
  };

  const removeRow = () => {
    if (activeChart.PG.length <= 1) return;
    const newCharts = charts.map(c => {
      if (c.id === activeChartId) {
        return {
          ...c,
          PG: c.PG.slice(0, -1),
          SG: c.SG.slice(0, -1),
          SF: c.SF.slice(0, -1),
          PF: c.PF.slice(0, -1),
          C: c.C.slice(0, -1),
        };
      }
      return c;
    });
    saveCharts(newCharts);
  };

  const startEditingName = (chartId: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (chart) {
      setEditingName(chartId);
      setTempName(chart.name);
    }
  };

  const saveChartName = () => {
    if (editingName && tempName.trim()) {
      updateChart(editingName, { name: tempName.trim() });
    }
    setEditingName(null);
    setTempName("");
  };

  // Get players already on this depth chart
  const assignedPlayers = new Set<string>();
  POSITIONS.forEach(pos => {
    activeChart[pos].forEach(slot => {
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
    return acc + activeChart[pos].filter(s => s.player).length;
  }, 0);
  const totalSlots = activeChart.PG.length * 5;

  const getDepthLabel = (depth: number): string => {
    if (depth === 0) return "Starter";
    return `${depth + 1}${depth === 1 ? "nd" : depth === 2 ? "rd" : "th"}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#34d399" }} />
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>Loading depth charts…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Scenario Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {charts.map(chart => {
          const isActive = chart.id === activeChartId;
          const isEditing = editingName === chart.id;
          return (
            <div
              key={chart.id}
              onClick={() => !isEditing && setActiveChartId(chart.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: isActive ? "1px solid rgba(52,211,153,0.5)" : "1px solid rgba(255,255,255,0.1)",
                background: isActive ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
                cursor: isEditing ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveChartName()}
                    autoFocus
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#34d399",
                      fontSize: "13px",
                      fontWeight: 600,
                      width: "100px",
                    }}
                  />
                  <button onClick={saveChartName} style={{ background: "none", border: "none", color: "#34d399", cursor: "pointer", padding: "2px" }}>
                    <Check size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, color: isActive ? "#34d399" : "#9ca3af" }}>
                    {chart.name}
                  </span>
                  {isActive && (
                    <button
                      onClick={e => { e.stopPropagation(); startEditingName(chart.id); }}
                      style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px" }}
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", alignItems: "center" }}>
        <Users size={16} style={{ color: "#34d399" }} />
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#34d399" }}>{filledCount}/{totalSlots}</strong> slots filled
          {" · "}<strong style={{ color: "#d1d5db" }}>{activeChart.PG.length}</strong> rows
          {" · "}<strong style={{ color: "#d1d5db" }}>{bigBoardPlayers.length}</strong> on Big Board
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button
            onClick={removeRow}
            disabled={activeChart.PG.length <= 1}
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: activeChart.PG.length <= 1 ? "#4b5563" : "#9ca3af", fontSize: "11px", cursor: activeChart.PG.length <= 1 ? "default" : "pointer" }}
          >
            − Row
          </button>
          <button
            onClick={addRow}
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)", color: "#34d399", fontSize: "11px", cursor: "pointer" }}
          >
            + Row
          </button>
          <button
            onClick={() => clearChart(activeChartId)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: "12px", cursor: "pointer" }}
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {bigBoardPlayers.length === 0 && (
        <div style={{ padding: "24px", borderRadius: "10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", fontSize: "14px", textAlign: "center" }}>
          Add players to your <strong>Big Board</strong> first, then build your depth charts from those selections.
        </div>
      )}

      {/* Depth Chart Grid */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", 
          gap: "12px",
          position: "relative",
        }}
        onMouseEnter={() => setHoveredAddRow(true)}
        onMouseLeave={() => setHoveredAddRow(false)}
      >
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
              {activeChart[pos].map((slot, depth) => {
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
                          <span><strong style={{ color: "#d1d5db" }}>{fmt(player.PPG)}</strong> PPG</span>
                          <span><strong style={{ color: "#d1d5db" }}>{fmt(player.RPG)}</strong> RPG</span>
                          <span><strong style={{ color: "#d1d5db" }}>{fmt(player.APG)}</strong> APG</span>
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
                        <span style={{ fontSize: "11px" }}>{getDepthLabel(depth)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Add Row Button (appears on hover) */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "center",
          opacity: hoveredAddRow ? 1 : 0,
          transition: "opacity 0.2s",
          marginTop: "-4px",
        }}
      >
        <button
          onClick={addRow}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 20px",
            borderRadius: "20px",
            border: "1px dashed rgba(52,211,153,0.4)",
            background: "rgba(52,211,153,0.05)",
            color: "#34d399",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Plus size={14} />
          Add Row
        </button>
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
                  Select {showPlayerPicker.pos} · {getDepthLabel(showPlayerPicker.depth)}
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
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>{fmt(player.PPG)}</div>
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
