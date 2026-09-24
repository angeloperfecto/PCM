import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getServerFirestore, isIgnorableFirestoreError } from '@/lib/serverFirebase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

// Clean generic PCM image fallback if asset is ever truly unresolvable
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#18392B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#10261D;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad)" />
  <circle cx="400" cy="270" r="70" fill="#588B76" opacity="0.2" />
  <path d="M400 230 V310 M370 260 H430" stroke="#E3A857" stroke-width="4" stroke-linecap="round" />
  <text x="400" y="380" font-family="serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">PHILIPPINE COLLEGE OF MINISTRY</text>
  <text x="400" y="415" font-family="sans-serif" font-size="14" fill="#A7D7C5" text-anchor="middle">Student Life &amp; Campus Ministries</text>
</svg>`;

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
    const contentType = MIME_TYPES[ext] || 'image/jpeg';

    // 1. Try local disk cache
    const relativePath = path.join(...slug);
    if (relativePath.includes('..')) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    const localFilePath = path.join(process.cwd(), 'public', 'uploads', relativePath);
    try {
      const fileBuffer = await fs.readFile(localFilePath);
      return new NextResponse(new Uint8Array(fileBuffer), {
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

    // 2. Query Firestore if file not on current container's disk
    try {
      const db = getServerFirestore();

      let base64Data: string | undefined;

      // A. Direct lookup in uploadedMedia by document ID
      try {
        const directDoc = await getDoc(doc(db, 'uploadedMedia', filename));
        if (directDoc.exists()) {
          const data = directDoc.data();
          base64Data = data?.dataUrl || data?.url;
        }
      } catch (err: any) {
        if (!isIgnorableFirestoreError(err)) {
          console.debug('Direct uploadedMedia lookup error:', err?.message || err);
        }
      }

      // B. Query uploadedMedia by fileName or originalFileName
      if (!base64Data) {
        try {
          const qUploaded = query(
            collection(db, 'uploadedMedia'),
            where('originalFileName', '==', filename),
            limit(1)
          );
          const snapUploaded = await getDocs(qUploaded);
          if (!snapUploaded.empty) {
            const item = snapUploaded.docs[0].data();
            base64Data = item.dataUrl || item.url;
          }
        } catch {}
      }

      // C. Query mediaLibrary
      if (!base64Data) {
        try {
          const qMedia = query(
            collection(db, 'mediaLibrary'),
            where('fileName', '==', filename),
            limit(1)
          );
          const snapMedia = await getDocs(qMedia);
          if (!snapMedia.empty) {
            const item = snapMedia.docs[0].data();
            base64Data = item.dataUrl || item.url || item.downloadURL;
          }
        } catch {}
      }

      // D. Check mediaLibrary by document ID directly (e.g. med-...)
      if (!base64Data) {
        try {
          const mediaDoc = await getDoc(doc(db, 'mediaLibrary', filename));
          if (mediaDoc.exists()) {
            const item = mediaDoc.data();
            base64Data = item.dataUrl || item.url || item.downloadURL;
          }
        } catch {}
      }

      if (base64Data && base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mime = matches[1] || contentType;
          const buffer = Buffer.from(matches[2], 'base64');
          // Cache on disk asynchronously for subsequent requests
          fs.mkdir(path.dirname(localFilePath), { recursive: true })
            .then(() => fs.writeFile(localFilePath, buffer))
            .catch(() => {});

          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              'Content-Type': mime,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
              'Content-Disposition': 'inline',
            },
          });
        }
      }
    } catch (e: any) {
      if (!isIgnorableFirestoreError(e)) {
        console.debug('Firestore fallback media retrieval notice:', e?.message || e);
      }
    }

    // 3. Fallback: Return a clean PCM themed SVG banner so images never break with 404
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Error serving upload asset:', err);
    return new NextResponse('Error serving asset', { status: 500 });
  }
}
