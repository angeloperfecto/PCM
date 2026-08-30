'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Emblem } from '@/components/common/Emblem';

interface FacultyPortraitProps {
  name: string;
  imageUrl?: string;
  id?: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
}

export const FacultyPortrait: React.FC<FacultyPortraitProps> = ({
  name,
  imageUrl,
  id = 'faculty-portrait',
  className = '',
  sizes = '120px',
  fill = true,
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (fullName: string) => {
    return fullName
      .replace(/^(Atty\.|Arch\.|Dr\.|Dra\.|Engr\.|Rev\.|Prof\.)\s+/i, '')
      .replace(/["“”]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const initials = getInitials(name);

  if (imageUrl && !hasError) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <Image
          src={imageUrl}
          alt={name}
          fill={fill}
          className="object-cover object-top"
          sizes={sizes}
          priority={priority}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Graceful fallback with PCM Institutional Monogram & Seal
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#18392B] via-[#0E241B] to-[#070e1c] text-[#85AA9B] p-2 select-none ${className}`}
    >
      <Emblem id={`seal-fallback-${id}`} size={32} className="w-8 h-8 mb-1 opacity-80" />
      <span className="font-serif text-sm font-bold text-white tracking-widest">
        {initials}
      </span>
    </div>
  );
};
