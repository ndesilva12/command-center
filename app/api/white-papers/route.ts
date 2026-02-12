import { NextRequest, NextResponse } from 'next/server';

const WHITE_PAPERS_SERVER = 'http://3.141.47.151:18791';

export async function POST(request: NextRequest) {
  try {
    const { topic, save = true } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Call white-papers HTTP server on EC2
    const response = await fetch(WHITE_PAPERS_SERVER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        count: 10,
        save
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`White papers server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('White papers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find white papers' },
      { status: 500 }
    );
  }
}
