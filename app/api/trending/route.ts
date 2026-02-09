import { NextResponse } from "next/server";

export interface TrendingTopic {
  title?: string;
  topic?: string;
  description?: string;
  searchUrl: string;
  source: "google" | "x";
}

export async function GET() {
  try {
    // Fetch both Google Trends and X Trending in parallel
    const [googleResponse, xResponse] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google-trends`, {
        next: { revalidate: 900 } // 15 minutes
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/x-trending`, {
        next: { revalidate: 900 } // 15 minutes
      })
    ]);

    let googleTrends: TrendingTopic[] = [];
    let xTrends: TrendingTopic[] = [];

    // Process Google Trends
    if (googleResponse.status === 'fulfilled' && googleResponse.value.ok) {
      const data = await googleResponse.value.json();
      googleTrends = (data.trends || []).slice(0, 5).map((t: { title: string; searchUrl: string; description?: string }) => ({
        title: t.title,
        description: t.description,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));
    }

    // Process X Trends
    if (xResponse.status === 'fulfilled' && xResponse.value.ok) {
      const data = await xResponse.value.json();
      xTrends = (data.topics || []).slice(0, 5).map((t: { topic: string; searchUrl: string; description?: string }) => ({
        topic: t.topic,
        description: t.description,
        searchUrl: t.searchUrl,
        source: "x" as const,
      }));
    }

    // Merge and interleave trends to get exactly 10
    const merged: TrendingTopic[] = [];
    const maxLen = Math.max(googleTrends.length, xTrends.length);
    
    for (let i = 0; i < maxLen && merged.length < 10; i++) {
      if (i < googleTrends.length && merged.length < 10) {
        merged.push(googleTrends[i]);
      }
      if (i < xTrends.length && merged.length < 10) {
        merged.push(xTrends[i]);
      }
    }

    return NextResponse.json({
      trends: merged,
      counts: {
        google: googleTrends.length,
        x: xTrends.length,
        total: merged.length,
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
