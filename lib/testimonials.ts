import type { Testimonial } from './types';

/** Display order: `order` ascending; records saved before ordering existed keep their list position (index + 1). */
export function sortTestimonials(list: Testimonial[]): Testimonial[] {
  return list
    .map((t, index) => ({ t, index, rank: t.order ?? index + 1 }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ t }) => t);
}

/** Records created before statuses existed have no status and stay visible. */
export function isTestimonialPublished(t: Testimonial): boolean {
  return !t.status || t.status === 'Published';
}

export function publicTestimonials(list: Testimonial[]): Testimonial[] {
  return sortTestimonials(list.filter(isTestimonialPublished));
}
