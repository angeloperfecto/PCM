import rawConfigJson from '@/firebase-applet-config.json';

const rawConfig: Partial<FirebaseAppConfig> = (rawConfigJson || {}) as Partial<FirebaseAppConfig>;

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

function isUsableValue(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed !== '' &&
    trimmed !== 'admin' &&
    trimmed !== 'undefined' &&
    trimmed !== 'null' &&
    trimmed !== 'YOUR_API_KEY'
  );
}

/**
 * Returns the resolved Firebase configuration.
 * Always prioritizes the authentic project credentials in firebase-applet-config.json,
 * falling back or overriding only with valid, non-placeholder environment variables.
 */
export function getResolvedFirebaseConfig(): FirebaseAppConfig {
  const cfg = (rawConfig || {}) as Partial<FirebaseAppConfig>;

  // Detect valid overrides or fall back to verified firebase-applet-config.json
  const apiKey = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.FIREBASE_API_KEY,
  ].find((v) => isUsableValue(v) && v!.startsWith('AIza')) || cfg.apiKey || '';

  const projectId = [
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.FIREBASE_PROJECT_ID,
  ].find(isUsableValue) || cfg.projectId || '';

  const authDomain = [
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.FIREBASE_AUTH_DOMAIN,
  ].find(isUsableValue) || cfg.authDomain || (projectId ? `${projectId}.firebaseapp.com` : '');

  const storageBucket = [
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.FIREBASE_STORAGE_BUCKET,
  ].find(isUsableValue) || cfg.storageBucket || (projectId ? `${projectId}.firebasestorage.app` : '');

  const messagingSenderId = [
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.FIREBASE_MESSAGING_SENDER_ID,
  ].find(isUsableValue) || cfg.messagingSenderId || '';

  const appId = [
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    process.env.FIREBASE_APP_ID,
  ].find(isUsableValue) || cfg.appId || '';

  const firestoreDatabaseId = [
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID,
    process.env.FIREBASE_DATABASE_ID,
    process.env.FIRESTORE_DATABASE_ID,
  ].find((v) => isUsableValue(v) && v !== 'admin') || cfg.firestoreDatabaseId || '';

  const measurementId = [
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    process.env.FIREBASE_MEASUREMENT_ID,
  ].find(isUsableValue) || cfg.measurementId || '';

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    firestoreDatabaseId,
    measurementId,
    oAuthClientId: cfg.oAuthClientId || '',
    recaptchaSiteKey: cfg.recaptchaSiteKey || '',
  };
}

export const firebaseConfig = getResolvedFirebaseConfig();
export default firebaseConfig;
