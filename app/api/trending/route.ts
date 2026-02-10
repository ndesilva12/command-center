import { NextResponse } from "next/server";

export interface TrendingTopic {
  title?: string;
  topic?: string;
  description?: string;
  searchUrl: string;
  source: "google" | "x";
}

// Timeout wrapper for fetch requests
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    // Get the base URL from the request headers for correct environment
    const { origin } = new URL(request.url);
    
    // Fetch both Google Trends and X Trending in parallel with aggressive timeouts
    const [googleResponse, xResponse] = await Promise.allSettled([
      fetchWithTimeout(
        `${origin}/api/google-trends`,
        { next: { revalidate: 300 } }, // 5 minutes cache
        4000 // 4 second timeout (reduced from no timeout)
      ),
      fetchWithTimeout(
        `${origin}/api/x-trending`,
        { next: { revalidate: 300 } }, // 5 minutes cache
        4000 // 4 second timeout (reduced from no timeout)
      )
    ]);

    let googleTrends: TrendingTopic[] = [];
    let xTrends: TrendingTopic[] = [];

    // Process Google Trends - get ALL trends
    if (googleResponse.status === 'fulfilled' && googleResponse.value.ok) {
      try {
        const data = await googleResponse.value.json();
        googleTrends = (data.trends || []).map((t: { title: string; searchUrl: string; description?: string }) => ({
          title: t.title,
          description: t.description,
          searchUrl: t.searchUrl,
          source: "google" as const,
        }));
      } catch (e) {
        console.error("Error parsing Google trends:", e);
      }
    } else {
      console.error("Google trends request failed:", googleResponse.status === 'fulfilled' ? googleResponse.value.status : 'rejected');
    }

    // Process X Trends - get ALL trends
    if (xResponse.status === 'fulfilled' && xResponse.value.ok) {
      try {
        const data = await xResponse.value.json();
        xTrends = (data.topics || []).map((t: { topic: string; searchUrl: string; description?: string }) => ({
          topic: t.topic,
          description: t.description,
          searchUrl: t.searchUrl,
          source: "x" as const,
        }));
      } catch (e) {
        console.error("Error parsing X trends:", e);
      }
    } else {
      console.error("X trends request failed:", xResponse.status === 'fulfilled' ? xResponse.value.status : 'rejected');
    }

    // Return separate arrays for Google and X trends
    // Note: Even if one fails, we still return the other
    return NextResponse.json({
      googleTrends,
      xTrends,
      counts: {
        google: googleTrends.length,
        x: xTrends.length,
        total: googleTrends.length + xTrends.length,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
      }
    });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch trending topics", 
        googleTrends: [],
        xTrends: [],
        counts: { google: 0, x: 0, total: 0 }
      },
      { status: 500 }
    );
  }
}
