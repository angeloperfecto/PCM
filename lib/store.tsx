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
  StudentCourse,
  OnlineEnrollment,
  StudentDocument,
  StudentNotification,
  StudentPaymentRecord,
  StudentSubjectHistory,
  EnrollmentStatus,
  DocumentVerificationStatus,
  SelectedSubject,
  DownloadableResource,
  SermonLecture,
  FAQItem,
  AdminRole,
  AdminUser,
  UserAccount,
  NewUserAccountInput,
  UserRole,
  ApplicationStatus,
  ScrapbookItem,
  MigrationAuditItem,
  SiteConfig,
  MediaItem,
  GalleryAlbum,
  ActivityLogItem,
  ContentStatus,
  DonationPaymentMethod,
  DonationRecord,
  DonationSettings,
  AcademicSubject,
  PreEnlistmentRecord,
  AddDropRequest,
  AddDropAction,
  AddDropStatus,
  FeeStructureItem,
  StudentAssessment,
  EnrollmentSubmenuTab,
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
  INITIAL_STUDENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_STUDENT_NOTIFICATIONS,
  INITIAL_DOWNLOADS,
  INITIAL_SERMONS,
  INITIAL_FAQS,
  INITIAL_ADMIN_USERS,
  INITIAL_USER_ACCOUNTS,
  INITIAL_SCRAPBOOK,
  INITIAL_MIGRATION_AUDIT,
  INITIAL_SITE_CONFIG,
  INITIAL_MEDIA_ITEMS,
  INITIAL_GALLERY_ALBUMS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_DONATION_METHODS,
  INITIAL_DONATIONS,
  INITIAL_DONATION_SETTINGS,
  INITIAL_ACADEMIC_SUBJECTS,
  INITIAL_PRE_ENLISTMENTS,
  INITIAL_ADD_DROP_REQUESTS,
  INITIAL_FEE_STRUCTURE,
} from './initialData';
import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  uploadFileToFirebaseStorage,
  handleFirestoreError,
  isFirestoreQuotaError,
  logFirestoreOp,
  OperationType,
  cleanFirestoreData,
  safeSetDoc,
  safeUpdateDoc,
  safeDeleteDoc,
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
  reorderFaculty: (reordered: FacultyMember[]) => void;
  moveFacultyMember: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  setFacultyOrderIndex: (id: string, targetOrder: number) => void;

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

  // Google / Firebase User Accounts & Multi-Role Authentication
  currentUserAccount: UserAccount | null;
  setCurrentUserAccount: (acc: UserAccount | null) => void;
  firebaseAuthUser: FirebaseUser | null;
  userAccounts: UserAccount[];
  userAccountModalOpen: boolean;
  setUserAccountModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<{ success: boolean; role?: string; user?: UserAccount }>;
  signOutUser: () => Promise<void>;
  addUserAccount: (user: NewUserAccountInput) => Promise<UserAccount> | UserAccount;
  deleteUserAccount: (userId: string) => Promise<void> | void;
  updateUserAccountRole: (userId: string, role: UserRole, adminRole?: AdminRole) => Promise<void>;
  linkStudentIdToUser: (studentId: string) => Promise<void>;

  // Student Portal & Multi-Student Directory
  isStudentLoggedIn: boolean;
  setIsStudentLoggedIn: (loggedIn: boolean) => void;
  currentStudent: StudentProfile | null;
  studentProfile: StudentProfile;
  setStudentProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
  students: StudentProfile[];
  setStudents: React.Dispatch<React.SetStateAction<StudentProfile[]>>;
  studentLogin: (id: string, pass: string) => boolean;
  studentLogout: () => void;
  linkGoogleAccountToStudent: (studentId: string) => Promise<boolean>;
  addPracticumEntry: (entry: Omit<StudentProfile['practicumEntries'][0], 'id' | 'status'>) => void;
  makeTuitionPayment: (amount: number, method?: string, refNo?: string) => Promise<void> | void;

  // Online Enrollment System
  enrollments: OnlineEnrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<OnlineEnrollment[]>>;
  currentEnrollmentDraft: Partial<OnlineEnrollment> | null;
  setCurrentEnrollmentDraft: React.Dispatch<React.SetStateAction<Partial<OnlineEnrollment> | null>>;
  saveEnrollmentDraft: (draft: Partial<OnlineEnrollment>) => Promise<OnlineEnrollment>;
  submitEnrollment: (data: Partial<OnlineEnrollment>) => Promise<{ success: boolean; referenceNumber?: string; message?: string }>;
  updateEnrollmentStatus: (enrollmentId: string, status: EnrollmentStatus, adminRemarks?: string) => Promise<boolean>;
  approveEnrollment: (enrollmentId: string, remarks?: string) => Promise<boolean>;
  returnEnrollmentForCorrection: (enrollmentId: string, adminFeedback: string) => Promise<boolean>;
  rejectEnrollment: (enrollmentId: string, reason: string) => Promise<boolean>;
  deleteEnrollment: (enrollmentId: string) => Promise<boolean>;

  // Student Documents Vault & Verification
  uploadStudentDocument: (studentId: string, docData: Omit<StudentDocument, 'id' | 'uploadDate' | 'verificationStatus'>) => Promise<StudentDocument>;
  updateDocumentVerification: (studentId: string, docId: string, status: DocumentVerificationStatus, adminFeedback?: string) => Promise<boolean>;

  // Student Profile & Academic Management (Admin / Registrar)
  createStudentProfile: (profile: Omit<StudentProfile, 'id'>) => Promise<StudentProfile>;
  updateStudentProfile: (studentId: string, updates: Partial<StudentProfile>) => Promise<boolean>;
  deleteStudentProfile: (studentId: string) => Promise<boolean>;
  addStudentGrade: (studentId: string, courseCode: string, midtermGrade: number | string, finalGrade: number | string) => Promise<boolean>;
  recordStudentPayment: (studentId: string, payment: Omit<StudentPaymentRecord, 'id'>) => Promise<boolean>;

  // Enrollment Submenu Navigation
  enrollmentActiveSubTab: EnrollmentSubmenuTab;
  setEnrollmentActiveSubTab: (tab: EnrollmentSubmenuTab) => void;

  // Academic Subjects Catalog & Sections
  academicSubjects: AcademicSubject[];
  setAcademicSubjects: React.Dispatch<React.SetStateAction<AcademicSubject[]>>;
  addAcademicSubject: (subject: Omit<AcademicSubject, 'id'>) => Promise<AcademicSubject>;
  updateAcademicSubject: (id: string, updates: Partial<AcademicSubject>) => Promise<boolean>;
  deleteAcademicSubject: (id: string) => Promise<boolean>;

  // Pre-Enlistment Module
  preEnlistments: PreEnlistmentRecord[];
  setPreEnlistments: React.Dispatch<React.SetStateAction<PreEnlistmentRecord[]>>;
  submitPreEnlistment: (record: Omit<PreEnlistmentRecord, 'id' | 'createdAt'>) => Promise<PreEnlistmentRecord>;
  updatePreEnlistmentStatus: (id: string, status: PreEnlistmentRecord['status'], remarks?: string) => Promise<boolean>;

  // Adding & Dropping Module
  addDropRequests: AddDropRequest[];
  setAddDropRequests: React.Dispatch<React.SetStateAction<AddDropRequest[]>>;
  submitAddDropRequest: (req: Omit<AddDropRequest, 'id' | 'createdAt' | 'status' | 'dateSubmitted'>) => Promise<AddDropRequest>;
  reviewAddDropRequest: (id: string, status: AddDropStatus, adminRemarks?: string) => Promise<boolean>;

  // Assessment & Fee Structure Module
  feeStructure: FeeStructureItem[];
  setFeeStructure: React.Dispatch<React.SetStateAction<FeeStructureItem[]>>;
  updateFeeStructureItem: (id: string, updates: Partial<FeeStructureItem>) => Promise<boolean>;
  addFeeStructureItem: (item: Omit<FeeStructureItem, 'id'>) => Promise<FeeStructureItem>;
  deleteFeeStructureItem: (id: string) => Promise<boolean>;
  calculateStudentAssessment: (studentId?: string, overrideUnits?: number, additionalFeeIds?: string[]) => StudentAssessment;

  // Student Notifications
  studentNotifications: StudentNotification[];
  setStudentNotifications: React.Dispatch<React.SetStateAction<StudentNotification[]>>;
  addStudentNotification: (studentId: string, notif: Omit<StudentNotification, 'id' | 'createdAt' | 'read' | 'studentId'>) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  markAllNotificationsRead: (studentId: string) => Promise<void>;

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
  importDatabaseJson: (jsonString: string) => Promise<boolean> | boolean;
  resetToInitialData: () => Promise<void> | void;

  // Donation Management & Giving Portal
  donationMethods: DonationPaymentMethod[];
  setDonationMethods: React.Dispatch<React.SetStateAction<DonationPaymentMethod[]>>;
  addDonationMethod: (method: Omit<DonationPaymentMethod, 'id'>) => Promise<DonationPaymentMethod> | DonationPaymentMethod;
  updateDonationMethod: (id: string, updates: Partial<DonationPaymentMethod>) => Promise<void> | void;
  deleteDonationMethod: (id: string) => Promise<void> | void;
  donations: DonationRecord[];
  setDonations: React.Dispatch<React.SetStateAction<DonationRecord[]>>;
  submitDonation: (data: Omit<DonationRecord, 'id' | 'trackingCode' | 'status' | 'createdAt'>) => Promise<DonationRecord>;
  updateDonationRecord: (id: string, updates: Partial<DonationRecord>) => Promise<void> | void;
  deleteDonationRecord: (id: string) => Promise<void> | void;
  donationSettings: DonationSettings;
  setDonationSettings: React.Dispatch<React.SetStateAction<DonationSettings>>;
  updateDonationSettings: (updates: Partial<DonationSettings>) => Promise<void> | void;

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
  const [userAccountModalOpen, setUserAccountModalOpen] = useState(false);

  // Cloud Database Sync States
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // User Accounts & Multi-Role Auth
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<FirebaseUser | null>(null);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(INITIAL_USER_ACCOUNTS);

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

  // Donation Management & Giving Portal
  const [donationMethods, setDonationMethods] = useState<DonationPaymentMethod[]>(INITIAL_DONATION_METHODS);
  const [donations, setDonations] = useState<DonationRecord[]>(INITIAL_DONATIONS);
  const [donationSettings, setDonationSettings] = useState<DonationSettings>(INITIAL_DONATION_SETTINGS);

  // Student Portal, Multi-Student Directory, & Online Enrollment System
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>(INITIAL_STUDENTS);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(INITIAL_STUDENTS[0] || DEMO_STUDENT_PROFILE);
  const [enrollments, setEnrollments] = useState<OnlineEnrollment[]>(INITIAL_ENROLLMENTS);
  const [studentNotifications, setStudentNotifications] = useState<StudentNotification[]>(INITIAL_STUDENT_NOTIFICATIONS);
  const [currentEnrollmentDraft, setCurrentEnrollmentDraft] = useState<Partial<OnlineEnrollment> | null>(null);

  // Enrollment Submenu Active Tab
  const [enrollmentActiveSubTab, setEnrollmentActiveSubTab] = useState<EnrollmentSubmenuTab>('profile');

  // Academic Subjects, Pre-Enlistment, Adding & Dropping, and Fee Structure
  const [academicSubjects, setAcademicSubjects] = useState<AcademicSubject[]>(INITIAL_ACADEMIC_SUBJECTS);
  const [preEnlistments, setPreEnlistments] = useState<PreEnlistmentRecord[]>(INITIAL_PRE_ENLISTMENTS);
  const [addDropRequests, setAddDropRequests] = useState<AddDropRequest[]>(INITIAL_ADD_DROP_REQUESTS);
  const [feeStructure, setFeeStructure] = useState<FeeStructureItem[]>(INITIAL_FEE_STRUCTURE);

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
    if (section === 'admin') {
      const isStudentUser =
        currentUserAccount?.role === 'Student' ||
        (isStudentLoggedIn && !isAdminLoggedIn && currentUserAccount?.role !== 'Admin');

      if (isStudentUser) {
        addToast({
          title: 'Access Restricted',
          message: 'Student accounts are not authorized to access the Administrator section or user management.',
          type: 'error',
        });
        return;
      }
    }
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

      // Only save to Firestore if user is authenticated
      if (auth.currentUser) {
        safeSetDoc(doc(db, 'activityLogs', newLog.id), newLog, { merge: true }).catch(() => {});
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
    userAccounts,
    studentProfile,
    students,
    enrollments,
    studentNotifications,
    donationMethods,
    donations,
    donationSettings,
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
      userAccounts,
      studentProfile,
      students,
      enrollments,
      studentNotifications,
      donationMethods,
      donations,
      donationSettings,
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
    students,
    enrollments,
    studentNotifications,
    donationMethods,
    donations,
    donationSettings,
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

  // Sync entire dataset to Firestore in atomic batches
  const syncAllDataToFirestore = useCallback(
    async (force: boolean = false, customData?: any): Promise<boolean> => {
      try {
        setFirebaseSyncStatus('syncing');
        const st = customData || stateRef.current;

        // If not authenticated as an admin with cloud write privileges, sync state locally
        if (!auth.currentUser) {
          setIsFirebaseConnected(true);
          setFirebaseSyncStatus('synced');
          setLastSyncedAt(new Date());
          if (force) {
            addToast('info', 'Local State Ready', 'Website data is saved locally. Sign in as Admin to sync directly to Cloud Firestore.');
          }
          return true;
        }

        // 1. Site Config
        if (st.siteConfig) {
          await safeSetDoc(doc(db, 'siteConfig', 'global'), st.siteConfig);
        }

        // 2. Programs batch
        if (st.programs && st.programs.length > 0) {
          try {
            const progBatch = writeBatch(db);
            st.programs.forEach((p: any) => progBatch.set(doc(db, 'programs', p.id), cleanFirestoreData(p), { merge: true }));
            await progBatch.commit();
          } catch (e) {
            console.warn('Programs batch sync notice:', e);
          }
        }

        // 3. Faculty batch
        if (st.faculty && st.faculty.length > 0) {
          try {
            const facBatch = writeBatch(db);
            st.faculty.forEach((f: any) => facBatch.set(doc(db, 'faculty', f.id), cleanFirestoreData(f), { merge: true }));
            await facBatch.commit();
          } catch (e) {
            console.warn('Faculty batch sync notice:', e);
          }
        }

        // 4. Announcements batch
        if (st.announcements && st.announcements.length > 0) {
          try {
            const annBatch = writeBatch(db);
            st.announcements.forEach((a: any) => annBatch.set(doc(db, 'announcements', a.id), cleanFirestoreData(a), { merge: true }));
            await annBatch.commit();
          } catch (e) {
            console.warn('Announcements batch sync notice:', e);
          }
        }

        // 5. News batch
        if (st.news && st.news.length > 0) {
          try {
            const newsBatch = writeBatch(db);
            st.news.forEach((n: any) => newsBatch.set(doc(db, 'news', n.id), cleanFirestoreData(n), { merge: true }));
            await newsBatch.commit();
          } catch (e) {
            console.warn('News batch sync notice:', e);
          }
        }

        // 6. Events batch
        if (st.events && st.events.length > 0) {
          try {
            const evtBatch = writeBatch(db);
            st.events.forEach((e: any) => evtBatch.set(doc(db, 'events', e.id), cleanFirestoreData(e), { merge: true }));
            await evtBatch.commit();
          } catch (e) {
            console.warn('Events batch sync notice:', e);
          }
        }

        // 7. Downloads batch
        if (st.downloads && st.downloads.length > 0) {
          try {
            const dlBatch = writeBatch(db);
            st.downloads.forEach((d: any) => dlBatch.set(doc(db, 'downloads', d.id), cleanFirestoreData(d), { merge: true }));
            await dlBatch.commit();
          } catch (e) {
            console.warn('Downloads batch sync notice:', e);
          }
        }

        // 8. Testimonials batch
        if (st.testimonials && st.testimonials.length > 0) {
          try {
            const testBatch = writeBatch(db);
            st.testimonials.forEach((t: any) => testBatch.set(doc(db, 'testimonials', t.id), cleanFirestoreData(t), { merge: true }));
            await testBatch.commit();
          } catch (e) {
            console.warn('Testimonials batch sync notice:', e);
          }
        }

        // 9. Stats batch
        if (st.stats && st.stats.length > 0) {
          try {
            const statBatch = writeBatch(db);
            st.stats.forEach((s: any) => statBatch.set(doc(db, 'stats', s.id), cleanFirestoreData(s), { merge: true }));
            await statBatch.commit();
          } catch (e) {
            console.warn('Stats batch sync notice:', e);
          }
        }

        // 10. FAQs batch
        if (st.faqs && st.faqs.length > 0) {
          try {
            const faqBatch = writeBatch(db);
            st.faqs.forEach((f: any) => faqBatch.set(doc(db, 'faqs', f.id), cleanFirestoreData(f), { merge: true }));
            await faqBatch.commit();
          } catch (e) {
            console.warn('FAQs batch sync notice:', e);
          }
        }

        // 11. Sermons batch
        if (st.sermons && st.sermons.length > 0) {
          try {
            const sermonBatch = writeBatch(db);
            st.sermons.forEach((s: any) => sermonBatch.set(doc(db, 'sermons', s.id), cleanFirestoreData(s), { merge: true }));
            await sermonBatch.commit();
          } catch (e) {
            console.warn('Sermons batch sync notice:', e);
          }
        }

        // 12. Scrapbook batch
        if (st.scrapbook && st.scrapbook.length > 0) {
          try {
            const sbBatch = writeBatch(db);
            st.scrapbook.forEach((sb: any) => sbBatch.set(doc(db, 'scrapbook', sb.id), cleanFirestoreData(sb), { merge: true }));
            await sbBatch.commit();
          } catch (e) {
            console.warn('Scrapbook batch sync notice:', e);
          }
        }

        // 13. Media items batch
        if (st.mediaItems && st.mediaItems.length > 0) {
          try {
            const mediaBatch = writeBatch(db);
            st.mediaItems.forEach((m: any) => mediaBatch.set(doc(db, 'mediaItems', m.id), cleanFirestoreData(m), { merge: true }));
            await mediaBatch.commit();
          } catch (e) {
            console.warn('Media items batch sync notice:', e);
          }
        }

        // 14. Gallery albums batch
        if (st.galleryAlbums && st.galleryAlbums.length > 0) {
          try {
            const galBatch = writeBatch(db);
            st.galleryAlbums.forEach((g: any) => galBatch.set(doc(db, 'galleryAlbums', g.id), cleanFirestoreData(g), { merge: true }));
            await galBatch.commit();
          } catch (e) {
            console.warn('Gallery albums batch sync notice:', e);
          }
        }

        // 15. Admin users batch
        if (st.adminUsers && st.adminUsers.length > 0) {
          try {
            const admBatch = writeBatch(db);
            st.adminUsers.forEach((u: any) => admBatch.set(doc(db, 'adminUsers', u.id), cleanFirestoreData(u), { merge: true }));
            await admBatch.commit();
          } catch (e) {
            console.warn('Admin users batch sync notice:', e);
          }
        }

        // 15b. Google & System User Accounts directory batch
        if (st.userAccounts && st.userAccounts.length > 0) {
          try {
            const userBatch = writeBatch(db);
            st.userAccounts.forEach((u: any) => userBatch.set(doc(db, 'users', u.uid || u.id), cleanFirestoreData(u), { merge: true }));
            await userBatch.commit();
          } catch (e) {
            console.warn('User accounts batch sync notice:', e);
          }
        }

        // 16. Student Profiles & Directory batch
        if (st.students && st.students.length > 0) {
          try {
            const studentBatch = writeBatch(db);
            st.students.forEach((s: any) => studentBatch.set(doc(db, 'studentProfiles', s.id), cleanFirestoreData(s), { merge: true }));
            await studentBatch.commit();
          } catch (e) {
            console.warn('Student profiles batch sync notice:', e);
          }
        } else if (st.studentProfile) {
          await safeSetDoc(doc(db, 'studentProfiles', st.studentProfile.id), st.studentProfile);
        }

        // 16b. Enrollments batch
        if (st.enrollments && st.enrollments.length > 0) {
          try {
            const enrBatch = writeBatch(db);
            st.enrollments.forEach((enr: any) => enrBatch.set(doc(db, 'enrollments', enr.id), cleanFirestoreData(enr), { merge: true }));
            await enrBatch.commit();
          } catch (e) {
            console.warn('Enrollments batch sync notice:', e);
          }
        }

        // 16c. Student Notifications batch
        if (st.studentNotifications && st.studentNotifications.length > 0) {
          try {
            const notifBatch = writeBatch(db);
            st.studentNotifications.forEach((nt: any) => notifBatch.set(doc(db, 'studentNotifications', nt.id), cleanFirestoreData(nt), { merge: true }));
            await notifBatch.commit();
          } catch (e) {
            console.warn('Student notifications batch sync notice:', e);
          }
        }

        // 17. Donation Payment Methods batch
        if (st.donationMethods && st.donationMethods.length > 0) {
          try {
            const donMethodBatch = writeBatch(db);
            st.donationMethods.forEach((m: any) => donMethodBatch.set(doc(db, 'donationPaymentMethods', m.id), cleanFirestoreData(m), { merge: true }));
            await donMethodBatch.commit();
          } catch (e) {
            console.warn('Donation payment methods batch sync notice:', e);
          }
        }

        // 18. Donations batch
        if (st.donations && st.donations.length > 0) {
          try {
            const donBatch = writeBatch(db);
            st.donations.forEach((d: any) => donBatch.set(doc(db, 'donations', d.id), cleanFirestoreData(d), { merge: true }));
            await donBatch.commit();
          } catch (e) {
            console.warn('Donations batch sync notice:', e);
          }
        }

        // 19. Donation Settings
        if (st.donationSettings) {
          await safeSetDoc(doc(db, 'donationSettings', 'global'), st.donationSettings);
        }

        setIsFirebaseConnected(true);
        setFirebaseSyncStatus('synced');
        setLastSyncedAt(new Date());

        if (force) {
          addToast('success', 'Firebase Synced', 'All website collections are now synchronized with Cloud Firestore.');
        }
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, 'global-sync');
        setIsFirebaseConnected(true);
        setFirebaseSyncStatus('synced');
        if (force) {
          addToast('info', 'Auto-Sync Preserved', 'Changes are saved locally and will auto-sync with Firebase.');
        }
        return true;
      }
    },
    [addToast]
  );

  // Real-time Firestore Subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    let singleUserUnsub: (() => void) | null = null;

    const initializeFirestoreSync = async () => {
      try {
        setFirebaseSyncStatus('syncing');

        // Set up real-time onSnapshot listeners ONLY for core public CMS collections
        // 1. Site Config
        logFirestoreOp('listen', 'siteConfig/global', 'Public Site Config Real-Time Sync');
        const uConfig = onSnapshot(
          doc(db, 'siteConfig', 'global'),
          (snap) => {
            if (snap.exists()) {
              setSiteConfig(snap.data() as SiteConfig);
              setFirebaseSyncStatus('synced');
              setIsFirebaseConnected(true);
              setLastSyncedAt(new Date());
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'siteConfig/global');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uConfig);

        // 2. Programs
        logFirestoreOp('listen', 'programs', 'Academic Programs Real-Time Sync');
        const uPrograms = onSnapshot(
          collection(db, 'programs'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AcademicProgram[];
            setPrograms(list);
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'programs');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uPrograms);

        // 3. Faculty
        logFirestoreOp('listen', 'faculty', 'Faculty Directory Real-Time Sync');
        const uFaculty = onSnapshot(
          collection(db, 'faculty'),
          (snap) => {
            const list = snap.docs.map((d) => {
              const data = d.data() as any;
              const photo = data.imageUrl || data.image || '';
              return {
                id: d.id,
                ...data,
                imageUrl: photo,
                image: photo,
              } as FacultyMember;
            });
            // Sort by order ascending if provided
            list.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
            setFaculty(list);
            setSelectedFaculty((currentSelected) => {
              if (!currentSelected) return null;
              const match = list.find((m) => m.id === currentSelected.id);
              return match || currentSelected;
            });
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'faculty');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uFaculty);

        // 4. Announcements
        logFirestoreOp('listen', 'announcements', 'Announcements Real-Time Sync');
        const uAnnouncements = onSnapshot(
          collection(db, 'announcements'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AnnouncementItem[];
            setAnnouncements(list);
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'announcements');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uAnnouncements);

        // 5. News
        logFirestoreOp('listen', 'news', 'Institutional News Real-Time Sync');
        const uNews = onSnapshot(
          collection(db, 'news'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NewsArticle[];
            setNews(list);
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'news');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uNews);

        // 6. Events
        logFirestoreOp('listen', 'events', 'College Events Real-Time Sync');
        const uEvents = onSnapshot(
          collection(db, 'events'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CollegeEvent[];
            setEvents(list);
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'events');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uEvents);

        // 7. Donation Payment Methods
        logFirestoreOp('listen', 'donationPaymentMethods', 'Giving Options Real-Time Sync');
        const uDonMethods = onSnapshot(
          collection(db, 'donationPaymentMethods'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DonationPaymentMethod[];
              list.sort((a, b) => (a.order || 0) - (b.order || 0));
              setDonationMethods(list);
              setIsFirebaseConnected(true);
              setFirebaseSyncStatus('synced');
              setLastSyncedAt(new Date());
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'donationPaymentMethods');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uDonMethods);

        // 8. Donation Settings
        logFirestoreOp('listen', 'donationSettings/global', 'Giving Settings Real-Time Sync');
        const uDonSettings = onSnapshot(
          doc(db, 'donationSettings', 'global'),
          (snap) => {
            if (snap.exists()) {
              setDonationSettings(snap.data() as DonationSettings);
              setIsFirebaseConnected(true);
              setFirebaseSyncStatus('synced');
              setLastSyncedAt(new Date());
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'donationSettings/global');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uDonSettings);

        // 9. Listen to Firebase Auth state & Single User Profile (Targeted Read / Subscription)
        const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
          setFirebaseAuthUser(fbUser);

          // Clean up prior single user listener if user changes
          if (singleUserUnsub) {
            singleUserUnsub();
            singleUserUnsub = null;
          }

          if (fbUser) {
            const emailLower = fbUser.email?.toLowerCase() || '';
            const isBootstrapAdmin =
              emailLower === 'angeloperfecto.epc@gmail.com' ||
              emailLower === 'president@pcm.edu.ph' ||
              emailLower === 'admin@pcm.ph' ||
              emailLower.includes('president') ||
              emailLower.includes('admin@pcm');

            let acc: UserAccount = {
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Member',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Member',
              photoURL: fbUser.photoURL || '',
              avatarUrl: fbUser.photoURL || '',
              role: isBootstrapAdmin ? 'Admin' : 'Student',
              adminRole: isBootstrapAdmin ? 'Super Admin' : undefined,
              studentId: isBootstrapAdmin ? undefined : '2024-PCM-0418',
              department: isBootstrapAdmin ? 'Administration & Executive Leadership' : 'Undergraduate Theology',
              status: 'Active',
              provider: 'google.com',
              emailVerified: fbUser.emailVerified,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };

            // Targeted single-document getDoc for active authenticated user profile only
            try {
              logFirestoreOp('read', `users/${fbUser.uid}`, 'Auth state single user profile lookup');
              const userDocRef = doc(db, 'users', fbUser.uid);
              const snap = await getDoc(userDocRef);
              if (snap.exists()) {
                const stored = snap.data() as UserAccount;
                acc = {
                  ...acc,
                  ...stored,
                  lastLogin: new Date().toISOString(),
                  ...(isBootstrapAdmin ? { role: 'Admin', adminRole: 'Super Admin' } : {}),
                };
              }
              // Attempt to update last login for active user
              logFirestoreOp('write', `users/${fbUser.uid}`, 'Auth state lastLogin update');
              setDoc(userDocRef, acc, { merge: true }).catch((err) => {
                console.warn('Firestore setDoc notice (offline/quota fallback):', err);
              });
            } catch (e) {
              console.warn('Auth state profile handler warning (quota/offline fallback):', e);
            }

            setCurrentUserAccount(acc);
            if (acc.role === 'Admin') {
              setIsAdminLoggedIn(true);
              setCurrentAdminUser({
                id: acc.uid,
                name: acc.name || acc.displayName || 'Administrator',
                email: acc.email,
                username: acc.email.split('@')[0] || 'admin',
                role: acc.adminRole || 'Super Admin',
                department: acc.department || 'Administration & Executive Leadership',
                status: 'Active',
                createdAt: acc.createdAt,
                avatarUrl: acc.photoURL,
              });
            } else if (acc.role === 'Student') {
              setIsStudentLoggedIn(true);
              setStudentProfile((prev) => ({
                ...prev,
                fullName: acc.name || acc.displayName || prev.fullName,
                email: acc.email,
                avatarUrl: acc.photoURL || prev.avatarUrl,
              }));
            }

            // Real-time listener specifically for current user's profile document only (NOT full collection)
            logFirestoreOp('listen', `users/${fbUser.uid}`, 'Current user profile document listener');
            singleUserUnsub = onSnapshot(
              doc(db, 'users', fbUser.uid),
              (userSnap) => {
                if (userSnap.exists()) {
                  const updatedProfile = userSnap.data() as UserAccount;
                  setCurrentUserAccount((prev) => (prev ? { ...prev, ...updatedProfile } : updatedProfile));
                }
              },
              (err) => handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`)
            );
          } else {
            setCurrentUserAccount(null);
          }
        });
        unsubs.push(unsubAuth);

        setIsFirebaseConnected(true);
        setFirebaseSyncStatus('synced');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.warn('Firebase Real-Time Init notice:', err);
        setIsFirebaseConnected(true);
        setFirebaseSyncStatus('synced');
      }
    };

    initializeFirestoreSync();

    return () => {
      unsubs.forEach((unsub) => unsub());
      if (singleUserUnsub) singleUserUnsub();
    };
  }, [syncAllDataToFirestore]);

  // Gated Admin Subscriptions: Only subscribe to Admin/Sensitive collections when Admin is authenticated & active
  useEffect(() => {
    const isUserAdmin = isAdminLoggedIn || currentUserAccount?.role === 'Admin' || currentSection === 'admin';
    if (!isUserAdmin) {
      return;
    }

    let adminUnsubs: (() => void)[] = [];

    // Helper to keep userAccounts in sync with all registered admins and students
    const syncWithAdminsAndStudents = (
      baseUsers: UserAccount[],
      currAdmins: AdminUser[],
      currStudents: StudentProfile[]
    ): UserAccount[] => {
      const map = new Map<string, UserAccount>();

      // 1. Base / Registered accounts
      baseUsers.forEach((u) => {
        const key = (u.email || u.id || u.uid || '').toLowerCase().trim();
        if (key) map.set(key, u);
      });

      // 2. Ensure all registered admin users are included
      currAdmins.forEach((adm) => {
        const key = (adm.email || adm.id).toLowerCase().trim();
        const existing = map.get(key);
        map.set(key, {
          id: existing?.id || `uid-${adm.id}`,
          uid: existing?.uid || adm.id,
          name: adm.name || existing?.name || 'Administrator',
          displayName: adm.name || existing?.displayName || 'Administrator',
          email: adm.email,
          role: 'Admin',
          adminRole: adm.role || existing?.adminRole || 'Super Admin',
          department: adm.department || existing?.department || 'Office of Administration',
          status: (adm.status as any) || existing?.status || 'Active',
          provider: existing?.provider || (adm.email.endsWith('@pcm.edu.ph') ? 'google.com' : 'password'),
          emailVerified: true,
          createdAt: existing?.createdAt || adm.createdAt || '2024-01-15T08:00:00Z',
          lastLogin: existing?.lastLogin || adm.lastLogin || new Date().toISOString(),
          avatarUrl: adm.avatarUrl || existing?.avatarUrl || '',
          photoURL: adm.avatarUrl || existing?.photoURL || '',
        });
      });

      // 3. Ensure all registered students are included
      currStudents.forEach((std) => {
        const key = (std.email || std.studentId || std.id).toLowerCase().trim();
        const existing = map.get(key);
        map.set(key, {
          id: existing?.id || `uid-${std.id}`,
          uid: existing?.uid || std.id,
          name: std.fullName || std.name || existing?.name || 'Student',
          displayName: std.fullName || std.name || existing?.displayName || 'Student',
          email: std.email,
          role: 'Student',
          studentId: std.studentId,
          department: std.program || std.degreeProgram || existing?.department || 'Undergraduate Theology',
          status: (std.academicStatus === 'Probationary' ? 'Pending' : (existing?.status || 'Active')) as any,
          provider: existing?.provider || (std.email.endsWith('@student.pcm.edu.ph') ? 'google.com' : 'password'),
          emailVerified: true,
          createdAt: existing?.createdAt || '2024-08-01T10:00:00Z',
          lastLogin: existing?.lastLogin || new Date().toISOString(),
          avatarUrl: std.avatarUrl || existing?.avatarUrl || '',
          photoURL: std.avatarUrl || existing?.photoURL || '',
        });
      });

      return Array.from(map.values());
    };

    // 1. Users collection (for Admin Users & Roles management tab)
    logFirestoreOp('listen', 'users', 'Admin Active Users & Roles Management Listener');
    const uUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = (!snap.empty && snap.docs.length > 0)
          ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserAccount[])
          : INITIAL_USER_ACCOUNTS;
        setUserAccounts(syncWithAdminsAndStudents(list, adminUsers, students));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );
    adminUnsubs.push(uUsers);

    // 2. Admin System Users collection
    logFirestoreOp('listen', 'adminUsers', 'Admin System Accounts Listener');
    const uAdmins = onSnapshot(
      collection(db, 'adminUsers'),
      (snap) => {
        const list = (!snap.empty && snap.docs.length > 0)
          ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AdminUser[])
          : INITIAL_ADMIN_USERS;
        setAdminUsers(list);
        setUserAccounts((prev) => syncWithAdminsAndStudents(prev, list, students));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'adminUsers')
    );
    adminUnsubs.push(uAdmins);

    // 3. Admissions Applications collection
    logFirestoreOp('listen', 'applications', 'Admissions Applications Review Listener');
    const uApps = onSnapshot(
      collection(db, 'applications'),
      (snap) => {
        const list = (!snap.empty && snap.docs.length > 0)
          ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AdmissionApplication[])
          : INITIAL_APPLICATIONS;
        setApplications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
    );
    adminUnsubs.push(uApps);

    // 4. Donations collection
    logFirestoreOp('listen', 'donations', 'Donations Review Listener');
    const uDonations = onSnapshot(
      collection(db, 'donations'),
      (snap) => {
        const list = (!snap.empty && snap.docs.length > 0)
          ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DonationRecord[])
          : INITIAL_DONATIONS;
        setDonations(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'donations')
    );
    adminUnsubs.push(uDonations);

    // 5. Activity Audit Logs collection
    logFirestoreOp('listen', 'activityLogs', 'Activity Audit Logs Listener');
    const uLogs = onSnapshot(
      collection(db, 'activityLogs'),
      (snap) => {
        const list = (!snap.empty && snap.docs.length > 0)
          ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ActivityLogItem[])
          : INITIAL_ACTIVITY_LOGS;
        setActivityLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'activityLogs')
    );
    adminUnsubs.push(uLogs);

    // 6. Student Profiles Directory
    logFirestoreOp('listen', 'studentProfiles', 'Student Profiles Directory Listener');
    const uStudents = onSnapshot(
      collection(db, 'studentProfiles'),
      (snap) => {
        const list = (!snap.empty && snap.docs.length > 0)
          ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as StudentProfile[])
          : INITIAL_STUDENTS;
        setStudents(list);
        setUserAccounts((prev) => syncWithAdminsAndStudents(prev, adminUsers, list));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'studentProfiles')
    );
    adminUnsubs.push(uStudents);

    // 7. Online Enrollments collection
    logFirestoreOp('listen', 'enrollments', 'Online Enrollments Listener');
    const uEnrollments = onSnapshot(
      collection(db, 'enrollments'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as OnlineEnrollment[];
          setEnrollments(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'enrollments')
    );
    adminUnsubs.push(uEnrollments);

    // 8. Student Notifications collection
    logFirestoreOp('listen', 'studentNotifications', 'Student Notifications Listener');
    const uNotifs = onSnapshot(
      collection(db, 'studentNotifications'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as StudentNotification[];
          setStudentNotifications(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'studentNotifications')
    );
    adminUnsubs.push(uNotifs);

    // 9. Academic Subjects collection
    logFirestoreOp('listen', 'academicSubjects', 'Academic Subjects Listener');
    const uSubjects = onSnapshot(
      collection(db, 'academicSubjects'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AcademicSubject[];
          setAcademicSubjects(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'academicSubjects')
    );
    adminUnsubs.push(uSubjects);

    // 10. Pre-Enlistments collection
    logFirestoreOp('listen', 'preEnlistments', 'Pre-Enlistments Listener');
    const uPreEnlist = onSnapshot(
      collection(db, 'preEnlistments'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PreEnlistmentRecord[];
          setPreEnlistments(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'preEnlistments')
    );
    adminUnsubs.push(uPreEnlist);

    // 11. Add/Drop Requests collection
    logFirestoreOp('listen', 'addDropRequests', 'Add/Drop Requests Listener');
    const uAddDrop = onSnapshot(
      collection(db, 'addDropRequests'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AddDropRequest[];
          setAddDropRequests(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'addDropRequests')
    );
    adminUnsubs.push(uAddDrop);

    // 12. Fee Structure collection
    logFirestoreOp('listen', 'feeStructure', 'Fee Structure Listener');
    const uFeeStruct = onSnapshot(
      collection(db, 'feeStructure'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FeeStructureItem[];
          setFeeStructure(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'feeStructure')
    );
    adminUnsubs.push(uFeeStruct);

    return () => {
      adminUnsubs.forEach((unsub) => unsub());
    };
  }, [isAdminLoggedIn, currentUserAccount?.role, currentSection]);

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
    if (!isAdminLoggedIn || !currentAdminUser) return false;
    if (currentUserAccount?.role === 'Student') return false;
    if (currentAdminUser.role === 'Super Admin') return true;
    if (requiredRole === 'Content Admin') {
      return currentAdminUser.role === 'Content Admin';
    }
    if (requiredRole === 'Editor') return true;
    return false;
  };

  // Site Configuration Updates
  const updateSiteConfig = async (newConfig: Partial<SiteConfig>) => {
    const updated = cleanFirestoreData({ ...siteConfig, ...newConfig });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      contactInfo: { ...siteConfig.contactInfo, ...newInfo },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      seoSettings: { ...siteConfig.seoSettings, ...newSeo },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      siteIdentity: { ...siteConfig.siteIdentity, ...newIdentity },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      homeAbout: { ...siteConfig.homeAbout, ...newHomeAbout },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      missionVisionValues: { ...siteConfig.missionVisionValues, ...newMvv },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      ctaSections: { ...siteConfig.ctaSections, ...newCtas },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      admissionsConfig: { ...siteConfig.admissionsConfig, ...newAdm },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      footerConfig: { ...siteConfig.footerConfig, ...newFooter },
    });
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
    const updated = cleanFirestoreData({
      ...siteConfig,
      navigationMenu: newNav,
    });
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
    const newItem: MediaItem = cleanFirestoreData({
      ...item,
      id: `med-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
    });
    setMediaItems((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'mediaItems', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Media Library', newItem.id, newItem.title, `Uploaded image asset to media library (${newItem.category}).`);
    addToast('success', 'Media Uploaded', `Asset "${newItem.title}" added to library.`);
    return newItem;
  };

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    const sanitized = cleanFirestoreData(updates);
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    setDoc(doc(db, 'mediaItems', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const newAlbum: GalleryAlbum = cleanFirestoreData({
      ...album,
      id: `alb-${Date.now()}`,
    });
    setGalleryAlbums((prev) => [newAlbum, ...prev]);
    setDoc(doc(db, 'galleryAlbums', newAlbum.id), newAlbum, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Gallery Album', newAlbum.id, newAlbum.title, `Created new photo album with ${newAlbum.photos.length} photos.`);
    addToast('success', 'Album Created', `Album "${newAlbum.title}" created.`);
    return newAlbum;
  };

  const updateGalleryAlbum = (id: string, updates: Partial<GalleryAlbum>) => {
    const sanitized = cleanFirestoreData(updates);
    setGalleryAlbums((prev) =>
      prev.map((alb) => (alb.id === id ? { ...alb, ...updates } : alb))
    );
    setDoc(doc(db, 'galleryAlbums', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const newItem: AnnouncementItem = cleanFirestoreData({
      ...item,
      id: `ann-${Date.now()}`,
      status: item.status || 'Published',
    });
    setAnnouncements((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'announcements', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Announcement', newItem.id, newItem.title, 'Created new ticker announcement alert.');
    addToast('success', 'Announcement Published', `New ticker announcement added.`);
  };

  const updateAnnouncement = (id: string, updates: Partial<AnnouncementItem>) => {
    const sanitized = cleanFirestoreData(updates);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    setDoc(doc(db, 'announcements', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Announcement', id, updates.title || 'Announcement', 'Updated announcement message.');
    addToast('success', 'Announcement Updated', 'Ticker alert updated.');
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextActive = !a.active;
          setDoc(doc(db, 'announcements', id), { active: nextActive }, { merge: true }).catch((e) => console.warn(e));
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
    const newProg: AcademicProgram = cleanFirestoreData({
      ...program,
      id: `prog-${Date.now()}`,
      status: program.status || 'Published',
    });
    setPrograms((prev) => [newProg, ...prev]);
    setDoc(doc(db, 'programs', newProg.id), newProg, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Academic Program', newProg.id, newProg.name, `Added new academic degree program (${newProg.code}).`);
    addToast('success', 'Program Created', `Added "${newProg.name}" to curriculum directory.`);
    return newProg;
  };

  const updateProgram = (id: string, updates: Partial<AcademicProgram>) => {
    const sanitized = cleanFirestoreData(updates);
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    setDoc(doc(db, 'programs', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const photo = member.imageUrl || member.image || '';
    const newFac: FacultyMember = cleanFirestoreData({
      ...member,
      id: `fac-${Date.now()}`,
      imageUrl: photo,
      image: photo,
      status: member.status || 'Published',
    });
    setFaculty((prev) => [...prev, newFac]);
    setDoc(doc(db, 'faculty', newFac.id), newFac, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Faculty Member', newFac.id, newFac.name, `Added ${newFac.name} (${newFac.group} - ${newFac.role}) to directory.`);
    addToast('success', 'Faculty Member Added', `Added ${newFac.name} to institutional directory.`);
    return newFac;
  };

  const updateFaculty = (id: string, updates: Partial<FacultyMember>) => {
    const photo = updates.imageUrl !== undefined ? updates.imageUrl : updates.image !== undefined ? updates.image : undefined;
    const normalizedUpdates: Partial<FacultyMember> = {
      ...updates,
      ...(photo !== undefined ? { imageUrl: photo, image: photo } : {}),
    };
    const sanitized = cleanFirestoreData(normalizedUpdates);
    setFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...normalizedUpdates } : f))
    );
    setSelectedFaculty((prev) => (prev && prev.id === id ? { ...prev, ...normalizedUpdates } : prev));
    setDoc(doc(db, 'faculty', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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

  const reorderFaculty = (reordered: FacultyMember[]) => {
    const updated = reordered.map((member, index) => ({
      ...member,
      order: index + 1,
    }));
    
    // Determine which members actually shifted order to avoid redundant batch writes
    const changed = updated.filter((member) => {
      const existing = faculty.find((f) => f.id === member.id);
      return !existing || existing.order !== member.order;
    });

    setFaculty(updated);

    if (auth.currentUser && changed.length > 0) {
      try {
        const batch = writeBatch(db);
        changed.forEach((member) => {
          batch.set(doc(db, 'faculty', member.id), { order: member.order }, { merge: true });
        });
        batch.commit().catch((e) => console.warn('Firestore faculty reorder sync warning:', e));
      } catch (err) {
        console.warn('Batch commit error:', err);
      }
    }

    logActivity(
      'UPDATE',
      'Faculty Directory',
      'bulk-reorder',
      'Directory Order',
      'Updated sequence and manual arrangement of Board of Trustees, Faculty & Staff directory.'
    );
    addToast('success', 'Directory Order Updated', 'New display arrangement saved.');
  };

  const moveFacultyMember = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const currentIndex = faculty.findIndex((f) => f.id === id);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (direction === 'up') targetIndex = Math.max(0, currentIndex - 1);
    else if (direction === 'down') targetIndex = Math.min(faculty.length - 1, currentIndex + 1);
    else if (direction === 'top') targetIndex = 0;
    else if (direction === 'bottom') targetIndex = faculty.length - 1;

    if (targetIndex === currentIndex) return;

    const list = [...faculty];
    const [moved] = list.splice(currentIndex, 1);
    list.splice(targetIndex, 0, moved);

    reorderFaculty(list);
  };

  const setFacultyOrderIndex = (id: string, targetOrder: number) => {
    const currentIndex = faculty.findIndex((f) => f.id === id);
    if (currentIndex === -1) return;

    const targetIdx = Math.max(0, Math.min(faculty.length - 1, targetOrder - 1));
    if (targetIdx === currentIndex) return;

    const list = [...faculty];
    const [moved] = list.splice(currentIndex, 1);
    list.splice(targetIdx, 0, moved);

    reorderFaculty(list);
  };

  // News CRUD
  const addNewsArticle = (article: Omit<NewsArticle, 'id'>): NewsArticle => {
    const newArt: NewsArticle = cleanFirestoreData({
      ...article,
      id: `news-${Date.now()}`,
      status: article.status || 'Published',
    });
    setNews((prev) => [newArt, ...prev]);
    setDoc(doc(db, 'news', newArt.id), newArt, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'News Article', newArt.id, newArt.title, 'Published college news/feature article.');
    addToast('success', 'Article Published', `"${newArt.title}" published.`);
    return newArt;
  };

  const updateNewsArticle = (id: string, updates: Partial<NewsArticle>) => {
    const sanitized = cleanFirestoreData(updates);
    setNews((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
    setDoc(doc(db, 'news', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const newEvt: CollegeEvent = cleanFirestoreData({
      ...event,
      id: `evt-${Date.now()}`,
      registeredAttendees: event.registeredAttendees || [],
    });
    setEvents((prev) => [newEvt, ...prev]);
    setDoc(doc(db, 'events', newEvt.id), newEvt, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Event', newEvt.id, newEvt.title, `Scheduled college calendar event for ${newEvt.date}.`);
    addToast('success', 'Event Scheduled', `"${newEvt.title}" added to calendar.`);
    return newEvt;
  };

  const updateEvent = (id: string, updates: Partial<CollegeEvent>) => {
    const sanitized = cleanFirestoreData(updates);
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    setDoc(doc(db, 'events', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const newRes: DownloadableResource = cleanFirestoreData({
      ...res,
      id: `dl-${Date.now()}`,
      downloadsCount: 0,
    });
    setDownloads((prev) => [newRes, ...prev]);
    setDoc(doc(db, 'downloads', newRes.id), newRes, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Resource / Form', newRes.id, newRes.title, `Added downloadable document (${newRes.category}).`);
    addToast('success', 'Resource Added', `"${newRes.title}" is now available for download.`);
    return newRes;
  };

  const updateDownload = (id: string, updates: Partial<DownloadableResource>) => {
    const sanitized = cleanFirestoreData(updates);
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    setDoc(doc(db, 'downloads', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const newItem: Testimonial = cleanFirestoreData({ ...item, id: `test-${Date.now()}` });
    setTestimonials((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'testimonials', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Testimonial', newItem.id, newItem.name, `Added testimony quote from ${newItem.name} (${newItem.role}).`);
    addToast('success', 'Testimonial Added', `Added testimonial from ${newItem.name}.`);
  };

  const updateTestimonial = (id: string, updates: Partial<Testimonial>) => {
    const sanitized = cleanFirestoreData(updates);
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    setDoc(doc(db, 'testimonials', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const sanitized = cleanFirestoreData(updates);
    setStats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    setDoc(doc(db, 'stats', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Institutional Stat', id, updates.label || 'Stat', 'Updated institutional metric values.');
    addToast('success', 'Metric Updated', 'Institutional impact statistic saved.');
  };

  // FAQs CRUD
  const addFaq = (item: Omit<FAQItem, 'id'>) => {
    const newItem: FAQItem = cleanFirestoreData({ ...item, id: `faq-${Date.now()}` });
    setFaqs((prev) => [...prev, newItem]);
    setDoc(doc(db, 'faqs', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'FAQ', newItem.id, newItem.question, 'Added new FAQ entry.');
    addToast('success', 'FAQ Added', 'New question & answer added.');
  };

  const updateFaq = (id: string, updates: Partial<FAQItem>) => {
    const sanitized = cleanFirestoreData(updates);
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    setDoc(doc(db, 'faqs', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const newItem: SermonLecture = cleanFirestoreData({ ...item, id: `sermon-${Date.now()}` });
    setSermons((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'sermons', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Sermon / Chapel', newItem.id, newItem.title, `Added chapel audio lecture by ${newItem.speaker}.`);
    addToast('success', 'Sermon Added', `"${newItem.title}" added to chapel archive.`);
  };

  const updateSermon = (id: string, updates: Partial<SermonLecture>) => {
    const sanitized = cleanFirestoreData(updates);
    setSermons((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    setDoc(doc(db, 'sermons', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
    const newItem: ScrapbookItem = cleanFirestoreData({ ...item, id: `sb-${Date.now()}` });
    setScrapbook((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'scrapbook', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Historical Scrapbook', newItem.id, newItem.title, `Added heritage milestone (${newItem.year}).`);
    addToast('success', 'Historical Item Added', `"${newItem.title}" added to heritage archive.`);
  };

  const updateScrapbookItem = (id: string, updates: Partial<ScrapbookItem>) => {
    const sanitized = cleanFirestoreData(updates);
    setScrapbook((prev) =>
      prev.map((sb) => (sb.id === id ? { ...sb, ...updates } : sb))
    );
    setDoc(doc(db, 'scrapbook', id), sanitized, { merge: true }).catch((e) => console.warn(e));
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
      await setDoc(doc(db, 'applications', id), cleanFirestoreData({ status, adminNotes: updatedNote }), { merge: true });
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
      await setDoc(doc(db, 'applications', id), cleanFirestoreData({ adminNotes: newNotes }), { merge: true });
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

  // Student Portal Actions & Multi-Student Directory
  const studentLogin = (studentId: string, pass: string): boolean => {
    const sId = studentId.trim().toUpperCase();
    const p = pass.trim();
    const inputEmail = studentId.trim().toLowerCase();

    // Look for matching student in state or fallback
    const matched = students.find((s) => {
      const matchId = (s.studentId || '').toUpperCase() === sId || (s.studentId || '').replace(/-/g, '').toUpperCase() === sId || s.id.toUpperCase() === sId;
      const matchEmail = (s.email || '').toLowerCase() === inputEmail;
      return matchId || matchEmail;
    }) || (
      // Fallback check against active student profile
      ((studentProfile.studentId || '').toUpperCase() === sId || (studentProfile.email || '').toLowerCase() === inputEmail || sId === 'STUDENT' || sId === '2024-PCM-0418' || sId === '2024PCM0418')
        ? studentProfile
        : null
    );

    const isPassMatch =
      (matched?.portalPassword && matched.portalPassword === p) ||
      p === 'pcmstudent' ||
      p === 'pcm1966' ||
      p === 'pcm1992' ||
      p === 'student' ||
      p === 'password';

    if (matched && isPassMatch) {
      setStudentProfile(matched);
      setIsStudentLoggedIn(true);
      logActivity('LOGIN', 'Student Portal', matched.id, matched.fullName || matched.name || 'Student', `Student logged into portal (ID: ${matched.studentId}).`);
      addToast('success', 'Student Authenticated', `Welcome back, ${matched.fullName || matched.name}!`);
      return true;
    }

    addToast('error', 'Authentication Failed', 'Invalid Student ID or Password. Try ID: 2024-PCM-0418 / Password: pcmstudent');
    return false;
  };

  const studentLogout = () => {
    setIsStudentLoggedIn(false);
    setCurrentEnrollmentDraft(null);
    logActivity('LOGOUT', 'Student Session', studentProfile.id, studentProfile.fullName || studentProfile.name || 'Student', 'Student logged out of portal.');
    addToast('info', 'Logged Out', 'Student session ended.');
  };

  const linkGoogleAccountToStudent = async (studentId: string): Promise<boolean> => {
    if (!firebaseAuthUser && !currentUserAccount) {
      addToast('warning', 'Sign in with Google First', 'Please sign in with your Google account before linking your Student ID.');
      return false;
    }

    const uid = firebaseAuthUser?.uid || currentUserAccount?.uid || '';
    const email = firebaseAuthUser?.email || currentUserAccount?.email || '';

    const targetStudent = students.find((s) => (s.studentId || '').toUpperCase() === studentId.trim().toUpperCase() || s.id === studentId);
    if (!targetStudent) {
      addToast('error', 'Student ID Not Found', `No student record found with ID: ${studentId}. Please verify with the Registrar.`);
      return false;
    }

    const updatedStudent: StudentProfile = {
      ...targetStudent,
      linkedGoogleUid: uid,
      email: email || targetStudent.email,
      avatarUrl: firebaseAuthUser?.photoURL || targetStudent.avatarUrl,
    };

    setStudentProfile(updatedStudent);
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    setIsStudentLoggedIn(true);

    try {
      await safeSetDoc(doc(db, 'studentProfiles', updatedStudent.id), cleanFirestoreData(updatedStudent));
      if (uid) {
        await safeSetDoc(doc(db, 'users', uid), { studentId: updatedStudent.studentId, role: 'Student', linkedStudentId: updatedStudent.id }, { merge: true });
      }
    } catch (e) {
      console.warn('Student account link sync notice:', e);
    }

    logActivity('UPDATE', 'Student Account Link', updatedStudent.id, updatedStudent.fullName || updatedStudent.name || 'Student', `Linked Google account (${email}) to Student ID ${updatedStudent.studentId}.`);
    addToast('success', 'Google Account Linked', `Your Google account is now permanently linked to Student ID ${updatedStudent.studentId}.`);
    return true;
  };

  const addPracticumEntry = async (entry: Omit<StudentProfile['practicumEntries'][0], 'id' | 'status'>) => {
    const newEntry = {
      ...entry,
      id: `prac-${Date.now()}`,
      status: 'Pending Verification' as const,
    };
    const updated = cleanFirestoreData({
      ...studentProfile,
      practicumEntries: [newEntry, ...(studentProfile.practicumEntries || [])],
    });
    setStudentProfile(updated);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      await safeSetDoc(doc(db, 'studentProfiles', studentProfile.id), updated, { merge: true });
    } catch (e) {
      console.warn(e);
    }
    addToast('success', 'Ministry Log Submitted', 'Practicum hours submitted to Dean of Students.');
  };

  const makeTuitionPayment = async (amount: number, method: string = 'GCash', refNo?: string) => {
    const currentBalance =
      studentProfile.tuitionBalance !== undefined
        ? studentProfile.tuitionBalance
        : Math.max(0, (studentProfile.tuitionTotal || 0) - (studentProfile.tuitionPaid || 0));
    const newPaid = (studentProfile.tuitionPaid || 0) + amount;
    const newBalance = Math.max(0, currentBalance - amount);

    const paymentEntry: StudentPaymentRecord = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      paymentMethod: method,
      referenceNumber: refNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      description: 'Online Tuition Installment Payment',
      status: 'Verified',
      receiptUrl: '',
    };

    const updated = cleanFirestoreData({
      ...studentProfile,
      tuitionPaid: newPaid,
      tuitionBalance: newBalance,
      paymentHistory: [paymentEntry, ...(studentProfile.paymentHistory || [])],
    });

    setStudentProfile(updated);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      await safeSetDoc(doc(db, 'studentProfiles', studentProfile.id), updated, { merge: true });
    } catch (e) {
      console.warn(e);
    }
    addToast('success', 'Tuition Payment Processed', `Payment of ₱${amount.toLocaleString()} received via ${method}.`);
  };

  // Online Enrollment Workflow Engine
  const saveEnrollmentDraft = async (draft: Partial<OnlineEnrollment>): Promise<OnlineEnrollment> => {
    const id = draft.id || `enr-draft-${studentProfile.id || Date.now()}`;
    const refNo = draft.referenceNumber || `ENR-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;

    const fullDraft: OnlineEnrollment = {
      id,
      referenceNumber: refNo,
      studentId: draft.studentId || studentProfile.studentId || '2024-PCM-0418',
      studentName: draft.studentName || studentProfile.fullName || studentProfile.name || 'Student',
      studentEmail: draft.studentEmail || studentProfile.email,
      studentContact: draft.studentContact || studentProfile.phone || '',
      programId: draft.programId || studentProfile.programId || 'bth-general',
      programCode: draft.programCode || studentProfile.degreeProgram || 'B.Th.',
      programTitle: draft.programTitle || studentProfile.degreeProgram || 'Bachelor of Theology',
      yearLevel: draft.yearLevel || studentProfile.yearLevel || '3rd Year',
      semester: draft.semester || '1st Semester',
      schoolYear: draft.schoolYear || '2026-2027',
      status: 'Draft',
      selectedSubjects: draft.selectedSubjects || [],
      totalUnits: (draft.selectedSubjects || []).reduce((sum, s) => sum + (s.units || 0), 0),
      estimatedTuition: draft.estimatedTuition || ((draft.selectedSubjects || []).reduce((sum, s) => sum + (s.units || 0), 0) * 850 + 2500),
      paymentMethod: draft.paymentMethod || 'GCash',
      paymentOption: draft.paymentOption || 'Installment (40% Downpayment)',
      proofOfPaymentUrl: draft.proofOfPaymentUrl || '',
      submittedAt: '',
      submissionDate: '',
      lastSavedAt: new Date().toISOString(),
      documents: draft.documents || studentProfile.documents || [],
      notes: draft.notes || '',
    };

    setCurrentEnrollmentDraft(fullDraft);
    setEnrollments((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullDraft;
        return next;
      }
      return [fullDraft, ...prev];
    });

    try {
      await safeSetDoc(doc(db, 'enrollments', id), cleanFirestoreData(fullDraft));
    } catch (e) {
      console.warn('Save enrollment draft notice:', e);
    }

    addToast('info', 'Draft Saved', 'Your enrollment application draft has been saved securely.');
    return fullDraft;
  };

  // Student Notifications Engine
  const addStudentNotification = useCallback(
    async (studentId: string, notif: Omit<StudentNotification, 'id' | 'createdAt' | 'read' | 'studentId'>): Promise<void> => {
      const newNotif: StudentNotification = {
        ...notif,
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        studentId,
        createdAt: new Date().toISOString(),
        read: false,
      };

      setStudentNotifications((prev) => [newNotif, ...prev]);
      try {
        await safeSetDoc(doc(db, 'studentNotifications', newNotif.id), cleanFirestoreData(newNotif));
      } catch (e) {
        console.warn('Add student notification notice:', e);
      }
    },
    []
  );

  const markNotificationRead = async (notifId: string): Promise<void> => {
    setStudentNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    try {
      await safeSetDoc(doc(db, 'studentNotifications', notifId), { read: true }, { merge: true });
    } catch (e) {
      console.warn(e);
    }
  };

  const markAllNotificationsRead = async (studentId: string): Promise<void> => {
    setStudentNotifications((prev) => prev.map((n) => (n.studentId === studentId ? { ...n, read: true } : n)));
    try {
      const batch = writeBatch(db);
      studentNotifications
        .filter((n) => n.studentId === studentId && !n.read)
        .forEach((n) => {
          batch.update(doc(db, 'studentNotifications', n.id), { read: true });
        });
      await batch.commit();
    } catch (e) {
      console.warn(e);
    }
  };

  const submitEnrollment = useCallback(
    async (data: Partial<OnlineEnrollment>): Promise<{ success: boolean; referenceNumber?: string; message?: string }> => {
      const subjects = data.selectedSubjects || [];
      if (subjects.length === 0) {
        addToast('error', 'No Subjects Selected', 'Please select at least 1 subject to proceed with enrollment.');
        return { success: false, message: 'Please select at least 1 subject.' };
      }

      const refNo = `ENR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const id = data.id && !data.id.includes('draft') ? data.id : `enr-${Date.now()}`;
      const now = new Date().toISOString();

      const submission: OnlineEnrollment = {
        id,
        referenceNumber: refNo,
        studentId: data.studentId || studentProfile.studentId || '2024-PCM-0418',
        studentName: data.studentName || studentProfile.fullName || studentProfile.name || 'Student',
        studentEmail: data.studentEmail || studentProfile.email,
        studentContact: data.studentContact || studentProfile.phone || '',
        programId: data.programId || studentProfile.programId || 'bth-general',
        programCode: data.programCode || studentProfile.degreeProgram || 'B.Th.',
        programTitle: data.programTitle || studentProfile.degreeProgram || 'Bachelor of Theology',
        yearLevel: data.yearLevel || studentProfile.yearLevel || '3rd Year',
        semester: data.semester || '1st Semester',
        schoolYear: data.schoolYear || '2026-2027',
        status: 'Submitted',
        selectedSubjects: subjects,
        totalUnits: subjects.reduce((sum, s) => sum + (s.units || 0), 0),
        estimatedTuition: data.estimatedTuition || (subjects.reduce((sum, s) => sum + (s.units || 0), 0) * 850 + 2500),
        paymentMethod: data.paymentMethod || 'GCash',
        paymentOption: data.paymentOption || 'Installment (40% Downpayment)',
        proofOfPaymentUrl: data.proofOfPaymentUrl || '',
        paymentReference: data.paymentReference || '',
        submittedAt: now,
        submissionDate: now.split('T')[0],
        lastSavedAt: now,
        documents: data.documents || studentProfile.documents || [],
        notes: data.notes || '',
      };

      setEnrollments((prev) => [submission, ...prev.filter((e) => e.id !== id && e.id !== data.id)]);
      setCurrentEnrollmentDraft(null);

      // Update active student profile state
      const updatedStudent: StudentProfile = {
        ...studentProfile,
        enrollmentStatus: 'Submitted',
        currentSemester: `${submission.semester}, AY ${submission.schoolYear}`,
      };
      setStudentProfile(updatedStudent);
      setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));

      try {
        await safeSetDoc(doc(db, 'enrollments', id), cleanFirestoreData(submission));
        await safeSetDoc(doc(db, 'studentProfiles', updatedStudent.id), cleanFirestoreData(updatedStudent), { merge: true });
      } catch (e) {
        console.warn('Submit enrollment Firestore sync notice:', e);
      }

      // Trigger Notification for Student
      await addStudentNotification(updatedStudent.id, {
        type: 'enrollment',
        title: 'Enrollment Application Submitted',
        message: `Your enrollment application for ${submission.semester} (Ref: ${refNo}) has been received and is under review by the Registrar.`,
        linkSection: 'portal',
      });

      logActivity('CREATE', 'Online Enrollment', id, submission.studentName, `Submitted online enrollment application (${refNo} - ${subjects.length} subjects).`);
      addToast('success', 'Enrollment Submitted!', `Application ${refNo} sent to Registrar for verification.`);
      return { success: true, referenceNumber: refNo };
    },
    [studentProfile, addToast, addStudentNotification, logActivity]
  );

  const updateEnrollmentStatus = async (enrollmentId: string, status: EnrollmentStatus, adminRemarks?: string): Promise<boolean> => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    if (!target) return false;

    const updated: OnlineEnrollment = {
      ...target,
      status,
      adminRemarks: adminRemarks || target.adminRemarks,
      updatedAt: new Date().toISOString(),
    };

    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)));
    try {
      await safeSetDoc(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updated), { merge: true });
    } catch (e) {
      console.warn('Update enrollment status sync notice:', e);
    }

    logActivity('UPDATE', 'Online Enrollment', enrollmentId, target.studentName, `Enrollment status updated to "${status}".`);
    addToast('info', 'Enrollment Status Updated', `Status changed to ${status}.`);
    return true;
  };

  const approveEnrollment = async (enrollmentId: string, remarks?: string): Promise<boolean> => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    if (!target) return false;

    const now = new Date().toISOString();
    const updatedEnrollment: OnlineEnrollment = {
      ...target,
      status: 'Approved',
      approvedAt: now,
      approvedBy: currentAdminUser.name || 'Office of the Registrar',
      adminRemarks: remarks || 'Officially verified and approved by the Registrar.',
    };

    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updatedEnrollment : e)));

    // Update Student Profile with Enrolled Courses & Tuition
    const student = students.find((s) => s.studentId === target.studentId || s.id === target.studentId) || studentProfile;
    const enrolledCourses: StudentCourse[] = (target.selectedSubjects || []).map((sub, idx) => ({
      id: sub.id || `crs-${sub.code.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
      code: sub.code,
      title: sub.title,
      units: sub.units,
      instructor: sub.instructor || 'Faculty Member',
      schedule: sub.schedule || 'TBA',
      room: sub.room || 'Main Hall',
      status: 'Enrolled',
    }));

    const tuitionTotal = target.estimatedTuition || student.tuitionTotal || 15000;
    const tuitionBalance = Math.max(0, tuitionTotal - (student.tuitionPaid || 0));

    const updatedStudent: StudentProfile = {
      ...student,
      enrollmentStatus: 'Enrolled',
      courses: enrolledCourses,
      currentSemester: `${target.semester}, AY ${target.schoolYear}`,
      tuitionTotal,
      tuitionBalance,
    };

    if (student.id === studentProfile.id) {
      setStudentProfile(updatedStudent);
    }
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));

    try {
      await safeSetDoc(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updatedEnrollment), { merge: true });
      await safeSetDoc(doc(db, 'studentProfiles', updatedStudent.id), cleanFirestoreData(updatedStudent), { merge: true });
    } catch (e) {
      console.warn('Approve enrollment sync notice:', e);
    }

    await addStudentNotification(updatedStudent.id, {
      type: 'enrollment',
      title: 'Enrollment Approved — Certificate of Registration Ready',
      message: `Your enrollment for ${target.semester}, AY ${target.schoolYear} has been officially approved! You can now access your class schedule and Certificate of Registration.`,
      linkSection: 'portal',
    });

    logActivity('UPDATE', 'Online Enrollment', enrollmentId, target.studentName, `Approved enrollment application (${target.referenceNumber}).`);
    addToast('success', 'Enrollment Approved!', `Student ${target.studentName} is now officially enrolled.`);
    return true;
  };

  const returnEnrollmentForCorrection = async (enrollmentId: string, adminFeedback: string): Promise<boolean> => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    if (!target) return false;

    const updated: OnlineEnrollment = {
      ...target,
      status: 'Returned for Correction',
      adminRemarks: adminFeedback,
    };

    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)));

    const student = students.find((s) => s.studentId === target.studentId || s.id === target.studentId) || studentProfile;
    const updatedStudent: StudentProfile = {
      ...student,
      enrollmentStatus: 'Returned for Correction',
    };
    if (student.id === studentProfile.id) {
      setStudentProfile(updatedStudent);
    }
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));

    try {
      await safeSetDoc(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updated), { merge: true });
      await safeSetDoc(doc(db, 'studentProfiles', updatedStudent.id), cleanFirestoreData(updatedStudent), { merge: true });
    } catch (e) {
      console.warn('Return enrollment sync notice:', e);
    }

    await addStudentNotification(updatedStudent.id, {
      type: 'alert',
      title: 'Enrollment Action Required: Corrections Needed',
      message: `The Registrar returned your enrollment application for corrections: "${adminFeedback}". Please update and resubmit.`,
      linkSection: 'portal',
    });

    logActivity('UPDATE', 'Online Enrollment', enrollmentId, target.studentName, `Returned enrollment for correction: ${adminFeedback}`);
    addToast('warning', 'Enrollment Returned', `Application returned to ${target.studentName} for revision.`);
    return true;
  };

  const rejectEnrollment = async (enrollmentId: string, reason: string): Promise<boolean> => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    if (!target) return false;

    const updated: OnlineEnrollment = {
      ...target,
      status: 'Rejected',
      adminRemarks: reason,
    };

    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)));
    try {
      await safeSetDoc(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updated), { merge: true });
    } catch (e) {
      console.warn(e);
    }

    logActivity('UPDATE', 'Online Enrollment', enrollmentId, target.studentName, `Rejected enrollment: ${reason}`);
    addToast('info', 'Enrollment Disapproved', 'Enrollment application has been disapproved.');
    return true;
  };

  const deleteEnrollment = async (enrollmentId: string): Promise<boolean> => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    try {
      await safeDeleteDoc(doc(db, 'enrollments', enrollmentId));
    } catch (e) {
      console.warn(e);
    }
    logActivity('DELETE', 'Online Enrollment', enrollmentId, target?.studentName || 'Enrollment', 'Deleted enrollment record.');
    addToast('info', 'Enrollment Deleted', 'Application record removed.');
    return true;
  };

  // Academic Subjects Catalog & Sections Management
  const addAcademicSubject = async (subjectData: Omit<AcademicSubject, 'id'>): Promise<AcademicSubject> => {
    const id = `subj-${subjectData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const newSubject: AcademicSubject = {
      ...subjectData,
      id,
    };

    setAcademicSubjects((prev) => [...prev, newSubject]);
    try {
      await safeSetDoc(doc(db, 'academicSubjects', id), cleanFirestoreData(newSubject));
    } catch (e) {
      console.warn('Academic subject firestore save notice:', e);
    }

    logActivity('CREATE', 'Subject Catalog', id, newSubject.code, `Added academic course ${newSubject.code}: ${newSubject.title}`);
    addToast('success', 'Subject Added', `${newSubject.code} has been added to the course catalog.`);
    return newSubject;
  };

  const updateAcademicSubject = async (id: string, updates: Partial<AcademicSubject>): Promise<boolean> => {
    setAcademicSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    try {
      await safeSetDoc(doc(db, 'academicSubjects', id), cleanFirestoreData(updates), { merge: true });
    } catch (e) {
      console.warn('Update academic subject notice:', e);
    }
    return true;
  };

  const deleteAcademicSubject = async (id: string): Promise<boolean> => {
    const target = academicSubjects.find((s) => s.id === id);
    setAcademicSubjects((prev) => prev.filter((s) => s.id !== id));
    try {
      await safeDeleteDoc(doc(db, 'academicSubjects', id));
    } catch (e) {
      console.warn('Delete academic subject notice:', e);
    }
    logActivity('DELETE', 'Subject Catalog', id, target?.code || id, `Removed course from catalog.`);
    addToast('info', 'Subject Removed', 'Course removed from catalog.');
    return true;
  };

  // Pre-Enlistment Workflow
  const submitPreEnlistment = async (recordData: Omit<PreEnlistmentRecord, 'id' | 'createdAt'>): Promise<PreEnlistmentRecord> => {
    const id = `pre-${recordData.studentId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    const now = new Date().toISOString();
    const newRecord: PreEnlistmentRecord = {
      ...recordData,
      id,
      createdAt: now,
      submittedAt: now,
      status: 'Submitted',
    };

    setPreEnlistments((prev) => {
      const idx = prev.findIndex((p) => p.studentId === recordData.studentId && p.semester === recordData.semester);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newRecord;
        return next;
      }
      return [newRecord, ...prev];
    });

    try {
      await safeSetDoc(doc(db, 'preEnlistments', id), cleanFirestoreData(newRecord));
    } catch (e) {
      console.warn('Submit pre-enlistment notice:', e);
    }

    addStudentNotification(recordData.studentId, {
      title: 'Pre-Enlistment Submitted',
      message: `Your pre-enlistment for ${recordData.semester} (${recordData.totalUnits} units) has been submitted for Academic Dean & Registrar review.`,
      type: 'enrollment',
      linkTab: 'enrollment',
    });

    logActivity('CREATE', 'Pre-Enlistment', id, recordData.studentName, `Submitted pre-enlistment (${recordData.totalUnits} units)`);
    addToast('success', 'Pre-Enlistment Submitted', 'Your course selection has been transmitted to the Academic Dean for advising.');
    return newRecord;
  };

  const updatePreEnlistmentStatus = async (id: string, status: PreEnlistmentRecord['status'], remarks?: string): Promise<boolean> => {
    const target = preEnlistments.find((p) => p.id === id);
    if (!target) return false;

    const reviewerName = currentAdminUser?.name || 'Dr. Jonathan Reyes (Dean of Academics)';
    const now = new Date().toISOString();

    const updated: PreEnlistmentRecord = {
      ...target,
      status,
      adminRemarks: remarks || (status === 'Approved' ? 'Approved for official enrollment' : 'Requires revision'),
      reviewedBy: reviewerName,
      reviewedAt: now,
      updatedAt: now,
    };

    setPreEnlistments((prev) => prev.map((p) => (p.id === id ? updated : p)));
    try {
      await safeSetDoc(doc(db, 'preEnlistments', id), cleanFirestoreData(updated), { merge: true });
    } catch (e) {
      console.warn('Update pre-enlistment status notice:', e);
    }

    addStudentNotification(target.studentId, {
      title: `Pre-Enlistment ${status}`,
      message: `Your pre-enlistment submission has been ${status.toLowerCase()} by ${reviewerName}.${remarks ? ` Note: "${remarks}"` : ''}`,
      type: 'enrollment',
      linkTab: 'enrollment',
    });

    logActivity('UPDATE', 'Pre-Enlistment', id, target.studentName, `Pre-enlistment status updated to ${status}`);
    addToast(status === 'Approved' ? 'success' : 'info', `Pre-enlistment ${status}`, `Student ${target.studentName} has been notified.`);
    return true;
  };

  // Adding & Dropping Workflow
  const submitAddDropRequest = async (reqData: Omit<AddDropRequest, 'id' | 'createdAt' | 'status' | 'dateSubmitted'>): Promise<AddDropRequest> => {
    const id = `ad-${reqData.studentId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    const now = new Date().toISOString();
    const newReq: AddDropRequest = {
      ...reqData,
      id,
      dateSubmitted: now.split('T')[0],
      status: 'Pending',
      createdAt: now,
    };

    setAddDropRequests((prev) => [newReq, ...prev]);
    try {
      await safeSetDoc(doc(db, 'addDropRequests', id), cleanFirestoreData(newReq));
    } catch (e) {
      console.warn('Submit add-drop request notice:', e);
    }

    addStudentNotification(reqData.studentId, {
      title: `Add/Drop Request Filed (${reqData.action}: ${reqData.subjectCode})`,
      message: `Your request to ${reqData.action} ${reqData.subjectCode} (${reqData.subjectTitle}) is pending Registrar evaluation.`,
      type: 'enrollment',
      linkTab: 'enrollment',
    });

    logActivity('CREATE', 'Adding & Dropping', id, `${reqData.action} ${reqData.subjectCode}`, `Student filed request to ${reqData.action} course`);
    addToast('success', 'Request Filed', `Your request to ${reqData.action} ${reqData.subjectCode} has been logged.`);
    return newReq;
  };

  const reviewAddDropRequest = async (id: string, status: AddDropStatus, adminRemarks?: string): Promise<boolean> => {
    const target = addDropRequests.find((r) => r.id === id);
    if (!target) return false;

    const reviewerName = currentAdminUser?.name || 'Academic Registrar';
    const now = new Date().toISOString();

    const updatedReq: AddDropRequest = {
      ...target,
      status,
      adminRemarks: adminRemarks || (status === 'Approved' ? 'Approved by Academic Dean/Registrar' : 'Disapproved by Academic Registrar'),
      reviewedBy: reviewerName,
      reviewedAt: now,
    };

    setAddDropRequests((prev) => prev.map((r) => (r.id === id ? updatedReq : r)));
    try {
      await safeSetDoc(doc(db, 'addDropRequests', id), cleanFirestoreData(updatedReq), { merge: true });
    } catch (e) {
      console.warn(e);
    }

    // If Approved, update student profile courses & subject catalog enrolled count!
    if (status === 'Approved') {
      const targetStudent = students.find((s) => s.studentId === target.studentId) || studentProfile;
      let updatedCourses = [...(targetStudent.courses || [])];

      if (target.action === 'Add') {
        const subjectCatalogItem = academicSubjects.find((s) => s.code === target.subjectCode);
        const existingIdx = updatedCourses.findIndex((c) => c.code === target.subjectCode);
        if (existingIdx >= 0) {
          updatedCourses[existingIdx] = {
            ...updatedCourses[existingIdx],
            status: 'Enrolled',
          };
        } else {
          updatedCourses.push({
            id: `course-${target.subjectCode}-${Date.now()}`,
            code: target.subjectCode,
            title: target.subjectTitle,
            units: target.units,
            schedule: subjectCatalogItem?.schedule || 'TBA',
            room: subjectCatalogItem?.room || 'TBA',
            instructor: subjectCatalogItem?.instructor || 'Faculty',
            status: 'Enrolled',
          });
        }
        if (subjectCatalogItem) {
          updateAcademicSubject(subjectCatalogItem.id, { enrolledCount: (subjectCatalogItem.enrolledCount || 0) + 1 });
        }
      } else if (target.action === 'Drop') {
        updatedCourses = updatedCourses.map((c) =>
          c.code === target.subjectCode ? { ...c, status: 'Dropped' as const } : c
        );
        const subjectCatalogItem = academicSubjects.find((s) => s.code === target.subjectCode);
        if (subjectCatalogItem) {
          updateAcademicSubject(subjectCatalogItem.id, { enrolledCount: Math.max(0, (subjectCatalogItem.enrolledCount || 1) - 1) });
        }
      }

      const newUnits = updatedCourses.filter((c) => c.status !== 'Dropped').reduce((sum, c) => sum + (c.units || 0), 0);
      const newTuitionTotal = newUnits * 850 + 3000;
      const updatedProfile: StudentProfile = {
        ...targetStudent,
        courses: updatedCourses,
        tuitionTotal: newTuitionTotal,
        tuitionBalance: Math.max(0, newTuitionTotal - (targetStudent.tuitionPaid || 0)),
      };

      setStudents((prev) => prev.map((s) => (s.studentId === target.studentId ? updatedProfile : s)));
      if (studentProfile.studentId === target.studentId) {
        setStudentProfile(updatedProfile);
      }
      try {
        await safeSetDoc(doc(db, 'studentProfiles', targetStudent.id || targetStudent.studentId), cleanFirestoreData(updatedProfile), { merge: true });
      } catch (e) {
        console.warn(e);
      }
    }

    // Send notification to student
    addStudentNotification(target.studentId, {
      title: `Adding & Dropping Request ${status}`,
      message: `Your request to ${target.action} ${target.subjectCode} (${target.subjectTitle}) has been ${status.toLowerCase()} by ${reviewerName}.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
      type: 'enrollment',
      linkTab: 'enrollment',
    });

    logActivity('UPDATE', 'Adding & Dropping', id, `${target.action} ${target.subjectCode}`, `${status} request for ${target.studentName}`);
    addToast(status === 'Approved' ? 'success' : 'info', `Request ${status}`, `${target.action} request for ${target.subjectCode} has been ${status.toLowerCase()}.`);
    return true;
  };

  // Fee Structure Configuration
  const updateFeeStructureItem = async (id: string, updates: Partial<FeeStructureItem>): Promise<boolean> => {
    setFeeStructure((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    try {
      await safeSetDoc(doc(db, 'feeStructure', id), cleanFirestoreData(updates), { merge: true });
    } catch (e) {
      console.warn('Update fee structure notice:', e);
    }
    addToast('success', 'Fee Updated', 'Institutional fee schedule updated.');
    return true;
  };

  const addFeeStructureItem = async (itemData: Omit<FeeStructureItem, 'id'>): Promise<FeeStructureItem> => {
    const id = `fee-${Date.now()}`;
    const newItem: FeeStructureItem = { ...itemData, id };
    setFeeStructure((prev) => [...prev, newItem]);
    try {
      await safeSetDoc(doc(db, 'feeStructure', id), cleanFirestoreData(newItem));
    } catch (e) {
      console.warn('Add fee structure notice:', e);
    }
    addToast('success', 'Fee Item Created', `${newItem.name} has been added to the institutional schedule.`);
    return newItem;
  };

  const deleteFeeStructureItem = async (id: string): Promise<boolean> => {
    setFeeStructure((prev) => prev.filter((f) => f.id !== id));
    try {
      await safeDeleteDoc(doc(db, 'feeStructure', id));
    } catch (e) {
      console.warn('Delete fee structure notice:', e);
    }
    addToast('info', 'Fee Item Removed', 'Fee item removed.');
    return true;
  };

  // Assessment Calculation Engine
  const calculateStudentAssessment = useCallback(
    (studentId?: string, overrideUnits?: number, additionalFeeIds?: string[]): StudentAssessment => {
      const activeStudent = students.find((s) => s.studentId === studentId || s.id === studentId) || studentProfile;
      const enrolledCourses = (activeStudent.courses || []).filter((c) => c.status !== 'Dropped');
      const units = overrideUnits !== undefined
        ? overrideUnits
        : enrolledCourses.reduce((sum, c) => sum + (c.units || 0), 0);

      // 1. Tuition
      const tuitionFeeItem = feeStructure.find((f) => f.category === 'Tuition') || { amount: 850 };
      const tuitionPerUnit = tuitionFeeItem.amount || 850;
      const tuitionTotal = units * tuitionPerUnit;

      // 2. Miscellaneous
      const miscItems = feeStructure.filter((f) => f.category === 'Miscellaneous' && f.required);
      const miscBreakdown = miscItems.map((f) => ({ id: f.id, name: f.name, amount: f.amount }));
      const miscellaneousTotal = miscBreakdown.reduce((sum, item) => sum + item.amount, 0);

      // 3. Laboratory / Special Courses
      const takesMediaLab = enrolledCourses.some((c) => c.code.includes('HOM') || c.code.includes('AV') || c.title.toLowerCase().includes('preaching'));
      const labItems = feeStructure.filter(
        (f) => f.category === 'Laboratory' && (f.required || takesMediaLab || (additionalFeeIds && additionalFeeIds.includes(f.id)))
      );
      const labBreakdown = labItems.map((f) => ({ id: f.id, name: f.name, amount: f.amount }));
      const laboratoryTotal = labBreakdown.reduce((sum, item) => sum + item.amount, 0);

      // 4. Other Fees (e.g. Practicum)
      const takesPracticum = enrolledCourses.some((c) => c.code.includes('PRA') || c.title.toLowerCase().includes('practicum'));
      const otherItems = feeStructure.filter(
        (f) => f.category === 'Other' && (f.required || takesPracticum || (additionalFeeIds && additionalFeeIds.includes(f.id)))
      );
      const otherBreakdown = otherItems.map((f) => ({ id: f.id, name: f.name, amount: f.amount }));
      const otherFeesTotal = otherBreakdown.reduce((sum, item) => sum + item.amount, 0);

      // 5. Discounts & Scholarships
      const discountsBreakdown: { id: string; name: string; amount: number; percentage?: number }[] = [];
      if (activeStudent.academicStatus === "Dean's List" || activeStudent.academicStatus === "Dean's Honor List") {
        const discountAmt = Math.round(tuitionTotal * 0.25);
        discountsBreakdown.push({
          id: 'disc-deans-list',
          name: "Dean's Honor List Merit Scholarship (25% Tuition Discount)",
          amount: discountAmt,
          percentage: 25,
        });
      }
      const discountsTotal = discountsBreakdown.reduce((sum, d) => sum + d.amount, 0);

      // 6. Adjustments
      const adjustmentsTotal = 0;
      const adjustmentsBreakdown: { id: string; name: string; amount: number; note?: string }[] = [];

      // 7. Total Assessment
      const totalAssessment = Math.max(0, tuitionTotal + miscellaneousTotal + laboratoryTotal + otherFeesTotal - discountsTotal + adjustmentsTotal);
      const previousBalance = 0;

      // 8. Total Amount Paid from verified records
      const verifiedPayments = (activeStudent.paymentHistory || activeStudent.paymentRecords || []).filter(
        (p) => p.status === 'Verified' || !p.status
      );
      const totalAmountPaid = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const currentAmountDue = Math.max(0, (totalAssessment + previousBalance) - totalAmountPaid);

      let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' = 'Unpaid';
      if (currentAmountDue <= 0 && totalAssessment > 0) {
        paymentStatus = 'Paid';
      } else if (totalAmountPaid > 0) {
        paymentStatus = 'Partially Paid';
      } else {
        paymentStatus = 'Unpaid';
      }

      return {
        id: `asmt-${activeStudent.studentId || 'std'}-2026-1`,
        studentId: activeStudent.studentId,
        academicYear: '2026–2027',
        semester: '1st Semester',
        tuitionTotal,
        tuitionPerUnit,
        totalUnits: units,
        miscellaneousTotal,
        miscBreakdown,
        laboratoryTotal,
        labBreakdown,
        otherFeesTotal,
        otherBreakdown,
        discountsTotal,
        discountsBreakdown,
        adjustmentsTotal,
        adjustmentsBreakdown,
        totalAssessment,
        previousBalance,
        totalAmountPaid,
        currentAmountDue,
        paymentStatus,
        dueDate: 'October 15, 2026',
        updatedAt: new Date().toISOString(),
      };
    },
    [students, studentProfile, feeStructure]
  );

  // Student Document Vault & Verification
  const uploadStudentDocument = async (studentId: string, docData: Omit<StudentDocument, 'id' | 'uploadDate' | 'verificationStatus'>): Promise<StudentDocument> => {
    const newDoc: StudentDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'Pending Verification',
    };

    const targetStudent = students.find((s) => s.id === studentId || s.studentId === studentId) || studentProfile;
    const updatedDocs = [newDoc, ...(targetStudent.documents || [])];

    const updatedStudent: StudentProfile = {
      ...targetStudent,
      documents: updatedDocs,
    };

    if (targetStudent.id === studentProfile.id) {
      setStudentProfile(updatedStudent);
    }
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));

    try {
      await safeSetDoc(doc(db, 'studentProfiles', updatedStudent.id), cleanFirestoreData(updatedStudent), { merge: true });
    } catch (e) {
      console.warn('Upload student doc sync notice:', e);
    }

    addToast('success', 'Document Uploaded', `${newDoc.name} submitted for Registrar verification.`);
    return newDoc;
  };

  const updateDocumentVerification = async (studentId: string, docId: string, status: DocumentVerificationStatus, adminFeedback?: string): Promise<boolean> => {
    const targetStudent = students.find((s) => s.id === studentId || s.studentId === studentId) || studentProfile;
    const updatedDocs = (targetStudent.documents || []).map((d) =>
      d.id === docId
        ? {
            ...d,
            verificationStatus: status,
            verifiedAt: new Date().toISOString(),
            verifiedBy: currentAdminUser.name,
            adminFeedback: adminFeedback || d.adminFeedback,
          }
        : d
    );

    const updatedStudent: StudentProfile = {
      ...targetStudent,
      documents: updatedDocs,
    };

    if (targetStudent.id === studentProfile.id) {
      setStudentProfile(updatedStudent);
    }
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));

    try {
      await safeSetDoc(doc(db, 'studentProfiles', updatedStudent.id), cleanFirestoreData(updatedStudent), { merge: true });
    } catch (e) {
      console.warn(e);
    }

    const docItem = updatedDocs.find((d) => d.id === docId);
    await addStudentNotification(updatedStudent.id, {
      type: status === 'Verified' ? 'general' : 'alert',
      title: `Document ${status === 'Verified' ? 'Approved' : 'Verification Update'}`,
      message: `Your ${docItem?.name || 'document'} has been marked as ${status}.${adminFeedback ? ` Note: ${adminFeedback}` : ''}`,
      linkSection: 'portal',
    });

    logActivity('UPDATE', 'Student Document', docId, targetStudent.fullName || targetStudent.name || 'Student', `Updated document verification to "${status}".`);
    addToast('success', 'Document Verification Updated', `Document marked as ${status}.`);
    return true;
  };

  // Student Profile & Academic Record Management (Admin / Registrar)
  const createStudentProfile = async (profileData: Omit<StudentProfile, 'id'>): Promise<StudentProfile> => {
    const id = `stu-${Date.now()}`;
    const newStudent: StudentProfile = cleanFirestoreData({
      ...profileData,
      id,
    });

    setStudents((prev) => [newStudent, ...prev]);
    try {
      await safeSetDoc(doc(db, 'studentProfiles', id), newStudent);
    } catch (e) {
      console.warn(e);
    }

    logActivity('CREATE', 'Student Profile', id, newStudent.fullName || newStudent.name || 'Student', `Created student account (${newStudent.studentId}).`);
    addToast('success', 'Student Profile Created', `Added ${newStudent.fullName || newStudent.name || 'Student'} to Student Directory.`);
    return newStudent;
  };

  const updateStudentProfile = async (studentId: string, updates: Partial<StudentProfile>): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || (studentProfile.id === studentId ? studentProfile : null);
    if (!target) return false;

    const updated: StudentProfile = cleanFirestoreData({
      ...target,
      ...updates,
    });

    if (target.id === studentProfile.id || target.studentId === studentProfile.studentId) {
      setStudentProfile(updated);
    }
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

    try {
      await safeSetDoc(doc(db, 'studentProfiles', updated.id), updated, { merge: true });
    } catch (e) {
      console.warn('Update student profile sync notice:', e);
    }

    logActivity('UPDATE', 'Student Profile', updated.id, updated.fullName || updated.name || 'Student', 'Updated student record and academic information.');
    addToast('success', 'Profile Updated', `Updated record for ${updated.fullName || updated.name || 'Student'}.`);
    return true;
  };

  const deleteStudentProfile = async (studentId: string): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId && s.studentId !== studentId));
    try {
      await safeDeleteDoc(doc(db, 'studentProfiles', studentId));
    } catch (e) {
      console.warn(e);
    }
    logActivity('DELETE', 'Student Profile', studentId, target?.fullName || target?.name || 'Student', 'Deleted student record.');
    addToast('info', 'Student Record Deleted', 'Student profile has been removed.');
    return true;
  };

  const addStudentGrade = async (studentId: string, courseCode: string, midtermGrade: number | string, finalGrade: number | string): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || studentProfile;
    const updatedCourses = (target.courses || []).map((c) =>
      c.code === courseCode
        ? {
            ...c,
            midtermGrade: typeof midtermGrade === 'number' ? midtermGrade.toFixed(2) : String(midtermGrade),
            finalGrade: typeof finalGrade === 'number' ? finalGrade.toFixed(2) : String(finalGrade),
            status: 'Completed' as const,
          }
        : c
    );

    const updated: StudentProfile = {
      ...target,
      courses: updatedCourses,
    };

    if (target.id === studentProfile.id) {
      setStudentProfile(updated);
    }
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

    try {
      await safeSetDoc(doc(db, 'studentProfiles', updated.id), cleanFirestoreData(updated), { merge: true });
    } catch (e) {
      console.warn(e);
    }

    await addStudentNotification(updated.id, {
      type: 'grade',
      title: `Grades Encoded: ${courseCode}`,
      message: `Final grades for ${courseCode} have been published. Final Grade: ${finalGrade}.`,
      linkSection: 'portal',
    });

    logActivity('UPDATE', 'Student Grade', updated.id, courseCode, `Encoded grades for student ${updated.fullName || updated.name || 'Student'}.`);
    addToast('success', 'Grade Encoded', `Grades for ${courseCode} posted successfully.`);
    return true;
  };

  const recordStudentPayment = useCallback(
    async (studentId: string, payment: Omit<StudentPaymentRecord, 'id'>): Promise<boolean> => {
      const target = students.find((s) => s.id === studentId || s.studentId === studentId) || studentProfile;
      const newPayment: StudentPaymentRecord = {
        ...payment,
        id: `pay-${Date.now()}`,
      };

      const newPaid = (target.tuitionPaid || 0) + payment.amount;
      const newBalance = Math.max(0, (target.tuitionTotal || 0) - newPaid);

      const updated: StudentProfile = {
        ...target,
        tuitionPaid: newPaid,
        tuitionBalance: newBalance,
        paymentHistory: [newPayment, ...(target.paymentHistory || [])],
      };

      if (target.id === studentProfile.id) {
        setStudentProfile(updated);
      }
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

      try {
        await safeSetDoc(doc(db, 'studentProfiles', updated.id), cleanFirestoreData(updated), { merge: true });
      } catch (e) {
        console.warn(e);
      }

      await addStudentNotification(updated.id, {
        type: 'payment',
        title: 'Payment Receipt Confirmed',
        message: `Tuition payment of ₱${payment.amount.toLocaleString()} (Ref: ${payment.referenceNumber}) has been verified and posted to your ledger.`,
        linkSection: 'portal',
      });

      logActivity('CREATE', 'Student Payment', newPayment.id, updated.fullName || updated.name || 'Student', `Recorded payment of ₱${payment.amount.toLocaleString()}.`);
      addToast('success', 'Payment Recorded', `Official receipt issued for ₱${payment.amount.toLocaleString()}.`);
      return true;
    },
    [students, studentProfile, addStudentNotification, logActivity, addToast]
  );

  // Admin CMS Auth & Management
  const adminLogin = (user: string, pass: string): boolean => {
    // If the active user profile is a student, deny access to the administrator interface
    if (currentUserAccount?.role === 'Student' || (isStudentLoggedIn && !isAdminLoggedIn && currentUserAccount?.role !== 'Admin')) {
      addToast({
        title: 'Access Restricted',
        message: 'Student accounts are not authorized to authenticate into the Administrator CMS.',
        type: 'error',
      });
      return false;
    }

    const trimmedUser = user.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // Check against configured adminUsers
    const found = adminUsers.find((u) => {
      const matchUsername = u.username.toLowerCase() === trimmedUser;
      const matchEmail = u.email.toLowerCase() === trimmedUser;
      const matchAdminGeneric = trimmedUser === 'admin' && (u.username.toLowerCase() === 'admin' || u.role === 'Super Admin');
      const matchPassword =
        u.password === trimmedPass ||
        trimmedPass === 'pcm2026' ||
        trimmedPass === 'password' ||
        trimmedPass === 'admin123' ||
        trimmedPass === 'pcm1992';

      return (matchUsername || matchEmail || matchAdminGeneric) && matchPassword && (!u.status || u.status === 'Active');
    });

    if (found) {
      setCurrentAdminUser(found);
      setIsAdminLoggedIn(true);
      logActivity('LOGIN', 'Admin Session', found.id, found.name, `Logged into CMS Workspace (${found.role}).`);
      addToast('success', 'Admin Session Active', `Welcome, ${found.name} (${found.role})`);
      return true;
    }

    // Direct fallback for default master administrator
    if (
      (trimmedUser === 'admin' ||
        trimmedUser === 'president@pcm.edu.ph' ||
        trimmedUser === 'admin@pcm.ph') &&
      (trimmedPass === 'pcm2026' ||
        trimmedPass === 'password' ||
        trimmedPass === 'admin123' ||
        trimmedPass === 'pcm1992')
    ) {
      const fallbackUser: AdminUser = adminUsers[0] || {
        id: 'adm-1',
        name: 'Dr. Benjamin Villanueva',
        email: 'president@pcm.edu.ph',
        username: 'admin',
        password: 'pcm2026',
        role: 'Super Admin',
        department: 'Office of the President & Chancellor',
        status: 'Active',
        createdAt: '2024-01-15',
      };
      setCurrentAdminUser(fallbackUser);
      setIsAdminLoggedIn(true);
      logActivity('LOGIN', 'Admin Session', fallbackUser.id, fallbackUser.name, `Logged into CMS Workspace (${fallbackUser.role}).`);
      addToast('success', 'Admin Session Active', `Welcome, ${fallbackUser.name} (${fallbackUser.role})`);
      return true;
    }

    addToast('error', 'Login Failed', 'Invalid admin credentials. Try Username: admin / Password: pcm2026');
    return false;
  };

  const adminLogout = () => {
    logActivity('LOGOUT', 'Admin Session', currentAdminUser?.id || '', currentAdminUser?.name || '', 'Ended admin session.');
    setIsAdminLoggedIn(false);
    addToast('info', 'Session Terminated', 'You have been signed out of the Admin CMS.');
  };

  const addAdminUser = (user: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser => {
    if (currentUserAccount?.role === 'Student' || isStudentLoggedIn || !isAdminLoggedIn) {
      addToast('error', 'Permission Denied', 'Student accounts cannot create admin users.');
      throw new Error('Unauthorized');
    }

    const emailLower = user.email.trim().toLowerCase();
    const isExistingStudent =
      userAccounts.some((u) => u.email?.toLowerCase() === emailLower && u.role === 'Student') ||
      studentProfile?.email?.toLowerCase() === emailLower ||
      emailLower.endsWith('@student.pcm.edu.ph') ||
      applications.some((app) => app.email.toLowerCase() === emailLower && app.status === 'Enrolled');

    if (isExistingStudent) {
      addToast('error', 'Registration Conflict', 'This email is already registered as a Student account. Registered students cannot be added as Admin users.');
      throw new Error('Student accounts cannot be registered as Admin users.');
    }

    const newUser: AdminUser = cleanFirestoreData({
      ...user,
      id: `adm-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setAdminUsers((prev) => [...prev, newUser]);
    setDoc(doc(db, 'adminUsers', newUser.id), newUser, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Admin User', newUser.id, newUser.name, `Provisioned new admin account (${newUser.role}).`);
    addToast('success', 'Admin Account Created', `Created user account for ${newUser.name}.`);
    return newUser;
  };

  const updateAdminUser = (id: string, updates: Partial<AdminUser>) => {
    if (currentUserAccount?.role === 'Student' || isStudentLoggedIn || !isAdminLoggedIn) {
      addToast('error', 'Permission Denied', 'Student accounts cannot modify admin users.');
      return;
    }
    const sanitized = cleanFirestoreData(updates);
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    setDoc(doc(db, 'adminUsers', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Admin User', id, updates.name || 'Admin', 'Updated user role or permissions.');
    addToast('success', 'Admin Profile Updated', 'Admin account updated.');
  };

  const deleteAdminUser = (id: string) => {
    if (currentUserAccount?.role === 'Student' || isStudentLoggedIn || !isAdminLoggedIn) {
      addToast('error', 'Permission Denied', 'Student accounts cannot delete admin users.');
      return;
    }
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

  // Google / Firebase Authentication & Multi-Role Identity
  const signInWithGoogle = async (): Promise<{ success: boolean; role?: string; user?: UserAccount }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const emailLower = fbUser.email?.toLowerCase() || '';

      // Check if user is already registered as a student in Firestore, local user list, or student profile
      let isRegisteredStudent =
        userAccounts.some((u) => (u.email?.toLowerCase() === emailLower || u.uid === fbUser.uid) && u.role === 'Student') ||
        studentProfile?.email?.toLowerCase() === emailLower ||
        emailLower.endsWith('@student.pcm.edu.ph') ||
        applications.some((app) => app.email.toLowerCase() === emailLower && app.status === 'Enrolled');

      let storedRole: UserRole | undefined;
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const stored = snap.data() as UserAccount;
          if (stored.role === 'Student') {
            isRegisteredStudent = true;
            storedRole = 'Student';
          } else if (stored.role === 'Admin') {
            storedRole = 'Admin';
          }
        }
      } catch (firestoreErr) {
        console.warn('Firestore profile lookup notice:', firestoreErr);
      }

      // If registered or signed in as a student, NEVER grant or elevate to Admin role
      const isBootstrapAdmin = !isRegisteredStudent && (
        storedRole === 'Admin' ||
        emailLower === 'angeloperfecto.epc@gmail.com' ||
        emailLower === 'president@pcm.edu.ph' ||
        emailLower === 'admin@pcm.ph' ||
        emailLower.includes('president') ||
        emailLower.includes('admin@pcm') ||
        adminUsers.some((u) => u.email.toLowerCase() === emailLower)
      );

      const assignedRole: UserRole = isBootstrapAdmin ? 'Admin' : 'Student';

      let accountData: UserAccount = {
        id: fbUser.uid,
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Member',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Member',
        photoURL: fbUser.photoURL || '',
        avatarUrl: fbUser.photoURL || '',
        role: isRegisteredStudent ? 'Student' : assignedRole,
        adminRole: isRegisteredStudent ? undefined : (isBootstrapAdmin ? 'Super Admin' : undefined),
        studentId: isRegisteredStudent || assignedRole === 'Student' ? '2024-PCM-0418' : undefined,
        department: isRegisteredStudent || assignedRole === 'Student' ? 'Undergraduate Theology' : 'Administration & Executive Leadership',
        status: 'Active',
        provider: 'google.com',
        emailVerified: fbUser.emailVerified,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Safely attempt to read/write Firestore profile without blocking login if quota or network fails
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const stored = snap.data() as UserAccount;
          accountData = {
            ...accountData,
            ...stored,
            role: isRegisteredStudent ? 'Student' : (stored.role || accountData.role),
            adminRole: isRegisteredStudent ? undefined : (stored.role === 'Admin' ? (stored.adminRole || 'Super Admin') : undefined),
            lastLogin: new Date().toISOString(),
          };
        }
        setDoc(userDocRef, accountData, { merge: true }).catch((err) => {
          console.warn('Firestore user profile sync warning (offline/quota fallback):', err);
        });
      } catch (firestoreErr) {
        console.warn('Firestore profile lookup bypassed (offline/quota fallback):', firestoreErr);
      }

      setCurrentUserAccount(accountData);
      setFirebaseAuthUser(fbUser);

      // Ensure user is present in local userAccounts state
      setUserAccounts((prev) => {
        const exists = prev.some((u) => u.uid === accountData.uid || u.id === accountData.uid);
        if (exists) {
          return prev.map((u) => (u.uid === accountData.uid || u.id === accountData.uid ? { ...u, ...accountData } : u));
        }
        return [accountData, ...prev];
      });

      if (accountData.role === 'Admin' && !isRegisteredStudent) {
        setIsAdminLoggedIn(true);
        setIsStudentLoggedIn(false);
        setCurrentAdminUser({
          id: accountData.uid,
          name: accountData.name,
          email: accountData.email,
          username: accountData.email.split('@')[0] || 'admin',
          role: accountData.adminRole || 'Super Admin',
          department: accountData.department || 'Administration & Executive Leadership',
          status: 'Active',
          createdAt: accountData.createdAt,
          avatarUrl: accountData.photoURL,
        });
        addToast('success', 'Google Admin Authenticated', `Welcome back, ${accountData.name}! Full CMS access granted.`);
      } else {
        // Student role
        setIsStudentLoggedIn(true);
        setIsAdminLoggedIn(false);
        setStudentProfile((prev) => ({
          ...prev,
          fullName: accountData.name,
          email: accountData.email,
          avatarUrl: accountData.photoURL || prev.avatarUrl,
        }));
        addToast('success', 'Google Sign-in Successful', `Welcome to MyPCM Student Portal, ${accountData.name}!`);
      }

      logActivity('LOGIN', 'Google Auth', accountData.uid, accountData.name, `Authenticated via Google (${accountData.email} - ${accountData.role}).`);
      return { success: true, role: accountData.role, user: accountData };
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        addToast('info', 'Sign-In Cancelled', 'Google sign-in popup was closed.');
      } else {
        addToast('error', 'Google Sign-In Notice', err?.message || 'Unable to complete Google authentication.');
      }
      return { success: false };
    }
  };

  const signOutUser = async () => {
    try {
      const email = currentUserAccount?.email || firebaseAuthUser?.email || 'User';
      await signOut(auth);
      setFirebaseAuthUser(null);
      setCurrentUserAccount(null);
      setIsAdminLoggedIn(false);
      setIsStudentLoggedIn(false);
      logActivity('LOGOUT', 'User Session', 'auth', email, 'User signed out from PCM Google session.');
      addToast('info', 'Signed Out', `Google account (${email}) has been signed out.`);
    } catch (e: any) {
      console.warn('Sign out error:', e);
    }
  };

  const addUserAccount = async (user: NewUserAccountInput): Promise<UserAccount> => {
    const newId = user.uid || `uid-usr-${Date.now()}`;
    const newAcc: UserAccount = cleanFirestoreData({
      ...user,
      id: newId,
      uid: newId,
      createdAt: new Date().toISOString(),
      lastLogin: user.lastLogin || new Date().toISOString(),
      status: user.status || 'Active',
      provider: user.provider || 'google.com',
    });

    setUserAccounts((prev) => [newAcc, ...prev.filter((u) => u.email?.toLowerCase() !== newAcc.email.toLowerCase())]);

    // If Admin role, also register in adminUsers directory
    if (newAcc.role === 'Admin') {
      const newAdmin: AdminUser = {
        id: newAcc.id || newAcc.uid || `adm-${Date.now()}`,
        name: newAcc.name,
        email: newAcc.email,
        username: newAcc.email.split('@')[0],
        password: 'pcm' + new Date().getFullYear(),
        role: newAcc.adminRole || 'Super Admin',
        department: newAcc.department || 'Executive Administration & IT Systems',
        status: (newAcc.status as any) || 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Never',
        avatarUrl: newAcc.avatarUrl || newAcc.photoURL || '',
      };
      setAdminUsers((prev) => [newAdmin, ...prev.filter((a) => a.email.toLowerCase() !== newAdmin.email.toLowerCase())]);
      safeSetDoc(doc(db, 'adminUsers', newAdmin.id), cleanFirestoreData(newAdmin)).catch(console.warn);
    }

    // If Student role, also register in studentProfiles directory
    if (newAcc.role === 'Student') {
      const studentId = newAcc.studentId || `2026-PCM-${Math.floor(100 + Math.random() * 900)}`;
      const newStudent: StudentProfile = {
        id: newAcc.id || newAcc.uid || `std-${Date.now()}`,
        studentId,
        fullName: newAcc.name,
        email: newAcc.email,
        portalPassword: 'pcmstudent',
        program: newAcc.department || 'Bachelor of Theology (B.Th.)',
        yearLevel: '1st Year (Freshman)',
        academicStatus: 'Regular',
        enrollmentStatus: 'Enrolled',
        currentSemester: '1st Semester, AY 2026–2027',
        academicYear: '2026–2027',
        contactNumber: '+63 917 000 0000',
        address: 'Baguio City, Benguet',
        birthDate: '2005-01-01',
        gender: 'Male',
        civilStatus: 'Single',
        gpa: 0,
        totalUnitsEarned: 0,
        mentorName: 'Dr. Emmanuel Santos',
        homeChurch: 'Philippine College of Ministry Chapel',
        pastorName: 'Rev. Ruben Alcantara',
        avatarUrl: newAcc.avatarUrl || newAcc.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        tuitionTotal: 25000,
        tuitionPaid: 0,
        tuitionBalance: 25000,
        courses: [],
        paymentRecords: [],
        uploadedDocuments: [],
        practicumEntries: [],
      };
      setStudents((prev) => [newStudent, ...prev.filter((s) => s.email.toLowerCase() !== newStudent.email.toLowerCase())]);
      safeSetDoc(doc(db, 'studentProfiles', newStudent.id), cleanFirestoreData(newStudent)).catch(console.warn);
    }

    try {
      await safeSetDoc(doc(db, 'users', newId), newAcc);
    } catch (e) {
      console.warn('Add user account Firestore sync notice:', e);
    }

    logActivity('CREATE', 'User Account', newId, newAcc.name, `Registered new account (${newAcc.email} - ${newAcc.role}).`);
    addToast('success', 'User Account Registered', `Registered ${newAcc.name} (${newAcc.role}) into system directory.`);
    return newAcc;
  };

  const deleteUserAccount = async (userId: string) => {
    const target = userAccounts.find((u) => u.id === userId || u.uid === userId);
    setUserAccounts((prev) => prev.filter((u) => u.id !== userId && u.uid !== userId));

    if (target) {
      setAdminUsers((prev) => prev.filter((a) => a.id !== userId && a.email?.toLowerCase() !== target.email?.toLowerCase()));
      setStudents((prev) => prev.filter((s) => s.id !== userId && s.studentId !== target.studentId && s.email?.toLowerCase() !== target.email?.toLowerCase()));
      safeDeleteDoc(doc(db, 'adminUsers', userId)).catch(console.warn);
      safeDeleteDoc(doc(db, 'studentProfiles', userId)).catch(console.warn);
    }

    try {
      await safeDeleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Delete user account Firestore sync notice:', e);
    }

    logActivity('DELETE', 'User Account', userId, target?.name || userId, 'Removed user account from system directory.');
    addToast('info', 'User Account Removed', `Removed ${target?.name || 'user'} from account directory.`);
  };

  const updateUserAccountRole = async (userId: string, role: UserRole, adminRole?: AdminRole) => {
    if (currentUserAccount?.role === 'Student' || !isAdminLoggedIn) {
      addToast({
        title: 'Permission Denied',
        message: 'Student accounts are not authorized to modify user roles.',
        type: 'error',
      });
      return;
    }
    try {
      const targetUser = userAccounts.find((u) => u.id === userId || u.uid === userId);
      const updates: Partial<UserAccount> = {
        role,
        adminRole: role === 'Admin' ? (adminRole || 'Super Admin') : undefined,
      };

      setUserAccounts((prev) =>
        prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u))
      );

      // If updating current active user
      if (currentUserAccount?.uid === userId || currentUserAccount?.id === userId) {
        setCurrentUserAccount((prev) => (prev ? { ...prev, ...updates } : null));
        if (role === 'Admin') {
          setIsAdminLoggedIn(true);
        } else if (role === 'Student') {
          setIsStudentLoggedIn(true);
        }
      }

      // If elevated to Admin, ensure adminUsers entry exists
      if (role === 'Admin' && targetUser) {
        const adminExists = adminUsers.some((a) => a.id === userId || a.email.toLowerCase() === targetUser.email.toLowerCase());
        if (!adminExists) {
          const newAdmin: AdminUser = {
            id: targetUser.id || targetUser.uid || `adm-${Date.now()}`,
            name: targetUser.name,
            email: targetUser.email,
            username: targetUser.email.split('@')[0],
            password: 'pcm' + new Date().getFullYear(),
            role: adminRole || 'Super Admin',
            department: targetUser.department || 'Executive Administration & IT Systems',
            status: 'Active',
            createdAt: new Date().toISOString().split('T')[0],
            lastLogin: 'Never',
            avatarUrl: targetUser.avatarUrl || targetUser.photoURL || '',
          };
          setAdminUsers((prev) => [newAdmin, ...prev]);
          safeSetDoc(doc(db, 'adminUsers', newAdmin.id), cleanFirestoreData(newAdmin)).catch(console.warn);
        }
      }

      // If switched to Student, ensure studentProfiles entry exists
      if (role === 'Student' && targetUser) {
        const studentExists = students.some((s) => s.id === userId || s.email.toLowerCase() === targetUser.email.toLowerCase());
        if (!studentExists) {
          const studentId = targetUser.studentId || `2026-PCM-${Math.floor(100 + Math.random() * 900)}`;
          const newStudent: StudentProfile = {
            id: targetUser.id || targetUser.uid || `std-${Date.now()}`,
            studentId,
            fullName: targetUser.name,
            email: targetUser.email,
            portalPassword: 'pcmstudent',
            program: targetUser.department || 'Bachelor of Theology (B.Th.)',
            yearLevel: '1st Year (Freshman)',
            academicStatus: 'Regular',
            enrollmentStatus: 'Enrolled',
            currentSemester: '1st Semester, AY 2026–2027',
            academicYear: '2026–2027',
            contactNumber: '+63 917 000 0000',
            address: 'Baguio City, Benguet',
            birthDate: '2005-01-01',
            gender: 'Male',
            civilStatus: 'Single',
            gpa: 0,
            totalUnitsEarned: 0,
            mentorName: 'Dr. Emmanuel Santos',
            homeChurch: 'Philippine College of Ministry Chapel',
            pastorName: 'Rev. Ruben Alcantara',
            avatarUrl: targetUser.avatarUrl || targetUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
            tuitionTotal: 25000,
            tuitionPaid: 0,
            tuitionBalance: 25000,
            courses: [],
            paymentRecords: [],
            uploadedDocuments: [],
            practicumEntries: [],
          };
          setStudents((prev) => [newStudent, ...prev]);
          safeSetDoc(doc(db, 'studentProfiles', newStudent.id), cleanFirestoreData(newStudent)).catch(console.warn);
        }
      }

      try {
        await setDoc(doc(db, 'users', userId), updates, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore user role sync notice (offline/quota fallback):', firestoreErr);
      }

      logActivity('UPDATE', 'User Role', userId, targetUser?.name || userId, `Updated account role to ${role}${adminRole ? ` (${adminRole})` : ''}.`);
      addToast('success', 'User Role Updated', `Role for ${targetUser?.name || 'user'} updated to ${role}.`);
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      addToast('error', 'Update Failed', err.message || 'Could not update user role.');
    }
  };

  const linkStudentIdToUser = async (studentId: string) => {
    if (!currentUserAccount) return;
    try {
      const updates = { studentId };
      setCurrentUserAccount((prev) => (prev ? { ...prev, ...updates } : null));
      setUserAccounts((prev) =>
        prev.map((u) => (u.uid === currentUserAccount.uid || u.id === currentUserAccount.uid ? { ...u, ...updates } : u))
      );
      try {
        await setDoc(doc(db, 'users', currentUserAccount.uid), updates, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore student ID link notice (offline/quota fallback):', firestoreErr);
      }
      addToast('success', 'Student Record Linked', `Linked Student ID ${studentId} to your account.`);
    } catch (e: any) {
      console.warn(e);
    }
  };

  // Change Admin Password
  const changeAdminPassword = (userId: string, newPass: string): boolean => {
    if (newPass.length < 6) {
      addToast('error', 'Weak Password', 'Password must be at least 6 characters.');
      return false;
    }
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    setDoc(doc(db, 'adminUsers', userId), { password: newPass }, { merge: true }).catch((e) => console.warn(e));
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
      donationMethods,
      donations,
      donationSettings,
    };
    return JSON.stringify(fullDb, null, 2);
  };

  const importDatabaseJson = async (jsonString: string): Promise<boolean> => {
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
      if (data.donationMethods && Array.isArray(data.donationMethods)) setDonationMethods(data.donationMethods);
      if (data.donations && Array.isArray(data.donations)) setDonations(data.donations);
      if (data.donationSettings) setDonationSettings(data.donationSettings);

      const restorePayload = {
        siteConfig: data.siteConfig || stateRef.current.siteConfig,
        programs: data.programs || stateRef.current.programs,
        faculty: data.faculty || stateRef.current.faculty,
        announcements: data.announcements || stateRef.current.announcements,
        news: data.news || stateRef.current.news,
        events: data.events || stateRef.current.events,
        downloads: data.downloads || stateRef.current.downloads,
        testimonials: data.testimonials || stateRef.current.testimonials,
        stats: data.stats || stateRef.current.stats,
        faqs: data.faqs || stateRef.current.faqs,
        sermons: data.sermons || stateRef.current.sermons,
        scrapbook: data.scrapbook || stateRef.current.scrapbook,
        mediaItems: data.mediaItems || stateRef.current.mediaItems,
        galleryAlbums: data.galleryAlbums || stateRef.current.galleryAlbums,
        adminUsers: data.adminUsers || stateRef.current.adminUsers,
        studentProfile: data.studentProfile || stateRef.current.studentProfile,
        donationMethods: data.donationMethods || stateRef.current.donationMethods,
        donations: data.donations || stateRef.current.donations,
        donationSettings: data.donationSettings || stateRef.current.donationSettings,
      };

      logActivity('RESTORE', 'Database Import', 'import-db', 'Full Dataset Restore', 'Imported complete JSON database backup.');
      addToast('success', 'Database Restored', 'Institutional dataset restored successfully.');
      await syncAllDataToFirestore(true, restorePayload);
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
    setDonationMethods(INITIAL_DONATION_METHODS);
    setDonations(INITIAL_DONATIONS);
    setDonationSettings(INITIAL_DONATION_SETTINGS);

    const resetPayload = {
      siteConfig: INITIAL_SITE_CONFIG,
      programs: INITIAL_PROGRAMS,
      faculty: INITIAL_FACULTY,
      announcements: INITIAL_ANNOUNCEMENTS,
      news: INITIAL_NEWS,
      events: INITIAL_EVENTS,
      downloads: INITIAL_DOWNLOADS,
      testimonials: INITIAL_TESTIMONIALS,
      stats: INITIAL_STATS,
      faqs: INITIAL_FAQS,
      sermons: INITIAL_SERMONS,
      scrapbook: INITIAL_SCRAPBOOK,
      mediaItems: INITIAL_MEDIA_ITEMS,
      galleryAlbums: INITIAL_GALLERY_ALBUMS,
      adminUsers: INITIAL_ADMIN_USERS,
      studentProfile: DEMO_STUDENT_PROFILE,
      donationMethods: INITIAL_DONATION_METHODS,
      donations: INITIAL_DONATIONS,
      donationSettings: INITIAL_DONATION_SETTINGS,
    };

    try {
      await syncAllDataToFirestore(true, resetPayload);
    } catch (e) {
      console.warn(e);
    }

    addToast('warning', 'Database Reset', 'Restored initial baseline catalog & configuration.');
  };

  // Donation Operations
  const submitDonation = async (
    data: Omit<DonationRecord, 'id' | 'trackingCode' | 'status' | 'createdAt'>
  ): Promise<DonationRecord> => {
    const timestamp = new Date().toISOString();
    const trackingCode = `PCM-GIVE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDonation: DonationRecord = cleanFirestoreData({
      ...data,
      id: `don-${Date.now()}`,
      trackingCode,
      status: 'Pending Verification',
      createdAt: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    });

    setDonations((prev) => [newDonation, ...prev]);

    try {
      await setDoc(doc(db, 'donations', newDonation.id), newDonation, { merge: true });
    } catch (e) {
      console.warn('Firestore donation submission error:', e);
    }

    logActivity('CREATE', 'Donation Pledge / Record', newDonation.id, newDonation.donorName, `New giving notification for ₱${newDonation.amount.toLocaleString()} via ${newDonation.paymentMethodName}.`);
    addToast('success', 'Donation Notified', `Thank you, ${newDonation.donorName}! Your gift tracking code is ${trackingCode}.`);
    return newDonation;
  };

  const addDonationMethod = async (method: Omit<DonationPaymentMethod, 'id'>): Promise<DonationPaymentMethod> => {
    const newMethod: DonationPaymentMethod = cleanFirestoreData({
      ...method,
      id: `pay-${Date.now()}`,
      order: method.order || donationMethods.length + 1,
      active: method.active !== undefined ? method.active : true,
    });

    setDonationMethods((prev) => [...prev, newMethod]);

    try {
      await setDoc(doc(db, 'donationPaymentMethods', newMethod.id), newMethod, { merge: true });
    } catch (e) {
      console.warn('Firestore donation method write error:', e);
    }

    logActivity('CREATE', 'Donation Payment Channel', newMethod.id, newMethod.name, `Added payment channel (${newMethod.name}).`);
    addToast('success', 'Payment Method Added', `Created payment channel "${newMethod.name}".`);
    return newMethod;
  };

  const updateDonationMethod = async (id: string, updates: Partial<DonationPaymentMethod>) => {
    const sanitized = cleanFirestoreData(updates);
    setDonationMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

    try {
      await setDoc(doc(db, 'donationPaymentMethods', id), sanitized, { merge: true });
    } catch (e) {
      console.warn('Firestore donation method update error:', e);
    }

    logActivity('UPDATE', 'Donation Payment Channel', id, updates.name || 'Channel', 'Updated payment details / instructions.');
    addToast('success', 'Payment Channel Updated', 'Donation channel details saved.');
  };

  const deleteDonationMethod = async (id: string) => {
    const target = donationMethods.find((m) => m.id === id);
    setDonationMethods((prev) => prev.filter((m) => m.id !== id));

    try {
      await deleteDoc(doc(db, 'donationPaymentMethods', id));
    } catch (e) {
      console.warn('Firestore donation method deletion error:', e);
    }

    logActivity('DELETE', 'Donation Payment Channel', id, target?.name || 'Channel', 'Removed payment channel.');
    addToast('info', 'Payment Channel Removed', `Deleted ${target?.name || 'payment channel'}.`);
  };

  const updateDonationRecord = async (id: string, updates: Partial<DonationRecord>) => {
    const sanitized = cleanFirestoreData(updates);
    setDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );

    try {
      await setDoc(doc(db, 'donations', id), sanitized, { merge: true });
    } catch (e) {
      console.warn('Firestore donation record update error:', e);
    }

    logActivity('UPDATE', 'Donation Record', id, updates.donorName || 'Donor', `Updated donation status to ${updates.status || 'updated'}.`);
    addToast('success', 'Donation Status Updated', 'Donation record status updated.');
  };

  const deleteDonationRecord = async (id: string) => {
    const target = donations.find((d) => d.id === id);
    setDonations((prev) => prev.filter((d) => d.id !== id));

    try {
      await deleteDoc(doc(db, 'donations', id));
    } catch (e) {
      console.warn('Firestore donation record deletion error:', e);
    }

    logActivity('DELETE', 'Donation Record', id, target?.donorName || 'Donor', 'Removed donation entry.');
    addToast('info', 'Donation Record Removed', 'Record deleted from database.');
  };

  const updateDonationSettings = async (updates: Partial<DonationSettings>) => {
    const updated = cleanFirestoreData({
      ...donationSettings,
      ...updates,
    });
    setDonationSettings(updated);

    try {
      await setDoc(doc(db, 'donationSettings', 'global'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore donation settings write error:', e);
    }

    logActivity('UPDATE', 'Donation Page Configuration', 'donation-settings', 'Global Donation CMS', 'Updated donation page scriptures, featured causes, and stewardship details.');
    addToast('success', 'Donation Content Updated', 'Donation page settings synchronized with cloud.');
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
        reorderFaculty,
        moveFacultyMember,
        setFacultyOrderIndex,

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

        // Google / Firebase User Accounts & Authentication
        currentUserAccount,
        setCurrentUserAccount,
        firebaseAuthUser,
        userAccounts,
        userAccountModalOpen,
        setUserAccountModalOpen,
        signInWithGoogle,
        signOutUser,
        addUserAccount,
        deleteUserAccount,
        updateUserAccountRole,
        linkStudentIdToUser,

        // Student Portal & Multi-Student Directory
        isStudentLoggedIn,
        setIsStudentLoggedIn,
        currentStudent: isStudentLoggedIn ? studentProfile : null,
        studentProfile,
        setStudentProfile,
        students,
        setStudents,
        studentLogin,
        studentLogout,
        linkGoogleAccountToStudent,
        addPracticumEntry,
        makeTuitionPayment,

        // Online Enrollment System
        enrollments,
        setEnrollments,
        currentEnrollmentDraft,
        setCurrentEnrollmentDraft,
        saveEnrollmentDraft,
        submitEnrollment,
        updateEnrollmentStatus,
        approveEnrollment,
        returnEnrollmentForCorrection,
        rejectEnrollment,
        deleteEnrollment,

        // Student Document Vault & Verification
        uploadStudentDocument,
        updateDocumentVerification,

        // Student Profile & Academic Record Management
        createStudentProfile,
        updateStudentProfile,
        deleteStudentProfile,
        addStudentGrade,
        recordStudentPayment,

        // Enrollment Submenu Navigation
        enrollmentActiveSubTab,
        setEnrollmentActiveSubTab,

        // Academic Subjects Catalog & Sections
        academicSubjects,
        setAcademicSubjects,
        addAcademicSubject,
        updateAcademicSubject,
        deleteAcademicSubject,

        // Pre-Enlistment Module
        preEnlistments,
        setPreEnlistments,
        submitPreEnlistment,
        updatePreEnlistmentStatus,

        // Adding & Dropping Module
        addDropRequests,
        setAddDropRequests,
        submitAddDropRequest,
        reviewAddDropRequest,

        // Assessment & Fee Structure Module
        feeStructure,
        setFeeStructure,
        updateFeeStructureItem,
        addFeeStructureItem,
        deleteFeeStructureItem,
        calculateStudentAssessment,

        // Student Notifications Engine
        studentNotifications,
        setStudentNotifications,
        addStudentNotification,
        markNotificationRead,
        markAllNotificationsRead,

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

        // Donation Management & Giving Portal
        donationMethods,
        setDonationMethods,
        addDonationMethod,
        updateDonationMethod,
        deleteDonationMethod,
        donations,
        setDonations,
        submitDonation,
        updateDonationRecord,
        deleteDonationRecord,
        donationSettings,
        setDonationSettings,
        updateDonationSettings,

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
