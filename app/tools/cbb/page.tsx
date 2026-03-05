"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, RefreshCw, Calendar, TrendingUp, Target, Loader2, Pencil, Check, X } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface Pattern {
  id: string;
  name: string;
  row: number;
  color: string;
  wins: number;
  losses: number;
  winPct: number;
  roi: number;
  sample: number;
}

interface Game {
  id: number;
  row: number;  // Actual sheet row number for editing
  team: string;
  spread: number;
  model: number;
  net: number;
  rankDiff: number;
  avgRank: number;
  offRank: number;
  defRank: number;
  netRating: number;
  oppNetRating: number;
  final: string;
  finalScore: string;
  margin: number;
  ats: string;
  date: string;
  matchingPatterns?: string[];
}

interface CBBData {
  patterns: Pattern[];
  games: Game[];
  yesterdayGames: Game[];
  todayGames: Game[];
  tomorrowGames: Game[];
  criteria: any;
  yesterdayStr: string;
  todayStr: string;
  tomorrowStr: string;
}

// Pattern numbers for display
const PATTERN_NUMBERS: Record<string, string> = {
  rank_diff: '1',
  pattern_1: '2',
  pattern_2: '3',
  pattern_3: '4',
  pattern_4: '5',
  pattern_5: '6',
  pattern_6: '7',
  pattern_8: '8',
  pattern_9: '9',
  pattern_10: '10',
};

// Highlight colors - lime green for #1 (rank_diff), tool green for others
const HIGHLIGHT_COLORS = {
  rankDiff: 'rgba(132, 204, 22, 0.25)',  // Bright lime green for #1
  standard: 'rgba(34, 197, 94, 0.2)',     // Tool green for others
};

export default function CBBPage() {
  return (
    <ProtectedRoute>
      <CBBContent />
    </ProtectedRoute>
  );
}

function CBBContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('cbb', 'CBB Value Plays', '#22c55e');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'yesterday' | 'today' | 'tomorrow'>('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState<CBBData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncOutput, setSyncOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/cbb?action=data');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      
      // Add pattern matching to games
      const gamesWithPatterns = addPatternMatching(result.games, result.criteria);
      const yesterdayWithPatterns = addPatternMatching(result.yesterdayGames, result.criteria);
      const todayWithPatterns = addPatternMatching(result.todayGames, result.criteria);
      const tomorrowWithPatterns = addPatternMatching(result.tomorrowGames, result.criteria);
      
      setData({
        ...result,
        games: gamesWithPatterns,
        yesterdayGames: yesterdayWithPatterns,
        todayGames: todayWithPatterns,
        tomorrowGames: tomorrowWithPatterns,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runSync = async () => {
    try {
      setSyncing(true);
      setSyncOutput(null);
      setError(null);
      
      const response = await fetch('/api/cbb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSyncOutput(result.output);
      // Refresh data after sync
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pattern matching logic
  function addPatternMatching(games: Game[], criteria: any): Game[] {
    return games.map(game => {
      const matching: string[] = [];
      const spread = game.spread;
      const model = game.model;
      const net = game.net;
      const rd = game.rankDiff;

      // Rank Diff pattern (row 4)
      if (rd >= (criteria.rdMin || -6) && rd <= (criteria.rdMax || 6) && spread >= (criteria.rdSpread || 0)) {
        matching.push('rank_diff');
      }
      // Pattern 1: Model≤0, Spread≥18
      if (model <= 0 && spread >= 18) {
        matching.push('pattern_1');
      }
      // Pattern 2: Net[10,15), Spread≥14
      if (net >= 10 && net < 15 && spread >= 14) {
        matching.push('pattern_2');
      }
      // Pattern 3: Model≤0, Spread≥14
      if (model <= 0 && spread >= 14) {
        matching.push('pattern_3');
      }
      // Pattern 4: Model≤-1, Spread≥14
      if (model <= -1 && spread >= 14) {
        matching.push('pattern_4');
      }
      // Pattern 5: Net[0,15), Spread≥14
      if (net >= 0 && net < 15 && spread >= 14) {
        matching.push('pattern_5');
      }
      // Pattern 6: Model≤-5, Spread≥7
      if (model <= -5 && spread >= 7) {
        matching.push('pattern_6');
      }
      // Pattern 8: Model≤0, Spread≥10
      if (model <= 0 && spread >= 10) {
        matching.push('pattern_8');
      }
      // Pattern 9: Spread≥14, Net<20
      if (spread >= 14 && net < 20) {
        matching.push('pattern_9');
      }
      // Pattern 10: Model≤0, Spread≥10, Net≥10
      if (model <= 0 && spread >= 10 && net >= 10) {
        matching.push('pattern_10');
      }

      return { ...game, matchingPatterns: matching };
    });
  }

  const getRowBackground = (game: Game) => {
    if (!game.matchingPatterns || game.matchingPatterns.length === 0) {
      return 'transparent';
    }
    // Use lime green for rank_diff (#1), tool green for others
    if (game.matchingPatterns.includes('rank_diff')) {
      return HIGHLIGHT_COLORS.rankDiff;
    }
    return HIGHLIGHT_COLORS.standard;
  };

  const getPatternNumbers = (game: Game) => {
    if (!game.matchingPatterns || game.matchingPatterns.length === 0) {
      return '-';
    }
    return game.matchingPatterns.map(p => PATTERN_NUMBERS[p] || '?').join(', ');
  };

  const handleGameUpdate = (game: Game, newTeam: string) => {
    // Update local state to reflect the change
    if (data) {
      const updateGames = (games: Game[]) => 
        games.map(g => g.id === game.id ? { ...g, team: newTeam } : g);
      
      setData({
        ...data,
        games: updateGames(data.games),
        yesterdayGames: updateGames(data.yesterdayGames),
        todayGames: updateGames(data.todayGames),
        tomorrowGames: updateGames(data.tomorrowGames),
      });
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />
      <main
        style={{
          paddingTop: isMobile ? "72px" : "80px",
          paddingBottom: isMobile ? "88px" : "32px",
          paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 24px)",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: "100vh",
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Trophy style={{ width: "32px", height: "32px", color: "#22c55e" }} />
              <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                {toolCustom.name}
              </h1>
            </div>
            <button
              onClick={runSync}
              disabled={syncing}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                background: syncing ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.12)",
                color: "#4ade80",
                fontSize: "14px",
                fontWeight: 600,
                cursor: syncing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {syncing ? "Syncing..." : "Run Sync"}
            </button>
          </div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
            College Basketball ATS Value Plays • Pattern-based betting analysis
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "rgba(124, 58, 237, 0.1)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
            color: "#a78bfa",
          }}>
            {error}
          </div>
        )}

        {/* Sync Output */}
        {syncOutput && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#4ade80",
            maxHeight: "200px",
            overflow: "auto",
            fontSize: "12px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}>
            {syncOutput}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: isMobile ? "8px" : "12px",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'yesterday', label: `Yesterday (${data?.yesterdayStr || ''})`, icon: Calendar, count: data?.yesterdayGames?.length },
            { id: 'today', label: `Today (${data?.todayStr || ''})`, icon: Calendar, count: data?.todayGames?.length },
            { id: 'tomorrow', label: `Tomorrow (${data?.tomorrowStr || ''})`, icon: Target, count: data?.tomorrowGames?.length },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              style={{
                padding: isMobile ? "8px 16px" : "10px 20px",
                borderRadius: "8px",
                border: activeTab === id ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                background: activeTab === id ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.03)",
                color: activeTab === id ? "#4ade80" : "rgba(255, 255, 255, 0.7)",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: activeTab === id ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} />
              {label}
              {count !== undefined && (
                <span style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: activeTab === id ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.1)",
                  fontSize: "11px",
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 16px" }} />
            <p>Loading CBB data...</p>
          </div>
        )}

        {/* Dashboard Tab */}
        {!loading && activeTab === 'dashboard' && data && (
          <DashboardView patterns={data.patterns} todayGames={data.todayGames} todayStr={data.todayStr} />
        )}

        {/* Yesterday Tab */}
        {!loading && activeTab === 'yesterday' && data && (
          <GamesView games={data.yesterdayGames} title={`Yesterday's Games (${data.yesterdayStr})`} getRowBackground={getRowBackground} getPatternNumbers={getPatternNumbers} onGameUpdate={handleGameUpdate} />
        )}

        {/* Today Tab */}
        {!loading && activeTab === 'today' && data && (
          <GamesView games={data.todayGames} title={`Today's Games (${data.todayStr})`} getRowBackground={getRowBackground} getPatternNumbers={getPatternNumbers} onGameUpdate={handleGameUpdate} />
        )}

        {/* Tomorrow Tab */}
        {!loading && activeTab === 'tomorrow' && data && (
          <GamesView games={data.tomorrowGames} title={`Tomorrow's Games (${data.tomorrowStr})`} getRowBackground={getRowBackground} getPatternNumbers={getPatternNumbers} onGameUpdate={handleGameUpdate} />
        )}
      </main>
    </>
  );
}

