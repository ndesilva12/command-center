import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function triggered when a new message is added to jimmy_chat_messages
 * Sends notification to OpenClaw gateway when user sends a message
 */
export const onNewChatMessage = functions.firestore
  .document('jimmy_chat_messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const messageId = context.params.messageId;
    
    // Only trigger for user messages with "pending" status
    if (message.sender !== 'user' || message.status !== 'pending') {
      console.log(`Skipping message ${messageId}: sender=${message.sender}, status=${message.status}`);
      return null;
    }
    
    console.log(`Processing new user message: ${messageId}`);
    
    // Update status to "processing" immediately
    await snap.ref.update({ status: 'processing' });
    
    // Attempt 1: Notify OpenClaw gateway via webhook
    try {
      const gatewayUrl = 'http://3.128.31.231:18789/api/v1/webhook/jimmy-chat';
      const token = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';
      
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId: messageId,
          message: message.message,
          userId: message.userId,
          sessionId: message.sessionId,
          timestamp: message.timestamp,
          source: 'firebase-cloud-function'
        })
      });
      
      if (response.ok) {
        console.log(`✓ Gateway notification sent successfully: ${response.status}`);
        return null;
      } else {
        console.warn(`Gateway responded with error: ${response.status}`);
        throw new Error(`Gateway returned ${response.status}`);
      }
    } catch (gatewayError) {
      console.error('Gateway notification failed:', gatewayError);
      
      // Attempt 2: Fallback to notification queue in Firestore
      // This allows OpenClaw to monitor a separate collection for notifications
      try {
        await admin.firestore().collection('jimmy_chat_notifications').add({
          messageId: messageId,
          message: message.message,
          userId: message.userId,
          sessionId: message.sessionId,
          timestamp: message.timestamp,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending',
          attempts: 0,
          error: gatewayError instanceof Error ? gatewayError.message : String(gatewayError)
        });
        
        console.log('✓ Notification added to jimmy_chat_notifications queue');
        return null;
      } catch (fallbackError) {
        console.error('Fallback notification failed:', fallbackError);
        
        // Revert status back to pending so it can be retried or handled manually
        await snap.ref.update({ status: 'pending' });
        throw fallbackError;
      }
    }
  });

/**
 * Optional: Retry failed notifications from the queue
 * Run this on a schedule (e.g., every 5 minutes) to retry gateway notifications
 */
export const retryFailedNotifications = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();
    const maxAttempts = 3;
    
    // Find pending notifications that haven't exceeded max attempts
    const snapshot = await db.collection('jimmy_chat_notifications')
      .where('status', '==', 'pending')
      .where('attempts', '<', maxAttempts)
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      console.log('No pending notifications to retry');
      return null;
    }
    
    console.log(`Found ${snapshot.size} notifications to retry`);
    
    const gatewayUrl = 'http://3.128.31.231:18789/api/v1/webhook/jimmy-chat';
    const token = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';
    
    for (const doc of snapshot.docs) {
      const notification = doc.data();
      
      try {
        const response = await fetch(gatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messageId: notification.messageId,
            message: notification.message,
            userId: notification.userId,
            sessionId: notification.sessionId,
            timestamp: notification.timestamp,
            source: 'firebase-cloud-function-retry'
          })
        });
        
        if (response.ok) {
          // Mark as delivered
          await doc.ref.update({
            status: 'delivered',
            deliveredAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✓ Notification ${doc.id} delivered on retry`);
        } else {
          // Increment attempts
          await doc.ref.update({
            attempts: admin.firestore.FieldValue.increment(1),
            lastError: `Gateway returned ${response.status}`
          });
          console.warn(`Retry failed for ${doc.id}: ${response.status}`);
        }
      } catch (error) {
        // Increment attempts and log error
        await doc.ref.update({
          attempts: admin.firestore.FieldValue.increment(1),
          lastError: error instanceof Error ? error.message : String(error)
        });
        console.error(`Retry failed for ${doc.id}:`, error);
      }
    }
    
    return null;
  });
