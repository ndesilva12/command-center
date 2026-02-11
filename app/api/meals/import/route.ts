import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const recipes = await request.json();
    
    if (!Array.isArray(recipes)) {
      return NextResponse.json({ error: 'Expected array of recipes' }, { status: 400 });
    }

    const results = [];
    
    for (const recipe of recipes) {
      const docRef = await db.collection('meals').add({
        ...recipe,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        added_by: 'manual',
      });
      
      results.push({
        id: docRef.id,
        title: recipe.title,
      });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      recipes: results,
    });
  } catch (error: any) {
    console.error('Error importing recipes:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
