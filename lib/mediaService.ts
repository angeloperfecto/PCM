import {
  db,
  doc,
  uploadFileToFirebaseStorage,
  deleteFileFromFirebaseStorage,
  compressImageFile,
  getImageDimensions,
  safeSetDoc,
  safeDeleteDoc,
  cleanFirestoreData,
} from './firebase';
import { MediaItem } from './types';

export const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export interface MediaUploadOptions {
  category?: string;
  title?: string;
  altText?: string;
  caption?: string;
  folder?: string;
  tags?: string[];
  uploadedBy?: string;
  uploadedByUid?: string;
}

/**
 * Validates file size and image mime type before upload
 */
export function validateMediaFile(file: File | Blob): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided for upload.' };
  }

  // Size validation
  if (file.size > MAX_MEDIA_FILE_SIZE) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds maximum allowed upload size of 10 MB.`,
    };
  }

  // MIME type validation
  const fileType = file.type || '';
  if (fileType && !ALLOWED_IMAGE_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: `Unsupported format (${fileType}). Please upload a JPEG, PNG, WebP, GIF, or SVG image.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads an image file to Firebase Storage and records its metadata in Firestore.
 * Conforms to strict rule: File binary is stored ONLY in Firebase Storage,
 * never inside Firestore documents.
 */
export async function uploadMediaAsset(
  file: File | Blob,
  options: MediaUploadOptions = {}
): Promise<MediaItem> {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid media file.');
  }

  const rawFileName = (file as File).name || `pcm_media_${Date.now()}.jpg`;
  const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanTitle =
    options.title?.trim() ||
    rawFileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  const id = `med-${Date.now()}`;
  const storagePath = `mediaLibrary/${id}_${cleanFileName}`;

  // Compress image before upload (unless SVG)
  const isSvg = file.type === 'image/svg+xml';
  const processedBlob = isSvg ? file : await compressImageFile(file, 1920, 1080, 0.85);

  // Compute image dimensions
  let dimensions = '1600x1067';
  let width = 1600;
  let height = 1067;
  try {
    const dims = await getImageDimensions(file);
    if (dims.width && dims.height) {
      dimensions = `${dims.width}x${dims.height}`;
      width = dims.width;
      height = dims.height;
    }
  } catch (e) {
    console.warn('Dimensions calculation notice:', e);
  }

  // Upload to Storage via unified helper
  const downloadUrl = await uploadFileToFirebaseStorage(processedBlob, storagePath, {
    contentType: file.type || 'image/jpeg',
  });

  const now = new Date();
  const formattedSize = file.size
    ? file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : 'Custom Asset';

  const category = options.category || 'General';

  // Firestore Document contains ONLY metadata and the downloadURL
  const newMedia: MediaItem = cleanFirestoreData({
    id,
    title: cleanTitle,
    fileName: cleanFileName,
    originalFileName: rawFileName,
    storagePath,
    downloadURL: downloadUrl,
    url: downloadUrl,
    category,
    folder: options.folder || 'images',
    altText: options.altText?.trim() || `PCM ${cleanTitle}`,
    caption: options.caption?.trim() || '',
    fileSize: formattedSize,
    fileSizeBytes: file.size || 0,
    dimensions,
    width,
    height,
    contentType: file.type || 'image/jpeg',
    uploadDate: now.toISOString().split('T')[0],
    uploadedAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    uploadedBy: options.uploadedBy || 'Administrator',
    uploadedByUid: options.uploadedByUid || '',
    isActive: true,
    displayOrder: 0,
    tags: options.tags || [],
  });

  // Persist metadata to Firestore
  await safeSetDoc(doc(db, 'mediaLibrary', newMedia.id), newMedia);
  await safeSetDoc(doc(db, 'mediaItems', newMedia.id), newMedia);

  return newMedia;
}

/**
 * Replaces an existing media file in Firebase Storage and updates Firestore metadata
 */
export async function replaceMediaAsset(
  id: string,
  newFile: File | Blob,
  existingItem: MediaItem
): Promise<MediaItem> {
  const validation = validateMediaFile(newFile);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid media file.');
  }

  const rawFileName = (newFile as File).name || `pcm_media_${Date.now()}.jpg`;
  const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `mediaLibrary/${id}_${cleanFileName}`;

  const isSvg = newFile.type === 'image/svg+xml';
  const processedBlob = isSvg ? newFile : await compressImageFile(newFile, 1920, 1080, 0.85);

  let dimensions = existingItem.dimensions || '1600x1067';
  let width = existingItem.width || 1600;
  let height = existingItem.height || 1067;
  try {
    const dims = await getImageDimensions(newFile);
    if (dims.width && dims.height) {
      dimensions = `${dims.width}x${dims.height}`;
      width = dims.width;
      height = dims.height;
    }
  } catch (e) {
    console.warn('Dimensions calculation notice:', e);
  }

  const downloadUrl = await uploadFileToFirebaseStorage(processedBlob, storagePath, {
    contentType: newFile.type || 'image/jpeg',
  });

  // Try to delete old storage file if path changed
  if (existingItem.storagePath && existingItem.storagePath !== storagePath) {
    deleteFileFromFirebaseStorage(existingItem.storagePath).catch((e) => {
      console.warn('Could not remove previous storage file:', e);
    });
  }

  const now = new Date();
  const formattedSize = newFile.size
    ? newFile.size < 1024 * 1024
      ? `${(newFile.size / 1024).toFixed(1)} KB`
      : `${(newFile.size / (1024 * 1024)).toFixed(1)} MB`
    : existingItem.fileSize;

  const updatedMedia: MediaItem = cleanFirestoreData({
    ...existingItem,
    fileName: cleanFileName,
    storagePath,
    downloadURL: downloadUrl,
    url: downloadUrl,
    fileSize: formattedSize,
    fileSizeBytes: newFile.size || existingItem.fileSizeBytes,
    dimensions,
    width,
    height,
    contentType: newFile.type || existingItem.contentType || 'image/jpeg',
    updatedAt: now.toISOString(),
  });

  await safeSetDoc(doc(db, 'mediaLibrary', id), updatedMedia, { merge: true });
  await safeSetDoc(doc(db, 'mediaItems', id), updatedMedia, { merge: true });

  return updatedMedia;
}

/**
 * Deletes a media asset from Firestore and Firebase Storage
 */
export async function deleteMediaAsset(
  id: string,
  storagePath?: string
): Promise<boolean> {
  // Delete from Firestore
  await safeDeleteDoc(doc(db, 'mediaLibrary', id));
  await safeDeleteDoc(doc(db, 'mediaItems', id));

  // Delete from Storage if storagePath exists
  if (storagePath) {
    await deleteFileFromFirebaseStorage(storagePath);
  }

  return true;
}
