// Google Calendar API utilities

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: { email: string; responseStatus?: string }[];
  organizer?: { email: string; displayName?: string };
  htmlLink?: string;
  colorId?: string;
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
  timeZone?: string;
}

// Fetch calendar events
export async function getCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 50
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  if (timeMin) params.append("timeMin", timeMin);
  if (timeMax) params.append("timeMax", timeMax);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Get single event
export async function getEvent(accessToken: string, eventId: string): Promise<CalendarEvent> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }

  return response.json();
}

// Create event
export async function createEvent(
  accessToken: string,
  params: CreateEventParams
): Promise<CalendarEvent> {
  const event = {
    summary: params.summary,
    description: params.description,
    location: params.location,
    start: {
      dateTime: params.startDateTime,
      timeZone: params.timeZone || "America/New_York",
    },
    end: {
      dateTime: params.endDateTime,
      timeZone: params.timeZone || "America/New_York",
    },
    attendees: params.attendees?.map(email => ({ email })),
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.statusText}`);
  }

  return response.json();
}

// Update event
export async function updateEvent(
  accessToken: string,
  eventId: string,
  params: Partial<CreateEventParams>
): Promise<CalendarEvent> {
  const event: any = {};
  
  if (params.summary) event.summary = params.summary;
  if (params.description !== undefined) event.description = params.description;
  if (params.location !== undefined) event.location = params.location;
  
  if (params.startDateTime) {
    event.start = {
      dateTime: params.startDateTime,
      timeZone: params.timeZone || "America/New_York",
    };
  }
  
  if (params.endDateTime) {
    event.end = {
      dateTime: params.endDateTime,
      timeZone: params.timeZone || "America/New_York",
    };
  }
  
  if (params.attendees) {
    event.attendees = params.attendees.map(email => ({ email }));
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update event: ${response.statusText}`);
  }

  return response.json();
}

// Delete event
export async function deleteEvent(accessToken: string, eventId: string): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete event: ${response.statusText}`);
  }
}