// Plain English pattern descriptions
const PATTERN_LABELS: Record<string, { title: string; subtitle: string }> = {
  rank_diff: {
    title: "Evenly Matched Underdog",
    subtitle: "Teams within 6 ranks of each other, taking the points"
  },
  pattern_1: {
    title: "Big Underdog Value",
    subtitle: "Model likes the dog getting 18+ points"
  },
  pattern_2: {
    title: "Mid-Range Value Dog",
    subtitle: "Solid team (Net 10-15) getting 14+ points"
  },
  pattern_3: {
    title: "Model Favors the Dog",
    subtitle: "Model agrees with underdog getting 14+ points"
  },
  pattern_4: {
    title: "Strong Model Edge",
    subtitle: "Model strongly favors dog getting 14+ points"
  },
  pattern_5: {
    title: "Competent Underdog",
    subtitle: "Decent team (Net 0-15) getting 14+ points"
  },
  pattern_6: {
    title: "Model Loves the Spread",
    subtitle: "Model heavily favors dog getting 7+ points"
  },
  pattern_8: {
    title: "Double-Digit Dog",
    subtitle: "Model supports underdog getting 10+ points"
  },
  pattern_9: {
    title: "Big Spread, Beatable Favorite",
    subtitle: "14+ point dog against non-elite team (Net < 20)"
  },
  pattern_10: {
    title: "Quality Dog, Big Spread",
    subtitle: "Good team (Net 10+) getting 10+ points with model support"
  },
};

