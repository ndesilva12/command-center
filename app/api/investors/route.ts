import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection('investors')
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
    console.error('Error fetching investors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, firm, email, phone, linkedin, focus, notes } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get current max order for 'research' stage
    const researchSnapshot = await adminDb
      .collection('investors')
      .where('stage', '==', 'research')
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    const maxOrder = researchSnapshot.empty ? 0 : researchSnapshot.docs[0].data().order;

    const newItem = {
      name: name.trim(),
      firm: firm?.trim() || '',
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      linkedin: linkedin?.trim() || '',
      focus: focus || { stage: '', sector: '', checkSize: '' },
      notes: notes?.trim() || '',
      stage: 'research',
      history: [],
      order: maxOrder + 1,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    const docRef = await adminDb.collection('investors').add(newItem);

    return NextResponse.json({
      id: docRef.id,
      ...newItem,
      created_at: newItem.created_at.toMillis(),
      updated_at: newItem.updated_at.toMillis(),
    });
  } catch (error) {
    console.error('Error creating investor:', error);
    return NextResponse.json(
      { error: 'Failed to create investor' },
      { status: 500 }
    );
  }
}
