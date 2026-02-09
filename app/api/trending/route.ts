import { NextResponse } from "next/server";

export interface TrendingTopic {
  title?: string;
  topic?: string;
  description?: string;
  searchUrl: string;
  source: "google" | "x";
}

export async function GET(request: Request) {
  try {
    // Get the base URL from the request headers for correct environment
    const { origin } = new URL(request.url);
    
    // Fetch both Google Trends and X Trending in parallel
    const [googleResponse, xResponse] = await Promise.allSettled([
      fetch(`${origin}/api/google-trends`, {
        next: { revalidate: 900 } // 15 minutes
      }),
      fetch(`${origin}/api/x-trending`, {
        next: { revalidate: 900 } // 15 minutes
      })
    ]);

    let googleTrends: TrendingTopic[] = [];
    let xTrends: TrendingTopic[] = [];

    // Process Google Trends - get ALL trends
    if (googleResponse.status === 'fulfilled' && googleResponse.value.ok) {
      const data = await googleResponse.value.json();
      googleTrends = (data.trends || []).map((t: { title: string; searchUrl: string; description?: string }) => ({
        title: t.title,
        description: t.description,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));
    }

    // Process X Trends - get ALL trends
    if (xResponse.status === 'fulfilled' && xResponse.value.ok) {
      const data = await xResponse.value.json();
      xTrends = (data.topics || []).map((t: { topic: string; searchUrl: string; description?: string }) => ({
        topic: t.topic,
        description: t.description,
        searchUrl: t.searchUrl,
        source: "x" as const,
      }));
    }

    // Return separate arrays for Google and X trends
    return NextResponse.json({
      googleTrends,
      xTrends,
      counts: {
        google: googleTrends.length,
        x: xTrends.length,
        total: googleTrends.length + xTrends.length,
      },
    });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch trending topics", 
        trends: [],
        counts: { google: 0, x: 0, total: 0 }
      },
      { status: 500 }
    );
  }
}
