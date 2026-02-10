import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRecentEmails } from '@/lib/gmail';
import { getValidAccessToken } from '@/lib/google-auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const query = searchParams.get('q') || 'in:inbox';
    const all = searchParams.get('all') === 'true';
    const specificAccount = searchParams.get('account');

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

    // Filter to specific account if requested
    const accountsToFetch = specificAccount
      ? accountEmails.filter(email => email === specificAccount)
      : (all ? accountEmails : [accountEmails[0]]); // If not "all", just use first account

    if (accountsToFetch.length === 0) {
      return NextResponse.json(
        { error: 'No accounts available' },
        { status: 401 }
      );
    }

    // Fetch emails from each account
    const emailsFromAllAccounts = await Promise.all(
      accountsToFetch.map(async (email) => {
        try {
          const accountId = email.replace(/[^a-zA-Z0-9@.]/g, "_");
          const doc = await adminDb
            .collection("google-accounts")
            .doc(accountId)
            .get();

          if (!doc.exists) {
            console.error(`Account ${email} not found in Firestore`);
            return { emails: [], account: null };
          }

          const data = doc.data();
          if (!data) {
            console.error(`Account ${email} has no data`);
            return { emails: [], account: null };
          }

          // Get valid access token (will refresh if needed)
          const tokens = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
          };

          const accessToken = await getValidAccessToken(tokens);

          // Fetch emails from this account
          const emails = await getRecentEmails(accessToken, limit, query);

          // Add account info to each email
          const emailsWithAccount = emails.map(email => ({
            ...email,
            accountEmail: data.email,
            accountName: data.name,
          }));

          return {
            emails: emailsWithAccount,
            account: {
              email: data.email,
              name: data.name,
              picture: data.picture,
            },
          };
        } catch (error) {
          console.error(`Error fetching emails for ${email}:`, error);
          return { emails: [], account: null };
        }
      })
    );

    // Combine all emails from all accounts
    const allEmails = emailsFromAllAccounts.flatMap(result => result.emails);
    const allAccounts = emailsFromAllAccounts
      .map(result => result.account)
      .filter((acc): acc is NonNullable<typeof acc> => acc !== null);

    // Sort by date (most recent first)
    allEmails.sort((a, b) => parseInt(b.date) - parseInt(a.date));

    return NextResponse.json({
      emails: allEmails,
      accounts: allAccounts,
    });
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
