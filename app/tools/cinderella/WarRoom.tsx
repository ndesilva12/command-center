"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
} from "lucide-react";

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
  id: string; // e.g. "PG", "SG", "SF", "PF", "C", "B1"-"B5"
  label: string;
  posGroup: "guards" | "forwards" | "bench";
  player: BigBoardPlayer | null;
  salary: number;
}

interface SavedRosterConfig {
  name: string;
  slots: {
    slot: string;
    player: string;
    espnId: string;
    salary: number;
    notes: string;
    pos: string;
    school: string;
  }[];
}

const TOTAL_BUDGET = 8_000_000;
const MAX_SALARY = 4_000_000;
const SALARY_STEP = 50_000;

const DEFAULT_SLOTS: BudgetSlot[] = [
  { id: "PG", label: "PG", posGroup: "guards", player: null, salary: 0 },
  { id: "SG", label: "SG", posGroup: "guards", player: null, salary: 0 },
  { id: "SF", label: "SF", posGroup: "forwards", player: null, salary: 0 },
  { id: "PF", label: "PF", posGroup: "forwards", player: null, salary: 0 },
  { id: "C", label: "C", posGroup: "forwards", player: null, salary: 0 },
  { id: "B1", label: "6th", posGroup: "bench", player: null, salary: 0 },
  { id: "B2", label: "7th", posGroup: "bench", player: null, salary: 0 },
  { id: "B3", label: "8th", posGroup: "bench", player: null, salary: 0 },
  { id: "B4", label: "9th", posGroup: "bench", player: null, salary: 0 },
  { id: "B5", label: "10th", posGroup: "bench", player: null, salary: 0 },
];

