import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { archiveEmail, trashEmail } from "@/lib/gmail";
import { getValidAccessToken } from "@/lib/google-auth";
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, account } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get('google_accounts');

    if (!accountsCookie || !accountsCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      );
    }

    let accountEmails: string[] = [];
    try {
      accountEmails = JSON.parse(accountsCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Use specified account or first account
    const targetAccount = account || accountEmails[0];

    if (!accountEmails.includes(targetAccount)) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Fetch tokens from Firestore
    const accountId = targetAccount.replace(/[^a-zA-Z0-9@.]/g, "_");
    const doc = await adminDb
      .collection("google-accounts")
      .doc(accountId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Account tokens not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    if (!data) {
      return NextResponse.json(
        { error: 'Account data invalid' },
        { status: 500 }
      );
    }

    // Get valid access token
    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
    const accessToken = await getValidAccessToken(tokens);

    // Perform action
    switch (action) {
      case "archive":
        await archiveEmail(accessToken, id);
        break;
      case "trash":
        await trashEmail(accessToken, id);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error performing email action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform action" },
      { status: 500 }
    );
  }
}
