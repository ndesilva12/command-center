import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// For now, we'll use a single user ID. In the future, this would come from auth
const DEFAULT_USER_ID = 'default';

export async function GET() {
  try {
    const doc = await adminDb
      .collection('user-settings')
      .doc(DEFAULT_USER_ID)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ customizations: {} });
    }

    const data = doc.data();
    return NextResponse.json({
      customizations: data?.toolCustomizations || {},
    });
  } catch (error) {
    console.error('Error fetching tool settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || typeof body.customizations !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request: customizations object required' },
        { status: 400 }
      );
    }

    const { customizations, cleanupOldTools } = body;

    // Validate customizations structure
    for (const [toolId, config] of Object.entries(customizations)) {
      const c = config as any;
      if (
        typeof c.name !== 'string' ||
        typeof c.color !== 'string' ||
        typeof c.visible !== 'boolean' ||
        typeof c.mobileVisible !== 'boolean' ||
        typeof c.order !== 'number'
      ) {
        return NextResponse.json(
          { error: `Invalid customization format for tool: ${toolId}` },
          { status: 400 }
        );
      }
    }

    const docRef = adminDb.collection('user-settings').doc(DEFAULT_USER_ID);
    
    if (cleanupOldTools) {
      // Replace entire customizations object (cleanup mode)
      await docRef.set(
        {
          toolCustomizations: customizations,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      // Get existing settings and merge (backward compatibility)
      const existingDoc = await docRef.get();
      const existingCustomizations = existingDoc.exists 
        ? (existingDoc.data()?.toolCustomizations || {})
        : {};

      // Merge new customizations with existing ones (preserving fields)
      const mergedCustomizations: Record<string, any> = { ...existingCustomizations };
      for (const [toolId, config] of Object.entries(customizations)) {
        mergedCustomizations[toolId] = {
          ...(existingCustomizations[toolId] || {}),
          ...(config as Record<string, any>),
        };
      }

      await docRef.set(
        {
          toolCustomizations: mergedCustomizations,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving tool settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
