import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { archiveEmail, trashEmail } from "@/lib/gmail";
import { getValidAccessToken } from "@/lib/google-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, account } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Get Google tokens from cookies
    const cookieStore = await cookies();
    const googleTokensCookie = cookieStore.get('google_tokens');

    if (!googleTokensCookie || !googleTokensCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      );
    }

    let tokens;
    try {
      tokens = JSON.parse(googleTokensCookie.value);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(tokens);

    // Perform action
    switch (action) {
      case "archive":
        await archiveEmail(accessToken, id);
        break;
      case "trash":
        await trashEmail(accessToken, id);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error performing email action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform action" },
      { status: 500 }
    );
  }
}
