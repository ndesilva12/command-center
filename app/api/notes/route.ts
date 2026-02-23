import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

interface Note {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  createdAt: number;
  updatedAt: number;
}

// GET - List all notes or search
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const folder = searchParams.get('folder');
    const tag = searchParams.get('tag');

    const db = getAdminDb();
    let notesRef = db.collection('users').doc(userId).collection('notes');
    
    // Apply filters
    if (folder && folder !== 'all') {
      notesRef = notesRef.where('folder', '==', folder) as any;
    }
    if (tag) {
      notesRef = notesRef.where('tags', 'array-contains', tag) as any;
    }

    const snapshot = await notesRef.orderBy('updatedAt', 'desc').get();
    let notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Client-side text search (Firestore doesn't have full-text search)
    if (query) {
      const lowerQuery = query.toLowerCase();
      notes = notes.filter((note: any) => 
        note.title?.toLowerCase().includes(lowerQuery) ||
        note.content?.toLowerCase().includes(lowerQuery)
      );
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Notes GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST - Create new note
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, tags = [], folder = 'inbox' } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const now = Date.now();
    const note: Note = {
      title,
      content: content || '',
      tags,
      folder,
      createdAt: now,
      updatedAt: now,
    };

    const db = getAdminDb();
    const docRef = await db
      .collection('users')
      .doc(userId)
      .collection('notes')
      .add(note);

    return NextResponse.json({ id: docRef.id, ...note });
  } catch (error) {
    console.error('Notes POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create note' },
      { status: 500 }
    );
  }
}

// PUT - Update existing note
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, tags, folder } = body;

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const updateData: Partial<Note> = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (folder !== undefined) updateData.folder = folder;

    const db = getAdminDb();
    await db
      .collection('users')
      .doc(userId)
      .collection('notes')
      .doc(id)
      .update(updateData);

    return NextResponse.json({ success: true, id, ...updateData });
  } catch (error) {
    console.error('Notes PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE - Delete note
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const db = getAdminDb();
    await db
      .collection('users')
      .doc(userId)
      .collection('notes')
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notes DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete note' },
      { status: 500 }
    );
  }
}
