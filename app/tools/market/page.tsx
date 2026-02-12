"use client";

import { useEffect, useRef, memo, useState } from "react";
import { TrendingUp, ExternalLink } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";


// User's TradingView watchlist symbols with descriptions
// Note: Removed VIX, DXY, US10Y, US30Y as they don't display properly in the widget
const WATCHLIST_SYMBOLS = [
  { s: "CAPITALCOM:US500", d: "US 500" },
  { s: "AMEX:SPY", d: "SPDR S&P 500 ETF" },
  { s: "NASDAQ:QQQ", d: "Invesco QQQ Trust" },
  { s: "AMEX:IWM", d: "iShares Russell 2000" },
  { s: "NYSE:BSX", d: "Boston Scientific" },
  { s: "TVC:GOLD", d: "Gold" },
  { s: "TVC:SILVER", d: "Silver" },
  { s: "NASDAQ:TLT", d: "20+ Year Treasury Bond" },
  { s: "COINBASE:BTCUSD", d: "Bitcoin USD" },
  { s: "FX:USDJPY", d: "USD/JPY" },
  { s: "NASDAQ:TSLA", d: "Tesla" },
  { s: "AMEX:GLD", d: "SPDR Gold Shares" },
  { s: "AMEX:SLV", d: "iShares Silver Trust" },
  { s: "NYMEX:CL1!", d: "Crude Oil Futures" },
  { s: "AMEX:XLE", d: "Energy Select Sector" },
  { s: "NYSE:GME", d: "GameStop" },
  { s: "NYSE:CVNA", d: "Carvana" },
  { s: "NYSE:KSS", d: "Kohl's" },
  { s: "NYSE:RKT", d: "Rocket Companies" },
  { s: "NASDAQ:HTZ", d: "Hertz" },
  { s: "NASDAQ:GRPN", d: "Groupon" },
  { s: "NASDAQ:BETR", d: "Better Home & Finance" },
  { s: "NASDAQ:OPEN", d: "Opendoor Technologies" },
];

function TradingViewWatchlistWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(34, 197, 94, 1)",
      plotLineColorFalling: "rgba(239, 68, 68, 1)",
      gridLineColor: "rgba(240, 243, 250, 0.1)",
      scaleFontColor: "rgba(209, 212, 220, 1)",
      belowLineFillColorGrowing: "rgba(34, 197, 94, 0.12)",
      belowLineFillColorFalling: "rgba(239, 68, 68, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(34, 197, 94, 0)",
      belowLineFillColorFallingBottom: "rgba(239, 68, 68, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      tabs: [
        {
          title: "Watchlist",
          symbols: WATCHLIST_SYMBOLS,
        },
      ],
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}

const MemoizedWatchlistWidget = memo(TradingViewWatchlistWidget);

function TradingViewTickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: WATCHLIST_SYMBOLS.map(s => ({ proName: s.s, title: s.d })),
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: "100%" }}
    />
  );
}

const MemoizedTickerTape = memo(TradingViewTickerTape);

export default function MarketPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('market', 'Market', '#6366f1');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="market" />

      <main style={{
        paddingTop: isMobile ? "80px" : "136px",
        paddingBottom: isMobile ? "80px" : "96px",
        minHeight: `calc(100vh - ${isMobile ? "160px" : "232px"})`
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: isMobile ? "0 12px" : "0 24px"
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
                <TrendingUp style={{ width: "28px", height: "28px", color: "#00aaff" }} />
                Market
              </h1>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Real-time market data powered by TradingView
              </p>
            </div>
            <a
              href="https://www.tradingview.com/watchlists/16742067/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--foreground-muted)",
                fontSize: "14px",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "#00aaff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <svg viewBox="0 0 36 28" width="18" height="14" fill="currentColor">
                <path d="M14 22H7V6h7v16ZM21 22h-7V0h7v22Zm14 6H21V11h14v17Z" />
              </svg>
              Open in TradingView
            </a>
          </div>

          {/* Ticker Tape */}
          <div
            className="glass"
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "24px",
            }}
          >
            <MemoizedTickerTape />
          </div>

          {/* Main Content - Watchlist and Quick Access Side by Side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            {/* Watchlist Widget */}
            <div
              className="glass"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                height: "600px",
              }}
            >
              <MemoizedWatchlistWidget />
            </div>

            {/* Quick Access Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>{toolCustom.name}</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                {WATCHLIST_SYMBOLS.slice(0, 12).map((item) => {
                  const symbolName = item.s.split(":")[1] || item.s;
                  return (
                    <a
                      key={item.s}
                      href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(item.s)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        textDecoration: "none",
                        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 170, 255, 0.2)";
                        e.currentTarget.style.borderColor = "#00aaff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                          {symbolName}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--foreground-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.d}
                        </div>
                      </div>
                      <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                    </a>
                  );
                })}
              </div>

              {/* View More */}
              <div style={{ marginTop: "8px" }}>
                <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                  Click any symbol in the watchlist to see its chart. Use the TradingView widget to interact with real-time data.
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {WATCHLIST_SYMBOLS.slice(12).map((item) => {
                    const symbolName = item.s.split(":")[1] || item.s;
                    return (
                      <a
                        key={item.s}
                        href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(item.s)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "var(--foreground-muted)",
                          fontSize: "12px",
                          textDecoration: "none",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                          e.currentTarget.style.color = "var(--foreground)";
                          e.currentTarget.style.borderColor = "#00aaff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.color = "var(--foreground-muted)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        }}
                      >
                        {symbolName}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Attribution */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "12px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
              }}
            >
              Market data by TradingView
            </a>
          </div>
        </div>

        {/* Responsive styles */}
        <style jsx global>{`
          @media (max-width: 900px) {
            main > div > div:nth-child(4) {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
