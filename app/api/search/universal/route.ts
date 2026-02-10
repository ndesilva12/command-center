import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getValidAccessToken } from '@/lib/google-auth';
import { adminDb } from '@/lib/firebase-admin';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: "email" | "calendar" | "contact" | "person" | "note" | "page";
  url: string;
  icon: string;
}

async function searchEmails(query: string, accessToken: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.messages) return [];

    // Fetch details for each message
    const messages = await Promise.all(
      data.messages.slice(0, 5).map(async (msg: any) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!msgResponse.ok) return null;
        const msgData = await msgResponse.json();

        const subject = msgData.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
        const from = msgData.payload?.headers?.find((h: any) => h.name === 'From')?.value || '';

        return {
          id: msg.id,
          title: subject,
          description: `From: ${from}`,
          type: 'email' as const,
          url: `/tools/emails`,
          icon: 'Mail'
        };
      })
    );

    return messages.filter((m): m is SearchResult => m !== null);
  } catch (error) {
    console.error('Error searching emails:', error);
    return [];
  }
}

async function searchCalendar(query: string, accessToken: string): Promise<SearchResult[]> {
  try {
    const now = new Date().toISOString();
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(query)}&timeMin=${now}&maxResults=5&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((event: any) => ({
      id: event.id,
      title: event.summary || 'No Title',
      description: event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : '',
      type: 'calendar' as const,
      url: `/tools/calendar`,
      icon: 'Calendar'
    }));
  } catch (error) {
    console.error('Error searching calendar:', error);
    return [];
  }
}

async function searchContacts(query: string, accessToken: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.connections) return [];

    const lowerQuery = query.toLowerCase();
    const filtered = data.connections.filter((person: any) => {
      const name = person.names?.[0]?.displayName?.toLowerCase() || '';
      const email = person.emailAddresses?.[0]?.value?.toLowerCase() || '';
      return name.includes(lowerQuery) || email.includes(lowerQuery);
    });

    return filtered.slice(0, 5).map((person: any) => ({
      id: person.resourceName,
      title: person.names?.[0]?.displayName || 'Unknown',
      description: person.emailAddresses?.[0]?.value || '',
      type: 'contact' as const,
      url: `/tools/contacts`,
      icon: 'Users'
    }));
  } catch (error) {
    console.error('Error searching contacts:', error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    if (!accountsCookie || !accountsCookie.value) {
      return NextResponse.json({ results: [] });
    }

    let accountEmails: string[] = [];
    try {
      accountEmails = JSON.parse(accountsCookie.value);
    } catch {
      return NextResponse.json({ results: [] });
    }

    if (accountEmails.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Get first account's access token
    const accountId = accountEmails[0].replace(/[^a-zA-Z0-9@.]/g, "_");
    const doc = await adminDb.collection("google-accounts").doc(accountId).get();

    if (!doc.exists || !doc.data()) {
      return NextResponse.json({ results: [] });
    }

    const data = doc.data()!;
    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };

    const accessToken = await getValidAccessToken(tokens);

    // Search across all sources in parallel
    const [emailResults, calendarResults, contactResults] = await Promise.all([
      searchEmails(query, accessToken),
      searchCalendar(query, accessToken),
      searchContacts(query, accessToken),
    ]);

    // Combine and limit results
    const allResults = [
      ...emailResults,
      ...calendarResults,
      ...contactResults,
    ].slice(0, 10);

    return NextResponse.json({ results: allResults });
  } catch (error) {
    console.error('Universal search error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}
