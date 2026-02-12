// Server-side Firebase Admin SDK
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminDbInstance: Firestore | undefined;
let adminAuthInstance: Auth | undefined;

// Hardcoded Firebase Admin credentials (same pattern as Python scripts)
const FIREBASE_ADMIN_CREDS = {
  type: "service_account",
  project_id: "the-dashboard-50be1",
  private_key_id: "dummy",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDTGBrBoaCexPsM\nes10P6H4TaGZV1hAjumSOpJVad25WUHGOzY/ka/ya0n2XjC1nFtKwJKA0VvRWnO1\ndm7v005MohGytOTpYMmgDqf4R3F3JF/aadVe+rTAvJXY22o2BRC3Y7GKiR0ht5Vl\nqZYufhdyP6++XMRHIClhtYmM3qTdjUAVanAzy+SxRXNA+e4dwzVkIyswZorcpnt3\nnDuFnb2COBEKa8NmnVSCt2S8uWi7DgIBNU5E1VxyM8fCKv48JvZjJhSogs+Zr48v\nrrH2T/x9ScBOo/iKwHxT/zYowgCPYndE4P3iC7homgGzwfGxAZc4mguQpenj8n5H\n3ZBRrlQ3AgMBAAECggEAHOsGb1RG/rkZc0I3dx9ofu2Tn8AZdO6fDMs9VLomB8g0\nfIWMDvVUVy9feIK6xYZf80OiTkdf/rQXedp5pB0cct8Y8ZRab6Y0uNqJJDgVUS8I\nepFZC6PosyaimIymZjQXcCgWIFZcSUwvCThMPJ5Fc/9JghiPQvci9CG8cDHn//mj\n0ELoGLDLR8pg5YuOynA9kraG4vGfmCyUgJayBzwdkHkxQzSgHCHcNQ8ffGw/49sZ\nzQrT4u7hmoMq4SkTA1Tv+/midCtD1m/svC+15PQGNfJGh2/q5rsMsWf+aFUNGqZh\nIjuE+d0br0W7Mg4yTml6loRMhQgfEYtX8X7AUwBbsQKBgQD8OM6a2S6L/Vdd2joX\nMCm0+6ENSClBQxVX2Xy2BiJ87FPHBI9W8gjKw80clQUL7oAjJd4e5bEaD7W68CiB\ndp6dpiG7OLKkRvRsrJd1ghOUD6TCSTeC2kEmcew14fbr7yoOVF+MqlA1AT0H7gfP\nAVtA2wi6mLyu2ngBTD7i0eZtswKBgQDWQZXV0llBayvwkDIr9RkS1GcnY5O6H1mw\nN1LxgvTBvOClmVbiBrAEGi31eh4ytYskmSt5koCSpA2M9B0r83EZPWYGzvHCOoAw\n7+NWjdgP3TwpJIxiy2qJXdzxjc8Wr/mSJ0qL7K5LrSAc9wRRqPvLVKVcVgvmpQo2\n0G37EI5lbQKBgDLHFQEjvDU+uboRVySX862WAyRzZKrY4JEhHfRfY84Wnf8xMdJl\nQ9Pee4rHjY6LY4yv8PnzcCY5B3MtKlp2ERTX/257yas9BbRjQtLLbzmdtKPQrbZQ\nTlF5Gf73EQkKy0K7RclB+IfTSgAwsa3BLifucOFwInxpS0Onn/l2HJf1AoGBAITE\nYXf9gAe0xKauhBiPKflsG3viDbHhKW+z6Lb14nuHcmHLsnYflMUGAALEqJ/dtZp5\nO+J68Sdtd2QoBUet9CCi1m1ToaYtIDCzBlolTYUPH++S0VeLG7qBqp8YtAIoC+wQ\nYvZwNNV6M5MfUtLTdyxZiJq+S2OiU8EByZUxfjvFAoGBAO26DPUyd37T7CHsPPPT\nAKj86H2LBBhPLfg1oDTIYJvFcCtHbBTwGFmSgEf8X5AXDMB5f2fPot9WdA4bNbTe\nviEmaskfTa/tYit1wS18OQzGtQ3+l3Z/L1Pc0Xl1FLhRXom5tvzlw/bG+J5wO4bs\n62U90K3FtXCHk+d4K58nGvOG\n-----END PRIVATE KEY-----",
  client_email: "firebase-adminsdk-fbsvc@the-dashboard-50be1.iam.gserviceaccount.com",
  client_id: "dummy",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

function initializeAdminApp() {
  if (adminApp) return adminApp;
  
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert(FIREBASE_ADMIN_CREDS as any),
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
