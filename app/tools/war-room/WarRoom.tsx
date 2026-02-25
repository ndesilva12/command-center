"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  LayoutGrid,
  RefreshCw,
  Star,
  Zap,
  Target,
  Clock,
  Crosshair,
  Shield,
  List,
  GripVertical,
  DollarSign,
  Save,
  Trash2,
  Plus,
  X,
  ChevronDown,
  Check,
  Network,
  Search,
  Edit2,
  ChevronUp,
  FileText,
  Bookmark,
  Upload,
  Flag,
  Database,
} from "lucide-react";
import { FullDatabaseBoard } from "./FullDatabaseBoard";
import { BigBoardView } from "./BigBoardView";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BigBoardPlayer {
  Tier: string;
  Player: string;
  Position: string;
  Height: string;
  Weight: string;
  "Current School": string;
  Conference: string;
  Class: string;
  "Elig. Left": string;
  PPG: string;
  RPG: string;
  APG: string;
  "FG%": string;
  "3P%": string;
  "FT%": string;
  "Grade (20-80)": string;
  "Role Fit": string;
  Status: string;
  "Conf Tier": string;
  "Portal Status": string;
  "Cin. Score": string;
  "Net Adj.Rtg": string;
  "Team Impact Flag": string;
  "Flight Risk Score": string;
  "Conference Check": string;
  "Cin Score v2": string;
  "Flagged"?: string;
  "User Notes"?: string;
  "School History"?: string;
}

interface RankingPlayer {
  tier: string;
  name: string;
  school: string;
  pos: string;
  yr: string;
  bestBatchRank: string;
  exercise: string;
  scoutNotes: string;
  section: string;
  isRedFlag: boolean;
  rowIndex: number;
}

interface RosterPlayer {
  pos: string;
  name: string;
  school: string;
  yr: string;
  height: string;
  tier: string;
  onOff: string;
  keyStat: string;
  portalRisk: string;
  portalRiskLevel: "low" | "moderate" | "high";
  role: string;
  notes: string;
  isStarter: boolean;
  benchSlot?: string;
}

interface RosterConfig {
  name: string;
  label: string;
  scenario: string;
  starters: RosterPlayer[];
  bench: RosterPlayer[];
  championshipProb: string;
  portalReality: string;
}

interface StrikeTarget {
  priority: string;
  player: string;
  school: string;
  reason: string;
  nilEst: string;
  timeline: string;
  riskLevel: string;
}

interface StrikeListPlayer {
  wave: number;
  player: string;
  school: string;
  pos: string;
  cls: string;
  grade: string;
  cinScore: string;
  flightRisk: string;
  confCheck: string;
  onOff: string;
  whyWeWantHim: string;
  coachingConnection: string;
  nilTier: string;
  contactStatus: string;
  notes: string;
}

interface CoachingConnection {
  targetPlayer: string;
  school: string;
  position: string;
  playersCoach: string;
  coachBackground: string;
  uicGroverBridge: string;
  bridgeRole: string;
  relationshipType: string;
  strength: number;
  priority: string;
  actionableStep: string;
  notes: string;
}

interface WarRoomStats {
  totalPlayers: number;
  t1Count: number;
  t2Count: number;
  t3Count: number;
}

// Budget Roster types
interface BudgetSlot {
  id: string;
  label: string;
  posGroup: "guards" | "forwards" | "bench";
  player: BigBoardPlayer | null;
  salary: number;
  posLabel: string; // flexible position label
  notes: string;
}

interface SavedRosterConfig {
  name: string;
  archetype?: string;
  notes?: string;
  slots: {
    slot: string;
    player: string;
    espnId: string;
    salary: number;
    notes: string;
    pos: string;
    school: string;
    posLabel?: string;
  }[];
}

// Network types
interface NetworkPerson {
  id: string;
  name: string;
  role: string;
  organization: string;
  relationship: "1st" | "2nd";
  strength: "Strong" | "Medium" | "Weak";
  howKnow: string;
  phone: string;
  email: string;
  twitter: string;
  notes: string;
  connections: string; // comma-separated names/IDs
  dateAdded: string;
  lastUpdated: string;
}

const TOTAL_BUDGET = 8_000_000;
const MAX_SALARY = 4_000_000;
const SALARY_STEP = 50_000;

const POS_OPTIONS = ["PG", "SG", "SF", "PF", "C", "G", "F", "Wing", "Big", "Flex"];

// Roster archetype templates
const ROSTER_ARCHETYPES = [
  {
    id: "cinderella",
    label: "Cinderella Run",
    description: "1 anchor + 4 system fits, budget-efficient",
    allocations: {
      PG: { pct: 0.15, label: "System G" },
      SG: { pct: 0.12, label: "Wing" },
      SF: { pct: 0.10, label: "3&D" },
      PF: { pct: 0.10, label: "PnR Big" },
      C: { pct: 0.30, label: "Anchor" },
      B1: { pct: 0.08, label: "6th" },
      B2: { pct: 0.06, label: "7th" },
      B3: { pct: 0.04, label: "8th" },
      B4: { pct: 0.03, label: "9th" },
      B5: { pct: 0.02, label: "10th" },
    },
  },
  {
    id: "superteam",
    label: "Superteam",
    description: "2-3 anchors, max spend at top",
    allocations: {
      PG: { pct: 0.30, label: "Star G" },
      SG: { pct: 0.25, label: "Star W" },
      SF: { pct: 0.15, label: "Anchor F" },
      PF: { pct: 0.10, label: "Stretch" },
      C: { pct: 0.08, label: "Rim" },
      B1: { pct: 0.04, label: "6th" },
      B2: { pct: 0.03, label: "7th" },
      B3: { pct: 0.02, label: "8th" },
      B4: { pct: 0.02, label: "9th" },
      B5: { pct: 0.01, label: "10th" },
    },
  },
  {
    id: "guard-heavy",
    label: "Guard Heavy",
    description: "3 guards, 2 bigs, playmaking focus",
    allocations: {
      PG: { pct: 0.25, label: "Star PG" },
      SG: { pct: 0.22, label: "Star SG" },
      SF: { pct: 0.15, label: "3rd G" },
      PF: { pct: 0.12, label: "Stretch" },
      C: { pct: 0.10, label: "Rim" },
      B1: { pct: 0.06, label: "6th" },
      B2: { pct: 0.04, label: "7th" },
      B3: { pct: 0.03, label: "8th" },
      B4: { pct: 0.02, label: "9th" },
      B5: { pct: 0.01, label: "10th" },
    },
  },
  {
    id: "big-man-dominant",
    label: "Big Man Dominant",
    description: "Elite center + stretch bigs",
    allocations: {
      PG: { pct: 0.12, label: "PG" },
      SG: { pct: 0.10, label: "Wing" },
      SF: { pct: 0.10, label: "3&D" },
      PF: { pct: 0.20, label: "Stretch F" },
      C: { pct: 0.35, label: "Elite C" },
      B1: { pct: 0.05, label: "6th" },
      B2: { pct: 0.04, label: "7th" },
      B3: { pct: 0.02, label: "8th" },
      B4: { pct: 0.01, label: "9th" },
      B5: { pct: 0.01, label: "10th" },
    },
  },
];

const DEFAULT_SLOTS: BudgetSlot[] = [
  { id: "PG", label: "PG", posGroup: "guards", player: null, salary: 0, posLabel: "PG", notes: "" },
  { id: "SG", label: "SG", posGroup: "guards", player: null, salary: 0, posLabel: "SG", notes: "" },
  { id: "SF", label: "SF", posGroup: "forwards", player: null, salary: 0, posLabel: "SF", notes: "" },
  { id: "PF", label: "PF", posGroup: "forwards", player: null, salary: 0, posLabel: "PF", notes: "" },
  { id: "C", label: "C", posGroup: "forwards", player: null, salary: 0, posLabel: "C", notes: "" },
  { id: "B1", label: "6th", posGroup: "bench", player: null, salary: 0, posLabel: "G", notes: "" },
  { id: "B2", label: "7th", posGroup: "bench", player: null, salary: 0, posLabel: "G", notes: "" },
  { id: "B3", label: "8th", posGroup: "bench", player: null, salary: 0, posLabel: "F", notes: "" },
  { id: "B4", label: "9th", posGroup: "bench", player: null, salary: 0, posLabel: "F", notes: "" },
  { id: "B5", label: "10th", posGroup: "bench", player: null, salary: 0, posLabel: "C", notes: "" },
];

// ─── Color helpers ────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  T1: { bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.4)", text: "#10b981", badge: "rgba(16,185,129,0.15)" },
  T2: { bg: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.4)", text: "#3b82f6", badge: "rgba(59,130,246,0.15)" },
  T3: { bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.4)", text: "#9ca3af", badge: "rgba(107,114,128,0.15)" },
  T4: { bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.3)", text: "#9ca3af", badge: "rgba(107,114,128,0.12)" },
  "T4-RF": { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.5)", text: "#ef4444", badge: "rgba(239,68,68,0.2)" },
  NR: { bg: "rgba(75,85,99,0.05)", border: "rgba(75,85,99,0.2)", text: "#6b7280", badge: "rgba(75,85,99,0.1)" },
};

function getTierStyle(tier: string) {
  if (tier.includes("RF")) return TIER_COLORS["T4-RF"];
  if (tier.startsWith("T1")) return TIER_COLORS.T1;
  if (tier.startsWith("T2")) return TIER_COLORS.T2;
  if (tier.startsWith("T3")) return TIER_COLORS.T3;
  if (tier.startsWith("T4")) return TIER_COLORS.T4;
  return TIER_COLORS.NR;
}

function getRiskStyle(risk: "low" | "moderate" | "high") {
  if (risk === "high") return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", dot: "#ef4444" };
  if (risk === "moderate") return { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", dot: "#3b82f6" };
  return { color: "#10b981", bg: "rgba(16,185,129,0.12)", dot: "#10b981" };
}

function formatSalary(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function getTimeSince(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
      <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#3b82f6" }} />
      <span style={{ color: "#9ca3af", fontSize: "14px" }}>Fetching live data from Google Sheets…</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
      <AlertTriangle size={16} />
      {message}
    </div>
  );
}

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 700, color: highlight ? "#10b981" : "#d1d5db" }}>{value}</span>
    </div>
  );
}

// ─── VIEW 1: PORTAL BIG BOARD ─────────────────────────────────────────────────

