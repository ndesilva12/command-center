import { NextResponse } from "next/server";

export interface TrendingTopic {
  topic: string;
  description?: string;
  searchUrl: string;
}

// In-memory cache with 5-minute TTL
let cachedTopics: TrendingTopic[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
      timeoutSeconds: 20, // Reduced from 30
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
    // Check cache first
    const now = Date.now();
    if (cachedTopics && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({ 
        topics: cachedTopics, 
        source: "cache",
        cached: true 
      });
    }

    // Try scraping methods in parallel with Promise.race for first success
    const scrapingAttempts = [
      // Method 1: trends24.in
      (async () => {
        const response = await fetch("https://trends24.in/united-states/", {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(3000), // Reduced from 8000ms
        });

        if (response.ok) {
          const html = await response.text();
          const topics = parseTrendsFromTrends24(html);
          if (topics.length > 0) {
            return { topics: topics.slice(0, 10), source: "trends24" };
          }
        }
        throw new Error("trends24 failed");
      })(),

      // Method 2: getdaytrends.com
      (async () => {
        const response = await fetch("https://getdaytrends.com/united-states/", {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(3000), // Reduced from 8000ms
        });

        if (response.ok) {
          const html = await response.text();
          const topics = parseTrendsFromGetdaytrends(html);
          if (topics.length > 0) {
            return { topics: topics.slice(0, 10), source: "getdaytrends" };
          }
        }
        throw new Error("getdaytrends failed");
      })(),

      // Method 3: Try one Nitter instance (reduced from multiple)
      (async () => {
        const response = await fetch("https://nitter.poast.org/", {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(3000), // Reduced from 5000ms
        });

        if (response.ok) {
          const html = await response.text();
          const topics = parseTrendsFromNitter(html);
          if (topics.length > 0) {
            return { topics: topics.slice(0, 10), source: "nitter" };
          }
        }
        throw new Error("nitter failed");
      })(),
    ];

    // Race all scraping methods - use the first one that succeeds
    try {
      const result = await Promise.any(scrapingAttempts);
      // Cache the results
      cachedTopics = result.topics;
      cacheTimestamp = now;
      return NextResponse.json(result);
    } catch (e) {
      console.error("All scraping methods failed:", e);
    }

    // Fallback: Use OpenClaw gateway (uses Norman's Anthropic subscription)
    try {
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const prompt = `Today is ${today}. Based on current events and what's likely being discussed on social media right now, generate a realistic list of 10 trending topics that would be popular on X (Twitter) in the United States today.

Consider:
- Current news events (last 4 hours if possible)
- Sports games happening today
- Entertainment and celebrity news
- Political developments
- Tech and business news
- Viral moments and memes

Return ONLY a JSON array with this format (no markdown, no explanation):
[{"topic": "Topic Name", "description": "Brief reason why it's trending"}]`;

      const content = await askOpenClaw(prompt);

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const topics: TrendingTopic[] = parsed.slice(0, 10).map((item: { topic: string; description?: string }) => ({
          topic: item.topic,
          description: item.description,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.topic)}&tbm=nws`,
        }));
        
        // Cache the results
        cachedTopics = topics;
        cacheTimestamp = now;
        return NextResponse.json({ topics, source: "openclaw" });
      }
    } catch (e) {
      console.error("OpenClaw gateway error:", e);
    }

    // Return cached data if available (even if expired)
    if (cachedTopics) {
      return NextResponse.json({
        topics: cachedTopics,
        source: "stale-cache",
      });
    }

    // Final fallback: Return empty array
    return NextResponse.json({
      topics: [],
      source: "none",
    });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    
    // Return cached data on error if available
    if (cachedTopics) {
      return NextResponse.json({
        topics: cachedTopics,
        source: "error-cache",
      });
    }
    
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
