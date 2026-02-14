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
    
    // Create summary document
    const summaryRef = await adminDb.collection('summaries').add({
      url,
      targetPages,
      status: 'processing',
      title: new URL(url).hostname,
      createdAt: new Date().toISOString(),
    });
    
    // TODO: Trigger background job to actually process the summary
    // For now, we'll just mark it as processing
    // In production, this would call an AI service to summarize the content
    
    return NextResponse.json({ 
      success: true, 
      id: summaryRef.id,
      message: 'Summary request created. Processing will begin shortly.' 
    });
  } catch (error) {
    console.error('Error creating summary:', error);
    return NextResponse.json(
      { error: 'Failed to create summary request' },
      { status: 500 }
    );
  }
}
