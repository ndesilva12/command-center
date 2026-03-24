import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage, getAdminDb } from '@/lib/firebase-admin';

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

// POST - Upload images (supports multiple files)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const title = formData.get('title') as string || '';
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const uploadedPictures = [];
    
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const db = getAdminDb();
    
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        continue; // Skip invalid files
      }
      
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `public-pictures/${timestamp}-${randomStr}.${ext}`;
      
      const blob = bucket.file(filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Save file with public read access
      await blob.save(buffer, {
        metadata: {
          contentType: file.type,
        },
        public: true,
      });
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      
      // Save metadata to Firestore
      const docRef = await db.collection('public_pictures').add({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        filename,
        url: publicUrl,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
      
      uploadedPictures.push({
        id: docRef.id,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
      });
    }
    
    if (uploadedPictures.length === 0) {
      return NextResponse.json({ error: 'No valid images to upload' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      pictures: uploadedPictures,
      count: uploadedPictures.length,
    });
  } catch (error) {
    console.error('Error uploading pictures:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to upload: ${errorMessage}` }, { status: 500 });
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
    
    const data = doc.data();
    
    // Delete from Storage
    if (data?.filename) {
      try {
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        await bucket.file(data.filename).delete();
      } catch (e) {
        // File might not exist, continue anyway
      }
    }
    
    // Delete from Firestore
    await docRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting picture:', error);
    return NextResponse.json({ error: 'Failed to delete picture' }, { status: 500 });
  }
}
