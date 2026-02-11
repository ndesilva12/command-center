import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // If stage is being updated, add to history
    if (updates.stage) {
      const doc = await adminDb.collection('investors').doc(id).get();
      const currentData = doc.data();
      
      if (currentData && currentData.stage !== updates.stage) {
        const historyEntry = {
          timestamp: Timestamp.now(),
          from: currentData.stage,
          to: updates.stage,
          note: updates.historyNote || '',
        };
        
        updates.history = [...(currentData.history || []), historyEntry];
        delete updates.historyNote; // Remove temporary field
      }
    }

    await adminDb.collection('investors').doc(id).update({
      ...updates,
      updated_at: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating investor:', error);
    return NextResponse.json(
      { error: 'Failed to update investor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('investors').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting investor:', error);
    return NextResponse.json(
      { error: 'Failed to delete investor' },
      { status: 500 }
    );
  }
}
