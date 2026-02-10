import { NextResponse } from "next/server";

// This endpoint is just a placeholder - the actual admin user should be created
// via Firebase Console or using Firebase Admin SDK with proper credentials
export async function POST() {
  return NextResponse.json({
    message: "Please create admin user via Firebase Console",
    instructions: [
      "1. Go to Firebase Console > Authentication",
      "2. Add user: norman.desilva@gmail.com",
      "3. Set a password",
      "4. Then add user document in Firestore /users/{uid}:",
      {
        email: "norman.desilva@gmail.com",
        displayName: "Norman C. de Silva",
        role: "admin",
        permissions: [],
        createdAt: "Date.now()",
        lastLogin: "Date.now()",
      },
    ],
  });
}
