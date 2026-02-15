import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// 1x1 transparent GIF (same technique as Superhuman, Mailchimp, HubSpot)
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Log the open asynchronously — don't block pixel delivery
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    if (adminDb) {
      await adminDb.collection('email_opens').add({
        trackingId: id,
        openedAt: Timestamp.now(),
        ip,
        userAgent: ua,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (e) {
    // Never fail — always return the pixel
    console.error('Tracking log error:', e);
  }

  // Return 1x1 transparent GIF with anti-cache headers
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
