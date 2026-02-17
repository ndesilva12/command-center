"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  LayoutGrid,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Star,
  Zap,
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

// ─── Color helpers ────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  T1: {
    bg: "rgba(16, 185, 129, 0.07)",
    border: "rgba(16, 185, 129, 0.4)",
    text: "#10b981",
    badge: "rgba(16, 185, 129, 0.15)",
  },
  T2: {
    bg: "rgba(59, 130, 246, 0.07)",
    border: "rgba(59, 130, 246, 0.4)",
    text: "#3b82f6",
    badge: "rgba(59, 130, 246, 0.15)",
  },
  T3: {
    bg: "rgba(245, 158, 11, 0.07)",
    border: "rgba(245, 158, 11, 0.4)",
    text: "#f59e0b",
    badge: "rgba(245, 158, 11, 0.15)",
  },
  T4: {
    bg: "rgba(107, 114, 128, 0.07)",
    border: "rgba(107, 114, 128, 0.3)",
    text: "#9ca3af",
    badge: "rgba(107, 114, 128, 0.12)",
  },
  "T4-RF": {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.5)",
    text: "#ef4444",
    badge: "rgba(239, 68, 68, 0.2)",
  },
  NR: {
    bg: "rgba(75, 85, 99, 0.05)",
    border: "rgba(75, 85, 99, 0.2)",
    text: "#6b7280",
    badge: "rgba(75, 85, 99, 0.1)",
  },
};

function getTierStyle(tier: string) {
  // Normalize T4-RF variants
  if (tier.includes("RF")) return TIER_COLORS["T4-RF"];
  if (tier.startsWith("T1")) return TIER_COLORS.T1;
  if (tier.startsWith("T2")) return TIER_COLORS.T2;
  if (tier.startsWith("T3")) return TIER_COLORS.T3;
  if (tier.startsWith("T4")) return TIER_COLORS.T4;
  return TIER_COLORS.NR;
}

function getRiskStyle(risk: "low" | "moderate" | "high") {
  if (risk === "high")
    return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", dot: "#ef4444" };
  if (risk === "moderate")
    return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", dot: "#f59e0b" };
  return { color: "#10b981", bg: "rgba(16,185,129,0.12)", dot: "#10b981" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        gap: "12px",
      }}
    >
      <RefreshCw
        size={20}
        style={{ animation: "spin 1s linear infinite", color: "#3b82f6" }}
      />
      <span style={{ color: "#9ca3af", fontSize: "14px" }}>
        Fetching live data from Google Sheets…
      </span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "10px",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.3)",
        color: "#ef4444",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <AlertTriangle size={16} />
      {message}
    </div>
  );
}

// ─── VIEW 1: PORTAL BIG BOARD ─────────────────────────────────────────────────

