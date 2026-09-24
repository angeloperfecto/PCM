import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Support both checked-in config and environment variables for Vercel/cloud deployments
const resolvedFirebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || (firebaseConfig as any).measurementId || '',
};

// Initialize Firebase App instance singleton
const app = !getApps().length ? initializeApp(resolvedFirebaseConfig) : getApp();

// Initialize Firestore with auto-detect long polling for maximum reliability in iframes, proxies, and Vercel
export const db = (() => {
  try {
    if (resolvedFirebaseConfig.firestoreDatabaseId) {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      }, resolvedFirebaseConfig.firestoreDatabaseId);
    }
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    // If already initialized, retrieve existing instance
    return resolvedFirebaseConfig.firestoreDatabaseId
      ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Storage with low retry limits to avoid hanging if bucket is unprovisioned
export const storage = getStorage(app);
try {
  storage.maxUploadRetryTime = 3000;
  storage.maxOperationRetryTime = 3000;
} catch {
  // Ignore in environments where properties cannot be assigned
}

export {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  query,
  orderBy,
  where,
  limit,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
};
export type { FirebaseUser };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function logFirestoreOp(
  opType: 'read' | 'write' | 'listen',
  path: string,
  reason: string,
  details?: any
): void {
  if (process.env.NODE_ENV === 'development') {
    const emoji = opType === 'read' ? '📖 READ' : opType === 'write' ? '✍️ WRITE' : '🎧 LISTEN';
    console.info(
      `[PCM Firestore DevLog] ${emoji} | Path: ${path} | Reason: ${reason}`,
      details !== undefined ? details : ''
    );
  }
}

export function isFirestoreQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Write stream exhausted') ||
    msg.includes('maximum allowed queued writes') ||
    msg.includes('maximum backoff delay') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('quota metric') ||
    msg.includes('Free daily read units')
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const isQuota = isFirestoreQuotaError(error);
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  if (isQuota) {
    console.warn(
      `[PCM Firestore Notice] ${operationType} operation on ${path || 'database'} deferred (${errInfo.error.substring(0, 100)}). State maintained locally.`
    );
  } else {
    console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  }
}

// Circuit breaker for Firestore write operations to prevent write stream exhaustion
let firestoreWriteBlockedUntil = 0;
const WRITE_CIRCUIT_BREAKER_MS = 2 * 60 * 1000; // 2 minutes

// Resilient safe write wrappers to prevent stream exhaustion
export async function safeSetDoc(
  docRef: any,
  data: any,
  options: { merge?: boolean } = { merge: true }
): Promise<boolean> {
  if (Date.now() < firestoreWriteBlockedUntil) {
    return false;
  }
  try {
    let cleaned = cleanFirestoreData(data);
    // Extra safety: Firestore 1MB document limit guard
    try {
      const payloadSize = JSON.stringify(cleaned).length;
      if (payloadSize > 900000) {
        console.warn(`[PCM Firestore Guard] Document ${docRef?.path || ''} size (${payloadSize} bytes) near 1MB. Sanitizing nested base64 strings.`);
        if (cleaned && typeof cleaned === 'object') {
          if (Array.isArray((cleaned as any).photos)) {
            (cleaned as any).photos = (cleaned as any).photos.map((p: any) => {
              if (p?.imageUrl?.startsWith('data:')) {
                return { ...p, imageUrl: '', thumbnailUrl: '' };
              }
              return p;
            });
          }
        }
      }
    } catch {}

    await setDoc(docRef, cleaned, options);
    return true;
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      firestoreWriteBlockedUntil = Date.now() + WRITE_CIRCUIT_BREAKER_MS;
    }
    handleFirestoreError(err, OperationType.WRITE, docRef?.path || null);
    return false;
  }
}

export async function safeUpdateDoc(docRef: any, data: any): Promise<boolean> {
  if (Date.now() < firestoreWriteBlockedUntil) {
    return false;
  }
  try {
    let cleaned = cleanFirestoreData(data);
    try {
      const payloadSize = JSON.stringify(cleaned).length;
      if (payloadSize > 900000) {
        console.warn(`[PCM Firestore Guard] Document ${docRef?.path || ''} size (${payloadSize} bytes) near 1MB.`);
        if (cleaned && typeof cleaned === 'object') {
          if (Array.isArray((cleaned as any).photos)) {
            (cleaned as any).photos = (cleaned as any).photos.map((p: any) => {
              if (p?.imageUrl?.startsWith('data:')) {
                return { ...p, imageUrl: '', thumbnailUrl: '' };
              }
              return p;
            });
          }
        }
      }
    } catch {}

    await updateDoc(docRef, cleaned);
    return true;
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      firestoreWriteBlockedUntil = Date.now() + WRITE_CIRCUIT_BREAKER_MS;
    }
    handleFirestoreError(err, OperationType.UPDATE, docRef?.path || null);
    return false;
  }
}

export async function safeDeleteDoc(docRef: any): Promise<boolean> {
  if (Date.now() < firestoreWriteBlockedUntil) {
    return false;
  }
  try {
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      firestoreWriteBlockedUntil = Date.now() + WRITE_CIRCUIT_BREAKER_MS;
    }
    handleFirestoreError(err, OperationType.DELETE, docRef?.path || null);
    return false;
  }
}

// Convert Blob or File to Base64 Data URL
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

