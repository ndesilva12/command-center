import { NextResponse } from "next/server";
import { getRecentEmails } from "@/lib/gmail";

// Helper to get access token from headers or return mock data
function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    const query = searchParams.get("q") || undefined;
    const account = searchParams.get("account") || undefined;

    const accessToken = getAccessToken(request);

    // Return mock data if no token (for testing)
    if (!accessToken) {
      return NextResponse.json({
        error: "Not authenticated. Please connect your Google account.",
        mockData: true,
        emails: generateMockEmails(),
        accounts: [
          { email: "norman.desilva@gmail.com", name: "Norman de Silva" },
          { email: "norman@listid.us", name: "Norman (Listid)" },
        ],
      });
    }

    // Fetch real emails
    const emails = await getRecentEmails(accessToken, maxResults, query);

    return NextResponse.json({
      emails,
      account,
      count: emails.length,
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch emails",
        mockData: true,
        emails: generateMockEmails(),
      },
      { status: 500 }
    );
  }
}

// Mock data for testing UI
function generateMockEmails() {
  return [
    {
      id: "mock-1",
      threadId: "thread-1",
      subject: "Welcome to Command Center",
      from: "System <system@commandcenter.app>",
      snippet: "Your personalized dashboard is ready. Connect your Google account to see real emails.",
      date: Date.now().toString(),
      isUnread: true,
    },
    {
      id: "mock-2",
      threadId: "thread-2",
      subject: "Connect Gmail to get started",
      from: "Onboarding <hello@commandcenter.app>",
      snippet: "Click the settings icon to connect your Google account and access your emails.",
      date: (Date.now() - 3600000).toString(),
      isUnread: false,
    },
    {
      id: "mock-3",
      threadId: "thread-3",
      subject: "Feature Updates",
      from: "Updates <updates@commandcenter.app>",
      snippet: "New features: Archive, Delete, Star emails. Full email view with HTML rendering.",
      date: (Date.now() - 7200000).toString(),
      isUnread: false,
    },
  ];
}
