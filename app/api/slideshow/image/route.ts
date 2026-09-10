import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';
import fs from 'fs';
import path from 'path';

// Fallback images if an ID is completely missing
const DEFAULT_FALLBACKS: Record<string, string> = {
  'hero-1': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
  'hero-2': 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop',
  'hero-3': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1600&auto=format&fit=crop',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('slideId');

    if (!id) {
      return NextResponse.json({ error: 'Missing image id' }, { status: 400 });
    }

    // 1. Check authoritative Firestore doc siteContent/slideshow_image_<id>
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      const snap = await getDoc(doc(db, 'siteContent', `slideshow_image_${id}`));

      if (snap.exists()) {
        const data = snap.data();
        const imgVal = data?.image;

        if (imgVal && typeof imgVal === 'string') {
          // If stored as base64 data URL
          if (imgVal.startsWith('data:')) {
            const matches = imgVal.match(/^data:([^;]+);base64,(.+)$/);
            if (matches && matches[2]) {
              const contentType = matches[1] || 'image/webp';
              const buffer = Buffer.from(matches[2], 'base64');
              return new NextResponse(buffer, {
                status: 200,
                headers: {
                  'Content-Type': contentType,
                  'Content-Length': buffer.length.toString(),
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
              });
            }
          } else if (imgVal.startsWith('http://') || imgVal.startsWith('https://')) {
            return NextResponse.redirect(imgVal, { status: 307 });
          }
        }
      }
    } catch (dbErr) {
      console.warn('Could not read slideshow image from Firestore:', dbErr);
    }

    // 2. Fallback: Check local disk uploads/slideshow
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slideshow');
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        const match = files.find((f) => f.toLowerCase().includes(id.toLowerCase()));
        if (match) {
          const filePath = path.join(uploadDir, match);
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(match).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': mime,
              'Content-Length': buffer.length.toString(),
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
          });
        }
      }
    } catch (fsErr) {
      console.warn('Could not check local slideshow files:', fsErr);
    }

    // 3. Fallback: Redirect to default high quality Unsplash banner
    const fallbackUrl =
      DEFAULT_FALLBACKS[id] ||
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop';
    return NextResponse.redirect(fallbackUrl, { status: 307 });
  } catch (err: any) {
    console.error('Error serving slideshow image:', err);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
