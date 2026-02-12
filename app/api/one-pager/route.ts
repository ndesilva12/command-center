import { NextRequest, NextResponse } from 'next/server';

const ONE_PAGER_SERVER = 'http://3.141.47.151:18793';

export async function POST(request: NextRequest) {
  try {
    const { topic, save = true } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic or question is required' },
        { status: 400 }
      );
    }

    // Call one-pager HTTP server on EC2
    const response = await fetch(ONE_PAGER_SERVER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        save
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`One-pager server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('One-pager error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate one-pager' },
      { status: 500 }
    );
  }
}
