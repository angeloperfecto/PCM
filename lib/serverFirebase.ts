import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

let cachedDb: Firestore | null = null;

export function getServerFirestore(): Firestore {
  if (cachedDb) return cachedDb;
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    if (firebaseConfig.firestoreDatabaseId) {
      cachedDb = initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId
      );
    } else {
      cachedDb = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    }
  } catch {
    cachedDb = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
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
