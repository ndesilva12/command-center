#!/usr/bin/env node

/**
 * Helper script for sub-agents to save results to Firestore
 * Usage: node save-to-firestore.js <collection> <json-string>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Get command line arguments
const collection = process.argv[2];
const jsonString = process.argv[3];

if (!collection || !jsonString) {
  console.error('Usage: node save-to-firestore.js <collection> <json-string>');
  process.exit(1);
}

try {
  // Parse the JSON data
  const data = JSON.parse(jsonString);
  
  // Add timestamp and metadata
  const docData = {
    ...data,
    timestamp: new Date().toISOString(),
    saved_by: 'sub-agent',
    saved_at: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // Save to Firestore
  db.collection(collection)
    .add(docData)
    .then((docRef) => {
      console.log(`✅ Saved to Firestore: ${collection}/${docRef.id}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Firestore save error:', error.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
