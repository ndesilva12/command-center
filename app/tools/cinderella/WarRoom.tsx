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
  Target,
  Clock,
  Crosshair,
  Shield,
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

interface WarRoomStats {
  totalPlayers: number;
  t1Count: number;
  t2Count: number;
  t3Count: number;
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
  const [filterConfCheck, setFilterConfCheck] = useState("");
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
            {players.filter((p) => p.Tier.includes("T1") && !p.Tier.includes("RF")).length} T1
          </strong>
          {" · "}
          <strong style={{ color: "#3b82f6" }}>
            {players.filter((p) => p.Tier.includes("T2") && !p.Tier.includes("RF")).length} T2
          </strong>
          {" · "}
          <strong style={{ color: "#f59e0b" }}>
            {players.filter((p) => p.Tier.includes("T3") && !p.Tier.includes("RF")).length} T3
          </strong>
          {(() => {
            const unverified = players.filter((p) => p["Net Adj.Rtg"].toLowerCase().includes("est.")).length;
            return unverified > 0 ? (
              <>
                {" · "}
                <strong style={{ color: "#f59e0b" }} title="Players with estimated (unverified) Net Adj Rtg">
                  ~{unverified} unverified
                </strong>
              </>
            ) : null;
          })()}
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

        {/* Conference Check */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "42px", fontWeight: 600 }}>CONF✓</span>
          <FilterBtn active={filterConfCheck === ""} onClick={() => setFilterConfCheck("")}>All</FilterBtn>
          {["P6", "High-Major", "Mid-Major", "Low-Major"].map((c) => (
            <FilterBtn key={c} active={filterConfCheck === c} onClick={() => setFilterConfCheck(c === filterConfCheck ? "" : c)}>
              {c}
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
          const netRtgRaw = player["Net Adj.Rtg"] || "";
          const netRtgIsEst = netRtgRaw.toLowerCase().includes("est.");
          const netRtg = parseFloat(netRtgRaw.replace(/est\.\s*/i, "") || "0");
          const cinScoreV2 = parseFloat(player["Cin Score v2"] || "0");
          const cinV2Downgraded = !isNaN(cinScore) && !isNaN(cinScoreV2) && cinScoreV2 > 0 && (cinScore - cinScoreV2) > 5;
          const hasFlag = player["Team Impact Flag"] && player["Team Impact Flag"].trim() !== "";
          const flightRisk = parseFloat(player["Flight Risk Score"] || "0");
          const hasFlightRisk = !isNaN(flightRisk) && flightRisk > 0;
          const flightRiskColor = flightRisk >= 7 ? "#ef4444" : flightRisk >= 5 ? "#f59e0b" : "#10b981";
          const flightRiskBg = flightRisk >= 7 ? "rgba(239,68,68,0.12)" : flightRisk >= 5 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)";

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
                    {/* Walter Clayton Jr. data correction warning */}
                    {player.Player === "Walter Clayton Jr." && (
                      <span
                        title="Net Adj Rtg corrected: was est. +5.8, actual +0.5 — downgraded T1→T2"
                        style={{ cursor: "help", fontSize: "13px", lineHeight: 1 }}
                      >
                        ⚠️
                      </span>
                    )}
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
                {/* Cin Score v2 — reality-check corrected */}
                {player["Cin Score v2"] && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>
                      Cin.Score v2
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: cinV2Downgraded ? "#f59e0b" : "#d1d5db",
                      }}
                    >
                      {cinV2Downgraded && <span style={{ fontSize: "11px", marginRight: "2px" }}>↓</span>}
                      {cinScoreV2 ? cinScoreV2.toFixed(1) : "—"}
                    </span>
                  </div>
                )}
                {/* Net Adj.Rtg with estimated-value indicator */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "1px" }}
                  title={netRtgIsEst ? "Estimated value — not yet verified" : undefined}
                >
                  <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>
                    Net Adj.Rtg
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: netRtgIsEst ? "#f59e0b" : (netRtg > 5 ? "#10b981" : "#d1d5db"),
                      cursor: netRtgIsEst ? "help" : "default",
                    }}
                  >
                    {netRtgRaw ? (
                      netRtgIsEst ? (
                        <>
                          <span style={{ color: "#f59e0b" }}>~</span>
                          {netRtgRaw.replace(/est\.\s*/i, "").trim() || "—"}
                        </>
                      ) : (
                        netRtgRaw
                      )
                    ) : "—"}
                  </span>
                </div>
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

              {/* Flight Risk badge */}
              {hasFlightRisk && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: flightRiskBg,
                    border: `1px solid ${flightRiskColor}40`,
                    fontSize: "11px",
                    color: flightRiskColor,
                    fontWeight: 600,
                    marginTop: hasFlag ? "6px" : "0",
                  }}
                >
                  <div
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: flightRiskColor,
                      flexShrink: 0,
                    }}
                  />
                  Flight Risk: {player["Flight Risk Score"]}
                </div>
              )}

              {/* Conference Check tag */}
              {player["Conference Check"] && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(107,114,128,0.1)",
                    border: "1px solid rgba(107,114,128,0.25)",
                    fontSize: "10px",
                    color: "#9ca3af",
                    fontWeight: 600,
                    marginTop: "4px",
                    marginLeft: hasFlightRisk ? "6px" : "0",
                  }}
                >
                  {player["Conference Check"]}
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
  const [bigMen, setBigMen] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cinderella/rankings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setGuards(data.guards || []);
        setForwards(data.forwards || []);
        setBigMen(data.bigMen || []);
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
      {bigMen.length > 0 && (
        <SectionGroup title="🏗️ Big Men Rankings" players={bigMen} isMobile={isMobile} />
      )}
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

