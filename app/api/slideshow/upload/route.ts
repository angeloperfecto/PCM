import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getServerFirestore, isIgnorableFirestoreError, getServerFirebaseApp } from '@/lib/serverFirebase';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { invalidateSlideImageCache } from '@/lib/serverImageCache';

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

    // Limit to 4MB for high-res hero banners
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image exceeds maximum limit of 4MB. Please optimize or compress the image.' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const slideId = slideIdParam || `hero-${timestamp}`;
    const fileExt = path.extname(file.name) || '.webp';
    const uniqueFilename = `slide_${slideId}_${timestamp}${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Invalidate existing server in-memory image cache for this slide
    invalidateSlideImageCache(slideId);

    // 1. Convert to data URL for immediate fallback and zero-delay embedding
    const dataUrl = buffer.length <= 1024 * 1024
      ? `data:${file.type};base64,${buffer.toString('base64')}`
      : '';
    const publicEndpointUrl = `/api/slideshow/image?id=${slideId}&v=${timestamp}`;

    // 2. Authoritative Persistence: Save to Firestore siteContent/slideshow_image_<slideId>
    // This guarantees immediate global visibility for ALL users across any container, shared link, or device!
    let savedToFirestore = false;
    try {
      const db = getServerFirestore();
      const docRef = doc(db, 'siteContent', `slideshow_image_${slideId}`);
      await setDoc(
        docRef,
        {
          id: slideId,
          image: dataUrl || publicEndpointUrl,
          filename: uniqueFilename,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      savedToFirestore = true;
    } catch (fsErr: any) {
      if (!isIgnorableFirestoreError(fsErr)) {
        console.debug('Slideshow image Firestore set notice:', fsErr?.message || fsErr);
      }
    }

    // 3. Probe if Firebase Storage bucket is active and reachable (if configured)
    let downloadUrl: string | null = null;
    if (
      firebaseConfig.storageBucket &&
      !firebaseConfig.storageBucket.includes('intelligent-park-95fd2')
    ) {
      try {
        const app = getServerFirebaseApp();
        const storage = getStorage(app);
        storage.maxUploadRetryTime = 3000;
        const storageRef = ref(storage, `slideshow/${uniqueFilename}`);
        await uploadBytes(storageRef, buffer, {
          contentType: file.type,
          customMetadata: { slideId, uploadedAt: new Date().toISOString() },
        });
        downloadUrl = await getDownloadURL(storageRef);
      } catch (storageErr) {
        console.debug('Optional Firebase Storage upload skipped, relying on Firestore backing:', storageErr);
      }
    }

    // 4. Save to filesystem disk cache in public/uploads/slideshow
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slideshow');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);
    } catch (diskErr) {
      console.debug('Optional disk write skipped:', diskErr);
    }

    const finalUrl = downloadUrl || publicEndpointUrl;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      dataUrl: dataUrl || finalUrl,
      slideId,
      filename: uniqueFilename,
      savedToFirestore,
    });
  } catch (error: any) {
    console.error('Error uploading slideshow image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload slideshow image' },
      { status: 500 }
    );
  }
}
