import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/gmail";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, cc, bcc, replyToMessageId, threadId, fromEmail } = body;

    // Validate
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body" },
        { status: 400 }
      );
    }

    const accessToken = getAccessToken(request);

    // Mock mode
    if (!accessToken || !fromEmail) {
      return NextResponse.json({
        error: "Not authenticated. Connect your Google account to send emails.",
        mockData: true,
        success: false,
      });
    }

    const result = await sendEmail(accessToken, {
      to,
      subject,
      body: emailBody,
      cc,
      bcc,
      replyToMessageId,
      threadId,
    }, fromEmail);

    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
