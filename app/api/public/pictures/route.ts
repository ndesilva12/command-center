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

// POST - Upload a new image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || 'Untitled';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP' }, { status: 400 });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `public-pictures/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    // Upload to Firebase Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const blob = bucket.file(filename);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await blob.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    
    // Make the file publicly readable
    await blob.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    
    // Save metadata to Firestore
    const db = getAdminDb();
    const docRef = await db.collection('public_pictures').add({
      title,
      filename,
      url: publicUrl,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      picture: {
        id: docRef.id,
        title,
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error uploading picture:', error);
    return NextResponse.json({ error: 'Failed to upload picture' }, { status: 500 });
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
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      await bucket.file(data.filename).delete().catch(() => {});
    }
    
    // Delete from Firestore
    await docRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting picture:', error);
    return NextResponse.json({ error: 'Failed to delete picture' }, { status: 500 });
  }
}
