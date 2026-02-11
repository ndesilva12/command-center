import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('l3d_history')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis() || Date.now(),
      completed_at: doc.data().completed_at?.toMillis() || null,
    }));

    return NextResponse.json({ history: items });
  } catch (error) {
    console.error('Error fetching L3D history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', history: [] },
      { status: 500 }
    );
  }
}
