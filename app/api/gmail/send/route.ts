import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { getValidAccessToken } from '@/lib/google-auth';
import { adminDb } from '@/lib/firebase-admin';

async function sendGmailEmail(
  accessToken: string, 
  to: string, 
  subject: string, 
  body: string, 
  from: string,
  cc?: string,
  threadId?: string,
  replyToMessageId?: string
): Promise<any> {
  try {
    // Create email in RFC 2822 format
    const emailParts = [
      `From: ${from}`,
      `To: ${to}`,
    ];
    
    if (cc) emailParts.push(`Cc: ${cc}`);
    
    emailParts.push(`Subject: ${subject}`);
    
    if (replyToMessageId) {
      emailParts.push(`In-Reply-To: ${replyToMessageId}`);
      emailParts.push(`References: ${replyToMessageId}`);
    }
    
    emailParts.push('MIME-Version: 1.0');
    emailParts.push('Content-Type: text/html; charset=utf-8');
    emailParts.push('');
    emailParts.push(body);
    
    const email = emailParts.join('\r\n');

    // Encode email as base64url
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const requestBody: any = { raw: encodedEmail };
    if (threadId) requestBody.threadId = threadId;

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email via Gmail API:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, account, cc, threadId, replyToMessageId } = body;

    // Validate
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body" },
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
    const targetEmail = account || accountEmails[0];

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

    // Send email
    const result = await sendGmailEmail(accessToken, to, subject, emailBody, targetEmail, cc, threadId, replyToMessageId);

    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
