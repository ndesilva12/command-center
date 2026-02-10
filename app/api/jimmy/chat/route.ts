import { NextRequest, NextResponse } from "next/server";

/**
 * Jimmy Chat API Route
 * 
 * NOTE: Direct chat interface is temporarily disabled.
 * Gateway connection at 3.128.31.231:18789 is not publicly accessible from Vercel.
 * 
 * Future implementation options:
 * 1. Firestore-based async messaging (messages → /jimmy_chat_messages → backend picks up → responses)
 * 2. Public gateway endpoint with proper authentication
 * 3. WebSocket/SSE streaming from backend
 */

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Return helpful message directing to Telegram
    return NextResponse.json({
      response: "👋 Thanks for your message! The direct chat interface is coming soon.\n\n" +
                "For now, you can chat with Jimmy via Telegram: @normancdesilva\n\n" +
                "I'll get back to you as soon as possible!",
      success: true,
      temporaryResponse: true,
    });

    /* 
     * DISABLED: Direct gateway connection (not publicly accessible)
     * 
     * const gatewayUrl = "http://3.128.31.231:18789";
     * const token = process.env.OPENCLAW_TOKEN;
     * 
     * const response = await fetch(`${gatewayUrl}/api/v1/sessions/send`, {
     *   method: "POST",
     *   headers: {
     *     "Content-Type": "application/json",
     *     Authorization: `Bearer ${token}`,
     *   },
     *   body: JSON.stringify({
     *     message,
     *     session: "jimmy-chat",
     *   }),
     * });
     */

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ 
      error: "Unable to process message", 
      details: error.message 
    }, { status: 500 });
  }
}
