import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "general";

    // Use Google News RSS (free, no auth needed)
    const rssUrl = category === "general"
      ? "https://news.google.com/rss"
      : `https://news.google.com/rss/topics/${category.toUpperCase()}`;

    const response = await fetch(rssUrl, {
      next: { revalidate: 300 }, // 5 minutes
    });

    if (!response.ok) {
      throw new Error("Failed to fetch news");
    }

    const xml = await response.text();
    
    // Parse RSS XML
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const sourceRegex = /<source.*?><!\[CDATA\[(.*?)\]\]><\/source>/;

    const articles: any[] = [];
    let match;

    while ((match = itemRegex.exec(xml)) !== null && articles.length < 20) {
      const itemXml = match[1];
      const titleMatch = titleRegex.exec(itemXml);
      const linkMatch = linkRegex.exec(itemXml);
      const pubDateMatch = pubDateRegex.exec(itemXml);
      const sourceMatch = sourceRegex.exec(itemXml);

      if (titleMatch && linkMatch) {
        articles.push({
          title: titleMatch[1],
          url: linkMatch[1],
          source: sourceMatch ? sourceMatch[1] : "Google News",
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ articles, category });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}
