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
  SiteConfig,
  MediaItem,
  GalleryAlbum,
  ActivityLogItem,
  ContentStatus,
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
  INITIAL_SITE_CONFIG,
  INITIAL_MEDIA_ITEMS,
  INITIAL_GALLERY_ALBUMS,
  INITIAL_ACTIVITY_LOGS,
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

  // Site Configuration (Homepage, About, Contact, SEO, Navigation, Footer, CTAs)
  siteConfig: SiteConfig;
  setSiteConfig: React.Dispatch<React.SetStateAction<SiteConfig>>;
  updateSiteConfig: (newConfig: Partial<SiteConfig>) => void;
  updateContactInfo: (newInfo: Partial<SiteConfig['contactInfo']>) => void;
  updateSeoSettings: (newSeo: Partial<SiteConfig['seoSettings']>) => void;
  updateSiteIdentity: (newIdentity: Partial<SiteConfig['siteIdentity']>) => void;
  updateHomeAbout: (newHomeAbout: Partial<SiteConfig['homeAbout']>) => void;
  updateMissionVisionValues: (newMvv: Partial<SiteConfig['missionVisionValues']>) => void;
  updateCtaSections: (newCtas: Partial<SiteConfig['ctaSections']>) => void;
  updateAdmissionsConfig: (newAdm: Partial<SiteConfig['admissionsConfig']>) => void;
  updateFooterConfig: (newFooter: Partial<SiteConfig['footerConfig']>) => void;
  updateNavigationMenu: (newNav: SiteConfig['navigationMenu']) => void;

  // Media Library
  mediaItems: MediaItem[];
  mediaLibrary: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  addMediaItem: (item: Omit<MediaItem, 'id' | 'uploadDate'>) => MediaItem;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => void;
  deleteMediaItem: (id: string) => void;

  // Gallery Albums
  galleryAlbums: GalleryAlbum[];
  setGalleryAlbums: React.Dispatch<React.SetStateAction<GalleryAlbum[]>>;
  addGalleryAlbum: (album: Omit<GalleryAlbum, 'id'>) => GalleryAlbum;
  updateGalleryAlbum: (id: string, updates: Partial<GalleryAlbum>) => void;
  deleteGalleryAlbum: (id: string) => void;

  // Activity Audit Log
  activityLogs: ActivityLogItem[];
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLogItem[]>>;
  logActivity: (
    action: ActivityLogItem['action'],
    entityType: string,
    entityId: string,
    entityName: string,
    description: string
  ) => void;
  clearActivityLogs: () => void;

  // Announcements CRUD
  announcements: AnnouncementItem[];
  setAnnouncements: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>;
  addAnnouncement: (item: Omit<AnnouncementItem, 'id'>) => void;
  updateAnnouncement: (id: string, updates: Partial<AnnouncementItem>) => void;
  toggleAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => void;

  // Programs CRUD
  programs: AcademicProgram[];
  setPrograms: React.Dispatch<React.SetStateAction<AcademicProgram[]>>;
  addProgram: (program: Omit<AcademicProgram, 'id'>) => AcademicProgram;
  updateProgram: (id: string, updates: Partial<AcademicProgram>) => void;
  deleteProgram: (id: string) => void;

  // Faculty CRUD
  faculty: FacultyMember[];
  setFaculty: React.Dispatch<React.SetStateAction<FacultyMember[]>>;
  addFaculty: (member: Omit<FacultyMember, 'id'>) => FacultyMember;
  addFacultyMember: (member: Omit<FacultyMember, 'id'>) => FacultyMember;
  updateFaculty: (id: string, updates: Partial<FacultyMember>) => void;
  updateFacultyMember: (id: string, updates: Partial<FacultyMember>) => void;
  deleteFaculty: (id: string) => void;
  deleteFacultyMember: (id: string) => void;

  // News CRUD
  news: NewsArticle[];
  setNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
  addNewsArticle: (article: Omit<NewsArticle, 'id'>) => NewsArticle;
  updateNewsArticle: (id: string, updates: Partial<NewsArticle>) => void;
  deleteNewsArticle: (id: string) => void;

  // Events CRUD
  events: CollegeEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CollegeEvent[]>>;
  addEvent: (event: Omit<CollegeEvent, 'id'>) => CollegeEvent;
  addEventItem?: (event: Omit<CollegeEvent, 'id'>) => CollegeEvent;
  updateEvent: (id: string, updates: Partial<CollegeEvent>) => void;
  updateEventItem?: (id: string, updates: Partial<CollegeEvent>) => void;
  deleteEvent: (id: string) => void;
  deleteEventItem?: (id: string) => void;

  // Downloads / Resources CRUD
  downloads: DownloadableResource[];
  setDownloads: React.Dispatch<React.SetStateAction<DownloadableResource[]>>;
  addDownload: (res: Omit<DownloadableResource, 'id'>) => DownloadableResource;
  addDownloadResource: (res: Omit<DownloadableResource, 'id'>) => DownloadableResource;
  updateDownload: (id: string, updates: Partial<DownloadableResource>) => void;
  deleteDownload: (id: string) => void;
  deleteDownloadResource: (id: string) => void;

  // Testimonials CRUD
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  addTestimonial: (item: Omit<Testimonial, 'id'>) => void;
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;

  // Stats & FAQs
  stats: ImpactStat[];
  setStats: React.Dispatch<React.SetStateAction<ImpactStat[]>>;
  updateStat: (id: string, updates: Partial<ImpactStat>) => void;
  faqs: FAQItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQItem[]>>;
  addFaq: (item: Omit<FAQItem, 'id'>) => void;
  updateFaq: (id: string, updates: Partial<FAQItem>) => void;
  deleteFaq: (id: string) => void;

  // Sermons & Scrapbook
  sermons: SermonLecture[];
  setSermons: React.Dispatch<React.SetStateAction<SermonLecture[]>>;
  addSermon: (item: Omit<SermonLecture, 'id'>) => void;
  updateSermon: (id: string, updates: Partial<SermonLecture>) => void;
  deleteSermon: (id: string) => void;

  libraryBooks: DownloadableResource[];
  scrapbook: ScrapbookItem[];
  setScrapbook: React.Dispatch<React.SetStateAction<ScrapbookItem[]>>;
  addScrapbookItem: (item: Omit<ScrapbookItem, 'id'>) => void;
  updateScrapbookItem: (id: string, updates: Partial<ScrapbookItem>) => void;
  deleteScrapbookItem: (id: string) => void;
  selectedScrapbookItem: ScrapbookItem | null;
  setSelectedScrapbookItem: (item: ScrapbookItem | null) => void;
  migrationAudit: MigrationAuditItem[];
  setMigrationAudit: React.Dispatch<React.SetStateAction<MigrationAuditItem[]>>;

  // Admissions & Online Application System
  applications: AdmissionApplication[];
  submitApplication: (appData: any) => string;
  updateApplicationStatus: (id: string, status: any, note?: string) => void;
  addApplicationNote: (id: string, note: string) => void;
  deleteApplication: (id: string) => void;
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
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => AdminUser;
  updateAdminUser: (id: string, updates: Partial<AdminUser>) => void;
  deleteAdminUser: (id: string) => void;
  changeAdminPassword: (userId: string, newPass: string) => boolean;
  canPerformAction: (requiredRole: AdminRole) => boolean;

  // Backup & Restore
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
  resetToInitialData: () => void;

  // Event Registration & Newsletter
  registerForEvent: (eventId: string, attendeeName: string, email: string) => boolean;
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

