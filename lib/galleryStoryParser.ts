import { StudentLifeAlbum } from './types';

export interface ParsedPhotoStory {
  isEditorialDispatch: boolean;
  category: string;
  displayTitle: string;
  storyDate?: string;
  cleanEventName?: string;
  paragraphs: string[];
  photographer?: string;
  publisher?: string;
  summary: string;
  location?: string;
}

const CATEGORY_PATTERN =
  /^(news|look|feature|in photos|photos|dispatch|special feature|campus life|ministry spotlight|happening now|now happening|pcm prayer|prayer|diakonos|pcm|fellowship|announcement)/i;

/**
 * Normalizes text and splits run-on text or concatenated sentences into clean paragraphs.
 */
function cleanAndFormatParagraphs(rawText: string, titleToStrip?: string): { paragraphs: string[]; publisher?: string; photographer?: string } {
  if (!rawText) return { paragraphs: [] };

  let text = rawText.normalize('NFKD').trim();

  // Strip duplicate leading pipe-separated header or duplicate title if repeated at top of description
  // e.g. "News | Rooted in Faith... | June 12-13, 2026In a meaningful..."
  text = text.replace(
    /^(?:news|look|feature|in photos|photos|happening now|now happening|diakonos|pcm)\s*\|[^|\n]+\|?\s*(?:[A-Za-z0-9,–— -]+)?/i,
    ''
  );

  if (titleToStrip) {
    const normTitle = titleToStrip.normalize('NFKD').trim();
    if (normTitle && text.toLowerCase().startsWith(normTitle.toLowerCase())) {
      text = text.slice(normTitle.length).trim();
    }
  }

  // Expand concatenated sentences where period is immediately followed by a capital letter without space
  // e.g. "believers.A total of 53" -> "believers.\n\nA total of 53"
  text = text.replace(/([.!?])([A-Z])/g, '$1\n\n$2');

  // Also handle year or lowercase immediately followed by capital letter
  text = text.replace(/([0-9]{4}|[a-z])([A-Z][a-z])/g, '$1\n\n$2');

  let photographer: string | undefined;
  let publisher: string | undefined;
  const initialBlocks = text.split(/\r?\n\s*\r?\n|\r?\n/).map((p) => p.trim()).filter(Boolean);
  const candidateParagraphs: string[] = [];

  for (const block of initialBlocks) {
    // Check for photographer credit
    const photoMatch = block.match(/^(?:photos?|captured|documentation)\s+by\s*[:\-–—]\s*(.+)$/i);
    if (photoMatch) {
      photographer = photoMatch[1].trim();
      continue;
    }

    // Check for PCM institutional mission / dedication statement
    if (/dedicated to raising servant-leaders grounded in Christian faith/i.test(block)) {
      publisher = block.trim();
      continue;
    }

    // Check for other publisher / newsletter labels
    if (/^(diakonos|official newsletter|philippine college of ministry|pcm administration)$/i.test(block)) {
      publisher = block.trim();
      continue;
    }

    // If block is still unusually long with multiple sentences (over 450 characters), break gracefully into 2-3 sentence chunks
    if (block.length > 500 && (block.match(/\.\s+[A-Z]/g) || []).length >= 3) {
      const sentences = block.match(/[^.!?]+[.!?]+(\s+|$)/g) || [block];
      let currentChunk = '';
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > 350 && currentChunk.trim().length > 0) {
          candidateParagraphs.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      if (currentChunk.trim().length > 0) {
        candidateParagraphs.push(currentChunk.trim());
      }
    } else {
      candidateParagraphs.push(block);
    }
  }

  return {
    paragraphs: candidateParagraphs,
    publisher,
    photographer,
  };
}

/**
 * Parses raw StudentLifeAlbum metadata into an editorial dispatch structure
 * similar to campus newsletter releases (e.g. Diakonos / Facebook news posts).
 */
export function parsePhotoStory(album: Partial<StudentLifeAlbum> | {
  title?: string;
  description?: string;
  eventName?: string;
  eventDate?: string;
  location?: string;
}): ParsedPhotoStory {
  const rawTitle = (album.title || '').normalize('NFKD').trim();
  const rawDesc = (album.description || '').normalize('NFKD').trim();
  const rawEvent = (album.eventName || '').normalize('NFKD').trim();
  const rawDate = (album.eventDate || '').normalize('NFKD').trim();
  const rawLocation = (album.location || '').normalize('NFKD').trim();

  let category = 'IN PHOTOS';
  let isEditorialDispatch = false;
  let displayTitle = rawTitle;
  let extractedDate = rawDate;

  // Check for pipe-separated format in title: "Category | Title | Date"
  if (rawTitle.includes('|')) {
    isEditorialDispatch = true;
    const parts = rawTitle.split('|').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (CATEGORY_PATTERN.test(parts[0])) {
        category = parts[0].toUpperCase();
        displayTitle = parts[1];
        if (parts.length >= 3) {
          extractedDate = parts[2];
        }
      } else {
        displayTitle = parts[0];
        extractedDate = parts[1];
        if (parts.length >= 3) {
          extractedDate = `${parts[1]} (${parts[2]})`;
        }
      }
    }
  } else if (/^in photos\s*[:\-–—]\s*/i.test(rawTitle)) {
    isEditorialDispatch = true;
    category = 'IN PHOTOS';
    displayTitle = rawTitle.replace(/^in photos\s*[:\-–—]\s*/i, '').trim();
  }

  // Format description into distinct, readable paragraphs
  const { paragraphs, publisher, photographer } = cleanAndFormatParagraphs(rawDesc, displayTitle);

  // If no paragraphs could be parsed, fallback to description
  const finalParagraphs = paragraphs.length > 0 ? paragraphs : (rawDesc ? [rawDesc] : []);

  // Summary generation
  const summary = finalParagraphs[0]
    ? finalParagraphs[0].slice(0, 160) + (finalParagraphs[0].length > 160 ? '...' : '')
    : rawDesc.slice(0, 160);

  // Clean event name if it repeats the title or category
  let cleanEventName = rawEvent;
  if (
    cleanEventName &&
    (cleanEventName.toLowerCase() === displayTitle.toLowerCase() ||
     cleanEventName.toLowerCase() === category.toLowerCase())
  ) {
    cleanEventName = '';
  }

  return {
    isEditorialDispatch,
    category,
    displayTitle: displayTitle || 'Campus Life Photo Album',
    storyDate: extractedDate || rawDate,
    cleanEventName: cleanEventName || undefined,
    paragraphs: finalParagraphs,
    photographer,
    publisher,
    summary,
    location: rawLocation || undefined,
  };
}
