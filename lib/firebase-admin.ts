// Server-side Firebase Admin SDK
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminDbInstance: Firestore | undefined;
let adminAuthInstance: Auth | undefined;

function initializeAdminApp() {
  if (adminApp) return adminApp;
  
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials not configured');
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }
  
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    const app = initializeAdminApp();
    adminDbInstance = getFirestore(app);
  }
  return adminDbInstance;
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    const app = initializeAdminApp();
    adminAuthInstance = getAuth(app);
  }
  return adminAuthInstance;
}

// Lazy getter
export const adminDb = new Proxy({} as Firestore, {
  get(target, prop) {
    const db = getAdminDb();
    return (db as any)[prop];
  }
});