// ─── VIEW 4: COACHING CONNECTIONS ────────────────────────────────────────────

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

function getStrengthStyle(strength: number): { glow: string; border: string; text: string; bg: string } {
  if (strength >= 5) return {
    glow: "0 0 12px rgba(16,185,129,0.35)",
    border: "rgba(16,185,129,0.45)",
    text: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  };
  if (strength === 4) return {
    glow: "0 0 8px rgba(59,130,246,0.25)",
    border: "rgba(59,130,246,0.4)",
    text: "#3b82f6",
    bg: "rgba(59,130,246,0.07)",
  };
  if (strength === 3) return {
    glow: "none",
    border: "rgba(245,158,11,0.35)",
    text: "#f59e0b",
    bg: "rgba(245,158,11,0.07)",
  };
  return {
    glow: "none",
    border: "rgba(107,114,128,0.25)",
    text: "#6b7280",
    bg: "rgba(107,114,128,0.05)",
  };
}

function CoachingConnections({ isMobile }: { isMobile: boolean }) {
  const [connections, setConnections] = useState<CoachingConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/cinderella/connections")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConnections(data);
        setLastFetched(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const order = ["High", "Medium", "Low"];
    const result: Record<string, CoachingConnection[]> = {};
    order.forEach((p) => {
      result[p] = connections.filter((c) =>
        c.priority.toLowerCase() === p.toLowerCase()
      );
    });
    return { order, result };
  }, [connections]);

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
          🤝 <strong style={{ color: "#e5e7eb" }}>{connections.length}</strong> coaching connections
          {" · "}
          <strong style={{ color: "#10b981" }}>
            {connections.filter((c) => c.strength === 5).length} Strength-5
          </strong>
          {" · "}
          <strong style={{ color: "#3b82f6" }}>
            {connections.filter((c) => c.strength === 4).length} Strength-4
          </strong>
          {" · "}
          <strong style={{ color: "#ef4444" }}>
            {connections.filter((c) => c.priority.toLowerCase() === "high").length} High-Priority
          </strong>
        </span>
        {lastFetched && (
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>
            Last fetched: {lastFetched.toLocaleTimeString()} · 15-min cache
          </span>
        )}
      </div>

      {/* Priority groups */}
      {grouped.order.map((priority) => {
        const group = grouped.result[priority];
        if (!group || group.length === 0) return null;

        const priorityColor = priority === "High" ? "#ef4444" : priority === "Medium" ? "#f59e0b" : "#6b7280";
        const priorityBg = priority === "High" ? "rgba(239,68,68,0.08)" : priority === "Medium" ? "rgba(245,158,11,0.06)" : "rgba(107,114,128,0.05)";

        return (
          <div key={priority}>
            {/* Group header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: `1px solid ${priorityColor}30`,
              }}
            >
              <div
                style={{
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: priorityBg,
                  border: `1px solid ${priorityColor}40`,
                  fontSize: "11px",
                  fontWeight: 800,
                  color: priorityColor,
                  letterSpacing: "0.06em",
                }}
              >
                {priority.toUpperCase()} PRIORITY
              </div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                {group.length} connection{group.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Connection cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              {group.map((conn, i) => {
                const ss = getStrengthStyle(conn.strength);
                return (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: ss.bg,
                      border: `1px solid ${ss.border}`,
                      boxShadow: ss.glow,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Strength accent */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "3px",
                        background: ss.text,
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
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>
                            {conn.targetPlayer}
                          </span>
                          {/* Relationship type badge */}
                          {conn.relationshipType && (
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 600,
                                background: "rgba(139,92,246,0.15)",
                                color: "#a78bfa",
                              }}
                            >
                              {conn.relationshipType}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span>{conn.school}</span>
                          {conn.position && <><span>·</span><span>{conn.position}</span></>}
                        </div>
                      </div>

                      {/* Strength bubble */}
                      <div
                        style={{
                          minWidth: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: ss.bg,
                          border: `2px solid ${ss.border}`,
                          boxShadow: ss.glow,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "16px", fontWeight: 800, color: ss.text, lineHeight: 1 }}>
                          {conn.strength}
                        </span>
                        <span style={{ fontSize: "8px", color: "#6b7280", marginTop: "1px" }}>STR</span>
                      </div>
                    </div>

                    {/* Bridge info */}
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        marginBottom: "8px",
                        fontSize: "12px",
                        color: "#9ca3af",
                        lineHeight: 1.5,
                      }}
                    >
                      <div>
                        <strong style={{ color: "#d1d5db" }}>Coach:</strong> {conn.playersCoach}
                        {conn.coachBackground && (
                          <span style={{ color: "#6b7280" }}> — {conn.coachBackground}</span>
                        )}
                      </div>
                      {conn.uicGroverBridge && (
                        <div>
                          <strong style={{ color: "#d1d5db" }}>Bridge:</strong> {conn.uicGroverBridge}
                          {conn.bridgeRole && <span style={{ color: "#6b7280" }}> ({conn.bridgeRole})</span>}
                        </div>
                      )}
                    </div>

                    {/* Actionable step */}
                    {conn.actionableStep && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "6px",
                          padding: "7px 10px",
                          borderRadius: "7px",
                          background: "rgba(59,130,246,0.07)",
                          border: "1px solid rgba(59,130,246,0.2)",
                          fontSize: "11px",
                          color: "#93c5fd",
                          marginBottom: conn.notes ? "6px" : "0",
                        }}
                      >
                        <Zap size={11} style={{ flexShrink: 0, marginTop: "1px" }} />
                        {conn.actionableStep}
                      </div>
                    )}

                    {/* Notes */}
                    {conn.notes && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          fontStyle: "italic",
                          lineHeight: 1.5,
                          marginTop: "4px",
                        }}
                      >
                        {conn.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {connections.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
          No coaching connections found in the sheet.
        </div>
      )}
    </div>
  );
}

