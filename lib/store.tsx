'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  NavSection,
  AcademicProgram,
  AnnouncementItem,
  NewsArticle,
  CollegeEvent,
  FacultyMember,
  Testimonial,
  ImpactStat,
  AdmissionApplication,
  StudentProfile,
  DownloadableResource,
  SermonLecture,
  FAQItem,
  AdminRole,
  AdminUser,
  ApplicationStatus,
  ScrapbookItem,
  MigrationAuditItem,
} from './types';
import {
  INITIAL_PROGRAMS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NEWS,
  INITIAL_EVENTS,
  INITIAL_FACULTY,
  INITIAL_TESTIMONIALS,
  INITIAL_STATS,
  INITIAL_APPLICATIONS,
  DEMO_STUDENT_PROFILE,
  INITIAL_DOWNLOADS,
  INITIAL_SERMONS,
  INITIAL_FAQS,
  INITIAL_ADMIN_USERS,
  INITIAL_SCRAPBOOK,
  INITIAL_MIGRATION_AUDIT,
} from './initialData';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export type ToastInput =
  | {
      type?: 'success' | 'info' | 'warning' | 'error';
      title: string;
      message: string;
    }
  | {
      type: 'success' | 'info' | 'warning' | 'error';
      title: string;
      message: string;
    };

interface PCMContextType {
  // Navigation & Routing
  currentSection: NavSection;
  setCurrentSection: (section: NavSection) => void;
  activeSubSection: string | null;
  currentSubSection: string | null;
  setActiveSubSection: (sub: string | null) => void;
  navigateTo: (section: NavSection, subSection?: string | null) => void;

  // Search
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Active Modals
  selectedProgram: AcademicProgram | null;
  setSelectedProgram: (prog: AcademicProgram | null) => void;
  selectedFaculty: FacultyMember | null;
  setSelectedFaculty: (fac: FacultyMember | null) => void;
  selectedEvent: CollegeEvent | null;
  setSelectedEvent: (evt: CollegeEvent | null) => void;
  selectedArticle: NewsArticle | null;
  setSelectedArticle: (art: NewsArticle | null) => void;
  selectedSermon: SermonLecture | null;
  setSelectedSermon: (sermon: SermonLecture | null) => void;
  statementOfFaithModalOpen: boolean;
  isStatementOfFaithModalOpen: boolean;
  setStatementOfFaithModalOpen: (open: boolean) => void;
  requestInfoModalOpen: boolean;
  isRequestInfoModalOpen: boolean;
  setRequestInfoModalOpen: (open: boolean) => void;
  tuitionCalculatorModalOpen: boolean;
  isTuitionCalculatorModalOpen: boolean;
  setTuitionCalculatorModalOpen: (open: boolean) => void;

  // CMS Managed Data
  announcements: AnnouncementItem[];
  setAnnouncements: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>;
  addAnnouncement: (item: Omit<AnnouncementItem, 'id'>) => void;
  toggleAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => void;

  programs: AcademicProgram[];
  setPrograms: React.Dispatch<React.SetStateAction<AcademicProgram[]>>;
  news: NewsArticle[];
  setNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
  events: CollegeEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CollegeEvent[]>>;
  faculty: FacultyMember[];
  setFaculty: React.Dispatch<React.SetStateAction<FacultyMember[]>>;
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  stats: ImpactStat[];
  setStats: React.Dispatch<React.SetStateAction<ImpactStat[]>>;
  faqs: FAQItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQItem[]>>;
  downloads: DownloadableResource[];
  setDownloads: React.Dispatch<React.SetStateAction<DownloadableResource[]>>;
  sermons: SermonLecture[];
  setSermons: React.Dispatch<React.SetStateAction<SermonLecture[]>>;
  libraryBooks: DownloadableResource[];
  scrapbook: ScrapbookItem[];
  setScrapbook: React.Dispatch<React.SetStateAction<ScrapbookItem[]>>;
  selectedScrapbookItem: ScrapbookItem | null;
  setSelectedScrapbookItem: (item: ScrapbookItem | null) => void;
  migrationAudit: MigrationAuditItem[];
  setMigrationAudit: React.Dispatch<React.SetStateAction<MigrationAuditItem[]>>;