// ─── Color helpers ────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  T1: { bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.4)", text: "#10b981", badge: "rgba(16,185,129,0.15)" },
  T2: { bg: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.4)", text: "#3b82f6", badge: "rgba(59,130,246,0.15)" },
  T3: { bg: "rgba(212,175,55,0.07)", border: "rgba(212,175,55,0.4)", text: "#d4af37", badge: "rgba(212,175,55,0.15)" },
  T4: { bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.3)", text: "#9ca3af", badge: "rgba(107,114,128,0.12)" },
  "T4-RF": { bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.5)", text: "#7c3aed", badge: "rgba(124,58,237,0.2)" },
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
  if (risk === "high") return { color: "#7c3aed", bg: "rgba(124,58,237,0.12)", dot: "#7c3aed" };
  if (risk === "moderate") return { color: "#d4af37", bg: "rgba(212,175,55,0.12)", dot: "#d4af37" };
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
    <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", color: "#7c3aed", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cinderella/big-board?bust=${syncTrigger}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlayers(data);
        setLastFetched(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [syncTrigger]);

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
      return true;
    });
  }, [players, filterPos, filterConfTier, filterTier, filterConfCheck]);

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

  const confTiers = useMemo(() => [...new Set(players.map((p) => p["Conf Tier"]).filter(Boolean))].sort(), [players]);
  const positions = useMemo(() => [...new Set(players.map((p) => p.Position).filter(Boolean))].sort(), [players]);

  const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: "20px", border: active ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)", background: active ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)", color: active ? "#60a5fa" : "#9ca3af", fontSize: "12px", fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          📊 <strong style={{ color: "#e5e7eb" }}>{players.length}</strong> players tracked
          {" · "}<strong style={{ color: "#10b981" }}>{players.filter((p) => p.Tier.includes("T1") && !p.Tier.includes("RF")).length} T1</strong>
          {" · "}<strong style={{ color: "#3b82f6" }}>{players.filter((p) => p.Tier.includes("T2") && !p.Tier.includes("RF")).length} T2</strong>
          {" · "}<strong style={{ color: "#d4af37" }}>{players.filter((p) => p.Tier.includes("T3") && !p.Tier.includes("RF")).length} T3</strong>
          {(() => {
            const unverified = players.filter((p) => p["Net Adj.Rtg"].toLowerCase().includes("est.")).length;
            return unverified > 0 ? <>{" · "}<strong style={{ color: "#d4af37" }} title="Players with estimated Net Adj Rtg">~{unverified} unverified</strong></> : null;
          })()}
        </span>
        {lastFetched && (
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>
            Synced: {lastFetched.toLocaleTimeString()} · live
          </span>
        )}
      </div>

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
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>CONF✓</span>
          <FilterBtn active={filterConfCheck === ""} onClick={() => setFilterConfCheck("")}>All</FilterBtn>
          {["P6", "High-Major", "Mid-Major", "Low-Major"].map((c) => <FilterBtn key={c} active={filterConfCheck === c} onClick={() => setFilterConfCheck(c === filterConfCheck ? "" : c)}>{c}</FilterBtn>)}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>SORT</span>
          {([["grade", "Grade"], ["cin", "Cin. Score"], ["netrtg", "Net Adj.Rtg"]] as const).map(([key, label]) => (
            <FilterBtn key={key} active={sortKey === key} onClick={() => setSortKey(key)}>{label} {sortKey === key ? "↓" : ""}</FilterBtn>
          ))}
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#6b7280" }}>
        Showing <strong style={{ color: "#e5e7eb" }}>{sorted.length}</strong> of {players.length} players
      </div>

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
          const hasFlag = player["Team Impact Flag"] && player["Team Impact Flag"].trim() !== "";
          const flightRisk = parseFloat(player["Flight Risk Score"] || "0");
          const hasFlightRisk = !isNaN(flightRisk) && flightRisk > 0;
          const flightRiskColor = flightRisk >= 7 ? "#7c3aed" : flightRisk >= 5 ? "#d4af37" : "#10b981";
          const flightRiskBg = flightRisk >= 7 ? "rgba(124,58,237,0.12)" : flightRisk >= 5 ? "rgba(212,175,55,0.12)" : "rgba(16,185,129,0.12)";
          return (
            <div key={i} style={{ padding: "14px 16px", borderRadius: "12px", background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: tierStyle.text, borderRadius: "12px 0 0 12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>{player.Player}</span>
                    <span style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: 700, background: tierStyle.badge, color: tierStyle.text, letterSpacing: "0.04em" }}>{player.Tier}</span>
                    {player.Tier.includes("RF") && <AlertTriangle size={13} color="#7c3aed" />}
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
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <StatPill label="Cin.Score" value={cinScore ? cinScore.toFixed(1) : "—"} highlight={cinScore > 85} />
                {player["Cin Score v2"] && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>Cin.v2</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: cinV2Downgraded ? "#d4af37" : "#d1d5db" }}>{cinV2Downgraded && <span style={{ fontSize: "11px", marginRight: "2px" }}>↓</span>}{cinScoreV2 ? cinScoreV2.toFixed(1) : "—"}</span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }} title={netRtgIsEst ? "Estimated value" : undefined}>
                  <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>Net Adj.Rtg</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: netRtgIsEst ? "#d4af37" : (netRtg > 5 ? "#10b981" : "#d1d5db") }}>
                    {netRtgRaw ? (netRtgIsEst ? <><span style={{ color: "#d4af37" }}>~</span>{netRtgRaw.replace(/est\.\s*/i, "").trim() || "—"}</> : netRtgRaw) : "—"}
                  </span>
                </div>
                <StatPill label="PPG" value={player.PPG || "—"} />
                <StatPill label="APG" value={player.APG || "—"} />
                <StatPill label="3P%" value={player["3P%"] ? `${player["3P%"]}%` : "—"} />
              </div>
              {hasFlag && <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "6px", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", fontSize: "11px", color: "#d4af37", fontWeight: 600 }}><Zap size={10} />{player["Team Impact Flag"]}</div>}
              {hasFlightRisk && <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "6px", background: flightRiskBg, border: `1px solid ${flightRiskColor}40`, fontSize: "11px", color: flightRiskColor, fontWeight: 600, marginTop: hasFlag ? "6px" : "0" }}><div style={{ width: "7px", height: "7px", borderRadius: "50%", background: flightRiskColor, flexShrink: 0 }} />Flight Risk: {player["Flight Risk Score"]}</div>}
              {player["Conference Check"] && <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.25)", fontSize: "10px", color: "#9ca3af", fontWeight: 600, marginTop: "4px", marginLeft: hasFlightRisk ? "6px" : "0" }}>{player["Conference Check"]}</div>}
              {player["Role Fit"] && <div style={{ marginTop: "6px", fontSize: "11px", color: "#6b7280", fontStyle: "italic" }}>Role: {player["Role Fit"]}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── VIEW 2: NORMAN'S RANKINGS (with List View + DnD) ─────────────────────────

function SortablePlayerItem({ player, rank, isDragging }: { player: RankingPlayer; rank: number; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `${player.rowIndex}-${player.name}` });
  const tierStyle = getTierStyle(player.tier);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", background: player.isRedFlag ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${player.isRedFlag ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "default" }}>
      {/* Drag handle */}
      <div {...attributes} {...listeners} style={{ cursor: "grab", color: "#4b5563", flexShrink: 0, display: "flex", alignItems: "center" }}>
        <GripVertical size={16} />
      </div>
      {/* Rank */}
      <div style={{ minWidth: "28px", fontSize: "14px", fontWeight: 800, color: "#6b7280", textAlign: "right" }}>#{rank}</div>
      {/* Tier badge */}
      <span style={{ padding: "2px 7px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, background: tierStyle.badge, color: tierStyle.text, flexShrink: 0 }}>{player.tier}</span>
      {/* Name + school */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {player.isRedFlag && <AlertTriangle size={12} color="#7c3aed" />}
          <span style={{ fontSize: "13px", fontWeight: 700, color: player.isRedFlag ? "#fca5a5" : "#f3f4f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</span>
        </div>
        <div style={{ fontSize: "11px", color: "#6b7280" }}>{player.school} · {player.pos} · {player.yr}</div>
      </div>
      {/* Scout notes */}
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

    // Write back to Google Sheet
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
      {/* Save status */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", minHeight: "24px" }}>
        {saving && <span style={{ fontSize: "11px", color: "#d4af37", display: "flex", alignItems: "center", gap: "4px" }}><RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} />Saving order…</span>}
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
                      <div key={i} style={{ padding: "12px 14px", borderRadius: "10px", background: player.isRedFlag ? "rgba(124,58,237,0.08)" : ts.bg, border: `1px solid ${player.isRedFlag ? "rgba(124,58,237,0.4)" : ts.border}`, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: player.isRedFlag ? "#7c3aed" : ts.text }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: player.scoutNotes ? "8px" : "0" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                              {player.isRedFlag && <AlertTriangle size={13} color="#7c3aed" />}
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
      {/* View toggle */}
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
        // LIST VIEW WITH DRAG AND DROP
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "24px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
              🏀 Guards <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400 }}>({guards.length})</span>
            </h3>
            <DraggableList players={guards} sectionKey="guards" onReorder={handleReorder} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
              💪 Forwards / Bigs <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400 }}>({forwards.length})</span>
            </h3>
            <DraggableList players={forwards} sectionKey="forwards" onReorder={handleReorder} />
          </div>
          {bigMen.length > 0 && (
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>🏗️ Big Men</h3>
              <DraggableList players={bigMen} sectionKey="bigMen" onReorder={handleReorder} />
            </div>
          )}
        </div>
      ) : (
        // GRID VIEW (existing)
        <>
          <GridSection title="🏀 Guards" players={guards} />
          <GridSection title="💪 Forwards / Bigs" players={forwards} />
          {bigMen.length > 0 && <GridSection title="🏗️ Big Men Rankings" players={bigMen} />}
        </>
      )}
    </div>
  );
}

