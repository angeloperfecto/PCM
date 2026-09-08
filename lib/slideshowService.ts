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
 * Strips huge base64 strings if any exist in the image URL to protect Firestore's 1MB limit
 */
export function sanitizeSlide(slide: HeroSlide, index: number): HeroSlide {
  let cleanImage = slide.image;
  // If an image is a base64 string longer than 50KB, substitute a safe fallback to prevent document bloat
  if (cleanImage && cleanImage.startsWith('data:') && cleanImage.length > 50000) {
    cleanImage = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop';
  }

  return {
    id: slide.id || `hero-${Date.now()}-${index}`,
    image: cleanImage || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
    tag: slide.tag || 'Philippines College of Ministry',
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
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SlideshowDocument;
        if (data && Array.isArray(data.slides) && data.slides.length > 0) {
          const sorted = [...data.slides]
            .map((s, idx) => sanitizeSlide(s, idx))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          onUpdate(sorted);
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
      // Fallback to default
      onUpdate(DEFAULT_HERO_SLIDES);
    }
  );
}

/**
 * Writes the slideshow configuration permanently to Firestore.
 * Updates both `siteContent/slideshow` and `siteConfig/global` (for cross-component compatibility).
 */
export async function saveSlideshowToFirestore(
  slides: HeroSlide[],
  updatedBy: string = 'Admin User'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!slides || slides.length === 0) {
      return { success: false, error: 'Cannot save an empty slideshow.' };
    }

    const sanitizedSlides = slides.map((s, idx) => ({
      ...sanitizeSlide(s, idx),
      order: idx,
      updatedAt: new Date().toISOString(),
      updatedBy,
    }));

    const payload: SlideshowDocument = {
      slides: sanitizedSlides,
      updatedAt: new Date().toISOString(),
      updatedBy,
      isPublished: true,
    };

    // 1. Write to authoritative document siteContent/slideshow
    const slideshowDocRef = doc(db, 'siteContent', 'slideshow');
    await setDoc(slideshowDocRef, payload, { merge: true });

    // 2. Also keep siteConfig/global.heroSlides in sync with sanitized slides
    try {
      const configDocRef = doc(db, 'siteConfig', 'global');
      await setDoc(configDocRef, { heroSlides: sanitizedSlides }, { merge: true });
    } catch (cfgErr) {
      console.warn('Secondary siteConfig heroSlides update notice:', cfgErr);
    }

    // 3. Verify write by reading back
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
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

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
      return { success: true, url: data.url };
    }

    return { success: false, error: 'No URL returned from upload server' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during image upload' };
  }
}
