export interface CachedImage {
  type: 'buffer' | 'redirect';
  contentType?: string;
  buffer?: Buffer;
  redirectUrl?: string;
  cachedAt: number;
}

// Global in-memory cache map shared across Node.js server routes in the same runtime
const imageMemoryCache = new Map<string, CachedImage>();

export function getCachedSlideImage(id: string): CachedImage | undefined {
  return imageMemoryCache.get(id);
}

export function setCachedSlideImage(id: string, entry: CachedImage): void {
  imageMemoryCache.set(id, entry);
}

export function invalidateSlideImageCache(id?: string): void {
  if (id) {
    imageMemoryCache.delete(id);
  } else {
    imageMemoryCache.clear();
  }
}
