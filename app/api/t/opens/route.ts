import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/t/opens?ids=abc123,def456  — check which tracking IDs have been opened
// GET /api/t/opens?all=true&limit=50   — list recent opens
export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids');
  const all = request.nextUrl.searchParams.get('all');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

  if (!adminDb) {
    return NextResponse.json({ error: 'Firestore not configured' }, { status: 503 });
  }

  try {
    if (ids) {
      const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
      const opens: Record<string, any[]> = {};

      for (const id of idList) {
        const snap = await adminDb.collection('email_opens')
          .where('trackingId', '==', id)
          .limit(20)
          .get();

        const entries = snap.docs.map(d => ({
          openedAt: d.data().timestamp || d.data().openedAt?.toDate?.()?.toISOString() || '',
          ip: d.data().ip || '',
          userAgent: d.data().userAgent || '',
        })).filter(e => {
          // Filter out Gmail/Google image proxy pre-fetches
          // These fire immediately on delivery, NOT when the human opens
          // Signature: Chrome/42.0.2311.135 + Edge/12.246 from 74.125.x.x IPs
          const ua = e.userAgent.toLowerCase();
          const ip = e.ip;
          const isGmailProxy =
            ua.includes('googleimageproxy') ||
            ua.includes('feedfetcher') ||
            (ua.includes('chrome/42.0.2311') && ua.includes('edge/12.246')) ||
            (ip.startsWith('74.125.') && ua.includes('chrome/42.0'));
          return !isGmailProxy;
        });
        entries.sort((a, b) => String(b.openedAt).localeCompare(String(a.openedAt)));
        opens[id] = entries;
      }

      return NextResponse.json({ opens });
    }

    if (all) {
      const snap = await adminDb.collection('email_opens')
        .limit(limit)
        .get();

      const opens = snap.docs.map(d => ({
        trackingId: d.data().trackingId,
        openedAt: d.data().timestamp,
        ip: d.data().ip,
        userAgent: d.data().userAgent,
      }));

      return NextResponse.json({ opens });
    }

    return NextResponse.json({ error: 'Provide ?ids=... or ?all=true' }, { status: 400 });
  } catch (e) {
    console.error('Opens query error:', e);
    return NextResponse.json({ error: 'Failed to query opens' }, { status: 500 });
  }
}