function PortalBigBoard({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [players, setPlayers] = useState<BigBoardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [filterConfTier, setFilterConfTier] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterConfCheck, setFilterConfCheck] = useState("");
  const [sortKey, setSortKey] = useState<"grade" | "cin" | "netrtg">("grade");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  // List view + flags + notes
  const [listView, setListView] = useState(false);
  const [listSortCol, setListSortCol] = useState("Grade");
  const [listSortDir, setListSortDir] = useState<"asc" | "desc">("desc");
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [openNotesFor, setOpenNotesFor] = useState<string | null>(null);
  const [savingFlag, setSavingFlag] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cinderella/big-board?bust=${syncTrigger}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlayers(data);
        setLastFetched(new Date());
        // Merge server flags/notes (server authoritative on first load, local overrides after)
        const serverFlags: Record<string, boolean> = {};
        const serverNotes: Record<string, string> = {};
        data.forEach((p: BigBoardPlayer) => {
          if (p.Flagged === "TRUE") serverFlags[p.Player] = true;
          if (p["User Notes"]) serverNotes[p.Player] = p["User Notes"];
        });
        setLocalFlags(prev => ({ ...serverFlags, ...prev }));
        setLocalNotes(prev => ({ ...serverNotes, ...prev }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

  const toggleFlag = async (playerName: string) => {
    const newFlagged = !localFlags[playerName];
    setLocalFlags(prev => ({ ...prev, [playerName]: newFlagged }));
    setSavingFlag(playerName);
    try {
      await fetch("/api/cinderella/big-board", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, field: "Flagged", value: newFlagged ? "TRUE" : "FALSE" }),
      });
    } catch (e) { console.error("Flag save failed:", e); }
    finally { setSavingFlag(null); }
  };

  const saveNote = async (playerName: string) => {
    const noteText = localNotes[playerName] || "";
    setSavingNotes(playerName);
    try {
      await fetch("/api/cinderella/big-board", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, field: "User Notes", value: noteText }),
      });
    } catch (e) { console.error("Note save failed:", e); }
    finally { setSavingNotes(null); }
  };

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (filterPos && p.Position !== filterPos) return false;
      if (filterConfTier && p["Conf Tier"] !== filterConfTier) return false;
      if (filterTier) {
        if (filterTier === "T1" && !p.Tier.startsWith("T1")) return false;
        if (filterTier === "T2" && !p.Tier.startsWith("T2")) return false;
        if (filterTier === "T3" && !p.Tier.startsWith("T3")) return false;
      }
      if (filterConfCheck && p["Conference Check"] !== filterConfCheck) return false;
      if (filterFlagged && !localFlags[p.Player]) return false;
      return true;
    });
  }, [players, filterPos, filterConfTier, filterTier, filterConfCheck, filterFlagged, localFlags]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "grade") return parseFloat(b["Grade (20-80)"] || "0") - parseFloat(a["Grade (20-80)"] || "0");
      if (sortKey === "cin") return parseFloat(b["Cin. Score"] || "0") - parseFloat(a["Cin. Score"] || "0");
      if (sortKey === "netrtg") {
        const aVal = parseFloat((a["Net Adj.Rtg"] || "").replace(/est\.\s*/i, "") || "0");
        const bVal = parseFloat((b["Net Adj.Rtg"] || "").replace(/est\.\s*/i, "") || "0");
        return bVal - aVal;
      }
      return 0;
    });
  }, [filtered, sortKey]);

  // List view sort
  const LIST_COLS = ["Player", "School", "Pos", "PPG", "RPG", "APG", "FG%", "3P%", "Tier", "Grade"];
  const listSorted = useMemo(() => {
    const colMap: Record<string, (p: BigBoardPlayer) => number | string> = {
      "Player": p => p.Player,
      "School": p => p["Current School"],
      "Pos": p => p.Position,
      "PPG": p => parseFloat(p.PPG || "0"),
      "RPG": p => parseFloat(p.RPG || "0"),
      "APG": p => parseFloat(p.APG || "0"),
      "FG%": p => parseFloat(p["FG%"] || "0"),
      "3P%": p => parseFloat(p["3P%"] || "0"),
      "Tier": p => p.Tier,
      "Grade": p => parseFloat(p["Grade (20-80)"] || "0"),
    };
    const getVal = colMap[listSortCol] || (() => 0);
    return [...filtered].sort((a, b) => {
      const av = getVal(a), bv = getVal(b);
      if (typeof av === "number" && typeof bv === "number") return listSortDir === "desc" ? bv - av : av - bv;
      if (typeof av === "string" && typeof bv === "string") return listSortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      return 0;
    });
  }, [filtered, listSortCol, listSortDir]);

  const handleListSort = (col: string) => {
    if (listSortCol === col) setListSortDir(d => d === "desc" ? "asc" : "desc");
    else { setListSortCol(col); setListSortDir("desc"); }
  };

  const confTiers = useMemo(() => [...new Set(players.map((p) => p["Conf Tier"]).filter(Boolean))].sort(), [players]);
  const positions = useMemo(() => [...new Set(players.map((p) => p.Position).filter(Boolean))].sort(), [players]);
  const flaggedCount = useMemo(() => Object.values(localFlags).filter(Boolean).length, [localFlags]);

  const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: "20px", border: active ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)", background: active ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)", color: active ? "#60a5fa" : "#9ca3af", fontSize: "12px", fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Stats bar */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#e5e7eb" }}>{players.length}</strong> players tracked
          {" · "}<strong style={{ color: "#10b981" }}>{players.filter((p) => p.Tier.includes("T1") && !p.Tier.includes("RF")).length} T1</strong>
          {" · "}<strong style={{ color: "#3b82f6" }}>{players.filter((p) => p.Tier.includes("T2") && !p.Tier.includes("RF")).length} T2</strong>
          {" · "}<strong style={{ color: "#9ca3af" }}>{players.filter((p) => p.Tier.includes("T3") && !p.Tier.includes("RF")).length} T3</strong>
          {(() => {
            const unverified = players.filter((p) => p["Net Adj.Rtg"].toLowerCase().includes("est.")).length;
            return unverified > 0 ? <>{" · "}<strong style={{ color: "#6b7280" }} title="Players with estimated Net Adj Rtg">~{unverified} unverified</strong></> : null;
          })()}
          {flaggedCount > 0 && <>{" · "}<strong style={{ color: "#ef4444" }}>🚩 {flaggedCount} flagged</strong></>}
        </span>
        {lastFetched && (
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>
            Synced: {lastFetched.toLocaleTimeString()} · live
          </span>
        )}
      </div>

      {/* View toggle + Flagged filter */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>VIEW</span>
        <button onClick={() => setListView(false)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", border: !listView ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)", background: !listView ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)", color: !listView ? "#60a5fa" : "#9ca3af", fontSize: "12px", fontWeight: !listView ? 600 : 400, cursor: "pointer" }}>
          <LayoutGrid size={13} />Grid
        </button>
        <button onClick={() => setListView(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", border: listView ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)", background: listView ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)", color: listView ? "#60a5fa" : "#9ca3af", fontSize: "12px", fontWeight: listView ? 600 : 400, cursor: "pointer" }}>
          <List size={13} />List
        </button>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
        <button onClick={() => setFilterFlagged(v => !v)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", border: filterFlagged ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.12)", background: filterFlagged ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)", color: filterFlagged ? "#ef4444" : "#9ca3af", fontSize: "12px", fontWeight: filterFlagged ? 600 : 400, cursor: "pointer" }}>
          <Bookmark size={12} fill={filterFlagged ? "#ef4444" : "none"} stroke={filterFlagged ? "#ef4444" : "#9ca3af"} />
          Flagged{flaggedCount > 0 ? ` (${flaggedCount})` : ""}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>POS</span>
          <FilterBtn active={filterPos === ""} onClick={() => setFilterPos("")}>All</FilterBtn>
          {positions.map((p) => <FilterBtn key={p} active={filterPos === p} onClick={() => setFilterPos(p === filterPos ? "" : p)}>{p}</FilterBtn>)}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>CONF</span>
          <FilterBtn active={filterConfTier === ""} onClick={() => setFilterConfTier("")}>All</FilterBtn>
          {confTiers.map((c) => <FilterBtn key={c} active={filterConfTier === c} onClick={() => setFilterConfTier(c === filterConfTier ? "" : c)}>{c}</FilterBtn>)}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>TIER</span>
          <FilterBtn active={filterTier === ""} onClick={() => setFilterTier("")}>All</FilterBtn>
          {["T1", "T2", "T3"].map((t) => <FilterBtn key={t} active={filterTier === t} onClick={() => setFilterTier(t === filterTier ? "" : t)}>{t}</FilterBtn>)}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>CONF</span>
          <FilterBtn active={filterConfCheck === ""} onClick={() => setFilterConfCheck("")}>All</FilterBtn>
          {["P6", "High-Major", "Mid-Major", "Low-Major"].map((c) => <FilterBtn key={c} active={filterConfCheck === c} onClick={() => setFilterConfCheck(c === filterConfCheck ? "" : c)}>{c}</FilterBtn>)}
        </div>
        {!listView && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>SORT</span>
            {([["grade", "Grade"], ["cin", "Cin. Score"], ["netrtg", "Net Adj.Rtg"]] as const).map(([key, label]) => (
              <FilterBtn key={key} active={sortKey === key} onClick={() => setSortKey(key)}>{label} {sortKey === key ? "↓" : ""}</FilterBtn>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: "12px", color: "#6b7280" }}>
        Showing <strong style={{ color: "#e5e7eb" }}>{listView ? listSorted.length : sorted.length}</strong> of {players.length} players
        {listView && <span style={{ color: "#4b5563", marginLeft: "8px" }}>· Click column headers to sort</span>}
      </div>

      {/* LIST VIEW */}
      {listView ? (
        <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                <th style={{ padding: "10px 8px", textAlign: "center", width: "36px", color: "#6b7280", fontSize: "11px" }}>🚩</th>
                {LIST_COLS.map(col => {
                  const isActive = listSortCol === col;
                  const isNum = ["PPG","RPG","APG","FG%","3P%","Grade"].includes(col);
                  return (
                    <th key={col} onClick={() => handleListSort(col)} style={{ padding: "10px 8px", textAlign: isNum ? "right" : "left", cursor: "pointer", color: isActive ? "#60a5fa" : "#9ca3af", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", whiteSpace: "nowrap", userSelect: "none" }}>
                      {col}{isActive ? (listSortDir === "desc" ? " ↓" : " ↑") : ""}
                    </th>
                  );
                })}
                <th style={{ padding: "10px 8px", textAlign: "center", width: "36px", color: "#6b7280", fontSize: "11px" }}>📝</th>
              </tr>
            </thead>
            <tbody>
              {listSorted.map((player, i) => {
                const tierStyle = getTierStyle(player.Tier);
                const isFlagged = !!localFlags[player.Player];
                const hasNotes = !!(localNotes[player.Player]);
                const noteText = localNotes[player.Player] || "";
                const grade = parseFloat(player["Grade (20-80)"] || "0");
                const isOpen = openNotesFor === player.Player;
                return (
                  <React.Fragment key={i}>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: isFlagged ? "rgba(239,68,68,0.04)" : i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                      <td style={{ padding: "7px 8px", textAlign: "center" }}>
                        <button onClick={() => toggleFlag(player.Player)} title={isFlagged ? "Unflag" : "Flag player"} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center", opacity: savingFlag === player.Player ? 0.5 : 1 }}>
                          <Bookmark size={13} fill={isFlagged ? "#ef4444" : "none"} stroke={isFlagged ? "#ef4444" : "#4b5563"} />
                        </button>
                      </td>
                      <td style={{ padding: "7px 8px", fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "3px", height: "16px", borderRadius: "2px", background: tierStyle.text, flexShrink: 0 }} />
                          {player.Player}
                          {player.Tier.includes("RF") && <AlertTriangle size={11} color="#ef4444" />}
                        </div>
                      </td>
                      <td style={{ padding: "7px 8px", color: "#9ca3af", whiteSpace: "nowrap" }}>{player["Current School"]}</td>
                      <td style={{ padding: "7px 8px", color: "#9ca3af" }}>{player.Position}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#d1d5db" }}>{player.PPG || "—"}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#d1d5db" }}>{player.RPG || "—"}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#d1d5db" }}>{player.APG || "—"}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#d1d5db" }}>{player["FG%"] ? `${player["FG%"]}%` : "—"}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#d1d5db" }}>{player["3P%"] ? `${player["3P%"]}%` : "—"}</td>
                      <td style={{ padding: "7px 8px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, background: tierStyle.badge, color: tierStyle.text }}>{player.Tier}</span>
                      </td>
                      <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 800, color: grade >= 70 ? "#10b981" : grade >= 55 ? "#60a5fa" : "#9ca3af" }}>{player["Grade (20-80)"] || "—"}</td>
                      <td style={{ padding: "7px 8px", textAlign: "center" }}>
                        <button onClick={() => setOpenNotesFor(isOpen ? null : player.Player)} title="Player notes" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center", color: hasNotes ? "#60a5fa" : "#4b5563" }}>
                          <FileText size={13} />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={LIST_COLS.length + 2} style={{ padding: "8px 12px", background: "rgba(59,130,246,0.05)", borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <div style={{ fontSize: "12px", color: "#60a5fa", fontWeight: 600, minWidth: "80px", paddingTop: "6px" }}>{player.Player}</div>
                            <textarea
                              value={noteText}
                              onChange={(e) => setLocalNotes(prev => ({ ...prev, [player.Player]: e.target.value }))}
                              onBlur={() => saveNote(player.Player)}
                              placeholder="Add notes for this player… (auto-saves on blur)"
                              rows={2}
                              autoFocus
                              style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.3)", color: "#d1d5db", fontSize: "12px", resize: "vertical", outline: "none", fontFamily: "inherit" }}
                            />
                            <button onClick={() => { saveNote(player.Player); setOpenNotesFor(null); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px", marginTop: "2px" }}><X size={14} /></button>
                          </div>
                          {savingNotes === player.Player && <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px", marginLeft: "88px" }}>Saving to sheet…</div>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {listSorted.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>No players match filters.</div>}
        </div>
      ) : (
        /* GRID VIEW */
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(380px, 1fr))", gap: "10px" }}>
          {sorted.map((player, i) => {
            const tierStyle = getTierStyle(player.Tier);
            const grade = parseFloat(player["Grade (20-80)"] || "0");
            const cinScore = parseFloat(player["Cin. Score"] || "0");
            const netRtgRaw = player["Net Adj.Rtg"] || "";
            const netRtgIsEst = netRtgRaw.toLowerCase().includes("est.");
            const netRtg = parseFloat(netRtgRaw.replace(/est\.\s*/i, "") || "0");
            const cinScoreV2 = parseFloat(player["Cin Score v2"] || "0");
            const cinV2Downgraded = !isNaN(cinScore) && !isNaN(cinScoreV2) && cinScoreV2 > 0 && (cinScore - cinScoreV2) > 5;
            const hasImpactFlag = player["Team Impact Flag"] && player["Team Impact Flag"].trim() !== "";
            const flightRisk = parseFloat(player["Flight Risk Score"] || "0");
            const hasFlightRisk = !isNaN(flightRisk) && flightRisk > 0;
            const flightRiskColor = flightRisk >= 7 ? "#ef4444" : flightRisk >= 5 ? "#3b82f6" : "#10b981";
            const flightRiskBg = flightRisk >= 7 ? "rgba(239,68,68,0.12)" : flightRisk >= 5 ? "rgba(59,130,246,0.12)" : "rgba(16,185,129,0.12)";
            const isFlagged = !!localFlags[player.Player];
            const hasNotes = !!(localNotes[player.Player]);
            const noteText = localNotes[player.Player] || "";
            const isOpen = openNotesFor === player.Player;
            return (
              <div key={i} style={{ padding: "14px 16px", borderRadius: "12px", background: isFlagged ? "rgba(239,68,68,0.05)" : tierStyle.bg, border: `1px solid ${isFlagged ? "rgba(239,68,68,0.35)" : tierStyle.border}`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: isFlagged ? "#ef4444" : tierStyle.text, borderRadius: "12px 0 0 12px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>{player.Player}</span>
                      <span style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: 700, background: tierStyle.badge, color: tierStyle.text, letterSpacing: "0.04em" }}>{player.Tier}</span>
                      {player.Tier.includes("RF") && <AlertTriangle size={13} color="#ef4444" />}
                      {/* Flag button */}
                      <button onClick={(e) => { e.stopPropagation(); toggleFlag(player.Player); }} title={isFlagged ? "Unflag player" : "Flag player"} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "inline-flex", marginLeft: "2px", opacity: savingFlag === player.Player ? 0.5 : 1 }}>
                        <Bookmark size={13} fill={isFlagged ? "#ef4444" : "none"} stroke={isFlagged ? "#ef4444" : "#4b5563"} />
                      </button>
                      {/* Notes button */}
                      <button onClick={(e) => { e.stopPropagation(); setOpenNotesFor(isOpen ? null : player.Player); }} title="Player notes" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "inline-flex", color: hasNotes ? "#60a5fa" : "#4b5563" }}>
                        <FileText size={13} />
                      </button>
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span>{player["Current School"]}</span><span>·</span><span>{player.Position}</span><span>·</span><span>{player.Class}</span><span>·</span><span style={{ color: "#6b7280" }}>{player.Conference}</span>
                    </div>
                  </div>
                  <div style={{ minWidth: "48px", height: "48px", borderRadius: "50%", background: grade >= 70 ? "rgba(16,185,129,0.15)" : grade >= 55 ? "rgba(59,130,246,0.15)" : "rgba(107,114,128,0.15)", border: `2px solid ${grade >= 70 ? "rgba(16,185,129,0.5)" : grade >= 55 ? "rgba(59,130,246,0.5)" : "rgba(107,114,128,0.3)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: grade >= 70 ? "#10b981" : grade >= 55 ? "#60a5fa" : "#9ca3af", lineHeight: 1 }}>{player["Grade (20-80)"] || "—"}</span>
                    <span style={{ fontSize: "9px", color: "#6b7280", marginTop: "1px" }}>GRADE</span>
                  </div>
                </div>
                {/* Notes popover */}
                {isOpen && (
                  <div style={{ marginBottom: "10px", padding: "8px 10px", borderRadius: "8px", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.25)" }}>
                    <textarea
                      value={noteText}
                      onChange={(e) => setLocalNotes(prev => ({ ...prev, [player.Player]: e.target.value }))}
                      onBlur={() => saveNote(player.Player)}
                      placeholder="Notes… (auto-saves on blur)"
                      rows={2}
                      autoFocus
                      style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.3)", color: "#d1d5db", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                    {savingNotes === player.Player && <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>Saving…</div>}
                  </div>
                )}
                {hasNotes && !isOpen && (
                  <div style={{ marginBottom: "6px", padding: "5px 8px", borderRadius: "6px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", fontSize: "11px", color: "#93c5fd", fontStyle: "italic", cursor: "pointer" }} onClick={() => setOpenNotesFor(player.Player)}>
                    📝 {noteText.slice(0, 80)}{noteText.length > 80 ? "…" : ""}
                  </div>
                )}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <StatPill label="Cin.Score" value={cinScore ? cinScore.toFixed(1) : "—"} highlight={cinScore > 85} />
                  {player["Cin Score v2"] && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>Cin.v2</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: cinV2Downgraded ? "#6b7280" : "#d1d5db" }}>{cinV2Downgraded && <span style={{ fontSize: "11px", marginRight: "2px" }}>↓</span>}{cinScoreV2 ? cinScoreV2.toFixed(1) : "—"}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }} title={netRtgIsEst ? "Estimated value" : undefined}>
                    <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>Net Adj.Rtg</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: netRtgIsEst ? "#6b7280" : (netRtg > 5 ? "#10b981" : "#d1d5db") }}>
                      {netRtgRaw ? (netRtgIsEst ? <><span style={{ color: "#6b7280" }}>~</span>{netRtgRaw.replace(/est\.\s*/i, "").trim() || "—"}</> : netRtgRaw) : "—"}
                    </span>
                  </div>
                  <StatPill label="PPG" value={player.PPG || "—"} />
                  <StatPill label="APG" value={player.APG || "—"} />
                  <StatPill label="3P%" value={player["3P%"] ? `${player["3P%"]}%` : "—"} />
                </div>
                {hasImpactFlag && <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "6px", background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.3)", fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}><Zap size={10} />{player["Team Impact Flag"]}</div>}
                {hasFlightRisk && <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "6px", background: flightRiskBg, border: `1px solid ${flightRiskColor}40`, fontSize: "11px", color: flightRiskColor, fontWeight: 600, marginTop: hasImpactFlag ? "6px" : "0" }}><div style={{ width: "7px", height: "7px", borderRadius: "50%", background: flightRiskColor, flexShrink: 0 }} />Flight Risk: {player["Flight Risk Score"]}</div>}
                {player["Conference Check"] && <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.25)", fontSize: "10px", color: "#9ca3af", fontWeight: 600, marginTop: "4px", marginLeft: hasFlightRisk ? "6px" : "0" }}>{player["Conference Check"]}</div>}
                {player["Role Fit"] && <div style={{ marginTop: "6px", fontSize: "11px", color: "#6b7280", fontStyle: "italic" }}>Role: {player["Role Fit"]}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── VIEW 2: NORMAN'S RANKINGS ─────────────────────────────────────────────────

function SortablePlayerItem({ player, rank, isDragging }: { player: RankingPlayer; rank: number; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `${player.rowIndex}-${player.name}` });
  const tierStyle = getTierStyle(player.tier);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", background: player.isRedFlag ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${player.isRedFlag ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "default" }}>
      <div {...attributes} {...listeners} style={{ cursor: "grab", color: "#4b5563", flexShrink: 0, display: "flex", alignItems: "center" }}>
        <GripVertical size={16} />
      </div>
      <div style={{ minWidth: "28px", fontSize: "14px", fontWeight: 800, color: "#6b7280", textAlign: "right" }}>#{rank}</div>
      <span style={{ padding: "2px 7px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, background: tierStyle.badge, color: tierStyle.text, flexShrink: 0 }}>{player.tier}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {player.isRedFlag && <AlertTriangle size={12} color="#ef4444" />}
          <span style={{ fontSize: "13px", fontWeight: 700, color: player.isRedFlag ? "#fca5a5" : "#f3f4f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</span>
        </div>
        <div style={{ fontSize: "11px", color: "#6b7280" }}>{player.school} · {player.pos} · {player.yr}</div>
      </div>
      {player.scoutNotes && (
        <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{player.scoutNotes}"</div>
      )}
      {player.bestBatchRank && <span style={{ fontSize: "10px", color: "#4b5563", flexShrink: 0 }}>Rank #{player.bestBatchRank}</span>}
    </div>
  );
}

function DraggableList({ players, sectionKey, onReorder }: { players: RankingPlayer[]; sectionKey: "guards" | "forwards" | "bigMen"; onReorder: (section: "guards" | "forwards" | "bigMen", newOrder: RankingPlayer[]) => void }) {
  const [items, setItems] = useState(players);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { setItems(players); }, [players]);

  const ids = items.map(p => `${p.rowIndex}-${p.name}`);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    onReorder(sectionKey, newItems);

    setSaving(true);
    try {
      await fetch("/api/cinderella/rankings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: sectionKey,
          players: newItems.map((p, i) => ({ name: p.name, rowIndex: p.rowIndex, newRank: i + 1 })),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save order:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", minHeight: "24px" }}>
        {saving && <span style={{ fontSize: "11px", color: "#3b82f6", display: "flex", alignItems: "center", gap: "4px" }}><RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} />Saving order…</span>}
        {saved && <span style={{ fontSize: "11px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}><Check size={11} />Saved to Google Sheet</span>}
        {!saving && !saved && <span style={{ fontSize: "11px", color: "#4b5563" }}>Drag to reorder · {items.length} players</span>}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {items.map((player, i) => (
              <SortablePlayerItem key={`${player.rowIndex}-${player.name}`} player={player} rank={i + 1} isDragging={activeId === `${player.rowIndex}-${player.name}`} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function NormansRankings({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [guards, setGuards] = useState<RankingPlayer[]>([]);
  const [forwards, setForwards] = useState<RankingPlayer[]>([]);
  const [bigMen, setBigMen] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listView, setListView] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/cinderella/rankings?bust=${syncTrigger}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setGuards(data.guards || []);
        setForwards(data.forwards || []);
        setBigMen(data.bigMen || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReorder = (section: "guards" | "forwards" | "bigMen", newOrder: RankingPlayer[]) => {
    if (section === "guards") setGuards(newOrder);
    else if (section === "forwards") setForwards(newOrder);
    else setBigMen(newOrder);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const tiers = ["T1", "T2", "T3", "T4", "T4-RF", "NR"];

  function GridSection({ title, players }: { title: string; players: RankingPlayer[] }) {
    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f3f4f6", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tiers.map((tier) => {
            const group = players.filter((p) => p.tier === tier);
            if (group.length === 0) return null;
            const tierStyle = getTierStyle(tier);
            return (
              <div key={tier}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: tierStyle.text }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: tierStyle.text, letterSpacing: "0.08em" }}>
                    {tier}{tier === "T1" ? " — Starters" : tier === "T2" ? " — Key Rotation" : tier === "T3" ? " — Solid Contributors" : tier === "T4-RF" ? " — RED FLAGS" : tier === "T4" ? " — Depth" : " — Not Ranked"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: "8px" }}>
                  {group.map((player, i) => {
                    const ts = getTierStyle(player.tier);
                    return (
                      <div key={i} style={{ padding: "12px 14px", borderRadius: "10px", background: player.isRedFlag ? "rgba(239,68,68,0.08)" : ts.bg, border: `1px solid ${player.isRedFlag ? "rgba(239,68,68,0.4)" : ts.border}`, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: player.isRedFlag ? "#ef4444" : ts.text }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: player.scoutNotes ? "8px" : "0" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                              {player.isRedFlag && <AlertTriangle size={13} color="#ef4444" />}
                              <span style={{ fontSize: "14px", fontWeight: 700, color: player.isRedFlag ? "#fca5a5" : "#f3f4f6" }}>{player.name}</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", gap: "6px" }}>
                              <span>{player.school}</span><span>·</span><span>{player.pos}</span><span>·</span><span>{player.yr}</span>
                              {player.exercise && <><span>·</span><span style={{ color: "#6b7280" }}>{player.exercise}</span></>}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <span style={{ padding: "2px 7px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, background: ts.badge, color: ts.text }}>{player.tier}</span>
                            {player.bestBatchRank && <span style={{ fontSize: "10px", color: "#6b7280" }}>#{player.bestBatchRank}</span>}
                          </div>
                        </div>
                        {player.scoutNotes && <div style={{ fontSize: "12px", color: player.isRedFlag ? "#fca5a5" : "#9ca3af", lineHeight: 1.5, fontStyle: "italic" }}>"{player.scoutNotes}"</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>VIEW</span>
        <button onClick={() => setListView(false)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", border: !listView ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.12)", background: !listView ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", color: !listView ? "#a78bfa" : "#9ca3af", fontSize: "12px", fontWeight: !listView ? 600 : 400, cursor: "pointer" }}>
          <LayoutGrid size={13} />Grid
        </button>
        <button onClick={() => setListView(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", border: listView ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.12)", background: listView ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", color: listView ? "#a78bfa" : "#9ca3af", fontSize: "12px", fontWeight: listView ? 600 : 400, cursor: "pointer" }}>
          <List size={13} />List + D&D
        </button>
        {listView && <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "4px" }}>Drag to reorder • changes save to Google Sheet</span>}
      </div>

      {listView ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "24px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
              Guards <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400 }}>({guards.length})</span>
            </h3>
            <DraggableList players={guards} sectionKey="guards" onReorder={handleReorder} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
              Forwards / Bigs <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400 }}>({forwards.length})</span>
            </h3>
            <DraggableList players={forwards} sectionKey="forwards" onReorder={handleReorder} />
          </div>
          {bigMen.length > 0 && (
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Big Men</h3>
              <DraggableList players={bigMen} sectionKey="bigMen" onReorder={handleReorder} />
            </div>
          )}
        </div>
      ) : (
        <>
          <GridSection title="Guards" players={guards} />
          <GridSection title="Forwards / Bigs" players={forwards} />
          {bigMen.length > 0 && <GridSection title="Big Men Rankings" players={bigMen} />}
        </>
      )}
    </div>
  );
}

// ─── VIEW 3: ROSTER BUILDER ────────────────────────────────────────────────────

function RosterBuilder({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [configs, setConfigs] = useState<RosterConfig[]>([]);
  const [strikeOrder, setStrikeOrder] = useState<StrikeTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/cinderella/roster?bust=${syncTrigger}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConfigs(data.configs || []);
        setStrikeOrder(data.strikeOrder || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const configColors: Record<string, { accent: string; header: string }> = {
    "Config A": { accent: "#10b981", header: "rgba(16,185,129,0.1)" },
    "Config B": { accent: "#3b82f6", header: "rgba(59,130,246,0.1)" },
    "Config C": { accent: "#8b5cf6", header: "rgba(139,92,246,0.1)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
        {configs.map((config) => {
          const cc = configColors[config.name] || { accent: "#6b7280", header: "rgba(107,114,128,0.1)" };
          return (
            <div key={config.name} style={{ borderRadius: "12px", border: `1px solid ${cc.accent}40`, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", background: cc.header, borderBottom: `1px solid ${cc.accent}30` }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: cc.accent, letterSpacing: "0.05em", marginBottom: "4px" }}>{config.name.toUpperCase()}</div>
                <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.4 }}>{config.scenario}</div>
                {config.championshipProb && <div style={{ marginTop: "8px", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", fontSize: "11px", color: "#d1d5db" }}>{config.championshipProb}</div>}
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", marginBottom: "8px" }}>STARTING FIVE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {config.starters.slice(0, 5).map((p, i) => {
                    const risk = getRiskStyle(p.portalRiskLevel);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "7px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ minWidth: "28px", padding: "2px 5px", borderRadius: "5px", fontSize: "10px", fontWeight: 700, textAlign: "center", background: `${cc.accent}20`, color: cc.accent }}>{p.pos}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                          <div style={{ fontSize: "10px", color: "#6b7280" }}>{p.school} · {p.yr}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: risk.dot }} />
                          <span style={{ fontSize: "9px", color: risk.color, fontWeight: 600 }}>{p.portalRiskLevel.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {config.bench.length > 0 && (
                  <>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", marginTop: "12px", marginBottom: "8px" }}>BENCH</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {config.bench.map((p, i) => {
                        const risk = getRiskStyle(p.portalRiskLevel);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "7px", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", opacity: 0.85 }}>
                            <span style={{ minWidth: "28px", padding: "2px 5px", borderRadius: "5px", fontSize: "10px", fontWeight: 700, textAlign: "center", background: `${cc.accent}20`, color: cc.accent }}>{p.benchSlot || p.pos}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                              <div style={{ fontSize: "10px", color: "#6b7280" }}>{p.school} · {p.yr}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: risk.dot }} />
                              <span style={{ fontSize: "9px", color: risk.color, fontWeight: 600 }}>{p.portalRiskLevel.toUpperCase()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {config.portalReality && <div style={{ marginTop: "12px", padding: "8px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "11px", color: "#9ca3af" }}>{config.portalReality}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {strikeOrder.length > 0 && (
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ef4444", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Zap size={16} />PORTAL STRIKE ORDER — Opens ~March 23, 2026</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {strikeOrder.map((target, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ padding: "2px 8px", borderRadius: "6px", background: i <= 1 ? "rgba(239,68,68,0.15)" : "rgba(107,114,128,0.1)", color: i <= 1 ? "#ef4444" : "#9ca3af", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>{target.priority}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#f3f4f6", marginBottom: "2px" }}>{target.player} <span style={{ fontSize: "12px", color: "#9ca3af" }}>({target.school})</span></div>
                  <div style={{ fontSize: "12px", color: "#9ca3af" }}>{target.reason}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                  <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>{target.nilEst}</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>{target.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VIEW 4: BUDGET ROSTER BUILDER ($8M) ─────────────────────────────────────

function PlayerPickerDropdown({ players, onSelect, onClose, currentPlayer }: { players: BigBoardPlayer[]; onSelect: (p: BigBoardPlayer | null) => void; onClose: () => void; currentPlayer: BigBoardPlayer | null }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return players.filter(p => !q || p.Player?.toLowerCase().includes(q) || p["Current School"]?.toLowerCase().includes(q) || p.Position?.toLowerCase().includes(q)).slice(0, 30);
  }, [players, search]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#141b2d", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "12px", padding: "16px", width: "min(480px, 92vw)", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 25px 50px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#f3f4f6" }}>Select Player</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px" }}><X size={16} /></button>
        </div>
        <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, school, position…" style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "13px", outline: "none" }} />
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {currentPlayer && (
            <button onClick={() => { onSelect(null); onClose(); }} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "12px", cursor: "pointer", textAlign: "left" }}>
              Remove player
            </button>
          )}
          {filtered.map((p, i) => {
            const tierStyle = getTierStyle(p.Tier);
            return (
              <button key={i} onClick={() => { onSelect(p); onClose(); }} style={{ padding: "8px 12px", borderRadius: "8px", background: currentPlayer?.Player === p.Player ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${currentPlayer?.Player === p.Player ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.07)"}`, color: "#f3f4f6", fontSize: "12px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.Player}</span>
                  <span style={{ color: "#9ca3af", marginLeft: "8px" }}>{p["Current School"]} · {p.Position} · {p.Class}</span>
                </div>
                <span style={{ padding: "2px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: tierStyle.badge, color: tierStyle.text, flexShrink: 0 }}>{p.Tier}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>No players found</div>}
        </div>
      </div>
    </div>
  );
}

function BudgetSlotRow({ slot, players, onChange }: { slot: BudgetSlot; players: BigBoardPlayer[]; onChange: (id: string, field: keyof BudgetSlot, value: any) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const isEmpty = !slot.player;
  const nilLabel = slot.salary >= 2_500_000 ? "ANCHOR" : slot.salary >= 1_000_000 ? "STARTER" : slot.salary >= 500_000 ? "KEY ROT." : slot.salary >= 200_000 ? "SLEEPER" : "—";
  const nilColor = slot.salary >= 2_500_000 ? "#a78bfa" : slot.salary >= 1_000_000 ? "#10b981" : slot.salary >= 500_000 ? "#3b82f6" : slot.salary >= 200_000 ? "#6b7280" : "#6b7280";

  const tierStyle = slot.player ? getTierStyle(slot.player.Tier) : null;

  return (
    <>
      {pickerOpen && <PlayerPickerDropdown players={players} currentPlayer={slot.player} onSelect={(p) => onChange(slot.id, "player", p)} onClose={() => setPickerOpen(false)} />}
      <div style={{ padding: "12px 14px", borderRadius: "10px", background: isEmpty ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)", border: `1px solid ${isEmpty ? "rgba(255,255,255,0.08)" : (tierStyle?.border || "rgba(255,255,255,0.15)")}`, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Flexible position dropdown */}
          <select
            value={slot.posLabel}
            onChange={e => onChange(slot.id, "posLabel", e.target.value)}
            style={{ minWidth: "52px", padding: "4px 4px", borderRadius: "6px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", fontSize: "11px", fontWeight: 800, color: "#60a5fa", cursor: "pointer", outline: "none" }}
          >
            {POS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <button onClick={() => setPickerOpen(true)} style={{ flex: 1, padding: "6px 10px", borderRadius: "8px", background: isEmpty ? "rgba(255,255,255,0.03)" : (tierStyle?.bg || "rgba(255,255,255,0.05)"), border: `1px solid ${isEmpty ? "rgba(255,255,255,0.1)" : (tierStyle?.border || "rgba(255,255,255,0.15)")}`, color: isEmpty ? "#4b5563" : "#f3f4f6", fontSize: "12px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            {isEmpty ? (
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Plus size={12} />Click to add player…</span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slot.player!.Player}</span>
                <span style={{ fontSize: "10px", color: "#9ca3af", flexShrink: 0 }}>{slot.player!["Current School"]} · {slot.player!.Position}</span>
              </span>
            )}
            {!isEmpty && <span style={{ padding: "2px 6px", borderRadius: "5px", fontSize: "10px", fontWeight: 700, background: tierStyle?.badge, color: tierStyle?.text, flexShrink: 0 }}>{slot.player!.Tier}</span>}
            <ChevronDown size={12} style={{ color: "#6b7280", flexShrink: 0 }} />
          </button>
          {/* Notes toggle */}
          <button onClick={() => setNotesOpen(o => !o)} style={{ padding: "4px 6px", borderRadius: "6px", background: slot.notes ? "rgba(59,130,246,0.12)" : "none", border: slot.notes ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.08)", color: slot.notes ? "#60a5fa" : "#4b5563", cursor: "pointer" }} title="Slot notes">
            <FileText size={12} />
          </button>
        </div>

        {/* Notes field */}
        {notesOpen && (
          <textarea
            value={slot.notes}
            onChange={e => onChange(slot.id, "notes", e.target.value)}
            placeholder="Notes for this slot (e.g. 'backup if Toppin goes pro')…"
            rows={2}
            style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#d1d5db", fontSize: "11px", resize: "vertical", outline: "none", width: "100%", boxSizing: "border-box" }}
          />
        )}

        {/* Salary row */}
        {!isEmpty && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "62px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: nilColor, minWidth: "60px" }}>{nilLabel}</span>
            <input type="range" min={0} max={MAX_SALARY} step={SALARY_STEP} value={slot.salary}
              onChange={e => onChange(slot.id, "salary", parseInt(e.target.value))}
              style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }}
            />
            <input
              type="text"
              value={slot.salary === 0 ? "" : formatSalary(slot.salary)}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                const val = Math.min(parseInt(raw || "0"), MAX_SALARY);
                onChange(slot.id, "salary", val);
              }}
              placeholder="$0"
              style={{ width: "80px", padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "12px", fontWeight: 700, textAlign: "right", outline: "none" }}
            />
          </div>
        )}
      </div>
    </>
  );
}

function BudgetRosterBuilder({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [slots, setSlots] = useState<BudgetSlot[]>(DEFAULT_SLOTS.map(s => ({ ...s })));
  const [bigBoardPlayers, setBigBoardPlayers] = useState<BigBoardPlayer[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<SavedRosterConfig[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved" | "error">("");
  const [configName, setConfigName] = useState("My Roster A");
  const [configNotes, setConfigNotes] = useState("");
  const [activeConfig, setActiveConfig] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<string>("");
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");

  useEffect(() => {
    setLoadingPlayers(true);
    fetch(`/api/cinderella/big-board?bust=${syncTrigger}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBigBoardPlayers(data); })
      .catch(console.error)
      .finally(() => setLoadingPlayers(false));
  }, [syncTrigger]);

  useEffect(() => {
    setLoadingConfigs(true);
    fetch("/api/cinderella/roster-configs")
      .then(r => r.json())
      .then(data => { if (data.configs) setSavedConfigs(data.configs); })
      .catch(console.error)
      .finally(() => setLoadingConfigs(false));
  }, []);

  const handleSlotChange = useCallback((id: string, field: keyof BudgetSlot, value: any) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value, ...(field === "player" && value === null ? { salary: 0 } : {}) } : s));
  }, []);

  // Apply archetype template
  const applyArchetype = (archetypeId: string) => {
    const archetype = ROSTER_ARCHETYPES.find(a => a.id === archetypeId);
    if (!archetype) return;
    setSlots(prev => prev.map(s => {
      const alloc = archetype.allocations[s.id as keyof typeof archetype.allocations];
      if (!alloc) return s;
      return { ...s, salary: s.player ? Math.round(TOTAL_BUDGET * alloc.pct / SALARY_STEP) * SALARY_STEP : s.salary };
    }));
    setSelectedArchetype(archetypeId);
  };

  const totalAllocated = useMemo(() => slots.reduce((sum, s) => sum + (s.player ? s.salary : 0), 0), [slots]);
  const remaining = TOTAL_BUDGET - totalAllocated;
  const pct = Math.min(100, (totalAllocated / TOTAL_BUDGET) * 100);
  const isOverBudget = totalAllocated > TOTAL_BUDGET;

  const guardSlots = slots.filter(s => s.posGroup === "guards");
  const forwardSlots = slots.filter(s => s.posGroup === "forwards");
  const benchSlots = slots.filter(s => s.posGroup === "bench");

  const guardTotal = guardSlots.reduce((s, sl) => s + (sl.player ? sl.salary : 0), 0);
  const forwardTotal = forwardSlots.reduce((s, sl) => s + (sl.player ? sl.salary : 0), 0);
  const benchTotal = benchSlots.reduce((s, sl) => s + (sl.player ? sl.salary : 0), 0);

  const warnings: string[] = [];
  if (isOverBudget) warnings.push(`Over budget by ${formatSalary(totalAllocated - TOTAL_BUDGET)}`);
  slots.forEach(s => {
    if (s.player && s.salary > TOTAL_BUDGET * 0.4) warnings.push(`${s.player.Player} takes ${Math.round(s.salary / TOTAL_BUDGET * 100)}% of budget`);
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const payload = {
        name: configName,
        archetype: selectedArchetype,
        notes: configNotes,
        slots: slots.filter(s => s.player).map(s => ({
          slot: s.id,
          player: s.player!.Player,
          espnId: "",
          salary: s.salary,
          notes: s.notes,
          pos: s.player!.Position,
          school: s.player!["Current School"],
          posLabel: s.posLabel,
        })),
      };
      const res = await fetch("/api/cinderella/roster-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await fetch("/api/cinderella/roster-configs").then(r => r.json());
      if (data.configs) setSavedConfigs(data.configs);
      setSaveStatus("saved");
      setActiveConfig(configName);
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (config: SavedRosterConfig) => {
    const newSlots = DEFAULT_SLOTS.map(s => ({ ...s }));
    config.slots.forEach(saved => {
      const slotIdx = newSlots.findIndex(sl => sl.id === saved.slot);
      if (slotIdx === -1) return;
      const player = bigBoardPlayers.find(p => p.Player === saved.player) || null;
      newSlots[slotIdx].player = player;
      newSlots[slotIdx].salary = saved.salary;
      newSlots[slotIdx].notes = saved.notes || "";
      if (saved.posLabel) newSlots[slotIdx].posLabel = saved.posLabel;
    });
    setSlots(newSlots);
    setConfigName(config.name);
    setConfigNotes(config.notes || "");
    setSelectedArchetype(config.archetype || "");
    setActiveConfig(config.name);
  };

  const handleDelete = async (name: string) => {
    try {
      await fetch(`/api/cinderella/roster-configs?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setSavedConfigs(prev => prev.filter(c => c.name !== name));
      if (activeConfig === name) setActiveConfig(null);
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const handleReset = () => {
    setSlots(DEFAULT_SLOTS.map(s => ({ ...s })));
    setActiveConfig(null);
    setConfigNotes("");
    setSelectedArchetype("");
  };

  const handleNewConfig = () => {
    if (!newConfigName.trim()) return;
    setSlots(DEFAULT_SLOTS.map(s => ({ ...s })));
    setConfigName(newConfigName.trim());
    setConfigNotes("");
    setSelectedArchetype("");
    setActiveConfig(null);
    setNewConfigName("");
    setShowNewConfig(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Config name header */}
      <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: 700, letterSpacing: "0.06em" }}>CONFIG</span>
          <input value={configName} onChange={e => setConfigName(e.target.value)}
            style={{ fontSize: "18px", fontWeight: 800, color: "#f3f4f6", background: "none", border: "none", outline: "none", flex: 1 }}
          />
          {activeConfig && <span style={{ fontSize: "11px", color: "#6b7280" }}>Active</span>}
        </div>
        <button onClick={() => setShowNewConfig(v => !v)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}>
          <Plus size={12} />New Config
        </button>
      </div>
      {showNewConfig && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "10px", alignItems: "center" }}>
          <input value={newConfigName} onChange={e => setNewConfigName(e.target.value)} placeholder="New config name…" onKeyDown={e => e.key === "Enter" && handleNewConfig()}
            style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "13px", outline: "none" }} />
          <button onClick={handleNewConfig} style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Create</button>
          <button onClick={() => setShowNewConfig(false)} style={{ padding: "8px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* Archetype templates */}
      <div style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: "10px" }}>ROSTER ARCHETYPE TEMPLATE</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {ROSTER_ARCHETYPES.map(a => (
            <button key={a.id} onClick={() => applyArchetype(a.id)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: selectedArchetype === a.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.1)", background: selectedArchetype === a.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)", color: selectedArchetype === a.id ? "#a78bfa" : "#9ca3af", fontSize: "12px", fontWeight: selectedArchetype === a.id ? 600 : 400, cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontWeight: 700 }}>{a.label}</div>
              <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>{a.description}</div>
            </button>
          ))}
        </div>
        {selectedArchetype && <div style={{ marginTop: "8px", fontSize: "11px", color: "#6b7280" }}>Template applied — allocations set proportionally. Adjust sliders as needed.</div>}
      </div>

      {/* Budget Bar */}
      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(59,130,246,0.05))", border: `1px solid ${isOverBudget ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.25)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f3f4f6", display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign size={18} color="#10b981" />
              NIL BUDGET ROSTER BUILDER
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>Total budget: $8,000,000 · Set player salaries</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: isOverBudget ? "#ef4444" : "#10b981" }}>{formatSalary(remaining)} left</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>of $8M total</div>
          </div>
        </div>

        <div style={{ height: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${guardTotal / TOTAL_BUDGET * 100}%`, background: "#3b82f6", transition: "width 0.3s ease" }} />
          <div style={{ position: "absolute", left: `${guardTotal / TOTAL_BUDGET * 100}%`, top: 0, bottom: 0, width: `${forwardTotal / TOTAL_BUDGET * 100}%`, background: "#10b981", transition: "all 0.3s ease" }} />
          <div style={{ position: "absolute", left: `${(guardTotal + forwardTotal) / TOTAL_BUDGET * 100}%`, top: 0, bottom: 0, width: `${benchTotal / TOTAL_BUDGET * 100}%`, background: "#6b7280", transition: "all 0.3s ease" }} />
          {isOverBudget && <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "4px", background: "#ef4444", animation: "pulse 1s ease-in-out infinite" }} />}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#60a5fa" }}>Guards: {formatSalary(guardTotal)} ({Math.round(guardTotal / TOTAL_BUDGET * 100)}%)</span>
          <span style={{ fontSize: "11px", color: "#34d399" }}>Forwards: {formatSalary(forwardTotal)} ({Math.round(forwardTotal / TOTAL_BUDGET * 100)}%)</span>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Bench: {formatSalary(benchTotal)} ({Math.round(benchTotal / TOTAL_BUDGET * 100)}%)</span>
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>Allocated: {formatSalary(totalAllocated)} / {Math.round(pct)}%</span>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={12} />{w}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px" }}>
        {/* LEFT: Roster slots */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "16px" }}>
          {loadingPlayers ? <LoadingSpinner /> : (
            <>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", letterSpacing: "0.08em" }}>GUARDS</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Subtotal: {formatSalary(guardTotal)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {guardSlots.map(slot => <BudgetSlotRow key={slot.id} slot={slot} players={bigBoardPlayers} onChange={handleSlotChange} />)}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", letterSpacing: "0.08em" }}>FORWARDS / BIGS</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Subtotal: {formatSalary(forwardTotal)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {forwardSlots.map(slot => <BudgetSlotRow key={slot.id} slot={slot} players={bigBoardPlayers} onChange={handleSlotChange} />)}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em" }}>BENCH</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Subtotal: {formatSalary(benchTotal)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {benchSlots.map(slot => <BudgetSlotRow key={slot.id} slot={slot} players={bigBoardPlayers} onChange={handleSlotChange} />)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: NIL reference + Save/Load */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: "200px" }}>
          {/* NIL Reference */}
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: "10px" }}>NIL REFERENCE RANGES</div>
            {[
              { label: "ANCHOR", range: "$2.5M — $4.0M", color: "#a78bfa" },
              { label: "STARTER", range: "$1.0M — $2.5M", color: "#10b981" },
              { label: "KEY ROT.", range: "$500K — $1.0M", color: "#3b82f6" },
              { label: "SLEEPER", range: "$200K — $500K", color: "#6b7280" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: r.color }}>{r.label}</span>
                <span style={{ fontSize: "10px", color: "#6b7280" }}>{r.range}</span>
              </div>
            ))}
          </div>

          {/* Per-player breakdown */}
          {slots.filter(s => s.player && s.salary > 0).length > 0 && (
            <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: "10px" }}>PLAYER BREAKDOWN</div>
              {slots.filter(s => s.player && s.salary > 0).map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{s.player!.Player}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", flexShrink: 0 }}>{formatSalary(s.salary)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Roster Notes */}
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: "8px" }}>ROSTER NOTES</div>
            <textarea
              value={configNotes}
              onChange={e => setConfigNotes(e.target.value)}
              placeholder="Notes for this roster config (e.g. 'This assumes Toppin stays, backup plan if he goes pro')…"
              rows={4}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#d1d5db", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Save config */}
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: "10px" }}>SAVE / LOAD CONFIG</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "8px", borderRadius: "8px", background: saveStatus === "saved" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)", border: `1px solid ${saveStatus === "saved" ? "rgba(16,185,129,0.4)" : "rgba(59,130,246,0.4)"}`, color: saveStatus === "saved" ? "#10b981" : "#60a5fa", fontSize: "12px", fontWeight: 600, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {saving ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : saveStatus === "saved" ? <Check size={12} /> : <Save size={12} />}
                {saving ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save Config"}
              </button>
              <button onClick={handleReset} style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>
                <Trash2 size={12} />
              </button>
            </div>

            {!loadingConfigs && savedConfigs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "10px", color: "#4b5563", marginBottom: "4px" }}>SAVED CONFIGS</div>
                {savedConfigs.map(c => (
                  <div key={c.name} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button onClick={() => handleLoad(c)} style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", background: activeConfig === c.name ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeConfig === c.name ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`, color: activeConfig === c.name ? "#60a5fa" : "#d1d5db", fontSize: "11px", cursor: "pointer", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {activeConfig === c.name && <Check size={10} style={{ marginRight: "4px" }} />}
                      {c.name} {c.archetype ? `· ${ROSTER_ARCHETYPES.find(a => a.id === c.archetype)?.label || ""}` : ""}
                    </button>
                    <button onClick={() => handleDelete(c.name)} style={{ padding: "4px", borderRadius: "4px", background: "none", border: "none", color: "#4b5563", cursor: "pointer" }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {loadingConfigs && <div style={{ fontSize: "11px", color: "#4b5563" }}>Loading configs…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 5: NETWORK ──────────────────────────────────────────────────────────

function NetworkTool({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [people, setPeople] = useState<NetworkPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subView, setSubView] = useState<"directory" | "map">("directory");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterRelationship, setFilterRelationship] = useState<"All" | "1st" | "2nd">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkPerson | null>(null);
  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState<Partial<NetworkPerson>[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ imported: number; skipped: number } | null>(null);

  const emptyPerson: Partial<NetworkPerson> = {
    name: "", role: "Coach", organization: "", relationship: "1st", strength: "Medium",
    howKnow: "", phone: "", email: "", twitter: "", notes: "", connections: "",
  };
  const [formData, setFormData] = useState<Partial<NetworkPerson>>(emptyPerson);

  const ROLES = ["All", "Coach", "GM", "Scout", "Agent", "NBA Player", "College Player", "Media", "PE/Business", "Other"];
  const ROLE_COLORS: Record<string, string> = {
    "Coach": "#3b82f6", "GM": "#8b5cf6", "Scout": "#6b7280", "Agent": "#6b7280",
    "NBA Player": "#10b981", "College Player": "#34d399", "Media": "#6b7280",
    "PE/Business": "#6366f1", "Other": "#6b7280",
  };

  const loadPeople = useCallback(() => {
    setLoading(true);
    fetch(`/api/cinderella/network?bust=${syncTrigger}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPeople(data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  const filtered = useMemo(() => {
    return people.filter(p => {
      if (filterRole !== "All" && p.role !== filterRole) return false;
      if (filterRelationship !== "All" && p.relationship !== filterRelationship) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.organization.toLowerCase().includes(q) || p.role.toLowerCase().includes(q);
      }
      return true;
    });
  }, [people, filterRole, filterRelationship, search]);

  const handleSavePerson = async (person: Partial<NetworkPerson>) => {
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { ...person, id: editingId } : person;
      const res = await fetch("/api/cinderella/network", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      setShowAddForm(false);
      setEditingId(null);
      setFormData(emptyPerson);
      loadPeople();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this person?")) return;
    await fetch(`/api/cinderella/network?id=${id}`, { method: "DELETE" });
    loadPeople();
  };

  const startEdit = (person: NetworkPerson) => {
    setFormData({ ...person });
    setEditingId(person.id);
    setShowAddForm(true);
    setExpandedId(null);
  };

  // Bulk import: parse CSV/TSV text
  const parseBulkText = (text: string) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const parsed: Partial<NetworkPerson>[] = lines.map(line => {
      // Support comma or tab separated: Name, Role, Organization, Phone, Email, Notes
      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      const clean = (s?: string) => (s || "").trim().replace(/^["']|["']$/g, "");
      return {
        name: clean(parts[0]),
        role: clean(parts[1]) || "Other",
        organization: clean(parts[2]) || "",
        phone: clean(parts[3]) || "",
        email: clean(parts[4]) || "",
        notes: clean(parts[5]) || "",
        relationship: "1st" as const,
        strength: "Medium" as const,
      };
    }).filter(p => p.name);
    setBulkParsed(parsed);
  };

  const handleBulkImport = async () => {
    if (bulkParsed.length === 0) return;
    setBulkImporting(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/cinderella/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bulkParsed),
      });
      const data = await res.json();
      setBulkResult({ imported: data.imported || 0, skipped: data.skipped || 0 });
      setBulkText("");
      setBulkParsed([]);
      loadPeople();
    } catch (e) {
      console.error("Bulk import failed:", e);
    } finally {
      setBulkImporting(false);
    }
  };

  const BulkImportModal = () => (
    <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#f3f4f6" }}>Bulk Import — Network</span>
        <button onClick={() => { setShowBulkImport(false); setBulkText(""); setBulkParsed([]); setBulkResult(null); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}><X size={16} /></button>
      </div>
      <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", fontSize: "11px", color: "#9ca3af" }}>
        Format: <strong style={{ color: "#d1d5db" }}>Name, Role, Organization, Phone, Email, Notes</strong> (one per line)<br />
        Supports CSV or tab-separated. Duplicate names are skipped.
      </div>
      <textarea
        value={bulkText}
        onChange={(e) => { setBulkText(e.target.value); parseBulkText(e.target.value); }}
        placeholder={"Tim Grover, Coach, ATTACK Athletics, , , Key Cinderella partner\nObi Toppin, NBA Player, Indiana Pacers, , @ObiToppin1, Knicks network"}
        rows={6}
        style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)", color: "#f3f4f6", fontSize: "12px", resize: "vertical", outline: "none", fontFamily: "monospace" }}
      />
      {bulkParsed.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#a78bfa", marginBottom: "8px" }}>Preview — {bulkParsed.length} contacts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
            {bulkParsed.map((p, i) => (
              <div key={i} style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: "#d1d5db", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <strong style={{ color: "#f3f4f6" }}>{p.name}</strong>
                {p.role && p.role !== "Other" && <span style={{ color: "#9ca3af" }}>{p.role}</span>}
                {p.organization && <span style={{ color: "#6b7280" }}>@ {p.organization}</span>}
                {p.email && <span style={{ color: "#60a5fa" }}>{p.email}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {bulkResult && (
        <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", fontSize: "12px", color: "#10b981" }}>
          ✓ Imported {bulkResult.imported} contacts{bulkResult.skipped > 0 ? ` · Skipped ${bulkResult.skipped} duplicates` : ""}
        </div>
      )}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleBulkImport}
          disabled={bulkParsed.length === 0 || bulkImporting}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", background: bulkParsed.length === 0 ? "rgba(107,114,128,0.1)" : "rgba(139,92,246,0.15)", border: `1px solid ${bulkParsed.length === 0 ? "rgba(107,114,128,0.2)" : "rgba(139,92,246,0.4)"}`, color: bulkParsed.length === 0 ? "#4b5563" : "#a78bfa", fontSize: "13px", fontWeight: 600, cursor: bulkParsed.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          {bulkImporting ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />Importing…</> : <><Upload size={14} />Import {bulkParsed.length > 0 ? `${bulkParsed.length} contacts` : ""}</>}
        </button>
      </div>
    </div>
  );

  const PersonForm = () => (
    <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#f3f4f6" }}>{editingId ? "Edit Person" : "Add New Person"}</span>
        <button onClick={() => { setShowAddForm(false); setEditingId(null); setFormData(emptyPerson); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}><X size={16} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
        {[
          { key: "name", label: "Name *", placeholder: "Tim Grover" },
          { key: "organization", label: "Organization", placeholder: "ATTACK Athletics" },
          { key: "howKnow", label: "How they know Norman", placeholder: "Worked together at Knicks 2019-2021" },
          { key: "phone", label: "Phone", placeholder: "+1-312-555-0100" },
          { key: "email", label: "Email", placeholder: "tim@example.com" },
          { key: "twitter", label: "Twitter/X", placeholder: "@timgrover" },
          { key: "connections", label: "Connections (comma-separated names)", placeholder: "Obi Toppin, Dusty May" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ gridColumn: key === "howKnow" || key === "connections" ? "1 / -1" : undefined }}>
            <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "4px" }}>{label}</label>
            <input value={(formData as any)[key] || ""} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "4px" }}>Role</label>
          <select value={formData.role || "Coach"} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "13px", outline: "none" }}>
            {ROLES.filter(r => r !== "All").map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "4px" }}>Relationship</label>
          <select value={formData.relationship || "1st"} onChange={e => setFormData(p => ({ ...p, relationship: e.target.value as "1st" | "2nd" }))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "13px", outline: "none" }}>
            <option value="1st">1st Degree (Norman knows them directly)</option>
            <option value="2nd">2nd Degree (through someone else)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "4px" }}>Connection Strength</label>
          <select value={formData.strength || "Medium"} onChange={e => setFormData(p => ({ ...p, strength: e.target.value as any }))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "13px", outline: "none" }}>
            <option value="Strong">Strong</option>
            <option value="Medium">Medium</option>
            <option value="Weak">Weak</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "4px" }}>Notes</label>
          <textarea value={formData.notes || ""} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Free text notes…" rows={3}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "13px", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => handleSavePerson(formData)} disabled={saving || !formData.name}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: "13px", fontWeight: 600, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          {saving ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
          {saving ? "Saving…" : "Save Person"}
        </button>
      </div>
    </div>
  );

  const strengthColor = (s: string) => s === "Strong" ? "#10b981" : s === "Medium" ? "#3b82f6" : "#6b7280";
  const relColor = (r: string) => r === "1st" ? "#a78bfa" : "#6b7280";

  if (loading && people.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Sub-view tabs */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button onClick={() => setSubView("directory")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: subView === "directory" ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.1)", background: subView === "directory" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)", color: subView === "directory" ? "#60a5fa" : "#9ca3af", fontSize: "13px", fontWeight: subView === "directory" ? 600 : 400, cursor: "pointer" }}>
          <Users size={14} />People Directory
        </button>
        <button onClick={() => setSubView("map")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: subView === "map" ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.1)", background: subView === "map" ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)", color: subView === "map" ? "#a78bfa" : "#9ca3af", fontSize: "13px", fontWeight: subView === "map" ? 600 : 400, cursor: "pointer" }}>
          <Network size={14} />Network Map
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>{people.length} contacts</span>
          <button onClick={() => { setShowBulkImport(v => !v); setShowAddForm(false); setBulkResult(null); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            <Upload size={13} />Bulk Import
          </button>
          <button onClick={() => { setShowAddForm(v => !v); setEditingId(null); setFormData(emptyPerson); setShowBulkImport(false); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#10b981", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            <Plus size={13} />Add Person
          </button>
        </div>
      </div>

      {showBulkImport && <BulkImportModal />}
      {showAddForm && <PersonForm />}

      {subView === "directory" && (
        <>
          {/* Search + filters */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, org, role…"
                style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#f3f4f6", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", color: "#f3f4f6", fontSize: "13px", outline: "none" }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterRelationship} onChange={e => setFilterRelationship(e.target.value as any)}
              style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", color: "#f3f4f6", fontSize: "13px", outline: "none" }}>
              <option value="All">All Degrees</option>
              <option value="1st">1st Degree</option>
              <option value="2nd">2nd Degree</option>
            </select>
          </div>

          {/* People list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.length === 0 && !loading && (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
                No contacts found.{" "}
                <button onClick={() => { setShowAddForm(true); setFormData(emptyPerson); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}>Add the first one.</button>
              </div>
            )}
            {filtered.map(person => {
              const isExpanded = expandedId === person.id;
              const roleColor = ROLE_COLORS[person.role] || "#6b7280";
              return (
                <div key={person.id} style={{ borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)`, overflow: "hidden" }}>
                  <div onClick={() => setExpandedId(isExpanded ? null : person.id)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Role color dot */}
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: roleColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#f3f4f6" }}>{person.name}</span>
                        <span style={{ padding: "1px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, background: `${roleColor}20`, color: roleColor }}>{person.role}</span>
                        <span style={{ padding: "1px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, background: `${relColor(person.relationship)}20`, color: relColor(person.relationship) }}>{person.relationship} degree</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", gap: "8px" }}>
                        <span>{person.organization}</span>
                        {person.howKnow && <><span>·</span><span style={{ color: "#6b7280" }}>{person.howKnow}</span></>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: strengthColor(person.strength) }}>{person.strength}</span>
                      {isExpanded ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {person.notes && <div style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.5 }}>{person.notes}</div>}
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {person.phone && <a href={`tel:${person.phone}`} style={{ fontSize: "12px", color: "#60a5fa", textDecoration: "none" }}>{person.phone}</a>}
                        {person.email && <a href={`mailto:${person.email}`} style={{ fontSize: "12px", color: "#60a5fa", textDecoration: "none" }}>{person.email}</a>}
                        {person.twitter && <a href={`https://x.com/${person.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#60a5fa", textDecoration: "none" }}>{person.twitter}</a>}
                      </div>
                      {person.connections && (
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          <span style={{ fontWeight: 600, color: "#9ca3af" }}>Connected to: </span>{person.connections}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <button onClick={() => startEdit(person)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "6px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}>
                          <Edit2 size={12} />Edit
                        </button>
                        <button onClick={() => handleDelete(person.id)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>
                          <Trash2 size={12} />Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {subView === "map" && (
        <NetworkMapView people={people} selectedNode={selectedNode} onSelectNode={setSelectedNode} isMobile={isMobile} />
      )}
    </div>
  );
}

// ─── NETWORK MAP VIEW ──────────────────────────────────────────────────────────

function NetworkMapView({ people, selectedNode, onSelectNode, isMobile }: {
  people: NetworkPerson[];
  selectedNode: NetworkPerson | null;
  onSelectNode: (p: NetworkPerson | null) => void;
  isMobile: boolean;
}) {
  const [ForceGraph, setForceGraph] = useState<any>(null);
  const [show1stOnly, setShow1stOnly] = useState(false);

  useEffect(() => {
    import("react-force-graph-2d").then(mod => setForceGraph(() => mod.default)).catch(() => null);
  }, []);

  const ROLE_COLORS: Record<string, string> = {
    "Coach": "#3b82f6", "GM": "#8b5cf6", "Scout": "#6b7280", "Agent": "#6b7280",
    "NBA Player": "#10b981", "College Player": "#34d399", "Media": "#9ca3af",
    "PE/Business": "#6366f1", "Other": "#6b7280",
  };

  const graphData = useMemo(() => {
    const filteredPeople = show1stOnly ? people.filter(p => p.relationship === "1st") : people;

    const nodes: any[] = [
      { id: "Norman", name: "Norman DeSilva", role: "You", color: "#a78bfa", val: 10, isNorman: true }
    ];
    const links: any[] = [];
    const addedNames = new Set<string>(["Norman"]);

    filteredPeople.forEach(p => {
      if (!addedNames.has(p.name)) {
        nodes.push({
          id: p.name,
          name: p.name,
          role: p.role,
          color: ROLE_COLORS[p.role] || "#6b7280",
          val: p.strength === "Strong" ? 6 : p.strength === "Medium" ? 4 : 2,
          isFirst: p.relationship === "1st",
          person: p,
        });
        addedNames.add(p.name);
      }

      if (p.relationship === "1st") {
        links.push({ source: "Norman", target: p.name, color: "#4b5563", howKnow: p.howKnow, isDirect: true });
      }

      // 2nd degree connections
      if (p.connections && !show1stOnly) {
        const conns = p.connections.split(",").map(c => c.trim()).filter(Boolean);
        conns.forEach(conn => {
          if (!addedNames.has(conn)) {
            nodes.push({ id: conn, name: conn, role: "Other", color: "#374151", val: 2, isFirst: false, is2nd: true });
            addedNames.add(conn);
          }
          links.push({ source: p.name, target: conn, color: "#374151", isDirect: false });
        });
      }
    });

    return { nodes, links };
  }, [people, show1stOnly]);

  if (!ForceGraph) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginBottom: "12px", color: "#3b82f6" }} />
        <div>Loading network graph…</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
      {/* Graph */}
      <div style={{ flex: 1, borderRadius: "12px", background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", minHeight: "500px", position: "relative" }}>
        {/* Controls */}
        <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 10, display: "flex", gap: "8px" }}>
          <button onClick={() => setShow1stOnly(v => !v)} style={{ padding: "6px 12px", borderRadius: "8px", background: show1stOnly ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${show1stOnly ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)"}`, color: show1stOnly ? "#a78bfa" : "#9ca3af", fontSize: "12px", cursor: "pointer" }}>
            {show1stOnly ? "Show All" : "1st Degree Only"}
          </button>
        </div>
        <ForceGraph
          graphData={graphData}
          width={isMobile ? 360 : 700}
          height={500}
          backgroundColor="#0d1117"
          nodeLabel={(node: any) => `${node.name} (${node.role})`}
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.val}
          linkColor={(link: any) => link.isDirect ? "rgba(107,114,128,0.5)" : "rgba(55,65,81,0.4)"}
          linkWidth={(link: any) => link.isDirect ? 1.5 : 0.8}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1}
          onNodeClick={(node: any) => {
            if (node.person) onSelectNode(node.person);
            else if (node.isNorman) onSelectNode(null);
          }}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const fontSize = Math.max(8, 12 / globalScale);
            ctx.font = `${node.isNorman ? "bold " : ""}${fontSize}px Sans-Serif`;
            const r = Math.sqrt(node.val) * 3;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();
            if (node.isNorman || node.isFirst) {
              ctx.strokeStyle = "rgba(255,255,255,0.3)";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.fillText(label, node.x, node.y + r + fontSize * 0.7);
          }}
        />
      </div>

      {/* Right panel: selected node details */}
      <div style={{ width: isMobile ? "100%" : "260px", flexShrink: 0 }}>
        {/* Legend */}
        <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: "10px" }}>NODE LEGEND</div>
          {[
            { label: "Norman (you)", color: "#a78bfa" },
            { label: "Coach", color: "#3b82f6" },
            { label: "NBA Player", color: "#10b981" },
            { label: "GM / Business", color: "#8b5cf6" },
            { label: "2nd Degree", color: "#374151" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>{item.label}</span>
            </div>
          ))}
        </div>

        {selectedNode ? (
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f3f4f6", marginBottom: "4px" }}>{selectedNode.name}</div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>{selectedNode.role} · {selectedNode.organization}</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}><strong style={{ color: "#9ca3af" }}>Relationship:</strong> {selectedNode.relationship} degree · {selectedNode.strength}</div>
            {selectedNode.howKnow && <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}><strong style={{ color: "#9ca3af" }}>How:</strong> {selectedNode.howKnow}</div>}
            {selectedNode.notes && <div style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.5 }}>{selectedNode.notes}</div>}
            {selectedNode.connections && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#6b7280" }}>
                <strong style={{ color: "#9ca3af" }}>Connects to: </strong>{selectedNode.connections}
              </div>
            )}
            <button onClick={() => onSelectNode(null)} style={{ marginTop: "10px", padding: "5px 10px", borderRadius: "6px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280", fontSize: "11px", cursor: "pointer" }}>
              Deselect
            </button>
          </div>
        ) : (
          <div style={{ padding: "20px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <Network size={24} color="#4b5563" style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Click a node to see details</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VIEW 6: COACHING CONNECTIONS (legacy) ────────────────────────────────────

function getStrengthStyle(strength: number): { glow: string; border: string; text: string; bg: string } {
  if (strength >= 5) return { glow: "0 0 12px rgba(16,185,129,0.35)", border: "rgba(16,185,129,0.45)", text: "#10b981", bg: "rgba(16,185,129,0.08)" };
  if (strength === 4) return { glow: "0 0 8px rgba(59,130,246,0.25)", border: "rgba(59,130,246,0.4)", text: "#3b82f6", bg: "rgba(59,130,246,0.07)" };
  if (strength === 3) return { glow: "none", border: "rgba(107,114,128,0.35)", text: "#9ca3af", bg: "rgba(107,114,128,0.07)" };
  return { glow: "none", border: "rgba(107,114,128,0.25)", text: "#6b7280", bg: "rgba(107,114,128,0.05)" };
}

function CoachingConnections({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [connections, setConnections] = useState<CoachingConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cinderella/connections?bust=${syncTrigger}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConnections(data);
        setLastFetched(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

  const grouped = useMemo(() => {
    const order = ["High", "Medium", "Low"];
    const result: Record<string, CoachingConnection[]> = {};
    order.forEach((p) => { result[p] = connections.filter((c) => c.priority.toLowerCase() === p.toLowerCase()); });
    return { order, result };
  }, [connections]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#e5e7eb" }}>{connections.length}</strong> coaching connections
          {" · "}<strong style={{ color: "#10b981" }}>{connections.filter((c) => c.strength === 5).length} Strength-5</strong>
          {" · "}<strong style={{ color: "#3b82f6" }}>{connections.filter((c) => c.strength === 4).length} Strength-4</strong>
          {" · "}<strong style={{ color: "#ef4444" }}>{connections.filter((c) => c.priority.toLowerCase() === "high").length} High-Priority</strong>
        </span>
        {lastFetched && <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>Synced: {lastFetched.toLocaleTimeString()} · live</span>}
      </div>
      {grouped.order.map((priority) => {
        const group = grouped.result[priority];
        if (!group || group.length === 0) return null;
        const priorityColor = priority === "High" ? "#ef4444" : priority === "Medium" ? "#3b82f6" : "#6b7280";
        const priorityBg = priority === "High" ? "rgba(239,68,68,0.08)" : priority === "Medium" ? "rgba(59,130,246,0.06)" : "rgba(107,114,128,0.05)";
        return (
          <div key={priority}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${priorityColor}30` }}>
              <div style={{ padding: "3px 10px", borderRadius: "6px", background: priorityBg, border: `1px solid ${priorityColor}40`, fontSize: "11px", fontWeight: 800, color: priorityColor, letterSpacing: "0.06em" }}>{priority.toUpperCase()} PRIORITY</div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>{group.length} connection{group.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              {group.map((conn, i) => {
                const ss = getStrengthStyle(conn.strength);
                return (
                  <div key={i} style={{ padding: "14px 16px", borderRadius: "12px", background: ss.bg, border: `1px solid ${ss.border}`, boxShadow: ss.glow, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: ss.text, borderRadius: "12px 0 0 12px" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>{conn.targetPlayer}</span>
                          {conn.relationshipType && <span style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: 600, background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>{conn.relationshipType}</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span>{conn.school}</span>
                          {conn.position && <><span>·</span><span>{conn.position}</span></>}
                        </div>
                      </div>
                      <div style={{ minWidth: "44px", height: "44px", borderRadius: "50%", background: ss.bg, border: `2px solid ${ss.border}`, boxShadow: ss.glow, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: ss.text, lineHeight: 1 }}>{conn.strength}</span>
                        <span style={{ fontSize: "8px", color: "#6b7280", marginTop: "1px" }}>STR</span>
                      </div>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "8px", fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 }}>
                      <div><strong style={{ color: "#d1d5db" }}>Coach:</strong> {conn.playersCoach}{conn.coachBackground && <span style={{ color: "#6b7280" }}> — {conn.coachBackground}</span>}</div>
                      {conn.uicGroverBridge && <div><strong style={{ color: "#d1d5db" }}>Bridge:</strong> {conn.uicGroverBridge}{conn.bridgeRole && <span style={{ color: "#6b7280" }}> ({conn.bridgeRole})</span>}</div>}
                    </div>
                    {conn.actionableStep && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", padding: "7px 10px", borderRadius: "7px", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", fontSize: "11px", color: "#93c5fd", marginBottom: conn.notes ? "6px" : "0" }}>
                        <Zap size={11} style={{ flexShrink: 0, marginTop: "1px" }} />
                        {conn.actionableStep}
                      </div>
                    )}
                    {conn.notes && <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", lineHeight: 1.5, marginTop: "4px" }}>{conn.notes}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {connections.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>No coaching connections found in the sheet.</div>}
    </div>
  );
}

// ─── VIEW 7: STRIKE LIST ──────────────────────────────────────────────────────

const WAVE_COLORS = {
  1: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)", text: "#10b981", badge: "rgba(16,185,129,0.15)", label: "WAVE 1" },
  2: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.35)", text: "#3b82f6", badge: "rgba(59,130,246,0.15)", label: "WAVE 2" },
  3: { bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.35)", text: "#9ca3af", badge: "rgba(107,114,128,0.15)", label: "WAVE 3" },
} as const;

function getWaveStyle(wave: number) { return WAVE_COLORS[wave as keyof typeof WAVE_COLORS] || WAVE_COLORS[3]; }
function nilTierColor(nilTier: string): { color: string; bg: string } {
  if (nilTier.includes("ANCHOR")) return { color: "#a78bfa", bg: "rgba(139,92,246,0.12)" };
  if (nilTier.includes("STARTER")) return { color: "#10b981", bg: "rgba(16,185,129,0.10)" };
  if (nilTier.includes("KEY ROTATION")) return { color: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
  if (nilTier.includes("SLEEPER")) return { color: "#6b7280", bg: "rgba(107,114,128,0.10)" };
  return { color: "#9ca3af", bg: "rgba(107,114,128,0.08)" };
}
function flightRiskColor(risk: string): string {
  const r = parseFloat(risk);
  if (isNaN(r)) return "#6b7280";
  if (r >= 7) return "#ef4444";
  if (r >= 5) return "#3b82f6";
  return "#10b981";
}

function StrikeList({ isMobile, syncTrigger }: { isMobile: boolean; syncTrigger: number }) {
  const [players, setPlayers] = useState<StrikeListPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterWave, setFilterWave] = useState<number | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cinderella/strike-list?bust=${syncTrigger}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlayers(data);
        setLastFetched(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

  const filtered = filterWave ? players.filter((p) => p.wave === filterWave) : players;
  const wave1 = players.filter((p) => p.wave === 1);
  const wave2 = players.filter((p) => p.wave === 2);
  const wave3 = players.filter((p) => p.wave === 3);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const FilterBtn = ({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) => (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: "20px", border: active ? `1px solid ${color || "#3b82f6"}` : "1px solid rgba(255,255,255,0.12)", background: active ? `${color || "#3b82f6"}20` : "rgba(255,255,255,0.04)", color: active ? (color || "#60a5fa") : "#9ca3af", fontSize: "12px", fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          <strong style={{ color: "#e5e7eb" }}>{players.length}</strong> strike targets
          {" · "}<strong style={{ color: "#10b981" }}>{wave1.length} Wave 1</strong>
          {" · "}<strong style={{ color: "#3b82f6" }}>{wave2.length} Wave 2</strong>
          {" · "}<strong style={{ color: "#9ca3af" }}>{wave3.length} Wave 3</strong>
        </span>
        {lastFetched && <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>Synced: {lastFetched.toLocaleTimeString()} · live</span>}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, minWidth: "46px" }}>WAVE</span>
        <FilterBtn active={filterWave === null} onClick={() => setFilterWave(null)}>All</FilterBtn>
        <FilterBtn active={filterWave === 1} onClick={() => setFilterWave(filterWave === 1 ? null : 1)} color="#10b981">Wave 1 ({wave1.length})</FilterBtn>
        <FilterBtn active={filterWave === 2} onClick={() => setFilterWave(filterWave === 2 ? null : 2)} color="#3b82f6">Wave 2 ({wave2.length})</FilterBtn>
        <FilterBtn active={filterWave === 3} onClick={() => setFilterWave(filterWave === 3 ? null : 3)} color="#9ca3af">Wave 3 ({wave3.length})</FilterBtn>
      </div>
      <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", fontSize: "12px", color: "#93c5fd", display: "flex", alignItems: "center", gap: "6px" }}>
        <Zap size={12} />Portal opens ~<strong>March 23, 2026</strong>. Wave 1 contacts go out Day 1.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))", gap: "12px" }}>
        {filtered.map((player, i) => {
          const waveStyle = getWaveStyle(player.wave);
          const nilStyle = nilTierColor(player.nilTier);
          const fRiskColor = flightRiskColor(player.flightRisk);
          const grade = parseFloat(player.grade);
          const cin = parseFloat(player.cinScore);
          return (
            <div key={i} style={{ padding: "16px", borderRadius: "12px", background: waveStyle.bg, border: `1px solid ${waveStyle.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: waveStyle.text, borderRadius: "12px 0 0 12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 800, background: waveStyle.badge, color: waveStyle.text, letterSpacing: "0.05em" }}>{waveStyle.label}</span>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>{player.player}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span>{player.school}</span>
                    {player.pos && <><span>·</span><span>{player.pos}</span></>}
                    {player.cls && <><span>·</span><span>{player.cls}</span></>}
                  </div>
                </div>
                {player.grade && !isNaN(grade) && (
                  <div style={{ minWidth: "46px", height: "46px", borderRadius: "50%", background: grade >= 70 ? "rgba(16,185,129,0.15)" : grade >= 55 ? "rgba(59,130,246,0.15)" : "rgba(107,114,128,0.15)", border: `2px solid ${grade >= 70 ? "rgba(16,185,129,0.5)" : grade >= 55 ? "rgba(59,130,246,0.5)" : "rgba(107,114,128,0.3)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: grade >= 70 ? "#10b981" : grade >= 55 ? "#60a5fa" : "#9ca3af", lineHeight: 1 }}>{player.grade}</span>
                    <span style={{ fontSize: "8px", color: "#6b7280", marginTop: "1px" }}>GRD</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {player.cinScore && <StatPill label="Cin.Score" value={cin ? cin.toFixed(1) : player.cinScore} highlight={cin > 85} />}
                {player.onOff && <StatPill label="Net Adj.Rtg" value={player.onOff} />}
                {player.flightRisk && <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}><span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>FLIGHT RISK</span><span style={{ fontSize: "13px", fontWeight: 700, color: fRiskColor }}>{player.flightRisk}</span></div>}
                {player.confCheck && <StatPill label="CONF" value={player.confCheck} />}
              </div>
              {player.nilTier && <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", background: nilStyle.bg, border: `1px solid ${nilStyle.color}40`, fontSize: "11px", fontWeight: 700, color: nilStyle.color, marginBottom: "8px" }}>{player.nilTier}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", marginBottom: "8px" }}>
                <Shield size={12} color="#6b7280" />
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Contact Status:</span>
                <span style={{ color: player.contactStatus ? "#10b981" : "#4b5563", fontStyle: player.contactStatus ? "normal" : "italic" }}>{player.contactStatus || "— (fill when portal opens)"}</span>
              </div>
              {player.whyWeWantHim && <div style={{ padding: "8px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "#9ca3af", lineHeight: 1.6, fontStyle: "italic", marginBottom: "6px" }}><span style={{ color: "#6b7280", fontStyle: "normal", fontWeight: 600 }}>Why: </span>{player.whyWeWantHim}</div>}
              {player.coachingConnection && <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", padding: "6px 10px", borderRadius: "7px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", fontSize: "11px", color: "#c4b5fd", lineHeight: 1.5 }}><Users size={11} style={{ flexShrink: 0, marginTop: "1px" }} />{player.coachingConnection}</div>}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>No strike targets found.</div>}
    </div>
  );
}

// ─── QUICK STATS BAR ─────────────────────────────────────────────────────────

function QuickStatsBar({ syncTrigger }: { syncTrigger: number }) {
  const [stats, setStats] = useState<WarRoomStats | null>(null);
  const portalOpensDate = new Date("2026-03-23T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilPortal = Math.ceil((portalOpensDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const portalOpen = daysUntilPortal <= 0;

  useEffect(() => {
    fetch(`/api/cinderella/big-board?bust=${syncTrigger}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setStats({
          totalPlayers: data.length,
          t1Count: data.filter((p) => p.Tier && p.Tier.includes("T1") && !p.Tier.includes("RF")).length,
          t2Count: data.filter((p) => p.Tier && p.Tier.includes("T2") && !p.Tier.includes("RF")).length,
          t3Count: data.filter((p) => p.Tier && p.Tier.includes("T3") && !p.Tier.includes("RF")).length,
        });
      })
      .catch(() => null);
  }, [syncTrigger]);

  function StatBlock({ icon, label, value, valueColor, sub }: { icon: React.ReactNode; label: string; value: string; valueColor: string; sub?: string }) {
    return (
      <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {icon}
          <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>{label.toUpperCase()}</span>
        </div>
        <span style={{ fontSize: "20px", fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: "9px", color: "#4b5563" }}>{sub}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
      <StatBlock icon={<Users size={14} color="#9ca3af" />} label="Players Tracked" value={stats ? String(stats.totalPlayers) : "—"} valueColor="#e5e7eb" />
      <StatBlock icon={<Star size={14} color="#10b981" />} label="T1 Targets" value={stats ? String(stats.t1Count) : "—"} valueColor="#10b981" />
      <StatBlock icon={<Clock size={14} color={portalOpen ? "#ef4444" : "#3b82f6"} />} label={portalOpen ? "Portal OPEN" : "Portal Opens"} value={portalOpen ? "NOW" : `${daysUntilPortal}d`} valueColor={portalOpen ? "#ef4444" : "#3b82f6"} sub="Mar 23, 2026" />
      <StatBlock icon={<Target size={14} color="#3b82f6" />} label="Wave 1 Strikes" value="6" valueColor="#3b82f6" sub="Day 1 contacts" />
    </div>
  );
}

// ─── MAIN WAR ROOM COMPONENT ──────────────────────────────────────────────────

export function WarRoom({ isMobile }: { isMobile: boolean }) {
  const [activeView, setActiveView] = useState<"fulldatabase" | "bigboard" | "rankings" | "roster" | "budget" | "network" | "connections" | "strikelist">("fulldatabase");
  const [syncTrigger, setSyncTrigger] = useState(Date.now());
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  const [syncTimerLabel, setSyncTimerLabel] = useState("just now");

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncTimerLabel(getTimeSince(lastSyncedAt));
    }, 30_000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  const handleSync = async () => {
    setSyncing(true);
    const now = Date.now();
    setSyncTrigger(now);
    setLastSyncedAt(new Date());
    setSyncTimerLabel("just now");
    await new Promise(r => setTimeout(r, 500));
    setSyncing(false);
  };

  const views = [
    { id: "fulldatabase" as const, label: "Players", icon: Database },
    { id: "rankings" as const, label: "Big Board", icon: Star },
    { id: "bigboard" as const, label: "Portal Scouting", icon: TrendingUp },
    { id: "roster" as const, label: "Roster Builder", icon: Users },
    { id: "budget" as const, label: "Budget Builder", icon: DollarSign },
    { id: "network" as const, label: "Network", icon: Network },
    { id: "connections" as const, label: "Coaching Connections", icon: Zap },
    { id: "strikelist" as const, label: "Strike List", icon: Crosshair },
  ];

  const tabAccent: Record<string, { active: string; border: string; bg: string }> = {
    fulldatabase: { active: "#f59e0b", border: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.12)" },
    bigboard: { active: "#60a5fa", border: "rgba(59,130,246,0.4)", bg: "rgba(59,130,246,0.12)" },
    rankings: { active: "#a78bfa", border: "rgba(139,92,246,0.4)", bg: "rgba(139,92,246,0.12)" },
    roster: { active: "#34d399", border: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.12)" },
    budget: { active: "#10b981", border: "rgba(16,185,129,0.4)", bg: "rgba(16,185,129,0.12)" },
    network: { active: "#a78bfa", border: "rgba(139,92,246,0.4)", bg: "rgba(139,92,246,0.10)" },
    connections: { active: "#9ca3af", border: "rgba(107,114,128,0.4)", bg: "rgba(107,114,128,0.10)" },
    strikelist: { active: "#f87171", border: "rgba(239,68,68,0.45)", bg: "rgba(239,68,68,0.10)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* War Room header */}
      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.05))", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <Crosshair size={20} color="#3b82f6" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6" }}>War Room — Basketball Intelligence</div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            Real-time data from Google Sheets · Portal Big Board · Norman&apos;s Rankings · Strike List (Wave 1–3)
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>
            Last synced: <strong style={{ color: "#9ca3af" }}>{syncTimerLabel}</strong>
          </span>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", background: syncing ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa", fontSize: "12px", fontWeight: 600, cursor: syncing ? "wait" : "pointer", transition: "all 0.15s" }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <QuickStatsBar syncTrigger={syncTrigger} />

      {/* View tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {views.map(({ id, label, icon: Icon }) => {
          const accent = tabAccent[id];
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{ padding: isMobile ? "8px 14px" : "10px 18px", borderRadius: "8px", border: isActive ? `1px solid ${accent.border}` : "1px solid rgba(255,255,255,0.1)", background: isActive ? accent.bg : "rgba(255,255,255,0.03)", color: isActive ? accent.active : "rgba(255,255,255,0.6)", fontSize: isMobile ? "12px" : "13px", fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* View content */}
      <div>
        {activeView === "fulldatabase" && <FullDatabaseBoard isMobile={isMobile} />}
        {activeView === "rankings" && <BigBoardView isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "bigboard" && <PortalBigBoard isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "roster" && <RosterBuilder isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "budget" && <BudgetRosterBuilder isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "network" && <NetworkTool isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "connections" && <CoachingConnections isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "strikelist" && <StrikeList isMobile={isMobile} syncTrigger={syncTrigger} />}
      </div>
    </div>
  );
}
