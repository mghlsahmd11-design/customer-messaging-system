import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDo_uBayf6UugLoQI9wWMsvjv_R68vR2r8",
  authDomain: "gen-lang-client-0915945185.firebaseapp.com",
  projectId: "gen-lang-client-0915945185",
  storageBucket: "gen-lang-client-0915945185.firebasestorage.app",
  messagingSenderId: "1060544603298",
  appId: "1:1060544603298:web:141b1c2ad523d611e1a3fb"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-9fe72b31-3a75-478a-b022-efa9409f77bc");
