import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// L3D server runs on EC2 (port 18790)
const L3D_SERVER_URL = process.env.L3D_SERVER_URL || 'http://3.141.47.151:18790';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, mode = 'balanced', days = 30 } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create a "running" record immediately in Firestore
    const docRef = await adminDb.collection('l3d_history').add({
      query: topic.trim(),
      mode,
      days,
      status: 'running',
      timestamp: Timestamp.now(),
      userId: 'default',
    });

    // Trigger L3D server on EC2 (fire and forget)
    fetch(L3D_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic.trim(),
        mode,
        days,
        docId: docRef.id,
      }),
    }).catch(err => {
      console.error('Failed to trigger L3D server:', err);
      // Update Firestore with error
      adminDb.collection('l3d_history').doc(docRef.id).update({
        status: 'failed',
        error: 'Failed to start research on EC2',
        completed_at: Timestamp.now(),
      });
    });

    // Return immediately with success
    return NextResponse.json({
      success: true,
      message: 'Research started',
      id: docRef.id,
    });

  } catch (error) {
    console.error('Error starting L3D research:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
