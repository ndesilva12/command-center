"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MarketPage() {
  const [stocks, setStocks] = useState<MarketData[]>([]);
  const [crypto, setCrypto] = useState<MarketData[]>([]);

  useEffect(() => {
    setStocks([
      { symbol: "AAPL", name: "Apple Inc.", price: 182.45, change: 2.34, changePercent: 1.3 },
      { symbol: "GOOGL", name: "Alphabet Inc.", price: 151.22, change: -1.12, changePercent: -0.7 },
      { symbol: "MSFT", name: "Microsoft Corp.", price: 412.30, change: 5.67, changePercent: 1.4 },
    ]);

    setCrypto([
      { symbol: "BTC", name: "Bitcoin", price: 68234.50, change: 1234.56, changePercent: 1.8 },
      { symbol: "ETH", name: "Ethereum", price: 3456.78, change: -45.23, changePercent: -1.3 },
    ]);
  }, []);

  const renderMarketItem = (item: MarketData) => (
    <div key={item.symbol} className="glass" style={{ padding: "20px", borderRadius: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>{item.symbol}</div>
          <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{item.name}</div>
        </div>
        {item.change >= 0 ? (
          <TrendingUp style={{ width: "20px", height: "20px", color: "#10b981" }} />
        ) : (
          <TrendingDown style={{ width: "20px", height: "20px", color: "#ef4444" }} />
        )}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px" }}>
        ${item.price.toLocaleString()}
      </div>
      <div style={{ fontSize: "14px", color: item.change >= 0 ? "#10b981" : "#ef4444" }}>
        {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)} ({item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%)
      </div>
    </div>
  );

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <DollarSign style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Market</h1>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>Stocks</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {stocks.map(renderMarketItem)}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>Crypto</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {crypto.map(renderMarketItem)}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
