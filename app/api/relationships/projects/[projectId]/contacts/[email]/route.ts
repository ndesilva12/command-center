import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const COLLECTION_ROOT = 'relationship_intel_projects';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; email: string }> }
) {
  try {
    const { projectId, email } = await params;
    const decodedEmail = decodeURIComponent(email);
    
    const projectRef = adminDb.collection(COLLECTION_ROOT).doc(projectId);
    
    // Delete contact from contacts collection
    await projectRef.collection('contacts').doc(decodedEmail).delete();
    
    // Add to blacklist
    await projectRef.collection('blacklist').doc(decodedEmail).set({
      email: decodedEmail,
      removedAt: Timestamp.now(),
    });
    
    // Update project timestamp
    await projectRef.update({
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Contact removed and blacklisted' 
    });
  } catch (error) {
    console.error('Error removing contact:', error);
    return NextResponse.json(
      { error: 'Failed to remove contact' },
      { status: 500 }
    );
  }
}
