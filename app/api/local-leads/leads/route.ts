import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, soldTo, price } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = { status };
    
    if (status === 'sold') {
      updateData.soldTo = soldTo;
      updateData.price = price || 0;
      updateData.soldAt = new Date().toISOString();
    }

    await adminDb.collection('local_leads').doc(id).update(updateData);

    // If sold, update the business's stats
    if (status === 'sold' && soldTo) {
      const bizSnapshot = await adminDb.collection('local_leads_businesses')
        .where('name', '==', soldTo)
        .limit(1)
        .get();

      if (!bizSnapshot.empty) {
        const bizDoc = bizSnapshot.docs[0];
        const bizData = bizDoc.data();
        await bizDoc.ref.update({
          totalLeadsBought: (bizData.totalLeadsBought || 0) + 1,
          totalRevenue: (bizData.totalRevenue || 0) + (price || 0)
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
