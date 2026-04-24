import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const doc = await adminDb.collection('x_oauth_tokens').doc('primary').get();
    
    if (!doc.exists) {
      return NextResponse.json({ connected: false });
    }

    const data = doc.data();
    const expiresAt = data?.expires_at?.toDate?.() || new Date(data?.expires_at);
    const isExpired = expiresAt < new Date();

    return NextResponse.json({
      connected: true,
      username: data?.username,
      name: data?.name,
      user_id: data?.user_id,
      expires_at: expiresAt.toISOString(),
      is_expired: isExpired,
      has_refresh_token: !!data?.refresh_token,
    });
  } catch (error) {
    console.error('X status check error:', error);
    return NextResponse.json({ connected: false, error: 'Failed to check status' });
  }
}