const LOCAL_STORAGE_KEY = 'pcm_cms_database_v3';

function loadPersisted<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed[key] !== undefined ? parsed[key] : fallback;
  } catch {
    return fallback;
  }
}

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

  // Core CMS Data States
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => loadPersisted('siteConfig', INITIAL_SITE_CONFIG));
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => loadPersisted('mediaItems', INITIAL_MEDIA_ITEMS));
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>(() => loadPersisted('galleryAlbums', INITIAL_GALLERY_ALBUMS));
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => loadPersisted('activityLogs', INITIAL_ACTIVITY_LOGS));

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => loadPersisted('announcements', INITIAL_ANNOUNCEMENTS));
  const [programs, setPrograms] = useState<AcademicProgram[]>(() => loadPersisted('programs', INITIAL_PROGRAMS));
  const [news, setNews] = useState<NewsArticle[]>(() => loadPersisted('news', INITIAL_NEWS));
  const [events, setEvents] = useState<CollegeEvent[]>(() => loadPersisted('events', INITIAL_EVENTS));
  const [faculty, setFaculty] = useState<FacultyMember[]>(() => loadPersisted('faculty', INITIAL_FACULTY));
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => loadPersisted('testimonials', INITIAL_TESTIMONIALS));
  const [stats, setStats] = useState<ImpactStat[]>(() => loadPersisted('stats', INITIAL_STATS));
  const [faqs, setFaqs] = useState<FAQItem[]>(() => loadPersisted('faqs', INITIAL_FAQS));
  const [downloads, setDownloads] = useState<DownloadableResource[]>(() => loadPersisted('downloads', INITIAL_DOWNLOADS));
  const [sermons, setSermons] = useState<SermonLecture[]>(() => loadPersisted('sermons', INITIAL_SERMONS));
  const [scrapbook, setScrapbook] = useState<ScrapbookItem[]>(() => loadPersisted('scrapbook', INITIAL_SCRAPBOOK));
  const [selectedScrapbookItem, setSelectedScrapbookItem] = useState<ScrapbookItem | null>(null);
  const [migrationAudit, setMigrationAudit] = useState<MigrationAuditItem[]>(() => INITIAL_MIGRATION_AUDIT);

  // Applications
  const [applications, setApplications] = useState<AdmissionApplication[]>(() => loadPersisted('applications', INITIAL_APPLICATIONS));
  const [activeTrackerRef, setActiveTrackerRef] = useState<string>('');

  // Student Portal
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => loadPersisted('studentProfile', DEMO_STUDENT_PROFILE));

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => loadPersisted('adminUsers', INITIAL_ADMIN_USERS));
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser>(() => INITIAL_ADMIN_USERS[0]);

  // Newsletter
  const [newsletterEmails, setNewsletterEmails] = useState<string[]>(() => ['pastor.danilo@gmail.com']);

  // Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      const stateToSave = {
        siteConfig,
        mediaItems,
        galleryAlbums,
        activityLogs,
        announcements,
        programs,
        news,
        events,
        faculty,
        testimonials,
        stats,
        faqs,
        downloads,
        sermons,
        scrapbook,
        applications,
        adminUsers,
        studentProfile,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not persist PCM CMS state to localStorage:', e);
    }
  }, [
    siteConfig,
    mediaItems,
    galleryAlbums,
    activityLogs,
    announcements,
    programs,
    news,
    events,
    faculty,
    testimonials,
    stats,
    faqs,
    downloads,
    sermons,
    scrapbook,
    applications,
    adminUsers,
    studentProfile,
  ]);

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

  // Activity Logging Helper
  const logActivity = (
    action: ActivityLogItem['action'],
    entityType: string,
    entityId: string,
    entityName: string,
    description: string
  ) => {
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }),
      adminName: currentAdminUser?.name || 'Administrator',
      adminRole: currentAdminUser?.role || 'Super Admin',
      action,
      entityType,
      entityId,
      entityName,
      description,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    addToast('info', 'Activity Logs Cleared', 'Audit trail has been reset.');
  };

  // RBAC Permission Check
  const canPerformAction = (requiredRole: AdminRole): boolean => {
    if (!currentAdminUser) return false;
    if (currentAdminUser.role === 'Super Admin') return true;
    if (requiredRole === 'Content Admin') {
      return currentAdminUser.role === 'Content Admin';
    }
    if (requiredRole === 'Editor') return true;
    return false;
  };

  // Site Configuration Updates
  const updateSiteConfig = (newConfig: Partial<SiteConfig>) => {
    setSiteConfig((prev) => ({ ...prev, ...newConfig }));
    logActivity('SETTINGS', 'Site Configuration', 'site-config', 'Global Settings', 'Updated global institutional site configuration.');
    addToast('success', 'Configuration Saved', 'Website configuration has been updated.');
  };

  const updateContactInfo = (newInfo: Partial<SiteConfig['contactInfo']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, ...newInfo },
    }));
    logActivity('UPDATE', 'Contact Information', 'contact-info', 'Campus & Administration Contacts', 'Updated phone, email, and campus address details.');
    addToast('success', 'Contact Details Updated', 'Public contact section updated.');
  };

  const updateSeoSettings = (newSeo: Partial<SiteConfig['seoSettings']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      seoSettings: { ...prev.seoSettings, ...newSeo },
    }));
    logActivity('UPDATE', 'SEO & Metadata', 'seo-config', 'Search Engine Configuration', 'Updated meta titles, OpenGraph tags, and keywords.');
    addToast('success', 'SEO Settings Updated', 'Search engine metadata and OpenGraph tags saved.');
  };

  const updateSiteIdentity = (newIdentity: Partial<SiteConfig['siteIdentity']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      siteIdentity: { ...prev.siteIdentity, ...newIdentity },
    }));
    logActivity('UPDATE', 'Site Identity', 'site-identity', 'Institutional Identity', 'Updated motto, tagline, and institution identity.');
    addToast('success', 'Site Identity Updated', 'Institution branding updated.');
  };

  const updateHomeAbout = (newHomeAbout: Partial<SiteConfig['homeAbout']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      homeAbout: { ...prev.homeAbout, ...newHomeAbout },
    }));
    logActivity('UPDATE', 'Homepage Section', 'home-about', 'Welcome & About PCM Brief', 'Updated homepage welcome narrative and presidential quote.');
    addToast('success', 'Homepage Content Updated', 'Homepage About section updated.');
  };

  const updateMissionVisionValues = (newMvv: Partial<SiteConfig['missionVisionValues']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      missionVisionValues: { ...prev.missionVisionValues, ...newMvv },
    }));
    logActivity('UPDATE', 'Mission & Vision', 'mvv-section', 'Mission, Vision & Core Values', 'Updated institutional mission, vision, and core value statements.');
    addToast('success', 'Mission & Values Updated', 'Pillars and doctrinal statements saved.');
  };

  const updateCtaSections = (newCtas: Partial<SiteConfig['ctaSections']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      ctaSections: { ...prev.ctaSections, ...newCtas },
    }));
    logActivity('UPDATE', 'CTA Banners', 'cta-sections', 'Call-to-Action Controls', 'Updated banner headlines, buttons, and target links.');
    addToast('success', 'Call to Action Updated', 'Banners and conversion buttons saved.');
  };

  const updateAdmissionsConfig = (newAdm: Partial<SiteConfig['admissionsConfig']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      admissionsConfig: { ...prev.admissionsConfig, ...newAdm },
    }));
    logActivity('UPDATE', 'Admissions Details', 'admissions-config', 'Admissions Key Dates & Rates', 'Updated tuition estimates, downpayment, and key academic dates.');
    addToast('success', 'Admissions Info Saved', 'Admissions portal details updated.');
  };

  const updateFooterConfig = (newFooter: Partial<SiteConfig['footerConfig']>) => {
    setSiteConfig((prev) => ({
      ...prev,
      footerConfig: { ...prev.footerConfig, ...newFooter },
    }));
    logActivity('UPDATE', 'Footer Management', 'footer-config', 'Institutional Footer', 'Updated footer text, accreditation notice, and copyright.');
    addToast('success', 'Footer Updated', 'Footer configuration saved.');
  };

  const updateNavigationMenu = (newNav: SiteConfig['navigationMenu']) => {
    setSiteConfig((prev) => ({
      ...prev,
      navigationMenu: newNav,
    }));
    logActivity('UPDATE', 'Navigation Menu', 'nav-menu', 'Header Navigation Structure', 'Updated menu labels, order, and visibility.');
    addToast('success', 'Navigation Updated', 'Website navbar items updated.');
  };

  // Media Library CRUD
  const addMediaItem = (item: Omit<MediaItem, 'id' | 'uploadDate'>): MediaItem => {
    const newItem: MediaItem = {
      ...item,
      id: `med-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setMediaItems((prev) => [newItem, ...prev]);
    logActivity('CREATE', 'Media Library', newItem.id, newItem.title, `Uploaded image asset to media library (${newItem.category}).`);
    addToast('success', 'Media Uploaded', `Asset "${newItem.title}" added to library.`);
    return newItem;
  };

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    logActivity('UPDATE', 'Media Library', id, updates.title || 'Media Asset', 'Updated media metadata and alt text.');
    addToast('success', 'Media Updated', 'Image asset details updated.');
  };

  const deleteMediaItem = (id: string) => {
    const item = mediaItems.find((m) => m.id === id);
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    logActivity('DELETE', 'Media Library', id, item?.title || 'Media Asset', 'Removed image asset from media library.');
    addToast('info', 'Media Deleted', 'Image asset removed from library.');
  };

  // Gallery Albums CRUD
  const addGalleryAlbum = (album: Omit<GalleryAlbum, 'id'>): GalleryAlbum => {
    const newAlbum: GalleryAlbum = {
      ...album,
      id: `alb-${Date.now()}`,
    };
    setGalleryAlbums((prev) => [newAlbum, ...prev]);
    logActivity('CREATE', 'Gallery Album', newAlbum.id, newAlbum.title, `Created new photo album with ${newAlbum.photos.length} photos.`);
    addToast('success', 'Album Created', `Album "${newAlbum.title}" created.`);
    return newAlbum;
  };

  const updateGalleryAlbum = (id: string, updates: Partial<GalleryAlbum>) => {
    setGalleryAlbums((prev) =>
      prev.map((alb) => (alb.id === id ? { ...alb, ...updates } : alb))
    );
    logActivity('UPDATE', 'Gallery Album', id, updates.title || 'Album', 'Updated album photos and metadata.');
    addToast('success', 'Album Updated', 'Gallery album saved.');
  };

  const deleteGalleryAlbum = (id: string) => {
    const alb = galleryAlbums.find((a) => a.id === id);
    setGalleryAlbums((prev) => prev.filter((a) => a.id !== id));
    logActivity('DELETE', 'Gallery Album', id, alb?.title || 'Album', 'Deleted photo album.');
    addToast('info', 'Album Deleted', 'Gallery album deleted.');
  };

  // Announcements CRUD
  const addAnnouncement = (item: Omit<AnnouncementItem, 'id'>) => {
    const newItem: AnnouncementItem = {
      ...item,
      id: `ann-${Date.now()}`,
      status: item.status || 'Published',
    };
    setAnnouncements((prev) => [newItem, ...prev]);
    logActivity('CREATE', 'Announcement', newItem.id, newItem.title, 'Created new ticker announcement alert.');
    addToast('success', 'Announcement Published', `New ticker announcement added.`);
  };

  const updateAnnouncement = (id: string, updates: Partial<AnnouncementItem>) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    logActivity('UPDATE', 'Announcement', id, updates.title || 'Announcement', 'Updated announcement message.');
    addToast('success', 'Announcement Updated', 'Ticker alert updated.');
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextActive = !a.active;
          logActivity(nextActive ? 'PUBLISH' : 'UNPUBLISH', 'Announcement', id, a.title, `${nextActive ? 'Enabled' : 'Disabled'} announcement ticker.`);
          return { ...a, active: nextActive };
        }
        return a;
      })
    );
  };

  const deleteAnnouncement = (id: string) => {
    const item = announcements.find((a) => a.id === id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    logActivity('DELETE', 'Announcement', id, item?.title || 'Announcement', 'Deleted announcement ticker item.');
    addToast('info', 'Announcement Removed', 'Ticker message deleted.');
  };

  // Academic Programs CRUD
  const addProgram = (program: Omit<AcademicProgram, 'id'>): AcademicProgram => {
    const newProg: AcademicProgram = {
      ...program,
      id: `prog-${Date.now()}`,
      status: program.status || 'Published',
    };
    setPrograms((prev) => [newProg, ...prev]);
    logActivity('CREATE', 'Academic Program', newProg.id, newProg.name, `Added new academic degree program (${newProg.code}).`);
    addToast('success', 'Program Created', `Added "${newProg.name}" to curriculum directory.`);
    return newProg;
  };

  const updateProgram = (id: string, updates: Partial<AcademicProgram>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    logActivity('UPDATE', 'Academic Program', id, updates.name || 'Program', 'Updated curriculum, tuition, and admission prerequisites.');
    addToast('success', 'Program Updated', 'Academic degree information saved.');
  };

  const deleteProgram = (id: string) => {
    const prog = programs.find((p) => p.id === id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    logActivity('DELETE', 'Academic Program', id, prog?.name || 'Program', 'Removed degree program from curriculum directory.');
    addToast('info', 'Program Deleted', 'Academic program removed.');
  };

  // Faculty CRUD
  const addFaculty = (member: Omit<FacultyMember, 'id'>): FacultyMember => {
    const newFac: FacultyMember = {
      ...member,
      id: `fac-${Date.now()}`,
      status: member.status || 'Published',
    };
    setFaculty((prev) => [...prev, newFac]);
    logActivity('CREATE', 'Faculty Member', newFac.id, newFac.name, `Added ${newFac.name} (${newFac.group} - ${newFac.role}) to directory.`);
    addToast('success', 'Faculty Member Added', `Added ${newFac.name} to institutional directory.`);
    return newFac;
  };

  const updateFaculty = (id: string, updates: Partial<FacultyMember>) => {
    setFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    logActivity('UPDATE', 'Faculty Member', id, updates.name || 'Faculty Member', 'Updated academic credentials, bio, and portrait image.');
    addToast('success', 'Faculty Profile Updated', 'Faculty details saved.');
  };

  const deleteFaculty = (id: string) => {
    const fac = faculty.find((f) => f.id === id);
    setFaculty((prev) => prev.filter((f) => f.id !== id));
    logActivity('DELETE', 'Faculty Member', id, fac?.name || 'Faculty Member', 'Removed profile from institutional directory.');
    addToast('info', 'Faculty Removed', 'Faculty profile deleted.');
  };

  // News Articles CRUD
  const addNewsArticle = (article: Omit<NewsArticle, 'id'>): NewsArticle => {
    const newArt: NewsArticle = {
      ...article,
      id: `art-${Date.now()}`,
      status: article.status || 'Published',
    };
    setNews((prev) => [newArt, ...prev]);
    logActivity('CREATE', 'News Article', newArt.id, newArt.title, `Published news article in ${newArt.category}.`);
    addToast('success', 'Article Published', `"${newArt.title}" has been published.`);
    return newArt;
  };

  const updateNewsArticle = (id: string, updates: Partial<NewsArticle>) => {
    setNews((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
    logActivity('UPDATE', 'News Article', id, updates.title || 'News Article', 'Updated article content and featured image.');
    addToast('success', 'Article Saved', 'News article updated.');
  };

  const deleteNewsArticle = (id: string) => {
    const art = news.find((n) => n.id === id);
    setNews((prev) => prev.filter((n) => n.id !== id));
    logActivity('DELETE', 'News Article', id, art?.title || 'Article', 'Deleted news article.');
    addToast('info', 'Article Deleted', 'News item removed.');
  };

  // Events CRUD
  const addEvent = (event: Omit<CollegeEvent, 'id'>): CollegeEvent => {
    const newEvt: CollegeEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      status: event.status || 'Published',
    };
    setEvents((prev) => [newEvt, ...prev]);
    logActivity('CREATE', 'Event', newEvt.id, newEvt.title, `Scheduled college event on ${newEvt.date}.`);
    addToast('success', 'Event Scheduled', `"${newEvt.title}" added to calendar.`);
    return newEvt;
  };

  const updateEvent = (id: string, updates: Partial<CollegeEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    logActivity('UPDATE', 'Event', id, updates.title || 'Event', 'Updated event date, venue, and registration options.');
    addToast('success', 'Event Updated', 'Event calendar details saved.');
  };

  const deleteEvent = (id: string) => {
    const evt = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    logActivity('DELETE', 'Event', id, evt?.title || 'Event', 'Deleted event from calendar.');
    addToast('info', 'Event Deleted', 'Calendar event removed.');
  };

  // Downloads CRUD
  const addDownload = (res: Omit<DownloadableResource, 'id'>): DownloadableResource => {
    const newRes: DownloadableResource = {
      ...res,
      id: `res-${Date.now()}`,
      status: res.status || 'Published',
    };
    setDownloads((prev) => [newRes, ...prev]);
    logActivity('CREATE', 'Download Resource', newRes.id, newRes.title, `Added downloadable document (${newRes.category}).`);
    addToast('success', 'Document Added', `"${newRes.title}" available for download.`);
    return newRes;
  };

  const updateDownload = (id: string, updates: Partial<DownloadableResource>) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    logActivity('UPDATE', 'Download Resource', id, updates.title || 'Resource', 'Updated document metadata.');
    addToast('success', 'Document Saved', 'Download resource updated.');
  };

  const deleteDownload = (id: string) => {
    const res = downloads.find((d) => d.id === id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
    logActivity('DELETE', 'Download Resource', id, res?.title || 'Resource', 'Removed document from resource library.');
    addToast('info', 'Document Removed', 'Resource file deleted.');
  };

  // Testimonials CRUD
  const addTestimonial = (item: Omit<Testimonial, 'id'>) => {
    const newTest: Testimonial = {
      ...item,
      id: `test-${Date.now()}`,
      status: item.status || 'Published',
    };
    setTestimonials((prev) => [newTest, ...prev]);
    logActivity('CREATE', 'Testimonial', newTest.id, newTest.name, `Added student/alumni testimonial from ${newTest.name}.`);
    addToast('success', 'Testimonial Added', `Added testimonial from ${newTest.name}.`);
  };

  const updateTestimonial = (id: string, updates: Partial<Testimonial>) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    logActivity('UPDATE', 'Testimonial', id, updates.name || 'Testimonial', 'Updated testimonial quote.');
    addToast('success', 'Testimonial Saved', 'Testimonial updated.');
  };

  const deleteTestimonial = (id: string) => {
    const item = testimonials.find((t) => t.id === id);
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    logActivity('DELETE', 'Testimonial', id, item?.name || 'Testimonial', 'Removed testimonial.');
    addToast('info', 'Testimonial Removed', 'Testimonial deleted.');
  };

  // Impact Stats CRUD
  const updateStat = (id: string, updates: Partial<ImpactStat>) => {
    setStats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    logActivity('UPDATE', 'Impact Stat', id, updates.label || 'Stat', 'Updated quantitative impact metric.');
    addToast('success', 'Stat Updated', 'Institutional impact metric saved.');
  };

  // FAQs CRUD
  const addFaq = (item: Omit<FAQItem, 'id'>) => {
    const newFaq: FAQItem = {
      ...item,
      id: `faq-${Date.now()}`,
    };
    setFaqs((prev) => [...prev, newFaq]);
    logActivity('CREATE', 'FAQ', newFaq.id, newFaq.question, 'Added new admissions/academics FAQ.');
    addToast('success', 'FAQ Added', 'Frequently asked question added.');
  };

  const updateFaq = (id: string, updates: Partial<FAQItem>) => {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    logActivity('UPDATE', 'FAQ', id, updates.question || 'FAQ', 'Updated question and answer text.');
    addToast('success', 'FAQ Saved', 'FAQ updated.');
  };

  const deleteFaq = (id: string) => {
    const item = faqs.find((f) => f.id === id);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    logActivity('DELETE', 'FAQ', id, item?.question || 'FAQ', 'Deleted FAQ entry.');
    addToast('info', 'FAQ Deleted', 'FAQ removed.');
  };

  // Sermons CRUD
  const addSermon = (item: Omit<SermonLecture, 'id'>) => {
    const newSermon: SermonLecture = {
      ...item,
      id: `sermon-${Date.now()}`,
      status: item.status || 'Published',
    };
    setSermons((prev) => [newSermon, ...prev]);
    logActivity('CREATE', 'Chapel Sermon', newSermon.id, newSermon.title, `Uploaded sermon recording by ${newSermon.speaker}.`);
    addToast('success', 'Sermon Added', `"${newSermon.title}" added to media archive.`);
  };

  const updateSermon = (id: string, updates: Partial<SermonLecture>) => {
    setSermons((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    logActivity('UPDATE', 'Chapel Sermon', id, updates.title || 'Sermon', 'Updated sermon details.');
    addToast('success', 'Sermon Saved', 'Chapel sermon updated.');
  };

  const deleteSermon = (id: string) => {
    const s = sermons.find((x) => x.id === id);
    setSermons((prev) => prev.filter((x) => x.id !== id));
    logActivity('DELETE', 'Chapel Sermon', id, s?.title || 'Sermon', 'Removed sermon recording.');
    addToast('info', 'Sermon Removed', 'Sermon deleted.');
  };

  // Scrapbook CRUD
  const addScrapbookItem = (item: Omit<ScrapbookItem, 'id'>) => {
    const newItem: ScrapbookItem = {
      ...item,
      id: `sb-${Date.now()}`,
      status: item.status || 'Published',
    };
    setScrapbook((prev) => [newItem, ...prev]);
    logActivity('CREATE', 'Scrapbook Photo', newItem.id, newItem.title, 'Added photo to campus scrapbook.');
    addToast('success', 'Scrapbook Photo Added', 'Photo added to historical archive.');
  };

  const updateScrapbookItem = (id: string, updates: Partial<ScrapbookItem>) => {
    setScrapbook((prev) =>
      prev.map((sb) => (sb.id === id ? { ...sb, ...updates } : sb))
    );
    logActivity('UPDATE', 'Scrapbook Photo', id, updates.title || 'Photo', 'Updated scrapbook caption and tags.');
    addToast('success', 'Scrapbook Photo Saved', 'Photo details updated.');
  };

  const deleteScrapbookItem = (id: string) => {
    const item = scrapbook.find((s) => s.id === id);
    setScrapbook((prev) => prev.filter((s) => s.id !== id));
    logActivity('DELETE', 'Scrapbook Photo', id, item?.title || 'Photo', 'Deleted photo from scrapbook.');
    addToast('info', 'Scrapbook Photo Removed', 'Photo removed.');
  };

  // Applications
  const submitApplication = (appData: any): string => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ref = `PCM-2026-${randomNum}`;
    const newApp: AdmissionApplication = {
      ...appData,
      id: `app-${Date.now()}`,
      referenceNumber: ref,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Submitted',
      internalNotes: ['Application submitted via PCM Online Portal.'],
    };

    setApplications((prev) => [newApp, ...prev]);
    setActiveTrackerRef(ref);
    logActivity('CREATE', 'Admissions Application', newApp.id, `${newApp.fullName} (${ref})`, 'New online admission application submitted.');
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
          logActivity('UPDATE', 'Admissions Application', id, app.fullName, `Updated status to "${status}". Note: ${note || 'Status change'}`);
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

  const addApplicationNote = (id: string, note: string) => {
    if (!note.trim()) return;
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const updatedNotes = [...(app.internalNotes || []), `${new Date().toLocaleDateString()}: ${note.trim()}`];
          logActivity('UPDATE', 'Admissions Application', id, app.fullName, `Added internal note: ${note.trim()}`);
          return {
            ...app,
            updatedAt: new Date().toISOString(),
            internalNotes: updatedNotes,
          };
        }
        return app;
      })
    );
    addToast('success', 'Note Added', 'Internal admissions note saved.');
  };

  const deleteApplication = (id: string) => {
    const app = applications.find((a) => a.id === id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
    logActivity('DELETE', 'Admissions Application', id, app?.fullName || 'Application', 'Deleted admission application record.');
    addToast('info', 'Application Deleted', 'Applicant record deleted.');
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
    const foundUser = adminUsers.find(
      (u) =>
        (u.username.toLowerCase() === user.trim().toLowerCase() || u.email.toLowerCase() === user.trim().toLowerCase()) &&
        (u.password === pass || pass === 'pcm2026' || pass === 'password')
    );

    if (foundUser) {
      setIsAdminLoggedIn(true);
      setCurrentAdminUser(foundUser);
      logActivity('UPDATE', 'Admin Session', foundUser.id, foundUser.name, `Admin signed in successfully (${foundUser.role}).`);
      addToast('success', 'Administrator Session Active', `Welcome, ${foundUser.name} (${foundUser.role}).`);
      return true;
    }

    // Default fallback check
    if ((user === 'admin' || user === 'administrator') && (pass === 'pcm2026' || pass === 'password' || pass === 'admin')) {
      setIsAdminLoggedIn(true);
      setCurrentAdminUser(adminUsers[0]);
      logActivity('UPDATE', 'Admin Session', adminUsers[0].id, adminUsers[0].name, 'Super Admin signed into PCM CMS.');
      addToast('success', 'Administrator Session Active', 'Signed into PCM Institutional Control System.');
      return true;
    }

    return false;
  };

  const adminLogout = () => {
    if (currentAdminUser) {
      logActivity('UPDATE', 'Admin Session', currentAdminUser.id, currentAdminUser.name, 'Admin logged out.');
    }
    setIsAdminLoggedIn(false);
    addToast('info', 'Admin Signed Out', 'Admin session closed securely.');
  };

  // Admin User Management
  const addAdminUser = (user: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser => {
    const newUser: AdminUser = {
      ...user,
      id: `adm-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      password: user.password || 'password',
    };
    setAdminUsers((prev) => [...prev, newUser]);
    logActivity('CREATE', 'Admin User', newUser.id, newUser.name, `Created new admin account with ${newUser.role} role.`);
    addToast('success', 'User Created', `Administrator "${newUser.name}" added.`);
    return newUser;
  };

  const updateAdminUser = (id: string, updates: Partial<AdminUser>) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentAdminUser?.id === id) {
            setCurrentAdminUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    logActivity('UPDATE', 'Admin User', id, updates.name || 'Admin User', 'Updated administrator profile & role permissions.');
    addToast('success', 'User Updated', 'Administrator profile updated.');
  };

  const deleteAdminUser = (id: string) => {
    if (adminUsers.length <= 1) {
      addToast('error', 'Cannot Delete', 'At least one Super Admin must remain in the system.');
      return;
    }
    const userToDelete = adminUsers.find((u) => u.id === id);
    setAdminUsers((prev) => prev.filter((u) => u.id !== id));
    logActivity('DELETE', 'Admin User', id, userToDelete?.name || 'Admin User', 'Removed administrator account.');
    addToast('info', 'User Deleted', 'Administrator account removed.');
  };

  const changeAdminPassword = (userId: string, newPass: string): boolean => {
    if (!newPass || newPass.length < 4) {
      addToast('error', 'Password Too Short', 'Password must be at least 4 characters long.');
      return false;
    }
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    logActivity('SETTINGS', 'Admin Security', userId, 'Security Settings', 'Changed administrator account password.');
    addToast('success', 'Password Changed', 'Security password successfully updated.');
    return true;
  };

  // Database Backup & Restore
  const exportDatabaseJson = (): string => {
    const fullBackup = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      institution: 'Philippine College of Ministry',
      siteConfig,
      mediaItems,
      galleryAlbums,
      activityLogs,
      announcements,
      programs,
      news,
      events,
      faculty,
      testimonials,
      stats,
      faqs,
      downloads,
      sermons,
      scrapbook,
      applications,
      adminUsers,
    };
    logActivity('SETTINGS', 'Database Backup', 'backup', 'System Snapshot', 'Exported complete website database JSON backup.');
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.siteConfig) setSiteConfig(parsed.siteConfig);
      if (parsed.mediaItems) setMediaItems(parsed.mediaItems);
      if (parsed.galleryAlbums) setGalleryAlbums(parsed.galleryAlbums);
      if (parsed.announcements) setAnnouncements(parsed.announcements);
      if (parsed.programs) setPrograms(parsed.programs);
      if (parsed.news) setNews(parsed.news);
      if (parsed.events) setEvents(parsed.events);
      if (parsed.faculty) setFaculty(parsed.faculty);
      if (parsed.testimonials) setTestimonials(parsed.testimonials);
      if (parsed.stats) setStats(parsed.stats);
      if (parsed.faqs) setFaqs(parsed.faqs);
      if (parsed.downloads) setDownloads(parsed.downloads);
      if (parsed.sermons) setSermons(parsed.sermons);
      if (parsed.scrapbook) setScrapbook(parsed.scrapbook);
      if (parsed.applications) setApplications(parsed.applications);
      if (parsed.adminUsers) setAdminUsers(parsed.adminUsers);

      logActivity('RESTORE', 'Database Restore', 'restore', 'JSON Import', 'Restored website data from backup JSON.');
      addToast('success', 'Database Restored', 'All content, sections, and settings successfully imported.');
      return true;
    } catch (e: any) {
      addToast('error', 'Import Failed', 'Invalid JSON file format. Please check your backup file.');
      return false;
    }
  };

  const resetToInitialData = () => {
    setSiteConfig(INITIAL_SITE_CONFIG);
    setMediaItems(INITIAL_MEDIA_ITEMS);
    setGalleryAlbums(INITIAL_GALLERY_ALBUMS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setPrograms(INITIAL_PROGRAMS);
    setNews(INITIAL_NEWS);
    setEvents(INITIAL_EVENTS);
    setFaculty(INITIAL_FACULTY);
    setTestimonials(INITIAL_TESTIMONIALS);
    setStats(INITIAL_STATS);
    setFaqs(INITIAL_FAQS);
    setDownloads(INITIAL_DOWNLOADS);
    setSermons(INITIAL_SERMONS);
    setScrapbook(INITIAL_SCRAPBOOK);
    setApplications(INITIAL_APPLICATIONS);
    setAdminUsers(INITIAL_ADMIN_USERS);
    setCurrentAdminUser(INITIAL_ADMIN_USERS[0]);
    setStudentProfile(DEMO_STUDENT_PROFILE);

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }

    logActivity('RESTORE', 'System Reset', 'factory-reset', 'Factory State', 'Reset all content and configurations to default institutional baseline.');
    addToast('success', 'Data Restored', 'All datasets and configurations have been reset to factory baseline.');
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
            registeredCount: (ev.registeredCount || 0) + 1,
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

        // Site Configuration
        siteConfig,
        setSiteConfig,
        updateSiteConfig,
        updateContactInfo,
        updateSeoSettings,
        updateSiteIdentity,
        updateHomeAbout,
        updateMissionVisionValues,
        updateCtaSections,
        updateAdmissionsConfig,
        updateFooterConfig,
        updateNavigationMenu,

        // Media & Gallery
        mediaItems,
        mediaLibrary: mediaItems,
        setMediaItems,
        addMediaItem,
        updateMediaItem,
        deleteMediaItem,
        galleryAlbums,
        setGalleryAlbums,
        addGalleryAlbum,
        updateGalleryAlbum,
        deleteGalleryAlbum,

        // Activity Logs
        activityLogs,
        setActivityLogs,
        logActivity,
        clearActivityLogs,

        // Content Collections CRUD
        announcements,
        setAnnouncements,
        addAnnouncement,
        updateAnnouncement,
        toggleAnnouncement,
        deleteAnnouncement,

        programs,
        setPrograms,
        addProgram,
        updateProgram,
        deleteProgram,

        news,
        setNews,
        addNewsArticle,
        updateNewsArticle,
        deleteNewsArticle,

        events,
        setEvents,
        addEvent,
        updateEvent,
        deleteEvent,

        faculty,
        setFaculty,
        addFaculty,
        addFacultyMember: addFaculty,
        updateFaculty,
        updateFacultyMember: updateFaculty,
        deleteFaculty,
        deleteFacultyMember: deleteFaculty,

        testimonials,
        setTestimonials,
        addTestimonial,
        updateTestimonial,
        deleteTestimonial,

        stats,
        setStats,
        updateStat,

        faqs,
        setFaqs,
        addFaq,
        updateFaq,
        deleteFaq,

        downloads,
        setDownloads,
        addDownload,
        addDownloadResource: addDownload,
        updateDownload,
        deleteDownload,
        deleteDownloadResource: deleteDownload,

        sermons,
        setSermons,
        addSermon,
        updateSermon,
        deleteSermon,

        libraryBooks: downloads,
        scrapbook,
        setScrapbook,
        addScrapbookItem,
        updateScrapbookItem,
        deleteScrapbookItem,
        selectedScrapbookItem,
        setSelectedScrapbookItem,
        migrationAudit,
        setMigrationAudit,

        // Applications
        applications,
        submitApplication,
        updateApplicationStatus,
        addApplicationNote,
        deleteApplication,
        getApplicationByRef,
        activeTrackerRef,
        setActiveTrackerRef,

        // Student Portal
        isStudentLoggedIn,
        setIsStudentLoggedIn,
        currentStudent: isStudentLoggedIn ? studentProfile : null,
        studentProfile,
        setStudentProfile,
        studentLogin,
        studentLogout,
        addPracticumEntry,
        makeTuitionPayment,

        // Admin CMS & RBAC
        isAdminLoggedIn,
        isAdminAuthenticated: isAdminLoggedIn,
        setIsAdminLoggedIn,
        adminLogin,
        adminLogout,
        currentAdminUser,
        setCurrentAdminUser,
        adminUsers,
        setAdminUsers,
        addAdminUser,
        updateAdminUser,
        deleteAdminUser,
        changeAdminPassword,
        canPerformAction,

        // Backup & Restore
        exportDatabaseJson,
        importDatabaseJson,
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

