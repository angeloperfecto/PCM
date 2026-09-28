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
  const rawTitle = (album.title || '').trim();
  const rawDesc = (album.description || '').trim();
  const rawEvent = (album.eventName || '').trim();
  const rawDate = (album.eventDate || '').trim();
  const rawLocation = (album.location || '').trim();

  let category = 'IN PHOTOS';
  let isEditorialDispatch = false;
  let displayTitle = rawTitle;
  let extractedDate = rawDate;

  // Check for pipe-separated format in title: "IN PHOTOS | Title | Date"
  if (rawTitle.includes('|')) {
    isEditorialDispatch = true;
    const parts = rawTitle.split('|').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (/^(in photos|photos|dispatch|special feature|campus life|ministry spotlight)/i.test(parts[0])) {
        category = parts[0].toUpperCase();
        displayTitle = parts[1];
        if (parts.length >= 3) {
          extractedDate = parts[2];
        }
      } else {
        displayTitle = parts[0];
        if (parts.length >= 2) {
          extractedDate = parts[1];
        }
      }
    }
  } else if (/^in photos\s*[:\-–—]\s*/i.test(rawTitle)) {
    isEditorialDispatch = true;
    category = 'IN PHOTOS';
    displayTitle = rawTitle.replace(/^in photos\s*[:\-–—]\s*/i, '').trim();
  }

  // Parse description lines for paragraphs, photographer, publisher
  let photographer: string | undefined;
  let publisher: string | undefined;
  const contentParagraphs: string[] = [];

  const rawParagraphs = rawDesc.split(/\n\s*\n|\r\n\s*\r\n/).map((p) => p.trim()).filter(Boolean);

  for (const block of rawParagraphs) {
    const lines = block.split(/\n|\r\n/).map((l) => l.trim()).filter(Boolean);
    const retainedLines: string[] = [];

    for (const line of lines) {
      // Check for Photos by / Captured by
      const photoMatch = line.match(/^(?:photos?|captured|documentation)\s+by\s*[:\-–—]\s*(.+)$/i);
      if (photoMatch) {
        photographer = photoMatch[1].trim();
        isEditorialDispatch = true;
        continue;
      }

      // Check for Publisher / Newsletter attribution
      if (/diakonos|official newsletter|philippine college of ministry|pcm administration/i.test(line)) {
        publisher = line.trim();
        isEditorialDispatch = true;
        continue;
      }

      retainedLines.push(line);
    }

    if (retainedLines.length > 0) {
      contentParagraphs.push(retainedLines.join(' '));
    }
  }

  // If no paragraphs could be parsed, fallback to description
  if (contentParagraphs.length === 0 && rawDesc) {
    contentParagraphs.push(rawDesc);
  }

  // Summary generation
  const summary = contentParagraphs[0]
    ? contentParagraphs[0].slice(0, 160) + (contentParagraphs[0].length > 160 ? '...' : '')
    : rawDesc.slice(0, 160);

  // Clean event name if it repeats the title
  let cleanEventName = rawEvent;
  if (cleanEventName && displayTitle && cleanEventName.toLowerCase() === displayTitle.toLowerCase()) {
    cleanEventName = '';
  }

  return {
    isEditorialDispatch,
    category,
    displayTitle: displayTitle || 'Campus Life Photo Album',
    storyDate: extractedDate || rawDate,
    cleanEventName: cleanEventName || undefined,
    paragraphs: contentParagraphs,
    photographer,
    publisher,
    summary,
    location: rawLocation || undefined,
  };
}