  // Admissions & Online Application System
  applications: AdmissionApplication[];
  submitApplication: (appData: any) => string;
  updateApplicationStatus: (id: string, status: any, note?: string) => void;
  getApplicationByRef: (ref: string) => AdmissionApplication | undefined;
  activeTrackerRef: string;
  setActiveTrackerRef: (ref: string) => void;

  // Student Portal State
  isStudentLoggedIn: boolean;
  setIsStudentLoggedIn: (loggedIn: boolean) => void;
  currentStudent: StudentProfile | null;
  studentProfile: StudentProfile;
  setStudentProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
  studentLogin: (id: string, pass: string) => boolean;
  studentLogout: () => void;
  addPracticumEntry: (entry: Omit<StudentProfile['practicumEntries'][0], 'id' | 'status'>) => void;
  makeTuitionPayment: (amount: number) => void;

  // Admin CMS & RBAC
  isAdminLoggedIn: boolean;
  isAdminAuthenticated: boolean;
  setIsAdminLoggedIn: (loggedIn: boolean) => void;
  adminLogin: (user: string, pass: string) => boolean;
  adminLogout: () => void;
  currentAdminUser: AdminUser;
  setCurrentAdminUser: (user: AdminUser) => void;
  adminUsers: AdminUser[];
  resetToInitialData: () => void;

  // Event Registration
  registerForEvent: (eventId: string, attendeeName: string, email: string) => boolean;

  // Newsletter
  newsletterEmails: string[];
  subscribeNewsletter: (email: string) => boolean;

  // Notifications
  toasts: ToastNotification[];
  addToast: (
    typeOrObj: 'success' | 'info' | 'warning' | 'error' | ToastInput,
    title?: string,
    message?: string
  ) => void;
  removeToast: (id: string) => void;
}

const PCMContext = createContext<PCMContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'pcm_portal_state_v2';

