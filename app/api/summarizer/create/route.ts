import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { url, targetPages } = await request.json();
    
    if (!url || !targetPages) {
      return NextResponse.json(
        { error: 'URL and target pages are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate target pages
    if (targetPages < 1 || targetPages > 100) {
      return NextResponse.json(
        { error: 'Target pages must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    // Create summary document
    const summaryRef = await adminDb.collection('summaries').add({
      url,
      targetPages,
      status: 'queued',
      title: new URL(url).hostname,
      createdAt: new Date().toISOString(),
    });
    
    // Trigger background processing
    const processUrl = `${request.nextUrl.origin}/api/summarizer/process`;
    
    // Fire-and-forget POST request to process endpoint
    fetch(processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: summaryRef.id,
        url,
        targetPages,
      }),
    }).catch(err => {
      console.error('Failed to trigger processing:', err);
    });
    
    return NextResponse.json({ 
      success: true, 
      id: summaryRef.id,
      message: 'Summary request created. Processing started.' 
    });
  } catch (error) {
    console.error('Error creating summary:', error);
    return NextResponse.json(
      { error: 'Failed to create summary request' },
      { status: 500 }
    );
  }
}
