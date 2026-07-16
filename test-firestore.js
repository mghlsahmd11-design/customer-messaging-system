import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

const app = initializeApp({
  projectId: config.projectId,
  credential: applicationDefault()
});

const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const res = await db.collection('messages').limit(1).get();
    console.log('Success:', res.size);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