function PortalBigBoard({ isMobile }: { isMobile: boolean }) {
  const [players, setPlayers] = useState<BigBoardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [filterConfTier, setFilterConfTier] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [sortKey, setSortKey] = useState<"grade" | "cin" | "netrtg">("grade");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/cinderella/big-board")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlayers(data);
        setLastFetched(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (filterPos && p.Position !== filterPos) return false;
      if (filterConfTier && p["Conf Tier"] !== filterConfTier) return false;
      if (filterTier) {
        if (filterTier === "T1" && !p.Tier.startsWith("T1")) return false;
        if (filterTier === "T2" && !p.Tier.startsWith("T2")) return false;
        if (filterTier === "T3" && !p.Tier.startsWith("T3")) return false;
      }
      return true;
    });
  }, [players, filterPos, filterConfTier, filterTier]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "grade") return parseFloat(b["Grade (20-80)"] || "0") - parseFloat(a["Grade (20-80)"] || "0");
      if (sortKey === "cin") return parseFloat(b["Cin. Score"] || "0") - parseFloat(a["Cin. Score"] || "0");
      if (sortKey === "netrtg") return parseFloat(b["Net Adj.Rtg"] || "0") - parseFloat(a["Net Adj.Rtg"] || "0");
      return 0;
    });
  }, [filtered, sortKey]);

  const confTiers = useMemo(() => [...new Set(players.map((p) => p["Conf Tier"]).filter(Boolean))].sort(), [players]);
  const positions = useMemo(() => [...new Set(players.map((p) => p.Position).filter(Boolean))].sort(), [players]);

  const FilterBtn = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        border: active ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)",
        color: active ? "#60a5fa" : "#9ca3af",
        fontSize: "12px",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          📊 <strong style={{ color: "#e5e7eb" }}>{players.length}</strong> players tracked
          {" · "}
          <strong style={{ color: "#10b981" }}>
            {players.filter((p) => p.Tier === "T1").length} T1
          </strong>
          {" · "}
          <strong style={{ color: "#3b82f6" }}>
            {players.filter((p) => p.Tier === "T2").length} T2
          </strong>
          {" · "}
          <strong style={{ color: "#f59e0b" }}>
            {players.filter((p) => p.Tier === "T3").length} T3
          </strong>
        </span>
        {lastFetched && (
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>
            Last fetched: {lastFetched.toLocaleTimeString()} · 15-min cache
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Position */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>POS</span>
          <FilterBtn active={filterPos === ""} onClick={() => setFilterPos("")}>All</FilterBtn>
          {positions.map((p) => (
            <FilterBtn key={p} active={filterPos === p} onClick={() => setFilterPos(p === filterPos ? "" : p)}>
              {p}
            </FilterBtn>
          ))}
        </div>

        {/* Conference Tier */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>CONF</span>
          <FilterBtn active={filterConfTier === ""} onClick={() => setFilterConfTier("")}>All</FilterBtn>
          {confTiers.map((c) => (
            <FilterBtn key={c} active={filterConfTier === c} onClick={() => setFilterConfTier(c === filterConfTier ? "" : c)}>
              {c}
            </FilterBtn>
          ))}
        </div>

        {/* Tier */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>TIER</span>
          <FilterBtn active={filterTier === ""} onClick={() => setFilterTier("")}>All</FilterBtn>
          {["T1", "T2", "T3"].map((t) => (
            <FilterBtn key={t} active={filterTier === t} onClick={() => setFilterTier(t === filterTier ? "" : t)}>
              {t}
            </FilterBtn>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>SORT</span>
          {([["grade", "Grade"], ["cin", "Cin. Score"], ["netrtg", "Net Adj.Rtg"]] as const).map(([key, label]) => (
            <FilterBtn key={key} active={sortKey === key} onClick={() => setSortKey(key)}>
              {label} {sortKey === key ? "↓" : ""}
            </FilterBtn>
          ))}
        </div>
      </div>

      {/* Showing count */}
      <div style={{ fontSize: "12px", color: "#6b7280" }}>
        Showing <strong style={{ color: "#e5e7eb" }}>{sorted.length}</strong> of {players.length} players
      </div>

      {/* Player cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(380px, 1fr))",
          gap: "10px",
        }}
      >
        {sorted.map((player, i) => {
          const tierStyle = getTierStyle(player.Tier);
          const grade = parseFloat(player["Grade (20-80)"] || "0");
          const cinScore = parseFloat(player["Cin. Score"] || "0");
          const netRtg = parseFloat(player["Net Adj.Rtg"] || "0");
          const hasFlag = player["Team Impact Flag"] && player["Team Impact Flag"].trim() !== "";

          return (
            <div
              key={i}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background: tierStyle.bg,
                border: `1px solid ${tierStyle.border}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Tier accent */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "3px",
                  background: tierStyle.text,
                  borderRadius: "12px 0 0 12px",
                }}
              />

              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#f3f4f6",
                      }}
                    >
                      {player.Player}
                    </span>
                    {/* Tier badge */}
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: tierStyle.badge,
                        color: tierStyle.text,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {player.Tier}
                    </span>
                    {/* Red Flag warning */}
                    {player.Tier.includes("RF") && (
                      <AlertTriangle size={13} color="#ef4444" />
                    )}
                  </div>
                  <div
                    style={{ fontSize: "12px", color: "#9ca3af", display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <span>{player["Current School"]}</span>
                    <span>·</span>
                    <span>{player.Position}</span>
                    <span>·</span>
                    <span>{player.Class}</span>
                    <span>·</span>
                    <span style={{ color: "#6b7280" }}>{player.Conference}</span>
                  </div>
                </div>

                {/* Grade bubble */}
                <div
                  style={{
                    minWidth: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background:
                      grade >= 70
                        ? "rgba(16,185,129,0.15)"
                        : grade >= 55
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(107,114,128,0.15)",
                    border: `2px solid ${
                      grade >= 70
                        ? "rgba(16,185,129,0.5)"
                        : grade >= 55
                        ? "rgba(59,130,246,0.5)"
                        : "rgba(107,114,128,0.3)"
                    }`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color:
                        grade >= 70
                          ? "#10b981"
                          : grade >= 55
                          ? "#60a5fa"
                          : "#9ca3af",
                      lineHeight: 1,
                    }}
                  >
                    {player["Grade (20-80)"] || "—"}
                  </span>
                  <span style={{ fontSize: "9px", color: "#6b7280", marginTop: "1px" }}>
                    GRADE
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <StatPill label="Cin.Score" value={cinScore ? cinScore.toFixed(1) : "—"} highlight={cinScore > 85} />
                <StatPill
                  label="Net Adj.Rtg"
                  value={player["Net Adj.Rtg"] ? `+${netRtg > 0 ? "" : ""}${player["Net Adj.Rtg"]}` : "—"}
                  highlight={netRtg > 5}
                />
                <StatPill label="PPG" value={player.PPG || "—"} />
                <StatPill label="APG" value={player.APG || "—"} />
                <StatPill label="3P%" value={player["3P%"] ? `${player["3P%"]}%` : "—"} />
              </div>

              {/* Team Impact Flag */}
              {hasFlag && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    fontSize: "11px",
                    color: "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  <Zap size={10} />
                  {player["Team Impact Flag"]}
                </div>
              )}

              {/* Role fit */}
              {player["Role Fit"] && (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  Role: {player["Role Fit"]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: highlight ? "#10b981" : "#d1d5db",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── VIEW 2: NORMAN'S RANKINGS ────────────────────────────────────────────────

function NormansRankings({ isMobile }: { isMobile: boolean }) {
  const [guards, setGuards] = useState<RankingPlayer[]>([]);
  const [forwards, setForwards] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cinderella/rankings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setGuards(data.guards || []);
        setForwards(data.forwards || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SectionGroup title="🏀 Guards" players={guards} isMobile={isMobile} />
      <SectionGroup title="💪 Forwards / Bigs" players={forwards} isMobile={isMobile} />
    </div>
  );
}

function SectionGroup({
  title,
  players,
  isMobile,
}: {
  title: string;
  players: RankingPlayer[];
  isMobile: boolean;
}) {
  const tiers = ["T1", "T2", "T3", "T4", "T4-RF", "NR"];

  return (
    <div>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#f3f4f6",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {title}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {tiers.map((tier) => {
          const group = players.filter((p) => p.tier === tier);
          if (group.length === 0) return null;
          const tierStyle = getTierStyle(tier);

          return (
            <div key={tier}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: tierStyle.text,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: tierStyle.text,
                    letterSpacing: "0.08em",
                  }}
                >
                  {tier}
                  {tier === "T1"
                    ? " — Starters"
                    : tier === "T2"
                    ? " — Key Rotation"
                    : tier === "T3"
                    ? " — Solid Contributors"
                    : tier === "T4-RF"
                    ? " — RED FLAGS"
                    : tier === "T4"
                    ? " — Depth"
                    : " — Not Ranked"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: "8px",
                }}
              >
                {group.map((player, i) => (
                  <RankingCard key={i} player={player} tierStyle={tierStyle} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingCard({
  player,
  tierStyle,
}: {
  player: RankingPlayer;
  tierStyle: { bg: string; border: string; text: string; badge: string };
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "10px",
        background: player.isRedFlag ? "rgba(239,68,68,0.08)" : tierStyle.bg,
        border: `1px solid ${player.isRedFlag ? "rgba(239,68,68,0.4)" : tierStyle.border}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: player.isRedFlag ? "#ef4444" : tierStyle.text,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: player.scoutNotes ? "8px" : "0",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "2px",
            }}
          >
            {player.isRedFlag && <AlertTriangle size={13} color="#ef4444" />}
            <span style={{ fontSize: "14px", fontWeight: 700, color: player.isRedFlag ? "#fca5a5" : "#f3f4f6" }}>
              {player.name}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", gap: "6px" }}>
            <span>{player.school}</span>
            <span>·</span>
            <span>{player.pos}</span>
            <span>·</span>
            <span>{player.yr}</span>
            {player.exercise && (
              <>
                <span>·</span>
                <span style={{ color: "#6b7280" }}>{player.exercise}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <span
            style={{
              padding: "2px 7px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: 700,
              background: tierStyle.badge,
              color: tierStyle.text,
            }}
          >
            {player.tier}
          </span>
          {player.bestBatchRank && (
            <span style={{ fontSize: "10px", color: "#6b7280" }}>
              #{player.bestBatchRank}
            </span>
          )}
        </div>
      </div>

      {player.scoutNotes && (
        <div
          style={{
            fontSize: "12px",
            color: player.isRedFlag ? "#fca5a5" : "#9ca3af",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          "{player.scoutNotes}"
        </div>
      )}
    </div>
  );
}

// ─── VIEW 3: ROSTER BUILDER ───────────────────────────────────────────────────

function RosterBuilder({ isMobile }: { isMobile: boolean }) {
  const [configs, setConfigs] = useState<RosterConfig[]>([]);
  const [strikeOrder, setStrikeOrder] = useState<StrikeTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cinderella/roster")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConfigs(data.configs || []);
        setStrikeOrder(data.strikeOrder || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Config cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        {configs.map((config) => (
          <RosterConfigCard key={config.name} config={config} />
        ))}
      </div>

      {/* Strike Order */}
      {strikeOrder.length > 0 && (
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#ef4444",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Zap size={16} />
            PORTAL STRIKE ORDER — Opens ~March 23, 2026
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {strikeOrder.map((target, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: i === 0 || i === 1 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.1)",
                    color: i === 0 || i === 1 ? "#ef4444" : "#f59e0b",
                    fontSize: "11px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {target.priority}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#f3f4f6",
                      marginBottom: "2px",
                    }}
                  >
                    {target.player}{" "}
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                      ({target.school})
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af" }}>{target.reason}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                  <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>
                    {target.nilEst}
                  </span>
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

const POS_LABELS: Record<string, string> = {
  PG: "PG",
  SG: "SG",
  SF: "SF",
  PF: "PF",
  C: "C",
};

function RosterConfigCard({ config }: { config: RosterConfig }) {
  const configColors: Record<string, { accent: string; header: string }> = {
    "Config A": { accent: "#10b981", header: "rgba(16,185,129,0.1)" },
    "Config B": { accent: "#3b82f6", header: "rgba(59,130,246,0.1)" },
    "Config C": { accent: "#8b5cf6", header: "rgba(139,92,246,0.1)" },
  };
  const cc = configColors[config.name] || { accent: "#6b7280", header: "rgba(107,114,128,0.1)" };

  return (
    <div
      style={{
        borderRadius: "12px",
        border: `1px solid ${cc.accent}40`,
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          background: cc.header,
          borderBottom: `1px solid ${cc.accent}30`,
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: cc.accent,
            letterSpacing: "0.05em",
            marginBottom: "4px",
          }}
        >
          {config.name.toUpperCase()}
        </div>
        <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.4 }}>
          {config.scenario}
        </div>
        {config.championshipProb && (
          <div
            style={{
              marginTop: "8px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.05)",
              fontSize: "11px",
              color: "#d1d5db",
            }}
          >
            🏆 {config.championshipProb}
          </div>
        )}
      </div>

      {/* Starters */}
      <div style={{ padding: "12px 14px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#6b7280",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          STARTING FIVE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {config.starters.slice(0, 5).map((p, i) => (
            <RosterPlayerRow key={i} player={p} accent={cc.accent} />
          ))}
        </div>

        {config.bench.length > 0 && (
          <>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.1em",
                marginTop: "12px",
                marginBottom: "8px",
              }}
            >
              BENCH
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {config.bench.map((p, i) => (
                <RosterPlayerRow key={i} player={p} accent={cc.accent} isBench />
              ))}
            </div>
          </>
        )}

        {config.portalReality && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px 10px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "11px",
              color: "#9ca3af",
            }}
          >
            ⚠️ {config.portalReality}
          </div>
        )}
      </div>
    </div>
  );
}

function RosterPlayerRow({
  player,
  accent,
  isBench,
}: {
  player: RosterPlayer;
  accent: string;
  isBench?: boolean;
}) {
  const risk = getRiskStyle(player.portalRiskLevel);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 8px",
        borderRadius: "7px",
        background: isBench ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        opacity: isBench ? 0.85 : 1,
      }}
    >
      {/* POS badge */}
      <span
        style={{
          minWidth: "28px",
          padding: "2px 5px",
          borderRadius: "5px",
          fontSize: "10px",
          fontWeight: 700,
          textAlign: "center",
          background: `${accent}20`,
          color: accent,
        }}
      >
        {player.benchSlot || player.pos}
      </span>

      {/* Name + school */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#e5e7eb",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
        </div>
        <div style={{ fontSize: "10px", color: "#6b7280" }}>
          {player.school} · {player.yr}
        </div>
      </div>

      {/* Risk dot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: risk.dot,
          }}
        />
        <span style={{ fontSize: "9px", color: risk.color, fontWeight: 600 }}>
          {player.portalRiskLevel.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// ─── MAIN WAR ROOM COMPONENT ──────────────────────────────────────────────────

export function WarRoom({ isMobile }: { isMobile: boolean }) {
  const [activeView, setActiveView] = useState<"bigboard" | "rankings" | "roster">("bigboard");

  const views = [
    { id: "bigboard" as const, label: "Portal Big Board", icon: TrendingUp },
    { id: "rankings" as const, label: "Norman's Rankings", icon: Star },
    { id: "roster" as const, label: "Roster Builder", icon: Users },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* War Room header */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.05))",
          border: "1px solid rgba(59,130,246,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <LayoutGrid size={20} color="#3b82f6" />
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6" }}>
            Live War Room
          </div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            Real-time data from Google Sheets · Portal Big Board (148 players) · Norman's Rankings (48) · 3 Configs
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {views.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            style={{
              padding: isMobile ? "8px 14px" : "10px 20px",
              borderRadius: "8px",
              border:
                activeView === id
                  ? "1px solid rgba(59,130,246,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
              background:
                activeView === id
                  ? "rgba(59,130,246,0.12)"
                  : "rgba(255,255,255,0.03)",
              color: activeView === id ? "#60a5fa" : "rgba(255,255,255,0.6)",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: activeView === id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* View content */}
      <div>
        {activeView === "bigboard" && <PortalBigBoard isMobile={isMobile} />}
        {activeView === "rankings" && <NormansRankings isMobile={isMobile} />}
        {activeView === "roster" && <RosterBuilder isMobile={isMobile} />}
      </div>
    </div>
  );
}
