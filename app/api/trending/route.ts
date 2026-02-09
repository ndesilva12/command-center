import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch Google Trends (simplified - using mock data for now)
    const googleTrends = [
      { title: "Tech News", searchUrl: "https://www.google.com/search?q=tech+news&tbm=nws" },
      { title: "AI Development", searchUrl: "https://www.google.com/search?q=ai+development&tbm=nws" },
      { title: "Climate Change", searchUrl: "https://www.google.com/search?q=climate+change&tbm=nws" },
      { title: "Economic Updates", searchUrl: "https://www.google.com/search?q=economic+updates&tbm=nws" },
    ];

    // Fetch X/Twitter Trends (simplified - using mock data for now)
    const xTrends = [
      { topic: "Breaking News", searchUrl: "https://x.com/search?q=breaking+news" },
      { topic: "Tech Innovation", searchUrl: "https://x.com/search?q=tech+innovation" },
      { topic: "Sports Highlights", searchUrl: "https://x.com/search?q=sports+highlights" },
      { topic: "Entertainment", searchUrl: "https://x.com/search?q=entertainment" },
    ];

    return NextResponse.json({
      trends: googleTrends,
      topics: xTrends,
    });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending topics", trends: [], topics: [] },
      { status: 500 }
    );
  }
}
