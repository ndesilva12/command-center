import { NextRequest, NextResponse } from "next/server";

/**
 * Jimmy Chat API Route
 * 
 * DEPRECATED: This route is no longer used.
 * 
 * Chat interface now uses Firestore-based async messaging:
 * - Frontend writes to /jimmy_chat_messages collection
 * - Backend polls Firestore and writes responses back
 * - Frontend receives updates via real-time onSnapshot listeners
 * 
 * See JIMMY_CHAT_BACKEND.md for backend implementation details.
 * See /components/jimmy/ChatInterface.tsx for frontend implementation.
 * 
 * This file is kept for reference but can be removed in future cleanup.
 */

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Return deprecation notice
    return NextResponse.json({
      error: "This API endpoint is deprecated. Please use the Firestore-based chat interface.",
      deprecated: true,
      message: "Chat messages should be written directly to Firestore collection: /jimmy_chat_messages",
      documentation: "See JIMMY_CHAT_BACKEND.md for implementation details"
    }, { status: 410 }); // 410 Gone - indicates deprecated endpoint

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ 
      error: "Unable to process message", 
      details: error.message 
    }, { status: 500 });
  }
}