// ─── VIEW 5: STRIKE LIST ──────────────────────────────────────────────────────

const WAVE_COLORS = {
  1: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)", text: "#10b981", badge: "rgba(16,185,129,0.15)", label: "WAVE 1" },
  2: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.35)", text: "#3b82f6", badge: "rgba(59,130,246,0.15)", label: "WAVE 2" },
  3: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.35)", text: "#f59e0b", badge: "rgba(245,158,11,0.15)", label: "WAVE 3" },
} as const;

function getWaveStyle(wave: number) {
  return WAVE_COLORS[wave as keyof typeof WAVE_COLORS] || WAVE_COLORS[3];
}

function nilTierColor(nilTier: string): { color: string; bg: string } {
  if (nilTier.includes("ANCHOR")) return { color: "#a78bfa", bg: "rgba(139,92,246,0.12)" };
  if (nilTier.includes("STARTER")) return { color: "#10b981", bg: "rgba(16,185,129,0.10)" };
  if (nilTier.includes("KEY ROTATION")) return { color: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
  if (nilTier.includes("SLEEPER")) return { color: "#f59e0b", bg: "rgba(245,158,11,0.10)" };
  return { color: "#9ca3af", bg: "rgba(107,114,128,0.08)" };
}

function flightRiskColor(risk: string): string {
  const r = parseFloat(risk);
  if (isNaN(r)) return "#6b7280";
  if (r >= 7) return "#ef4444";
  if (r >= 5) return "#f59e0b";
  return "#10b981";
}

function StrikeList({ isMobile }: { isMobile: boolean }) {
  const [players, setPlayers] = useState<StrikeListPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterWave, setFilterWave] = useState<number | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/cinderella/strike-list")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlayers(data);
        setLastFetched(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterWave ? players.filter((p) => p.wave === filterWave) : players;
  const wave1 = players.filter((p) => p.wave === 1);
  const wave2 = players.filter((p) => p.wave === 2);
  const wave3 = players.filter((p) => p.wave === 3);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const FilterBtn = ({
    active,
    onClick,
    children,
    color,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    color?: string;
  }) => (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        border: active ? `1px solid ${color || "#3b82f6"}` : "1px solid rgba(255,255,255,0.12)",
        background: active ? `${color || "#3b82f6"}20` : "rgba(255,255,255,0.04)",
        color: active ? (color || "#60a5fa") : "#9ca3af",
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
          🎯 <strong style={{ color: "#e5e7eb" }}>{players.length}</strong> strike targets
          {" · "}
          <strong style={{ color: "#10b981" }}>{wave1.length} Wave 1</strong>
          {" · "}
          <strong style={{ color: "#3b82f6" }}>{wave2.length} Wave 2</strong>
          {" · "}
          <strong style={{ color: "#f59e0b" }}>{wave3.length} Wave 3</strong>
        </span>
        {lastFetched && (
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>
            Last fetched: {lastFetched.toLocaleTimeString()} · 15-min cache
          </span>
        )}
      </div>

      {/* Wave filter */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, minWidth: "46px" }}>WAVE</span>
        <FilterBtn active={filterWave === null} onClick={() => setFilterWave(null)}>All</FilterBtn>
        <FilterBtn active={filterWave === 1} onClick={() => setFilterWave(filterWave === 1 ? null : 1)} color="#10b981">
          🟢 Wave 1 ({wave1.length})
        </FilterBtn>
        <FilterBtn active={filterWave === 2} onClick={() => setFilterWave(filterWave === 2 ? null : 2)} color="#3b82f6">
          🔵 Wave 2 ({wave2.length})
        </FilterBtn>
        <FilterBtn active={filterWave === 3} onClick={() => setFilterWave(filterWave === 3 ? null : 3)} color="#f59e0b">
          🟡 Wave 3 ({wave3.length})
        </FilterBtn>
      </div>

      {/* Note */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.2)",
          fontSize: "12px",
          color: "#93c5fd",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Zap size={12} />
        Portal opens ~<strong>March 23, 2026</strong>. Wave 1 contacts go out Day 1. Contact Status column is yours to fill.
      </div>

      {/* Player cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))",
          gap: "12px",
        }}
      >
        {filtered.map((player, i) => {
          const waveStyle = getWaveStyle(player.wave);
          const nilStyle = nilTierColor(player.nilTier);
          const fRiskColor = flightRiskColor(player.flightRisk);
          const grade = parseFloat(player.grade);
          const cin = parseFloat(player.cinScore);

          return (
            <div
              key={i}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: waveStyle.bg,
                border: `1px solid ${waveStyle.border}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Wave accent bar */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  background: waveStyle.text,
                  borderRadius: "12px 0 0 12px",
                }}
              />

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    {/* Wave badge */}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: 800,
                        background: waveStyle.badge,
                        color: waveStyle.text,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {waveStyle.label}
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>
                      {player.player}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span>{player.school}</span>
                    {player.pos && <><span>·</span><span>{player.pos}</span></>}
                    {player.cls && <><span>·</span><span>{player.cls}</span></>}
                  </div>
                </div>

                {/* Grade bubble */}
                {player.grade && !isNaN(grade) && (
                  <div
                    style={{
                      minWidth: "46px",
                      height: "46px",
                      borderRadius: "50%",
                      background: grade >= 70 ? "rgba(16,185,129,0.15)" : grade >= 55 ? "rgba(59,130,246,0.15)" : "rgba(107,114,128,0.15)",
                      border: `2px solid ${grade >= 70 ? "rgba(16,185,129,0.5)" : grade >= 55 ? "rgba(59,130,246,0.5)" : "rgba(107,114,128,0.3)"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "15px", fontWeight: 800, color: grade >= 70 ? "#10b981" : grade >= 55 ? "#60a5fa" : "#9ca3af", lineHeight: 1 }}>
                      {player.grade}
                    </span>
                    <span style={{ fontSize: "8px", color: "#6b7280", marginTop: "1px" }}>GRD</span>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {player.cinScore && (
                  <StatPill label="Cin.Score" value={cin ? cin.toFixed(1) : player.cinScore} highlight={cin > 85} />
                )}
                {player.onOff && <StatPill label="Net Adj.Rtg" value={player.onOff} />}
                {player.flightRisk && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>FLIGHT RISK</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: fRiskColor }}>{player.flightRisk}</span>
                  </div>
                )}
                {player.confCheck && <StatPill label="CONF" value={player.confCheck} />}
              </div>

              {/* NIL Tier */}
              {player.nilTier && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: nilStyle.bg,
                    border: `1px solid ${nilStyle.color}40`,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: nilStyle.color,
                    marginBottom: "8px",
                  }}
                >
                  💰 {player.nilTier}
                </div>
              )}

              {/* Contact Status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "12px",
                  marginBottom: "8px",
                }}
              >
                <Shield size={12} color="#6b7280" />
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Contact Status:</span>
                <span style={{ color: player.contactStatus ? "#10b981" : "#4b5563", fontStyle: player.contactStatus ? "normal" : "italic" }}>
                  {player.contactStatus || "—  (fill when portal opens)"}
                </span>
              </div>

              {/* Scouting Rationale */}
              {player.whyWeWantHim && (
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: "7px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontSize: "11px",
                    color: "#9ca3af",
                    lineHeight: 1.6,
                    fontStyle: "italic",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "#6b7280", fontStyle: "normal", fontWeight: 600 }}>Why: </span>
                  {player.whyWeWantHim}
                </div>
              )}

              {/* Coaching Connection */}
              {player.coachingConnection && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                    padding: "6px 10px",
                    borderRadius: "7px",
                    background: "rgba(139,92,246,0.06)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    fontSize: "11px",
                    color: "#c4b5fd",
                    lineHeight: 1.5,
                  }}
                >
                  <Users size={11} style={{ flexShrink: 0, marginTop: "1px" }} />
                  {player.coachingConnection}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
          No strike targets found.
        </div>
      )}
    </div>
  );
}

// ─── MAIN WAR ROOM COMPONENT ──────────────────────────────────────────────────

// ─── Quick Stats Bar ──────────────────────────────────────────────────────────

function QuickStatsBar() {
  const [stats, setStats] = useState<WarRoomStats | null>(null);

  // Countdown to March 23, 2026
  const portalOpensDate = new Date("2026-03-23T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilPortal = Math.ceil(
    (portalOpensDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const portalOpen = daysUntilPortal <= 0;

  // Fetch lightweight stats from big-board (cached)
  useEffect(() => {
    fetch("/api/cinderella/big-board")
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
      .catch(() => null); // silently fail — stats are non-critical
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: "0",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Stat: Total Players */}
      <StatBlock
        icon={<Users size={14} color="#9ca3af" />}
        label="Players Tracked"
        value={stats ? String(stats.totalPlayers) : "158"}
        valueColor="#e5e7eb"
      />

      {/* Stat: T1 Players */}
      <StatBlock
        icon={<Star size={14} color="#10b981" />}
        label="T1 Targets"
        value={stats ? String(stats.t1Count) : "—"}
        valueColor="#10b981"
      />

      {/* Stat: Portal Countdown */}
      <StatBlock
        icon={<Clock size={14} color={portalOpen ? "#ef4444" : "#f59e0b"} />}
        label={portalOpen ? "Portal OPEN" : "Portal Opens"}
        value={portalOpen ? "NOW" : `${daysUntilPortal}d`}
        valueColor={portalOpen ? "#ef4444" : "#f59e0b"}
        sub="Mar 23, 2026"
      />

      {/* Stat: Wave 1 Targets */}
      <StatBlock
        icon={<Target size={14} color="#3b82f6" />}
        label="Wave 1 Strikes"
        value="6"
        valueColor="#3b82f6"
        sub="Day 1 contacts"
      />
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  valueColor,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {icon}
        <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>
          {label.toUpperCase()}
        </span>
      </div>
      <span style={{ fontSize: "20px", fontWeight: 800, color: valueColor, lineHeight: 1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: "9px", color: "#4b5563" }}>{sub}</span>}
    </div>
  );
}

// ─── Main WarRoom ─────────────────────────────────────────────────────────────

export function WarRoom({ isMobile }: { isMobile: boolean }) {
  const [activeView, setActiveView] = useState<
    "bigboard" | "rankings" | "roster" | "connections" | "strikelist"
  >("bigboard");

  const views = [
    { id: "bigboard" as const, label: "Portal Big Board", icon: TrendingUp },
    { id: "rankings" as const, label: "Norman's Rankings", icon: Star },
    { id: "roster" as const, label: "Roster Builder", icon: Users },
    { id: "connections" as const, label: "Coaching Connections", icon: Zap },
    { id: "strikelist" as const, label: "⚡ Strike List", icon: Crosshair },
  ];

  // Tab accent color per view
  const tabAccent: Record<string, { active: string; border: string; bg: string }> = {
    bigboard: { active: "#60a5fa", border: "rgba(59,130,246,0.4)", bg: "rgba(59,130,246,0.12)" },
    rankings: { active: "#a78bfa", border: "rgba(139,92,246,0.4)", bg: "rgba(139,92,246,0.12)" },
    roster: { active: "#34d399", border: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.12)" },
    connections: { active: "#fbbf24", border: "rgba(251,191,36,0.4)", bg: "rgba(251,191,36,0.10)" },
    strikelist: { active: "#f87171", border: "rgba(239,68,68,0.45)", bg: "rgba(239,68,68,0.10)" },
  };

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
            Real-time data from Google Sheets · Portal Big Board (158 players, 31 cols) · Norman&apos;s Rankings · Strike List (Wave 1–3)
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <QuickStatsBar />

      {/* View tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {views.map(({ id, label, icon: Icon }) => {
          const accent = tabAccent[id];
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{
                padding: isMobile ? "8px 14px" : "10px 20px",
                borderRadius: "8px",
                border: isActive ? `1px solid ${accent.border}` : "1px solid rgba(255,255,255,0.1)",
                background: isActive ? accent.bg : "rgba(255,255,255,0.03)",
                color: isActive ? accent.active : "rgba(255,255,255,0.6)",
                fontSize: isMobile ? "12px" : "13px",
                fontWeight: isActive ? 600 : 400,
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
          );
        })}
      </div>

      {/* View content */}
      <div>
        {activeView === "bigboard" && <PortalBigBoard isMobile={isMobile} />}
        {activeView === "rankings" && <NormansRankings isMobile={isMobile} />}
        {activeView === "roster" && <RosterBuilder isMobile={isMobile} />}
        {activeView === "connections" && <CoachingConnections isMobile={isMobile} />}
        {activeView === "strikelist" && <StrikeList isMobile={isMobile} />}
      </div>
    </div>
  );
}
