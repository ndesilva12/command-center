# Jimmy Chat Cloud Function Setup

Event-driven notification system for Jimmy chat messages using Firebase Cloud Functions.

## Overview

This Cloud Function triggers instantly when a user sends a message to Jimmy, eliminating the need for polling. It attempts to notify the OpenClaw gateway and falls back to a Firestore queue if the gateway is unreachable.

## Architecture

```
User sends message → Firestore onCreate trigger → Cloud Function
                                                      ↓
                                        Try: Gateway webhook (HTTP)
                                                      ↓
                                        Fallback: Notification queue
                                                      ↓
                                        Retry scheduler (every 5 min)
```

## Prerequisites

1. **Node.js 18+** installed
2. **Firebase CLI** installed globally
3. **Firebase project** created (project ID: `jimmy-chat`)
4. **Billing enabled** on Firebase project (Cloud Functions require Blaze plan)

## Installation

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Project (if not already done)

```bash
firebase init
```

Select:
- ✓ Functions: Configure Cloud Functions
- Use existing project: `jimmy-chat`
- Language: TypeScript
- ESLint: No (optional)
- Install dependencies: Yes

### 4. Install Dependencies

```bash
cd functions
npm install
```

## Deployment

### Deploy Functions

```bash
# From project root
firebase deploy --only functions
```

Or deploy specific function:

```bash
firebase deploy --only functions:onNewChatMessage
firebase deploy --only functions:retryFailedNotifications
```

### View Deployment Status

```bash
firebase functions:list
```

## Configuration

### Environment Variables

No environment variables are currently required (token is hardcoded). To use environment variables instead:

1. Set config values:
```bash
firebase functions:config:set gateway.url="http://3.128.31.231:18789/api/v1/webhook/jimmy-chat"
firebase functions:config:set gateway.token="fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57"
```

2. Update code to use config:
```typescript
const gatewayUrl = functions.config().gateway.url;
const token = functions.config().gateway.token;
```

3. Redeploy functions

### Firestore Collections

**Main Collection:**
- `jimmy_chat_messages/{messageId}` - Chat messages with status field

**Notification Queue (fallback):**
- `jimmy_chat_notifications/{notificationId}` - Failed gateway notifications
  - `messageId` - Reference to original message
  - `status` - "pending" | "delivered"
  - `attempts` - Number of retry attempts
  - `createdAt` - Timestamp when notification was queued
  - `deliveredAt` - Timestamp when successfully delivered (if applicable)

## Testing

### Local Emulator Testing

```bash
cd functions
npm run serve
```

This starts the Firebase emulator suite. You can test functions locally before deploying.

### Manual Trigger Test

Add a test document to Firestore:

```javascript
// In Firebase Console > Firestore
db.collection('jimmy_chat_messages').add({
  sender: 'user',
  status: 'pending',
  message: 'Test message',
  userId: 'test-user',
  sessionId: 'test-session',
  timestamp: new Date()
});
```

### View Logs

```bash
# Stream logs in real-time
firebase functions:log

# View logs for specific function
firebase functions:log --only onNewChatMessage
```

Or view in Firebase Console: Functions → Logs tab

## How It Works

### 1. onNewChatMessage Trigger

Fires when a new document is created in `jimmy_chat_messages`:

1. Checks if message is from user with "pending" status
2. Updates status to "processing"
3. Attempts to POST to OpenClaw gateway webhook
4. If gateway fails:
   - Creates notification in `jimmy_chat_notifications` queue
   - Reverts status to "pending" if both attempts fail

### 2. retryFailedNotifications Scheduler

Runs every 5 minutes:

1. Queries `jimmy_chat_notifications` for pending items
2. Retries gateway webhook for each notification
3. Marks as "delivered" on success
4. Increments attempt counter on failure
5. Stops retrying after 3 attempts

## Alternative Approaches

If the gateway remains unreachable from Cloud Functions, consider:

### Option A: Monitor Firestore Queue from OpenClaw

The fallback queue (`jimmy_chat_notifications`) can be monitored by OpenClaw using Firestore listeners:

```javascript
// In OpenClaw session
db.collection('jimmy_chat_notifications')
  .where('status', '==', 'pending')
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const notification = change.doc.data();
        // Process message
        handleJimmyMessage(notification);
        // Mark as delivered
        change.doc.ref.update({ status: 'delivered' });
      }
    });
  });
```

### Option B: Telegram Bot API Notification

Modify Cloud Function to send Telegram message directly:

```typescript
const TELEGRAM_BOT_TOKEN = 'your-bot-token';
const TELEGRAM_CHAT_ID = 'your-chat-id';

await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: `New Jimmy message from ${message.userId}: ${message.message}`
  })
});
```

### Option C: Firebase Extensions

Use Firebase Extensions like "Trigger Email" or "Trigger HTTP Request" for managed webhooks with built-in retry logic.

## Troubleshooting

### Function Not Triggering

1. Check Firestore rules allow function to read/write
2. Verify document path matches exactly: `jimmy_chat_messages/{messageId}`
3. Check function deployment: `firebase functions:list`

### Gateway Timeout

- Expected if gateway is not publicly accessible from Google Cloud
- Fallback queue handles this automatically
- Consider monitoring the queue from OpenClaw instead

### Permission Errors

```bash
# Re-authenticate
firebase login --reauth

# Check IAM permissions in Google Cloud Console
# Functions need "Cloud Functions Developer" role
```

### High Costs

- Scheduled function runs every 5 minutes (~8,640 invocations/month)
- Disable retry scheduler if not needed:
  ```bash
  firebase functions:delete retryFailedNotifications
  ```

## Monitoring

### Firebase Console

- Functions → Dashboard: Invocation count, execution time, errors
- Functions → Logs: Real-time function logs
- Firestore → Data: View notification queue

### Set Up Alerts

Firebase Console → Functions → Health:
- Set alerts for error rate thresholds
- Get notified via email/SMS when functions fail

## Next Steps

1. **Test deployment** with a real message
2. **Monitor logs** for first few hours
3. **Adjust retry schedule** if needed (currently every 5 min)
4. **Implement OpenClaw Firestore listener** if gateway remains unreachable
5. **Add authentication** to webhook endpoint for security

## Security Notes

- Gateway token is currently hardcoded (consider using Secret Manager)
- Webhook endpoint should validate bearer token
- Firestore rules should restrict write access to authenticated users only

## Support

- Firebase documentation: https://firebase.google.com/docs/functions
- Cloud Functions pricing: https://firebase.google.com/pricing
- Firestore triggers: https://firebase.google.com/docs/functions/firestore-events
