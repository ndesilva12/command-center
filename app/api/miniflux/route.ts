import { NextRequest, NextResponse } from 'next/server';

const MINIFLUX_BASE_URL = process.env.MINIFLUX_BASE_URL || 'http://localhost:8080';
const MINIFLUX_API_KEY = process.env.MINIFLUX_API_KEY || '';

// Extract base URL from feed URL (protocol + hostname)
function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!MINIFLUX_API_KEY) {
      return NextResponse.json({ error: 'Miniflux API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'feeds';
    const feedId = searchParams.get('feedId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch all feeds
    if (action === 'feeds') {
      const response = await fetch(`${MINIFLUX_BASE_URL}/v1/feeds`, {
        headers: {
          'X-Auth-Token': MINIFLUX_API_KEY,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch feeds from Miniflux' },
          { status: response.status }
        );
      }

      const feeds = await response.json();
      
      // Transform to simpler format
      const simplifiedFeeds = feeds.map((feed: any) => ({
        id: feed.id,
        title: feed.title,
        site_url: feed.site_url && feed.site_url.trim() !== '' 
          ? getBaseUrl(feed.site_url)
          : getBaseUrl(feed.feed_url),
        feed_url: feed.feed_url,
        category: feed.category?.title || 'Uncategorized',
      }));

      return NextResponse.json({ feeds: simplifiedFeeds });
    }

    // Fetch entries for a specific feed
    if (action === 'entries' && feedId) {
      const response = await fetch(
        `${MINIFLUX_BASE_URL}/v1/feeds/${feedId}/entries?limit=${limit}&order=published_at&direction=desc`,
        {
          headers: {
            'X-Auth-Token': MINIFLUX_API_KEY,
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch entries from Miniflux' },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Transform entries to simpler format
      const entries = data.entries?.map((entry: any) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        content: entry.content || '',
        author: entry.author || '',
        published_at: entry.published_at,
        feed_id: entry.feed_id,
      })) || [];

      return NextResponse.json({ entries });
    }

    // Fetch categories
    if (action === 'categories') {
      const response = await fetch(`${MINIFLUX_BASE_URL}/v1/categories`, {
        headers: {
          'X-Auth-Token': MINIFLUX_API_KEY,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch categories from Miniflux' },
          { status: response.status }
        );
      }

      const categories = await response.json();
      return NextResponse.json({ categories });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Miniflux API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add a new feed
export async function POST(request: NextRequest) {
  try {
    if (!MINIFLUX_API_KEY) {
      return NextResponse.json({ error: 'Miniflux API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { feed_url, category_id } = body;

    if (!feed_url) {
      return NextResponse.json({ error: 'feed_url is required' }, { status: 400 });
    }

    const response = await fetch(`${MINIFLUX_BASE_URL}/v1/feeds`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': MINIFLUX_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feed_url,
        category_id: category_id || 1, // Default to first category
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to add feed: ${errorText}` },
        { status: response.status }
      );
    }

    const feed = await response.json();
    return NextResponse.json({ 
      success: true, 
      feed: {
        id: feed.id,
        title: feed.title,
        site_url: feed.site_url,
        feed_url: feed.feed_url,
        category: feed.category?.title || 'Uncategorized',
      }
    });

  } catch (error) {
    console.error('Miniflux add feed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Delete a feed
export async function DELETE(request: NextRequest) {
  try {
    if (!MINIFLUX_API_KEY) {
      return NextResponse.json({ error: 'Miniflux API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('feedId');

    if (!feedId) {
      return NextResponse.json({ error: 'feedId is required' }, { status: 400 });
    }

    const response = await fetch(`${MINIFLUX_BASE_URL}/v1/feeds/${feedId}`, {
      method: 'DELETE',
      headers: {
        'X-Auth-Token': MINIFLUX_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to delete feed: ${errorText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Miniflux delete feed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
