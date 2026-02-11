import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = adminDb.collection('recommendations').orderBy('created_at', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    if (category && category !== 'all') {
      query = query.where('category', '==', category) as any;
    }

    const snapshot = await query.limit(200).get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toMillis?.() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toMillis?.() || doc.data().updated_at,
      completed_at: doc.data().completed_at?.toMillis?.() || doc.data().completed_at,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recommender, item, category, url, notes } = await request.json();

    if (!item?.trim()) {
      return NextResponse.json(
        { error: 'Item is required' },
        { status: 400 }
      );
    }

    const newItem = {
      recommender: recommender?.trim() || '',
      item: item.trim(),
      category: category || 'other',
      url: url?.trim() || '',
      notes: notes?.trim() || '',
      status: 'new',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      completed_at: null,
    };

    const docRef = await adminDb.collection('recommendations').add(newItem);

    return NextResponse.json({
      id: docRef.id,
      ...newItem,
      created_at: newItem.created_at.toMillis(),
      updated_at: newItem.updated_at.toMillis(),
    });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
}
