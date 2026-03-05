"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  X,
  History,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { fmt } from "./utils";

interface Player {
  _rowIndex: string;
  Conference: string;
  Team: string;
  Player: string;
  Position: string;
  Year: string;
  PPG: string;
  RPG: string;
  APG: string;
  "FG%": string;
  "3P%": string;
  "School History": string;
  "Power Conf": string;
  PORPAG: string;
}

const ITEMS_PER_PAGE = 50;

const POSITION_COLORS: Record<string, string> = {
  G: "#3b82f6",
  PG: "#3b82f6",
  SG: "#60a5fa",
  F: "#10b981",
  SF: "#10b981",
  PF: "#34d399",
  C: "#d4af37",
};

export function BartTorvik({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [filterConf, setFilterConf] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Big Board tracking
  const [bigBoardPlayers, setBigBoardPlayers] = useState<Set<string>>(new Set());
  const [addingPlayer, setAddingPlayer] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [playersRes, rankingsRes] = await Promise.all([
        fetch(`/api/cinderella/full-database?bust=${Date.now()}`),
        fetch(`/api/cinderella/rankings?bust=${Date.now()}`),
      ]);
      const playersData = await playersRes.json();
      const rankingsData = await rankingsRes.json();
      
      if (playersData.error) throw new Error(playersData.error);
      
      // Filter to only players with PORPAG rating
      const withPorpag = (playersData.players || []).filter((p: Player) => p.PORPAG && parseFloat(p.PORPAG) !== 0);
      setPlayers(withPorpag);
      setLastFetched(new Date());

      // Track Big Board players
      const onBoard = new Set<string>();
      (rankingsData.players || []).forEach((p: any) => {
        if (p.Player) onBoard.add(p.Player);
      });
      setBigBoardPlayers(onBoard);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, syncTrigger]);

  const addToBigBoard = async (player: Player) => {
    setAddingPlayer(player.Player);
    try {
      const res = await fetch('/api/cinderella/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: player.Player,
          team: player.Team,
          conference: player.Conference,
          position: player.Position,
          year: player.Year,
          ppg: player.PPG,
          rpg: player.RPG,
          apg: player.APG,
          fg: player["FG%"],
          threePt: player["3P%"],
          schoolHistory: player["School History"],
        }),
      });
      if (res.ok) {
        setBigBoardPlayers(prev => new Set([...prev, player.Player]));
        setRecentlyAdded(prev => new Set([...prev, player.Player]));
        setTimeout(() => {
          setRecentlyAdded(prev => {
            const next = new Set(prev);
            next.delete(player.Player);
            return next;
          });
        }, 2000);
      }
    } catch (e) {
      console.error('Failed to add player:', e);
    } finally {
      setAddingPlayer(null);
    }
  };

  // Get unique values for filters
  const positions = useMemo(() => [...new Set(players.map(p => p.Position).filter(Boolean))].sort(), [players]);
  const conferences = useMemo(() => [...new Set(players.map(p => p.Conference).filter(Boolean))].sort(), [players]);

  // Sorted by PORPAG (the Torvik rating)
  const sortedData = useMemo(() => {
    let data = players.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.Player.toLowerCase().includes(q) && !p.Team.toLowerCase().includes(q)) return false;
      }
      if (filterPos && p.Position !== filterPos) return false;
      if (filterConf && p.Conference !== filterConf) return false;
      return true;
    });

    // Sort by PORPAG descending
    data.sort((a, b) => (parseFloat(b.PORPAG) || 0) - (parseFloat(a.PORPAG) || 0));

    return data;
  }, [players, search, filterPos, filterConf]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedData, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterPos, filterConf]);

  const toggleExpand = (playerId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setFilterPos("");
    setFilterConf("");
  };

  const hasActiveFilters = search || filterPos || filterConf;

  // Get rank for a player
  const getRank = (player: Player) => {
    return sortedData.findIndex(p => p.Player === player.Player) + 1;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#7c3aed" }} />
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>Loading Bart Torvik rankings…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", color: "#7c3aed", fontSize: "14px" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)", alignItems: "center" }}>
        <TrendingUp size={16} style={{ color: "#7c3aed" }} />
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#7c3aed" }}>{players.length}</strong> players with PORPAG ratings
          {" · "}<strong style={{ color: "#d4af37" }}>{bigBoardPlayers.size}</strong> on Big Board
        </span>
        <a 
          href="https://barttorvik.com/playerstat.php?link=y&year=2026&start=20251101&end=20260501"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#9ca3af", fontSize: "12px", textDecoration: "none" }}
        >
          <ExternalLink size={12} />
          View on barttorvik.com
        </a>
        {lastFetched && (
          <span style={{ fontSize: "11px", color: "#6b7280" }}>
            Synced: {lastFetched.toLocaleTimeString()}
          </span>
        )}
        <button onClick={fetchData} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px", display: "flex" }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: isMobile ? "1" : "0 0 320px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players or teams…"
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
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: hasActiveFilters ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.12)",
            background: hasActiveFilters ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
            color: hasActiveFilters ? "#a78bfa" : "#9ca3af",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <Filter size={14} />
          Filters
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.1)", color: "#a78bfa", fontSize: "12px", cursor: "pointer" }}>
            Clear All
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <select
            value={filterPos}
            onChange={e => setFilterPos(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a1a", color: "#d1d5db", fontSize: "13px" }}
          >
            <option value="">All Positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={filterConf}
            onChange={e => setFilterConf(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a1a", color: "#d1d5db", fontSize: "13px" }}
          >
            <option value="">All Conferences</option>
            {conferences.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Results count + pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "13px", color: "#6b7280" }}>
          Showing <strong style={{ color: "#e5e7eb" }}>{paginatedData.length}</strong> of <strong style={{ color: "#e5e7eb" }}>{sortedData.length}</strong> players
          <span style={{ marginLeft: "8px", color: "#4b5563" }}>· Ranked by PORPAG (Points Over Replacement Per Adjusted Game)</span>
        </span>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === 1 ? "#4b5563" : "#9ca3af", cursor: page === 1 ? "default" : "pointer" }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === totalPages ? "#4b5563" : "#9ca3af", cursor: page === totalPages ? "default" : "pointer" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid rgba(124,58,237,0.2)", background: "rgba(255,255,255,0.01)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: isMobile ? "800px" : "auto" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.05)" }}>
              <th style={{ padding: "10px 8px", textAlign: "center", width: "50px", color: "#7c3aed", fontWeight: 700, fontSize: "11px" }}>RANK</th>
              <th style={{ padding: "10px 8px", textAlign: "left", width: "32px" }}></th>
              <th style={{ padding: "10px 8px", textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: "11px" }}>Player</th>
              <th style={{ padding: "10px 8px", textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: "11px" }}>Team</th>
              <th style={{ padding: "10px 8px", textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: "11px" }}>Pos</th>
              <th style={{ padding: "10px 8px", textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: "11px" }}>Year</th>
              <th style={{ padding: "10px 8px", textAlign: "right", color: "#7c3aed", fontWeight: 700, fontSize: "11px" }}>PORPAG</th>
              <th style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af", fontWeight: 600, fontSize: "11px" }}>PPG</th>
              <th style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af", fontWeight: 600, fontSize: "11px" }}>RPG</th>
              <th style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af", fontWeight: 600, fontSize: "11px" }}>APG</th>
              <th style={{ padding: "10px 8px", textAlign: "center", width: "40px", color: "#6b7280", fontSize: "11px" }}>
                <History size={12} />
              </th>
              <th style={{ padding: "10px 8px", textAlign: "center", width: "50px", color: "#6b7280", fontSize: "11px" }}>
                <Plus size={12} />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((player, i) => {
              const isExpanded = expandedRows.has(player._rowIndex);
              const hasHistory = !!player["School History"];
              const posColor = POSITION_COLORS[player.Position] || "#6b7280";
              const porpag = parseFloat(player.PORPAG) || 0;
              const rank = getRank(player);

              return (
                <React.Fragment key={player._rowIndex}>
                  <tr
                    style={{
                      borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.05)",
                      background: isExpanded ? "rgba(124,58,237,0.05)" : (i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"),
                      cursor: hasHistory ? "pointer" : "default",
                    }}
                    onClick={() => hasHistory && toggleExpand(player._rowIndex)}
                  >
                    <td style={{ padding: "8px", textAlign: "center", fontWeight: 800, color: rank <= 10 ? "#7c3aed" : rank <= 50 ? "#d4af37" : "#6b7280" }}>
                      {rank}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      {hasHistory && (
                        isExpanded ? <ChevronUp size={14} style={{ color: "#7c3aed" }} /> : <ChevronDown size={14} style={{ color: "#4b5563" }} />
                      )}
                    </td>
                    <td style={{ padding: "8px", fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap" }}>
                      {player.Player}
                      {player["Power Conf"] === "TRUE" && (
                        <Star size={10} style={{ marginLeft: "6px", color: "#d4af37", verticalAlign: "middle" }} fill="#d4af37" />
                      )}
                    </td>
                    <td style={{ padding: "8px", color: "#9ca3af", whiteSpace: "nowrap" }}>{player.Team}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: `${posColor}20`, color: posColor }}>
                        {player.Position}
                      </span>
                    </td>
                    <td style={{ padding: "8px", color: "#9ca3af" }}>{player.Year}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 800, color: porpag >= 5 ? "#7c3aed" : porpag >= 3 ? "#d4af37" : "#d1d5db" }}>
                      {fmt(player.PORPAG)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#d1d5db" }}>{fmt(player.PPG)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#d1d5db" }}>{fmt(player.RPG)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#d1d5db" }}>{fmt(player.APG)}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      {hasHistory && <History size={12} style={{ color: "#7c3aed" }} />}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                      {bigBoardPlayers.has(player.Player) ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: recentlyAdded.has(player.Player) ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.1)", color: recentlyAdded.has(player.Player) ? "#10b981" : "#6b7280", fontSize: "10px", fontWeight: 600 }}>
                          <Check size={10} />
                        </span>
                      ) : (
                        <button
                          onClick={() => addToBigBoard(player)}
                          disabled={addingPlayer === player.Player}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid rgba(124,58,237,0.4)",
                            background: "rgba(124,58,237,0.1)",
                            color: "#a78bfa",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: addingPlayer === player.Player ? "wait" : "pointer",
                            opacity: addingPlayer === player.Player ? 0.6 : 1,
                          }}
                        >
                          {addingPlayer === player.Player ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={10} />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && hasHistory && (
                    <tr>
                      <td colSpan={12} style={{ padding: "0", background: "rgba(124,58,237,0.03)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
                        <div style={{ padding: "12px 16px 12px 70px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <History size={14} style={{ color: "#7c3aed", marginTop: "2px", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "#7c3aed", marginBottom: "6px", letterSpacing: "0.05em" }}>SCHOOL HISTORY</div>
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
        {paginatedData.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
            No players match your filters.
          </div>
        )}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === 1 ? "#4b5563" : "#9ca3af", fontSize: "12px", cursor: page === 1 ? "default" : "pointer" }}>First</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === 1 ? "#4b5563" : "#9ca3af", cursor: page === 1 ? "default" : "pointer" }}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: "13px", color: "#9ca3af", padding: "0 8px" }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === totalPages ? "#4b5563" : "#9ca3af", cursor: page === totalPages ? "default" : "pointer" }}><ChevronRight size={14} /></button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === totalPages ? "#4b5563" : "#9ca3af", fontSize: "12px", cursor: page === totalPages ? "default" : "pointer" }}>Last</button>
        </div>
      )}
    </div>
  );
}
