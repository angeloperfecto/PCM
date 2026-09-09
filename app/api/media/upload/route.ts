import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '@/firebase-applet-config.json';

// Helper to determine image dimensions from binary buffer without external libraries
function getImageDimensionsFromBuffer(buffer: Buffer, mimeType: string): { width: number; height: number } {
  try {
    if (mimeType === 'image/png' && buffer.length >= 24) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    if (mimeType === 'image/gif' && buffer.length >= 10) {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }
    if ((mimeType === 'image/jpeg' || mimeType === 'image/jpg') && buffer.length >= 4) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const blockLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + blockLength;
      }
    }
    if (mimeType === 'image/webp' && buffer.length >= 30) {
      if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
      if (buffer.toString('ascii', 12, 16) === 'VP8L') {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        return { width, height };
      }
    }
  } catch {
    // Return default on parsing notice
  }
  return { width: 1600, height: 1067 };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mediaId = (formData.get('mediaId') as string) || `med-${Date.now()}`;
    const explicitFolder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No media file provided.' }, { status: 400 });
    }

    // 1. File validation
    const mimeType = file.type || 'image/jpeg';
    const isImage = mimeType.startsWith('image/');
    const isDoc = mimeType === 'application/pdf' || mimeType.includes('document') || mimeType.includes('msword');
    const isVideo = mimeType.startsWith('video/');

    if (!isImage && !isDoc && !isVideo) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: Images (JPG, PNG, WEBP, GIF, SVG), Documents (PDF), Videos (MP4).' },
        { status: 400 }
      );
    }

    // Max file size: 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File size (${sizeMB} MB) exceeds the maximum allowed limit of 25 MB.` },
        { status: 400 }
      );
    }

    const folder = explicitFolder || (isImage ? 'images' : isDoc ? 'documents' : 'videos');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Clean filename
    const originalFileName = file.name || `pcm_media_${Date.now()}.jpg`;
    const ext = path.extname(originalFileName) || (isImage ? '.jpg' : '.bin');
    const baseName = path.basename(originalFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = `${mediaId}_${baseName}${ext}`;
    const storagePath = `pcm/media-library/${folder}/${cleanFileName}`;

    // Dimensions
    const { width, height } = isImage ? getImageDimensionsFromBuffer(buffer, mimeType) : { width: 0, height: 0 };
    const dimensionsStr = width && height ? `${width}x${height}` : '';

    // Formatted size
    const formattedSize =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // 2. Always persist locally in public/uploads/pcm/media-library/${folder}/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pcm', 'media-library', folder);
    await fs.mkdir(uploadDir, { recursive: true });
    const localFilePath = path.join(uploadDir, cleanFileName);
    await fs.writeFile(localFilePath, buffer);
    const localUrl = `/uploads/pcm/media-library/${folder}/${cleanFileName}`;

    let finalDownloadUrl = localUrl;
    let provider = 'local_storage';

    // 3. Try Firebase Storage upload
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const storage = getStorage(app);
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, buffer, {
        contentType: mimeType,
      });
      const firebaseUrl = await getDownloadURL(storageRef);
      if (firebaseUrl) {
        finalDownloadUrl = firebaseUrl;
        provider = 'firebase_storage';
      }
    } catch (storageErr: any) {
      console.warn('Firebase Storage upload notice (using server storage):', storageErr?.message || storageErr);
    }

    return NextResponse.json({
      success: true,
      downloadURL: finalDownloadUrl,
      url: finalDownloadUrl,
      storagePath,
      fileName: cleanFileName,
      originalFileName,
      folder,
      contentType: mimeType,
      fileSize: formattedSize,
      fileSizeBytes: file.size,
      width,
      height,
      dimensions: dimensionsStr,
      provider,
    });
  } catch (error: any) {
    console.error('Error in /api/media/upload:', error);
    return NextResponse.json({ error: error.message || 'Internal upload error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get('storagePath');

    if (!storagePath) {
      return NextResponse.json({ error: 'Storage path is required.' }, { status: 400 });
    }

    // Try deleting from local disk if it matches
    const parts = storagePath.split('/');
    if (parts.length >= 4 && parts[0] === 'pcm' && parts[1] === 'media-library') {
      const folder = parts[2];
      const filename = parts.slice(3).join('/');
      const localFilePath = path.join(process.cwd(), 'public', 'uploads', 'pcm', 'media-library', folder, filename);
      try {
        await fs.unlink(localFilePath);
      } catch {
        // Ignore if file doesn't exist locally
      }
    }

    // Try deleting from Firebase Storage
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const storage = getStorage(app);
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (e: any) {
      console.warn('Firebase Storage delete notice:', e?.message || e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete error' }, { status: 500 });
  }
}
