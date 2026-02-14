#!/usr/bin/env node

/**
 * Update a Firestore document with provided data
 * Usage: node update-firestore-doc.js <collection> <docId> '<json>'
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.error('✓ Firebase Admin initialized');
  } catch (error) {
    console.error('✗ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function updateDocument(collection, docId, data) {
  try {
    const docRef = db.collection(collection).doc(docId);
    
    // Parse JSON data
    let updateData;
    try {
      updateData = JSON.parse(data);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    
    // Update document
    await docRef.update(updateData);
    
    console.log(`✓ Updated ${collection}/${docId}`);
    console.log(JSON.stringify(updateData, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error(`✗ Update failed: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node update-firestore-doc.js <collection> <docId> \'<json>\'');
  console.error('Example: node update-firestore-doc.js summaries abc123 \'{"status":"completed"}\'');
  process.exit(1);
}

const [collection, docId, jsonData] = args;

updateDocument(collection, docId, jsonData);