// Compress client image before upload to avoid memory and network bandwidth bottlenecks
export async function compressImageFile(
  file: File | Blob,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82
): Promise<Blob> {
  if (typeof window === 'undefined' || !(file instanceof Blob) || !file.type?.startsWith('image/')) {
    return file;
  }
  // If SVG or gif animation, do not compress through canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Keep PNG format only for small graphics (< 500KB) that might require transparency;
      // otherwise export as high quality JPEG to reduce payload from ~5MB down to ~150-250KB
      const shouldKeepPng = file.type === 'image/png' && file.size < 500 * 1024;
      const targetMime = shouldKeepPng ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        targetMime,
        targetMime === 'image/jpeg' ? quality : undefined
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    // Guard: Prevent Base64 strings from bloating Firestore documents (Firestore hard limit is 1MB per document)
    // Any image string > 30KB must never be saved directly into a Firestore doc!
    if (data.startsWith('data:image/') && data.length > 30000) {
      console.warn('Blocked oversized Base64 image from Firestore payload to protect 1MB document limit.');
      return '' as unknown as T;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(cleanFirestoreData) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const res: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        res[key] = cleanFirestoreData(value);
      }
    }
    return res as T;
  }
  return data;
}

export async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !(file instanceof Blob) || !file.type?.startsWith('image/')) {
      resolve({ width: 0, height: 0 });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

export async function uploadFileToFirebaseStorage(
  file: File | Blob,
  storagePath: string,
  options?: { contentType?: string; fileName?: string }
): Promise<string> {
  try {
    const optimizedBlob = await compressImageFile(file, 1600, 1600, 0.80);
    const fileName =
      options?.fileName ||
      (file instanceof File && file.name ? file.name : (file as any).fileName) ||
      `asset_${Date.now()}.jpg`;

    let parts = (storagePath || '').split('/');
    let folder = parts.length > 1 ? parts[0] : 'media';

    // Primary: Resilient server upload route /api/media/upload via FormData
    if (typeof window !== 'undefined') {
      try {
        const formData = new FormData();
        formData.append('file', optimizedBlob, fileName);
        formData.append('folder', folder);
        if (storagePath) {
          formData.append('storagePath', storagePath);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          const downloadUrl = data.downloadURL || data.url || data.publicUrl;
          if (downloadUrl && !downloadUrl.startsWith('data:')) {
            return downloadUrl;
          }
          if (downloadUrl) {
            return downloadUrl;
          }
        }
      } catch (formErr) {
        console.warn('Multipart upload notice, attempting JSON transport:', formErr);
      }

      // Secondary Server Upload: JSON transport with Base64 payload
      // Completely immune to multipart boundary corruption or proxy buffering
      try {
        const dataUrl = await blobToDataUrl(optimizedBlob);
        if (dataUrl) {
          const jsonController = new AbortController();
          const jsonTimeoutId = setTimeout(() => jsonController.abort(), 25000);

          const jsonRes = await fetch('/api/media/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              base64: dataUrl,
              fileName,
              folder,
              storagePath,
            }),
            signal: jsonController.signal,
          });
          clearTimeout(jsonTimeoutId);

          const jsonContentType = jsonRes.headers.get('content-type') || '';
          if (jsonRes.ok && jsonContentType.includes('application/json')) {
            const data = await jsonRes.json();
            const downloadUrl = data.downloadURL || data.url || data.publicUrl;
            if (downloadUrl) {
              return downloadUrl;
            }
          }
        }
      } catch (jsonErr) {
        console.warn('JSON upload transport notice:', jsonErr);
      }
    }

    // Direct Firebase Storage fallback ONLY if external bucket is explicitly active
    const isFirebaseStorageActive =
      !!firebaseConfig.storageBucket &&
      !firebaseConfig.storageBucket.includes('intelligent-park-95fd2');

    if (isFirebaseStorageActive) {
      try {
        storage.maxUploadRetryTime = 3000;
        storage.maxOperationRetryTime = 3000;
        const storageRef = ref(storage, storagePath);
        const metadata = options?.contentType
          ? { contentType: options.contentType }
          : file instanceof File && file.type
          ? { contentType: file.type }
          : { contentType: 'image/jpeg' };
        const snapshot = await uploadBytes(storageRef, optimizedBlob, metadata);
        return await getDownloadURL(snapshot.ref);
      } catch (storageErr: any) {
        console.warn('Firebase Storage direct upload notice:', storageErr?.message || storageErr);
      }
    }

    // Emergency client-side fallback: Ultra-compact thumbnail (<25KB) so document never exceeds Firestore limits
    if (typeof window !== 'undefined' && (optimizedBlob instanceof Blob || (file as any).type?.startsWith('image/'))) {
      try {
        const compactBlob = await compressImageFile(file, 640, 480, 0.55);
        const compactDataUrl = await blobToDataUrl(compactBlob);
        if (compactDataUrl && compactDataUrl.length < 30000) {
          return compactDataUrl;
        }
      } catch {
        // Fallback
      }
    }

    return '';
  } catch (outerErr: any) {
    console.error('uploadFileToFirebaseStorage failed:', outerErr);
    return '';
  }
}

export async function deleteFileFromFirebaseStorage(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;
  try {
    let relPath = storagePath.replace(/^\//, '');
    if (relPath.startsWith('uploads/')) {
      if (typeof window !== 'undefined') {
        fetch('/api/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: relPath }),
        }).catch(() => {});
      }
      return true;
    }

    const isFirebaseStorageActive =
      !!firebaseConfig.storageBucket &&
      !firebaseConfig.storageBucket.includes('intelligent-park-95fd2');

    if (isFirebaseStorageActive) {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Firebase storage delete file notice:', err);
    return false;
  }
}

// Optional graceful connection check helper
export async function testConnection(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const snap = await getDoc(doc(db, 'siteConfig', 'global'));
    return snap.exists();
  } catch {
    return false;
  }
}


