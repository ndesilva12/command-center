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

// GET - List all projects
export async function GET(request: NextRequest) {
  try {
    const projectsRef = adminDb.collection(COLLECTION_ROOT);
    const snapshot = await projectsRef.get();

    const projects = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Count contacts in this project
        const contactsSnapshot = await doc.ref.collection('contacts').get();
        
        // Count contacts needing follow-up
        const needsFollowUpCount = contactsSnapshot.docs.filter(
          contact => contact.data().needsFollowUp === true
        ).length;

        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          createdAt: toDate(data.createdAt).toISOString(),
          updatedAt: toDate(data.updatedAt).toISOString(),
          keywords: data.keywords || [],
          dateFrom: data.dateFrom,
          contactCount: contactsSnapshot.size,
          needsFollowUp: needsFollowUpCount,
          lastDiscovery: data.lastDiscovery ? toDate(data.lastDiscovery).toISOString() : null,
        };
      })
    );

    // Sort by most recently updated
    projects.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const { name, description, keywords, dateFrom } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project ID from name (add timestamp to ensure uniqueness)
    const timestamp = Date.now();
    const projectId = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${timestamp}`;

    const projectData = {
      name: name.trim(),
      description: description?.trim() || null,
      keywords: keywords || [],
      dateFrom: dateFrom || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastDiscovery: null,
    };

    await adminDb
      .collection(COLLECTION_ROOT)
      .doc(projectId)
      .set(projectData);

    return NextResponse.json({
      projectId,
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
