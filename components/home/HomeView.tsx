'use client';

import React from 'react';
import { displayFont, textFont } from '@/lib/fonts';
import { HeroSection } from './HeroSection';
import { EnrollmentAnnouncementBanner } from './EnrollmentAnnouncementBanner';
import { AnnouncementTicker } from './AnnouncementTicker';
import { QuickAccessSection } from './QuickAccessSection';
import { FeaturedProgramsSection } from './FeaturedProgramsSection';
import { AboutSection } from './AboutSection';
import { MissionVisionValuesSection } from './MissionVisionValuesSection';
import { HomeVideoSection } from './HomeVideoSection';
import { NewsSection } from './NewsSection';
import { EventsSection } from './EventsSection';
import { CTASection } from './CTASection';
import { LifeAtPCMSection } from './LifeAtPCMSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FacultySection } from './FacultySection';
import { Admissions4StepSection } from './Admissions4StepSection';
import { ImpactStatsSection } from './ImpactStatsSection';
import { PartnersSection } from './PartnersSection';
import { NewsletterSection } from './NewsletterSection';
import { PillarsBand } from './PillarsBand';
import { Reveal, ScrollProgress } from './fx/motion';

// Home: "Dawn over the Cordillera". All content comes from the Admin CMS; this file only arranges it and adds
// the type, reading-progress bar and scroll reveals shared by every section.
export const HomeView: React.FC = () => {
  return (
    <div className={`home-scope w-full ${displayFont.variable} ${textFont.variable}`}>
      <ScrollProgress />
      <HeroSection />
      <EnrollmentAnnouncementBanner />
      <AnnouncementTicker />
      <QuickAccessSection />
      <FeaturedProgramsSection />
      <AboutSection />
      <PillarsBand />
      <MissionVisionValuesSection />
      <Reveal><HomeVideoSection /></Reveal>
      <NewsSection />
      <EventsSection />
      <CTASection />
      <LifeAtPCMSection />
      <TestimonialsSection />
      <FacultySection />
      <Admissions4StepSection />
      <ImpactStatsSection />
      <PartnersSection />
      <NewsletterSection />
    </div>
  );
};
