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

// Initialize Firebase App instance singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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
    msg.includes('Free daily read units') ||
    msg.includes('insufficient permissions') ||
    code === 'permission-denied'
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
    await setDoc(docRef, cleanFirestoreData(data), options);
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
    await updateDoc(docRef, cleanFirestoreData(data));
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

// Compress client image before upload to avoid memory and network bandwidth bottlenecks
export async function compressImageFile(file: File | Blob, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<Blob> {
  if (typeof window === 'undefined' || !(file instanceof Blob) || !file.type.startsWith('image/')) {
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
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        quality
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
    // Guard: Prevent Base64 strings from exceeding Firestore 1MB document limit
    if (data.startsWith('data:') && data.length > 900000) {
      console.warn('Blocked oversized Base64 string from Firestore document payload.');
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
    if (typeof window === 'undefined' || !(file instanceof Blob) || !file.type.startsWith('image/')) {
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
  options?: { contentType?: string }
): Promise<string> {
  try {
    const optimizedBlob = await compressImageFile(file);

    // Primary: Resilient server upload route /api/media/upload
    if (typeof window !== 'undefined') {
      let lastErrorMsg = '';

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const formData = new FormData();
          const fileName =
            file instanceof File && file.name
              ? file.name
              : `asset_${Date.now()}.jpg`;
          formData.append('file', optimizedBlob, fileName);
          if (storagePath) {
            const parts = storagePath.split('/');
            const folder = parts.length > 1 ? parts[0] : 'media';
            formData.append('folder', folder);
            formData.append('storagePath', storagePath);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          const res = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const downloadUrl = data.downloadURL || data.url;
            if (downloadUrl) {
              return downloadUrl;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            lastErrorMsg = errData.error || `Server responded with ${res.status}`;
            // If client error (4xx), do not retry
            if (res.status >= 400 && res.status < 500) {
              throw new Error(lastErrorMsg);
            }
          }
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') {
            lastErrorMsg = 'Upload timed out. Please check your network or upload a smaller file.';
          } else if (fetchErr.message && !fetchErr.message.includes('fetch')) {
            lastErrorMsg = fetchErr.message;
          }
          if (attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        }
      }

      if (lastErrorMsg && !lastErrorMsg.includes('fetch')) {
        console.warn('Server upload notice:', lastErrorMsg);
      }
    }

    // Direct Firebase Storage fallback ONLY if external bucket is explicitly active
    const isFirebaseStorageActive =
      !!firebaseConfig.storageBucket &&
      !firebaseConfig.storageBucket.includes('intelligent-park-95fd2');

    if (isFirebaseStorageActive) {
      try {
        storage.maxUploadRetryTime = 2500;
        storage.maxOperationRetryTime = 2500;
        const storageRef = ref(storage, storagePath);
        const metadata = options?.contentType
          ? { contentType: options.contentType }
          : file instanceof File && file.type
          ? { contentType: file.type }
          : { contentType: 'image/jpeg' };
        const snapshot = await uploadBytes(storageRef, optimizedBlob, metadata);
        return await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage upload notice:', storageErr);
      }
    }

    throw new Error('Upload could not be saved to storage. Please try again with a smaller file.');
  } catch (error: any) {
    console.error('Storage upload failed:', error?.message || error);
    throw new Error(error?.message || 'Storage upload failed. Please try again.');
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


