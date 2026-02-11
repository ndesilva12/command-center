import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const COLLECTION_ROOT = 'relationship_intel_projects';

// POST - Add new contact to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { email, name, company, title, tags, keywords, notes } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const contactData = {
      name: name?.trim() || '',
      company: company?.trim() || '',
      title: title?.trim() || '',
      tags: tags || [],
      keywords: keywords || [],
      notes: notes?.trim() || '',
      interactionCount: 0,
      firstContact: Timestamp.now(),
      lastContact: Timestamp.now(),
    };

    await adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .collection('contacts')
      .doc(email.toLowerCase().trim())
      .set(contactData);

    // Update project's updatedAt
    await adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .update({ updatedAt: Timestamp.now() });

    return NextResponse.json({
      message: 'Contact added successfully',
      contact: {
        email: email.toLowerCase().trim(),
        ...contactData,
        firstContact: contactData.firstContact.toMillis(),
        lastContact: contactData.lastContact.toMillis(),
      },
    });
  } catch (error) {
    console.error('Error adding contact:', error);
    return NextResponse.json(
      { error: 'Failed to add contact' },
      { status: 500 }
    );
  }
}
