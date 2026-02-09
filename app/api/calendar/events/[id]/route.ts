import { NextResponse } from "next/server";
import { getEvent, updateEvent, deleteEvent } from "@/lib/calendar";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// GET - Get event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json({
        error: "Not authenticated",
        mockData: true,
      });
    }

    const event = await getEvent(accessToken, id);
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PATCH - Update event
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json({
        error: "Not authenticated",
        mockData: true,
      });
    }

    const event = await updateEvent(accessToken, id, body);
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json({
        error: "Not authenticated",
        mockData: true,
      });
    }

    await deleteEvent(accessToken, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete event" },
      { status: 500 }
    );
  }
}
