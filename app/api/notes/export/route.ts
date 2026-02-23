import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import JSZip from 'jszip';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('notes')
      .orderBy('updatedAt', 'desc')
      .get();

    const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (notes.length === 0) {
      return NextResponse.json({ error: 'No notes to export' }, { status: 404 });
    }

    // Create ZIP file
    const zip = new JSZip();

    // Group notes by folder
    const folderMap: Record<string, any[]> = {};
    notes.forEach((note: any) => {
      const folder = note.folder || 'inbox';
      if (!folderMap[folder]) folderMap[folder] = [];
      folderMap[folder].push(note);
    });

    // Add notes to ZIP, organized by folder
    Object.entries(folderMap).forEach(([folder, folderNotes]) => {
      folderNotes.forEach((note: any) => {
        const createdDate = new Date(note.createdAt);
        const updatedDate = new Date(note.updatedAt);

        // Build markdown content with frontmatter
        let content = '---\n';
        content += `title: "${note.title.replace(/"/g, '\\"')}"\n`;
        content += `created: ${createdDate.toISOString()}\n`;
        content += `updated: ${updatedDate.toISOString()}\n`;
        if (note.tags && note.tags.length > 0) {
          content += `tags: [${note.tags.map((t: string) => `"${t}"`).join(', ')}]\n`;
        }
        content += `folder: ${folder}\n`;
        content += '---\n\n';
        content += `# ${note.title}\n\n`;
        content += note.content || '';

        // Sanitize filename (remove special chars)
        const safeTitle = note.title
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
        
        const timestamp = createdDate.toISOString().split('T')[0];
        const filename = `${timestamp}-${safeTitle}.md`;

        // Add to appropriate folder in ZIP
        zip.folder(folder)?.file(filename, content);
      });
    });

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Return as downloadable file
    const timestamp = new Date().toISOString().split('T')[0];
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="command-center-notes-${timestamp}.zip"`,
      },
    });
  } catch (error) {
    console.error('Notes export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export notes' },
      { status: 500 }
    );
  }
}
