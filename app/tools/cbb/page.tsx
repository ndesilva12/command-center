"use client";

import { useState, useEffect } from "react";
import { Trophy, RefreshCw, Calendar, TrendingUp, Target, Loader2 } from "lucide-react";
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
  todayGames: Game[];
  tomorrowGames: Game[];
  criteria: any;
  todayStr: string;
  tomorrowStr: string;
}

// Pattern colors for highlighting
const PATTERN_COLORS: Record<string, string> = {
  rank_diff: 'rgba(216, 235, 211, 0.8)',
  pattern_1: 'rgba(255, 242, 204, 0.8)',
  pattern_2: 'rgba(217, 234, 247, 0.8)',
  pattern_3: 'rgba(244, 224, 224, 0.8)',
  pattern_4: 'rgba(234, 224, 244, 0.8)',
  pattern_5: 'rgba(255, 229, 204, 0.8)',
  pattern_6: 'rgba(224, 244, 224, 0.8)',
  pattern_8: 'rgba(204, 229, 255, 0.8)',
  pattern_9: 'rgba(244, 244, 204, 0.8)',
  pattern_10: 'rgba(224, 234, 244, 0.8)',
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'today' | 'tomorrow'>('dashboard');
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
      const todayWithPatterns = addPatternMatching(result.todayGames, result.criteria);
      const tomorrowWithPatterns = addPatternMatching(result.tomorrowGames, result.criteria);
      
      setData({
        ...result,
        games: gamesWithPatterns,
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
    // Use the first matching pattern's color
    return PATTERN_COLORS[game.matchingPatterns[0]] || 'transparent';
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
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
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
          <DashboardView patterns={data.patterns} />
        )}

        {/* Today Tab */}
        {!loading && activeTab === 'today' && data && (
          <GamesView games={data.todayGames} title={`Today's Games (${data.todayStr})`} getRowBackground={getRowBackground} />
        )}

        {/* Tomorrow Tab */}
        {!loading && activeTab === 'tomorrow' && data && (
          <GamesView games={data.tomorrowGames} title={`Tomorrow's Games (${data.tomorrowStr})`} getRowBackground={getRowBackground} />
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

function DashboardView({ patterns }: { patterns: Pattern[] }) {
  return (
    <div>
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
          return (
            <div
              key={pattern.id}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: `2px solid ${pattern.color}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px", color: "var(--foreground)" }}>
                {labels.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
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

function GamesView({ games, title, getRowBackground }: { games: Game[]; title: string; getRowBackground: (g: Game) => string }) {
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

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "var(--foreground)" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              {pairIdx === 0 && (
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Team</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Spread</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Model</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Net</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>RD</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Avg Rank</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Final</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>ATS</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "var(--foreground-muted)" }}>Patterns</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {pair.map((game, idx) => (
                  <tr
                    key={game.id}
                    style={{
                      background: getRowBackground(game),
                      borderBottom: idx === 0 && pair.length > 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    }}
                  >
                    <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>{game.team}</td>
                    <td style={{ padding: "10px 8px", fontSize: "13px", color: game.spread > 0 ? "#4ade80" : "#f87171" }}>
                      {game.spread > 0 ? '+' : ''}{game.spread}
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.model.toFixed(1)}</td>
                    <td style={{ padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.net.toFixed(1)}</td>
                    <td style={{ padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.rankDiff.toFixed(0)}</td>
                    <td style={{ padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.avgRank.toFixed(0)}</td>
                    <td style={{ padding: "10px 8px", fontSize: "13px", color: "var(--foreground-muted)" }}>{game.finalScore || '-'}</td>
                    <td style={{
                      padding: "10px 8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: game.ats === 'W' ? '#4ade80' : game.ats === 'L' ? '#f87171' : 'var(--foreground-muted)'
                    }}>
                      {game.ats || '-'}
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: "11px", color: "var(--foreground-muted)" }}>
                      {game.matchingPatterns?.length ? game.matchingPatterns.length : '-'}
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
