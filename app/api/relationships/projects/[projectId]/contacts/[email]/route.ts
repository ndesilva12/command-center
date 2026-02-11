import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const COLLECTION_ROOT = 'relationship_intel_projects';

// Helper to convert Firestore Timestamp to Date
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value._seconds) {
    return new Date(value._seconds * 1000);
  }
  return new Date();
}

// GET - Get contact details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; email: string }> }
) {
  try {
    const { projectId, email } = await params;
    const contactRef = adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .collection('contacts')
      .doc(decodeURIComponent(email));

    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const data = contactDoc.data();

    return NextResponse.json({
      contact: {
        email: contactDoc.id,
        ...data,
        firstContact: toDate(data?.firstContact).toISOString(),
        lastContact: toDate(data?.lastContact).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// PATCH - Update contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; email: string }> }
) {
  try {
    const { projectId, email } = await params;
    const updates = await request.json();

    const contactRef = adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .collection('contacts')
      .doc(decodeURIComponent(email));

    await contactRef.update({
      ...updates,
      lastContact: Timestamp.now(),
    });

    // Update project's updatedAt
    await adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .update({ updatedAt: Timestamp.now() });

    return NextResponse.json({ message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; email: string }> }
) {
  try {
    const { projectId, email } = await params;
    
    await adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .collection('contacts')
      .doc(decodeURIComponent(email))
      .delete();

    // Update project's updatedAt
    await adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .update({ updatedAt: Timestamp.now() });

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
