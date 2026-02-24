import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { getValidAccessToken } from '@/lib/google-auth';

async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<any[]> {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('timeMin', timeMin);
  url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('maxResults', '50');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }

  const data = await response.json();
  return data.items || [];
}

export async function GET(request: Request) {
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const account = searchParams.get('account');

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    if (!accountsCookie || !accountsCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: noCacheHeaders });
    }

    const accountEmails: string[] = JSON.parse(accountsCookie.value);

    if (accountEmails.length === 0) {
      return NextResponse.json({ error: 'No Google accounts connected' }, { status: 401, headers: noCacheHeaders });
    }

    // Fetch events from all accounts (or specific account if requested)
    const accountsToFetch = account ? accountEmails.filter(email => email === account) : accountEmails;

    const eventsFromAllAccounts = await Promise.all(
      accountsToFetch.map(async (email) => {
        try {
          const accountId = email.replace(/[^a-zA-Z0-9@.]/g, "_");
          const doc = await adminDb.collection("google-accounts").doc(accountId).get();

          if (!doc.exists) {
            return { events: [], account: { email, name: email } };
          }

          const data = doc.data();
          const tokens = {
            access_token: data?.access_token,
            refresh_token: data?.refresh_token,
            expires_at: data?.expires_at,
          };

          const accessToken = await getValidAccessToken(tokens);
          const events = await fetchCalendarEvents(accessToken, timeMin, timeMax);

          return {
            events: events.map(event => ({
              ...event,
              accountEmail: data?.email,
              accountName: data?.name,
            })),
            account: {
              email: data?.email,
              name: data?.name,
            },
          };
        } catch (error) {
          console.error(`Error fetching calendar for ${email}:`, error);
          return { events: [], account: { email, name: email } };
        }
      })
    );

    // Merge all events and sort by start time
    const allEvents = eventsFromAllAccounts.flatMap(result => result.events);
    allEvents.sort((a, b) => {
      const aTime = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
      const bTime = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
      return aTime - bTime;
    });

    return NextResponse.json({
      events: allEvents,
      accounts: eventsFromAllAccounts.map(r => r.account),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
