import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/google-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Parse state parameter
  let returnUrl = "/";
  if (state) {
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      returnUrl = stateData.returnUrl || "/";
    } catch {
      returnUrl = decodeURIComponent(state);
    }
  }

  if (error) {
    const errorUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_error=${error}`
      : `${returnUrl}?auth_error=${error}`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }

  if (!code) {
    const errorUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_error=no_code`
      : `${returnUrl}?auth_error=no_code`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Store in Firestore with email as document ID for multi-account support
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL(returnUrl, request.url));

    try {
      const accountId = userInfo.email.replace(/[^a-zA-Z0-9@.]/g, "_");

      // Store this account's tokens in Firestore
      await adminDb
        .collection("google-accounts")
        .doc(accountId)
        .set({
          ...tokens,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

      // Get existing account list from cookie
      const existingAccountsCookie = cookieStore.get('google_accounts');
      let accountsList: string[] = [];

      if (existingAccountsCookie && existingAccountsCookie.value) {
        try {
          accountsList = JSON.parse(existingAccountsCookie.value);
        } catch {
          accountsList = [];
        }
      }

      // Add this account to the list if not already there
      if (!accountsList.includes(userInfo.email)) {
        accountsList.push(userInfo.email);
      }

      // Store list of account emails in cookie
      response.cookies.set("google_accounts", JSON.stringify(accountsList), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      // Also store primary account info for backwards compatibility
      response.cookies.set("google_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      response.cookies.set("google_user", JSON.stringify(userInfo), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

    } catch (firestoreError) {
      console.error("Failed to store tokens in Firestore:", firestoreError);
      return NextResponse.redirect(new URL(`${returnUrl}?auth_error=storage_failed`, request.url));
    }

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    const errorUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_error=token_exchange_failed`
      : `${returnUrl}?auth_error=token_exchange_failed`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}
