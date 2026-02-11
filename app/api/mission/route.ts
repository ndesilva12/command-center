import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection('missions')
      .orderBy('order', 'asc')
      .get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toMillis?.() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toMillis?.() || doc.data().updated_at,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch missions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, links } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get current max order for 'created' status
    const createdSnapshot = await adminDb
      .collection('missions')
      .where('status', '==', 'created')
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    const maxOrder = createdSnapshot.empty ? 0 : createdSnapshot.docs[0].data().order;

    const newItem = {
      title: title.trim(),
      description: description?.trim() || '',
      links: links || [],
      status: 'created',
      order: maxOrder + 1,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    const docRef = await adminDb.collection('missions').add(newItem);

    return NextResponse.json({
      id: docRef.id,
      ...newItem,
      created_at: newItem.created_at.toMillis(),
      updated_at: newItem.updated_at.toMillis(),
    });
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json(
      { error: 'Failed to create mission' },
      { status: 500 }
    );
  }
}
