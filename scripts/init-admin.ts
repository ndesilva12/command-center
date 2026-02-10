// Script to initialize admin user
// Run with: npx tsx scripts/init-admin.ts

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const email = "norman.desilva@gmail.com";
  const password = "ChangeMe123!"; // CHANGE THIS!
  const displayName = "Norman C. de Silva";

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    console.log("✅ Created Firebase Auth user:", userRecord.uid);

    // Create user document in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      email,
      displayName,
      role: "admin",
      permissions: [], // Admin has access to everything
      createdAt: Date.now(),
      lastLogin: Date.now(),
    });

    console.log("✅ Created Firestore user document");
    console.log("\n🎉 Admin user created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("\n⚠️  IMPORTANT: Change the password after first login!\n");
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      console.log("⚠️  User already exists. Updating Firestore document...");
      
      // Get existing user
      const userRecord = await auth.getUserByEmail(email);
      
      // Update Firestore document
      await db.collection("users").doc(userRecord.uid).set({
        email,
        displayName,
        role: "admin",
        permissions: [],
        createdAt: Date.now(),
        lastLogin: Date.now(),
      }, { merge: true });
      
      console.log("✅ Updated Firestore user document");
    } else {
      console.error("❌ Error:", error.message);
    }
  }

  process.exit(0);
}

createAdminUser();
