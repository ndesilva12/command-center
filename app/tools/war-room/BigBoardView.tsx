"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Trash2,
  X,
  History,
  ArrowUpDown,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fmt } from "./utils";

interface BigBoardPlayer {
  _rowIndex: string;
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
  Added: string;
}

type SortKey = "Player" | "Team" | "PPG" | "RPG" | "APG" | "FG%" | "3P%" | "Added";
type SortDir = "asc" | "desc";

const POSITION_COLORS: Record<string, string> = {
  G: "#3b82f6",
  PG: "#3b82f6",
  SG: "#60a5fa",
  F: "#10b981",
  SF: "#10b981",
  PF: "#34d399",
  C: "#f59e0b",
};

export function BigBoardView({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [players, setPlayers] = useState<BigBoardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [search, setSearch] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("PPG");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Removing
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);

  // Expanded rows (for school history)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Clearing
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cinderella/rankings?bust=${Date.now()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlayers(data.players || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, syncTrigger]);

  const removePlayer = async (playerName: string) => {
    setRemovingPlayer(playerName);
    try {
      const res = await fetch(`/api/cinderella/rankings?player=${encodeURIComponent(playerName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPlayers(prev => prev.filter(p => p.Player !== playerName));
      }
    } catch (e) {
      console.error('Failed to remove player:', e);
    } finally {
      setRemovingPlayer(null);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/cinderella/rankings?clearAll=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        setPlayers([]);
        setShowClearConfirm(false);
      }
    } catch (e) {
      console.error('Failed to clear:', e);
    } finally {
      setClearing(false);
    }
  };

  // Filtered + sorted data
  const sortedData = useMemo(() => {
    let data = players.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.Player.toLowerCase().includes(q) && !p.Team.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    data.sort((a, b) => {
      let aVal: string | number = a[sortKey] || "";
      let bVal: string | number = b[sortKey] || "";

      if (["PPG", "RPG", "APG", "FG%", "3P%"].includes(sortKey)) {
        aVal = parseFloat(aVal as string) || 0;
        bVal = parseFloat(bVal as string) || 0;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }
      return sortDir === "desc" 
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });

    return data;
  }, [players, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleExpand = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#a78bfa" }} />
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>Loading Big Board…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "14px" }}>
        {error}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <Star size={48} style={{ color: "#4b5563", marginBottom: "16px" }} />
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#e5e7eb", marginBottom: "8px" }}>Big Board is Empty</h3>
        <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "400px", margin: "0 auto" }}>
          Go to the <strong>Players</strong> tab and click "Add" on players you want to track on your Big Board.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Stats + Actions bar */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", alignItems: "center" }}>
        <Star size={16} style={{ color: "#a78bfa" }} />
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#a78bfa" }}>{players.length}</strong> players on Big Board
        </span>
        
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#9ca3af", fontSize: "12px", cursor: "pointer" }}>
            <RefreshCw size={12} />
            Refresh
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: "12px", cursor: "pointer" }}
          >
            <Trash2 size={12} />
            Clear All
          </button>
        </div>
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <AlertTriangle size={18} style={{ color: "#ef4444" }} />
          <span style={{ fontSize: "14px", color: "#fca5a5" }}>Remove all {players.length} players from Big Board?</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button onClick={() => setShowClearConfirm(false)} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#9ca3af", fontSize: "12px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={clearAll} disabled={clearing} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "12px", fontWeight: 600, cursor: clearing ? "wait" : "pointer" }}>
              {clearing ? "Clearing…" : "Yes, Clear All"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "320px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search Big Board…"
          style={{
            width: "100%",
            padding: "10px 12px 10px 38px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#f3f4f6",
            fontSize: "14px",
            outline: "none",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{ fontSize: "12px", color: "#6b7280" }}>
        Showing <strong style={{ color: "#e5e7eb" }}>{sortedData.length}</strong> players
        {search && sortedData.length !== players.length && <span> (filtered)</span>}
        <span style={{ marginLeft: "12px", color: "#4b5563" }}>Click column headers to sort • Click row to expand school history</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid rgba(139,92,246,0.2)", background: "rgba(255,255,255,0.01)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: isMobile ? "700px" : "auto" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.05)" }}>
              <th style={{ padding: "10px 8px", textAlign: "left", width: "32px" }}></th>
              {(["Player", "Team", "Position", "Year", "PPG", "RPG", "APG", "FG%", "3P%", "Added"] as const).map(col => {
                const isSortable = ["Player", "Team", "PPG", "RPG", "APG", "FG%", "3P%", "Added"].includes(col);
                const isActive = sortKey === col;
                const isNumeric = ["PPG", "RPG", "APG", "FG%", "3P%"].includes(col);
                return (
                  <th
                    key={col}
                    onClick={() => isSortable && handleSort(col as SortKey)}
                    style={{
                      padding: "10px 8px",
                      textAlign: isNumeric ? "right" : "left",
                      cursor: isSortable ? "pointer" : "default",
                      color: isActive ? "#a78bfa" : "#9ca3af",
                      fontWeight: 600,
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                    }}
                  >
                    {col === "Position" ? "Pos" : col}
                    {isActive && (sortDir === "desc" ? " ↓" : " ↑")}
                  </th>
                );
              })}
              <th style={{ padding: "10px 8px", textAlign: "center", width: "50px", color: "#6b7280", fontSize: "11px" }}>
                <Trash2 size={12} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((player, i) => {
              const isExpanded = expandedRows.has(player._rowIndex);
              const hasHistory = !!player["School History"];
              const posColor = POSITION_COLORS[player.Position] || "#6b7280";
              const ppg = parseFloat(player.PPG) || 0;

              return (
                <React.Fragment key={player._rowIndex}>
                  <tr
                    style={{
                      borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.05)",
                      background: isExpanded ? "rgba(139,92,246,0.05)" : (i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"),
                      cursor: hasHistory ? "pointer" : "default",
                    }}
                    onClick={() => hasHistory && toggleExpand(player._rowIndex)}
                  >
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      {hasHistory && (
                        isExpanded ? <ChevronUp size={14} style={{ color: "#a78bfa" }} /> : <ChevronDown size={14} style={{ color: "#4b5563" }} />
                      )}
                    </td>
                    <td style={{ padding: "8px", fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap" }}>
                      {player.Player}
                    </td>
                    <td style={{ padding: "8px", color: "#9ca3af", whiteSpace: "nowrap" }}>{player.Team}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: `${posColor}20`, color: posColor }}>
                        {player.Position}
                      </span>
                    </td>
                    <td style={{ padding: "8px", color: "#9ca3af" }}>{player.Year}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: ppg >= 15 ? "#10b981" : ppg >= 10 ? "#60a5fa" : "#d1d5db" }}>{fmt(player.PPG)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#d1d5db" }}>{fmt(player.RPG)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#d1d5db" }}>{fmt(player.APG)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#9ca3af" }}>{player["FG%"] ? `${fmt(player["FG%"])}%` : "—"}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#9ca3af" }}>{player["3P%"] ? `${fmt(player["3P%"])}%` : "—"}</td>
                    <td style={{ padding: "8px", color: "#6b7280", fontSize: "11px" }}>{player.Added || "—"}</td>
                    <td style={{ padding: "8px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => removePlayer(player.Player)}
                        disabled={removingPlayer === player.Player}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)",
                          color: "#f87171",
                          cursor: removingPlayer === player.Player ? "wait" : "pointer",
                          opacity: removingPlayer === player.Player ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && hasHistory && (
                    <tr>
                      <td colSpan={12} style={{ padding: "0", background: "rgba(139,92,246,0.03)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                        <div style={{ padding: "12px 16px 12px 48px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <History size={14} style={{ color: "#a78bfa", marginTop: "2px", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "#a78bfa", marginBottom: "6px", letterSpacing: "0.05em" }}>SCHOOL HISTORY</div>
                              <div style={{ fontSize: "13px", color: "#d1d5db", lineHeight: 1.5 }}>
                                {player["School History"].split(" → ").map((school, idx, arr) => (
                                  <span key={idx}>
                                    <span style={{ color: idx === arr.length - 1 ? "#10b981" : "#9ca3af" }}>{school}</span>
                                    {idx < arr.length - 1 && <span style={{ color: "#4b5563", margin: "0 8px" }}>→</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {sortedData.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
            No players match your search.
          </div>
        )}
      </div>
    </div>
  );
}
