import { NextRequest, NextResponse } from 'next/server';

const MINIFLUX_BASE_URL = process.env.MINIFLUX_BASE_URL || 'http://localhost:8080';
const MINIFLUX_API_KEY = process.env.MINIFLUX_API_KEY || '';

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
        site_url: feed.site_url,
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Miniflux API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
