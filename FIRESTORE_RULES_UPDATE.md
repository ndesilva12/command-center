# Firestore Security Rules Update Required

## Issue
Users are getting "Missing or insufficient permissions" when trying to read `/jimmy_deliverables` collection from the client.

## Solution
Add read permissions for authenticated users to the `jimmy_deliverables` collection.

## Rules to Add

Add these to your Firestore security rules in the Firebase Console:

### 1. Jimmy Deliverables (Read-only)
```javascript
match /jimmy_deliverables/{deliverableId} {
  allow read: if request.auth != null;  // Authenticated users can read
  allow write: if false;                  // Server-side only writes
}
```

### 2. Jimmy Chat Messages (NEW - Required for chat interface)
```javascript
match /jimmy_chat_messages/{messageId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.sender == 'user';
  allow update, delete: if false; // Server-side only
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
    
    // Jimmy Chat Messages - User can create, read own messages; backend writes responses
    match /jimmy_chat_messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.sender == 'user';
      allow update, delete: if false; // Server-side only
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
- Users can send chat messages to `/jimmy_chat_messages`
- Users can read their own chat messages in real-time
- Users cannot update or delete messages (server-side only)

## Files Updated
- `/components/jimmy/ChatInterface.tsx` - Implemented Firestore messaging with real-time updates
- `/JIMMY_CHAT_BACKEND.md` - Backend polling and response documentation
- `/FIRESTORE_RULES_UPDATE.md` - Added chat message security rules

## Related Documentation
- See `JIMMY_CHAT_BACKEND.md` for backend implementation details

---

**Status:** Awaiting Firebase Console update by Norman
**Date:** 2026-02-10 (Updated)
**Issues:** 
- Client-side permission denied on jimmy_deliverables collection (original)
- Chat interface implemented with Firestore message queue (NEW)
