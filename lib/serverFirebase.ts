import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

let cachedDb: Firestore | null = null;

const resolvedFirebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

export function getServerFirestore(): Firestore {
  if (cachedDb) return cachedDb;
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(resolvedFirebaseConfig);
  try {
    if (resolvedFirebaseConfig.firestoreDatabaseId) {
      cachedDb = initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        resolvedFirebaseConfig.firestoreDatabaseId
      );
    } else {
      cachedDb = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    }
  } catch {
    cachedDb = resolvedFirebaseConfig.firestoreDatabaseId
      ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
  return cachedDb;
}

export function isIgnorableFirestoreError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    code === 'resource-exhausted' ||
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('could not reach cloud firestore') ||
    msg.includes('client is offline') ||
    msg.includes('network') ||
    msg.includes('quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('write stream exhausted') ||
    msg.includes('maximum allowed queued writes')
  );
}