// ─── VIEW 3: ROSTER BUILDER (existing sheet configs) ─────────────────────────

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
                {config.championshipProb && <div style={{ marginTop: "8px", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", fontSize: "11px", color: "#d1d5db" }}>🏆 {config.championshipProb}</div>}
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
                {config.portalReality && <div style={{ marginTop: "12px", padding: "8px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "11px", color: "#9ca3af" }}>⚠️ {config.portalReality}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {strikeOrder.length > 0 && (
        <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#7c3aed", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Zap size={16} />PORTAL STRIKE ORDER — Opens ~March 23, 2026</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {strikeOrder.map((target, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ padding: "2px 8px", borderRadius: "6px", background: i <= 1 ? "rgba(124,58,237,0.15)" : "rgba(212,175,55,0.1)", color: i <= 1 ? "#7c3aed" : "#d4af37", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>{target.priority}</span>
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

function PlayerPickerDropdown({ players, onSelect, onClose, currentPlayer }: { players: BigBoardPlayer[]; onSelect: (p: BigBoardPlayer) => void; onClose: () => void; currentPlayer: BigBoardPlayer | null }) {
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
            <button onClick={() => { onSelect(null as any); onClose(); }} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#7c3aed", fontSize: "12px", cursor: "pointer", textAlign: "left" }}>
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

function BudgetSlotRow({ slot, players, onChange }: { slot: BudgetSlot; players: BigBoardPlayer[]; onChange: (id: string, field: "player" | "salary", value: any) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isEmpty = !slot.player;
  const salaryPct = slot.salary / MAX_SALARY * 100;
  const nilLabel = slot.salary >= 2_500_000 ? "ANCHOR" : slot.salary >= 1_000_000 ? "STARTER" : slot.salary >= 500_000 ? "KEY ROT." : slot.salary >= 200_000 ? "SLEEPER" : "—";
  const nilColor = slot.salary >= 2_500_000 ? "#a78bfa" : slot.salary >= 1_000_000 ? "#10b981" : slot.salary >= 500_000 ? "#3b82f6" : slot.salary >= 200_000 ? "#d4af37" : "#6b7280";

  const tierStyle = slot.player ? getTierStyle(slot.player.Tier) : null;

  return (
    <>
      {pickerOpen && <PlayerPickerDropdown players={players} currentPlayer={slot.player} onSelect={(p) => onChange(slot.id, "player", p)} onClose={() => setPickerOpen(false)} />}
      <div style={{ padding: "12px 14px", borderRadius: "10px", background: isEmpty ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)", border: `1px solid ${isEmpty ? "rgba(255,255,255,0.08)" : (tierStyle?.border || "rgba(255,255,255,0.15)")}`, display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Top row: position + player */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Position label */}
          <div style={{ minWidth: "36px", padding: "4px 6px", borderRadius: "6px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", fontSize: "11px", fontWeight: 800, color: "#60a5fa", textAlign: "center", flexShrink: 0 }}>{slot.label}</div>

          {/* Player button */}
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
        </div>

        {/* Salary row (only show if player assigned) */}
        {!isEmpty && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "46px" }}>
            {/* NIL label */}
            <span style={{ fontSize: "10px", fontWeight: 700, color: nilColor, minWidth: "60px" }}>{nilLabel}</span>
            {/* Slider */}
            <input type="range" min={0} max={MAX_SALARY} step={SALARY_STEP} value={slot.salary}
              onChange={e => onChange(slot.id, "salary", parseInt(e.target.value))}
              style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }}
            />
            {/* Salary input */}
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
  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  // Fetch big board players
  useEffect(() => {
    setLoadingPlayers(true);
    fetch(`/api/cinderella/big-board?bust=${syncTrigger}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBigBoardPlayers(data); })
      .catch(console.error)
      .finally(() => setLoadingPlayers(false));
  }, [syncTrigger]);

  // Fetch saved configs
  useEffect(() => {
    setLoadingConfigs(true);
    fetch("/api/cinderella/roster-configs")
      .then(r => r.json())
      .then(data => { if (data.configs) setSavedConfigs(data.configs); })
      .catch(console.error)
      .finally(() => setLoadingConfigs(false));
  }, []);

  const handleSlotChange = useCallback((id: string, field: "player" | "salary", value: any) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value, ...(field === "player" && value === null ? { salary: 0 } : {}) } : s));
  }, []);

  // Budget calculations
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

  // Warnings
  const warnings: string[] = [];
  if (isOverBudget) warnings.push(`⚠️ Over budget by ${formatSalary(totalAllocated - TOTAL_BUDGET)}`);
  slots.forEach(s => {
    if (s.player && s.salary > TOTAL_BUDGET * 0.4) warnings.push(`⚠️ ${s.player.Player} takes ${Math.round(s.salary / TOTAL_BUDGET * 100)}% of budget`);
  });
  if (guardTotal > 0 && forwardTotal > 0) {
    const ratio = guardTotal / (guardTotal + forwardTotal);
    if (ratio > 0.75) warnings.push("⚠️ Guards taking 75%+ of starter budget — consider balancing");
  }

  // Save config
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const payload = {
        name: configName,
        slots: slots.filter(s => s.player).map(s => ({
          slot: s.id,
          player: s.player!.Player,
          espnId: "",
          salary: s.salary,
          notes: "",
          pos: s.player!.Position,
          school: s.player!["Current School"],
        })),
      };
      const res = await fetch("/api/cinderella/roster-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      // Refresh saved configs
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

  // Load config
  const handleLoad = (config: SavedRosterConfig) => {
    const newSlots = DEFAULT_SLOTS.map(s => ({ ...s }));
    config.slots.forEach(saved => {
      const slotIdx = newSlots.findIndex(sl => sl.id === saved.slot);
      if (slotIdx === -1) return;
      const player = bigBoardPlayers.find(p => p.Player === saved.player) || null;
      newSlots[slotIdx].player = player;
      newSlots[slotIdx].salary = saved.salary;
    });
    setSlots(newSlots);
    setConfigName(config.name);
    setActiveConfig(config.name);
  };

  // Delete config
  const handleDelete = async (name: string) => {
    try {
      await fetch(`/api/cinderella/roster-configs?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setSavedConfigs(prev => prev.filter(c => c.name !== name));
      if (activeConfig === name) setActiveConfig(null);
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // Reset slots
  const handleReset = () => {
    setSlots(DEFAULT_SLOTS.map(s => ({ ...s })));
    setActiveConfig(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header / Budget Bar */}
      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(59,130,246,0.05))", border: `1px solid ${isOverBudget ? "rgba(124,58,237,0.4)" : "rgba(16,185,129,0.25)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f3f4f6", display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign size={18} color="#10b981" />
              NIL BUDGET ROSTER BUILDER
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>Total budget: $8,000,000 · Drag players in, set salaries</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: isOverBudget ? "#7c3aed" : "#10b981" }}>{formatSalary(remaining)} left</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>of $8M total</div>
          </div>
        </div>

        {/* Budget bar */}
        <div style={{ height: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}>
          {/* Guards portion */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${guardTotal / TOTAL_BUDGET * 100}%`, background: "#3b82f6", transition: "width 0.3s ease" }} />
          {/* Forwards portion */}
          <div style={{ position: "absolute", left: `${guardTotal / TOTAL_BUDGET * 100}%`, top: 0, bottom: 0, width: `${forwardTotal / TOTAL_BUDGET * 100}%`, background: "#10b981", transition: "all 0.3s ease" }} />
          {/* Bench portion */}
          <div style={{ position: "absolute", left: `${(guardTotal + forwardTotal) / TOTAL_BUDGET * 100}%`, top: 0, bottom: 0, width: `${benchTotal / TOTAL_BUDGET * 100}%`, background: "#d4af37", transition: "all 0.3s ease" }} />
          {isOverBudget && <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "4px", background: "#7c3aed", animation: "pulse 1s ease-in-out infinite" }} />}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Budget breakdown legend */}
        <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#60a5fa" }}>🔵 Guards: {formatSalary(guardTotal)} ({Math.round(guardTotal / TOTAL_BUDGET * 100)}%)</span>
          <span style={{ fontSize: "11px", color: "#34d399" }}>🟢 Forwards: {formatSalary(forwardTotal)} ({Math.round(forwardTotal / TOTAL_BUDGET * 100)}%)</span>
          <span style={{ fontSize: "11px", color: "#d4af37" }}>🟡 Bench: {formatSalary(benchTotal)} ({Math.round(benchTotal / TOTAL_BUDGET * 100)}%)</span>
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>Allocated: {formatSalary(totalAllocated)} / {Math.round(pct)}%</span>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", fontSize: "12px", color: "#d4af37" }}>{w}</div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px" }}>
        {/* LEFT: Roster slots */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "16px" }}>
          {loadingPlayers ? <LoadingSpinner /> : (
            <>
              {/* Guards */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", letterSpacing: "0.08em" }}>🔵 GUARDS</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Subtotal: {formatSalary(guardTotal)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {guardSlots.map(slot => <BudgetSlotRow key={slot.id} slot={slot} players={bigBoardPlayers} onChange={handleSlotChange} />)}
                </div>
              </div>

              {/* Forwards */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", letterSpacing: "0.08em" }}>🟢 FORWARDS / BIGS</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Subtotal: {formatSalary(forwardTotal)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {forwardSlots.map(slot => <BudgetSlotRow key={slot.id} slot={slot} players={bigBoardPlayers} onChange={handleSlotChange} />)}
                </div>
              </div>

              {/* Bench */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#d4af37", letterSpacing: "0.08em" }}>🟡 BENCH</span>
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
              { label: "SLEEPER", range: "$200K — $500K", color: "#d4af37" },
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

          {/* Save config */}
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: "10px" }}>SAVE / LOAD CONFIG</div>
            <input value={configName} onChange={e => setConfigName(e.target.value)} placeholder="Config name…" style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f3f4f6", fontSize: "12px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "8px", borderRadius: "8px", background: saveStatus === "saved" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)", border: `1px solid ${saveStatus === "saved" ? "rgba(16,185,129,0.4)" : "rgba(59,130,246,0.4)"}`, color: saveStatus === "saved" ? "#10b981" : "#60a5fa", fontSize: "12px", fontWeight: 600, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {saving ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : saveStatus === "saved" ? <Check size={12} /> : <Save size={12} />}
                {saving ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save"}
              </button>
              <button onClick={handleReset} style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#7c3aed", fontSize: "12px", cursor: "pointer" }}>
                <Trash2 size={12} />
              </button>
            </div>

            {/* Saved configs list */}
            {!loadingConfigs && savedConfigs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "10px", color: "#4b5563", marginBottom: "4px" }}>SAVED CONFIGS</div>
                {savedConfigs.map(c => (
                  <div key={c.name} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button onClick={() => handleLoad(c)} style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", background: activeConfig === c.name ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeConfig === c.name ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`, color: activeConfig === c.name ? "#60a5fa" : "#d1d5db", fontSize: "11px", cursor: "pointer", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {activeConfig === c.name && <Check size={10} style={{ marginRight: "4px" }} />}
                      {c.name}
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

// ─── VIEW 5: COACHING CONNECTIONS ─────────────────────────────────────────────

function getStrengthStyle(strength: number): { glow: string; border: string; text: string; bg: string } {
  if (strength >= 5) return { glow: "0 0 12px rgba(16,185,129,0.35)", border: "rgba(16,185,129,0.45)", text: "#10b981", bg: "rgba(16,185,129,0.08)" };
  if (strength === 4) return { glow: "0 0 8px rgba(59,130,246,0.25)", border: "rgba(59,130,246,0.4)", text: "#3b82f6", bg: "rgba(59,130,246,0.07)" };
  if (strength === 3) return { glow: "none", border: "rgba(212,175,55,0.35)", text: "#d4af37", bg: "rgba(212,175,55,0.07)" };
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
          🤝 <strong style={{ color: "#e5e7eb" }}>{connections.length}</strong> coaching connections
          {" · "}<strong style={{ color: "#10b981" }}>{connections.filter((c) => c.strength === 5).length} Strength-5</strong>
          {" · "}<strong style={{ color: "#3b82f6" }}>{connections.filter((c) => c.strength === 4).length} Strength-4</strong>
          {" · "}<strong style={{ color: "#7c3aed" }}>{connections.filter((c) => c.priority.toLowerCase() === "high").length} High-Priority</strong>
        </span>
        {lastFetched && <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>Synced: {lastFetched.toLocaleTimeString()} · live</span>}
      </div>
      {grouped.order.map((priority) => {
        const group = grouped.result[priority];
        if (!group || group.length === 0) return null;
        const priorityColor = priority === "High" ? "#7c3aed" : priority === "Medium" ? "#d4af37" : "#6b7280";
        const priorityBg = priority === "High" ? "rgba(124,58,237,0.08)" : priority === "Medium" ? "rgba(212,175,55,0.06)" : "rgba(107,114,128,0.05)";
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

// ─── VIEW 6: STRIKE LIST ──────────────────────────────────────────────────────

const WAVE_COLORS = {
  1: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)", text: "#10b981", badge: "rgba(16,185,129,0.15)", label: "WAVE 1" },
  2: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.35)", text: "#3b82f6", badge: "rgba(59,130,246,0.15)", label: "WAVE 2" },
  3: { bg: "rgba(212,175,55,0.08)", border: "rgba(212,175,55,0.35)", text: "#d4af37", badge: "rgba(212,175,55,0.15)", label: "WAVE 3" },
} as const;

function getWaveStyle(wave: number) { return WAVE_COLORS[wave as keyof typeof WAVE_COLORS] || WAVE_COLORS[3]; }
function nilTierColor(nilTier: string): { color: string; bg: string } {
  if (nilTier.includes("ANCHOR")) return { color: "#a78bfa", bg: "rgba(139,92,246,0.12)" };
  if (nilTier.includes("STARTER")) return { color: "#10b981", bg: "rgba(16,185,129,0.10)" };
  if (nilTier.includes("KEY ROTATION")) return { color: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
  if (nilTier.includes("SLEEPER")) return { color: "#d4af37", bg: "rgba(212,175,55,0.10)" };
  return { color: "#9ca3af", bg: "rgba(107,114,128,0.08)" };
}
function flightRiskColor(risk: string): string {
  const r = parseFloat(risk);
  if (isNaN(r)) return "#6b7280";
  if (r >= 7) return "#7c3aed";
  if (r >= 5) return "#d4af37";
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
          🎯 <strong style={{ color: "#e5e7eb" }}>{players.length}</strong> strike targets
          {" · "}<strong style={{ color: "#10b981" }}>{wave1.length} Wave 1</strong>
          {" · "}<strong style={{ color: "#3b82f6" }}>{wave2.length} Wave 2</strong>
          {" · "}<strong style={{ color: "#d4af37" }}>{wave3.length} Wave 3</strong>
        </span>
        {lastFetched && <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>Synced: {lastFetched.toLocaleTimeString()} · live</span>}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, minWidth: "46px" }}>WAVE</span>
        <FilterBtn active={filterWave === null} onClick={() => setFilterWave(null)}>All</FilterBtn>
        <FilterBtn active={filterWave === 1} onClick={() => setFilterWave(filterWave === 1 ? null : 1)} color="#10b981">🟢 Wave 1 ({wave1.length})</FilterBtn>
        <FilterBtn active={filterWave === 2} onClick={() => setFilterWave(filterWave === 2 ? null : 2)} color="#3b82f6">🔵 Wave 2 ({wave2.length})</FilterBtn>
        <FilterBtn active={filterWave === 3} onClick={() => setFilterWave(filterWave === 3 ? null : 3)} color="#d4af37">🟡 Wave 3 ({wave3.length})</FilterBtn>
      </div>
      <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", fontSize: "12px", color: "#93c5fd", display: "flex", alignItems: "center", gap: "6px" }}>
        <Zap size={12} />Portal opens ~<strong>March 23, 2026</strong>. Wave 1 contacts go out Day 1. Contact Status column is yours to fill.
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
              {player.nilTier && <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", background: nilStyle.bg, border: `1px solid ${nilStyle.color}40`, fontSize: "11px", fontWeight: 700, color: nilStyle.color, marginBottom: "8px" }}>💰 {player.nilTier}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", marginBottom: "8px" }}>
                <Shield size={12} color="#6b7280" />
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Contact Status:</span>
                <span style={{ color: player.contactStatus ? "#10b981" : "#4b5563", fontStyle: player.contactStatus ? "normal" : "italic" }}>{player.contactStatus || "—  (fill when portal opens)"}</span>
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
      <StatBlock icon={<Clock size={14} color={portalOpen ? "#7c3aed" : "#d4af37"} />} label={portalOpen ? "Portal OPEN" : "Portal Opens"} value={portalOpen ? "NOW" : `${daysUntilPortal}d`} valueColor={portalOpen ? "#7c3aed" : "#d4af37"} sub="Mar 23, 2026" />
      <StatBlock icon={<Target size={14} color="#3b82f6" />} label="Wave 1 Strikes" value="6" valueColor="#3b82f6" sub="Day 1 contacts" />
    </div>
  );
}

// ─── MAIN WAR ROOM COMPONENT ──────────────────────────────────────────────────

export function WarRoom({ isMobile }: { isMobile: boolean }) {
  const [activeView, setActiveView] = useState<"bigboard" | "rankings" | "roster" | "budget" | "connections" | "strikelist">("bigboard");
  const [syncTrigger, setSyncTrigger] = useState(Date.now());
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  const [syncTimerLabel, setSyncTimerLabel] = useState("just now");

  // Update "X ago" label every 30s
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
    // Give a moment for the spinner to show
    await new Promise(r => setTimeout(r, 500));
    setSyncing(false);
  };

  const views = [
    { id: "bigboard" as const, label: "Portal Big Board", icon: TrendingUp },
    { id: "rankings" as const, label: "Norman's Rankings", icon: Star },
    { id: "roster" as const, label: "Roster Builder", icon: Users },
    { id: "budget" as const, label: "💰 Budget Builder", icon: DollarSign },
    { id: "connections" as const, label: "Coaching Connections", icon: Zap },
    { id: "strikelist" as const, label: "⚡ Strike List", icon: Crosshair },
  ];

  const tabAccent: Record<string, { active: string; border: string; bg: string }> = {
    bigboard: { active: "#60a5fa", border: "rgba(59,130,246,0.4)", bg: "rgba(59,130,246,0.12)" },
    rankings: { active: "#a78bfa", border: "rgba(139,92,246,0.4)", bg: "rgba(139,92,246,0.12)" },
    roster: { active: "#34d399", border: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.12)" },
    budget: { active: "#10b981", border: "rgba(16,185,129,0.4)", bg: "rgba(16,185,129,0.12)" },
    connections: { active: "#d4af37", border: "rgba(212,175,55,0.4)", bg: "rgba(212,175,55,0.10)" },
    strikelist: { active: "#a78bfa", border: "rgba(124,58,237,0.45)", bg: "rgba(124,58,237,0.10)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* War Room header with Sync Now button */}
      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.05))", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <LayoutGrid size={20} color="#3b82f6" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6" }}>Live War Room</div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            Real-time data from Google Sheets · Portal Big Board · Norman&apos;s Rankings · Strike List (Wave 1–3)
          </div>
        </div>
        {/* Last synced + Sync Now */}
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
              style={{ padding: isMobile ? "8px 14px" : "10px 20px", borderRadius: "8px", border: isActive ? `1px solid ${accent.border}` : "1px solid rgba(255,255,255,0.1)", background: isActive ? accent.bg : "rgba(255,255,255,0.03)", color: isActive ? accent.active : "rgba(255,255,255,0.6)", fontSize: isMobile ? "12px" : "13px", fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {/* View content */}
      <div>
        {activeView === "bigboard" && <PortalBigBoard isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "rankings" && <NormansRankings isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "roster" && <RosterBuilder isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "budget" && <BudgetRosterBuilder isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "connections" && <CoachingConnections isMobile={isMobile} syncTrigger={syncTrigger} />}
        {activeView === "strikelist" && <StrikeList isMobile={isMobile} syncTrigger={syncTrigger} />}
      </div>
    </div>
  );
}
