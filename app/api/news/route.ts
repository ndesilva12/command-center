import { NextRequest, NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  relativeTime: string;
  image?: string;
  isFeatured?: boolean;
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

function parseGoogleRSSItem(itemXml: string): NewsItem | null {
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

function parseZeroHedgeRSSItem(itemXml: string): NewsItem | null {
  const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
  const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
  const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
  const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);

  const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&') : '';
  const link = linkMatch ? linkMatch[1].trim() : '';
  const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
  
  // Extract first image from description
  let image: string | undefined;
  if (descMatch) {
    const imgMatch = descMatch[1].match(/src="(https:\/\/assets\.zerohedge\.com[^"]+)"/);
    if (imgMatch) {
      image = imgMatch[1];
    }
  }

  if (!title || !link) return null;

  return {
    title,
    link,
    source: 'ZeroHedge',
    pubDate,
    relativeTime: pubDate ? getRelativeTime(pubDate) : '',
    image
  };
}

function parseGoogleRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const parsed = parseGoogleRSSItem(match[1]);
    if (parsed) items.push(parsed);
  }

  return items;
}

function parseZeroHedgeRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const parsed = parseZeroHedgeRSSItem(match[1]);
    if (parsed) items.push(parsed);
  }

  return items;
}

async function getFeaturedZeroHedgeSlug(): Promise<string | null> {
  try {
    const response = await fetch('https://www.zerohedge.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      next: { revalidate: 300 }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    // Find first article link (featured/pinned) - must be a content category, not /contributors/
    // ZH categories: geopolitical, economics, markets, political, technology, health, crypto, etc.
    const articleMatch = html.match(/href="\/(geopolitical|economics|markets|political|technology|health|crypto|news|energy|commodities|military|personal-finance|entertainment|ai)\/([a-z0-9-]+)"/);
    if (articleMatch) {
      return `/${articleMatch[1]}/${articleMatch[2]}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feed = searchParams.get('feed') || 'zerohedge';
  const location = searchParams.get('location') || 'Wellesley Massachusetts';
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  try {
    let items: NewsItem[] = [];
    let feedLabel = 'News';

    if (feed === 'zerohedge') {
      // Fetch ZeroHedge RSS
      const rssUrl = 'https://cms.zerohedge.com/fullrss2.xml';
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status}`);
      }

      const xml = await response.text();
      const allItems = parseZeroHedgeRSS(xml);
      
      // Get featured article slug from homepage
      const featuredSlug = await getFeaturedZeroHedgeSlug();
      
      // Mark featured article and reorder
      if (featuredSlug) {
        const featuredIndex = allItems.findIndex(item => item.link.includes(featuredSlug));
        if (featuredIndex > 0) {
          // Move featured to top
          const [featured] = allItems.splice(featuredIndex, 1);
          featured.isFeatured = true;
          allItems.unshift(featured);
        } else if (featuredIndex === 0) {
          allItems[0].isFeatured = true;
        }
      }
      
      items = allItems.slice(0, limit);
      feedLabel = 'ZeroHedge';
      
    } else if (feed === 'local') {
      // Local Google News search with when:1d
      const query = encodeURIComponent(location + ' when:1d');
      const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
      feedLabel = location;

      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status}`);
      }

      const xml = await response.text();
      const allItems = parseGoogleRSS(xml);
      
      // Sort by date and take limit
      const sortedItems = allItems.sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateB - dateA;
      });
      
      items = sortedItems.slice(0, limit);
    }

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
