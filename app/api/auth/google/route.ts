import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get("returnUrl") || "/";

    const authUrl = getGoogleAuthUrl(returnUrl);
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
