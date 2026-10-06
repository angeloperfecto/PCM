import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes payment instructions from any format (string, array of steps, or corrupted character array)
 * into a clean array of readable instruction steps.
 */
export function normalizeInstructions(input: unknown): string[] {
  if (!input) return [];

  // If string
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    const lines = trimmed
      .split('\n')
      .map((line) => line.replace(/^(\d+[\.\)]|\-|\*)\s*/, '').trim())
      .filter((line) => line.length > 0);
    return lines.length > 0 ? lines : [trimmed];
  }

  // If array
  if (Array.isArray(input)) {
    // Detect corrupted character-by-character array (e.g. ['t','i','o','n', ...])
    const isCharSplit =
      input.length > 3 &&
      input.every((item) => typeof item === 'string' && item.length <= 1);

    if (isCharSplit) {
      const joined = input.join('').trim();
      const lines = joined
        .split('\n')
        .map((line) => line.replace(/^(\d+[\.\)]|\-|\*)\s*/, '').trim())
        .filter((line) => line.length > 0);
      return lines.length > 0 ? lines : [joined];
    }

    return input
      .map((item) => {
        const str = typeof item === 'string' ? item : String(item || '');
        return str.replace(/^(\d+[\.\)]|\-|\*)\s*/, '').trim();
      })
      .filter((step) => step.length > 0);
  }

  return [];
}

/**
 * Converts instruction steps to a multi-line formatted text for editing.
 */
export function instructionsToText(input: unknown): string {
  const steps = normalizeInstructions(input);
  return steps.join('\n');
}

/**
 * Normalizes an image path or URL.
 * Automatically adds a leading '/' if the path starts with 'uploads/', 'images/', or 'assets/'.
 */
export function normalizeImageSrc(src: unknown): string {
  if (typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('uploads/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('api/')
  ) {
    return `/${trimmed}`;
  }

  return trimmed;
}

/**
 * Standardized validation for Next.js <Image> and HTML <img> source attributes.
 * Ensures the source is a valid string, rejects undefined/null placeholders and dangerous pseudo-schemes,
 * and ensures the value begins with a valid path or URI scheme.
 */
export function isValidImageSrc(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower === 'undefined' ||
    lower === 'null' ||
    lower === '[object object]' ||
    lower === 'none' ||
    lower === 'false' ||
    lower === 'true' ||
    lower === 'nan' ||
    lower === 'placeholder' ||
    lower.startsWith('javascript:')
  ) {
    return false;
  }

  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('uploads/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('api/')
  );
}

/**
 * Standardized helper returning a safe, valid image source or an institutional fallback.
 */
export function getSafeImageSrc(
  src: unknown,
  fallback = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop'
): string {
  if (isValidImageSrc(src)) {
    return normalizeImageSrc(src);
  }
  return fallback;
}
