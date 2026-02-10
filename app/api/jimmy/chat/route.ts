import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const gatewayUrl = "http://3.128.31.231:18789";
    const token = process.env.OPENCLAW_TOKEN;

    if (!token) {
      console.error("OPENCLAW_TOKEN not found in environment");
      return NextResponse.json({ error: "Gateway token not configured" }, { status: 500 });
    }

    // Send to OpenClaw gateway
    const response = await fetch(`${gatewayUrl}/api/v1/sessions/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        session: "jimmy-chat",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gateway API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to communicate with gateway", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      response: data.response || data.message || "Response received",
      success: true,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
