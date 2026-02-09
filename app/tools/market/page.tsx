"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Plus, RefreshCw, ExternalLink, Search, TrendingDown, Minus } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface MarketPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: "stock" | "crypto";
}

export default function MarketPage() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/market?symbols=BTC,ETH,SOL,AAPL,GOOGL,TSLA,NVDA");
      if (!response.ok) throw new Error("Failed to fetch market data");
      const data = await response.json();
      setPrices(data.prices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="market" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Market</h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://www.google.com/finance"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                textDecoration: "none",
                fontSize: "13px",
                transition: "all 0.15s",
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open in Google Finance
            </a>
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              Refresh
            </button>
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "#00aaff",
                color: "#000",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              Add to Watchlist
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
          {["Stocks", "Crypto", "Watchlist"].map((tab, idx) => (
            <button
              key={idx}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: idx === 0 ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                color: idx === 0 ? "#00aaff" : "var(--foreground-muted)",
                border: idx === 0 ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: idx === 0 ? 500 : 400,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search stocks or crypto..."
              style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "14px" }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button
                onClick={fetchPrices}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : prices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <TrendingUp style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No market data
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                Failed to load market prices
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", padding: "20px" }}>
              {prices.map((item) => {
                const isPositive = item.change >= 0;
                return (
                  <div
                    key={item.symbol}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "16px",
                      transition: "all 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                      <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)", marginBottom: "2px" }}>
                          {item.symbol}
                        </h3>
                        <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{item.name}</p>
                      </div>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: item.type === "crypto" ? "#f59e0b" : "#06b6d4",
                          backgroundColor: item.type === "crypto" ? "rgba(245, 158, 11, 0.15)" : "rgba(6, 182, 212, 0.15)",
                          border: `1px solid ${item.type === "crypto" ? "rgba(245, 158, 11, 0.3)" : "rgba(6, 182, 212, 0.3)"}`,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.type}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                      <div>
                        <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {isPositive ? (
                          <TrendingUp style={{ width: "16px", height: "16px", color: "#10b981" }} />
                        ) : (
                          <TrendingDown style={{ width: "16px", height: "16px", color: "#ef4444" }} />
                        )}
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: isPositive ? "#10b981" : "#ef4444",
                          }}
                        >
                          {formatChange(item.change)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
