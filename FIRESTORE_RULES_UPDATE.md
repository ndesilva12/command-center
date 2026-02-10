# Firestore Security Rules Update Required

## Issue
Users are getting "Missing or insufficient permissions" when trying to read `/jimmy_deliverables` collection from the client.

## Solution
Add read permissions for authenticated users to the `jimmy_deliverables` collection.

## Rules to Add

Add this to your Firestore security rules in the Firebase Console:

```javascript
match /jimmy_deliverables/{deliverableId} {
  allow read: if request.auth != null;  // Authenticated users can read
  allow write: if false;                  // Server-side only writes
}
```

## Full Example Context

Your rules should look something like this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... other existing rules ...
    
    // Jimmy Deliverables - Read-only for authenticated users
    match /jimmy_deliverables/{deliverableId} {
      allow read: if request.auth != null;
      allow write: if false; // Server-side only
    }
    
    // ... other existing rules ...
  }
}
```

## How to Apply

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project (command-center or relevant project)
3. Navigate to: **Firestore Database** → **Rules** tab
4. Add the rules above to your existing rules
5. Click **Publish** to deploy

## Testing

After applying, verify that:
- Authenticated users can read from `/jimmy_deliverables`
- The BYU Basketball Report is visible on the Jimmy page
- No write access is granted (server maintains exclusive write control)

## Files Updated in This Fix
- `/app/api/jimmy/chat/route.ts` - Disabled direct gateway connection, added Telegram redirect message

---

**Status:** Awaiting Firebase Console update by Norman
**Date:** 2026-02-10
**Issue:** Client-side permission denied on jimmy_deliverables collection
