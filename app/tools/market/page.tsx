"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, Star, ExternalLink, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: "stock" | "crypto";
}

export default function MarketPage() {
  const [prices, setPrices] = useState<MarketItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(["BTC", "ETH", "AAPL", "GOOGL", "TSLA"]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    if (watchlist.length > 0) {
      loadPrices();
    }
  }, [watchlist]);

  const loadWatchlist = async () => {
    try {
      const userId = "norman";
      const docRef = doc(db, "users", userId, "watchlist", "current");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWatchlist(docSnap.data().symbols || ["BTC", "ETH", "AAPL", "GOOGL", "TSLA"]);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    }
  };

  const loadPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market?symbols=${watchlist.join(",")}`);
      const data = await res.json();
      setPrices(data.prices || []);
    } catch (err) {
      console.error("Failed to load prices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  const addToWatchlist = async (symbol: string) => {
    const newWatchlist = [...watchlist, symbol.toUpperCase()];
    setWatchlist(newWatchlist);
    
    try {
      const userId = "norman";
      await setDoc(doc(db, "users", userId, "watchlist", "current"), {
        symbols: newWatchlist,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to save watchlist:", err);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    const newWatchlist = watchlist.filter(s => s !== symbol);
    setWatchlist(newWatchlist);
    setPrices(prev => prev.filter(p => p.symbol !== symbol));
    
    try {
      const userId = "norman";
      await setDoc(doc(db, "users", userId, "watchlist", "current"), {
        symbols: newWatchlist,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to save watchlist:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "80px 20px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <DollarSign size={48} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>Market</h1>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.open('https://www.google.com/finance', '_blank')}
              style={{
                padding: "10px 20px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ExternalLink size={16} />
              Google Finance
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: refreshing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>Loading market data...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {prices.map((item) => (
              <div
                key={item.symbol}
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  padding: "20px",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => removeFromWatchlist(item.symbol)}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    padding: "6px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <Star size={14} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--foreground)", marginBottom: "2px" }}>
                      {item.symbol}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                      {item.name}
                    </p>
                  </div>
                  {item.change >= 0 ? (
                    <TrendingUp size={24} style={{ color: "#10b981" }} />
                  ) : (
                    <TrendingDown size={24} style={{ color: "#ef4444" }} />
                  )}
                </div>

                <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--foreground)", marginBottom: "8px" }}>
                  ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: item.change >= 0 ? "#10b981" : "#ef4444",
                }}>
                  {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
                </div>

                <div style={{
                  marginTop: "12px",
                  padding: "6px 12px",
                  background: item.type === "crypto" ? "rgba(99, 102, 241, 0.1)" : "rgba(34, 197, 94, 0.1)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: item.type === "crypto" ? "#818cf8" : "#22c55e",
                  textAlign: "center",
                }}>
                  {item.type.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
