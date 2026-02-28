import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Fetch leads
    const leadsSnapshot = await adminDb.collection('local_leads').orderBy('discoveredAt', 'desc').limit(500).get();
    const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch businesses
    const bizSnapshot = await adminDb.collection('local_leads_businesses').orderBy('name').get();
    const businesses = bizSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate stats
    const leadsFound = leads.length;
    const leadsSold = leads.filter((l: any) => l.status === 'sold' || l.status === 'delivered').length;
    const totalRevenue = leads
      .filter((l: any) => l.status === 'sold' || l.status === 'delivered')
      .reduce((sum: number, l: any) => sum + (l.price || 0), 0);
    const activeBusinesses = businesses.filter((b: any) => b.status === 'active').length;
    const conversionRate = leadsFound > 0 ? (leadsSold / leadsFound) * 100 : 0;

    return NextResponse.json({
      leads,
      businesses,
      stats: {
        leadsFound,
        leadsSold,
        totalRevenue,
        activeBusinesses,
        conversionRate
      }
    });
  } catch (error) {
    console.error('Error fetching local leads data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
