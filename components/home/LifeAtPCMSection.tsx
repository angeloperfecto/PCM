'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { INITIAL_LIFE_AT_PCM_CONFIG } from '@/lib/initialData';
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
  const { siteConfig, navigateTo, isAdminLoggedIn, setActiveTab } = usePCM();

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

  return (
    <section className="w-full bg-white py-16 lg:py-24 border-b border-[#D0DED8] relative">
      {/* Admin Quick Edit Shortcut Button */}
      {isAdminLoggedIn && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('studentLife');
              navigateTo('admin');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-semibold rounded-full shadow-md transition-all duration-200 cursor-pointer"
            title="Update Life at PCM Details in Admin CMS"
          >
            <Edit className="w-3.5 h-3.5 text-emerald-300" />
            <span>Edit Life at PCM</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#588B76] uppercase tracking-widest font-mono">
            <span>{badgeText}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#18392B] tracking-tight">
            {titleText}
          </h2>
          <p className="text-xs sm:text-sm text-[#18392B]/80 leading-relaxed max-w-2xl mx-auto">
            {subtitleText}
          </p>
        </div>

        {/* Bento Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map((item, idx) => {
            const Icon = getLifeIcon(item.iconName);
            const imageSrc =
              item.image ||
              'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop';

            return (
              <div
                key={item.id || idx}
                className="group relative bg-[#D0DED8]/20 rounded-xl overflow-hidden border border-[#D0DED8] hover:border-[#588B76] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image & Gradient Banner */}
                <div className="h-44 sm:h-40 overflow-hidden relative">
                  <Image
                    src={imageSrc}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    referrerPolicy="no-referrer"
                    unoptimized={Boolean(
                      imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18392B]/95 via-[#18392B]/35 to-transparent" />
                  
                  {/* Floating Icon Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#588B76] text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white/20">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2 bg-white/60">
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#18392B]/75 mt-1.5 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {ctaBtnText && (
          <div className="mt-12 text-center">
            <button
              onClick={() => navigateTo(ctaBtnLink as any || 'student-life')}
              className="inline-flex items-center gap-2 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 uppercase tracking-wider cursor-pointer group"
            >
              <span>{ctaBtnText}</span>
              <ArrowRight className="w-4 h-4 text-[#85AA9B] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
