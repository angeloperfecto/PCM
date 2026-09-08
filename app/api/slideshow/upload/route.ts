import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '@/firebase-applet-config.json';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image (PNG, JPG, WEBP, etc.)' }, { status: 400 });
    }

    // Limit size to 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image file size exceeds 15MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || '.jpg';
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const uniqueFilename = `slide_${timestamp}_${cleanBase}${ext}`;

    // 1. Try Firebase Storage first
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const storage = getStorage(app);
      const storagePath = `slideshow/${uniqueFilename}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, buffer, {
        contentType: file.type || 'image/jpeg',
      });
      const downloadUrl = await getDownloadURL(storageRef);

      return NextResponse.json({
        success: true,
        url: downloadUrl,
        filename: uniqueFilename,
        provider: 'firebase_storage',
      });
    } catch (storageErr: any) {
      console.warn('Firebase Storage upload failed, falling back to persistent local public directory:', storageErr?.message || storageErr);
    }

    // 2. Fallback: Save to public/uploads/slideshow/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slideshow');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/slideshow/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      provider: 'local_public',
    });
  } catch (error: any) {
    console.error('Error in /api/slideshow/upload:', error);
    return NextResponse.json({ error: error.message || 'Internal upload error' }, { status: 500 });
  }
}
