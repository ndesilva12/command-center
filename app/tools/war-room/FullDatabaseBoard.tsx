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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Star,
  Download,
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
  "ESPN ID": string;
  Position: string;
  Height: string;
  Weight: string;
  Year: string;
  GP: string;
  MPG: string;
  PPG: string;
  RPG: string;
  APG: string;
  SPG: string;
  BPG: string;
  TO: string;
  "FG%": string;
  "3P%": string;
  "FT%": string;
  "eFG%": string;
  "FT Rate": string;
  "AST:TO": string;
  FGM: string;
  FGA: string;
  "3PM": string;
  "3PA": string;
  FTM: string;
  FTA: string;
  "Power Conf": string;
  Selection: string;
  "School History": string;
  // Torvik advanced stats
  "Ast%": string;
  "OReb%": string;
  BPM: string;
}

type SortKey = "Player" | "Team" | "Conference" | "PPG" | "RPG" | "APG" | "MPG" | "FG%" | "3P%" | "eFG%" | "Ast%" | "OReb%" | "BPM";
type SortDir = "asc" | "desc";

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

const YEAR_ORDER: Record<string, number> = { Fr: 1, So: 2, Jr: 3, Sr: 4 };

// Generate Barttorvik player URL
const getBarttorvikUrl = (playerName: string, team: string) => {
  const player = encodeURIComponent(playerName);
  const teamClean = encodeURIComponent(team);
  return `https://barttorvik.com/player.php?year=2026&p=${player}&t=${teamClean}`;
};

// Generate ESPN player URL (if ESPN ID exists)
const getEspnUrl = (espnId: string, playerName: string) => {
  if (!espnId) return null;
  const slug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `https://www.espn.com/mens-college-basketball/player/_/id/${espnId}/${slug}`;
};

