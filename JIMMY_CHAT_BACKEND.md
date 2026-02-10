# Jimmy Chat Backend Integration

## Overview

The Command Center chat interface now uses Firestore as a message queue for asynchronous communication with Jimmy (OpenClaw agent). This document describes the backend polling and response system.

## Architecture

```
User (Frontend) → Firestore → Jimmy (Backend) → Firestore → User sees response
```

## Firestore Collection: `/jimmy_chat_messages`

### Message Structure

```typescript
{
  id: string                    // Auto-generated document ID
  message: string               // The message content
  sender: "user" | "assistant"  // Who sent the message
  userId: string                // Firebase Auth UID
  timestamp: Timestamp          // Firestore server timestamp
  status: "pending" | "processing" | "completed"
  sessionId: string             // Unique conversation identifier
}
```

## Backend Implementation (Jimmy/OpenClaw)

### 1. Poll for Pending Messages

Jimmy should periodically (every 5-30 seconds) query Firestore for unprocessed user messages:

```javascript
// Query for pending messages
const messagesRef = collection(db, "jimmy_chat_messages");
const q = query(
  messagesRef,
  where("sender", "==", "user"),
  where("status", "==", "pending"),
  orderBy("timestamp", "asc"),
  limit(10)
);

const snapshot = await getDocs(q);
```

### 2. Process Each Message

For each pending message:

1. **Mark as processing** (optional, provides user feedback):
   ```javascript
   await updateDoc(doc(db, "jimmy_chat_messages", messageId), {
     status: "processing"
   });
   ```

2. **Generate response** using Jimmy's AI capabilities

3. **Write response back to Firestore**:
   ```javascript
   await addDoc(collection(db, "jimmy_chat_messages"), {
     message: responseText,
     sender: "assistant",
     userId: originalMessage.userId,
     timestamp: serverTimestamp(),
     status: "completed",
     sessionId: originalMessage.sessionId
   });
   ```

4. **Mark original message as completed**:
   ```javascript
   await updateDoc(doc(db, "jimmy_chat_messages", messageId), {
     status: "completed"
   });
   ```

### 3. Error Handling

If processing fails:

```javascript
await addDoc(collection(db, "jimmy_chat_messages"), {
  message: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
  sender: "assistant",
  userId: originalMessage.userId,
  timestamp: serverTimestamp(),
  status: "completed",
  sessionId: originalMessage.sessionId
});

// Still mark original as completed to prevent retry loops
await updateDoc(doc(db, "jimmy_chat_messages", messageId), {
  status: "completed"
});
```

## Implementation Options

### Option A: Node.js Script (Recommended)

Create a standalone polling service that runs continuously:

```javascript
// jimmy-chat-poller.js
import { initializeApp } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccountKey),
  projectId: 'the-dashboard-50be1'
});

const db = getFirestore(app);

async function pollMessages() {
  const messagesRef = db.collection('jimmy_chat_messages');
  const snapshot = await messagesRef
    .where('sender', '==', 'user')
    .where('status', '==', 'pending')
    .orderBy('timestamp', 'asc')
    .limit(10)
    .get();

  for (const doc of snapshot.docs) {
    await processMessage(doc.id, doc.data());
  }
}

// Poll every 10 seconds
setInterval(pollMessages, 10000);
```

### Option B: OpenClaw Skill

Integrate directly into OpenClaw's skill system:

```bash
# Create new skill directory
mkdir -p /home/ubuntu/clawd/skills/jimmy-chat

# Add polling logic to skill
# Use OpenClaw's built-in Firebase/Firestore capabilities
```

### Option C: Cloud Function (Firebase Functions)

Deploy as a Firebase Function triggered on document creation:

```javascript
exports.processJimmyMessage = functions.firestore
  .document('jimmy_chat_messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    
    if (message.sender === 'user' && message.status === 'pending') {
      // Process with OpenClaw gateway
      const response = await fetch('http://3.128.31.231:18789/api/v1/sessions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENCLAW_TOKEN}`
        },
        body: JSON.stringify({
          message: message.message,
          session: 'jimmy-chat'
        })
      });
      
      // Write response back
      // ... (see above)
    }
  });
```

## Security Considerations

1. **Authentication**: Backend must use Firebase Admin SDK with proper service account credentials
2. **Rate Limiting**: Implement per-user rate limits to prevent abuse
3. **Message Validation**: Sanitize and validate all message content
4. **User Verification**: Always verify `userId` matches authenticated user

## Monitoring & Logging

Track these metrics:

- Messages processed per minute
- Average response time
- Error rate
- Pending message queue depth
- User sessions active

## Deployment Checklist

- [ ] Set up Firebase Admin credentials
- [ ] Configure Firestore security rules (see FIRESTORE_RULES_UPDATE.md)
- [ ] Deploy polling service/Cloud Function
- [ ] Set up monitoring and alerting
- [ ] Test with multiple concurrent users
- [ ] Verify message ordering and sessionId handling

## Testing

Test scenarios:

1. Single user, single message
2. Multiple users, concurrent messages
3. Long-running conversations (multiple exchanges)
4. Error conditions (network failures, rate limits)
5. Message ordering (ensure responses appear in correct order)

## Future Enhancements

- **Streaming responses**: Consider WebSocket or Server-Sent Events for real-time typing indicators
- **Rich media**: Support for images, files, code blocks
- **Message history**: Load previous conversations by sessionId
- **Search**: Full-text search across message history
- **Analytics**: Track common queries, user satisfaction
