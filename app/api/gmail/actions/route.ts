import { NextResponse } from "next/server";
import { markEmailAsRead, markEmailAsUnread, archiveEmail, trashEmail, starEmail } from "@/lib/gmail";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

type EmailAction = "read" | "unread" | "archive" | "trash" | "star" | "unstar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, messageId, messageIds } = body as {
      action: EmailAction;
      messageId?: string;
      messageIds?: string[];
    };

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const validActions: EmailAction[] = ["read", "unread", "archive", "trash", "star", "unstar"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const accessToken = getAccessToken(request);

    // Mock mode
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: "Not authenticated",
        mockData: true,
      });
    }

    // Handle bulk or single
    const ids = messageIds || (messageId ? [messageId] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: "No message IDs provided" }, { status: 400 });
    }

    // Perform action on all messages
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        switch (action) {
          case "read":
            return markEmailAsRead(accessToken, id);
          case "unread":
            return markEmailAsUnread(accessToken, id);
          case "archive":
            return archiveEmail(accessToken, id);
          case "trash":
            return trashEmail(accessToken, id);
          case "star":
            return starEmail(accessToken, id, true);
          case "unstar":
            return starEmail(accessToken, id, false);
        }
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      action,
      total: ids.length,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error("Error performing email action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform action" },
      { status: 500 }
    );
  }
}
