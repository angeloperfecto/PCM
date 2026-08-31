'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  uploadFileToFirebaseStorage,
} from './firebase';

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

  // Cloud Database & Firebase Sync State
  isFirebaseConnected: boolean;
  firebaseSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: Date | null;
  syncAllDataToFirestore: (force?: boolean) => Promise<boolean>;
  uploadMediaFile: (file: File | Blob, category?: string, title?: string) => Promise<string>;

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
  submitApplication: (appData: any) => Promise<string> | string;
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
  registerForEvent: (eventId: string, attendeeName: string, email: string) => Promise<boolean> | boolean;
  newsletterEmails: string[];
  subscribeNewsletter: (email: string) => Promise<boolean> | boolean;

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

const LOCAL_STORAGE_KEY = 'pcm_cms_database_v5';

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
  const initialSeededRef = useRef(false);

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

  // Cloud Database Sync States
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Core CMS Data States (initialized identically on SSR and client to prevent hydration mismatch)
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(INITIAL_MEDIA_ITEMS);
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>(INITIAL_GALLERY_ALBUMS);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);
  const [programs, setPrograms] = useState<AcademicProgram[]>(INITIAL_PROGRAMS);
  const [news, setNews] = useState<NewsArticle[]>(INITIAL_NEWS);
  const [events, setEvents] = useState<CollegeEvent[]>(INITIAL_EVENTS);
  const [faculty, setFaculty] = useState<FacultyMember[]>(INITIAL_FACULTY);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [stats, setStats] = useState<ImpactStat[]>(INITIAL_STATS);
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [downloads, setDownloads] = useState<DownloadableResource[]>(INITIAL_DOWNLOADS);
  const [sermons, setSermons] = useState<SermonLecture[]>(INITIAL_SERMONS);
  const [scrapbook, setScrapbook] = useState<ScrapbookItem[]>(INITIAL_SCRAPBOOK);
  const [selectedScrapbookItem, setSelectedScrapbookItem] = useState<ScrapbookItem | null>(null);
  const [migrationAudit, setMigrationAudit] = useState<MigrationAuditItem[]>(INITIAL_MIGRATION_AUDIT);

  // Applications
  const [applications, setApplications] = useState<AdmissionApplication[]>(INITIAL_APPLICATIONS);
  const [activeTrackerRef, setActiveTrackerRef] = useState<string>('');

  // Student Portal
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(DEMO_STUDENT_PROFILE);

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_ADMIN_USERS);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser>(INITIAL_ADMIN_USERS[0]);

  // Newsletter
  const [newsletterEmails, setNewsletterEmails] = useState<string[]>(['pastor.danilo@gmail.com']);

  // Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback(
    (
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
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (section: NavSection, subSection: string | null = null) => {
    setCurrentSection(section);
    setActiveSubSection(subSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Activity Logging Helper
  const logActivity = useCallback(
    (
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

      // Save to Firestore asynchronously
      try {
        setDoc(doc(db, 'activityLogs', newLog.id), newLog, { merge: true }).catch((err) =>
          console.warn('Firestore log activity error:', err)
        );
      } catch (e) {
        console.warn(e);
      }
    },
    [currentAdminUser]
  );

  const clearActivityLogs = async () => {
    setActivityLogs([]);
    try {
      const snap = await getDocs(collection(db, 'activityLogs'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Clear activity logs cloud error:', e);
    }
    addToast('info', 'Activity Logs Cleared', 'Audit trail has been reset.');
  };

  // Save to localStorage on state changes as a backup/cache layer
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

  // Keep a ref to the latest state so async batch sync doesn't cause re-subscription loops
  const stateRef = useRef({
    siteConfig,
    programs,
    faculty,
    announcements,
    news,
    events,
    downloads,
    testimonials,
    stats,
    faqs,
    sermons,
    scrapbook,
    mediaItems,
    galleryAlbums,
    adminUsers,
    studentProfile,
  });

  useEffect(() => {
    stateRef.current = {
      siteConfig,
      programs,
      faculty,
      announcements,
      news,
      events,
      downloads,
      testimonials,
      stats,
      faqs,
      sermons,
      scrapbook,
      mediaItems,
      galleryAlbums,
      adminUsers,
      studentProfile,
    };
  }, [
    siteConfig,
    programs,
    faculty,
    announcements,
    news,
    events,
    downloads,
    testimonials,
    stats,
    faqs,
    sermons,
    scrapbook,
    mediaItems,
    galleryAlbums,
    adminUsers,
    studentProfile,
  ]);

  // Client-side initial cache loader (guarantees perfect SSR hydration without mismatch)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.siteConfig) setSiteConfig(parsed.siteConfig);
          if (parsed.programs && Array.isArray(parsed.programs)) setPrograms(parsed.programs);
          if (parsed.faculty && Array.isArray(parsed.faculty)) setFaculty(parsed.faculty);
          if (parsed.announcements && Array.isArray(parsed.announcements)) setAnnouncements(parsed.announcements);
          if (parsed.news && Array.isArray(parsed.news)) setNews(parsed.news);
          if (parsed.events && Array.isArray(parsed.events)) setEvents(parsed.events);
          if (parsed.downloads && Array.isArray(parsed.downloads)) setDownloads(parsed.downloads);
          if (parsed.testimonials && Array.isArray(parsed.testimonials)) setTestimonials(parsed.testimonials);
          if (parsed.stats && Array.isArray(parsed.stats)) setStats(parsed.stats);
          if (parsed.faqs && Array.isArray(parsed.faqs)) setFaqs(parsed.faqs);
          if (parsed.sermons && Array.isArray(parsed.sermons)) setSermons(parsed.sermons);
          if (parsed.scrapbook && Array.isArray(parsed.scrapbook)) setScrapbook(parsed.scrapbook);
          if (parsed.mediaItems && Array.isArray(parsed.mediaItems)) setMediaItems(parsed.mediaItems);
          if (parsed.galleryAlbums && Array.isArray(parsed.galleryAlbums)) setGalleryAlbums(parsed.galleryAlbums);
          if (parsed.applications && Array.isArray(parsed.applications)) setApplications(parsed.applications);
          if (parsed.adminUsers && Array.isArray(parsed.adminUsers)) setAdminUsers(parsed.adminUsers);
          if (parsed.studentProfile) setStudentProfile(parsed.studentProfile);
        }
      } catch (e) {
        console.warn('Local storage cache hydration notice:', e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

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

  // Sync entire dataset to Firestore in batches
  const syncAllDataToFirestore = useCallback(
    async (force: boolean = false): Promise<boolean> => {
      try {
        setFirebaseSyncStatus('syncing');
        const st = stateRef.current;

        // 1. Site Config
        await setDoc(doc(db, 'siteConfig', 'global'), st.siteConfig, { merge: true });

        // 2. Programs batch
        const progBatch = writeBatch(db);
        st.programs.forEach((p) => progBatch.set(doc(db, 'programs', p.id), p, { merge: true }));
        await progBatch.commit();

        // 3. Faculty batch
        const facBatch = writeBatch(db);
        st.faculty.forEach((f) => facBatch.set(doc(db, 'faculty', f.id), f, { merge: true }));
        await facBatch.commit();

        // 4. Announcements batch
        const annBatch = writeBatch(db);
        st.announcements.forEach((a) => annBatch.set(doc(db, 'announcements', a.id), a, { merge: true }));
        await annBatch.commit();

        // 5. News batch
        const newsBatch = writeBatch(db);
        st.news.forEach((n) => newsBatch.set(doc(db, 'news', n.id), n, { merge: true }));
        await newsBatch.commit();

        // 6. Events batch
        const evtBatch = writeBatch(db);
        st.events.forEach((e) => evtBatch.set(doc(db, 'events', e.id), e, { merge: true }));
        await evtBatch.commit();

        // 7. Downloads batch
        const dlBatch = writeBatch(db);
        st.downloads.forEach((d) => dlBatch.set(doc(db, 'downloads', d.id), d, { merge: true }));
        await dlBatch.commit();

        // 8. Testimonials batch
        const testBatch = writeBatch(db);
        st.testimonials.forEach((t) => testBatch.set(doc(db, 'testimonials', t.id), t, { merge: true }));
        await testBatch.commit();

        // 9. Stats batch
        const statBatch = writeBatch(db);
        st.stats.forEach((s) => statBatch.set(doc(db, 'stats', s.id), s, { merge: true }));
        await statBatch.commit();

        // 10. FAQs batch
        const faqBatch = writeBatch(db);
        st.faqs.forEach((f) => faqBatch.set(doc(db, 'faqs', f.id), f, { merge: true }));
        await faqBatch.commit();

        // 11. Sermons batch
        const sermonBatch = writeBatch(db);
        st.sermons.forEach((s) => sermonBatch.set(doc(db, 'sermons', s.id), s, { merge: true }));
        await sermonBatch.commit();

        // 12. Scrapbook batch
        const sbBatch = writeBatch(db);
        st.scrapbook.forEach((sb) => sbBatch.set(doc(db, 'scrapbook', sb.id), sb, { merge: true }));
        await sbBatch.commit();

        // 13. Media items batch
        const mediaBatch = writeBatch(db);
        st.mediaItems.forEach((m) => mediaBatch.set(doc(db, 'mediaItems', m.id), m, { merge: true }));
        await mediaBatch.commit();

        // 14. Gallery albums batch
        const galBatch = writeBatch(db);
        st.galleryAlbums.forEach((g) => galBatch.set(doc(db, 'galleryAlbums', g.id), g, { merge: true }));
        await galBatch.commit();

        // 15. Admin users batch
        const admBatch = writeBatch(db);
        st.adminUsers.forEach((u) => admBatch.set(doc(db, 'adminUsers', u.id), u, { merge: true }));
        await admBatch.commit();

        // 16. Student Profile
        await setDoc(doc(db, 'studentProfiles', st.studentProfile.id), st.studentProfile, { merge: true });

        setIsFirebaseConnected(true);
        setFirebaseSyncStatus('synced');
        setLastSyncedAt(new Date());

        if (force) {
          addToast('success', 'Firebase Synced', 'All website collections are now synchronized with Cloud Firestore.');
        }
        return true;
      } catch (err: any) {
        console.error('Firebase sync error:', err);
        setFirebaseSyncStatus('error');
        if (force) {
          addToast('error', 'Sync Failed', 'Failed to synchronize with Firebase Firestore.');
        }
        return false;
      }
    },
    [addToast]
  );

  // Real-time Firestore Subscriptions & Initial Auto-Seed (mounts once)
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initializeFirestoreSync = async () => {
      try {
        setFirebaseSyncStatus('syncing');

        // Check if database already has initial content
        try {
          const configDocSnap = await getDoc(doc(db, 'siteConfig', 'global'));
          const programsSnap = await getDocs(collection(db, 'programs'));

          if (!configDocSnap.exists() && programsSnap.empty && !initialSeededRef.current) {
            initialSeededRef.current = true;
            console.info('Firestore database is empty. Auto-seeding initial PCM institutional baseline...');
            await syncAllDataToFirestore(false);
          }
        } catch (seedErr) {
          console.warn('Initial seed check notice:', seedErr);
        }

        // Set up real-time onSnapshot listeners
        // 1. Site Config
        const uConfig = onSnapshot(
          doc(db, 'siteConfig', 'global'),
          (snap) => {
            if (snap.exists()) {
              setSiteConfig(snap.data() as SiteConfig);
              setFirebaseSyncStatus('synced');
              setLastSyncedAt(new Date());
            }
          },
          (err) => console.warn('siteConfig snapshot error:', err)
        );
        unsubs.push(uConfig);

        // 2. Programs
        const uPrograms = onSnapshot(
          collection(db, 'programs'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AcademicProgram[];
              setPrograms(list);
            }
          },
          (err) => console.warn('programs snapshot error:', err)
        );
        unsubs.push(uPrograms);

        // 3. Faculty
        const uFaculty = onSnapshot(
          collection(db, 'faculty'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FacultyMember[];
              setFaculty(list);
            }
          },
          (err) => console.warn('faculty snapshot error:', err)
        );
        unsubs.push(uFaculty);

        // 4. Announcements
        const uAnnouncements = onSnapshot(
          collection(db, 'announcements'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AnnouncementItem[];
              setAnnouncements(list);
            }
          },
          (err) => console.warn('announcements snapshot error:', err)
        );
        unsubs.push(uAnnouncements);

        // 5. News
        const uNews = onSnapshot(
          collection(db, 'news'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NewsArticle[];
              setNews(list);
            }
          },
          (err) => console.warn('news snapshot error:', err)
        );
        unsubs.push(uNews);

        // 6. Events
        const uEvents = onSnapshot(
          collection(db, 'events'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CollegeEvent[];
              setEvents(list);
            }
          },
          (err) => console.warn('events snapshot error:', err)
        );
        unsubs.push(uEvents);

        // 7. Downloads
        const uDownloads = onSnapshot(
          collection(db, 'downloads'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DownloadableResource[];
              setDownloads(list);
            }
          },
          (err) => console.warn('downloads snapshot error:', err)
        );
        unsubs.push(uDownloads);

        // 8. Testimonials
        const uTestimonials = onSnapshot(
          collection(db, 'testimonials'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Testimonial[];
              setTestimonials(list);
            }
          },
          (err) => console.warn('testimonials snapshot error:', err)
        );
        unsubs.push(uTestimonials);

        // 9. Stats
        const uStats = onSnapshot(
          collection(db, 'stats'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ImpactStat[];
              setStats(list);
            }
          },
          (err) => console.warn('stats snapshot error:', err)
        );
        unsubs.push(uStats);

        // 10. FAQs
        const uFaqs = onSnapshot(
          collection(db, 'faqs'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FAQItem[];
              setFaqs(list);
            }
          },
          (err) => console.warn('faqs snapshot error:', err)
        );
        unsubs.push(uFaqs);

        // 11. Sermons
        const uSermons = onSnapshot(
          collection(db, 'sermons'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SermonLecture[];
              setSermons(list);
            }
          },
          (err) => console.warn('sermons snapshot error:', err)
        );
        unsubs.push(uSermons);

        // 12. Scrapbook
        const uScrapbook = onSnapshot(
          collection(db, 'scrapbook'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ScrapbookItem[];
              setScrapbook(list);
            }
          },
          (err) => console.warn('scrapbook snapshot error:', err)
        );
        unsubs.push(uScrapbook);

        // 13. Media Items
        const uMedia = onSnapshot(
          collection(db, 'mediaItems'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MediaItem[];
              setMediaItems(list);
            }
          },
          (err) => console.warn('mediaItems snapshot error:', err)
        );
        unsubs.push(uMedia);

        // 14. Gallery Albums
        const uAlbums = onSnapshot(
          collection(db, 'galleryAlbums'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as GalleryAlbum[];
              setGalleryAlbums(list);
            }
          },
          (err) => console.warn('galleryAlbums snapshot error:', err)
        );
        unsubs.push(uAlbums);

        // 15. Applications
        const uApps = onSnapshot(
          collection(db, 'applications'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AdmissionApplication[];
              setApplications(list);
            }
          },
          (err) => console.warn('applications snapshot error:', err)
        );
        unsubs.push(uApps);

        // 16. Admin Users
        const uAdmins = onSnapshot(
          collection(db, 'adminUsers'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AdminUser[];
              setAdminUsers(list);
            }
          },
          (err) => console.warn('adminUsers snapshot error:', err)
        );
        unsubs.push(uAdmins);

        // 17. Activity Logs
        const uLogs = onSnapshot(
          collection(db, 'activityLogs'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ActivityLogItem[];
              setActivityLogs(list);
            }
          },
          (err) => console.warn('activityLogs snapshot error:', err)
        );
        unsubs.push(uLogs);

        setIsFirebaseConnected(true);
        setFirebaseSyncStatus('synced');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Firebase Real-Time Init failed:', err);
        setIsFirebaseConnected(false);
        setFirebaseSyncStatus('error');
      }
    };

    initializeFirestoreSync();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [syncAllDataToFirestore]);

  // Upload media file to Firebase Storage & register in Media Library
  const uploadMediaFile = async (
    file: File | Blob,
    category: string = 'General',
    title?: string
  ): Promise<string> => {
    const fileName = (file as File).name || `pcm_media_${Date.now()}`;
    const cleanTitle = title || fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const path = `pcm_assets/${category.toLowerCase()}/${Date.now()}_${fileName}`;

    try {
      // 1. Upload to Firebase Storage
      let downloadUrl = '';
      try {
        downloadUrl = await uploadFileToFirebaseStorage(file, path);
      } catch (storageError) {
        console.warn('Direct Storage upload failed, converting to object data URL:', storageError);
        downloadUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      // 2. Add to Media Items collection
      const newMedia: MediaItem = {
        id: `med-${Date.now()}`,
        title: cleanTitle,
        altText: `PCM ${cleanTitle}`,
        url: downloadUrl,
        category,
        fileSize: file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Custom Asset',
        uploadDate: new Date().toISOString().split('T')[0],
      };

      setMediaItems((prev) => [newMedia, ...prev]);
      await setDoc(doc(db, 'mediaItems', newMedia.id), newMedia, { merge: true });
      logActivity('CREATE', 'Media Asset', newMedia.id, newMedia.title, `Uploaded media asset to ${category}.`);

      return downloadUrl;
    } catch (e: any) {
      console.error('Failed to upload media file:', e);
      throw e;
    }
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
  const updateSiteConfig = async (newConfig: Partial<SiteConfig>) => {
    const updated = { ...siteConfig, ...newConfig };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('SETTINGS', 'Site Configuration', 'site-config', 'Global Settings', 'Updated global institutional site configuration.');
    addToast('success', 'Configuration Saved', 'Website configuration has been updated and synchronized.');
  };

  const updateContactInfo = async (newInfo: Partial<SiteConfig['contactInfo']>) => {
    const updated = {
      ...siteConfig,
      contactInfo: { ...siteConfig.contactInfo, ...newInfo },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Contact Information', 'contact-info', 'Campus & Administration Contacts', 'Updated phone, email, and campus address details.');
    addToast('success', 'Contact Details Updated', 'Public contact section synchronized with cloud.');
  };

  const updateSeoSettings = async (newSeo: Partial<SiteConfig['seoSettings']>) => {
    const updated = {
      ...siteConfig,
      seoSettings: { ...siteConfig.seoSettings, ...newSeo },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'SEO & Metadata', 'seo-config', 'Search Engine Configuration', 'Updated meta titles, OpenGraph tags, and keywords.');
    addToast('success', 'SEO Settings Updated', 'Search engine metadata saved to cloud.');
  };

  const updateSiteIdentity = async (newIdentity: Partial<SiteConfig['siteIdentity']>) => {
    const updated = {
      ...siteConfig,
      siteIdentity: { ...siteConfig.siteIdentity, ...newIdentity },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Site Identity', 'site-identity', 'Institutional Identity', 'Updated motto, tagline, and institution identity.');
    addToast('success', 'Site Identity Updated', 'Institution branding updated.');
  };

  const updateHomeAbout = async (newHomeAbout: Partial<SiteConfig['homeAbout']>) => {
    const updated = {
      ...siteConfig,
      homeAbout: { ...siteConfig.homeAbout, ...newHomeAbout },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Homepage Section', 'home-about', 'Welcome & About PCM Brief', 'Updated homepage welcome narrative and presidential quote.');
    addToast('success', 'Homepage Content Updated', 'Homepage About section updated.');
  };

  const updateMissionVisionValues = async (newMvv: Partial<SiteConfig['missionVisionValues']>) => {
    const updated = {
      ...siteConfig,
      missionVisionValues: { ...siteConfig.missionVisionValues, ...newMvv },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Mission & Vision', 'mvv-section', 'Mission, Vision & Core Values', 'Updated institutional mission, vision, and core value statements.');
    addToast('success', 'Mission & Values Updated', 'Pillars and doctrinal statements saved.');
  };

  const updateCtaSections = async (newCtas: Partial<SiteConfig['ctaSections']>) => {
    const updated = {
      ...siteConfig,
      ctaSections: { ...siteConfig.ctaSections, ...newCtas },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'CTA Banners', 'cta-sections', 'Call-to-Action Controls', 'Updated banner headlines, buttons, and target links.');
    addToast('success', 'Call to Action Updated', 'Banners and conversion buttons saved.');
  };

  const updateAdmissionsConfig = async (newAdm: Partial<SiteConfig['admissionsConfig']>) => {
    const updated = {
      ...siteConfig,
      admissionsConfig: { ...siteConfig.admissionsConfig, ...newAdm },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Admissions Details', 'admissions-config', 'Admissions Key Dates & Rates', 'Updated tuition estimates, downpayment, and key academic dates.');
    addToast('success', 'Admissions Info Saved', 'Admissions portal details updated.');
  };

  const updateFooterConfig = async (newFooter: Partial<SiteConfig['footerConfig']>) => {
    const updated = {
      ...siteConfig,
      footerConfig: { ...siteConfig.footerConfig, ...newFooter },
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Footer Management', 'footer-config', 'Institutional Footer', 'Updated footer text, accreditation notice, and copyright.');
    addToast('success', 'Footer Updated', 'Footer configuration saved.');
  };

  const updateNavigationMenu = async (newNav: SiteConfig['navigationMenu']) => {
    const updated = {
      ...siteConfig,
      navigationMenu: newNav,
    };
    setSiteConfig(updated);
    try {
      await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
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
    setDoc(doc(db, 'mediaItems', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Media Library', newItem.id, newItem.title, `Uploaded image asset to media library (${newItem.category}).`);
    addToast('success', 'Media Uploaded', `Asset "${newItem.title}" added to library.`);
    return newItem;
  };

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    updateDoc(doc(db, 'mediaItems', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Media Library', id, updates.title || 'Media Asset', 'Updated media metadata and alt text.');
    addToast('success', 'Media Updated', 'Image asset details updated.');
  };

  const deleteMediaItem = (id: string) => {
    const item = mediaItems.find((m) => m.id === id);
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    deleteDoc(doc(db, 'mediaItems', id)).catch((e) => console.warn(e));
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
    setDoc(doc(db, 'galleryAlbums', newAlbum.id), newAlbum, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Gallery Album', newAlbum.id, newAlbum.title, `Created new photo album with ${newAlbum.photos.length} photos.`);
    addToast('success', 'Album Created', `Album "${newAlbum.title}" created.`);
    return newAlbum;
  };

  const updateGalleryAlbum = (id: string, updates: Partial<GalleryAlbum>) => {
    setGalleryAlbums((prev) =>
      prev.map((alb) => (alb.id === id ? { ...alb, ...updates } : alb))
    );
    updateDoc(doc(db, 'galleryAlbums', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Gallery Album', id, updates.title || 'Album', 'Updated album photos and metadata.');
    addToast('success', 'Album Updated', 'Gallery album saved.');
  };

  const deleteGalleryAlbum = (id: string) => {
    const alb = galleryAlbums.find((a) => a.id === id);
    setGalleryAlbums((prev) => prev.filter((a) => a.id !== id));
    deleteDoc(doc(db, 'galleryAlbums', id)).catch((e) => console.warn(e));
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
    setDoc(doc(db, 'announcements', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Announcement', newItem.id, newItem.title, 'Created new ticker announcement alert.');
    addToast('success', 'Announcement Published', `New ticker announcement added.`);
  };

  const updateAnnouncement = (id: string, updates: Partial<AnnouncementItem>) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    updateDoc(doc(db, 'announcements', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Announcement', id, updates.title || 'Announcement', 'Updated announcement message.');
    addToast('success', 'Announcement Updated', 'Ticker alert updated.');
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextActive = !a.active;
          updateDoc(doc(db, 'announcements', id), { active: nextActive }).catch((e) => console.warn(e));
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
    deleteDoc(doc(db, 'announcements', id)).catch((e) => console.warn(e));
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
    setDoc(doc(db, 'programs', newProg.id), newProg, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Academic Program', newProg.id, newProg.name, `Added new academic degree program (${newProg.code}).`);
    addToast('success', 'Program Created', `Added "${newProg.name}" to curriculum directory.`);
    return newProg;
  };

  const updateProgram = (id: string, updates: Partial<AcademicProgram>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    updateDoc(doc(db, 'programs', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Academic Program', id, updates.name || 'Program', 'Updated curriculum, tuition, and admission prerequisites.');
    addToast('success', 'Program Updated', 'Academic degree information saved.');
  };

  const deleteProgram = (id: string) => {
    const prog = programs.find((p) => p.id === id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    deleteDoc(doc(db, 'programs', id)).catch((e) => console.warn(e));
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
    setDoc(doc(db, 'faculty', newFac.id), newFac, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Faculty Member', newFac.id, newFac.name, `Added ${newFac.name} (${newFac.group} - ${newFac.role}) to directory.`);
    addToast('success', 'Faculty Member Added', `Added ${newFac.name} to institutional directory.`);
    return newFac;
  };

  const updateFaculty = (id: string, updates: Partial<FacultyMember>) => {
    setFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    updateDoc(doc(db, 'faculty', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Faculty Member', id, updates.name || 'Faculty Member', 'Updated academic credentials, bio, and portrait image.');
    addToast('success', 'Faculty Profile Updated', 'Faculty details saved.');
  };

  const deleteFaculty = (id: string) => {
    const fac = faculty.find((f) => f.id === id);
    setFaculty((prev) => prev.filter((f) => f.id !== id));
    deleteDoc(doc(db, 'faculty', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Faculty Member', id, fac?.name || 'Faculty Member', 'Removed faculty record from directory.');
    addToast('info', 'Faculty Removed', 'Faculty profile removed.');
  };

  // News CRUD
  const addNewsArticle = (article: Omit<NewsArticle, 'id'>): NewsArticle => {
    const newArt: NewsArticle = {
      ...article,
      id: `news-${Date.now()}`,
      status: article.status || 'Published',
    };
    setNews((prev) => [newArt, ...prev]);
    setDoc(doc(db, 'news', newArt.id), newArt, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'News Article', newArt.id, newArt.title, 'Published college news/feature article.');
    addToast('success', 'Article Published', `"${newArt.title}" published.`);
    return newArt;
  };

  const updateNewsArticle = (id: string, updates: Partial<NewsArticle>) => {
    setNews((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
    updateDoc(doc(db, 'news', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'News Article', id, updates.title || 'News Article', 'Updated article content and cover image.');
    addToast('success', 'Article Updated', 'News article updated.');
  };

  const deleteNewsArticle = (id: string) => {
    const art = news.find((n) => n.id === id);
    setNews((prev) => prev.filter((n) => n.id !== id));
    deleteDoc(doc(db, 'news', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'News Article', id, art?.title || 'News Article', 'Deleted news article.');
    addToast('info', 'Article Deleted', 'News article removed.');
  };

  // Events CRUD
  const addEvent = (event: Omit<CollegeEvent, 'id'>): CollegeEvent => {
    const newEvt: CollegeEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      registeredAttendees: event.registeredAttendees || [],
    };
    setEvents((prev) => [newEvt, ...prev]);
    setDoc(doc(db, 'events', newEvt.id), newEvt, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Event', newEvt.id, newEvt.title, `Scheduled college calendar event for ${newEvt.date}.`);
    addToast('success', 'Event Scheduled', `"${newEvt.title}" added to calendar.`);
    return newEvt;
  };

  const updateEvent = (id: string, updates: Partial<CollegeEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    updateDoc(doc(db, 'events', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Event', id, updates.title || 'Event', 'Updated event date, venue, and description.');
    addToast('success', 'Event Updated', 'Calendar event saved.');
  };

  const deleteEvent = (id: string) => {
    const evt = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    deleteDoc(doc(db, 'events', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Event', id, evt?.title || 'Event', 'Cancelled calendar event.');
    addToast('info', 'Event Deleted', 'Calendar event removed.');
  };

  // Downloads CRUD
  const addDownload = (res: Omit<DownloadableResource, 'id'>): DownloadableResource => {
    const newRes: DownloadableResource = {
      ...res,
      id: `dl-${Date.now()}`,
      downloadsCount: 0,
    };
    setDownloads((prev) => [newRes, ...prev]);
    setDoc(doc(db, 'downloads', newRes.id), newRes, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Resource / Form', newRes.id, newRes.title, `Added downloadable document (${newRes.category}).`);
    addToast('success', 'Resource Added', `"${newRes.title}" is now available for download.`);
    return newRes;
  };

  const updateDownload = (id: string, updates: Partial<DownloadableResource>) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    updateDoc(doc(db, 'downloads', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Resource / Form', id, updates.title || 'Resource', 'Updated downloadable resource metadata.');
    addToast('success', 'Resource Updated', 'Downloadable document saved.');
  };

  const deleteDownload = (id: string) => {
    const d = downloads.find((item) => item.id === id);
    setDownloads((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'downloads', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Resource / Form', id, d?.title || 'Resource', 'Deleted downloadable document.');
    addToast('info', 'Resource Removed', 'Document removed from downloads.');
  };

  // Testimonials CRUD
  const addTestimonial = (item: Omit<Testimonial, 'id'>) => {
    const newItem: Testimonial = { ...item, id: `test-${Date.now()}` };
    setTestimonials((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'testimonials', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Testimonial', newItem.id, newItem.name, `Added testimony quote from ${newItem.name} (${newItem.role}).`);
    addToast('success', 'Testimonial Added', `Added testimonial from ${newItem.name}.`);
  };

  const updateTestimonial = (id: string, updates: Partial<Testimonial>) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    updateDoc(doc(db, 'testimonials', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Testimonial', id, updates.name || 'Testimonial', 'Updated testimonial quote and role.');
    addToast('success', 'Testimonial Updated', 'Testimonial saved.');
  };

  const deleteTestimonial = (id: string) => {
    const t = testimonials.find((item) => item.id === id);
    setTestimonials((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'testimonials', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Testimonial', id, t?.name || 'Testimonial', 'Deleted testimonial quote.');
    addToast('info', 'Testimonial Removed', 'Testimonial deleted.');
  };

  // Stats CRUD
  const updateStat = (id: string, updates: Partial<ImpactStat>) => {
    setStats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    updateDoc(doc(db, 'stats', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Institutional Stat', id, updates.label || 'Stat', 'Updated institutional metric values.');
    addToast('success', 'Metric Updated', 'Institutional impact statistic saved.');
  };

  // FAQs CRUD
  const addFaq = (item: Omit<FAQItem, 'id'>) => {
    const newItem: FAQItem = { ...item, id: `faq-${Date.now()}` };
    setFaqs((prev) => [...prev, newItem]);
    setDoc(doc(db, 'faqs', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'FAQ', newItem.id, newItem.question, 'Added new FAQ entry.');
    addToast('success', 'FAQ Added', 'New question & answer added.');
  };

  const updateFaq = (id: string, updates: Partial<FAQItem>) => {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    updateDoc(doc(db, 'faqs', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'FAQ', id, updates.question || 'FAQ', 'Updated question and response.');
    addToast('success', 'FAQ Updated', 'FAQ item saved.');
  };

  const deleteFaq = (id: string) => {
    const f = faqs.find((item) => item.id === id);
    setFaqs((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'faqs', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'FAQ', id, f?.question || 'FAQ', 'Deleted FAQ entry.');
    addToast('info', 'FAQ Removed', 'FAQ item deleted.');
  };

  // Sermons CRUD
  const addSermon = (item: Omit<SermonLecture, 'id'>) => {
    const newItem: SermonLecture = { ...item, id: `sermon-${Date.now()}` };
    setSermons((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'sermons', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Sermon / Chapel', newItem.id, newItem.title, `Added chapel audio lecture by ${newItem.speaker}.`);
    addToast('success', 'Sermon Added', `"${newItem.title}" added to chapel archive.`);
  };

  const updateSermon = (id: string, updates: Partial<SermonLecture>) => {
    setSermons((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    updateDoc(doc(db, 'sermons', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Sermon / Chapel', id, updates.title || 'Sermon', 'Updated sermon details and audio link.');
    addToast('success', 'Sermon Updated', 'Chapel archive item saved.');
  };

  const deleteSermon = (id: string) => {
    const s = sermons.find((item) => item.id === id);
    setSermons((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'sermons', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Sermon / Chapel', id, s?.title || 'Sermon', 'Deleted chapel sermon entry.');
    addToast('info', 'Sermon Removed', 'Chapel sermon removed from archive.');
  };

  // Scrapbook CRUD
  const addScrapbookItem = (item: Omit<ScrapbookItem, 'id'>) => {
    const newItem: ScrapbookItem = { ...item, id: `sb-${Date.now()}` };
    setScrapbook((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'scrapbook', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Historical Scrapbook', newItem.id, newItem.title, `Added heritage milestone (${newItem.year}).`);
    addToast('success', 'Historical Item Added', `"${newItem.title}" added to heritage archive.`);
  };

  const updateScrapbookItem = (id: string, updates: Partial<ScrapbookItem>) => {
    setScrapbook((prev) =>
      prev.map((sb) => (sb.id === id ? { ...sb, ...updates } : sb))
    );
    updateDoc(doc(db, 'scrapbook', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Historical Scrapbook', id, updates.title || 'Heritage Item', 'Updated heritage archive record.');
    addToast('success', 'Heritage Item Updated', 'Scrapbook milestone saved.');
  };

  const deleteScrapbookItem = (id: string) => {
    const sb = scrapbook.find((item) => item.id === id);
    setScrapbook((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'scrapbook', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Historical Scrapbook', id, sb?.title || 'Heritage Item', 'Deleted scrapbook historical record.');
    addToast('info', 'Historical Item Removed', 'Scrapbook record deleted.');
  };

  // Admissions Application Workflow
  const submitApplication = async (appData: any): Promise<string> => {
    const year = new Date().getFullYear();
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const refNumber = `PCM-${year}-${randDigits}`;

    const newApp: AdmissionApplication = {
      id: `app-${Date.now()}`,
      referenceNumber: refNumber,
      fullName: appData.fullName,
      email: appData.email,
      phone: appData.phone || '',
      dateOfBirth: appData.dob || '',
      gender: appData.gender || 'Prefer not to say',
      address: appData.address || '',
      program: appData.program || 'Bachelor of Theology (B.Th.)',
      status: 'Submitted',
      submissionDate: new Date().toISOString().split('T')[0],
      christianTestimony: appData.testimony || '',
      churchAffiliation: appData.church || '',
      pastorName: appData.pastorName || '',
      pastorContact: appData.pastorContact || '',
      highSchool: appData.highSchool || '',
      previousCollege: appData.previousCollege || '',
      adminNotes: 'Application received online. Queued for initial Admissions Committee review.',
    };

    setApplications((prev) => [newApp, ...prev]);
    try {
      await setDoc(doc(db, 'applications', newApp.id), newApp, { merge: true });
    } catch (e) {
      console.warn('Firestore application save warning:', e);
    }

    logActivity('CREATE', 'Admission Application', newApp.id, `${newApp.fullName} (${refNumber})`, `New online admission application submitted for ${newApp.program}.`);
    addToast('success', 'Application Submitted', `Your application has been received. Reference: ${refNumber}`);
    return refNumber;
  };

  const updateApplicationStatus = async (id: string, status: ApplicationStatus, note?: string) => {
    const targetApp = applications.find((a) => a.id === id);
    const updatedNote = note
      ? `${targetApp?.adminNotes || ''}\n[${new Date().toLocaleDateString()} - ${currentAdminUser.name}]: ${note}`
      : targetApp?.adminNotes;

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status, adminNotes: updatedNote } : app))
    );

    try {
      await updateDoc(doc(db, 'applications', id), { status, adminNotes: updatedNote });
    } catch (e) {
      console.warn(e);
    }

    logActivity('UPDATE', 'Admission Application', id, targetApp?.fullName || 'Applicant', `Application status changed to "${status}".`);
    addToast('success', 'Applicant Status Updated', `Status updated to ${status}.`);
  };

  const addApplicationNote = async (id: string, note: string) => {
    const targetApp = applications.find((a) => a.id === id);
    const newNotes = `${targetApp?.adminNotes || ''}\n[${new Date().toLocaleDateString()} - ${currentAdminUser.name}]: ${note}`;

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, adminNotes: newNotes } : app))
    );

    try {
      await updateDoc(doc(db, 'applications', id), { adminNotes: newNotes });
    } catch (e) {
      console.warn(e);
    }

    addToast('info', 'Internal Note Logged', 'Application review note saved.');
  };

  const deleteApplication = async (id: string) => {
    const targetApp = applications.find((a) => a.id === id);
    setApplications((prev) => prev.filter((a) => a.id !== id));

    try {
      await deleteDoc(doc(db, 'applications', id));
    } catch (e) {
      console.warn(e);
    }

    logActivity('DELETE', 'Admission Application', id, targetApp?.fullName || 'Applicant', 'Deleted admission application record.');
    addToast('info', 'Application Removed', 'Application record deleted.');
  };

  const getApplicationByRef = (ref: string): AdmissionApplication | undefined => {
    return applications.find(
      (a) => a.referenceNumber.trim().toUpperCase() === ref.trim().toUpperCase()
    );
  };

  // Student Portal Actions
  const studentLogin = (studentId: string, pass: string): boolean => {
    if (
      studentId.trim().toUpperCase() === studentProfile.studentId.toUpperCase() &&
      pass === 'pcm1966'
    ) {
      setIsStudentLoggedIn(true);
      addToast('success', 'Student Authenticated', `Welcome back, ${studentProfile.fullName || studentProfile.name || 'Student'}!`);
      return true;
    }
    addToast('error', 'Authentication Failed', 'Invalid Student ID or Password.');
    return false;
  };

  const studentLogout = () => {
    setIsStudentLoggedIn(false);
    addToast('info', 'Logged Out', 'Student session ended.');
  };

  const addPracticumEntry = async (entry: Omit<StudentProfile['practicumEntries'][0], 'id' | 'status'>) => {
    const newEntry = {
      ...entry,
      id: `prac-${Date.now()}`,
      status: 'Pending Verification' as const,
    };
    const updated = {
      ...studentProfile,
      practicumEntries: [newEntry, ...studentProfile.practicumEntries],
    };
    setStudentProfile(updated);
    try {
      await setDoc(doc(db, 'studentProfiles', studentProfile.id), updated, { merge: true });
    } catch (e) {
      console.warn(e);
    }
    addToast('success', 'Ministry Log Submitted', 'Practicum hours submitted to Dean of Students.');
  };

  const makeTuitionPayment = async (amount: number) => {
    const currentBalance =
      studentProfile.tuitionBalance !== undefined
        ? studentProfile.tuitionBalance
        : Math.max(0, (studentProfile.tuitionTotal || 0) - (studentProfile.tuitionPaid || 0));
    const newPaid = (studentProfile.tuitionPaid || 0) + amount;
    const newBalance = Math.max(0, currentBalance - amount);
    const updated = { ...studentProfile, tuitionPaid: newPaid, tuitionBalance: newBalance };
    setStudentProfile(updated);
    try {
      await setDoc(doc(db, 'studentProfiles', studentProfile.id), updated, { merge: true });
    } catch (e) {
      console.warn(e);
    }
    addToast('success', 'Tuition Payment Processed', `Payment of ₱${amount.toLocaleString()} received.`);
  };

  // Admin CMS Auth & Management
  const adminLogin = (user: string, pass: string): boolean => {
    const found = adminUsers.find(
      (u) =>
        (u.username.toLowerCase() === user.trim().toLowerCase() ||
          u.email.toLowerCase() === user.trim().toLowerCase()) &&
        u.password === pass &&
        (!u.status || u.status === 'Active')
    );

    if (found) {
      setCurrentAdminUser(found);
      setIsAdminLoggedIn(true);
      logActivity('LOGIN', 'Admin Session', found.id, found.name, `Logged into CMS Workspace (${found.role}).`);
      addToast('success', 'Admin Session Active', `Welcome, ${found.name} (${found.role})`);
      return true;
    }
    addToast('error', 'Login Failed', 'Invalid admin credentials or inactive account.');
    return false;
  };

  const adminLogout = () => {
    logActivity('LOGOUT', 'Admin Session', currentAdminUser?.id || '', currentAdminUser?.name || '', 'Ended admin session.');
    setIsAdminLoggedIn(false);
    addToast('info', 'Session Terminated', 'You have been signed out of the Admin CMS.');
  };

  const addAdminUser = (user: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser => {
    const newUser: AdminUser = {
      ...user,
      id: `adm-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAdminUsers((prev) => [...prev, newUser]);
    setDoc(doc(db, 'adminUsers', newUser.id), newUser, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Admin User', newUser.id, newUser.name, `Provisioned new admin account (${newUser.role}).`);
    addToast('success', 'Admin Account Created', `Created user account for ${newUser.name}.`);
    return newUser;
  };

  const updateAdminUser = (id: string, updates: Partial<AdminUser>) => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    updateDoc(doc(db, 'adminUsers', id), updates).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Admin User', id, updates.name || 'Admin', 'Updated user role or permissions.');
    addToast('success', 'Admin Profile Updated', 'Admin account updated.');
  };

  const deleteAdminUser = (id: string) => {
    if (adminUsers.length <= 1) {
      addToast('error', 'Cannot Delete', 'You cannot delete the only remaining admin account.');
      return;
    }
    const u = adminUsers.find((user) => user.id === id);
    setAdminUsers((prev) => prev.filter((user) => user.id !== id));
    deleteDoc(doc(db, 'adminUsers', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Admin User', id, u?.name || 'Admin', 'Removed admin account.');
    addToast('info', 'Admin Deleted', 'User access revoked.');
  };

  const changeAdminPassword = (userId: string, newPass: string): boolean => {
    if (newPass.length < 6) {
      addToast('error', 'Weak Password', 'Password must be at least 6 characters.');
      return false;
    }
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    updateDoc(doc(db, 'adminUsers', userId), { password: newPass }).catch((e) => console.warn(e));
    logActivity('SETTINGS', 'Admin Security', userId, currentAdminUser.name, 'Changed account password.');
    addToast('success', 'Password Updated', 'Your security password has been changed.');
    return true;
  };

  // Backup & Restore
  const exportDatabaseJson = (): string => {
    const fullDb = {
      version: '4.0.0',
      exportDate: new Date().toISOString(),
      siteConfig,
      programs,
      faculty,
      announcements,
      news,
      events,
      downloads,
      testimonials,
      stats,
      faqs,
      sermons,
      scrapbook,
      mediaItems,
      galleryAlbums,
      applications,
      adminUsers,
      studentProfile,
      activityLogs,
    };
    return JSON.stringify(fullDb, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.programs && Array.isArray(data.programs)) setPrograms(data.programs);
      if (data.faculty && Array.isArray(data.faculty)) setFaculty(data.faculty);
      if (data.announcements && Array.isArray(data.announcements)) setAnnouncements(data.announcements);
      if (data.news && Array.isArray(data.news)) setNews(data.news);
      if (data.events && Array.isArray(data.events)) setEvents(data.events);
      if (data.downloads && Array.isArray(data.downloads)) setDownloads(data.downloads);
      if (data.testimonials && Array.isArray(data.testimonials)) setTestimonials(data.testimonials);
      if (data.stats && Array.isArray(data.stats)) setStats(data.stats);
      if (data.faqs && Array.isArray(data.faqs)) setFaqs(data.faqs);
      if (data.sermons && Array.isArray(data.sermons)) setSermons(data.sermons);
      if (data.scrapbook && Array.isArray(data.scrapbook)) setScrapbook(data.scrapbook);
      if (data.mediaItems && Array.isArray(data.mediaItems)) setMediaItems(data.mediaItems);
      if (data.galleryAlbums && Array.isArray(data.galleryAlbums)) setGalleryAlbums(data.galleryAlbums);
      if (data.siteConfig) setSiteConfig(data.siteConfig);
      if (data.applications && Array.isArray(data.applications)) setApplications(data.applications);
      if (data.studentProfile) setStudentProfile(data.studentProfile);

      logActivity('RESTORE', 'Database Import', 'import-db', 'Full Dataset Restore', 'Imported complete JSON database backup.');
      addToast('success', 'Database Restored', 'Institutional dataset restored successfully.');
      syncAllDataToFirestore(true);
      return true;
    } catch (e: any) {
      addToast('error', 'Import Failed', 'Invalid JSON backup file structure.');
      return false;
    }
  };

  const resetToInitialData = async () => {
    setSiteConfig(INITIAL_SITE_CONFIG);
    setPrograms(INITIAL_PROGRAMS);
    setFaculty(INITIAL_FACULTY);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setNews(INITIAL_NEWS);
    setEvents(INITIAL_EVENTS);
    setDownloads(INITIAL_DOWNLOADS);
    setTestimonials(INITIAL_TESTIMONIALS);
    setStats(INITIAL_STATS);
    setFaqs(INITIAL_FAQS);
    setSermons(INITIAL_SERMONS);
    setScrapbook(INITIAL_SCRAPBOOK);
    setMediaItems(INITIAL_MEDIA_ITEMS);
    setGalleryAlbums(INITIAL_GALLERY_ALBUMS);
    setApplications(INITIAL_APPLICATIONS);
    setAdminUsers(INITIAL_ADMIN_USERS);
    setStudentProfile(DEMO_STUDENT_PROFILE);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);

    try {
      await syncAllDataToFirestore(true);
    } catch (e) {
      console.warn(e);
    }

    addToast('warning', 'Database Reset', 'Restored initial baseline catalog & configuration.');
  };

  // Event Registration
  const registerForEvent = async (
    eventId: string,
    attendeeName: string,
    email: string
  ): Promise<boolean> => {
    const evt = events.find((e) => e.id === eventId);
    if (!evt) return false;

    const updatedAttendees = [
      ...(evt.registeredAttendees || []),
      { name: attendeeName, email, date: new Date().toISOString().split('T')[0] },
    ];

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, registeredAttendees: updatedAttendees } : e
      )
    );

    try {
      await updateDoc(doc(db, 'events', eventId), { registeredAttendees: updatedAttendees });
    } catch (e) {
      console.warn(e);
    }

    addToast('success', 'Registration Confirmed', `You are registered for "${evt.title}". Confirmation sent to ${email}.`);
    return true;
  };

  // Newsletter Subscription
  const subscribeNewsletter = async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      addToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (newsletterEmails.includes(email.toLowerCase())) {
      addToast('info', 'Already Subscribed', 'This email is already subscribed to PCM updates.');
      return true;
    }
    setNewsletterEmails((prev) => [...prev, email.toLowerCase()]);
    try {
      await setDoc(
        doc(db, 'newsletterSubscribers', email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')),
        { email: email.toLowerCase(), subscribedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.warn(e);
    }
    addToast('success', 'Subscription Active', 'Thank you for subscribing to PCM News and Ministry Updates.');
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

        // Firebase Cloud Database & Storage
        isFirebaseConnected,
        firebaseSyncStatus,
        lastSyncedAt,
        syncAllDataToFirestore,
        uploadMediaFile,

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

        // Media Library & Albums
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

        // Audit Logs
        activityLogs,
        setActivityLogs,
        logActivity,
        clearActivityLogs,

        // Announcements
        announcements,
        setAnnouncements,
        addAnnouncement,
        updateAnnouncement,
        toggleAnnouncement,
        deleteAnnouncement,

        // Programs
        programs,
        setPrograms,
        addProgram,
        updateProgram,
        deleteProgram,

        // Faculty
        faculty,
        setFaculty,
        addFaculty,
        addFacultyMember: addFaculty,
        updateFaculty,
        updateFacultyMember: updateFaculty,
        deleteFaculty,
        deleteFacultyMember: deleteFaculty,

        // News
        news,
        setNews,
        addNewsArticle,
        updateNewsArticle,
        deleteNewsArticle,

        // Events
        events,
        setEvents,
        addEvent,
        addEventItem: addEvent,
        updateEvent,
        updateEventItem: updateEvent,
        deleteEvent,
        deleteEventItem: deleteEvent,

        // Downloads
        downloads,
        setDownloads,
        addDownload,
        addDownloadResource: addDownload,
        updateDownload,
        deleteDownload,
        deleteDownloadResource: deleteDownload,

        // Testimonials
        testimonials,
        setTestimonials,
        addTestimonial,
        updateTestimonial,
        deleteTestimonial,

        // Stats & FAQs
        stats,
        setStats,
        updateStat,
        faqs,
        setFaqs,
        addFaq,
        updateFaq,
        deleteFaq,

        // Sermons & Scrapbook
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
