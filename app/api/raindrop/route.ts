import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const raindropToken = cookieStore.get('raindrop_access_token');

    if (!raindropToken || !raindropToken.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collection') || '0'; // 0 = All Bookmarks
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '0');
    const perpage = parseInt(searchParams.get('perpage') || '25');

    // Build API URL
    let apiUrl = `https://api.raindrop.io/rest/v1/raindrops/${collectionId}`;
    const params = new URLSearchParams({
      perpage: perpage.toString(),
      page: page.toString(),
    });

    if (search) {
      params.set('search', search);
    }

    apiUrl += `?${params.toString()}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${raindropToken.value}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Raindrop API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const raindropToken = cookieStore.get('raindrop_access_token');

    if (!raindropToken || !raindropToken.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { link, title, tags, collectionId } = body;

    if (!link) {
      return NextResponse.json({ error: 'Link is required' }, { status: 400 });
    }

    const response = await fetch('https://api.raindrop.io/rest/v1/raindrop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${raindropToken.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link,
        title,
        tags: tags || [],
        collection: collectionId ? { $id: parseInt(collectionId) } : undefined,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create bookmark' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Raindrop create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
