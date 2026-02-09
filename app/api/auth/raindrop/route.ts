import { NextResponse } from "next/server";

const RAINDROP_CLIENT_ID = process.env.RAINDROP_CLIENT_ID;
const REDIRECT_URI = process.env.RAINDROP_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/raindrop/callback`;

export async function GET() {
  if (!RAINDROP_CLIENT_ID) {
    return NextResponse.json({ error: "Raindrop client ID not configured" }, { status: 500 });
  }

  const authUrl = new URL("https://raindrop.io/oauth/authorize");
  authUrl.searchParams.set("client_id", RAINDROP_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);

  return NextResponse.json({ url: authUrl.toString() });
}
