import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentTypeHeader = req.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let rawFileName = '';
    let requestedFolder = 'media';
    let customStoragePath: string | null = null;
    let fileMime = 'image/jpeg';

    if (contentTypeHeader.includes('application/json')) {
      // JSON Base64 Payload Fallback (Highly resilient across proxies)
      const body = await req.json();
      const base64Input = (body.base64 || body.dataUrl || '') as string;
      if (!base64Input) {
        return NextResponse.json({ error: 'No image data provided in payload' }, { status: 400 });
      }

      // Extract MIME type if data URL
      const match = base64Input.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      if (match) {
        fileMime = match[1];
      }

      const cleanBase64 = base64Input.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
      rawFileName = body.fileName || body.name || `photo_${Date.now()}.jpg`;
      requestedFolder = body.folder || 'media';
      customStoragePath = body.storagePath || null;
    } else {
      // Standard Multipart Form Data
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      requestedFolder = (formData.get('folder') as string) || 'media';
      customStoragePath = formData.get('storagePath') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      // Allow file size up to 250MB
      const MAX_SIZE = 250 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds maximum capacity.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      rawFileName = file.name || (formData.get('fileName') as string) || `upload_${Date.now()}.jpg`;
      fileMime = file.type || 'image/jpeg';
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Received empty file buffer' }, { status: 400 });
    }

    const ext = path.extname(rawFileName) || (fileMime.includes('png') ? '.png' : fileMime.includes('webp') ? '.webp' : '.jpg');
    const cleanBase = path.basename(rawFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_') || `file_${Date.now()}`;
    const timestamp = Date.now();
    const sanitizedFolder = requestedFolder.replace(/[^a-zA-Z0-9_-]/g, '_') || 'media';
    const uniqueFilename = `${sanitizedFolder}_${timestamp}_${cleanBase}${ext}`;

    // 1. Check if external Firebase Storage bucket is active and reachable (excluding default studio bucket)
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

        if (probeRes && probeRes.status === 200) {
          isBucketAvailable = true;
        }
      } catch {
        isBucketAvailable = false;
      }
    }

    // 2. Try Firebase Storage if bucket is explicitly active
    if (isBucketAvailable) {
      try {
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
        const storage = getStorage(app);
        storage.maxUploadRetryTime = 4000;
        storage.maxOperationRetryTime = 4000;

        const storagePath = customStoragePath || `${sanitizedFolder}/${uniqueFilename}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, buffer, {
          contentType: fileMime,
        });
        const downloadUrl = await getDownloadURL(storageRef);

        return NextResponse.json({
          success: true,
          url: downloadUrl,
          downloadURL: downloadUrl,
          publicUrl: downloadUrl,
          storagePath,
          filename: uniqueFilename,
          provider: 'firebase_storage',
        });
      } catch (storageErr: any) {
        console.warn('Firebase Storage upload notice (falling back to local storage):', storageErr?.message || storageErr);
      }
    }

    // 3. Save to public/uploads/[folder]/
    let publicUrl = '';
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/${sanitizedFolder}/${uniqueFilename}`;
    } catch (diskErr) {
      console.warn('Local disk write notice:', diskErr);
    }

    const finalUrl = publicUrl;

    if (!finalUrl) {
      throw new Error('Could not persist file to storage.');
    }

    // 4. Lightweight metadata logging in Firestore (NEVER stores large base64 to protect 1MB doc limits)
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const db = firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);

      await setDoc(doc(db, 'uploadedMedia', uniqueFilename), {
        id: uniqueFilename,
        fileName: uniqueFilename,
        originalFileName: rawFileName,
        folder: sanitizedFolder,
        contentType: fileMime,
        size: buffer.length,
        url: publicUrl,
        storagePath: `uploads/${sanitizedFolder}/${uniqueFilename}`,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (firestoreErr) {
      // Non-blocking metadata log
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      downloadURL: finalUrl,
      publicUrl: finalUrl,
      dataUrl: '',
      fileName: rawFileName,
      fileSize: buffer.length,
      fileType: fileMime,
      storagePath: `uploads/${sanitizedFolder}/${uniqueFilename}`,
      filename: uniqueFilename,
      provider: 'local_public',
    });
  } catch (error: any) {
    console.error('Error in /api/media/upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal upload error' },
      { status: 500 }
    );
  }
}
