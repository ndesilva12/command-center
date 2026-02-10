import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getValidAccessToken } from '@/lib/google-auth';
import { adminDb } from '@/lib/firebase-admin';

async function getEmailBody(accessToken: string, messageId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch email: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract body from payload
    let body = '';

    const findBody = (part: any): string => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.mimeType === 'text/plain' && part.body?.data) {
        const plainText = Buffer.from(part.body.data, 'base64').toString('utf-8');
        // Convert plain text to HTML with preserved line breaks
        return plainText.replace(/\n/g, '<br>');
      }
      if (part.parts) {
        for (const subpart of part.parts) {
          const found = findBody(subpart);
          if (found) return found;
        }
      }
      return '';
    };

    body = findBody(data.payload);

    // Fallback to snippet if no body found
    if (!body && data.snippet) {
      body = data.snippet;
    }

    return body || 'No content available';
  } catch (error) {
    console.error('Error fetching email body:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    const accountEmail = searchParams.get('account');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    if (!accountsCookie || !accountsCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      );
    }

    let accountEmails: string[] = [];
    try {
      accountEmails = JSON.parse(accountsCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Use specified account or first available
    const targetEmail = accountEmail || accountEmails[0];

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'No accounts available' },
        { status: 401 }
      );
    }

    // Fetch account from Firestore
    const accountId = targetEmail.replace(/[^a-zA-Z0-9@.]/g, "_");
    const doc = await adminDb.collection("google-accounts").doc(accountId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    if (!data) {
      return NextResponse.json(
        { error: 'Account data not available' },
        { status: 404 }
      );
    }

    // Get valid access token
    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };

    const accessToken = await getValidAccessToken(tokens);

    // Fetch email body
    const body = await getEmailBody(accessToken, messageId);

    return NextResponse.json({
      body,
      messageId,
    });
  } catch (error) {
    console.error('Error fetching email message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch email message' },
      { status: 500 }
    );
  }
}
