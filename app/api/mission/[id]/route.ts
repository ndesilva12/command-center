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

    await adminDb.collection('missions').doc(id).update({
      ...updates,
      updated_at: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating mission:', error);
    return NextResponse.json(
      { error: 'Failed to update mission' },
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
    await adminDb.collection('missions').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json(
      { error: 'Failed to delete mission' },
      { status: 500 }
    );
  }
}
