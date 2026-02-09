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
    // Try multiple methods to get Google Trends

    // Method 1: Use Grok API (preferred for real-time data)
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
                content: "You are an assistant that provides current trending search topics. Respond only with valid JSON.",
              },
              {
                role: "user",
                content: `Today is ${today}. What are the top 10 trending search topics on Google right now in the United States?

Consider:
- Breaking news events
- Popular entertainment and celebrity topics
- Sports events and highlights
- Technology announcements
- Political developments
- Viral topics

Respond with this exact JSON format (no markdown):
[{"title": "Topic Name", "description": "Brief description"}]

Limit to exactly 10 topics.`,
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
          const trends: GoogleTrend[] = parsed.slice(0, 10).map((item: { title: string; description?: string }) => ({
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

    // Method 2: Try Google Trends RSS feed (daily trends)
    try {
      const rssResponse = await fetch("https://trends.google.com/trending/rss?geo=US", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (rssResponse.ok) {
        const xml = await rssResponse.text();
        const trends = parseGoogleTrendsRSS(xml);
        if (trends.length > 0) {
          return NextResponse.json({ trends: trends.slice(0, 10), source: "rss" });
        }
      }
    } catch (e) {
      console.error("Google Trends RSS error:", e);
    }

    // Method 3: Fallback to OpenClaw gateway (uses Norman's Anthropic subscription)
    try {
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const prompt = `Today is ${today}. What are the top 10 trending search topics on Google right now in the United States?

Consider:
- Breaking news events
- Popular entertainment and celebrity topics
- Sports events and highlights
- Technology announcements
- Political developments
- Viral topics

Return ONLY a JSON array with this format (no markdown, no explanation):
[{"title": "Topic Name", "description": "Brief description"}]`;

      const content = await askOpenClaw(prompt);

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const trends: GoogleTrend[] = parsed.slice(0, 10).map((item: { title: string; description?: string }) => ({
          title: item.title,
          description: item.description,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.title)}&tbm=nws`,
        }));
        return NextResponse.json({ trends, source: "openclaw" });
      }
    } catch (e) {
      console.error("OpenClaw gateway error:", e);
    }

    // Final fallback: Return mock data for testing
    const mockTrends: GoogleTrend[] = [
      { title: "AI Breakthroughs 2026", description: "Latest developments in artificial intelligence", searchUrl: "https://www.google.com/search?q=AI+Breakthroughs+2026&tbm=nws" },
      { title: "Climate Summit Updates", description: "Global leaders meet to discuss climate action", searchUrl: "https://www.google.com/search?q=Climate+Summit+Updates&tbm=nws" },
      { title: "Tech IPO Season", description: "Major tech companies going public", searchUrl: "https://www.google.com/search?q=Tech+IPO+Season&tbm=nws" },
      { title: "Space Exploration News", description: "Latest missions and discoveries", searchUrl: "https://www.google.com/search?q=Space+Exploration+News&tbm=nws" },
      { title: "Quantum Computing Advances", description: "Breakthroughs in quantum technology", searchUrl: "https://www.google.com/search?q=Quantum+Computing+Advances&tbm=nws" },
    ];
    return NextResponse.json({
      trends: mockTrends,
      source: "mock",
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
    // Simple XML parsing for <title> and <link> tags within <item>
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/;

    let itemMatch;
    while ((itemMatch = itemRegex.exec(xml)) !== null && trends.length < 15) {
      const itemContent = itemMatch[1];
      
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const descMatch = descRegex.exec(itemContent);

      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1].trim();
        // Skip the header "Daily Search Trends"
        if (title !== "Daily Search Trends" && title.length > 2) {
          trends.push({
            title,
            description: descMatch?.[1]?.substring(0, 100),
            searchUrl: linkMatch?.[1] || `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`,
          });
        }
      }
    }
  } catch (e) {
    console.error("Error parsing Google Trends RSS:", e);
  }

  return trends;
}
