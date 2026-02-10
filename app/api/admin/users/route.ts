import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, role, permissions } = body;

    // Validate required fields
    if (!email || !password || !displayName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    let uid: string;
    let message: string;
    let isExistingUser = false;

    try {
      // Try to create a new Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });
      
      uid = userRecord.uid;
      message = "User created successfully";
    } catch (error: any) {
      // Check if the error is because the email already exists
      if (error.code === "auth/email-already-in-use") {
        // Fetch the existing user by email
        const existingUser = await auth.getUserByEmail(email);
        uid = existingUser.uid;
        isExistingUser = true;
        message = "User already existed in Auth, updated permissions";
      } else {
        // Re-throw any other errors
        throw error;
      }
    }

    // Create or update the Firestore user document
    await db.collection("users").doc(uid).set({
      email,
      displayName,
      role,
      permissions: permissions || [],
      createdAt: isExistingUser ? (await db.collection("users").doc(uid).get()).data()?.createdAt || Date.now() : Date.now(),
      lastLogin: Date.now(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message,
      uid,
      isExistingUser,
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
