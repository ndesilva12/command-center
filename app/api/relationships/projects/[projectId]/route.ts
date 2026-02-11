import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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

// GET - Get project details with all contacts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const projectRef = adminDb.collection(COLLECTION_ROOT).doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    
    // Get all contacts
    const contactsSnapshot = await projectRef.collection('contacts').get();
    const contacts = contactsSnapshot.docs.map(doc => ({
      email: doc.id,
      ...doc.data(),
      lastContact: toDate(doc.data().lastContact).toISOString(),
      firstContact: toDate(doc.data().firstContact).toISOString(),
    }));

    // Sort by most recent contact
    contacts.sort((a, b) => 
      new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime()
    );

    return NextResponse.json({
      project: {
        id: projectId,
        name: projectData?.name,
        createdAt: toDate(projectData?.createdAt).toISOString(),
        updatedAt: toDate(projectData?.updatedAt).toISOString(),
        keywords: projectData?.keywords || [],
        tags: projectData?.tags || [],
        contactCount: contacts.length,
      },
      contacts,
    });
  } catch (error) {
    console.error('Error getting project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const projectRef = adminDb.collection(COLLECTION_ROOT).doc(projectId);

    // Delete all contacts first
    const contactsSnapshot = await projectRef.collection('contacts').get();
    const batch = adminDb.batch();
    contactsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete project
    await projectRef.delete();

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
