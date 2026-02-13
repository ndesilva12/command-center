import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const COLLECTION_ROOT = 'relationship_intel_projects';
const WORKSPACE_PATH = '/home/ubuntu/.openclaw/workspace/relationships';

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
    
    // Check for discovered data in workspace JSON file
    const jsonPath = path.join(WORKSPACE_PATH, `${projectId}.json`);
    if (fs.existsSync(jsonPath)) {
      // Import discovered contacts into Firestore
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      
      if (jsonData.contacts && Array.isArray(jsonData.contacts)) {
        const batch = adminDb.batch();
        
        for (const contact of jsonData.contacts) {
          const contactRef = projectRef.collection('contacts').doc(contact.email);
          batch.set(contactRef, {
            ...contact,
            lastContact: Timestamp.fromDate(new Date(contact.lastContact)),
            firstContact: Timestamp.fromDate(new Date(contact.firstContact)),
          });
        }
        
        // Update project's lastDiscovery timestamp
        batch.update(projectRef, { 
          lastDiscovery: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        await batch.commit();
        
        // Delete the JSON file after importing
        fs.unlinkSync(jsonPath);
      }
    }
    
    // Get all contacts from Firestore
    const contactsSnapshot = await projectRef.collection('contacts').get();
    const contacts = contactsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        email: doc.id,
        name: data.name,
        company: data.company,
        title: data.title,
        emailThreads: data.emailThreads || [],
        calendarEvents: data.calendarEvents || [],
        lastContact: toDate(data.lastContact).toISOString(),
        firstContact: toDate(data.firstContact).toISOString(),
        interactionCount: data.interactionCount || 0,
        needsFollowUp: data.needsFollowUp || false,
        urgencyScore: data.urgencyScore || 0,
        notes: data.notes || '',
      };
    });

    // Calculate summary stats
    const summary = {
      totalContacts: contacts.length,
      needsFollowUp: contacts.filter(c => c.needsFollowUp).length,
      avgUrgency: contacts.length > 0 
        ? contacts.reduce((sum, c) => sum + c.urgencyScore, 0) / contacts.length 
        : 0,
    };

    return NextResponse.json({
      project: {
        id: projectId,
        name: projectData?.name,
        description: projectData?.description,
        createdAt: toDate(projectData?.createdAt).toISOString(),
        updatedAt: toDate(projectData?.updatedAt).toISOString(),
        keywords: projectData?.keywords || [],
        dateFrom: projectData?.dateFrom,
        contactCount: contacts.length,
        needsFollowUp: summary.needsFollowUp,
        lastDiscovery: projectData?.lastDiscovery ? toDate(projectData.lastDiscovery).toISOString() : null,
      },
      contacts,
      summary,
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