function DashboardView({ patterns, todayGames, todayStr }: { patterns: Pattern[]; todayGames: Game[]; todayStr: string }) {
  // Filter to only qualifying games (games that match at least one pattern)
  const qualifyingGames = todayGames.filter(g => g.matchingPatterns && g.matchingPatterns.length > 0);
  
  // Group games by pattern for the summary
  const patternCounts: Record<string, Game[]> = {};
  qualifyingGames.forEach(game => {
    game.matchingPatterns?.forEach(pattern => {
      if (!patternCounts[pattern]) patternCounts[pattern] = [];
      patternCounts[pattern].push(game);
    });
  });

  return (
    <div>
      {/* TODAY'S QUALIFYING PLAYS - Hero Section */}
      <div style={{
        padding: "24px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(132, 204, 22, 0.1) 100%)",
        border: "2px solid rgba(34, 197, 94, 0.4)",
        marginBottom: "32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#4ade80", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              🎯 Today's Value Plays
              <span style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: qualifyingGames.length > 0 ? "rgba(34, 197, 94, 0.3)" : "rgba(107, 114, 128, 0.3)",
                fontSize: "16px",
                fontWeight: 700,
              }}>
                {qualifyingGames.length}
              </span>
            </h2>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
              {todayStr} • Games matching profitable patterns
            </p>
          </div>
        </div>

        {qualifyingGames.length === 0 ? (
          <div style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--foreground-muted)",
            fontSize: "15px",
          }}>
            No games qualify for patterns today. Check back later as lines move.
          </div>
        ) : (
          <>
            {/* Pattern Summary Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {Object.entries(patternCounts)
                .sort(([a], [b]) => {
                  const numA = parseInt(PATTERN_NUMBERS[a] || '99');
                  const numB = parseInt(PATTERN_NUMBERS[b] || '99');
                  return numA - numB;
                })
                .map(([patternId, games]) => {
                  const labels = PATTERN_LABELS[patternId] || { title: patternId, subtitle: '' };
                  const patternNum = PATTERN_NUMBERS[patternId] || '?';
                  const isRankDiff = patternId === 'rank_diff';
                  return (
                    <div
                      key={patternId}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: isRankDiff ? "rgba(132, 204, 22, 0.2)" : "rgba(34, 197, 94, 0.15)",
                        border: `1px solid ${isRankDiff ? 'rgba(132, 204, 22, 0.5)' : 'rgba(34, 197, 94, 0.4)'}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: isRankDiff ? "#84cc16" : "#22c55e",
                        color: "#000",
                        fontSize: "13px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {patternNum}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
                        {labels.title}
                      </span>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.1)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#4ade80",
                      }}>
                        {games.length} {games.length === 1 ? 'game' : 'games'}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Qualifying Games List */}
            <div style={{
              display: "grid",
              gap: "12px",
            }}>
              {qualifyingGames.map(game => {
                const patternNums = game.matchingPatterns?.map(p => PATTERN_NUMBERS[p] || '?').join(', ') || '-';
                const hasRankDiff = game.matchingPatterns?.includes('rank_diff');
                return (
                  <div
                    key={game.id}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "12px",
                      background: hasRankDiff ? "rgba(132, 204, 22, 0.12)" : "rgba(34, 197, 94, 0.08)",
                      border: `1px solid ${hasRankDiff ? 'rgba(132, 204, 22, 0.35)' : 'rgba(34, 197, 94, 0.25)'}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    {/* Team & Spread */}
                    <div style={{ flex: "1", minWidth: "200px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px" }}>
                        {game.team}
                      </div>
                      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <span>
                          <strong style={{ color: game.spread > 0 ? "#4ade80" : "#a78bfa" }}>
                            {game.spread > 0 ? '+' : ''}{game.spread}
                          </strong> spread
                        </span>
                        <span>Model: {game.model.toFixed(1)}</span>
                        <span>Net: {game.net.toFixed(1)}</span>
                        <span>RD: {game.rankDiff.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Pattern Badges */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {game.matchingPatterns?.map(patternId => {
                        const patternNum = PATTERN_NUMBERS[patternId] || '?';
                        const isRankDiff = patternId === 'rank_diff';
                        const labels = PATTERN_LABELS[patternId] || { title: patternId };
                        return (
                          <div
                            key={patternId}
                            title={labels.title}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: isRankDiff ? "#84cc16" : "#22c55e",
                              color: "#000",
                              fontSize: "13px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            #{patternNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pattern Performance Grid */}
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "var(--foreground)" }}>
        🏀 Pattern Performance
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
      }}>
        {patterns.map(pattern => {
          const labels = PATTERN_LABELS[pattern.id] || { title: pattern.name, subtitle: '' };
          const patternNum = PATTERN_NUMBERS[pattern.id] || '?';
          const isRankDiff = pattern.id === 'rank_diff';
          const todayCount = patternCounts[pattern.id]?.length || 0;
          return (
            <div
              key={pattern.id}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: `2px solid ${isRankDiff ? '#84cc16' : '#22c55e'}`,
                backdropFilter: "blur(10px)",
                position: "relative",
              }}
            >
              {/* Large pattern number */}
              <div style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                fontSize: "48px",
                fontWeight: 700,
                color: isRankDiff ? 'rgba(132, 204, 22, 0.3)' : 'rgba(34, 197, 94, 0.25)',
                lineHeight: 1,
              }}>
                {patternNum}
              </div>
              {/* Today indicator */}
              {todayCount > 0 && (
                <div style={{
                  position: "absolute",
                  top: "-8px",
                  left: "16px",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  background: isRankDiff ? "#84cc16" : "#22c55e",
                  color: "#000",
                  fontSize: "11px",
                  fontWeight: 700,
                }}>
                  {todayCount} TODAY
                </div>
              )}
              <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px", color: "var(--foreground)", paddingRight: "50px" }}>
                {labels.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px", paddingRight: "50px" }}>
                {labels.subtitle}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  <span style={{ fontWeight: 500, color: "var(--foreground)" }}>Record:</span> {pattern.wins}-{pattern.losses}
                </div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  <span style={{ fontWeight: 500, color: "var(--foreground)" }}>Win%:</span> {pattern.winPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  <span style={{ fontWeight: 500, color: "var(--foreground)" }}>ROI:</span> {pattern.roi > 0 ? '+' : ''}{pattern.roi.toFixed(1)}%
                </div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  <span style={{ fontWeight: 500, color: "var(--foreground)" }}>Sample:</span> {pattern.sample}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Editable team name cell
function EditableTeamCell({ game, onUpdate }: { game: Game; onUpdate: (game: Game, newName: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(game.team);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    if (value === game.team) {
      setEditing(false);
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/cbb/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: game.row, column: 'team', value }),
      });
      
      if (response.ok) {
        onUpdate(game, value);
        setEditing(false);
      } else {
        alert('Failed to save');
        setValue(game.team);
      }
    } catch (e) {
      alert('Failed to save');
      setValue(game.team);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(game.team);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          style={{
            padding: '4px 8px',
            fontSize: '13px',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            borderRadius: '4px',
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'var(--foreground)',
            width: '140px',
          }}
        />
        <button onClick={handleSave} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
          <Check size={14} color="#4ade80" />
        </button>
        <button onClick={handleCancel} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
          <X size={14} color="#a78bfa" />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setEditing(true)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        cursor: 'pointer',
        padding: '2px 0',
      }}
      title="Click to edit"
    >
      <span>{game.team}</span>
      <Pencil size={12} style={{ opacity: 0.4 }} />
    </div>
  );
}

function GamesView({ games, title, getRowBackground, getPatternNumbers, onGameUpdate }: { games: Game[]; title: string; getRowBackground: (g: Game) => string; getPatternNumbers: (g: Game) => string; onGameUpdate: (game: Game, newTeam: string) => void }) {
  if (games.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
        <Calendar size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
        <p>No games found for this date</p>
      </div>
    );
  }

  // Group games into pairs (every 2 consecutive games)
  const pairs: Game[][] = [];
  for (let i = 0; i < games.length; i += 2) {
    pairs.push(games.slice(i, i + 2));
  }

  // Fixed column widths for alignment
  const colWidths = {
    team: "22%",
    spread: "9%",
    model: "9%",
    net: "9%",
    rd: "8%",
    avgRank: "10%",
    final: "12%",
    ats: "8%",
    patterns: "8%",
  };

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "var(--foreground)" }}>
        {title}
      </h2>
      
      {/* Header row - separate table for alignment */}
      <div style={{ 
        borderRadius: "8px 8px 0 0", 
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderBottom: "none",
        background: "rgba(255, 255, 255, 0.03)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: colWidths.team, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Team</th>
              <th style={{ width: colWidths.spread, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Spread</th>
              <th style={{ width: colWidths.model, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Model</th>
              <th style={{ width: colWidths.net, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Net</th>
              <th style={{ width: colWidths.rd, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>RD</th>
              <th style={{ width: colWidths.avgRank, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Avg Rank</th>
              <th style={{ width: colWidths.final, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Final</th>
              <th style={{ width: colWidths.ats, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>ATS</th>
              <th style={{ width: colWidths.patterns, padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Patterns</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Game pairs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
        {pairs.map((pair, pairIdx) => (
          <div
            key={pairIdx}
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.02)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <tbody>
                {pair.map((game, idx) => (
                  <tr
                    key={game.id}
                    style={{
                      background: getRowBackground(game),
                      borderBottom: idx === 0 && pair.length > 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    }}
                  >
                    <td style={{ width: colWidths.team, padding: "10px 8px", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <EditableTeamCell game={game} onUpdate={onGameUpdate} />
                    </td>
                    <td style={{ width: colWidths.spread, padding: "10px 8px", fontSize: "13px", color: game.spread > 0 ? "#4ade80" : "#a78bfa" }}>
                      {game.spread > 0 ? '+' : ''}{game.spread}
                    </td>
                    <td style={{ width: colWidths.model, padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.model.toFixed(1)}</td>
                    <td style={{ width: colWidths.net, padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.net.toFixed(1)}</td>
                    <td style={{ width: colWidths.rd, padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.rankDiff.toFixed(0)}</td>
                    <td style={{ width: colWidths.avgRank, padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.avgRank.toFixed(0)}</td>
                    <td style={{ width: colWidths.final, padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.finalScore || '-'}</td>
                    <td style={{
                      width: colWidths.ats,
                      padding: "10px 8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: game.ats === 'W' ? '#4ade80' : game.ats === 'L' ? '#a78bfa' : 'var(--foreground-muted)'
                    }}>
                      {game.ats || '-'}
                    </td>
                    <td style={{ width: colWidths.patterns, padding: "10px 8px", fontSize: "12px", fontWeight: 500, color: "var(--foreground)" }}>
                      {getPatternNumbers(game)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: "16px",
        padding: "12px 16px",
        borderRadius: "8px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
      }}>
        <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{games.length}</span> games
        </div>
        <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
          <span style={{ fontWeight: 600, color: "#4ade80" }}>
            {games.filter(g => g.matchingPatterns && g.matchingPatterns.length > 0).length}
          </span> pattern matches
        </div>
      </div>
    </div>
  );
}
