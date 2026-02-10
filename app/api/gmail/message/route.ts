import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getValidAccessToken } from '@/lib/google-auth';
import { adminDb } from '@/lib/firebase-admin';

async function getEmailBody(accessToken: string, messageId: string): Promise<{ html: string; text: string }> {
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

    // Extract both HTML and plain text versions
    let htmlBody = '';
    let textBody = '';

    const findBodies = (part: any) => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        if (!htmlBody) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
      if (part.mimeType === 'text/plain' && part.body?.data) {
        if (!textBody) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
      if (part.parts) {
        for (const subpart of part.parts) {
          findBodies(subpart);
        }
      }
    };

    findBodies(data.payload);

    // Fallback logic
    if (!htmlBody && !textBody && data.snippet) {
      textBody = data.snippet;
      htmlBody = data.snippet.replace(/\n/g, '<br>');
    } else if (!htmlBody && textBody) {
      // Convert plain text to HTML if only text is available
      htmlBody = textBody.replace(/\n/g, '<br>');
    } else if (htmlBody && !textBody) {
      // Use HTML for text if only HTML is available (will need to be rendered)
      textBody = htmlBody.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    }

    return {
      html: htmlBody || 'No content available',
      text: textBody || 'No content available',
    };
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

    // Fetch email body (both HTML and text)
    const { html, text } = await getEmailBody(accessToken, messageId);

    return NextResponse.json({
      body: html,
      textBody: text,
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
