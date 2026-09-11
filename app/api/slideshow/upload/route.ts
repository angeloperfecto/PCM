import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '@/firebase-applet-config.json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const slideIdParam = formData.get('slideId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image (PNG, JPG, WEBP, etc.)' }, { status: 400 });
    }

    // Limit size to 20MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image file size exceeds 20MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const slideId = slideIdParam || `hero-${timestamp}`;
    const rawFileName = file.name || `slide_${timestamp}.jpg`;
    const ext = path.extname(rawFileName) || '.jpg';
    const cleanBase = path.basename(rawFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `slide_${timestamp}_${cleanBase}.webp`;

    // 1. Optimize image using sharp for fast delivery & compact storage
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await sharp(buffer)
        .resize({ width: 1440, height: 900, fit: 'cover' })
        .webp({ quality: 75 })
        .toBuffer();
    } catch {
      // Fallback if format is not supported by sharp
      optimizedBuffer = buffer;
    }

    const dataUrl = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;

    // 2. Authoritative Persistence: Save to Firestore siteContent/slideshow_image_<slideId>
    // This guarantees immediate global visibility for ALL users across any container, shared link, or device!
    let savedToFirestore = false;
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      const docRef = doc(db, 'siteContent', `slideshow_image_${slideId}`);
      await setDoc(
        docRef,
        {
          id: slideId,
          image: dataUrl,
          filename: uniqueFilename,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      savedToFirestore = true;
    } catch (fsErr) {
      console.warn('Could not save slideshow image document in Firestore:', fsErr);
    }

    // 3. Probe if Firebase Storage bucket is active and reachable (if configured)
    let downloadUrl: string | null = null;
    if (
      firebaseConfig.storageBucket &&
      !firebaseConfig.storageBucket.includes('intelligent-park-95fd2')
    ) {
      try {
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
        const storage = getStorage(app);
        storage.maxUploadRetryTime = 3000;
        const storagePath = `slideshow/${uniqueFilename}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, optimizedBuffer, {
          contentType: 'image/webp',
        });
        downloadUrl = await getDownloadURL(storageRef);
      } catch (storageErr) {
        console.warn('Firebase Storage upload notice:', storageErr);
      }
    }

    // 4. Save to local disk uploads directory as cache
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slideshow');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, optimizedBuffer);
    } catch (diskErr) {
      console.warn('Local disk write notice:', diskErr);
    }

    // Consistent, globally accessible public endpoint
    const publicUrl = downloadUrl || `/api/slideshow/image?id=${slideId}&v=${timestamp}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      dataUrl,
      slideId,
      filename: uniqueFilename,
      provider: savedToFirestore ? 'firestore_synced' : 'local_cache',
    });
  } catch (error: any) {
    console.error('Error in /api/slideshow/upload:', error);
    return NextResponse.json({ error: error.message || 'Internal upload error' }, { status: 500 });
  }
}
