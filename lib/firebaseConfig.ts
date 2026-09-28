import rawConfig from '@/firebase-applet-config.json';

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

/**
 * Returns the resolved Firebase configuration.
 * Priority:
 * 1. NEXT_PUBLIC_FIREBASE_* (Client or Server in Next.js)
 * 2. FIREBASE_* (Server environment variables in Vercel / Cloud Run)
 * 3. firebase-applet-config.json (Default bundled project settings)
 */
export function getResolvedFirebaseConfig(): FirebaseAppConfig {
  const cfg = (rawConfig || {}) as Partial<FirebaseAppConfig>;

  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      cfg.apiKey ||
      '',
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      process.env.FIREBASE_AUTH_DOMAIN ||
      cfg.authDomain ||
      '',
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      cfg.projectId ||
      '',
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      cfg.storageBucket ||
      '',
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      cfg.messagingSenderId ||
      '',
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      process.env.FIREBASE_APP_ID ||
      cfg.appId ||
      '',
    firestoreDatabaseId:
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
      process.env.FIREBASE_DATABASE_ID ||
      process.env.FIRESTORE_DATABASE_ID ||
      cfg.firestoreDatabaseId ||
      '',
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
      process.env.FIREBASE_MEASUREMENT_ID ||
      cfg.measurementId ||
      '',
    oAuthClientId: cfg.oAuthClientId || '',
    recaptchaSiteKey: cfg.recaptchaSiteKey || '',
  };
}

export const firebaseConfig = getResolvedFirebaseConfig();
export default firebaseConfig;
