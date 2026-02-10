import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

async function getValidAccessToken(tokens: any): Promise<string> {
  if (!tokens.expires_at || Date.now() < tokens.expires_at) {
    return tokens.access_token;
  }

  // Refresh the token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function fetchGoogleContacts(accessToken: string): Promise<any[]> {
  let allContacts: any[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.append('personFields', 'names,emailAddresses,phoneNumbers,photos,organizations,addresses,birthdays');
    url.searchParams.append('pageSize', '1000'); // Maximum allowed by Google API
    if (nextPageToken) {
      url.searchParams.append('pageToken', nextPageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json();
    if (data.connections && data.connections.length > 0) {
      allContacts = allContacts.concat(data.connections);
    }
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return allContacts;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get('account');

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    if (!accountsCookie || !accountsCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const accountEmails: string[] = JSON.parse(accountsCookie.value);

    if (accountEmails.length === 0) {
      return NextResponse.json({ error: 'No Google accounts connected' }, { status: 401 });
    }

    // Fetch contacts from all accounts (or specific account if requested)
    const accountsToFetch = account ? accountEmails.filter(email => email === account) : accountEmails;

    const contactsFromAllAccounts = await Promise.all(
      accountsToFetch.map(async (email) => {
        try {
          const accountId = email.replace(/[^a-zA-Z0-9@.]/g, "_");
          const doc = await adminDb.collection("google-accounts").doc(accountId).get();

          if (!doc.exists) {
            return { contacts: [], account: { email, name: email } };
          }

          const data = doc.data();
          const tokens = {
            access_token: data?.access_token,
            refresh_token: data?.refresh_token,
            expires_at: data?.expires_at,
          };

          const accessToken = await getValidAccessToken(tokens);
          const contacts = await fetchGoogleContacts(accessToken);

          return {
            contacts: contacts.map(contact => ({
              id: contact.resourceName,
              name: contact.names?.[0]?.displayName || 'Unknown',
              email: contact.emailAddresses?.[0]?.value,
              phone: contact.phoneNumbers?.[0]?.value,
              photo: contact.photos?.[0]?.url,
              organization: contact.organizations?.[0]?.name,
              title: contact.organizations?.[0]?.title,
              accountEmail: data?.email,
              accountName: data?.name,
            })),
            account: {
              email: data?.email,
              name: data?.name,
            },
          };
        } catch (error) {
          console.error(`Error fetching contacts for ${email}:`, error);
          return { contacts: [], account: { email, name: email } };
        }
      })
    );

    // Merge all contacts and sort alphabetically
    const allContacts = contactsFromAllAccounts.flatMap(result => result.contacts);
    allContacts.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      contacts: allContacts,
      accounts: contactsFromAllAccounts.map(r => r.account),
    });
  } catch (error) {
    console.error('Contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
