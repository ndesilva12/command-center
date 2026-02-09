import { NextResponse } from "next/server";
import { getCalendarEvents, createEvent } from "@/lib/calendar";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// GET - List events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = searchParams.get("timeMax") || undefined;
    const maxResults = parseInt(searchParams.get("maxResults") || "50");

    const accessToken = getAccessToken(request);

    if (!accessToken) {
      // Return mock data
      return NextResponse.json({
        mockData: true,
        events: generateMockEvents(),
      });
    }

    const events = await getCalendarEvents(accessToken, timeMin, timeMax, maxResults);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST - Create event
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { summary, description, location, startDateTime, endDateTime, attendees, timeZone } = body;

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Missing required fields: summary, startDateTime, endDateTime" },
        { status: 400 }
      );
    }

    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json({
        error: "Not authenticated",
        mockData: true,
      });
    }

    const event = await createEvent(accessToken, {
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      attendees,
      timeZone,
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 }
    );
  }
}

function generateMockEvents() {
  const now = new Date();
  return [
    {
      id: "mock-1",
      summary: "Team Meeting",
      description: "Weekly sync",
      start: { dateTime: new Date(now.getTime() + 3600000).toISOString() },
      end: { dateTime: new Date(now.getTime() + 7200000).toISOString() },
    },
    {
      id: "mock-2",
      summary: "Project Review",
      start: { dateTime: new Date(now.getTime() + 86400000).toISOString() },
      end: { dateTime: new Date(now.getTime() + 90000000).toISOString() },
    },
  ];
}
