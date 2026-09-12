'use client';

import React, { useEffect } from 'react';
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
    setSelectedSermon,
    sermons,
    isAdminAuthenticated,
  } = usePCM();

  // Retrieve dynamic student life config with baseline fallback
  const config = siteConfig.studentLife || INITIAL_STUDENT_LIFE_CONFIG;

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Core Spiritual Formation Pillars Grid */}
        <section id="chapel" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              {config.pillarsBadge || 'Spiritual Life'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              {config.pillarsTitle || 'SPIRITUAL FORMATION & CHAPEL SERVICES'}
            </h2>
            {config.pillarsSubtitle && (
              <p className="text-xs text-slate-600 font-light mt-1">
                {config.pillarsSubtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {config.pillars.map((pillar) => {
              const PillarIcon = getIcon(pillar.iconName, Flame);
              return (
                <div
                  key={pillar.id}
                  id={pillar.id}
                  className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-[#588B76] transition"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-sm bg-[#18392B] text-white flex items-center justify-center font-bold">
                      <PillarIcon className="w-6 h-6 text-[#588B76]" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#18392B]">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {pillar.actionText && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (pillar.actionUrl === 'sermons' && sermons.length > 0) {
                            setSelectedSermon(sermons[0]);
                          } else if (pillar.actionUrl) {
                            navigateTo(pillar.actionUrl as any);
                          } else {
                            navigateTo('resources', 'sermons');
                          }
                        }}
                        className="text-xs font-bold text-[#18392B] hover:text-[#588B76] flex items-center gap-1 cursor-pointer"
                      >
                        <span>{pillar.actionText}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Student Organizations & Guilds */}
        <section id="orgs" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              {config.orgsBadge || 'Student-Led Initiatives'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              {config.orgsTitle || 'STUDENT ORGANIZATIONS & GUILDS'}
            </h2>
            {config.orgsSubtitle && (
              <p className="text-xs text-slate-600 font-light mt-1">
                {config.orgsSubtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.organizations.map((org) => {
              const OrgIcon = getIcon(org.iconName, GraduationCap);
              return (
                <div
                  key={org.id}
                  className="bg-white p-5 rounded-sm border border-slate-200 text-center space-y-2.5 shadow-xs hover:border-[#588B76] transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="w-12 h-12 rounded-sm bg-[#18392B]/5 text-[#18392B] flex items-center justify-center mx-auto">
                      <OrgIcon className="w-5 h-5 text-[#588B76]" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#18392B]">{org.name}</h4>
                      <p className="text-xs text-[#588B76] font-medium mt-0.5">{org.role}</p>
                    </div>
                    {org.description && (
                      <p className="text-xs text-slate-500 leading-relaxed text-left line-clamp-3">
                        {org.description}
                      </p>
                    )}
                  </div>

                  {(org.meetingSchedule || org.advisor) && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-left space-y-0.5">
                      {org.meetingSchedule && (
                        <div>
                          <span className="font-semibold text-slate-700">Schedule:</span> {org.meetingSchedule}
                        </div>
                      )}
                      {org.advisor && (
                        <div>
                          <span className="font-semibold text-slate-700">Advisor:</span> {org.advisor}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Daily Schedule & Campus Routine */}
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

        {/* Weekly Ministry Opportunities */}
        <section
          id="opportunities"
          className="bg-[#18392B] text-white p-8 rounded-sm border border-[#588B76]/40 space-y-4"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              {config.ministryBadge || 'Practical Engagement'}
            </span>
            <h3 className="font-serif text-2xl font-bold text-white">
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
        </section>
      </div>
    </div>
  );
};
