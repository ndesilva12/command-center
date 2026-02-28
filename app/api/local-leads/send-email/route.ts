import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/gmail';
import { getValidAccessToken } from '@/lib/google-auth';

const SENDER_EMAIL = 'normancdesilva@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, emailBody } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, emailBody' }, { status: 400 });
    }

    // Get the sender's OAuth tokens from Firestore
    const accountId = SENDER_EMAIL.replace(/[^a-zA-Z0-9@.]/g, '_');
    const doc = await adminDb.collection('google-accounts').doc(accountId).get();

    if (!doc.exists) {
      return NextResponse.json({ 
        error: `Account ${SENDER_EMAIL} not authenticated. Go to CC Settings → Google Accounts and add this account.`,
        needsAuth: true,
        authUrl: '/api/auth/google'
      }, { status: 401 });
    }

    const data = doc.data();
    if (!data) {
      return NextResponse.json({ error: 'No token data found for account' }, { status: 401 });
    }

    // Get valid access token (refresh if needed)
    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };

    const accessToken = await getValidAccessToken(tokens);

    // Update the access token in Firestore if it was refreshed
    if (accessToken !== data.access_token) {
      await adminDb.collection('google-accounts').doc(accountId).update({
        access_token: accessToken,
        expires_at: Date.now() + 3600 * 1000, // 1 hour from now
      });
    }

    // Send the email
    const result = await sendEmail(
      accessToken,
      { to, subject, body: emailBody },
      SENDER_EMAIL
    );

    // Log the outreach in Firestore
    await adminDb.collection('local_leads_outreach').add({
      to,
      subject,
      sentAt: new Date().toISOString(),
      messageId: result.id,
      threadId: result.threadId,
      sender: SENDER_EMAIL,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: result.id,
      threadId: result.threadId,
      message: `Email sent to ${to}`
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send email',
      details: error.toString()
    }, { status: 500 });
  }
}