export function FullDatabaseBoard({ isMobile }: { isMobile: boolean }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [filterConf, setFilterConf] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterPowerConf, setFilterPowerConf] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("PPG");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);

  // Expanded rows (for school history)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // View mode
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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
      setPlayers(playersData.players || []);
      setLastFetched(new Date());

      // Track which players are on the Big Board
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
  }, [fetchData]);

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
          astPct: player["Ast%"],
          orebPct: player["OReb%"],
          bpm: player.BPM,
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

  // Extract unique values for filters
  const positions = useMemo(() => [...new Set(players.map(p => p.Position).filter(Boolean))].sort(), [players]);
  const conferences = useMemo(() => [...new Set(players.map(p => p.Conference).filter(Boolean))].sort(), [players]);
  const years = useMemo(() => [...new Set(players.map(p => p.Year).filter(Boolean))].sort((a, b) => (YEAR_ORDER[a] || 5) - (YEAR_ORDER[b] || 5)), [players]);

  // Filtered + sorted data
  const filteredData = useMemo(() => {
    let data = players.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.Player.toLowerCase().includes(q) && !p.Team.toLowerCase().includes(q)) return false;
      }
      if (filterPos && p.Position !== filterPos) return false;
      if (filterConf && p.Conference !== filterConf) return false;
      if (filterYear && p.Year !== filterYear) return false;
      if (filterPowerConf === true && p["Power Conf"] !== "TRUE") return false;
      if (filterPowerConf === false && p["Power Conf"] === "TRUE") return false;
      return true;
    });

    // Sort
    data.sort((a, b) => {
      let aVal: string | number = a[sortKey] || "";
      let bVal: string | number = b[sortKey] || "";

      // Numeric sort for stats
      if (["PPG", "RPG", "APG", "MPG", "FG%", "3P%", "eFG%", "Ast%", "OReb%", "BPM"].includes(sortKey)) {
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
  }, [players, search, filterPos, filterConf, filterYear, filterPowerConf, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  useEffect(() => {
    setPage(1); // Reset page when filters change
  }, [search, filterPos, filterConf, filterYear, filterPowerConf]);

  const toggleExpand = (playerId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterPos("");
    setFilterConf("");
    setFilterYear("");
    setFilterPowerConf(null);
  };

  const hasActiveFilters = search || filterPos || filterConf || filterYear || filterPowerConf !== null;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#3b82f6" }} />
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>Loading 1,244 players from Full Database…</span>
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
      {/* Stats bar */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#e5e7eb" }}>{players.length}</strong> total players
          {" · "}<strong style={{ color: "#d4af37" }}>{bigBoardPlayers.size}</strong> on Big Board
          {" · "}<strong style={{ color: "#10b981" }}>{players.filter(p => p["Power Conf"] === "TRUE").length}</strong> Power Conf
          {" · "}<strong style={{ color: "#3b82f6" }}>{players.filter(p => p["School History"]).length}</strong> with transfer history
        </span>
        {lastFetched && (
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>
            Synced: {lastFetched.toLocaleTimeString()}
          </span>
        )}
        <button onClick={fetchData} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px", display: "flex" }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Search + Filter bar */}
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
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: hasActiveFilters ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)",
            background: hasActiveFilters ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
            color: hasActiveFilters ? "#60a5fa" : "#9ca3af",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && <span style={{ background: "#3b82f6", color: "#fff", padding: "1px 6px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
            {[search, filterPos, filterConf, filterYear, filterPowerConf !== null].filter(Boolean).length}
          </span>}
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.1)", color: "#a78bfa", fontSize: "12px", cursor: "pointer" }}>
            Clear All
          </button>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
          <button
            onClick={() => setViewMode("table")}
            style={{
              padding: "8px 12px",
              borderRadius: "6px 0 0 6px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: viewMode === "table" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
              color: viewMode === "table" ? "#60a5fa" : "#6b7280",
              cursor: "pointer",
            }}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            style={{
              padding: "8px 12px",
              borderRadius: "0 6px 6px 0",
              border: "1px solid rgba(255,255,255,0.12)",
              borderLeft: "none",
              background: viewMode === "cards" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
              color: viewMode === "cards" ? "#60a5fa" : "#6b7280",
              cursor: "pointer",
            }}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
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

          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a1a", color: "#d1d5db", fontSize: "13px" }}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={filterPowerConf === null ? "" : filterPowerConf ? "power" : "mid"}
            onChange={e => {
              if (e.target.value === "") setFilterPowerConf(null);
              else if (e.target.value === "power") setFilterPowerConf(true);
              else setFilterPowerConf(false);
            }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a1a", color: "#d1d5db", fontSize: "13px" }}
          >
            <option value="">All Conferences</option>
            <option value="power">Power Conf Only</option>
            <option value="mid">Mid-Major Only</option>
          </select>
        </div>
      )}

      {/* Results count + pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "13px", color: "#6b7280" }}>
          Showing <strong style={{ color: "#e5e7eb" }}>{paginatedData.length}</strong> of <strong style={{ color: "#e5e7eb" }}>{filteredData.length}</strong> players
          {filteredData.length !== players.length && <span style={{ color: "#4b5563" }}> (filtered from {players.length})</span>}
        </span>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === 1 ? "#4b5563" : "#9ca3af", cursor: page === 1 ? "default" : "pointer" }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === totalPages ? "#4b5563" : "#9ca3af", cursor: page === totalPages ? "default" : "pointer" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: isMobile ? "800px" : "auto" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                <th style={{ padding: "10px 8px", textAlign: "center", width: "32px", color: "#6b7280", fontSize: "11px" }}>
                  <ExternalLink size={12} />
                </th>
                {(["Player", "Team", "Pos", "Year", "PPG", "RPG", "APG", "eFG%", "3P%", "Ast%", "OReb%", "BPM"] as const).map(col => {
                  const sortCol = col === "Pos" ? "Position" : col;
                  const isSortable = ["Player", "Team", "PPG", "RPG", "APG", "eFG%", "3P%", "Ast%", "OReb%", "BPM"].includes(col);
                  const isActive = sortKey === sortCol;
                  const isNumeric = ["PPG", "RPG", "APG", "eFG%", "3P%", "Ast%", "OReb%", "BPM"].includes(col);
                  return (
                    <th
                      key={col}
                      onClick={() => isSortable && handleSort(sortCol as SortKey)}
                      style={{
                        padding: "10px 8px",
                        textAlign: isNumeric ? "right" : "left",
                        cursor: isSortable ? "pointer" : "default",
                        color: isActive ? "#60a5fa" : "#9ca3af",
                        fontWeight: 600,
                        fontSize: "11px",
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                      }}
                    >
                      {col}
                      {isActive && (sortDir === "desc" ? " ↓" : " ↑")}
                    </th>
                  );
                })}
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
                const ppg = parseFloat(player.PPG) || 0;
                
                return (
                  <React.Fragment key={player._rowIndex}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.05)",
                        background: isExpanded ? "rgba(59,130,246,0.05)" : (i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"),
                        cursor: hasHistory ? "pointer" : "default",
                      }}
                      onClick={() => hasHistory && toggleExpand(player._rowIndex)}
                    >
                      <td style={{ padding: "8px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <a
                          href={getBarttorvikUrl(player.Player, player.Team)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}
                          title="View on Barttorvik"
                        >
                          <ExternalLink size={11} />
                        </a>
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
                      <td style={{ padding: "8px", textAlign: "right", color: "#9ca3af" }}>{player["eFG%"] ? `${fmt(player["eFG%"])}%` : "—"}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#9ca3af" }}>{player["3P%"] ? `${fmt(player["3P%"])}%` : "—"}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: player["Ast%"] && parseFloat(player["Ast%"]) >= 20 ? "#60a5fa" : "#9ca3af" }}>{player["Ast%"] ? fmt(player["Ast%"]) : "—"}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: player["OReb%"] && parseFloat(player["OReb%"]) >= 10 ? "#d4af37" : "#9ca3af" }}>{player["OReb%"] ? fmt(player["OReb%"]) : "—"}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontWeight: player.BPM && parseFloat(player.BPM) >= 5 ? 700 : 400, color: player.BPM && parseFloat(player.BPM) >= 8 ? "#10b981" : player.BPM && parseFloat(player.BPM) >= 5 ? "#60a5fa" : player.BPM && parseFloat(player.BPM) < 0 ? "#7c3aed" : "#9ca3af" }}>{player.BPM ? fmt(player.BPM) : "—"}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {hasHistory && <History size={12} style={{ color: "#60a5fa" }} />}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        {bigBoardPlayers.has(player.Player) ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: recentlyAdded.has(player.Player) ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.1)", color: recentlyAdded.has(player.Player) ? "#10b981" : "#6b7280", fontSize: "10px", fontWeight: 600 }}>
                            <Check size={10} />
                            {recentlyAdded.has(player.Player) ? "Added!" : "On Board"}
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
                              border: "1px solid rgba(59,130,246,0.4)",
                              background: "rgba(59,130,246,0.1)",
                              color: "#60a5fa",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: addingPlayer === player.Player ? "wait" : "pointer",
                              opacity: addingPlayer === player.Player ? 0.6 : 1,
                            }}
                          >
                            {addingPlayer === player.Player ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={10} />}
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasHistory && (
                      <tr>
                        <td colSpan={15} style={{ padding: "0", background: "rgba(59,130,246,0.03)", borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
                          <div style={{ padding: "12px 16px 12px 48px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                              <History size={14} style={{ color: "#60a5fa", marginTop: "2px", flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "#60a5fa", marginBottom: "6px", letterSpacing: "0.05em" }}>SCHOOL HISTORY</div>
                                <div style={{ fontSize: "13px", color: "#d1d5db", lineHeight: 1.5 }}>
                                  {player["School History"].split(" → ").map((school, idx, arr) => (
                                    <span key={idx}>
                                      <span style={{ color: idx === arr.length - 1 ? "#10b981" : "#9ca3af" }}>{school}</span>
                                      {idx < arr.length - 1 && <span style={{ color: "#4b5563", margin: "0 8px" }}>→</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px", paddingLeft: "16px", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                  <span style={{ color: "#6b7280" }}>Height:</span>
                                  <span style={{ color: "#d1d5db" }}>{player.Height || "—"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                  <span style={{ color: "#6b7280" }}>Weight:</span>
                                  <span style={{ color: "#d1d5db" }}>{player.Weight || "—"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                  <span style={{ color: "#6b7280" }}>Games:</span>
                                  <span style={{ color: "#d1d5db" }}>{player.GP || "—"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                  <span style={{ color: "#6b7280" }}>SPG/BPG:</span>
                                  <span style={{ color: "#d1d5db" }}>{player.SPG || "0"}/{player.BPG || "0"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                  <span style={{ color: "#6b7280" }}>AST:TO:</span>
                                  <span style={{ color: "#d1d5db" }}>{player["AST:TO"] || "—"}</span>
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
      )}

      {/* Cards View (compact) */}
      {viewMode === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "10px" }}>
          {paginatedData.map((player) => {
            const hasHistory = !!player["School History"];
            const isExpanded = expandedRows.has(player._rowIndex);
            const posColor = POSITION_COLORS[player.Position] || "#6b7280";
            const ppg = parseFloat(player.PPG) || 0;

            return (
              <div
                key={player._rowIndex}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: isExpanded ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  cursor: hasHistory ? "pointer" : "default",
                }}
                onClick={() => hasHistory && toggleExpand(player._rowIndex)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#f3f4f6" }}>{player.Player}</span>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: `${posColor}20`, color: posColor }}>
                        {player.Position}
                      </span>
                      {player["Power Conf"] === "TRUE" && <Star size={10} fill="#d4af37" style={{ color: "#d4af37" }} />}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      {player.Team} · {player.Conference} · {player.Year}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: ppg >= 15 ? "#10b981" : ppg >= 10 ? "#60a5fa" : "#d1d5db" }}>{fmt(player.PPG)}</div>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>PPG</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#9ca3af", alignItems: "center", flexWrap: "wrap" }}>
                  <span><strong style={{ color: "#d1d5db" }}>{fmt(player.RPG)}</strong> RPG</span>
                  <span><strong style={{ color: "#d1d5db" }}>{fmt(player.APG)}</strong> APG</span>
                  <span>{fmt(player["eFG%"])}% eFG</span>
                  <span>{fmt(player["3P%"])}% 3P</span>
                  {player["Ast%"] && <span style={{ color: parseFloat(player["Ast%"]) >= 20 ? "#60a5fa" : "#9ca3af" }}>{fmt(player["Ast%"])} Ast%</span>}
                  {player["OReb%"] && <span style={{ color: parseFloat(player["OReb%"]) >= 10 ? "#d4af37" : "#9ca3af" }}>{fmt(player["OReb%"])} OReb%</span>}
                  {player.BPM && <span style={{ color: parseFloat(player.BPM) >= 5 ? "#10b981" : parseFloat(player.BPM) < 0 ? "#7c3aed" : "#9ca3af", fontWeight: parseFloat(player.BPM) >= 5 ? 700 : 400 }}>{fmt(player.BPM)} BPM</span>}
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                    <a
                      href={getBarttorvikUrl(player.Player, player.Team)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}
                      title="View on Barttorvik"
                    >
                      <ExternalLink size={11} />
                    </a>
                    {hasHistory && <History size={12} style={{ color: "#60a5fa" }} />}
                    <div onClick={e => e.stopPropagation()}>
                      {bigBoardPlayers.has(player.Player) ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: recentlyAdded.has(player.Player) ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.1)", color: recentlyAdded.has(player.Player) ? "#10b981" : "#6b7280", fontSize: "10px", fontWeight: 600 }}>
                          <Check size={10} />
                          {recentlyAdded.has(player.Player) ? "Added!" : "On Board"}
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
                            border: "1px solid rgba(59,130,246,0.4)",
                            background: "rgba(59,130,246,0.1)",
                            color: "#60a5fa",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: addingPlayer === player.Player ? "wait" : "pointer",
                            opacity: addingPlayer === player.Player ? 0.6 : 1,
                          }}
                        >
                          {addingPlayer === player.Player ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={10} />}
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && hasHistory && (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "#60a5fa", marginBottom: "4px", letterSpacing: "0.05em" }}>SCHOOL HISTORY</div>
                    <div style={{ fontSize: "12px", color: "#d1d5db", lineHeight: 1.5 }}>
                      {player["School History"].split(" → ").map((school, idx, arr) => (
                        <span key={idx}>
                          <span style={{ color: idx === arr.length - 1 ? "#10b981" : "#9ca3af" }}>{school}</span>
                          {idx < arr.length - 1 && <span style={{ color: "#4b5563" }}> → </span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === 1 ? "#4b5563" : "#9ca3af", fontSize: "12px", cursor: page === 1 ? "default" : "pointer" }}
          >
            First
          </button>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === 1 ? "#4b5563" : "#9ca3af", cursor: page === 1 ? "default" : "pointer" }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: "13px", color: "#9ca3af", padding: "0 8px" }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === totalPages ? "#4b5563" : "#9ca3af", cursor: page === totalPages ? "default" : "pointer" }}
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: page === totalPages ? "#4b5563" : "#9ca3af", fontSize: "12px", cursor: page === totalPages ? "default" : "pointer" }}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}
