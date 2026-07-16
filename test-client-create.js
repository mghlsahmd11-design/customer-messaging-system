import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const ref = await addDoc(collection(db, 'messages'), { text: 'test' });
    console.log('Success, doc ID:', ref.id);
  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
run();
