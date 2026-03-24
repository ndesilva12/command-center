import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Increase body size limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

// GET - List all images
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('public_pictures').orderBy('uploadedAt', 'desc').get();
    
    const pictures = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ pictures });
  } catch (error) {
    console.error('Error fetching pictures:', error);
    return NextResponse.json({ error: 'Failed to fetch pictures' }, { status: 500 });
  }
}

// POST - Upload images (stores as base64 in Firestore)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const title = formData.get('title') as string || '';
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 900 * 1024; // 900KB max per image (Firestore doc limit ~1MB)
    const uploadedPictures = [];
    const skipped = [];
    
    const db = getAdminDb();
    
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        skipped.push(`${file.name}: invalid type`);
        continue;
      }
      
      if (file.size > maxSize) {
        skipped.push(`${file.name}: too large (max 900KB)`);
        continue;
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      const docRef = await db.collection('public_pictures').add({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
      
      uploadedPictures.push({
        id: docRef.id,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }
    
    if (uploadedPictures.length === 0) {
      const reason = skipped.length > 0 ? skipped.join(', ') : 'No valid images';
      return NextResponse.json({ error: reason }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      pictures: uploadedPictures,
      count: uploadedPictures.length,
      skipped: skipped.length > 0 ? skipped : undefined,
    });
  } catch (error) {
    console.error('Error uploading pictures:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Upload failed: ${errorMessage}` }, { status: 500 });
  }
}

// DELETE - Remove an image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'No image ID provided' }, { status: 400 });
    }
    
    const db = getAdminDb();
    const docRef = db.collection('public_pictures').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    await docRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting picture:', error);
    return NextResponse.json({ error: 'Failed to delete picture' }, { status: 500 });
  }
}
