'use client';

import React from 'react';
import { PCMProvider, usePCM } from '@/lib/store';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ToastContainer } from '@/components/common/ToastContainer';

// Views
import { HomeView } from '@/components/home/HomeView';
import { WhyChoosePCMView } from '@/components/views/WhyChoosePCMView';
import { AboutView } from '@/components/views/AboutView';
import { AcademicsView } from '@/components/views/AcademicsView';
import { AdmissionsView } from '@/components/views/AdmissionsView';
import { ScrapbookView } from '@/components/views/ScrapbookView';
import { MigrationReportView } from '@/components/views/MigrationReportView';
import { StudentLifeView } from '@/components/views/StudentLifeView';
import { MinistryView } from '@/components/views/MinistryView';
import { NewsEventsView } from '@/components/views/NewsEventsView';
import { ResourcesView } from '@/components/views/ResourcesView';
import { ContactView } from '@/components/views/ContactView';
import { ApplicationView } from '@/components/views/ApplicationView';
import { PortalView } from '@/components/views/PortalView';
import { AdminView } from '@/components/views/AdminView';

// Modals
import { ProgramDetailModal } from '@/components/modals/ProgramDetailModal';
import { ArticleDetailModal } from '@/components/modals/ArticleDetailModal';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { FacultyDetailModal } from '@/components/modals/FacultyDetailModal';
import { SermonPlayerModal } from '@/components/modals/SermonPlayerModal';
import { StatementOfFaithModal } from '@/components/modals/StatementOfFaithModal';
import { RequestInfoModal } from '@/components/modals/RequestInfoModal';
import { TuitionCalculatorModal } from '@/components/modals/TuitionCalculatorModal';
import { SearchModal } from '@/components/modals/SearchModal';

const AppContent: React.FC = () => {
  const { currentSection } = usePCM();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1e293b] antialiased">
      {/* Top Header */}
      <Header />

      {/* Main View Router */}
      <main className="flex-1 w-full">
        {currentSection === 'home' && <HomeView />}
        {currentSection === 'why-choose-pcm' && <WhyChoosePCMView />}
        {currentSection === 'about' && <AboutView />}
        {currentSection === 'academics' && <AcademicsView />}
        {currentSection === 'admissions' && <AdmissionsView />}
        {currentSection === 'scrapbook' && <ScrapbookView />}
        {currentSection === 'migration-report' && <MigrationReportView />}
        {currentSection === 'student-life' && <StudentLifeView />}
        {currentSection === 'ministry' && <MinistryView />}
        {currentSection === 'news-events' && <NewsEventsView />}
        {currentSection === 'resources' && <ResourcesView />}
        {currentSection === 'contact' && <ContactView />}
        {currentSection === 'apply' && <ApplicationView />}
        {currentSection === 'portal' && <PortalView />}
        {currentSection === 'admin' && <AdminView />}
      </main>

      {/* Institutional Footer */}
      <Footer />

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Global Interactive Modals */}
      <SearchModal />
      <ProgramDetailModal />
      <ArticleDetailModal />
      <EventDetailModal />
      <FacultyDetailModal />
      <SermonPlayerModal />
      <StatementOfFaithModal />
      <RequestInfoModal />
      <TuitionCalculatorModal />
    </div>
  );
};

export default function Page() {
  return (
    <PCMProvider>
      <AppContent />
    </PCMProvider>
  );
}
