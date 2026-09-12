'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { INITIAL_STUDENT_LIFE_CONFIG } from '@/lib/initialData';
import {
  Flame,
  Users,
  BookOpen,
  Compass,
  Heart,
  Home,
  Music,
  GraduationCap,
  Sparkles,
  Award,
  ShieldCheck,
  Calendar,
  Clock,
  Sun,
  MapPin,
  Volume2,
  Edit3,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Mail,
  Camera,
  Filter,
  ExternalLink,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  Users,
  Home,
  BookOpen,
  Music,
  Compass,
  Heart,
  GraduationCap,
  Award,
  ShieldCheck,
  Calendar,
  Clock,
  Sun,
  Sparkles,
  MapPin,
  Volume2,
};

export const StudentLifeView: React.FC = () => {
  const {
    siteConfig,
    navigateTo,
    activeSubSection,
    currentSubSection,
    isAdminAuthenticated,
  } = usePCM();

  // Retrieve dynamic student life config with baseline fallback
  const config = siteConfig.studentLife || INITIAL_STUDENT_LIFE_CONFIG;

  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('All');
  const [openGuidelineId, setOpenGuidelineId] = useState<string | null>(null);

  useEffect(() => {
    const sub = activeSubSection || currentSubSection;
    if (!sub) return;

    const el = document.getElementById(sub);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeSubSection, currentSubSection]);

  const getIcon = (name?: string, fallback = Flame) => {
    if (!name) return fallback;
    return ICON_MAP[name] || fallback;
  };

  const galleryCategories = [
    'All',
    'Chapel',
    'Fellowship',
    'Dormitory',
    'Ministry',
    'Sports',
    'Campus',
  ];

  const filteredPhotos = (config.galleryPhotos || []).filter((p) => {
    if (selectedGalleryCategory === 'All') return true;
    return p.category === selectedGalleryCategory;
  });

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Admin Quick-Edit Bar */}
      {isAdminAuthenticated && (
        <div className="bg-[#10261D] text-white px-4 py-2 text-xs border-b border-[#588B76]/40 sticky top-0 z-30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#588B76] animate-pulse" />
            <span className="font-semibold text-slate-200">
              Administrator Mode: Student Life Section is live & database-synced.
            </span>
          </div>
          <button
            onClick={() => navigateTo('admin', 'studentLife')}
            className="bg-[#588B76] hover:bg-[#46705F] text-white font-bold px-3 py-1 rounded-sm text-[11px] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit in Admin CMS</span>
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            {config.bannerBadge || 'Community & Spiritual Formation'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            {config.bannerTitle || 'LIFE AT PHILIPPINE COLLEGE OF MINISTRY'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            {config.bannerSubtitle}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('apply')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2 rounded-sm transition uppercase tracking-wider cursor-pointer shadow-xs"
            >
              {config.applyButtonText || 'Apply to Join PCM'}
            </button>
            <button
              onClick={() => navigateTo('resources', 'sermons')}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2 rounded-sm border border-[#588B76]/40 transition flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#588B76]" />
              <span>{config.sermonsButtonText || 'Chapel Audio Archive'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Spiritual Formation Pillars */}
        <section id="spiritual-life" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              {config.pillarsBadge || 'Spiritual Life'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              {config.pillarsTitle || 'SPIRITUAL FORMATION & CHAPEL SERVICES'}
            </h2>
            <p className="text-xs text-slate-600 font-light mt-1">
              {config.pillarsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {(config.pillars || []).map((pillar) => {
              const Icon = getIcon(pillar.iconName, Flame);
              return (
                <div
                  key={pillar.id}
                  className="bg-white border border-slate-200 rounded-sm p-6 space-y-3 hover:border-[#588B76] hover:shadow-sm transition group"
                >
                  <div className="w-10 h-10 rounded-sm bg-[#588B76]/10 text-[#588B76] flex items-center justify-center group-hover:bg-[#18392B] group-hover:text-white transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#18392B]">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">
                    {pillar.description}
                  </p>
                  {pillar.actionText && (
                    <button
                      onClick={() => navigateTo((pillar.actionUrl as any) || 'about')}
                      className="text-xs font-semibold text-[#588B76] hover:text-[#18392B] flex items-center gap-1 transition pt-1 cursor-pointer"
                    >
                      <span>{pillar.actionText}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Student Organizations & Guilds */}
        <section id="organizations" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              {config.orgsBadge || 'Student-Led Initiatives'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              {config.orgsTitle || 'STUDENT ORGANIZATIONS & GUILDS'}
            </h2>
            <p className="text-xs text-slate-600 font-light mt-1">
              {config.orgsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {(config.organizations || []).map((org) => {
              const Icon = getIcon(org.iconName, Users);
              return (
                <div
                  key={org.id}
                  className="bg-white border border-slate-200 rounded-sm p-5 space-y-3 hover:border-[#588B76] transition shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-sm bg-[#18392B]/5 text-[#18392B] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">{org.name}</h4>
                    <span className="text-[11px] text-[#588B76] font-semibold">{org.role}</span>
                  </div>
                  {org.description && (
                    <p className="text-xs text-slate-600 leading-relaxed font-light">
                      {org.description}
                    </p>
                  )}
                  {(org.meetingSchedule || org.advisor) && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                      {org.meetingSchedule && <div>Schedule: {org.meetingSchedule}</div>}
                      {org.advisor && <div>Advisor: {org.advisor}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Daily Schedule */}
        {config.dailySchedule && config.dailySchedule.length > 0 && (
          <section id="schedule" className="space-y-6 pt-8 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
                Campus Life
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
                A TYPICAL DAY AT PCM
              </h2>
              <p className="text-xs text-slate-600 font-light mt-1">
                A sanctified schedule combining earnest devotion, rigorous biblical scholarship, shared labor, and communal fellowship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.dailySchedule.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 rounded-sm p-4 space-y-1.5 hover:bg-white hover:border-[#588B76] transition shadow-2xs"
                >
                  <span className="inline-block text-[11px] font-mono font-bold text-[#588B76] bg-white px-2 py-0.5 rounded-sm border border-slate-200">
                    {item.time}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-[#18392B] pt-1">
                    {item.activity}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lamtang Mountain Dormitory Living */}
        {config.dormitoryHeadline && (
          <section id="residence" className="bg-slate-50 border border-slate-200 rounded-sm p-8 space-y-6">
            <div className="max-w-3xl space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
                Residence & Accommodations
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#18392B]">
                {config.dormitoryHeadline}
              </h3>
              {config.dormitoryDescription && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                  {config.dormitoryDescription}
                </p>
              )}
              {config.dormitoryGuidelines && (
                <div className="bg-white border-l-3 border-[#588B76] p-3 rounded-xs text-xs text-slate-700 italic">
                  &ldquo;{config.dormitoryGuidelines}&rdquo;
                </div>
              )}
            </div>

            {config.dormitoryAmenities && config.dormitoryAmenities.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                {config.dormitoryAmenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white px-3 py-2 rounded-sm border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Weekly Ministry Opportunities / Practical Field Engagement */}
        <section id="opportunities" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="bg-[#18392B] text-white p-8 rounded-sm border border-[#588B76]/40 space-y-4">
            <div className="max-w-3xl space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
                {config.ministryBadge || 'Practical Engagement'}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                {config.ministryTitle || 'WEEKLY MINISTRY OPPORTUNITIES'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
                {config.ministryDescription}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => navigateTo('ministry', 'practicum')}
                className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2.5 rounded-sm transition uppercase tracking-wider cursor-pointer shadow-xs"
              >
                {config.ministryPrimaryButtonText || 'Learn About Pastoral Practicum →'}
              </button>
              <button
                onClick={() => navigateTo('contact')}
                className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-sm border border-slate-700 transition cursor-pointer"
              >
                {config.ministrySecondaryButtonText || 'Schedule Campus Visit'}
              </button>
            </div>
          </div>

          {config.ministryOpportunities && config.ministryOpportunities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {config.ministryOpportunities.map((m) => {
                const Icon = getIcon(m.iconName, BookOpen);
                return (
                  <div
                    key={m.id}
                    className="bg-white border border-slate-200 rounded-sm p-5 space-y-3 hover:border-[#588B76] transition shadow-2xs group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xs bg-[#588B76]/10 text-[#588B76] flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#18392B] group-hover:text-[#588B76] transition">
                            {m.title}
                          </h4>
                          <span className="text-[11px] font-semibold text-[#588B76]">
                            Role: {m.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-light">
                      {m.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      {m.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#588B76]" />
                          <span>{m.location}</span>
                        </div>
                      )}
                      {m.schedule && (
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{m.schedule}</span>
                        </div>
                      )}
                    </div>

                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {m.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-xs text-[10px] font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Student Leadership Council */}
        {config.studentLeaders && config.studentLeaders.length > 0 && (
          <section id="leadership" className="space-y-6 pt-8 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
                {config.leadersBadge || 'Student Leadership'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
                {config.leadersTitle || 'PCM STUDENT BODY COUNCIL'}
              </h2>
              <p className="text-xs text-slate-600 font-light mt-1">
                {config.leadersSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              {config.studentLeaders.map((leader) => (
                <div
                  key={leader.id}
                  className="bg-white border border-slate-200 rounded-sm p-5 space-y-3 hover:border-[#588B76] hover:shadow-xs transition text-center"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto bg-slate-100 border-2 border-[#588B76]/30 relative shadow-inner">
                    {leader.photoUrl ? (
                      <Image
                        src={leader.photoUrl}
                        alt={leader.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#18392B] text-white font-serif font-bold text-xl">
                        {leader.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">{leader.name}</h4>
                    <p className="text-xs font-semibold text-[#588B76]">{leader.position}</p>
                    <p className="text-[11px] text-slate-500 font-light">
                      {leader.program} • {leader.yearLevel}
                    </p>
                  </div>

                  {leader.bio && (
                    <p className="text-xs text-slate-600 leading-relaxed font-light text-left">
                      {leader.bio}
                    </p>
                  )}

                  {leader.contactEmail && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-[#588B76] transition">
                      <Mail className="w-3 h-3 text-[#588B76]" />
                      <a href={`mailto:${leader.contactEmail}`} className="truncate">
                        {leader.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Campus Guidelines & FAQs */}
        {config.campusGuidelines && config.campusGuidelines.length > 0 && (
          <section id="guidelines" className="space-y-6 pt-8 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
                {config.guidelinesBadge || 'Campus Governance'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
                {config.guidelinesTitle || 'CAMPUS GUIDELINES & STUDENT LIFE FAQS'}
              </h2>
              <p className="text-xs text-slate-600 font-light mt-1">
                {config.guidelinesSubtitle}
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-3 pt-2">
              {config.campusGuidelines.map((item) => {
                const isOpen = openGuidelineId === item.id;
                return (
                  <div
                    key={item.id}
                    className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenGuidelineId(isOpen ? null : item.id)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-xs bg-[#18392B]/10 text-[#18392B] font-bold shrink-0">
                          {item.category}
                        </span>
                        <h4 className="font-serif font-bold text-sm text-[#18392B]">
                          {item.title}
                        </h4>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180 text-[#588B76]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {item.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Student Life Photo Gallery */}
        {config.galleryPhotos && config.galleryPhotos.length > 0 && (
          <section id="gallery" className="space-y-6 pt-8 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
                {config.galleryBadge || 'Campus Moments'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
                {config.galleryTitle || 'STUDENT LIFE IN PICTURES'}
              </h2>
              <p className="text-xs text-slate-600 font-light mt-1">
                {config.gallerySubtitle}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGalleryCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition cursor-pointer ${
                    selectedGalleryCategory === cat
                      ? 'bg-[#18392B] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-2xs hover:border-[#588B76] hover:shadow-xs transition group"
                >
                  <div className="h-56 w-full relative bg-slate-100 overflow-hidden">
                    {photo.imageUrl ? (
                      <Image
                        src={photo.imageUrl}
                        alt={photo.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-xs bg-slate-900/80 text-white backdrop-blur-xs">
                      {photo.category}
                    </span>
                    {photo.date && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs bg-black/60 text-white backdrop-blur-xs">
                        {photo.date}
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">
                      {photo.title}
                    </h4>
                    {photo.caption && (
                      <p className="text-xs text-slate-600 leading-relaxed font-light line-clamp-2">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
