import { NextResponse } from "next/server";
import { getFullEmail } from "@/lib/gmail";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accessToken = getAccessToken(request);

    // Return mock data if no token
    if (!accessToken || id.startsWith("mock-")) {
      return NextResponse.json({
        mockData: true,
        email: {
          id,
          threadId: `thread-${id}`,
          subject: "Sample Email - Connect Google to see real content",
          from: "Example <example@example.com>",
          to: ["you@example.com"],
          snippet: "This is a sample email. Connect your Google account to see real emails.",
          date: Date.now().toString(),
          isUnread: false,
          body: "This is a sample email body.\n\nConnect your Google account in Settings to see real email content with full HTML rendering, attachments, and all email actions.",
        },
      });
    }

    const email = await getFullEmail(accessToken, id);

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch email" },
      { status: 500 }
    );
  }
}
