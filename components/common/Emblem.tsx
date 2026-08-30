import React from 'react';

interface EmblemProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'shield-only' | 'monochrome' | 'gold-accent';
  id?: string;
}

export const Emblem: React.FC<EmblemProps> = ({
  className = '',
  size = 48,
  variant = 'full',
  id = 'pcm-official-seal',
}) => {
  // 12 outer scallops positioned around a 1000x1000 coordinate plane
  const cx = 500;
  const cy = 500;
  const numPetals = 12;
  const rCenter = 395;
  const rPetal = 115;

  const petals = Array.from({ length: numPetals }, (_, i) => {
    const angleDeg = i * (360 / numPetals) - 90;
    const angleRad = (angleDeg * Math.PI) / 180;
    const px = cx + rCenter * Math.cos(angleRad);
    const py = cy + rCenter * Math.sin(angleRad);
    return { px, py, key: i };
  });

  return (
    <svg
      id={id}
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label="Philippine College of Ministry Official Logo"
      role="img"
    >
      <defs>
        <style>
          {`
            .pcm-seal-font {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Arial Black", Arial, sans-serif;
              font-weight: 900;
            }
            .pcm-roman-font {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-weight: 800;
            }
          `}
        </style>

        {/* Top arched text path for PHILIPPINE COLLEGE */}
        <path
          id="pcmTopTextArc"
          d="M 152 500 A 348 348 0 0 1 848 500"
          fill="none"
        />

        {/* Bottom arched text path for OF MINISTRY, INC */}
        <path
          id="pcmBottomTextArc"
          d="M 848 500 A 348 348 0 0 1 152 500"
          fill="none"
        />

        {/* Arched path for Roman Numerals MCMXCII at bottom inside black circle */}
        <path
          id="pcmRomanArc"
          d="M 330 735 A 260 260 0 0 0 670 735"
          fill="none"
        />
      </defs>

      {/* 1. OUTER SCALLOPED 12-PETAL ROSETTE BORDER */}
      <g id="pcm-seal-scallops">
        {petals.map((petal) => (
          <circle
            key={petal.key}
            cx={petal.px}
            cy={petal.py}
            r={rPetal}
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="26"
          />
        ))}
        {/* Inner fill to unify the rosette disc */}
        <circle cx={cx} cy={cy} r="435" fill="#FFFFFF" />
      </g>

      {/* 2. OUTER BLACK CIRCULAR RING */}
      <circle
        cx={cx}
        cy={cy}
        r="438"
        fill="none"
        stroke="#000000"
        strokeWidth="24"
      />

      {/* 3. INNER BLACK CIRCLE (CENTRAL DISC) */}
      <circle
        cx={cx}
        cy={cy}
        r="275"
        fill="#000000"
        stroke="#000000"
        strokeWidth="20"
      />

      {/* 4. CIRCULAR TEXT IN WHITE ANNULAR BAND */}
      <g id="pcm-seal-typography">
        {/* Upper Arch: PHILIPPINE COLLEGE */}
        <text
          className="pcm-seal-font"
          fontSize="64"
          fill="#000000"
          letterSpacing="4"
        >
          <textPath href="#pcmTopTextArc" startOffset="50%" textAnchor="middle">
            PHILIPPINE COLLEGE
          </textPath>
        </text>

        {/* Lower Arch: OF MINISTRY, INC */}
        <text
          className="pcm-seal-font"
          fontSize="64"
          fill="#000000"
          letterSpacing="4"
        >
          <textPath href="#pcmBottomTextArc" startOffset="50%" textAnchor="middle">
            OF MINISTRY, INC
          </textPath>
        </text>

        {/* Left and Right Separator Dots */}
        <circle cx="170" cy="542" r="18" fill="#000000" />
        <circle cx="830" cy="542" r="18" fill="#000000" />
      </g>

      {/* 5. CENTRAL EMBLEM (OPEN BIBLE, 3D CROSS & MCMXCII) */}
      <g id="pcm-seal-center">
        {/* Roman Numerals: MCMXCII (1992) */}
        <text
          className="pcm-roman-font"
          fontSize="35"
          fill="#FFFFFF"
          letterSpacing="3"
        >
          <textPath href="#pcmRomanArc" startOffset="50%" textAnchor="middle">
            MCMXCII
          </textPath>
        </text>

        {/* OPEN HOLY BIBLE */}
        <g id="pcm-seal-bible">
          {/* Left Page Block */}
          <path
            d="M 488 375 C 410 360 300 375 250 400 L 245 580 C 300 550 420 540 488 565 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          {/* Right Page Block */}
          <path
            d="M 512 375 C 590 360 700 375 750 400 L 755 580 C 700 550 580 540 512 565 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="8"
            strokeLinejoin="round"
          />

          {/* Spine Seam Center */}
          <path
            d="M 488 375 L 500 380 L 512 375 L 512 565 L 500 572 L 488 565 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="4"
          />

          {/* Scripture lines Left Page (2 columns) */}
          {[410, 423, 436, 449, 462, 475, 488, 501, 514, 527].map((y, idx) => (
            <React.Fragment key={`left-lines-${idx}`}>
              <line
                x1="285"
                y1={y - 8}
                x2="370"
                y2={y - 12}
                stroke="#000000"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <line
                x1="390"
                y1={y - 13}
                x2="475"
                y2={y - 8}
                stroke="#000000"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </React.Fragment>
          ))}

          {/* Scripture lines Right Page (2 columns) */}
          {[410, 423, 436, 449, 462, 475, 488, 501, 514, 527].map((y, idx) => (
            <React.Fragment key={`right-lines-${idx}`}>
              <line
                x1="525"
                y1={y - 8}
                x2="610"
                y2={y - 13}
                stroke="#000000"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <line
                x1="630"
                y1={y - 12}
                x2="715"
                y2={y - 8}
                stroke="#000000"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </React.Fragment>
          ))}

          {/* Bible Bottom Thickness Edge */}
          <path
            d="M 245 580 C 270 595 380 575 488 600 L 488 565"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="5"
          />
          <path
            d="M 755 580 C 730 595 620 575 512 600 L 512 565"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="5"
          />

          {/* Bookmark Tag on Left Page Bottom with Latin Cross */}
          <rect
            x="355"
            y="560"
            width="40"
            height="42"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="4"
            rx="2"
          />
          <line
            x1="375"
            y1="566"
            x2="375"
            y2="594"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="square"
          />
          <line
            x1="364"
            y1="575"
            x2="386"
            y2="575"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="square"
          />

          {/* Curved Looping Arrow on Right Page */}
          <path
            d="M 575 515 C 610 520 625 490 615 460 C 605 440 580 445 570 470 C 563 490 570 515 595 518 L 585 528"
            fill="none"
            stroke="#000000"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 595 518 L 582 505"
            stroke="#000000"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* 3D TILTED CHRISTIAN CROSS (Tilted ~14° to the right) */}
        <g id="pcm-seal-cross" transform="translate(485, 470) rotate(14)">
          {/* 3D Deep Shadow Silhouette (Extruded back & left) */}
          <path
            d="M -56 -212 L 42 -212 L 42 -102 L 122 -102 L 122 -10 L 42 -10 L 42 212 L -56 212 L -56 -10 L -138 -10 L -138 -102 L -56 -102 Z"
            fill="#000000"
          />

          {/* Front Pure White Cross Face with Black Outline */}
          <path
            d="M -40 -200 L 40 -200 L 40 -90 L 120 -90 L 120 -30 L 40 -30 L 40 195 L -40 195 L -40 -30 L -120 -30 L -120 -90 L -40 -90 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="8"
            strokeLinejoin="miter"
          />

          {/* Crisp dimensional inner accent */}
          <path
            d="M -36 -196 L 36 -196 L 36 -86 L 116 -86 L 116 -34 L 36 -34 L 36 191 L -36 191 L -36 -34 L -116 -34 L -116 -86 L -36 -86 Z"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="2"
            opacity="0.4"
          />
        </g>
      </g>
    </svg>
  );
};

