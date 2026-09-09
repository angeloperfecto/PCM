import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '@/firebase-applet-config.json';

export async function POST(req: NextRequest) {
  return await runMigration();
}

export async function GET(req: NextRequest) {
  return await runMigration();
}

export async function runMigration() {
  const results = {
    totalChecked: 0,
    alreadyClean: 0,
    migrated: 0,
    failed: 0,
    errors: [] as { id: string; title: string; error: string }[],
    migratedItems: [] as { id: string; title: string; originalSize: number; newSize: string; url: string }[],
  };

  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    const storage = getStorage(app);

    // 1. Query both collections (mediaLibrary and mediaItems)
    const mediaItemsSnap = await getDocs(collection(db, 'mediaItems'));
    const mediaLibrarySnap = await getDocs(collection(db, 'mediaLibrary'));

    const allDocsMap = new Map<string, { id: string; data: any }>();
    mediaItemsSnap.forEach((d) => allDocsMap.set(d.id, { id: d.id, data: d.data() }));
    mediaLibrarySnap.forEach((d) => {
      // If mediaLibrary already has it, keep the existing one or merge
      if (!allDocsMap.has(d.id)) {
        allDocsMap.set(d.id, { id: d.id, data: d.data() });
      }
    });

    results.totalChecked = allDocsMap.size;

    const baseUploadDir = path.join(process.cwd(), 'public', 'uploads', 'pcm', 'media-library', 'images');
    await fs.mkdir(baseUploadDir, { recursive: true });

    for (const [id, docEntry] of allDocsMap.entries()) {
      const data = docEntry.data;
      const rawUrl = data.url || data.downloadURL || '';
      const isBase64 = typeof rawUrl === 'string' && rawUrl.startsWith('data:');

      // If not base64 and document is already lightweight, skip (prevents duplicate migration)
      if (!isBase64) {
        results.alreadyClean++;
        // Make sure it's in mediaLibrary as well
        await setDoc(doc(db, 'mediaLibrary', id), cleanMetadataOnly(data), { merge: true });
        continue;
      }

      // We have an embedded Base64 image!
      const originalPayloadSize = rawUrl.length;
      try {
        // Parse base64 header
        const match = rawUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!match) {
          throw new Error('Malformed base64 data URL.');
        }

        const mimeType = match[1] || 'image/jpeg';
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');

        if (buffer.length === 0) {
          throw new Error('Extracted binary buffer is empty.');
        }

        // Determine extension and filename
        let ext = '.jpg';
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('webp')) ext = '.webp';
        else if (mimeType.includes('gif')) ext = '.gif';
        else if (mimeType.includes('svg')) ext = '.svg';

        const rawTitle = data.title || id;
        const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        const fileName = `${id}_${cleanTitle}${ext}`;
        const storagePath = `pcm/media-library/images/${fileName}`;

        // 1. Write binary buffer to persistent local disk
        const localFilePath = path.join(baseUploadDir, fileName);
        await fs.writeFile(localFilePath, buffer);

        // Verify local file exists and is accessible
        const stat = await fs.stat(localFilePath);
        if (stat.size !== buffer.length) {
          throw new Error(`File verification failed: written size ${stat.size} does not match buffer size ${buffer.length}`);
        }

        let finalUrl = `/uploads/pcm/media-library/images/${fileName}`;

        // 2. Attempt upload to Firebase Storage
        try {
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, buffer, { contentType: mimeType });
          const firebaseUrl = await getDownloadURL(storageRef);
          if (firebaseUrl) {
            finalUrl = firebaseUrl;
          }
        } catch (storageErr: any) {
          console.warn(`Storage upload note for ${id}:`, storageErr?.message || storageErr);
        }

        // Calculate formatted size
        const formattedSize =
          buffer.length < 1024 * 1024
            ? `${(buffer.length / 1024).toFixed(1)} KB`
            : `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`;

        // 3. Construct lightweight metadata object — STRICTLY NO BASE64
        const updatedMetadata = {
          id,
          title: data.title || 'PCM Media Asset',
          fileName,
          originalFileName: data.fileName || fileName,
          storagePath,
          downloadURL: finalUrl,
          url: finalUrl,
          category: data.category || 'General',
          folder: 'images',
          altText: data.altText || data.title || 'PCM Media Asset',
          caption: data.caption || '',
          fileSize: formattedSize,
          fileSizeBytes: buffer.length,
          dimensions: data.dimensions || '1600x1067',
          width: data.width || 1600,
          height: data.height || 1067,
          contentType: mimeType,
          uploadDate: data.uploadDate || data.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          uploadedAt: data.uploadedAt || data.createdAt || new Date().toISOString(),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: data.uploadedBy || 'System Migration',
          uploadedByUid: data.uploadedByUid || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          displayOrder: data.displayOrder || 0,
          tags: Array.isArray(data.tags) ? data.tags : [],
        };

        // 4. Update Firestore in both collections with ONLY metadata
        await setDoc(doc(db, 'mediaLibrary', id), updatedMetadata, { merge: false });
        await setDoc(doc(db, 'mediaItems', id), updatedMetadata, { merge: false });

        results.migrated++;
        results.migratedItems.push({
          id,
          title: data.title,
          originalSize: originalPayloadSize,
          newSize: formattedSize,
          url: finalUrl,
        });
      } catch (err: any) {
        console.error(`Failed migration for doc ${id}:`, err);
        results.failed++;
        results.errors.push({
          id,
          title: data.title || id,
          error: err.message || String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: `Migration completed: ${results.migrated} migrated, ${results.alreadyClean} already clean, ${results.failed} failed.`,
      results,
    });
  } catch (globalErr: any) {
    console.error('Fatal error in media migration:', globalErr);
    return NextResponse.json({ error: globalErr.message || 'Migration failed' }, { status: 500 });
  }
}

function cleanMetadataOnly(data: any) {
  const clean = { ...data };
  // Ensure no base64 remains
  if (typeof clean.url === 'string' && clean.url.startsWith('data:')) {
    delete clean.url;
  }
  if (typeof clean.downloadURL === 'string' && clean.downloadURL.startsWith('data:')) {
    delete clean.downloadURL;
  }
  return clean;
}
