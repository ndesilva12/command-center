import { NextRequest, NextResponse } from "next/server";

const RAINDROP_CLIENT_ID = process.env.RAINDROP_CLIENT_ID;
const RAINDROP_CLIENT_SECRET = process.env.RAINDROP_CLIENT_SECRET;
const REDIRECT_URI = process.env.RAINDROP_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/raindrop/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = request.nextUrl.origin;

  if (error) {
    console.error("Raindrop OAuth error:", error);
    return NextResponse.redirect(new URL("/tools/bookmarks?auth_error=" + error, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/tools/bookmarks?auth_error=no_code", baseUrl));
  }

  if (!RAINDROP_CLIENT_ID || !RAINDROP_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/tools/bookmarks?auth_error=config", baseUrl));
  }

  try {
    const tokenResponse = await fetch("https://raindrop.io/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: RAINDROP_CLIENT_ID,
        client_secret: RAINDROP_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Raindrop token error:", errorText);
      return NextResponse.redirect(new URL("/tools/bookmarks?auth_error=token_exchange", baseUrl));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token) {
      return NextResponse.redirect(new URL("/tools/bookmarks?auth_error=no_token", baseUrl));
    }

    const response = NextResponse.redirect(new URL("/tools/bookmarks?auth_success=true", baseUrl));

    response.cookies.set("raindrop_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in || 1209600,
      path: "/",
    });

    if (refresh_token) {
      response.cookies.set("raindrop_refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Raindrop OAuth callback error:", error);
    return NextResponse.redirect(new URL("/tools/bookmarks?auth_error=server", baseUrl));
  }
}