export const PCMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const counterRef = useRef(0);

  // Navigation
  const [currentSection, setCurrentSection] = useState<NavSection>('home');
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);

  // Search
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedProgram, setSelectedProgram] = useState<AcademicProgram | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedSermon, setSelectedSermon] = useState<SermonLecture | null>(null);
  const [statementOfFaithModalOpen, setStatementOfFaithModalOpen] = useState(false);
  const [requestInfoModalOpen, setRequestInfoModalOpen] = useState(false);
  const [tuitionCalculatorModalOpen, setTuitionCalculatorModalOpen] = useState(false);

  // Data States
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => INITIAL_ANNOUNCEMENTS);
  const [programs, setPrograms] = useState<AcademicProgram[]>(() => INITIAL_PROGRAMS);
  const [news, setNews] = useState<NewsArticle[]>(() => INITIAL_NEWS);
  const [events, setEvents] = useState<CollegeEvent[]>(() => INITIAL_EVENTS);
  const [faculty, setFaculty] = useState<FacultyMember[]>(() => INITIAL_FACULTY);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => INITIAL_TESTIMONIALS);
  const [stats, setStats] = useState<ImpactStat[]>(() => INITIAL_STATS);
  const [faqs, setFaqs] = useState<FAQItem[]>(() => INITIAL_FAQS);
  const [downloads, setDownloads] = useState<DownloadableResource[]>(() => INITIAL_DOWNLOADS);
  const [sermons, setSermons] = useState<SermonLecture[]>(() => INITIAL_SERMONS);
  const [scrapbook, setScrapbook] = useState<ScrapbookItem[]>(() => INITIAL_SCRAPBOOK);
  const [selectedScrapbookItem, setSelectedScrapbookItem] = useState<ScrapbookItem | null>(null);
  const [migrationAudit, setMigrationAudit] = useState<MigrationAuditItem[]>(() => INITIAL_MIGRATION_AUDIT);

  // Applications
  const [applications, setApplications] = useState<AdmissionApplication[]>(() => INITIAL_APPLICATIONS);
  const [activeTrackerRef, setActiveTrackerRef] = useState<string>('');

  // Student Portal
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => DEMO_STUDENT_PROFILE);

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsers] = useState<AdminUser[]>(() => INITIAL_ADMIN_USERS);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser>(() => INITIAL_ADMIN_USERS[0]);

  // Newsletter
  const [newsletterEmails, setNewsletterEmails] = useState<string[]>(() => ['pastor.danilo@gmail.com']);

  // Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Keyboard shortcut for Cmd+K Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (
    typeOrObj: 'success' | 'info' | 'warning' | 'error' | ToastInput,
    title?: string,
    message?: string
  ) => {
    counterRef.current += 1;
    const id = `toast-${counterRef.current}`;

    let toastType: 'success' | 'info' | 'warning' | 'error' = 'info';
    let toastTitle = '';
    let toastMsg = '';

    if (typeof typeOrObj === 'object') {
      toastType = typeOrObj.type || 'info';
      toastTitle = typeOrObj.title;
      toastMsg = typeOrObj.message;
    } else {
      toastType = typeOrObj;
      toastTitle = title || '';
      toastMsg = message || '';
    }

    setToasts((prev) => [...prev, { id, type: toastType, title: toastTitle, message: toastMsg }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (section: NavSection, subSection: string | null = null) => {
    setCurrentSection(section);
    setActiveSubSection(subSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitApplication = (appData: any): string => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ref = `PCM-2026-${randomNum}`;
    const newApp: AdmissionApplication = {
      ...appData,
      id: `app-${Date.now()}`,
      referenceNumber: ref,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'submitted',
      internalNotes: ['Application submitted via PCM Online Portal.'],
    };

    setApplications((prev) => [newApp, ...prev]);
    setActiveTrackerRef(ref);
    addToast('success', 'Application Submitted Successfully!', `Your Reference Number is ${ref}. An email confirmation has been logged.`);
    return ref;
  };

  const updateApplicationStatus = (id: string, status: any, note?: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const updatedNotes = note
            ? [...(app.internalNotes || []), `${new Date().toLocaleDateString()}: ${note}`]
            : app.internalNotes;
          return {
            ...app,
            status,
            updatedAt: new Date().toISOString(),
            internalNotes: updatedNotes,
          };
        }
        return app;
      })
    );
    addToast('info', 'Application Status Updated', `Applicant status set to "${status}".`);
  };

  const getApplicationByRef = (ref: string): AdmissionApplication | undefined => {
    return applications.find(
      (a) => a.referenceNumber.trim().toUpperCase() === ref.trim().toUpperCase()
    );
  };

  // Student Auth
  const studentLogin = (id: string, pass: string): boolean => {
    if (id.trim().toUpperCase() === 'PCM-2024-0192' || id.trim().length > 3) {
      setIsStudentLoggedIn(true);
      addToast('success', 'Portal Access Granted', `Welcome back, ${studentProfile.fullName}.`);
      return true;
    }
    return false;
  };

  const studentLogout = () => {
    setIsStudentLoggedIn(false);
    addToast('info', 'Signed Out', 'You have been signed out of MyPCM Student Portal.');
  };

  // Admin Auth
  const adminLogin = (user: string, pass: string): boolean => {
    if (user === 'admin' && pass === 'pcm2026') {
      setIsAdminLoggedIn(true);
      addToast('success', 'Administrator Session Active', 'Signed into PCM Institutional Control System.');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    addToast('info', 'Admin Signed Out', 'Admin session closed securely.');
  };

  // Announcements CRUD
  const addAnnouncement = (item: Omit<AnnouncementItem, 'id'>) => {
    const newItem: AnnouncementItem = {
      ...item,
      id: `ann-${Date.now()}`,
    };
    setAnnouncements((prev) => [newItem, ...prev]);
    addToast('success', 'Announcement Published', `New ticker announcement added.`);
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    addToast('info', 'Announcement Removed', 'Ticker message deleted.');
  };

  const resetToInitialData = () => {
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setPrograms(INITIAL_PROGRAMS);
    setNews(INITIAL_NEWS);
    setEvents(INITIAL_EVENTS);
    setFaculty(INITIAL_FACULTY);
    setTestimonials(INITIAL_TESTIMONIALS);
    setStats(INITIAL_STATS);
    setApplications(INITIAL_APPLICATIONS);
    setStudentProfile(DEMO_STUDENT_PROFILE);
    addToast('success', 'Data Restored', 'All demo datasets have been reset to factory state.');
  };

  const addPracticumEntry = (entry: Omit<StudentProfile['practicumEntries'][0], 'id' | 'status'>) => {
    const newEntry: StudentProfile['practicumEntries'][0] = {
      ...entry,
      id: `prac-${Date.now()}`,
      status: 'Approved',
    };
    setStudentProfile((prev) => ({
      ...prev,
      practicumEntries: [newEntry, ...prev.practicumEntries],
    }));
    addToast('success', 'Practicum Log Saved', `Recorded ${entry.hours} hours of ${entry.ministryType}.`);
  };

  const makeTuitionPayment = (amount: number) => {
    setStudentProfile((prev) => ({
      ...prev,
      tuitionPaid: Math.min(prev.tuitionTotal, prev.tuitionPaid + amount),
    }));
    addToast('success', 'Payment Received', `Successfully processed payment of ₱${amount.toLocaleString('en-PH')}.`);
  };

  const registerForEvent = (eventId: string, attendeeName: string, email: string): boolean => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          return {
            ...ev,
            registeredCount: ev.registeredCount + 1,
          };
        }
        return ev;
      })
    );
    addToast(
      'success',
      'Registration Confirmed!',
      `Thank you, ${attendeeName}. A confirmation has been prepared for ${email}.`
    );
    return true;
  };

  const subscribeNewsletter = (email: string): boolean => {
    if (!email || !email.includes('@')) {
      addToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (newsletterEmails.includes(email)) {
      addToast('info', 'Already Subscribed', 'You are already registered on our PCM community newsletter list.');
      return true;
    }
    setNewsletterEmails((prev) => [...prev, email]);
    addToast('success', 'Subscribed to PCM Updates', 'You will receive our latest theological publications, admissions updates, and event invitations.');
    return true;
  };

  return (
    <PCMContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        activeSubSection,
        currentSubSection: activeSubSection,
        setActiveSubSection,
        navigateTo,

        searchModalOpen,
        setSearchModalOpen,
        searchQuery,
        setSearchQuery,

        selectedProgram,
        setSelectedProgram,
        selectedFaculty,
        setSelectedFaculty,
        selectedEvent,
        setSelectedEvent,
        selectedArticle,
        setSelectedArticle,
        selectedSermon,
        setSelectedSermon,
        statementOfFaithModalOpen,
        isStatementOfFaithModalOpen: statementOfFaithModalOpen,
        setStatementOfFaithModalOpen,
        requestInfoModalOpen,
        isRequestInfoModalOpen: requestInfoModalOpen,
        setRequestInfoModalOpen,
        tuitionCalculatorModalOpen,
        isTuitionCalculatorModalOpen: tuitionCalculatorModalOpen,
        setTuitionCalculatorModalOpen,

        announcements,
        setAnnouncements,
        addAnnouncement,
        toggleAnnouncement,
        deleteAnnouncement,

        programs,
        setPrograms,
        news,
        setNews,
        events,
        setEvents,
        faculty,
        setFaculty,
        testimonials,
        setTestimonials,
        stats,
        setStats,
        faqs,
        setFaqs,
        downloads,
        setDownloads,
        sermons,
        setSermons,
        libraryBooks: downloads,
        scrapbook,
        setScrapbook,
        selectedScrapbookItem,
        setSelectedScrapbookItem,
        migrationAudit,
        setMigrationAudit,

        applications,
        submitApplication,
        updateApplicationStatus,
        getApplicationByRef,
        activeTrackerRef,
        setActiveTrackerRef,

        isStudentLoggedIn,
        setIsStudentLoggedIn,
        currentStudent: isStudentLoggedIn ? studentProfile : null,
        studentProfile,
        setStudentProfile,
        studentLogin,
        studentLogout,
        addPracticumEntry,
        makeTuitionPayment,

        isAdminLoggedIn,
        isAdminAuthenticated: isAdminLoggedIn,
        setIsAdminLoggedIn,
        adminLogin,
        adminLogout,
        currentAdminUser,
        setCurrentAdminUser,
        adminUsers,
        resetToInitialData,

        registerForEvent,
        newsletterEmails,
        subscribeNewsletter,

        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </PCMContext.Provider>
  );
};

export const usePCM = () => {
  const context = useContext(PCMContext);
  if (!context) {
    throw new Error('usePCM must be used within a PCMProvider');
  }
  return context;
};
