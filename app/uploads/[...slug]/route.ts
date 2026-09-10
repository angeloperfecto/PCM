import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug || slug.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    const filename = slug[slug.length - 1];
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 1. Try local disk
    const relativePath = path.join(...slug);
    // Security check against directory traversal
    if (relativePath.includes('..')) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    const localFilePath = path.join(process.cwd(), 'public', 'uploads', relativePath);
    try {
      const fileBuffer = await fs.readFile(localFilePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': 'inline',
        },
      });
    } catch {
      // File not on disk; proceed to Firestore cloud sync
    }

    // 2. Query Firestore if file not on current container's disk (e.g. shared preview instance)
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const db = firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);

      // Search by fileName or id
      const q = query(
        collection(db, 'mediaLibrary'),
        where('fileName', '==', filename),
        limit(1)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const item = snap.docs[0].data();
        const base64Data = item.dataUrl || item.url || item.downloadURL;
        if (base64Data && base64Data.startsWith('data:')) {
          const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mime = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            // Cache on disk asynchronously for subsequent requests
            fs.mkdir(path.dirname(localFilePath), { recursive: true })
              .then(() => fs.writeFile(localFilePath, buffer))
              .catch(() => {});

            return new NextResponse(buffer, {
              headers: {
                'Content-Type': mime,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'inline',
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn('Fallback retrieval from Firestore failed:', e);
    }

    return new NextResponse('Asset not found', { status: 404 });
  } catch (err: any) {
    console.error('Error serving upload asset:', err);
    return new NextResponse('Error serving asset', { status: 500 });
  }
}
