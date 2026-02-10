import { NextResponse } from 'next/server';

// RSS Feed sources
export const RSS_FEEDS = {
  zerohedge: {
    name: 'ZeroHedge',
    url: 'https://feeds.feedburner.com/zerohedge/feed',
    category: 'finance',
  },
  mises: {
    name: 'Mises Institute',
    url: 'https://mises.org/feed/blog',
    category: 'economics',
  },
  reason: {
    name: 'Reason',
    url: 'https://reason.com/feed/',
    category: 'politics',
  },
  // Additional feeds for dropdown
  aier: {
    name: 'AIER',
    url: 'https://www.aier.org/feed/',
    category: 'economics',
  },
  fee: {
    name: 'FEE',
    url: 'https://fee.org/feed/',
    category: 'economics',
  },
  cato: {
    name: 'Cato Institute',
    url: 'https://www.cato.org/rss/blog',
    category: 'policy',
  },
  antiwar: {
    name: 'Antiwar.com',
    url: 'https://antiwar.com/blog/feed/',
    category: 'politics',
  },
  reuters: {
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/',
    category: 'news',
  },
};

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
  source: string;
}

async function parseFeed(feedUrl: string, sourceName: string): Promise<FeedItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CommandCenterRSSReader/1.0)',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }

    const xmlText = await response.text();

    // Simple RSS/Atom parser (works for most feeds)
    const items: FeedItem[] = [];

    // Match item/entry tags
    const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
    const matches = xmlText.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];

      // Extract title
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

      // Extract link
      const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i) ||
                       itemXml.match(/<link[^>]*href=["']([^"']+)["']/i);
      const link = linkMatch ? linkMatch[1].trim() : '';

      // Extract description/summary
      const descMatch = itemXml.match(/<(?:description|summary|content:encoded)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content:encoded)>/i);
      let description = descMatch ? descMatch[1].trim() : '';

      // Strip HTML tags from description
      description = description.replace(/<[^>]+>/g, '').substring(0, 300);

      // Extract pubDate
      const dateMatch = itemXml.match(/<(?:pubDate|published|updated)[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:pubDate|published|updated)>/i);
      const pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

      // Extract image if available
      const imgMatch = itemXml.match(/<(?:media:thumbnail|media:content|enclosure)[^>]*url=["']([^"']+)["']/i) ||
                      description.match(/<img[^>]+src=["']([^"']+)["']/i);
      const image = imgMatch ? imgMatch[1] : undefined;

      if (title && link) {
        items.push({
          title,
          link,
          description,
          pubDate,
          image,
          source: sourceName,
        });
      }
    }

    return items.slice(0, 20); // Limit to 20 items per feed
  } catch (error) {
    console.error(`Error parsing feed ${sourceName}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    if (source && RSS_FEEDS[source as keyof typeof RSS_FEEDS]) {
      // Fetch specific feed
      const feed = RSS_FEEDS[source as keyof typeof RSS_FEEDS];
      const items = await parseFeed(feed.url, feed.name);

      return NextResponse.json({
        items,
        source: feed.name,
      });
    } else {
      // Return list of available feeds
      return NextResponse.json({
        feeds: Object.entries(RSS_FEEDS).map(([key, feed]) => ({
          id: key,
          name: feed.name,
          category: feed.category,
        })),
      });
    }
  } catch (error) {
    console.error('RSS API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feed' },
      { status: 500 }
    );
  }
}
