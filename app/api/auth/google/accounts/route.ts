import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    if (!accountsCookie || !accountsCookie.value) {
      return NextResponse.json({ connected: false, accounts: [] }, { status: 401 });
    }

    let accountEmails: string[] = [];
    try {
      accountEmails = JSON.parse(accountsCookie.value);
    } catch {
      return NextResponse.json({ connected: false, accounts: [] }, { status: 401 });
    }

    if (accountEmails.length === 0) {
      return NextResponse.json({ connected: false, accounts: [] }, { status: 401 });
    }

    // Fetch all account data from Firestore
    const accountsData = await Promise.all(
      accountEmails.map(async (email) => {
        try {
          const accountId = email.replace(/[^a-zA-Z0-9@.]/g, "_");
          const doc = await adminDb
            .collection("google-accounts")
            .doc(accountId)
            .get();

          if (doc.exists) {
            const data = doc.data();
            return {
              email: data?.email || email,
              name: data?.name || email.split('@')[0],
              picture: data?.picture,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    const accounts = accountsData.filter((acc): acc is { email: string; name: string; picture?: string } => acc !== null);

    return NextResponse.json({
      connected: accounts.length > 0,
      accounts,
    });
  } catch (error) {
    console.error('Error fetching Google accounts:', error);
    return NextResponse.json({ connected: false, accounts: [] }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    let accountsList: string[] = [];
    if (accountsCookie && accountsCookie.value) {
      try {
        accountsList = JSON.parse(accountsCookie.value);
      } catch {
        accountsList = [];
      }
    }

    // Remove this email from the list
    accountsList = accountsList.filter(e => e !== email);

    // Delete from Firestore
    try {
      const accountId = email.replace(/[^a-zA-Z0-9@.]/g, "_");
      await adminDb
        .collection("google-accounts")
        .doc(accountId)
        .delete();
    } catch (dbError) {
      console.error('Error deleting from Firestore:', dbError);
    }

    const response = NextResponse.json({
      success: true,
      remainingAccounts: accountsList.length
    });

    // Update cookie with remaining accounts
    if (accountsList.length > 0) {
      response.cookies.set("google_accounts", JSON.stringify(accountsList), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    } else {
      // No accounts left - clear all cookies
      response.cookies.delete('google_accounts');
      response.cookies.delete('google_tokens');
      response.cookies.delete('google_user');
    }

    return response;
  } catch (error) {
    console.error('Error removing Google account:', error);
    return NextResponse.json({ error: 'Failed to remove account' }, { status: 500 });
  }
}
