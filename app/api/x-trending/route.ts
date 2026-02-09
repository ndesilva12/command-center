import { NextResponse } from "next/server";

export interface TrendingTopic {
  topic: string;
  description?: string;
  searchUrl: string;
}

export async function GET() {
  try {
    // Method 1: Try to scrape trends from a public Nitter instance
    const nitterInstances = [
      "https://nitter.net",
      "https://nitter.privacydev.net",
      "https://nitter.poast.org",
    ];

    for (const instance of nitterInstances) {
      try {
        const response = await fetch(`${instance}/`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const html = await response.text();
          const topics = parseTrendsFromNitter(html);
          if (topics.length > 0) {
            return NextResponse.json({ topics: topics.slice(0, 10), source: "nitter" });
          }
        }
      } catch {
        // Try next instance
        continue;
      }
    }

    // Method 2: Try using trends24.in which aggregates Twitter/X trends
    try {
      const trends24Response = await fetch("https://trends24.in/united-states/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (trends24Response.ok) {
        const html = await trends24Response.text();
        const topics = parseTrendsFromTrends24(html);
        if (topics.length > 0) {
          return NextResponse.json({ topics: topics.slice(0, 10), source: "trends24" });
        }
      }
    } catch (e) {
      console.error("trends24 error:", e);
    }

    // Method 3: Try getdaytrends.com
    try {
      const getdaytrendsResponse = await fetch("https://getdaytrends.com/united-states/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (getdaytrendsResponse.ok) {
        const html = await getdaytrendsResponse.text();
        const topics = parseTrendsFromGetdaytrends(html);
        if (topics.length > 0) {
          return NextResponse.json({ topics: topics.slice(0, 10), source: "getdaytrends" });
        }
      }
    } catch (e) {
      console.error("getdaytrends error:", e);
    }

    // Method 4: Use Claude API as a fallback with web search prompt
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `Today is ${today}. Based on current events and what's likely being discussed on social media right now, generate a realistic list of 10 trending topics that would be popular on X (Twitter) in the United States today.

Consider:
- Current news events
- Sports games happening today
- Entertainment and celebrity news
- Political developments
- Tech and business news
- Viral moments and memes

Return ONLY a JSON array with this format (no markdown, no explanation):
[{"topic": "Topic Name", "description": "Brief reason why it's trending"}]`
              }
            ],
            temperature: 0.7,
          }),
        });

        if (claudeResponse.ok) {
          const data = await claudeResponse.json();
          const content = data.content?.[0]?.text || "";

          try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const topics: TrendingTopic[] = parsed.slice(0, 10).map((item: { topic: string; description?: string }) => ({
                topic: item.topic,
                description: item.description,
                searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.topic)}&tbm=nws`,
              }));
              return NextResponse.json({ topics, source: "claude" });
            }
          } catch {
            // Parse error
          }
        }
      } catch (e) {
        console.error("Claude API error:", e);
      }
    }

    // Final fallback: Return empty
    return NextResponse.json({
      topics: [],
      source: "none",
      error: "Unable to fetch X trending topics. Please try again later."
    });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trending topics", topics: [] },
      { status: 500 }
    );
  }
}

function parseTrendsFromNitter(html: string): TrendingTopic[] {
  const topics: TrendingTopic[] = [];

  // Look for trending items in various Nitter HTML structures
  const patterns = [
    /<a[^>]*href="\/search\?q=([^"]+)"[^>]*class="[^"]*trend[^"]*"[^>]*>([^<]+)<\/a>/gi,
    /<li[^>]*class="[^"]*trend[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi,
    /<span[^>]*class="[^"]*trend-name[^"]*"[^>]*>([^<]+)<\/span>/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && topics.length < 20) {
      const topic = match[2] || match[1];
      if (topic && !topics.some(t => t.topic === topic)) {
        topics.push({
          topic: topic.trim(),
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(topic.trim())}&tbm=nws`,
        });
      }
    }
  }

  return topics;
}

function parseTrendsFromTrends24(html: string): TrendingTopic[] {
  const topics: TrendingTopic[] = [];

  // trends24.in uses various structures
  const trendRegex = /<a[^>]*class="[^"]*trend-link[^"]*"[^>]*>([^<]+)<\/a>/gi;
  const altRegex = /<span[^>]*class="[^"]*trend-name[^"]*"[^>]*>([^<]+)<\/span>/gi;
  const listRegex = /<li[^>]*>[\s\S]*?<a[^>]*href="[^"]*twitter\.com\/search[^"]*"[^>]*>([^<]+)<\/a>/gi;

  let match;
  while ((match = trendRegex.exec(html)) !== null && topics.length < 20) {
    const topic = match[1].trim();
    if (topic && !topics.some(t => t.topic === topic)) {
      topics.push({
        topic,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(topic)}&tbm=nws`,
      });
    }
  }

  if (topics.length === 0) {
    while ((match = altRegex.exec(html)) !== null && topics.length < 20) {
      const topic = match[1].trim();
      if (topic && !topics.some(t => t.topic === topic)) {
        topics.push({
          topic,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(topic)}&tbm=nws`,
        });
      }
    }
  }

  if (topics.length === 0) {
    while ((match = listRegex.exec(html)) !== null && topics.length < 20) {
      const topic = match[1].trim();
      if (topic && !topics.some(t => t.topic === topic)) {
        topics.push({
          topic,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(topic)}&tbm=nws`,
        });
      }
    }
  }

  return topics;
}

function parseTrendsFromGetdaytrends(html: string): TrendingTopic[] {
  const topics: TrendingTopic[] = [];

  // getdaytrends.com format
  const trendRegex = /<a[^>]*href="\/[^"]*\/trend\/([^"]+)"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi;
  const altRegex = /<td[^>]*class="[^"]*main[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;

  let match;
  while ((match = trendRegex.exec(html)) !== null && topics.length < 20) {
    const topic = (match[2] || match[1]).trim();
    if (topic && !topics.some(t => t.topic === topic)) {
      topics.push({
        topic,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(topic)}&tbm=nws`,
      });
    }
  }

  if (topics.length === 0) {
    while ((match = altRegex.exec(html)) !== null && topics.length < 20) {
      const topic = match[1].trim();
      if (topic && topic !== "Trends" && !topics.some(t => t.topic === topic)) {
        topics.push({
          topic,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(topic)}&tbm=nws`,
        });
      }
    }
  }

  return topics;
}
