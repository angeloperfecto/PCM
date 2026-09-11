import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '@/firebase-applet-config.json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = (formData.get('folder') as string) || 'media';
    const customStoragePath = formData.get('storagePath') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Limit size to 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawFileName = file.name || (formData.get('fileName') as string) || `upload_${Date.now()}.jpg`;
    const ext = path.extname(rawFileName) || '.jpg';
    const cleanBase = path.basename(rawFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_') || `file_${Date.now()}`;
    const timestamp = Date.now();
    const sanitizedFolder = requestedFolder.replace(/[^a-zA-Z0-9_-]/g, '_') || 'media';
    const uniqueFilename = `${sanitizedFolder}_${timestamp}_${cleanBase}${ext}`;

    // 1. Check if Firebase Storage bucket is active and reachable (cached)
    let isBucketAvailable = false;
    if (firebaseConfig.storageBucket && !firebaseConfig.storageBucket.includes('intelligent-park-95fd2')) {
      try {
        const probeController = new AbortController();
        const probeTimeout = setTimeout(() => probeController.abort(), 1200);
        const probeRes = await fetch(
          `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o`,
          { signal: probeController.signal }
        ).catch(() => null);
        clearTimeout(probeTimeout);

        // Only consider available if status is explicitly 200
        if (probeRes && probeRes.status === 200) {
          isBucketAvailable = true;
        }
      } catch {
        isBucketAvailable = false;
      }
    }

    // 2. Try Firebase Storage if bucket is verified available
    if (isBucketAvailable) {
      try {
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
        const storage = getStorage(app);
        storage.maxUploadRetryTime = 4000;
        storage.maxOperationRetryTime = 4000;

        const storagePath = customStoragePath || `${sanitizedFolder}/${uniqueFilename}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, buffer, {
          contentType: file.type || 'image/jpeg',
        });
        const downloadUrl = await getDownloadURL(storageRef);

        return NextResponse.json({
          success: true,
          url: downloadUrl,
          downloadURL: downloadUrl,
          storagePath,
          filename: uniqueFilename,
          provider: 'firebase_storage',
        });
      } catch (storageErr: any) {
        console.warn('Firebase Storage upload failed or timed out, falling back to local persistent storage:', storageErr?.message || storageErr);
      }
    }

    // 3. Fallback: Save to public/uploads/[folder]/ with safe error catching for read-only containers
    let publicUrl = '';
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/${sanitizedFolder}/${uniqueFilename}`;
    } catch (diskErr) {
      console.warn('Local disk write notice (falling back to memory dataUrl):', diskErr);
    }

    // 4. Generate resilient base64 data URL for cross-environment rendering (if image)
    let dataUrl = '';
    const isSvg = (file.type && file.type.includes('svg')) || /\.svg$/i.test(ext);
    if (isSvg) {
      dataUrl = `data:image/svg+xml;base64,${buffer.toString('base64')}`;
    } else {
      const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|webp|gif|avif)$/i.test(ext);
      if (isImage) {
        try {
          const sharpModule = await import('sharp');
          const sharp = sharpModule.default;
          const compressed = await sharp(buffer)
            .resize({ width: 1440, height: 1440, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, progressive: true })
            .toBuffer();
          dataUrl = `data:image/jpeg;base64,${compressed.toString('base64')}`;
        } catch {
          if (buffer.length < 800000) {
            dataUrl = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
          }
        }
      }
    }

    const finalUrl = dataUrl || publicUrl;

    if (!finalUrl) {
      throw new Error('Could not process media file into a usable storage URL.');
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      downloadURL: finalUrl,
      publicUrl: publicUrl || finalUrl,
      dataUrl: dataUrl,
      storagePath: `uploads/${sanitizedFolder}/${uniqueFilename}`,
      filename: uniqueFilename,
      provider: dataUrl ? 'hybrid_optimized' : 'local_public',
    });
  } catch (error: any) {
    console.error('Error in /api/media/upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal upload error' },
      { status: 500 }
    );
  }
}
