import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { HeroSlide } from './types';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
    tag: 'Accredited Theological Education',
    headline: 'EQUIPPING SERVANTS FOR KINGDOM IMPACT',
    subtext:
      'Philippine College of Ministry exists to equip men and women with biblical knowledge, spiritual maturity, and practical ministry skills for faithful service to Christ, the Church, and the community.',
    primaryBtnText: 'APPLY NOW FOR 2026–2027',
    primaryBtnLink: 'apply',
    secondaryBtnText: 'EXPLORE PROGRAMS',
    secondaryBtnLink: 'academics',
    active: true,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'System Seed',
  },
  {
    id: 'hero-2',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop',
    tag: 'Spiritual Formation & Worship',
    headline: 'ROOTED IN TRUTH. PASSIONATE IN WORSHIP.',
    subtext:
      'Cultivating humble shepherd hearts through daily corporate chapel, intensive Greek & Hebrew exegesis, and intimate faculty discipleship mentorship.',
    primaryBtnText: 'VIEW STATEMENT OF FAITH',
    primaryBtnLink: 'about',
    secondaryBtnText: 'FACULTY & STAFF',
    secondaryBtnLink: 'about',
    active: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'System Seed',
  },
  {
    id: 'hero-3',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1600&auto=format&fit=crop',
    tag: 'Hands-On Pastoral Apprenticeship',
    headline: 'REAL-WORLD MINISTRY IN 85+ LOCAL CHURCHES',
    subtext:
      'Every PCM student participates in supervised weekly pulpit ministry, urban church planting, youth discipleship, and compassionate community missions.',
    primaryBtnText: 'ADMISSIONS OVERVIEW',
    primaryBtnLink: 'apply',
    secondaryBtnText: 'CAMPUS RESOURCES',
    secondaryBtnLink: 'resources',
    active: true,
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'System Seed',
  },
];

export interface SlideshowDocument {
  slides: HeroSlide[];
  updatedAt: string;
  updatedBy: string;
  isPublished?: boolean;
}

/**
 * Normalizes slide URLs and ensures image accessibility across all users & devices
 */
export function sanitizeSlide(slide: HeroSlide, index: number): HeroSlide {
  const slideId = slide.id || `hero-${Date.now()}-${index}`;
  let cleanImage = slide.image;

  // If slide was stored as an ephemeral local path /uploads/slideshow/..., redirect it to the authoritative API endpoint
  if (cleanImage && cleanImage.startsWith('/uploads/slideshow/')) {
    cleanImage = `/api/slideshow/image?id=${slideId}`;
  }

  // If no image is provided, default to API route with fallback
  if (!cleanImage || cleanImage.trim() === '') {
    cleanImage = `/api/slideshow/image?id=${slideId}`;
  }

  return {
    id: slideId,
    image: cleanImage,
    tag: slide.tag || 'Philippine College of Ministry',
    headline: slide.headline || 'Equipping Servants for Kingdom Impact',
    subtext: slide.subtext || '',
    primaryBtnText: slide.primaryBtnText || 'APPLY NOW FOR 2026–2027',
    primaryBtnLink: slide.primaryBtnLink || 'apply',
    secondaryBtnText: slide.secondaryBtnText || 'EXPLORE PROGRAMS',
    secondaryBtnLink: slide.secondaryBtnLink || 'academics',
    active: slide.active !== false,
    order: typeof slide.order === 'number' ? slide.order : index,
    createdAt: slide.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: slide.updatedBy || 'Admin',
  };
}

/**
 * In-memory image cache for fast synchronous rendering of base64 images
 */
const slideImageCache: Record<string, string> = {};

/**
 * Subscribes to real-time slideshow updates from Firestore.
 * `siteContent/slideshow` is the single source of truth.
 */
export function subscribeToSlideshow(
  onUpdate: (slides: HeroSlide[]) => void,
  onError?: (err: any) => void
): () => void {
  const slideshowDocRef = doc(db, 'siteContent', 'slideshow');

  return onSnapshot(
    slideshowDocRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SlideshowDocument;
        if (data && Array.isArray(data.slides) && data.slides.length > 0) {
          const sorted = [...data.slides]
            .map((s, idx) => sanitizeSlide(s, idx))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          // Parallel fetch of dedicated slide images for any not in memory cache
          const resolvedSlides = await Promise.all(
            sorted.map(async (s) => {
              if (slideImageCache[s.id]) {
                return { ...s, image: slideImageCache[s.id] };
              }
              // Skip querying Firestore if slide already points to a complete remote URL
              if (s.image && (s.image.startsWith('https://') || s.image.startsWith('http://'))) {
                return s;
              }
              try {
                const imgDoc = await getDoc(doc(db, 'siteContent', `slideshow_image_${s.id}`));
                if (imgDoc.exists()) {
                  const val = imgDoc.data()?.image;
                  if (val && typeof val === 'string' && val.startsWith('data:')) {
                    slideImageCache[s.id] = val;
                    return { ...s, image: val };
                  }
                }
              } catch {
                // Silently fallback without crashing or spamming console if quota is reached
              }
              return s;
            })
          );

          onUpdate(resolvedSlides);
          return;
        }
      }

      // Fallback: If siteContent/slideshow document is missing or empty, check siteConfig/global
      const configDocRef = doc(db, 'siteConfig', 'global');
      getDoc(configDocRef)
        .then((cfgSnap) => {
          if (cfgSnap.exists()) {
            const cfgData = cfgSnap.data();
            if (cfgData?.heroSlides && Array.isArray(cfgData.heroSlides) && cfgData.heroSlides.length > 0) {
              const sorted = [...cfgData.heroSlides]
                .map((s, idx) => sanitizeSlide(s, idx))
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              onUpdate(sorted);
              return;
            }
          }
          onUpdate(DEFAULT_HERO_SLIDES);
        })
        .catch(() => {
          onUpdate(DEFAULT_HERO_SLIDES);
        });
    },
    (error) => {
      console.warn('Real-time slideshow listener notice:', error);
      if (onError) onError(error);
      onUpdate(DEFAULT_HERO_SLIDES);
    }
  );
}

