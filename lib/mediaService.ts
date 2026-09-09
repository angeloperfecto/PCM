import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, cleanFirestoreData, getImageDimensions } from './firebase';
import { MediaItem } from './types';

export const MAX_MEDIA_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  sizeFormatted?: string;
}

/**
 * Validates file size and format before any upload or processing occurs
 */
export function validateMediaFile(
  file: File | Blob,
  options?: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
  }
): MediaValidationResult {
  const maxSize = options?.maxSizeBytes || MAX_MEDIA_FILE_SIZE;
  const size = file.size || 0;
  const type = file.type || '';

  const sizeFormatted =
    size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(1)} MB`;

  if (size > maxSize) {
    const limitFormatted = `${(maxSize / (1024 * 1024)).toFixed(0)} MB`;
    return {
      valid: false,
      error: `File size (${sizeFormatted}) exceeds the maximum allowed limit of ${limitFormatted}. Please select an optimized image.`,
      sizeFormatted,
    };
  }

  const isImage = type.startsWith('image/');
  const isDoc = type === 'application/pdf' || type.includes('document') || type.includes('msword');
  const isVideo = type.startsWith('video/');

  if (!isImage && !isDoc && !isVideo) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload an image (PNG, JPG, WEBP, GIF, SVG), PDF document, or MP4 video.',
      sizeFormatted,
    };
  }

  return { valid: true, sizeFormatted };
}

export interface UploadMediaOptions {
  title?: string;
  category?: string;
  altText?: string;
  caption?: string;
  folder?: string;
  tags?: string[];
  uploadedBy?: string;
  uploadedByUid?: string;
}

/**
 * Uploads a media file to Storage and records ONLY lightweight metadata in Firestore
 * NEVER stores Base64 or binary data inside Firestore documents
 */
export async function uploadMediaAsset(
  file: File | Blob,
  options: UploadMediaOptions = {}
): Promise<MediaItem> {
  // 1. Strict validation
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file.');
  }

  const mediaId = `med-${Date.now()}`;
  const rawFileName = (file as File).name || `pcm_asset_${Date.now()}.jpg`;
  const cleanTitle =
    options.title?.trim() ||
    rawFileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  // 2. Upload file via the server API to Storage
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mediaId', mediaId);
  if (options.folder) {
    formData.append('folder', options.folder);
  }

  const res = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(errData.error || `Upload failed with status ${res.status}`);
  }

  const uploadResult = await res.json();
  const {
    downloadURL,
    storagePath,
    fileName,
    originalFileName,
    folder,
    contentType,
    fileSize,
    fileSizeBytes,
    width,
    height,
    dimensions,
  } = uploadResult;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const isoStr = now.toISOString();

  // 3. Construct lightweight metadata object (strictly no base64)
  const newMediaItem: MediaItem = cleanFirestoreData({
    id: mediaId,
    title: cleanTitle,
    fileName,
    originalFileName: originalFileName || rawFileName,
    storagePath,
    downloadURL,
    url: downloadURL,
    category: options.category || 'General',
    folder: folder || 'images',
    altText: options.altText?.trim() || cleanTitle,
    caption: options.caption?.trim() || '',
    fileSize,
    fileSizeBytes: fileSizeBytes || file.size || 0,
    dimensions: dimensions || `${width || 1600}x${height || 1067}`,
    width: width || 1600,
    height: height || 1067,
    contentType: contentType || file.type || 'image/jpeg',
    uploadDate: dateStr,
    uploadedAt: isoStr,
    createdAt: isoStr,
    updatedAt: isoStr,
    uploadedBy: options.uploadedBy || 'Administrator',
    uploadedByUid: options.uploadedByUid || '',
    isActive: true,
    displayOrder: 0,
    tags: options.tags || [],
  });

  // 4. Save metadata to Firestore in both collections
  try {
    await setDoc(doc(db, 'mediaLibrary', mediaId), newMediaItem);
    await setDoc(doc(db, 'mediaItems', mediaId), newMediaItem);
  } catch (firestoreError: any) {
    console.error('Firestore metadata write failed, attempting cleanup of uploaded storage file:', firestoreError);
    // Rollback storage file so no orphan asset is left
    if (storagePath) {
      fetch(`/api/media/upload?storagePath=${encodeURIComponent(storagePath)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    throw new Error(`Failed to save media metadata: ${firestoreError.message || firestoreError}`);
  }

  return newMediaItem;
}

/**
 * Replaces the storage file for an existing media item, maintaining IDs and updating metadata
 */
export async function replaceMediaAsset(
  id: string,
  newFile: File | Blob,
  existingItem: MediaItem
): Promise<MediaItem> {
  const validation = validateMediaFile(newFile);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid replacement file.');
  }

  const formData = new FormData();
  formData.append('file', newFile);
  formData.append('mediaId', id);
  if (existingItem.folder) {
    formData.append('folder', existingItem.folder);
  }

  const res = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Replacement upload failed' }));
    throw new Error(errData.error || 'Replacement upload failed');
  }

  const uploadResult = await res.json();
  const {
    downloadURL,
    storagePath,
    fileName,
    originalFileName,
    fileSize,
    fileSizeBytes,
    width,
    height,
    dimensions,
    contentType,
  } = uploadResult;

  const oldStoragePath = existingItem.storagePath;
  const now = new Date().toISOString();

  const updatedItem: MediaItem = cleanFirestoreData({
    ...existingItem,
    fileName,
    originalFileName: originalFileName || existingItem.originalFileName,
    storagePath,
    downloadURL,
    url: downloadURL,
    fileSize,
    fileSizeBytes,
    width: width || existingItem.width || 1600,
    height: height || existingItem.height || 1067,
    dimensions: dimensions || existingItem.dimensions,
    contentType: contentType || existingItem.contentType,
    updatedAt: now,
  });

  // Save new metadata first
  await setDoc(doc(db, 'mediaLibrary', id), updatedItem, { merge: true });
  await setDoc(doc(db, 'mediaItems', id), updatedItem, { merge: true });

  // Only delete old storage file after successful update and only if path changed
  if (oldStoragePath && oldStoragePath !== storagePath) {
    fetch(`/api/media/upload?storagePath=${encodeURIComponent(oldStoragePath)}`, {
      method: 'DELETE',
    }).catch(() => {});
  }

  return updatedItem;
}

/**
 * Deletes a media asset from Firestore and Storage
 */
export async function deleteMediaAsset(id: string, storagePath?: string): Promise<void> {
  await deleteDoc(doc(db, 'mediaLibrary', id)).catch(() => {});
  await deleteDoc(doc(db, 'mediaItems', id)).catch(() => {});

  if (storagePath) {
    fetch(`/api/media/upload?storagePath=${encodeURIComponent(storagePath)}`, {
      method: 'DELETE',
    }).catch(() => {});
  }
}
