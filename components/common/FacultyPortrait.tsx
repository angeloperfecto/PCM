'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface FacultyPortraitProps {
  name: string;
  imageUrl?: string;
  id?: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
}

interface PortraitStyle {
  attire: 'gown-red' | 'gown-blue' | 'gown-gold' | 'gown-green' | 'gown-teal' | 'gown-redgold' | 'barong-white' | 'barong-corsage' | 'barong-blue' | 'polo-blue' | 'shirt-brown' | 'trustee-arch' | 'trustee-engr';
  cap: 'mortarboard-gold' | 'mortarboard-red' | 'mortarboard-black' | 'doctoral-tam' | 'none';
  accentColor: string;
  bgGradient: string;
  discipline: string;
  glasses?: boolean;
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

  // If a valid custom photo is provided, render it
  if (imageUrl && imageUrl.trim().length > 0 && !hasError) {
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

  // Get clean initials and honorific
  const cleanName = name.replace(/^(Atty\.|Arch\.|Dr\.|Dra\.|Engr\.|Rev\.|Prof\.)\s+/i, '').replace(/["“”]/g, '');
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Match visual style directly from FACULTY.pdf specifications
  const getPortraitStyle = (targetName: string): PortraitStyle => {
    const n = targetName.toLowerCase();
    
    if (n.includes('laruta')) {
      return {
        attire: 'barong-white',
        cap: 'none',
        accentColor: '#D4AF37',
        bgGradient: 'from-[#142e23] via-[#0b1c15] to-[#060f0b]',
        discipline: 'Law • Philosophy (PUP / DLSU)',
      };
    }
    if (n.includes('ali')) {
      return {
        attire: 'trustee-arch',
        cap: 'none',
        accentColor: '#588B76',
        bgGradient: 'from-[#142e23] via-[#0b1c15] to-[#060f0b]',
        discipline: 'B.S. Architecture • Trustee',
      };
    }
    if (n.includes('batuna')) {
      return {
        attire: 'gown-red',
        cap: 'mortarboard-red',
        accentColor: '#E63946',
        bgGradient: 'from-[#1a1215] via-[#100a0d] to-[#070e1c]',
        discipline: 'B.A. Christian Ministry (1997)',
      };
    }
    if (n.includes('aliba')) {
      return {
        attire: 'gown-red',
        cap: 'mortarboard-red',
        accentColor: '#E63946',
        bgGradient: 'from-[#16291e] via-[#0e1c14] to-[#070e1c]',
        discipline: 'B.S. Architecture • Drafting',
      };
    }
    if (n.includes('marquez')) {
      return {
        attire: 'gown-green',
        cap: 'doctoral-tam',
        accentColor: '#2A9D8F',
        bgGradient: 'from-[#0d3024] via-[#071d15] to-[#040f0b]',
        discipline: 'Doctor of Medicine (M.D.)',
      };
    }
    if (n.includes('suello')) {
      return {
        attire: 'shirt-brown',
        cap: 'none',
        accentColor: '#C49A6C',
        bgGradient: 'from-[#231a14] via-[#150f0c] to-[#070e1c]',
        discipline: 'Board of Trustees',
      };
    }
    if (n.includes('hong')) {
      return {
        attire: 'polo-blue',
        cap: 'none',
        accentColor: '#4A90E2',
        bgGradient: 'from-[#10243b] via-[#0a1726] to-[#070e1c]',
        discipline: 'D.Min. • Former President',
        glasses: true,
      };
    }
    if (n.includes('dungo')) {
      return {
        attire: 'trustee-engr',
        cap: 'none',
        accentColor: '#E76F51',
        bgGradient: 'from-[#142e23] via-[#0b1c15] to-[#060f0b]',
        discipline: 'B.S. Engineering • Trustee',
      };
    }
    if (n.includes('pasion')) {
      return {
        attire: 'gown-red',
        cap: 'mortarboard-gold',
        accentColor: '#D4AF37',
        bgGradient: 'from-[#1f1013] via-[#120a0c] to-[#070e1c]',
        discipline: 'M.Div. • Interim President',
      };
    }
    if (n.includes('cruz')) {
      return {
        attire: 'gown-gold',
        cap: 'mortarboard-gold',
        accentColor: '#F4A261',
        bgGradient: 'from-[#2b210e] via-[#171107] to-[#070e1c]',
        discipline: 'CPA (PH & USA) • Commerce',
      };
    }
    if (n.includes('santos')) {
      return {
        attire: 'gown-redgold',
        cap: 'mortarboard-gold',
        accentColor: '#E76F51',
        bgGradient: 'from-[#261217] via-[#160a0d] to-[#070e1c]',
        discipline: 'MDA • Academic Dean',
      };
    }
    if (n.includes('benalio') && n.includes('marlon')) {
      return {
        attire: 'barong-corsage',
        cap: 'none',
        accentColor: '#85AA9B',
        bgGradient: 'from-[#132c21] via-[#0a1a13] to-[#070e1c]',
        discipline: 'MLIS • School Librarian',
      };
    }
    if (n.includes('cabalar')) {
      return {
        attire: 'gown-blue',
        cap: 'mortarboard-red',
        accentColor: '#3A86FF',
        bgGradient: 'from-[#0e1d33] via-[#091221] to-[#070e1c]',
        discipline: 'MAED-EAS • Registrar',
      };
    }
    if (n.includes('dagasen')) {
      return {
        attire: 'gown-red',
        cap: 'mortarboard-red',
        accentColor: '#E63946',
        bgGradient: 'from-[#241115] via-[#140a0c] to-[#070e1c]',
        discipline: 'MST • Ph.D. Cand. • Philosophy',
      };
    }
    if (n.includes('intuya')) {
      return {
        attire: 'gown-red',
        cap: 'mortarboard-red',
        accentColor: '#E63946',
        bgGradient: 'from-[#241115] via-[#140a0c] to-[#070e1c]',
        discipline: 'Th.M. • M.Div. • Biblical Studies',
      };
    }
    if (n.includes('agayao')) {
      return {
        attire: 'gown-blue',
        cap: 'mortarboard-black',
        accentColor: '#4CC9F0',
        bgGradient: 'from-[#0d2238] via-[#081524] to-[#070e1c]',
        discipline: 'Dean of Student Affairs • MDP',
      };
    }
    if (n.includes('benalio') && n.includes('adelaida')) {
      return {
        attire: 'gown-red',
        cap: 'mortarboard-red',
        accentColor: '#E63946',
        bgGradient: 'from-[#241115] via-[#140a0c] to-[#070e1c]',
        discipline: 'MAG • Library Staff',
        glasses: true,
      };
    }
    if (n.includes('virtudazo')) {
      return {
        attire: 'gown-red',
        cap: 'mortarboard-red',
        accentColor: '#E63946',
        bgGradient: 'from-[#241115] via-[#140a0c] to-[#070e1c]',
        discipline: 'MAFIL • Finance & Admin Staff',
      };
    }
    if (n.includes('bacuyag')) {
      return {
        attire: 'gown-teal',
        cap: 'mortarboard-red',
        accentColor: '#2A9D8F',
        bgGradient: 'from-[#0c2a27] via-[#071917] to-[#070e1c]',
        discipline: 'Finance Officer • Biblical Greek',
      };
    }
    if (n.includes('huckaba')) {
      return {
        attire: 'gown-redgold',
        cap: 'mortarboard-gold',
        accentColor: '#D4AF37',
        bgGradient: 'from-[#1c1829] via-[#100d19] to-[#070e1c]',
        discipline: 'Th.D. • Academic Dean Emeritus',
      };
    }
    if (n.includes('lubag')) {
      return {
        attire: 'barong-blue',
        cap: 'none',
        accentColor: '#5390D9',
        bgGradient: 'from-[#0d233a] via-[#081626] to-[#070e1c]',
        discipline: 'D.Min. • Ed.D. • Founding President',
      };
    }

    // Default Academic Style
    return {
      attire: 'gown-red',
      cap: 'mortarboard-red',
      accentColor: '#85AA9B',
      bgGradient: 'from-[#142e23] via-[#0b1c15] to-[#060f0b]',
      discipline: 'Philippine College of Ministry',
    };
  };

  const style = getPortraitStyle(name);

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-between bg-gradient-to-b ${style.bgGradient} p-3 text-center relative select-none overflow-hidden ${className}`}
    >
      {/* Background Institutional Seal Watermark */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="85" stroke="#D4AF37" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="70" stroke="#D4AF37" strokeWidth="1" />
        <path d="M100 25 L100 175 M25 100 L175 100" stroke="#D4AF37" strokeWidth="0.5" />
      </svg>

      {/* Top Banner: Academic Affiliation */}
      <div className="w-full flex items-center justify-between pt-1 px-1 z-10">
        <span className="text-[9px] font-mono font-bold tracking-widest text-[#85AA9B] uppercase">
          PCM • 1992
        </span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.accentColor }} />
      </div>

      {/* Centerpiece: Academic Regalia & Silhouette Avatar */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10">
        {/* Cap Representation */}
        {style.cap === 'mortarboard-gold' && (
          <div className="relative w-14 h-5 mb-0.5">
            {/* Mortarboard Diamond Top */}
            <div className="w-12 h-3.5 mx-auto bg-slate-950 border border-slate-700 transform rotate-45 rounded-xs shadow-md" />
            {/* Gold Tassel */}
            <div className="absolute top-1 right-2 w-1.5 h-4 bg-[#D4AF37] rounded-full shadow-xs transform rotate-12" />
          </div>
        )}
        {style.cap === 'mortarboard-red' && (
          <div className="relative w-14 h-5 mb-0.5">
            <div className="w-12 h-3.5 mx-auto bg-slate-950 border border-slate-700 transform rotate-45 rounded-xs shadow-md" />
            <div className="absolute top-1 right-2 w-1.5 h-4 bg-[#E63946] rounded-full shadow-xs transform rotate-12" />
          </div>
        )}
        {style.cap === 'doctoral-tam' && (
          <div className="relative w-14 h-4 mb-0.5">
            <div className="w-12 h-3.5 mx-auto bg-[#1b4332] border border-[#40916c] rounded-full shadow-md" />
            <div className="absolute top-0.5 right-2 w-1.5 h-4 bg-[#D4AF37] rounded-full shadow-xs" />
          </div>
        )}

        {/* Head Monogram Badge */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-slate-900 via-[#18392B] to-slate-950 border-2 border-[#588B76]/70 shadow-lg flex items-center justify-center">
          <span className="font-serif text-lg sm:text-xl font-extrabold text-white tracking-widest drop-shadow-md">
            {initials}
          </span>
          {style.glasses && (
            <div className="absolute top-5 flex gap-2">
              <div className="w-3.5 h-2.5 border border-amber-300/80 rounded-full" />
              <div className="w-3.5 h-2.5 border border-amber-300/80 rounded-full" />
            </div>
          )}
        </div>

        {/* Regalia / Attire Neckline */}
        <div className="mt-1 flex items-center justify-center">
          {style.attire === 'barong-white' && (
            <div className="px-2 py-0.5 bg-slate-100/90 text-[#18392B] text-[9px] font-serif font-bold rounded-xs border border-amber-300/60 shadow-xs">
              Barong Tagalog • Law
            </div>
          )}
          {style.attire === 'barong-corsage' && (
            <div className="px-2 py-0.5 bg-slate-100/90 text-[#18392B] text-[9px] font-serif font-bold rounded-xs border border-amber-300/60 shadow-xs flex items-center gap-1">
              <span>🌸</span>
              <span>Formal Barong</span>
            </div>
          )}
          {style.attire === 'barong-blue' && (
            <div className="px-2 py-0.5 bg-[#1d3557] text-[#A8DADC] text-[9px] font-serif font-bold rounded-xs border border-blue-400/50 shadow-xs">
              Presidential Batik Barong
            </div>
          )}
          {style.attire === 'polo-blue' && (
            <div className="px-2 py-0.5 bg-[#2B4162] text-white text-[9px] font-serif font-bold rounded-xs border border-blue-400/40 shadow-xs">
              Pastoral & Mission Attire
            </div>
          )}
          {style.attire === 'shirt-brown' && (
            <div className="px-2 py-0.5 bg-[#4A3B32] text-amber-100 text-[9px] font-serif font-bold rounded-xs border border-amber-600/40 shadow-xs">
              Board of Trustees
            </div>
          )}
          {style.attire === 'trustee-arch' && (
            <div className="px-2 py-0.5 bg-[#1b3a2f] text-emerald-100 text-[9px] font-serif font-bold rounded-xs border border-emerald-500/40 shadow-xs">
              Architecture & Campus Planning
            </div>
          )}
          {style.attire === 'trustee-engr' && (
            <div className="px-2 py-0.5 bg-[#3a221b] text-orange-100 text-[9px] font-serif font-bold rounded-xs border border-orange-500/40 shadow-xs">
              B.S. Engineering Advisory
            </div>
          )}
          {style.attire === 'gown-red' && (
            <div className="px-2 py-0.5 bg-[#8b1e28] text-white text-[9px] font-serif font-bold rounded-xs border border-red-400/40 shadow-xs">
              Theological Regalia • Scarlet Hood
            </div>
          )}
          {style.attire === 'gown-blue' && (
            <div className="px-2 py-0.5 bg-[#1d4e89] text-white text-[9px] font-serif font-bold rounded-xs border border-blue-400/40 shadow-xs">
              Education Regalia • Blue Hood
            </div>
          )}
          {style.attire === 'gown-gold' && (
            <div className="px-2 py-0.5 bg-[#9c6615] text-amber-100 text-[9px] font-serif font-bold rounded-xs border border-amber-400/40 shadow-xs">
              Commerce & CPA • Gold Hood
            </div>
          )}
          {style.attire === 'gown-green' && (
            <div className="px-2 py-0.5 bg-[#1b5e40] text-emerald-100 text-[9px] font-serif font-bold rounded-xs border border-emerald-400/40 shadow-xs">
              Doctor of Medicine • Green Hood
            </div>
          )}
          {style.attire === 'gown-teal' && (
            <div className="px-2 py-0.5 bg-[#175654] text-teal-100 text-[9px] font-serif font-bold rounded-xs border border-teal-400/40 shadow-xs">
              Guidance & Languages • Teal Hood
            </div>
          )}
          {style.attire === 'gown-redgold' && (
            <div className="px-2 py-0.5 bg-[#6e1e24] text-amber-200 text-[9px] font-serif font-bold rounded-xs border border-amber-400/50 shadow-xs">
              Administration • Scarlet & Gold
            </div>
          )}
        </div>
      </div>

      {/* Bottom Label: Discipline from PDF */}
      <div className="w-full pt-1.5 border-t border-slate-700/50 z-10">
        <p className="text-[10px] font-medium text-slate-300 truncate max-w-full">
          {style.discipline}
        </p>
      </div>
    </div>
  );
};
