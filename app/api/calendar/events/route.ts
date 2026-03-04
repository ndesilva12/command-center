import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { getValidAccessToken } from '@/lib/google-auth';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function getAccessTokenForAccount(accountEmail?: string): Promise<{ accessToken: string; email: string } | null> {
  const cookieStore = await cookies();
  const accountsCookie = cookieStore.get('google_accounts');

  if (!accountsCookie || !accountsCookie.value) {
    return null;
  }

  const accountEmails: string[] = JSON.parse(accountsCookie.value);
  if (accountEmails.length === 0) return null;

  const emailToUse = accountEmail || accountEmails[0];
  const accountId = emailToUse.replace(/[^a-zA-Z0-9@.]/g, "_");
  const doc = await adminDb.collection("google-accounts").doc(accountId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  const tokens = {
    access_token: data?.access_token,
    refresh_token: data?.refresh_token,
    expires_at: data?.expires_at,
  };

  const accessToken = await getValidAccessToken(tokens);
  return { accessToken, email: data?.email };
}

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

// CREATE EVENT
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { summary, description, location, start, end, attendees, account } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, start, end' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const auth = await getAccessTokenForAccount(account);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: noCacheHeaders });
    }

    const event: any = {
      summary,
      start: start.dateTime ? { dateTime: start.dateTime, timeZone: start.timeZone || 'America/New_York' } : { date: start.date },
      end: end.dateTime ? { dateTime: end.dateTime, timeZone: end.timeZone || 'America/New_York' } : { date: end.date },
    };

    if (description) event.description = description;
    if (location) event.location = location;
    if (attendees && attendees.length > 0) {
      event.attendees = attendees.map((email: string) => ({ email }));
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar create error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: response.status, headers: noCacheHeaders }
      );
    }

    const createdEvent = await response.json();
    return NextResponse.json({ event: createdEvent }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

// UPDATE EVENT
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { eventId, summary, description, location, start, end, attendees, account } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const auth = await getAccessTokenForAccount(account);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: noCacheHeaders });
    }

    const event: any = {};
    if (summary) event.summary = summary;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (start) {
      event.start = start.dateTime 
        ? { dateTime: start.dateTime, timeZone: start.timeZone || 'America/New_York' } 
        : { date: start.date };
    }
    if (end) {
      event.end = end.dateTime 
        ? { dateTime: end.dateTime, timeZone: end.timeZone || 'America/New_York' } 
        : { date: end.date };
    }
    if (attendees) {
      event.attendees = attendees.map((email: string) => ({ email }));
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar update error:', errorData);
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: response.status, headers: noCacheHeaders }
      );
    }

    const updatedEvent = await response.json();
    return NextResponse.json({ event: updatedEvent }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

// DELETE EVENT
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const account = searchParams.get('account');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required parameter: eventId' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const auth = await getAccessTokenForAccount(account || undefined);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: noCacheHeaders });
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: response.status, headers: noCacheHeaders }
      );
    }

    return NextResponse.json({ success: true }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
