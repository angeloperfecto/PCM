/**
 * YouTube Utility Helpers for PCM Video Management System
 */

export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // Check standard URL patterns
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

    // youtu.be/<id>
    if (url.hostname === 'youtu.be' || url.hostname.endsWith('.youtu.be')) {
      const id = url.pathname.slice(1).split(/[?#&/]/)[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // youtube.com/watch?v=<id>
    if (url.searchParams.has('v')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }

    // youtube.com/embed/<id>
    // youtube.com/v/<id>
    // youtube.com/shorts/<id>
    // youtube.com/live/<id>
    const match = url.pathname.match(/\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // If URL parsing fails, fallback to regex search
  }

  // Regex fallback for various YouTube URL representations
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i;
  const matched = trimmed.match(regex);
  if (matched && matched[1]) {
    return matched[1];
  }

  return null;
}

export function isValidYouTubeId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
}

export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'maxres' | 'hq' | 'mq' | 'default' = 'hq'
): string {
  if (!isValidYouTubeId(videoId)) return '/emblem.png';
  switch (quality) {
    case 'maxres':
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case 'mq':
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    case 'default':
      return `https://img.youtube.com/vi/${videoId}/default.jpg`;
    case 'hq':
    default:
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
}

export function getYouTubeEmbedUrl(videoId: string, options: { autoplay?: boolean; mute?: boolean } = {}): string {
  if (!isValidYouTubeId(videoId)) return '';
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  });
  if (options.autoplay) params.set('autoplay', '1');
  if (options.mute) params.set('mute', '1');
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export const VIDEO_CATEGORIES = [
  'Sermon / Chapel',
  'Campus Life',
  'College Ministry',
  'Student Testimonies',
  'Academic & Lectures',
  'Music & Worship',
  'Conferences & Events',
  'General',
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number] | string;

export function generateVideoId(): string {
  return `vid-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
