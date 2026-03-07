import { NextRequest, NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  relativeTime: string;
}

interface NewsResponse {
  location: string;
  items: NewsItem[];
  lastUpdated: string;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

function parseRSSItem(itemXml: string): NewsItem | null {
  const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
  const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
  const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);
  const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);

  const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
  const link = linkMatch ? linkMatch[1].trim() : '';
  const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
  const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

  if (!title || !link) return null;

  return {
    title,
    link,
    source,
    pubDate,
    relativeTime: pubDate ? getRelativeTime(pubDate) : ''
  };
}

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const parsed = parseRSSItem(match[1]);
    if (parsed) items.push(parsed);
  }

  return items;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feed = searchParams.get('feed') || 'top'; // top, local, topic
  const location = searchParams.get('location') || 'Wellesley Massachusetts';
  const topic = searchParams.get('topic') || '';
  const limit = parseInt(searchParams.get('limit') || '6', 10);

  try {
    let rssUrl: string;
    let feedLabel: string;

    if (feed === 'top') {
      // Top Stories - main Google News feed
      rssUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
      feedLabel = 'Top Stories';
    } else if (feed === 'topic' && topic) {
      // Topic-based feed (business, technology, sports, etc.)
      rssUrl = `https://news.google.com/rss/topics/${topic}?hl=en-US&gl=US&ceid=US:en`;
      feedLabel = topic.charAt(0).toUpperCase() + topic.slice(1);
    } else {
      // Local search
      const query = encodeURIComponent(location);
      rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
      feedLabel = location;
    }

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    const allItems = parseRSS(xml);
    const items = allItems.slice(0, limit);

    const result: NewsResponse = {
      location: feedLabel,
      items,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', location: 'Unknown', items: [] },
      { status: 500 }
    );
  }
}
