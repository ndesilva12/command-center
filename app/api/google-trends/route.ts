import { NextResponse } from "next/server";

export interface GoogleTrend {
  title: string;
  searchUrl: string;
  description?: string;
}

async function askOpenClaw(prompt: string): Promise<string> {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL;
  const token = process.env.OPENCLAW_TOKEN;

  if (!gatewayUrl || !token) {
    throw new Error("OpenClaw gateway not configured");
  }

  const response = await fetch(`${gatewayUrl}/api/v1/sessions/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: prompt,
      timeoutSeconds: 30,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenClaw gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.reply || "";
}

export async function GET() {
  try {
    // Method 1: Try Google Trends RSS feed (realtime trending searches) - PRIORITIZED
    try {
      const rssResponse = await fetch("https://trends.google.com/trending/rss?geo=US", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (rssResponse.ok) {
        const xml = await rssResponse.text();
        const trends = parseGoogleTrendsRSS(xml);
        if (trends.length > 0) {
          return NextResponse.json({ trends: trends.slice(0, 15), source: "rss" });
        }
      }
    } catch (e) {
      console.error("Google Trends RSS error:", e);
    }

    // Method 2: Try realtime trending now endpoint
    try {
      const realtimeResponse = await fetch("https://trends.google.com/trends/trendingsearches/daily/rss?geo=US", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (realtimeResponse.ok) {
        const xml = await realtimeResponse.text();
        const trends = parseGoogleTrendsRSS(xml);
        if (trends.length > 0) {
          return NextResponse.json({ trends: trends.slice(0, 15), source: "rss-realtime" });
        }
      }
    } catch (e) {
      console.error("Google Trends realtime RSS error:", e);
    }

    // Method 3: Use Grok API (as fallback for when RSS fails)
    const xaiKey = process.env.XAI_API_KEY;

    if (xaiKey) {
      try {
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${xaiKey}`,
          },
          body: JSON.stringify({
            model: "grok-3-mini",
            messages: [
              {
                role: "system",
                content: "You provide real trending search queries people are typing into Google right now. Respond with actual specific search terms, not broad categories.",
              },
              {
                role: "user",
                content: `Today is ${today}. What are the top 15 ACTUAL trending search queries on Google right now in the United States?

Give me REAL search terms people are typing, like:
- "Taylor Swift new album"
- "Lakers vs Warriors score"
- "iPhone 16 release date"

NOT broad categories like "Entertainment" or "Sports Updates"

Respond with this exact JSON format (no markdown):
[{"title": "Exact search query", "description": "Why it's trending"}]

Limit to exactly 15 specific search queries.`,
              },
            ],
            temperature: 0.5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices[0].message.content;

          // Strip markdown if present
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            content = jsonMatch[1];
          }

          const parsed = JSON.parse(content.trim());
          const trends: GoogleTrend[] = parsed.slice(0, 15).map((item: { title: string; description?: string }) => ({
            title: item.title,
            description: item.description,
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.title)}&tbm=nws`,
          }));

          return NextResponse.json({ trends, source: "grok" });
        }
      } catch (e) {
        console.error("Grok API error:", e);
      }
    }

    // Method 4: Fallback to OpenClaw gateway (uses Norman's Anthropic subscription)
    try {
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const prompt = `Today is ${today}. What are the top 15 ACTUAL trending search queries on Google right now in the United States?

Give me REAL search terms people are typing, like:
- "Taylor Swift new album"
- "Lakers vs Warriors score"
- "iPhone 16 release date"

NOT broad categories like "Entertainment" or "Sports Updates"

Return ONLY a JSON array with this format (no markdown, no explanation):
[{"title": "Exact search query", "description": "Why it's trending"}]`;

      const content = await askOpenClaw(prompt);

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const trends: GoogleTrend[] = parsed.slice(0, 15).map((item: { title: string; description?: string }) => ({
          title: item.title,
          description: item.description,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.title)}&tbm=nws`,
        }));
        return NextResponse.json({ trends, source: "openclaw" });
      }
    } catch (e) {
      console.error("OpenClaw gateway error:", e);
    }

    // Final fallback: Return empty array (better than mock data)
    return NextResponse.json({
      trends: [],
      source: "none",
    });
  } catch (error) {
    console.error("Error fetching Google trends:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Google trends", trends: [] },
      { status: 500 }
    );
  }
}

function parseGoogleTrendsRSS(xml: string): GoogleTrend[] {
  const trends: GoogleTrend[] = [];

  try {
    // Parse Google Trends RSS for actual trending search queries
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;
    const newsItemRegex = /<ht:news_item>([\s\S]*?)<\/ht:news_item>/g;
    const newsItemTitleRegex = /<ht:news_item_title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:news_item_title>/;

    let itemMatch;
    while ((itemMatch = itemRegex.exec(xml)) !== null && trends.length < 20) {
      const itemContent = itemMatch[1];
      
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const descMatch = descRegex.exec(itemContent);

      if (titleMatch && titleMatch[1]) {
        let title = titleMatch[1].trim();
        
        // Skip channel-level titles
        if (title === "Daily Search Trends" || title === "Google Trends" || title.length < 3) {
          continue;
        }

        // Extract description - clean HTML if present
        let description = "";
        if (descMatch && descMatch[1]) {
          let desc = descMatch[1];
          // Try to extract news item title as description
          const newsMatch = newsItemTitleRegex.exec(desc);
          if (newsMatch && newsMatch[1]) {
            description = newsMatch[1].trim().substring(0, 120);
          } else {
            // Remove HTML tags
            description = desc.replace(/<[^>]*>/g, " ").trim().substring(0, 120);
          }
        }

        const searchUrl = linkMatch?.[1] || `https://www.google.com/search?q=${encodeURIComponent(title)}`;

        trends.push({
          title,
          description: description || undefined,
          searchUrl,
        });
      }
    }

    // Remove duplicates
    const uniqueTrends = trends.filter((trend, index, self) =>
      index === self.findIndex((t) => t.title.toLowerCase() === trend.title.toLowerCase())
    );

    return uniqueTrends;
  } catch (e) {
    console.error("Error parsing Google Trends RSS:", e);
  }

  return trends;
}
