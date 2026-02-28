import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, town, email, phone, website, status, pricePerLead, notes } = body;

    if (!name || !type || !town || !email) {
      return NextResponse.json({ error: 'Missing required fields (name, type, town, email)' }, { status: 400 });
    }

    const newBusiness = {
      name,
      type,
      town,
      email,
      phone: phone || '',
      website: website || '',
      status: status || 'prospect',
      pricePerLead: pricePerLead || 25,
      totalLeadsBought: 0,
      totalRevenue: 0,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('local_leads_businesses').add(newBusiness);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error adding business:', error);
    return NextResponse.json({ error: 'Failed to add business' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing business id' }, { status: 400 });
    }

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await adminDb.collection('local_leads_businesses').doc(id).update(cleanUpdates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}
