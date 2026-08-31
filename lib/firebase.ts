import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

// Initialize Storage
export const storage = getStorage(app);

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
  signInWithPopup,
  signOut,
};

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
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
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

// Compress client image before upload to avoid memory and network bandwidth bottlenecks
async function compressImageFile(file: File | Blob, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<Blob> {
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

export async function uploadFileToFirebaseStorage(
  file: File | Blob,
  storagePath: string
): Promise<string> {
  try {
    const optimizedBlob = await compressImageFile(file);
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, optimizedBlob);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase storage upload fallback to optimized data URL:', error);
    const optimizedBlob = await compressImageFile(file, 1200, 800, 0.75);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(optimizedBlob);
    });
  }
}


