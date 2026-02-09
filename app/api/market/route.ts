import { NextResponse } from "next/server";

// Free APIs we can use:
// CoinGecko for crypto (no key needed)
// Yahoo Finance proxy or Alpha Vantage (needs free key)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get("symbols")?.split(",") || ["BTC", "ETH", "AAPL", "GOOGL", "TSLA"];

    // Fetch crypto prices from CoinGecko (free, no auth)
    const cryptoSymbols = symbols.filter(s => ["BTC", "ETH", "SOL", "ADA", "DOT"].includes(s));
    const cryptoIds = cryptoSymbols.map(s => {
      const map: Record<string, string> = {
        BTC: "bitcoin",
        ETH: "ethereum",
        SOL: "solana",
        ADA: "cardano",
        DOT: "polkadot",
      };
      return map[s];
    }).filter(Boolean);

    let cryptoPrices: any[] = [];
    if (cryptoIds.length > 0) {
      const cryptoResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd&include_24hr_change=true`,
        { next: { revalidate: 60 } }
      );
      
      if (cryptoResponse.ok) {
        const data = await cryptoResponse.json();
        cryptoPrices = Object.entries(data).map(([id, info]: [string, any]) => {
          const symbolMap: Record<string, string> = {
            bitcoin: "BTC",
            ethereum: "ETH",
            solana: "SOL",
            cardano: "ADA",
            polkadot: "DOT",
          };
          return {
            symbol: symbolMap[id] || id.toUpperCase(),
            name: id.charAt(0).toUpperCase() + id.slice(1),
            price: info.usd,
            change: info.usd_24h_change || 0,
            type: "crypto",
          };
        });
      }
    }

    // For stocks, we'd need an API key. For now, return mock data
    const stockSymbols = symbols.filter(s => !cryptoSymbols.includes(s));
    const stockPrices = stockSymbols.map(symbol => ({
      symbol,
      name: symbol,
      price: Math.random() * 500 + 100,
      change: (Math.random() - 0.5) * 10,
      type: "stock",
    }));

    const allPrices = [...cryptoPrices, ...stockPrices];

    return NextResponse.json({ prices: allPrices });
  } catch (error) {
    console.error("Error fetching market data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
