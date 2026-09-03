'use client';

import React from 'react';
import { HeroSection } from './HeroSection';
import { EnrollmentAnnouncementBanner } from './EnrollmentAnnouncementBanner';
import { AnnouncementTicker } from './AnnouncementTicker';
import { QuickAccessSection } from './QuickAccessSection';
import { FeaturedProgramsSection } from './FeaturedProgramsSection';
import { AboutSection } from './AboutSection';
import { MissionVisionValuesSection } from './MissionVisionValuesSection';
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

export const HomeView: React.FC = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <EnrollmentAnnouncementBanner />
      <AnnouncementTicker />
      <QuickAccessSection />
      <FeaturedProgramsSection />
      <AboutSection />
      <MissionVisionValuesSection />
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
