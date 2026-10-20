'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { getSafeImageSrc } from '@/lib/utils';
import { INITIAL_LIFE_AT_PCM_CONFIG } from '@/lib/initialData';
import { Reveal, Stagger, displayCase } from './fx/motion';
import {
  Flame,
  BookOpen,
  Users,
  Compass,
  Globe,
  Award,
  HeartHandshake,
  GraduationCap,
  ArrowRight,
  Church,
  Cross,
  Music,
  Shield,
  Sparkles,
  Heart,
  Sun,
  MapPin,
  Coffee,
  Bookmark,
  Activity,
  Calendar,
  Layers,
  Star,
  CheckCircle,
  HelpCircle,
  Edit,
} from 'lucide-react';

// Icon resolver for dynamic icon names configured by admin
function getLifeIcon(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case 'flame':
    case 'fire':
    case 'worship':
      return Flame;
    case 'bookopen':
    case 'book':
    case 'bible':
      return BookOpen;
    case 'users':
    case 'fellowship':
    case 'group':
      return Users;
    case 'compass':
    case 'practicum':
    case 'direction':
      return Compass;
    case 'globe':
    case 'missions':
    case 'world':
      return Globe;
    case 'award':
    case 'council':
    case 'organization':
    case 'medal':
      return Award;
    case 'hearthandshake':
    case 'outreach':
    case 'relief':
    case 'hands':
      return HeartHandshake;
    case 'graduationcap':
    case 'leadership':
    case 'academic':
    case 'cap':
      return GraduationCap;
    case 'church':
      return Church;
    case 'cross':
      return Cross;
    case 'music':
      return Music;
    case 'shield':
      return Shield;
    case 'sparkles':
      return Sparkles;
    case 'heart':
      return Heart;
    case 'sun':
      return Sun;
    case 'mappin':
      return MapPin;
    case 'coffee':
      return Coffee;
    case 'bookmark':
      return Bookmark;
    case 'activity':
      return Activity;
    case 'calendar':
      return Calendar;
    case 'layers':
      return Layers;
    case 'star':
      return Star;
    case 'checkcircle':
      return CheckCircle;
    default:
      return Sparkles;
  }
}

export const LifeAtPCMSection: React.FC = () => {
  const { siteConfig, navigateTo, isAdminLoggedIn } = usePCM();

  // Read authoritative configuration from store (Firestore synced)
  const config = useMemo(() => {
    return (
      siteConfig?.lifeAtPcm ||
      siteConfig?.studentLife?.lifeAtPcm ||
      INITIAL_LIFE_AT_PCM_CONFIG
    );
  }, [siteConfig?.lifeAtPcm, siteConfig?.studentLife?.lifeAtPcm]);

  // If section is explicitly disabled by admin, hide on public site
  if (config.enabled === false) {
    return null;
  }

  const badgeText = config.badge || 'Holistic Formation';
  const titleText = config.title || 'LIFE AT PCM';
  const subtitleText =
    config.subtitle ||
    'Education at Philippine College of Ministry extends far beyond the lecture hall. Experience a vibrant, Christ-centered campus community where minds are sharpened and hearts are ignited for kingdom service.';
  const ctaBtnText = config.ctaText || 'Explore Campus Life & Spiritual Formation';
  const ctaBtnLink = config.ctaLink || 'student-life';

  // Sorted active items
  const activeItems = (config.items || [])
    .filter((item) => item.active !== false)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  // Display active items configured by admin
  const displayItems = activeItems;

  if (displayItems.length === 0 && !isAdminLoggedIn) {
    return null;
  }

  // Bento rhythm on large screens: a big feature tile, then singles, then a wide tile.
  const span = (i: number) => (i % 6 === 0 ? 'sm:col-span-2 lg:row-span-2' : i % 6 === 5 ? 'sm:col-span-2' : '');

  return (
    <section className="font-text relative w-full bg-white py-20 lg:py-28">
      {/* Admin Quick Edit Shortcut Button */}
      {isAdminLoggedIn && (
        <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
          <button
            onClick={() => {
              navigateTo('admin', 'studentLife');
            }}
            className="flex items-center gap-1.5 rounded-full bg-[#18392B] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#588B76]"
            title="Update Life at PCM Details in Admin CMS"
          >
            <Edit className="h-3.5 w-3.5 text-emerald-300" />
            <span>Edit Life at PCM</span>
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-[#f7f5ef] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">
            <Sparkles className="h-3.5 w-3.5" /> {badgeText}
          </span>
          <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] text-[#10261d] sm:text-5xl lg:text-6xl">{displayCase(titleText)}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#18392b]/70 sm:text-base">{subtitleText}</p>
        </Reveal>

        <Stagger className="grid auto-rows-[230px] grid-cols-1 gap-4 sm:auto-rows-[260px] sm:grid-cols-2 lg:auto-rows-[240px] lg:grid-cols-4 lg:gap-5">
          {displayItems.map((item, idx) => {
            const Icon = getLifeIcon(item.iconName);
            const imageSrc = getSafeImageSrc(
              item.image,
              'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop'
            );
            const big = idx % 6 === 0;
            return (
              <Stagger.Item key={item.id || idx} className={`h-full ${span(idx)}`}>
                <div className="group relative h-full overflow-hidden rounded-[1.75rem] bg-[#10261d]">
                  <Image
                    src={imageSrc}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                    sizes={big ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
                    referrerPolicy="no-referrer"
                    unoptimized={Boolean(typeof imageSrc === 'string' && (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')))}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1d16] via-[#0b1d16]/40 to-transparent transition-opacity duration-500 group-hover:opacity-95" />
                  <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-6 sm:bottom-6">
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="h-5 w-5 text-[#f6e3b4]" />
                    </span>
                    <h3 className={`font-display font-semibold leading-tight ${big ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{item.title}</h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed text-white/80 ${big ? 'line-clamp-3 max-w-md' : 'line-clamp-3'} pointer-fine:max-h-0 pointer-fine:opacity-0 pointer-fine:transition-all pointer-fine:duration-500 pointer-fine:group-hover:max-h-24 pointer-fine:group-hover:opacity-100`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Stagger.Item>
            );
          })}
        </Stagger>

        {ctaBtnText && (
          <Reveal className="mt-12 text-center">
            <button
              onClick={() => navigateTo((ctaBtnLink as any) || 'student-life')}
              className="group inline-flex items-center gap-2 rounded-full bg-[#18392b] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#10261d]"
            >
              {displayCase(ctaBtnText)}
              <ArrowRight className="h-4 w-4 text-[#e8c77a] transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>
        )}
      </div>
    </section>
  );
};
