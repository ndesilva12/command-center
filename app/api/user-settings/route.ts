import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// GET - Load user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }
    
    const db = getAdminDb();
    const doc = await db.collection('user_settings').doc(key).get();
    
    if (!doc.exists) {
      return NextResponse.json({ value: null });
    }
    
    return NextResponse.json({ value: doc.data()?.value });
  } catch (error) {
    console.error('Error loading user setting:', error);
    return NextResponse.json({ error: 'Failed to load setting' }, { status: 500 });
  }
}

// POST - Save user settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;
    
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }
    
    const db = getAdminDb();
    await db.collection('user_settings').doc(key).set({
      value,
      updatedAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user setting:', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}
