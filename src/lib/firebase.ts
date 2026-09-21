import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'textech-cmms.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'textech-cmms',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'textech-cmms.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key' &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('ReplaceWithYourOwn') &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('YOUR_') &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.toLowerCase().includes('dummy')
);

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export default app;