/**
 * Writes the slideshow configuration permanently to Firestore.
 * Updates both `siteContent/slideshow` and `siteConfig/global` (for cross-component compatibility).
 * Also stores individual image documents into `siteContent/slideshow_image_<id>` to prevent 1MB overflow.
 */
export async function saveSlideshowToFirestore(
  slides: HeroSlide[],
  updatedBy: string = 'Admin User'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!slides || slides.length === 0) {
      return { success: false, error: 'Cannot save an empty slideshow.' };
    }

    const timestamp = Date.now();

    // 1. For any slides with embedded data URLs, store them in individual documents siteContent/slideshow_image_<id>
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      const slideId = s.id || `hero-${timestamp}-${i}`;
      s.id = slideId;

      if (s.image && s.image.startsWith('data:')) {
        slideImageCache[slideId] = s.image;
        try {
          const imgDocRef = doc(db, 'siteContent', `slideshow_image_${slideId}`);
          await setDoc(
            imgDocRef,
            {
              id: slideId,
              image: s.image,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (imgSaveErr) {
          console.warn('Notice saving dedicated slide image doc:', imgSaveErr);
        }
      }
    }

    // 2. Prepare lean payload for siteContent/slideshow: use clean API endpoint for `image` so the document never exceeds 1MB
    const leanSlides = slides.map((s, idx) => {
      const slideId = s.id || `hero-${timestamp}-${idx}`;
      let targetImage = s.image;
      if (targetImage.startsWith('data:') || targetImage.startsWith('/uploads/')) {
        targetImage = `/api/slideshow/image?id=${slideId}&v=${timestamp}`;
      }

      return {
        ...sanitizeSlide({ ...s, image: targetImage }, idx),
        order: idx,
        updatedAt: new Date().toISOString(),
        updatedBy,
      };
    });

    const payload: SlideshowDocument = {
      slides: leanSlides,
      updatedAt: new Date().toISOString(),
      updatedBy,
      isPublished: true,
    };

    // 3. Write to authoritative document siteContent/slideshow
    const slideshowDocRef = doc(db, 'siteContent', 'slideshow');
    await setDoc(slideshowDocRef, payload, { merge: true });

    // 4. Also keep siteConfig/global.heroSlides in sync with lean slides
    try {
      const configDocRef = doc(db, 'siteConfig', 'global');
      await setDoc(configDocRef, { heroSlides: leanSlides }, { merge: true });
    } catch (cfgErr) {
      console.warn('Secondary siteConfig heroSlides update notice:', cfgErr);
    }

    // 5. Verify write by reading back
    const verifySnap = await getDoc(slideshowDocRef);
    if (!verifySnap.exists()) {
      throw new Error('Verification failed: Document could not be confirmed in Firestore.');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving slideshow to Firestore:', error);
    return {
      success: false,
      error: error?.message || 'An unknown error occurred while saving to Firestore.',
    };
  }
}

/**
 * Uploads an image file to the server/storage endpoint and returns a permanent URL.
 */
export async function uploadSlideshowImage(
  file: File,
  slideId?: string
): Promise<{ success: boolean; url?: string; dataUrl?: string; error?: string; slideId?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (slideId) {
      formData.append('slideId', slideId);
    }

    const response = await fetch('/api/slideshow/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Upload failed' }));
      return { success: false, error: errData.error || `Server returned ${response.status}` };
    }

    const data = await response.json();
    if (data.url) {
      const targetId = slideId || data.slideId;
      if (targetId && data.dataUrl) {
        slideImageCache[targetId] = data.dataUrl;
        try {
          await setDoc(
            doc(db, 'siteContent', `slideshow_image_${targetId}`),
            {
              id: targetId,
              image: data.dataUrl,
              filename: data.filename || `slide_${targetId}.webp`,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (fsClientErr) {
          console.warn('Client-side Firestore slide sync notice:', fsClientErr);
        }
      }
      return { success: true, url: data.url, dataUrl: data.dataUrl, slideId: targetId };
    }

    return { success: false, error: 'No URL returned from upload server' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during image upload' };
  }
}
