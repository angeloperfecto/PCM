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

interface CachedImage {
  type: 'buffer' | 'redirect';
  contentType?: string;
  buffer?: Buffer;
  redirectUrl?: string;
  cachedAt: number;
}

// In-memory cache to prevent repetitive reads against Firestore & filesystem
const imageMemoryCache = new Map<string, CachedImage>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Circuit breaker for Firestore quota exhaustion
let quotaExceededUntil = 0;
const CIRCUIT_BREAKER_DURATION_MS = 10 * 60 * 1000; // 10 minutes

function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  return (
    code === 'resource-exhausted' ||
    msg.includes('quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('write stream exhausted') ||
    msg.includes('maximum allowed queued writes')
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('slideId');

    if (!id) {
      return NextResponse.json({ error: 'Missing image id' }, { status: 400 });
    }

    const now = Date.now();

    // 0. Check in-memory cache
    const cached = imageMemoryCache.get(id);
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      if (cached.type === 'buffer' && cached.buffer && cached.contentType) {
        return new NextResponse(new Uint8Array(cached.buffer), {
          status: 200,
          headers: {
            'Content-Type': cached.contentType,
            'Content-Length': cached.buffer.length.toString(),
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        });
      } else if (cached.type === 'redirect' && cached.redirectUrl) {
        return NextResponse.redirect(cached.redirectUrl, { status: 307 });
      }
    }

    // 1. Check authoritative Firestore doc siteContent/slideshow_image_<id> only if circuit breaker is inactive
    if (now >= quotaExceededUntil) {
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
                imageMemoryCache.set(id, {
                  type: 'buffer',
                  contentType,
                  buffer,
                  cachedAt: now,
                });
                return new NextResponse(new Uint8Array(buffer), {
                  status: 200,
                  headers: {
                    'Content-Type': contentType,
                    'Content-Length': buffer.length.toString(),
                    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                  },
                });
              }
            } else if (imgVal.startsWith('http://') || imgVal.startsWith('https://')) {
              imageMemoryCache.set(id, {
                type: 'redirect',
                redirectUrl: imgVal,
                cachedAt: now,
              });
              return NextResponse.redirect(imgVal, { status: 307 });
            }
          }
        }
      } catch (dbErr: any) {
        if (isQuotaExceededError(dbErr)) {
          // Trip circuit breaker to prevent repeated failed calls and log flooding
          quotaExceededUntil = now + CIRCUIT_BREAKER_DURATION_MS;
        } else {
          console.warn('Notice reading slideshow image from Firestore:', dbErr?.message || dbErr);
        }
      }
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
          imageMemoryCache.set(id, {
            type: 'buffer',
            contentType: mime,
            buffer,
            cachedAt: now,
          });
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': mime,
              'Content-Length': buffer.length.toString(),
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
          });
        }
      }
    } catch {
      // Local disk check skipped
    }

    // 3. Fallback: Redirect to default high quality Unsplash banner
    const fallbackUrl =
      DEFAULT_FALLBACKS[id] ||
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop';
    
    // Cache fallback redirect to prevent repeated downstream operations
    imageMemoryCache.set(id, {
      type: 'redirect',
      redirectUrl: fallbackUrl,
      cachedAt: now,
    });

    return NextResponse.redirect(fallbackUrl, { status: 307 });
  } catch {
    const defaultFallback = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop';
    return NextResponse.redirect(defaultFallback, { status: 307 });
  }
}
