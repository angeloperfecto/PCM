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
