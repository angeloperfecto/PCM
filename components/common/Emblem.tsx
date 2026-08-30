import React from 'react';

interface EmblemProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'shield-only' | 'monochrome' | 'gold-accent';
}

export const Emblem: React.FC<EmblemProps> = ({
  className = '',
  size = 48,
  variant = 'full',
}) => {
  const isGold = variant === 'gold-accent';
  const isMono = variant === 'monochrome';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label="Philippines College of Ministry Official Seal"
      role="img"
    >
      <defs>
        {/* Gradients for institutional depth */}
        <linearGradient id="pcmDarkGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10261D" />
          <stop offset="0.5" stopColor="#18392B" />
          <stop offset="1" stopColor="#234D3B" />
        </linearGradient>

        <linearGradient id="pcmSageGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D0DED8" />
          <stop offset="0.4" stopColor="#85AA9B" />
          <stop offset="0.8" stopColor="#588B76" />
          <stop offset="1" stopColor="#3C6654" />
        </linearGradient>

        <linearGradient id="pcmFlameGrad" x1="60" y1="35" x2="60" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D0DED8" />
          <stop offset="0.6" stopColor="#85AA9B" />
          <stop offset="1" stopColor="#588B76" />
        </linearGradient>

        <filter id="pcmShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer Forest Green Ring */}
      <circle
        cx="60"
        cy="60"
        r="56"
        fill={isMono ? 'currentColor' : 'url(#pcmDarkGrad)'}
        stroke={isMono ? 'currentColor' : 'url(#pcmSageGrad)'}
        strokeWidth="3.5"
      />

      {/* Decorative Beaded Inner Ring */}
      <circle
        cx="60"
        cy="60"
        r="51"
        fill="none"
        stroke={isGold || isMono ? 'currentColor' : '#85AA9B'}
        strokeWidth="1"
        strokeDasharray="2.5 2.5"
        opacity="0.8"
      />

      {/* Institutional Circular Text Path */}
      <path
        id="textPathTop"
        d="M 18 60 A 42 42 0 0 1 102 60"
        fill="none"
      />
      <path
        id="textPathBottom"
        d="M 102 60 A 42 42 0 0 1 18 60"
        fill="none"
      />

      <text
        fill={isMono ? 'currentColor' : '#FFFFFF'}
        fontSize="6.8"
        fontWeight="bold"
        letterSpacing="1.2"
        fontFamily="serif"
      >
        <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
          PHILIPPINES COLLEGE OF MINISTRY
        </textPath>
      </text>

      <text
        fill={isMono ? 'currentColor' : '#D0DED8'}
        fontSize="5.8"
        fontWeight="600"
        letterSpacing="1"
        fontFamily="sans-serif"
      >
        <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
          ★ EST. 1992 • VERITAS ET MINISTERIUM ★
        </textPath>
      </text>

      {/* Central Heraldic Shield */}
      <g filter="url(#pcmShadow)">
        {/* Shield outline */}
        <path
          d="M 36 34 Q 60 30 84 34 Q 84 56 60 84 Q 36 56 36 34 Z"
          fill={isMono ? 'none' : '#10261D'}
          stroke={isMono ? 'currentColor' : 'url(#pcmSageGrad)'}
          strokeWidth="2.5"
        />

        {/* Shield Inner Inset */}
        <path
          d="M 39 37 Q 60 33 81 37 Q 81 54 60 79 Q 39 54 39 37 Z"
          fill={isMono ? 'currentColor' : '#18392B'}
          opacity="0.95"
        />

        {/* Rays of Divine Light / Glory behind cross */}
        <g stroke={isMono ? 'currentColor' : '#D0DED8'} strokeWidth="0.8" opacity="0.6">
          <line x1="60" y1="46" x2="60" y2="38" />
          <line x1="60" y1="46" x2="68" y2="40" />
          <line x1="60" y1="46" x2="52" y2="40" />
          <line x1="60" y1="46" x2="72" y2="46" />
          <line x1="60" y1="46" x2="48" y2="46" />
        </g>

        {/* Latin Cross */}
        <g fill={isMono ? '#fff' : 'url(#pcmSageGrad)'}>
          {/* Vertical beam */}
          <rect x="58" y="38" width="4" height="20" rx="0.5" />
          {/* Horizontal crossbar */}
          <rect x="52" y="42" width="16" height="4" rx="0.5" />
        </g>

        {/* Holy Spirit Flame above Cross */}
        <path
          d="M 60 32 C 58 35, 56 37, 56 39 C 56 41, 58 42, 60 42 C 62 42, 64 41, 64 39 C 64 37, 62 35, 60 32 Z"
          fill={isMono ? 'currentColor' : 'url(#pcmFlameGrad)'}
        />

        {/* Open Holy Bible at the base of the shield */}
        <g transform="translate(0, 1)">
          {/* Left Page */}
          <path
            d="M 44 58 Q 52 56 60 59 L 60 69 Q 52 66 44 68 Z"
            fill={isMono ? 'none' : '#FFFFFF'}
            stroke={isMono ? 'currentColor' : '#85AA9B'}
            strokeWidth="1"
          />
          {/* Right Page */}
          <path
            d="M 76 58 Q 68 56 60 59 L 60 69 Q 68 66 76 68 Z"
            fill={isMono ? 'none' : '#FFFFFF'}
            stroke={isMono ? 'currentColor' : '#85AA9B'}
            strokeWidth="1"
          />

          {/* Book spine line */}
          <line x1="60" y1="59" x2="60" y2="70" stroke={isMono ? 'currentColor' : '#588B76'} strokeWidth="1.2" />

          {/* Greek Scripture initials on pages: Alpha & Omega */}
          <text
            x="51"
            y="65"
            fill="#18392B"
            fontSize="5"
            fontWeight="bold"
            fontFamily="serif"
            textAnchor="middle"
          >
            Α
          </text>
          <text
            x="69"
            y="65"
            fill="#18392B"
            fontSize="5"
            fontWeight="bold"
            fontFamily="serif"
            textAnchor="middle"
          >
            Ω
          </text>
        </g>

        {/* Sage Laurel Branches flanking shield bottom */}
        <g stroke={isMono ? 'currentColor' : '#85AA9B'} strokeWidth="1.2" fill="none">
          {/* Left Laurel */}
          <path d="M 33 55 C 31 66, 38 78, 48 85" strokeLinecap="round" />
          {/* Leaves Left */}
          <ellipse cx="32" cy="60" rx="2" ry="1" transform="rotate(-30 32 60)" fill={isMono ? 'currentColor' : '#D0DED8'} />
          <ellipse cx="34" cy="68" rx="2" ry="1" transform="rotate(-15 34 68)" fill={isMono ? 'currentColor' : '#D0DED8'} />
          <ellipse cx="39" cy="76" rx="2" ry="1" transform="rotate(15 39 76)" fill={isMono ? 'currentColor' : '#D0DED8'} />
          <ellipse cx="46" cy="83" rx="2" ry="1" transform="rotate(35 46 83)" fill={isMono ? 'currentColor' : '#D0DED8'} />

          {/* Right Laurel */}
          <path d="M 87 55 C 89 66, 82 78, 72 85" strokeLinecap="round" />
          {/* Leaves Right */}
          <ellipse cx="88" cy="60" rx="2" ry="1" transform="rotate(30 88 60)" fill={isMono ? 'currentColor' : '#D0DED8'} />
          <ellipse cx="86" cy="68" rx="2" ry="1" transform="rotate(15 86 68)" fill={isMono ? 'currentColor' : '#D0DED8'} />
          <ellipse cx="81" cy="76" rx="2" ry="1" transform="rotate(-15 81 76)" fill={isMono ? 'currentColor' : '#D0DED8'} />
          <ellipse cx="74" cy="83" rx="2" ry="1" transform="rotate(-35 74 83)" fill={isMono ? 'currentColor' : '#D0DED8'} />
        </g>
      </g>
    </svg>
  );
};
