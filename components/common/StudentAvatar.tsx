'use client';

import React from 'react';
import { isValidImageSrc } from '@/lib/utils';

// A student's official photo (avatarUrl / profilePhoto on the student record), or their initials
// when no photo is set. Because it reads the live record, a new photo shows everywhere at once.
export const StudentAvatar: React.FC<{
  photo?: string | null;
  altPhoto?: string | null;
  name?: string;
  /** Number of initials to show without a photo (1 or 2). */
  letters?: 1 | 2;
  className?: string;
}> = ({ photo, altPhoto, name, letters = 1, className = '' }) => {
  const src = isValidImageSrc(photo || '') ? String(photo).trim() : isValidImageSrc(altPhoto || '') ? String(altPhoto).trim() : null;
  const initials =
    (name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, letters)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden ${className}`} aria-hidden={src ? undefined : true}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ? `${name}'s photo` : 'Student photo'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </span>
  );
};
