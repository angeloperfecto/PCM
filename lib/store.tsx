'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  NavSection,
  AcademicProgram,
  ProgramLevel,
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
  StudentRequirementItem,
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
  DeletedUserRecord,
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
  StudentBalancePayment,
  CurriculumSubject,
  AddDropAction,
  AddDropStatus,
  FeeStructureItem,
  StudentAssessment,
  EnrollmentSubmenuTab,
  AcademicPeriod,
  ClassSection,
  InstructorRecord,
  EnrollmentSystemConfig,
  EnrollmentAdminSubTab,
  YouTubeVideo,
  HomepageVideoConfig,
  StudentLifeConfig,
  StudentLifeAlbum,
  StudentLifePhotoItem,
  ContactInquiry,
  LifeAtPCMConfig,
  LifeAtPCMItem,
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
  INITIAL_STUDENT_LIFE_ALBUMS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_DONATION_METHODS,
  INITIAL_DONATIONS,
  INITIAL_DONATION_SETTINGS,
  INITIAL_ACADEMIC_SUBJECTS,
  INITIAL_PRE_ENLISTMENTS,
  INITIAL_ADD_DROP_REQUESTS,
  INITIAL_FEE_STRUCTURE,
  INITIAL_ACADEMIC_PERIODS,
  INITIAL_CLASS_SECTIONS,
  INITIAL_INSTRUCTORS,
  INITIAL_ENROLLMENT_SYSTEM_CONFIG,
  INITIAL_VIDEOS,
  INITIAL_HOMEPAGE_VIDEO_CONFIG,
  INITIAL_STUDENT_LIFE_CONFIG,
  INITIAL_LIFE_AT_PCM_CONFIG,
} from './initialData';
import { studentRequirementsView,
  calculateGPAFromGrades,
  normalizeStudentProfile,
  generateStudentId,
  generateApplicationNumber,
} from './studentDefaults';
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, generateVideoId, getCurrentTimestamp } from './youtube';
import { normalizeInstructions } from './utils';
import { saveSlideshowToFirestore } from './slideshowService';

export const ALL_VALID_SECTIONS: NavSection[] = [
  'home',
  'why-choose-pcm',
  'about',
  'academics',
  'admissions',
  'student-life',
  'ministry',
  'news-events',
  'resources',
  'scrapbook',
  'donation',
  'contact',
  'apply',
  'portal',
  'admin',
  'migration-report',
];
import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
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
  deleteFileFromFirebaseStorage,
  getImageDimensions,
  handleFirestoreError,
  isFirestoreQuotaError,
  logFirestoreOp,
  OperationType,
  cleanFirestoreData,
  safeSetDoc,
  safeUpdateDoc,
  safeDeleteDoc,
  blobToDataUrl,
  query,
  where,
  WRITE_FAILED_EVENT,
  DATA_DROPPED_EVENT,
} from './firebase';
import { firebaseConfig } from './firebaseConfig';
import { ENROLLMENT_STAFF_ROLES, PAYMENT_STAFF_ROLES, normalizeStatus, admissionRequirementTemplates } from './enrollmentWorkflow';
import type { ApplicationRequirement, WorkflowStatus } from './enrollmentWorkflow';
import { termFees, accountSummary, parseTerm, officialAssessmentLines, applyOfficialLines } from './studentLedger';
import { curriculumToImport, validateCurriculumSubject } from './curriculum';
import { submitAdmissionApplication, transitionApplication } from './admissionsService';

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
  uploadMediaFile: (
    file: File | Blob,
    category?: string,
    title?: string,
    altText?: string,
    tags?: string[],
    folder?: string,
    caption?: string
  ) => Promise<string>;

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
  updateStudentLifeConfig: (newStudentLife: Partial<StudentLifeConfig>) => Promise<void>;
  updateLifeAtPCMConfig: (newLifeConfig: Partial<LifeAtPCMConfig>) => Promise<void>;
  saveLifeAtPCMItem: (item: LifeAtPCMItem) => Promise<void>;
  deleteLifeAtPCMItem: (id: string) => Promise<void>;
  reorderLifeAtPCMItems: (items: LifeAtPCMItem[]) => Promise<void>;
  resetLifeAtPCMToDefault: () => Promise<void>;

  // Media Library
  mediaItems: MediaItem[];
  mediaLibrary: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  addMediaItem: (item: Omit<MediaItem, 'id' | 'uploadDate'>) => Promise<MediaItem> | MediaItem;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => Promise<boolean> | void;
  deleteMediaItem: (id: string) => Promise<boolean> | void;
  deleteMultipleMediaItems: (ids: string[]) => Promise<boolean>;
  replaceMediaFile: (id: string, newFile: File | Blob) => Promise<MediaItem>;

  // Gallery Albums
  galleryAlbums: GalleryAlbum[];
  setGalleryAlbums: React.Dispatch<React.SetStateAction<GalleryAlbum[]>>;
  addGalleryAlbum: (album: Omit<GalleryAlbum, 'id'>) => GalleryAlbum;
  updateGalleryAlbum: (id: string, updates: Partial<GalleryAlbum>) => void;
  deleteGalleryAlbum: (id: string) => void;

  // Student Life Albums (Facebook-inspired Multi-Image Gallery)
  studentLifeAlbums: StudentLifeAlbum[];
  setStudentLifeAlbums: React.Dispatch<React.SetStateAction<StudentLifeAlbum[]>>;
  createStudentLifeAlbum: (
    album: Omit<StudentLifeAlbum, 'id' | 'createdAt' | 'updatedAt' | 'photoCount'>,
    initialPhotos?: StudentLifePhotoItem[]
  ) => Promise<StudentLifeAlbum>;
  updateStudentLifeAlbum: (id: string, updates: Partial<StudentLifeAlbum>) => Promise<void>;
  deleteStudentLifeAlbum: (id: string) => Promise<void>;
  addPhotosToStudentLifeAlbum: (albumId: string, photos: StudentLifePhotoItem[]) => Promise<void>;
  updateStudentLifePhoto: (albumId: string, photoId: string, updates: Partial<StudentLifePhotoItem>) => Promise<void>;
  deleteStudentLifePhoto: (albumId: string, photoId: string) => Promise<void>;
  reorderStudentLifePhotos: (albumId: string, reorderedPhotos: StudentLifePhotoItem[]) => Promise<void>;
  setStudentLifeAlbumCover: (albumId: string, coverPhotoUrl: string) => Promise<void>;
  toggleStudentLifeAlbumPublish: (albumId: string) => Promise<void>;
  moveStudentLifePhoto: (sourceAlbumId: string, targetAlbumId: string, photoId: string) => Promise<void>;

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
  addTestimonial: (item: Omit<Testimonial, 'id'>) => Promise<Testimonial | null>;
  updateTestimonial: (id: string, updates: Partial<Testimonial>, options?: { silent?: boolean }) => Promise<boolean>;
  deleteTestimonial: (id: string) => Promise<boolean>;

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
  submitApplication: (
    appData: any,
    initialFiles?: Record<string, { dataUrl: string; size: number; type: string; name: string }>
  ) => Promise<string>;
  updateApplicationStatus: (id: string, status: any, note?: string) => Promise<boolean>;
  // Registrar, Admin or Super Admin: may make admission decisions and finalize enrollment.
  canDecideAdmissions: boolean;
  /** Approve/return enrollments, pre-enlistments and add/drop requests (isEnrollmentOffice in firestore.rules). */
  canManageEnrollment: boolean;
  /** Subjects per year level (curriculumSubjects), live for every signed-in user. */
  curriculumSubjects: CurriculumSubject[];
  /** Registrar, Academic Admin, Admin and Super Admin may edit the curriculum (firestore.rules). */
  canManageCurriculum: boolean;
  saveCurriculumSubject: (subject: Partial<CurriculumSubject>) => Promise<boolean>;
  deleteCurriculumSubject: (id: string) => Promise<boolean>;
  importProgramCurricula: () => Promise<number>;
  // Registrar, Admin, Super Admin or Finance: may verify enrollment payments.
  canVerifyPayments: boolean;
  admissionsActor: () => { uid: string; name: string; email: string; role?: string };
  addApplicationNote: (id: string, note: string) => void;
  deleteApplication: (id: string) => void;
  getApplicationByRef: (ref: string) => AdmissionApplication | undefined;
  fetchApplicationByRef?: (ref: string) => Promise<AdmissionApplication | undefined>;
  activeTrackerRef: string;
  setActiveTrackerRef: (ref: string) => void;
  submitInquiry: (inquiryData: {
    name: string;
    email: string;
    phone?: string;
    department?: string;
    subject?: string;
    message: string;
    programInterest?: string;
    type?: 'general_inquiry' | 'program_info_request' | 'campus_visit';
  }) => Promise<{ success: boolean; id: string }>;

  // Google / Firebase User Accounts & Multi-Role Authentication
  currentUserAccount: UserAccount | null;
  setCurrentUserAccount: (acc: UserAccount | null) => void;
  firebaseAuthUser: FirebaseUser | null;
  userAccounts: UserAccount[];
  userAccountModalOpen: boolean;
  setUserAccountModalOpen: (open: boolean) => void;
  signInWithGoogle: (requestedRole?: UserRole | AdminRole, customEmail?: string, customName?: string) => Promise<{ success: boolean; isPending?: boolean; isDisabled?: boolean; role?: string; user?: UserAccount; message?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; isPending?: boolean; isDisabled?: boolean; role?: string; user?: UserAccount; message?: string }>;
  registerWithEmail: (name: string, email: string, pass: string, requestedRole?: UserRole | AdminRole, department?: string) => Promise<{ success: boolean; isPending?: boolean; user?: UserAccount; message?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  signOutUser: () => Promise<void>;
  addUserAccount: (user: NewUserAccountInput) => Promise<UserAccount> | UserAccount;
  deleteUserAccount: (userId: string) => Promise<void> | void;
  restoreUserAccount: (userIdOrEmail: string) => Promise<boolean>;
  removeDeletedUserRecord: (userIdOrEmail: string) => Promise<boolean>;
  isUserDeleted: (identifierOrAccount: string | { id?: string; uid?: string; email?: string; studentId?: string } | null | undefined) => boolean;
  deletedUsers: DeletedUserRecord[];
  updateUserAccountRole: (userId: string, role: UserRole, adminRole?: AdminRole) => Promise<void>;
  approveUserAccess: (userId: string, assignedAdminRole?: AdminRole) => Promise<boolean>;
  rejectUserAccess: (userId: string, reason?: string) => Promise<boolean>;
  activateUser: (userId: string) => Promise<boolean>;
  deactivateUser: (userId: string) => Promise<boolean>;
  changeUserRole: (userId: string, newRole: UserRole, newAdminRole?: AdminRole) => Promise<boolean>;
  revokeAdminAccess: (userId: string) => Promise<boolean>;
  updateUserPermissions: (userId: string, permissions: string[]) => Promise<boolean>;
  linkStudentIdToUser: (studentId: string) => Promise<void>;

  // Student Portal & Multi-Student Directory
  isStudentLoggedIn: boolean;
  setIsStudentLoggedIn: (loggedIn: boolean) => void;
  currentStudent: StudentProfile | null;
  studentProfile: StudentProfile;
  setStudentProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
  students: StudentProfile[];
  /** Admin view: student records hidden because their email or id is in the Deletion Registry. */
  registryBlockedStudents: StudentProfile[];
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
  saveEnrollmentDraft: (draft: Partial<OnlineEnrollment>) => Promise<OnlineEnrollment | null>;
  submitEnrollment: (data: Partial<OnlineEnrollment>) => Promise<{ success: boolean; referenceNumber?: string; message?: string }>;
  updateEnrollmentStatus: (enrollmentId: string, status: EnrollmentStatus, adminRemarks?: string) => Promise<boolean>;
  approveEnrollment: (enrollmentId: string, remarks?: string) => Promise<boolean>;
  returnEnrollmentForCorrection: (enrollmentId: string, adminFeedback: string) => Promise<boolean>;
  rejectEnrollment: (enrollmentId: string, reason: string) => Promise<boolean>;
  deleteEnrollment: (enrollmentId: string) => Promise<boolean>;

  // Student Documents Vault & Verification
  uploadStudentDocument: (studentId: string, docData: Omit<StudentDocument, 'id' | 'uploadDate' | 'verificationStatus'>) => Promise<StudentDocument | null>;
  updateDocumentVerification: (studentId: string, docId: string, status: DocumentVerificationStatus, adminFeedback?: string) => Promise<boolean>;

  // Student Profile & Academic Management (Admin / Registrar)
  createStudentProfile: (profile: Omit<StudentProfile, 'id'>) => Promise<StudentProfile>;
  updateStudentProfile: (studentId: string, updates: Partial<StudentProfile>) => Promise<boolean>;
  updateStudentAvatar: (avatarUrl: string, studentId?: string) => Promise<boolean>;
  deleteStudentProfile: (studentId: string) => Promise<boolean>;
  archiveStudentProfile: (studentId: string) => Promise<boolean>;
  restoreStudentProfile: (studentId: string) => Promise<boolean>;
  addStudentGrade: (studentId: string, courseCode: string, midtermGrade: number | string, finalGrade: number | string) => Promise<boolean>;
  recordStudentPayment: (studentId: string, payment: Omit<StudentPaymentRecord, 'id'>) => Promise<boolean>;
  updateStudentPaymentRecord: (studentId: string, paymentId: string, updates: Partial<StudentPaymentRecord>) => Promise<boolean>;
  updateStudentRequirementStatus: (studentId: string, requirementId: string, status: StudentRequirementItem['status'], remarks?: string, file?: any) => Promise<boolean>;
  addStudentSubjectHistory: (studentId: string, record: Omit<StudentSubjectHistory, 'id'>) => Promise<boolean>;
  updateStudentSubjectHistory: (studentId: string, subjectIdOrCode: string, updates: Partial<StudentSubjectHistory>) => Promise<boolean>;
  deleteStudentSubjectHistory: (studentId: string, subjectIdOrCode: string) => Promise<boolean>;
  updateStudentEnrollmentStatus: (studentId: string, status: EnrollmentStatus, remarks?: string) => Promise<boolean>;

  // Enrollment Submenu Navigation
  enrollmentActiveSubTab: EnrollmentSubmenuTab;
  setEnrollmentActiveSubTab: (tab: EnrollmentSubmenuTab) => void;

  // Academic Periods Management
  academicPeriods: AcademicPeriod[];
  setAcademicPeriods: React.Dispatch<React.SetStateAction<AcademicPeriod[]>>;
  currentAcademicPeriod: AcademicPeriod | undefined;
  addAcademicPeriod: (period: Omit<AcademicPeriod, 'id'>) => Promise<AcademicPeriod | null>;
  updateAcademicPeriod: (id: string, updates: Partial<AcademicPeriod>) => Promise<boolean>;
  setCurrentAcademicPeriod: (id: string) => Promise<boolean>;
  deleteAcademicPeriod: (id: string) => Promise<boolean>;

  // Class Sections Management
  classSections: ClassSection[];
  setClassSections: React.Dispatch<React.SetStateAction<ClassSection[]>>;
  addClassSection: (section: Omit<ClassSection, 'id'>) => Promise<ClassSection | null>;
  updateClassSection: (id: string, updates: Partial<ClassSection>) => Promise<boolean>;
  deleteClassSection: (id: string) => Promise<boolean>;
  transferStudentSection: (studentId: string, fromSectionId: string, toSectionId: string) => Promise<boolean>;

  // Instructors Faculty Management
  instructors: InstructorRecord[];
  setInstructors: React.Dispatch<React.SetStateAction<InstructorRecord[]>>;
  addInstructor: (instructor: Omit<InstructorRecord, 'id'>) => Promise<InstructorRecord | null>;
  updateInstructor: (id: string, updates: Partial<InstructorRecord>) => Promise<boolean>;
  deleteInstructor: (id: string) => Promise<boolean>;

  // Enrollment System Policy Config
  enrollmentSystemConfig: EnrollmentSystemConfig;
  setEnrollmentSystemConfig: React.Dispatch<React.SetStateAction<EnrollmentSystemConfig>>;
  updateEnrollmentSystemConfig: (updates: Partial<EnrollmentSystemConfig>) => Promise<boolean>;

  // Academic Subjects Catalog & Sections
  academicSubjects: AcademicSubject[];
  setAcademicSubjects: React.Dispatch<React.SetStateAction<AcademicSubject[]>>;
  addAcademicSubject: (subject: Omit<AcademicSubject, 'id'>) => Promise<AcademicSubject | null>;
  updateAcademicSubject: (id: string, updates: Partial<AcademicSubject>) => Promise<boolean>;
  deleteAcademicSubject: (id: string) => Promise<boolean>;
  duplicateAcademicSubject: (subjectId: string, newAcademicYear: string, newSemester: string) => Promise<AcademicSubject | null>;

  // Pre-Enlistment Module
  preEnlistments: PreEnlistmentRecord[];
  setPreEnlistments: React.Dispatch<React.SetStateAction<PreEnlistmentRecord[]>>;
  submitPreEnlistment: (record: Omit<PreEnlistmentRecord, 'id' | 'createdAt'>) => Promise<PreEnlistmentRecord | null>;
  updatePreEnlistmentStatus: (id: string, status: PreEnlistmentRecord['status'], remarks?: string) => Promise<boolean>;
  deletePreEnlistment: (id: string) => Promise<boolean>;

  // Adding & Dropping Module
  addDropRequests: AddDropRequest[];
  /** Balance payments reported by students (admins: all; students: their own). */
  studentPayments: StudentBalancePayment[];
  setAddDropRequests: React.Dispatch<React.SetStateAction<AddDropRequest[]>>;
  submitAddDropRequest: (req: Omit<AddDropRequest, 'id' | 'createdAt' | 'status' | 'dateSubmitted'>) => Promise<AddDropRequest | null>;
  reviewAddDropRequest: (id: string, status: AddDropStatus, adminRemarks?: string) => Promise<boolean>;
  deleteAddDropRequest: (id: string) => Promise<boolean>;

  // Assessment & Fee Structure Module
  feeStructure: FeeStructureItem[];
  setFeeStructure: React.Dispatch<React.SetStateAction<FeeStructureItem[]>>;
  updateFeeStructureItem: (id: string, updates: Partial<FeeStructureItem>) => Promise<boolean>;
  addFeeStructureItem: (item: Omit<FeeStructureItem, 'id'>) => Promise<FeeStructureItem | null>;
  deleteFeeStructureItem: (id: string) => Promise<boolean>;
  calculateStudentAssessment: (studentId?: string, overrideUnits?: number, additionalFeeIds?: string[]) => StudentAssessment;

  // Extended Workflow & RBAC
  cancelEnrollment: (enrollmentId: string, reason: string) => Promise<boolean>;
  reopenEnrollment: (enrollmentId: string) => Promise<boolean>;
  canPerformEnrollmentAction: (action: string, role?: AdminRole) => boolean;

  // Student Notifications
  studentNotifications: StudentNotification[];
  setStudentNotifications: React.Dispatch<React.SetStateAction<StudentNotification[]>>;
  addStudentNotification: (studentId: string, notif: Omit<StudentNotification, 'id' | 'createdAt' | 'read' | 'studentId'>) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  markAllNotificationsRead: (studentId?: string) => Promise<void>;

  // Admin CMS & RBAC
  isAdminLoggedIn: boolean;
  isAdminAuthenticated: boolean;
  setIsAdminLoggedIn: (loggedIn: boolean) => void;
  adminLogin: (user: string, pass: string) => Promise<boolean>;
  adminLogout: () => void;
  currentAdminUser: AdminUser;
  setCurrentAdminUser: (user: AdminUser) => void;
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => AdminUser;
  updateAdminUser: (id: string, updates: Partial<AdminUser>) => void;
  updateAdminAvatar: (avatarUrl: string, adminId?: string) => Promise<boolean>;
  updateUserAvatar: (avatarUrl: string) => Promise<boolean>;
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

  // YouTube Video Management & Homepage Video Control
  videos: YouTubeVideo[];
  setVideos: React.Dispatch<React.SetStateAction<YouTubeVideo[]>>;
  homepageVideoConfig: HomepageVideoConfig;
  setHomepageVideoConfig: React.Dispatch<React.SetStateAction<HomepageVideoConfig>>;
  featuredVideo: YouTubeVideo | null;
  addYouTubeVideo: (video: Omit<YouTubeVideo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<YouTubeVideo>;
  updateYouTubeVideo: (id: string, updates: Partial<YouTubeVideo>) => Promise<boolean>;
  deleteYouTubeVideo: (id: string) => Promise<boolean>;
  togglePublishYouTubeVideo: (id: string) => Promise<boolean>;
  setFeaturedYouTubeVideo: (id: string) => Promise<boolean>;
  reorderYouTubeVideos: (orderedIds: string[]) => Promise<boolean>;
  updateHomepageVideoConfig: (updates: Partial<HomepageVideoConfig>) => Promise<boolean>;
  syncVideosToFirebase: (customVideos?: YouTubeVideo[]) => Promise<boolean>;
}

// Fast equality helper to prevent unnecessary state resets and component flickering
function areEntitiesEqual<T extends Record<string, any>>(a: T[] | undefined, b: T[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function areUserAccountsEqual(a: UserAccount[] | undefined, b: UserAccount[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const uA = a[i];
    const uB = b[i];
    if (!uA || !uB) return false;
    if (uA.id !== uB.id || uA.email !== uB.email || uA.role !== uB.role || uA.status !== uB.status || uA.avatarUrl !== uB.avatarUrl) {
      return false;
    }
  }
  return true;
}

// Accounts that always hold Super Admin, matching isSuperAdmin() in firestore.rules.
// Only honoured when Firebase Auth reports the email as verified.
const SUPER_ADMIN_EMAILS = ['angeloperfecto.epc@gmail.com', 'president@pcm.edu.ph'];

const ADMIN_ROLE_NAMES: string[] = [
  'Super Admin',
  'Admin',
  'Staff/Editor',
  'Editor',
  'Content Admin',
  'Academic Admin',
  'Registrar',
  'Finance',
];

const PCMContext = createContext<PCMContextType | undefined>(undefined);

export const PCMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const counterRef = useRef(0);
  const initialSeededRef = useRef(false);
  const hasAuthoritativeSlideshowRef = useRef(false);
  const hasAuthoritativeLifeAtPcmRef = useRef(false);
  const hasAuthoritativeStudentLifeRef = useRef(false);
  const firestoreLoadedCollectionsRef = useRef<Set<string>>(new Set());

  // Navigation
  // Starts at 'home' to match the server-rendered page; the URL hash is applied after mount
  // (see "Synchronize section with browser hash"). Reading it here caused a hydration
  // mismatch that left deep links like /#apply showing the home page.
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

  // Deleted User Accounts Tombstone & Archive Registry
  const [deletedUsers, setDeletedUsers] = useState<DeletedUserRecord[]>([]);

  // Helper to check if any user or email is marked as permanently deleted
  const isUserDeleted = useCallback(
    (identifierOrAccount: string | { id?: string; uid?: string; email?: string; studentId?: string } | null | undefined): boolean => {
      if (!identifierOrAccount) return false;
      const cleanLower = (s?: string) => (s ? s.trim().toLowerCase() : '');
      let emailTarget = '';
      let idTarget = '';
      let uidTarget = '';
      let studentIdTarget = '';

      if (typeof identifierOrAccount === 'string') {
        const val = cleanLower(identifierOrAccount);
        if (val.includes('@')) {
          emailTarget = val;
        } else {
          idTarget = val;
          uidTarget = val;
        }
      } else {
        emailTarget = cleanLower(identifierOrAccount.email);
        idTarget = cleanLower(identifierOrAccount.id);
        uidTarget = cleanLower(identifierOrAccount.uid);
        studentIdTarget = cleanLower(identifierOrAccount.studentId);
      }

      return deletedUsers.some((d) => {
        const dEmail = cleanLower(d.email);
        const dId = cleanLower(d.id);
        const dUid = cleanLower(d.uid);
        const dStd = cleanLower(d.studentId);

        if (emailTarget && dEmail && emailTarget === dEmail) return true;
        if (idTarget && (idTarget === dId || idTarget === dUid)) return true;
        if (uidTarget && (uidTarget === dId || uidTarget === dUid)) return true;
        if (studentIdTarget && dStd && studentIdTarget === dStd) return true;
        return false;
      });
    },
    [deletedUsers]
  );

  const isUserDeletedRef = useRef(isUserDeleted);
  useEffect(() => {
    isUserDeletedRef.current = isUserDeleted;
  }, [isUserDeleted]);

  // Helper to keep userAccounts in sync with all registered admins and students
  const syncWithAdminsAndStudents = useCallback(
    (
      baseUsers: UserAccount[],
      currAdmins: AdminUser[],
      currStudents: StudentProfile[]
    ): UserAccount[] => {
      const map = new Map<string, UserAccount>();

      // 1. Base / Registered accounts (exclude deleted)
      (baseUsers || [])
        .filter((u) => !isUserDeletedRef.current(u))
        .forEach((u) => {
          const key = (u.email || u.id || u.uid || '').toLowerCase().trim();
          if (key && !isUserDeletedRef.current(key)) map.set(key, u);
        });

      // 2. Ensure all registered admin users are included (exclude deleted)
      (currAdmins || [])
        .filter((adm) => !isUserDeletedRef.current(adm))
        .forEach((adm) => {
          const key = (adm.email || adm.id).toLowerCase().trim();
          if (isUserDeletedRef.current(key) || isUserDeletedRef.current(adm)) return;
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

      // 3. Ensure all registered students are included (exclude deleted)
      (currStudents || [])
        .filter((std) => !isUserDeletedRef.current(std))
        .forEach((std) => {
          const key = (std.email || std.studentId || std.id).toLowerCase().trim();
          if (isUserDeletedRef.current(key) || isUserDeletedRef.current(std)) return;
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

      return Array.from(map.values()).filter((u) => !isUserDeletedRef.current(u));
    },
    []
  );

  // Local persistent cache helpers to prevent data reverting during page refresh / session restart
  const getCachedData = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(`pcm_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(fallback)) {
          if (Array.isArray(parsed)) return parsed as unknown as T;
        } else if (parsed && typeof parsed === 'object') {
          return parsed as unknown as T;
        } else if (parsed !== null && parsed !== undefined) {
          return parsed as unknown as T;
        }
      }
    } catch {}
    return fallback;
  };

  const setCachedData = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`pcm_cache_${key}`, JSON.stringify(data));
    } catch {}
  };

  // User Accounts & Multi-Role Auth
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<FirebaseUser | null>(null);
  // Core CMS Data States (Persistent source of truth is Firebase/Firestore)
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>([]);
  const [studentLifeAlbums, setStudentLifeAlbums] = useState<StudentLifeAlbum[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<ImpactStat[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadableResource[]>([]);
  const [sermons, setSermons] = useState<SermonLecture[]>([]);
  const [scrapbook, setScrapbook] = useState<ScrapbookItem[]>([]);
  const [selectedScrapbookItem, setSelectedScrapbookItem] = useState<ScrapbookItem | null>(null);
  const [migrationAudit, setMigrationAudit] = useState<MigrationAuditItem[]>([]);

  // YouTube Videos & Homepage Video Settings
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [homepageVideoConfig, setHomepageVideoConfig] = useState<HomepageVideoConfig>(INITIAL_HOMEPAGE_VIDEO_CONFIG);

  const featuredVideo = React.useMemo(() => {
    if (homepageVideoConfig.featuredVideoId) {
      const match = videos.find((v) => v.id === homepageVideoConfig.featuredVideoId);
      if (match) return match;
    }
    const explicit = videos.find((v) => v.isFeatured && v.isPublished);
    if (explicit) return explicit;
    const firstPublished = videos.find((v) => v.isPublished);
    return firstPublished || videos[0] || null;
  }, [videos, homepageVideoConfig.featuredVideoId]);

  // Applications
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [activeTrackerRef, setActiveTrackerRef] = useState<string>('');

  // Donation Management & Giving Portal
  const [donationMethods, setDonationMethods] = useState<DonationPaymentMethod[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donationSettings, setDonationSettings] = useState<DonationSettings>(INITIAL_DONATION_SETTINGS);

  // Student Portal, Multi-Student Directory, & Online Enrollment System
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [registryBlockedStudents, setRegistryBlockedStudents] = useState<StudentProfile[]>([]);
  const rawAdminStudentRowsRef = useRef<StudentProfile[] | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(DEMO_STUDENT_PROFILE);
  const [enrollments, setEnrollments] = useState<OnlineEnrollment[]>([]);
  const [studentNotifications, setStudentNotifications] = useState<StudentNotification[]>([]);
  const [currentEnrollmentDraft, setCurrentEnrollmentDraft] = useState<Partial<OnlineEnrollment> | null>(null);

  // Enrollment Submenu Active Tab
  const [enrollmentActiveSubTab, setEnrollmentActiveSubTab] = useState<EnrollmentSubmenuTab>('profile');

  // Academic Subjects, Pre-Enlistment, Adding & Dropping, and Fee Structure
  const [academicSubjects, setAcademicSubjects] = useState<AcademicSubject[]>([]);
  const [preEnlistments, setPreEnlistments] = useState<PreEnlistmentRecord[]>([]);
  const [addDropRequests, setAddDropRequests] = useState<AddDropRequest[]>([]);
  const [studentPayments, setStudentPayments] = useState<StudentBalancePayment[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubject[]>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructureItem[]>([]);

  // Academic Periods, Class Sections, Instructors, and Enrollment Policy Config
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [instructors, setInstructors] = useState<InstructorRecord[]>([]);
  const [enrollmentSystemConfig, setEnrollmentSystemConfig] = useState<EnrollmentSystemConfig>(INITIAL_ENROLLMENT_SYSTEM_CONFIG);

  const currentAcademicPeriod = academicPeriods.find((p) => p.isCurrent) || academicPeriods[0] || INITIAL_ACADEMIC_PERIODS[0];

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser>(INITIAL_ADMIN_USERS[0]);

  // Restore client-side cached data immediately after hydration completes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const readCache = <T,>(key: string, validator?: (v: any) => boolean): T | null => {
        try {
          const raw = localStorage.getItem(`pcm_cache_${key}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (validator ? validator(parsed) : parsed !== null && parsed !== undefined) {
              return parsed as T;
            }
          }
        } catch {}
        return null;
      };

      // Only hydrate from client cache if Firestore has not already loaded authoritative live data
      const isColFresh = (colKey: string) => firestoreLoadedCollectionsRef.current.has(colKey);

      const cConfig = readCache<SiteConfig>('siteConfig', (v) => v && typeof v === 'object');
      if (cConfig && !isColFresh('siteConfig')) setSiteConfig((prev) => ({ ...prev, ...cConfig }));

      const cProgs = readCache<AcademicProgram[]>('programs', Array.isArray);
      if (cProgs && !isColFresh('programs')) setPrograms(cProgs);

      const cFac = readCache<FacultyMember[]>('faculty', Array.isArray);
      if (cFac && !isColFresh('faculty')) setFaculty(cFac);

      const cAnn = readCache<AnnouncementItem[]>('announcements', Array.isArray);
      if (cAnn && !isColFresh('announcements')) setAnnouncements(cAnn);

      const cNews = readCache<NewsArticle[]>('news', Array.isArray);
      if (cNews && !isColFresh('news')) setNews(cNews);

      const cEvents = readCache<CollegeEvent[]>('events', Array.isArray);
      if (cEvents && !isColFresh('events')) setEvents(cEvents);

      const cDown = readCache<DownloadableResource[]>('downloads', Array.isArray);
      if (cDown && !isColFresh('downloads')) setDownloads(cDown);

      const cTest = readCache<Testimonial[]>('testimonials', Array.isArray);
      if (cTest && !isColFresh('testimonials')) setTestimonials(cTest);

      const cStats = readCache<ImpactStat[]>('stats', Array.isArray);
      if (cStats && !isColFresh('stats')) setStats(cStats);

      const cFaqs = readCache<FAQItem[]>('faqs', Array.isArray);
      if (cFaqs && !isColFresh('faqs')) setFaqs(cFaqs);

      const cSerm = readCache<SermonLecture[]>('sermons', Array.isArray);
      if (cSerm && !isColFresh('sermons')) setSermons(cSerm);

      const cScrap = readCache<ScrapbookItem[]>('scrapbook', Array.isArray);
      if (cScrap && !isColFresh('scrapbook')) setScrapbook(cScrap);

      const cVideos = readCache<YouTubeVideo[]>('videos', Array.isArray);
      if (cVideos && !isColFresh('videos')) setVideos(cVideos);

      const cVidCfg = readCache<HomepageVideoConfig>('homepageVideoConfig', (v) => v && typeof v === 'object');
      if (cVidCfg && !isColFresh('homepageVideoConfig')) setHomepageVideoConfig(cVidCfg);

      const cMedia = readCache<MediaItem[]>('mediaItems', Array.isArray);
      if (cMedia && !isColFresh('mediaLibrary')) setMediaItems(cMedia);

      const cGal = readCache<GalleryAlbum[]>('galleryAlbums', Array.isArray);
      if (cGal && !isColFresh('galleryAlbums')) setGalleryAlbums(cGal);

      const cSL = readCache<StudentLifeAlbum[]>('studentLifeAlbums', Array.isArray);
      if (cSL && !isColFresh('studentLifeAlbums')) setStudentLifeAlbums(cSL);

      const cApps = readCache<AdmissionApplication[]>('applications', Array.isArray);
      if (cApps && !isColFresh('applications')) setApplications(cApps);

      const cDonMethods = readCache<DonationPaymentMethod[]>('donationMethods', Array.isArray);
      if (cDonMethods && !isColFresh('donationPaymentMethods')) setDonationMethods(cDonMethods);

      const cDonations = readCache<DonationRecord[]>('donations', Array.isArray);
      if (cDonations && !isColFresh('donations')) setDonations(cDonations);

      const cDonSettings = readCache<DonationSettings>('donationSettings', (v) => v && typeof v === 'object');
      if (cDonSettings && !isColFresh('donationSettings')) setDonationSettings(cDonSettings);

      const cStudents = readCache<StudentProfile[]>('students', Array.isArray);
      if (cStudents && !isColFresh('studentProfiles')) setStudents(cStudents);

      const cProfile = readCache<StudentProfile>('studentProfile', (v) => v && typeof v === 'object');
      if (cProfile && !isColFresh('studentProfiles')) setStudentProfile(cProfile);

      const cEnrollments = readCache<OnlineEnrollment[]>('enrollments', Array.isArray);
      if (cEnrollments && !isColFresh('enrollments')) setEnrollments(cEnrollments);

      const cNotifs = readCache<StudentNotification[]>('studentNotifications', Array.isArray);
      if (cNotifs && !isColFresh('studentNotifications')) setStudentNotifications(cNotifs);

      const cSubjects = readCache<AcademicSubject[]>('academicSubjects', Array.isArray);
      if (cSubjects && !isColFresh('academicSubjects')) setAcademicSubjects(cSubjects);

      const cPreEnlist = readCache<PreEnlistmentRecord[]>('preEnlistments', Array.isArray);
      if (cPreEnlist && !isColFresh('preEnlistments')) setPreEnlistments(cPreEnlist);

      const cAddDrop = readCache<AddDropRequest[]>('addDropRequests', Array.isArray);
      if (cAddDrop && !isColFresh('addDropRequests')) setAddDropRequests(cAddDrop);

      const cFee = readCache<FeeStructureItem[]>('feeStructure', Array.isArray);
      if (cFee && !isColFresh('feeStructure')) setFeeStructure(cFee);

      const cPeriods = readCache<AcademicPeriod[]>('academicPeriods', Array.isArray);
      if (cPeriods && !isColFresh('academicPeriods')) setAcademicPeriods(cPeriods);

      const cSections = readCache<ClassSection[]>('classSections', Array.isArray);
      if (cSections && !isColFresh('classSections')) setClassSections(cSections);

      const cInstructors = readCache<InstructorRecord[]>('instructors', Array.isArray);
      if (cInstructors && !isColFresh('instructors')) setInstructors(cInstructors);

      const cEnrollConfig = readCache<EnrollmentSystemConfig>('enrollmentSystemConfig', (v) => v && typeof v === 'object');
      if (cEnrollConfig && !isColFresh('enrollmentSettings')) setEnrollmentSystemConfig(cEnrollConfig);

      const cUsers = readCache<UserAccount[]>('userAccounts', Array.isArray);
      if (cUsers && !isColFresh('users')) setUserAccounts(cUsers);

      const cAdmins = readCache<AdminUser[]>('adminUsers', Array.isArray);
      if (cAdmins && !isColFresh('adminUsers')) setAdminUsers(cAdmins);
    } catch (e) {
      console.warn('Notice restoring client cache:', e);
    }
  }, []);

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
    if (typeof window !== 'undefined') {
      try {
        const targetHash = section === 'home' ? '' : `#${section}`;
        if (window.location.hash !== targetHash) {
          if (targetHash) {
            window.history.pushState(null, '', `${window.location.pathname}${targetHash}`);
          } else {
            window.history.pushState(null, '', window.location.pathname);
          }
        }
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize section with browser hash and history navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUrlChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (ALL_VALID_SECTIONS.includes(hash as NavSection)) {
        setCurrentSection(hash as NavSection);
      } else if (!hash) {
        setCurrentSection('home');
      }
    };
    // Apply the URL's section once mounted, so links like /#apply or /#portal open directly.
    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

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

      // Save activity logs to Firestore (supports both credential and Google admins)
      safeSetDoc(doc(db, 'activityLogs', newLog.id), newLog, { merge: true }).catch(() => {});
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
    studentLifeAlbums,
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
      studentLifeAlbums,
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
    studentLifeAlbums,
    adminUsers,
    userAccounts,
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

  // Failed saves and dropped data must be visible: many save helpers report success
  // optimistically, so lib/firebase.ts announces failures and we show them here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastShown = 0;
    const onWriteFailed = (e: Event) => {
      const { code, quota } = (e as CustomEvent).detail || {};
      const now = Date.now();
      if (now - lastShown < 3000) return; // one message per burst (e.g. a failed batch)
      lastShown = now;
      addToast(
        'error',
        'Not saved',
        code === 'permission-denied'
          ? 'Your account does not have permission to make this change, so it was not saved.'
          : quota
          ? 'The database is over its daily limit, so this change was not saved. Please try again later.'
          : 'This change could not be saved. Please check your connection, refresh, and try again.'
      );
    };
    const onDataDropped = () => {
      addToast('warning', 'Image not saved', 'An image was larger than about 850 KB and could not be stored. Please upload a smaller image.');
    };
    window.addEventListener(WRITE_FAILED_EVENT, onWriteFailed);
    window.addEventListener(DATA_DROPPED_EVENT, onDataDropped);
    return () => {
      window.removeEventListener(WRITE_FAILED_EVENT, onWriteFailed);
      window.removeEventListener(DATA_DROPPED_EVENT, onDataDropped);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore active user/admin session across browser refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Admin sessions are never restored from localStorage: anyone can write to it from
      // devtools. Admin access is granted only by the Firebase Auth listener below,
      // which re-verifies the signed-in user's role against Firestore on every load.
      // The same applies to Student Portal sessions: access comes from Firebase sign-in plus
      // a linked student record, so stored sessions are discarded rather than trusted.
      localStorage.removeItem('pcm_admin_session');
      localStorage.removeItem('pcm_student_session');
    } catch (e) {
      console.warn('Session hydration notice:', e);
    }
  }, []);

  // Sync entire dataset to Firestore in atomic batches (or verify sync if no custom payload)
  const syncAllDataToFirestore = useCallback(
    async (force: boolean = false, customData?: any): Promise<boolean> => {
      try {
        setFirebaseSyncStatus('syncing');

        // If no explicit custom backup restore payload is provided, do NOT blindly overwrite Firestore.
        // Firestore is already the persistent single source of truth and updated in real-time.
        if (!customData) {
          try {
            await getDoc(doc(db, 'systemConfig', 'metadata'));
          } catch {}
          setIsFirebaseConnected(true);
          setFirebaseSyncStatus('synced');
          setLastSyncedAt(new Date());
          if (force) {
            addToast('success', 'Firebase Synced', 'All website collections are actively synchronized with Cloud Firestore.');
          }
          return true;
        }

        const st = customData;

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
            st.mediaItems
              .filter((m: any) => {
                const targetUrl = m.downloadURL || m.url || '';
                return !!targetUrl;
              })
              .forEach((m: any) => {
                const cleaned = cleanFirestoreData({
                  ...m,
                  downloadURL: m.downloadURL || m.url || '',
                  url: m.downloadURL || m.url || '',
                });
                mediaBatch.set(doc(db, 'mediaLibrary', m.id), cleaned, { merge: true });
                mediaBatch.set(doc(db, 'mediaItems', m.id), cleaned, { merge: true });
              });
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

        // 14b. Student Life albums batch
        if (st.studentLifeAlbums && st.studentLifeAlbums.length > 0) {
          try {
            const slBatch = writeBatch(db);
            st.studentLifeAlbums.forEach((alb: any) => slBatch.set(doc(db, 'studentLifeAlbums', alb.id), cleanFirestoreData(alb), { merge: true }));
            await slBatch.commit();
          } catch (e) {
            console.warn('Student life albums batch sync notice:', e);
          }
        }

        // 15. Admin users batch
        if (st.adminUsers && st.adminUsers.length > 0) {
          try {
            const admBatch = writeBatch(db);
            st.adminUsers
              .filter((u: any) => !isUserDeleted(u))
              .forEach((u: any) => admBatch.set(doc(db, 'adminUsers', u.id), cleanFirestoreData(u), { merge: true }));
            await admBatch.commit();
          } catch (e) {
            console.warn('Admin users batch sync notice:', e);
          }
        }

        // 15b. Google & System User Accounts directory batch
        if (st.userAccounts && st.userAccounts.length > 0) {
          try {
            const userBatch = writeBatch(db);
            st.userAccounts
              .filter((u: any) => !isUserDeleted(u))
              .forEach((u: any) => userBatch.set(doc(db, 'users', u.uid || u.id), cleanFirestoreData(u), { merge: true }));
            await userBatch.commit();
          } catch (e) {
            console.warn('User accounts batch sync notice:', e);
          }
        }

        // 15c. Deleted Users Registry batch
        if (deletedUsers && deletedUsers.length > 0) {
          try {
            const delBatch = writeBatch(db);
            deletedUsers.forEach((d: DeletedUserRecord) => {
              const docId = (d.email || d.uid || d.id).replace(/[/\\?%*:|"<>]/g, '_').toLowerCase();
              delBatch.set(doc(db, 'deletedUsers', docId), cleanFirestoreData(d), { merge: true });
            });
            await delBatch.commit();
          } catch (e) {
            console.warn('Deleted users batch sync notice:', e);
          }
        }

        // 16. Student Profiles & Directory batch
        if (st.students && st.students.length > 0) {
          try {
            const studentBatch = writeBatch(db);
            st.students
              .filter((s: any) => !isUserDeleted(s))
              .forEach((s: any) => studentBatch.set(doc(db, 'studentProfiles', s.id), cleanFirestoreData(s), { merge: true }));
            await studentBatch.commit();
          } catch (e) {
            console.warn('Student profiles batch sync notice:', e);
          }
        } else if (st.studentProfile && !isUserDeleted(st.studentProfile)) {
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

        // 16d. Admissions Applications batch
        if (st.applications && st.applications.length > 0) {
          try {
            const appBatch = writeBatch(db);
            st.applications.forEach((app: any) => {
              appBatch.set(doc(db, 'applications', app.id), cleanFirestoreData(app), { merge: true });
            });
            await appBatch.commit();
          } catch (e) {
            console.warn('Applications batch sync notice:', e);
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
    [addToast, deletedUsers, isUserDeleted]
  );

  // Real-time Firestore Subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    let singleUserUnsub: (() => void) | null = null;
    const seededCollections = new Set<string>();

    const initializeFirestoreSync = async () => {
      try {
        setFirebaseSyncStatus('syncing');

        // 0. Verify system initialization marker in Firestore:
        // NEVER auto-seed or restore hardcoded sample data if the system was already initialized
        // or if Firestore already contains documents.
        let isSystemAlreadyInitialized = true;
        if (initialSeededRef.current) {
          isSystemAlreadyInitialized = true;
        } else {
          try {
            const metaSnap = await getDoc(doc(db, 'systemConfig', 'metadata')).catch(() => null);
            if (metaSnap && metaSnap.exists() && metaSnap.data()?.isInitialized) {
              isSystemAlreadyInitialized = true;
              initialSeededRef.current = true;
            } else {
              // Check across all major collections if ANY records already exist in Firestore
              const [
                progCheck,
                facCheck,
                newsCheck,
                mediaCheck,
                siteConfigCheck,
                annCheck,
                evtCheck,
                usrCheck,
                admCheck,
                vidCheck,
                studCheck,
              ] = await Promise.all([
                getDocs(collection(db, 'programs')).catch(() => null),
                getDocs(collection(db, 'faculty')).catch(() => null),
                getDocs(collection(db, 'news')).catch(() => null),
                getDocs(collection(db, 'mediaLibrary')).catch(() => null),
                getDoc(doc(db, 'siteConfig', 'global')).catch(() => null),
                getDocs(collection(db, 'announcements')).catch(() => null),
                getDocs(collection(db, 'events')).catch(() => null),
                getDocs(collection(db, 'users')).catch(() => null),
                getDocs(collection(db, 'adminUsers')).catch(() => null),
                getDocs(collection(db, 'videos')).catch(() => null),
                getDocs(collection(db, 'studentProfiles')).catch(() => null),
              ]);

              const hasExistingData =
                Boolean(progCheck && !progCheck.empty) ||
                Boolean(facCheck && !facCheck.empty) ||
                Boolean(newsCheck && !newsCheck.empty) ||
                Boolean(mediaCheck && !mediaCheck.empty) ||
                Boolean(annCheck && !annCheck.empty) ||
                Boolean(evtCheck && !evtCheck.empty) ||
                Boolean(usrCheck && !usrCheck.empty) ||
                Boolean(admCheck && !admCheck.empty) ||
                Boolean(vidCheck && !vidCheck.empty) ||
                Boolean(studCheck && !studCheck.empty) ||
                Boolean(siteConfigCheck && siteConfigCheck.exists());

              if (hasExistingData) {
                isSystemAlreadyInitialized = true;
                initialSeededRef.current = true;
                await safeSetDoc(doc(db, 'systemConfig', 'metadata'), {
                  isInitialized: true,
                  databaseId: firebaseConfig.firestoreDatabaseId || '',
                  permanentStorage: true,
                  initializedAt: new Date().toISOString(),
                  reason: 'Existing database collections detected',
                });
              } else {
                // If every check failed or returned null (e.g. offline/transient error), default to true to NEVER overwrite data!
                const allVerifiedEmpty =
                  progCheck !== null && progCheck.empty &&
                  facCheck !== null && facCheck.empty &&
                  newsCheck !== null && newsCheck.empty &&
                  mediaCheck !== null && mediaCheck.empty &&
                  annCheck !== null && annCheck.empty &&
                  evtCheck !== null && evtCheck.empty &&
                  usrCheck !== null && usrCheck.empty &&
                  admCheck !== null && admCheck.empty &&
                  vidCheck !== null && vidCheck.empty &&
                  studCheck !== null && studCheck.empty &&
                  siteConfigCheck !== null && !siteConfigCheck.exists();

                if (allVerifiedEmpty) {
                  isSystemAlreadyInitialized = false;
                } else {
                  // Err on the side of safety: existing collections present or network initializing
                  isSystemAlreadyInitialized = true;
                  initialSeededRef.current = true;
                }
              }
            }
          } catch (initErr) {
            console.warn('[PCM Firestore] Notice checking system metadata:', initErr);
            isSystemAlreadyInitialized = true; // Err on side of safety: NEVER overwrite existing data!
            initialSeededRef.current = true;
          }
        }

        // Baseline seeding ONLY for genuinely fresh, completely empty databases (never overwrites existing collections)
        if (!isSystemAlreadyInitialized && !initialSeededRef.current) {
          console.info('[PCM Firestore] Genuinely fresh database confirmed. Initializing baseline records...');
          try {
            const [cfgSnap, slideSnap, lapSnap, slSnap, vidCfgSnap, donSnap, enrollCfgSnap] = await Promise.all([
              getDoc(doc(db, 'siteConfig', 'global')).catch(() => null),
              getDoc(doc(db, 'siteContent', 'slideshow')).catch(() => null),
              getDoc(doc(db, 'siteContent', 'lifeAtPcm')).catch(() => null),
              getDoc(doc(db, 'siteContent', 'studentLife')).catch(() => null),
              getDoc(doc(db, 'homepageVideoConfig', 'global')).catch(() => null),
              getDoc(doc(db, 'donationSettings', 'global')).catch(() => null),
              getDoc(doc(db, 'enrollmentSettings', 'global-enrollment-settings')).catch(() => null),
            ]);

            // Guard: If ANY document already exists, DO NOT seed
            const anyDocExists =
              (cfgSnap && cfgSnap.exists()) ||
              (slideSnap && slideSnap.exists()) ||
              (lapSnap && lapSnap.exists()) ||
              (slSnap && slSnap.exists()) ||
              (vidCfgSnap && vidCfgSnap.exists()) ||
              (donSnap && donSnap.exists()) ||
              (enrollCfgSnap && enrollCfgSnap.exists());

            if (!anyDocExists) {
              if (cfgSnap !== null && !cfgSnap.exists()) {
                await safeSetDoc(doc(db, 'siteConfig', 'global'), INITIAL_SITE_CONFIG);
              }
              if (slideSnap !== null && !slideSnap.exists()) {
                await safeSetDoc(doc(db, 'siteContent', 'slideshow'), {
                  slides: INITIAL_SITE_CONFIG.heroSlides || [],
                  updatedAt: new Date().toISOString(),
                  updatedBy: 'System Baseline',
                  isPublished: true,
                });
              }
              if (lapSnap !== null && !lapSnap.exists()) {
                await safeSetDoc(doc(db, 'siteContent', 'lifeAtPcm'), cleanFirestoreData({
                  ...INITIAL_LIFE_AT_PCM_CONFIG,
                  updatedAt: new Date().toISOString(),
                  updatedBy: 'System Baseline',
                }));
              }
              if (slSnap !== null && !slSnap.exists()) {
                await safeSetDoc(doc(db, 'siteContent', 'studentLife'), cleanFirestoreData({
                  ...INITIAL_STUDENT_LIFE_CONFIG,
                  updatedAt: new Date().toISOString(),
                  updatedBy: 'System Baseline',
                  isPublished: true,
                }));
              }
              if (vidCfgSnap !== null && !vidCfgSnap.exists()) {
                await safeSetDoc(doc(db, 'homepageVideoConfig', 'global'), INITIAL_HOMEPAGE_VIDEO_CONFIG);
              }
              if (donSnap !== null && !donSnap.exists()) {
                await safeSetDoc(doc(db, 'donationSettings', 'global'), INITIAL_DONATION_SETTINGS);
              }
              if (enrollCfgSnap !== null && !enrollCfgSnap.exists()) {
                await safeSetDoc(doc(db, 'enrollmentSettings', 'global-enrollment-settings'), INITIAL_ENROLLMENT_SYSTEM_CONFIG);
              }

              // Only seed a collection if the collection check definitively succeeded and is empty
              const seedBatchIfEmpty = async (col: string, items: any[]) => {
                if (!items || items.length === 0) return;
                try {
                  const existing = await getDocs(collection(db, col)).catch(() => null);
                  if (existing === null || !existing.empty) {
                    return;
                  }
                  const b = writeBatch(db);
                  items.forEach((item: any) => {
                    const docId = item.id || `seed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    b.set(doc(db, col, docId), cleanFirestoreData(item), { merge: true });
                  });
                  await b.commit();
                } catch (e) {
                  console.warn(`[PCM Firestore] Notice seeding ${col}:`, e);
                }
              };

              await Promise.all([
                seedBatchIfEmpty('programs', INITIAL_PROGRAMS),
                seedBatchIfEmpty('faculty', INITIAL_FACULTY),
                seedBatchIfEmpty('announcements', INITIAL_ANNOUNCEMENTS),
                seedBatchIfEmpty('news', INITIAL_NEWS),
                seedBatchIfEmpty('events', INITIAL_EVENTS),
                seedBatchIfEmpty('downloads', INITIAL_DOWNLOADS),
                seedBatchIfEmpty('testimonials', INITIAL_TESTIMONIALS),
                seedBatchIfEmpty('stats', INITIAL_STATS),
                seedBatchIfEmpty('faqs', INITIAL_FAQS),
                seedBatchIfEmpty('sermons', INITIAL_SERMONS),
                seedBatchIfEmpty('scrapbook', INITIAL_SCRAPBOOK),
                seedBatchIfEmpty('mediaLibrary', INITIAL_MEDIA_ITEMS),
                seedBatchIfEmpty('galleryAlbums', INITIAL_GALLERY_ALBUMS),
                seedBatchIfEmpty('studentLifeAlbums', INITIAL_STUDENT_LIFE_ALBUMS),
                // Accounts and student records are never seeded with sample people.
                seedBatchIfEmpty('donationPaymentMethods', INITIAL_DONATION_METHODS),
                seedBatchIfEmpty('academicSubjects', INITIAL_ACADEMIC_SUBJECTS),
                seedBatchIfEmpty('feeStructure', INITIAL_FEE_STRUCTURE),
                seedBatchIfEmpty('academicPeriods', INITIAL_ACADEMIC_PERIODS),
                seedBatchIfEmpty('classSections', INITIAL_CLASS_SECTIONS),
                seedBatchIfEmpty('instructors', INITIAL_INSTRUCTORS),
                seedBatchIfEmpty('videos', INITIAL_VIDEOS),
              ]);
            }

            await safeSetDoc(doc(db, 'systemConfig', 'metadata'), {
              isInitialized: true,
              databaseId: firebaseConfig.firestoreDatabaseId || '',
              permanentStorage: true,
              initializedAt: new Date().toISOString(),
              version: '1.0.0',
            });
            isSystemAlreadyInitialized = true;
            initialSeededRef.current = true;
          } catch (seedErr) {
            console.warn('[PCM Firestore] Baseline seeding notice:', seedErr);
          }
        }

        // 1. Site Config Single Source of Truth
        logFirestoreOp('listen', 'siteConfig/global', 'Public Site Config Real-Time Sync');
        const uConfig = onSnapshot(
          doc(db, 'siteConfig', 'global'),
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as SiteConfig;
              firestoreLoadedCollectionsRef.current.add('siteConfig');
              setSiteConfig((prev) => {
                const updated: SiteConfig = {
                  ...prev,
                  ...data,
                  heroSlides:
                    hasAuthoritativeSlideshowRef.current && prev.heroSlides !== undefined
                      ? prev.heroSlides
                      : (data.heroSlides !== undefined && Array.isArray(data.heroSlides) && data.heroSlides.length > 0)
                      ? data.heroSlides
                      : (prev.heroSlides && prev.heroSlides.length > 0)
                      ? prev.heroSlides
                      : data.heroSlides,
                  lifeAtPcm:
                    hasAuthoritativeLifeAtPcmRef.current && prev.lifeAtPcm !== undefined
                      ? prev.lifeAtPcm
                      : (data.lifeAtPcm !== undefined && data.lifeAtPcm?.items && data.lifeAtPcm.items.length > 0)
                      ? data.lifeAtPcm
                      : (prev.lifeAtPcm && prev.lifeAtPcm?.items && prev.lifeAtPcm.items.length > 0)
                      ? prev.lifeAtPcm
                      : (data.lifeAtPcm || prev.lifeAtPcm),
                  studentLife:
                    hasAuthoritativeStudentLifeRef.current && prev.studentLife !== undefined
                      ? {
                          ...prev.studentLife,
                          ...(hasAuthoritativeLifeAtPcmRef.current && prev.lifeAtPcm
                            ? { lifeAtPcm: prev.lifeAtPcm }
                            : {}),
                        }
                      : (data.studentLife || prev.studentLife)
                      ? ({
                          ...(prev.studentLife || {}),
                          ...(data.studentLife || {}),
                          ...(hasAuthoritativeLifeAtPcmRef.current && prev.lifeAtPcm
                            ? { lifeAtPcm: prev.lifeAtPcm }
                            : prev.lifeAtPcm
                            ? { lifeAtPcm: prev.lifeAtPcm }
                            : data.lifeAtPcm
                            ? { lifeAtPcm: data.lifeAtPcm }
                            : {}),
                        } as StudentLifeConfig)
                      : prev.studentLife,
                };
                setCachedData('siteConfig', updated);
                try {
                  return JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated;
                } catch {
                  return updated;
                }
              });
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

        // 1b. Authoritative Slideshow Listener from siteContent/slideshow
        logFirestoreOp('listen', 'siteContent/slideshow', 'Public Slideshow Real-Time Sync');
        const uSlideshow = onSnapshot(
          doc(db, 'siteContent', 'slideshow'),
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data?.slides && Array.isArray(data.slides)) {
                hasAuthoritativeSlideshowRef.current = true;
                firestoreLoadedCollectionsRef.current.add('slideshow');
                setSiteConfig((prev) => {
                  try {
                    if (JSON.stringify(prev.heroSlides) === JSON.stringify(data.slides)) {
                      return prev;
                    }
                  } catch {}
                  const updated: SiteConfig = {
                    ...prev,
                    heroSlides: data.slides,
                  };
                  setCachedData('siteConfig', updated);
                  return updated;
                });
              }
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'siteContent/slideshow');
          }
        );
        unsubs.push(uSlideshow);

        // 1c. Authoritative Life at PCM Real-Time Listener from siteContent/lifeAtPcm
        logFirestoreOp('listen', 'siteContent/lifeAtPcm', 'Life at PCM Real-Time Sync');
        const uLifeAtPcm = onSnapshot(
          doc(db, 'siteContent', 'lifeAtPcm'),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as LifeAtPCMConfig;
              if (data && typeof data === 'object') {
                hasAuthoritativeLifeAtPcmRef.current = true;
                firestoreLoadedCollectionsRef.current.add('lifeAtPcm');
                setSiteConfig((prev) => {
                  const updated: SiteConfig = {
                    ...prev,
                    lifeAtPcm: {
                      ...prev.lifeAtPcm,
                      ...data,
                      items: Array.isArray(data.items) ? data.items : prev.lifeAtPcm?.items || [],
                    },
                    studentLife: prev.studentLife
                      ? {
                          ...prev.studentLife,
                          lifeAtPcm: {
                            ...prev.lifeAtPcm,
                            ...data,
                            items: Array.isArray(data.items) ? data.items : prev.lifeAtPcm?.items || [],
                          },
                        }
                      : prev.studentLife,
                  };
                  setCachedData('siteConfig', updated);
                  return updated;
                });
              }
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'siteContent/lifeAtPcm');
          }
        );
        unsubs.push(uLifeAtPcm);

        // 2. Programs
        logFirestoreOp('listen', 'programs', 'Academic Programs Real-Time Sync');
        const uPrograms = onSnapshot(
          collection(db, 'programs'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('programs');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AcademicProgram[];
              setPrograms((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('programs', list);
            } else {
              setPrograms([]);
              setCachedData('programs', []);
            }
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
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('faculty');
            if (!snap.empty) {
              const list = snap.docs.map((d) => {
                const data = d.data() as any;
                return {
                  id: d.id,
                  ...data,
                  imageUrl: data.imageUrl || data.image || '',
                  image: data.imageUrl || data.image || '',
                } as FacultyMember;
              });
              list.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
              setFaculty((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('faculty', list);
              setSelectedFaculty((currentSelected) => {
                if (!currentSelected) return null;
                const match = list.find((m) => m.id === currentSelected.id);
                return match || currentSelected;
              });
            } else {
              setFaculty([]);
              setCachedData('faculty', []);
            }
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
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('announcements');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AnnouncementItem[];
              setAnnouncements((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('announcements', list);
            } else {
              setAnnouncements([]);
              setCachedData('announcements', []);
            }
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
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('news');
            if (!snap.empty) {
              const list = snap.docs.map((d) => {
                const data = d.data() as any;
                const img = data.image || data.imageUrl || '';
                return {
                  id: d.id,
                  ...data,
                  image: img,
                  imageUrl: img,
                } as NewsArticle;
              });
              setNews((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('news', list);
            } else {
              setNews([]);
              setCachedData('news', []);
            }
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
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('events');
            if (!snap.empty) {
              const list = snap.docs.map((d) => {
                const data = d.data() as any;
                const img = data.image || data.imageUrl || '';
                return {
                  id: d.id,
                  ...data,
                  image: img,
                  imageUrl: img,
                } as CollegeEvent;
              });
              setEvents((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('events', list);
            } else {
              setEvents([]);
              setCachedData('events', []);
            }
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
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('donationPaymentMethods');
            if (!snap.empty) {
              const list = snap.docs.map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  ...data,
                  instructions: normalizeInstructions(data.instructions),
                };
              }) as DonationPaymentMethod[];
              list.sort((a, b) => (a.order || 0) - (b.order || 0));
              setDonationMethods((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('donationMethods', list);
            } else {
              setDonationMethods([]);
              setCachedData('donationMethods', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
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
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('donationSettings');
            if (snap.exists()) {
              const data = snap.data() as DonationSettings;
              setDonationSettings(data);
              setCachedData('donationSettings', data);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'donationSettings/global');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uDonSettings);

        // 9. YouTube Videos Real-Time Sync
        logFirestoreOp('listen', 'videos', 'YouTube Video Management Real-Time Sync');
        const uVideos = onSnapshot(
          collection(db, 'videos'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('videos');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as YouTubeVideo[];
              list.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
              setVideos((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('videos', list);
            } else {
              setVideos([]);
              setCachedData('videos', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'videos');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uVideos);

        // 10. Homepage Video Settings Real-Time Sync
        logFirestoreOp('listen', 'homepageVideoConfig/global', 'Homepage Video Settings Real-Time Sync');
        const uHomeVideoConfig = onSnapshot(
          doc(db, 'homepageVideoConfig', 'global'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('homepageVideoConfig');
            if (snap.exists()) {
              const data = snap.data() as HomepageVideoConfig;
              setHomepageVideoConfig(data);
              setCachedData('homepageVideoConfig', data);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'homepageVideoConfig/global');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uHomeVideoConfig);

        // 11. Media Library Real-Time Sync
        logFirestoreOp('listen', 'mediaLibrary', 'Media Library Real-Time Sync');
        const uMediaLibrary = onSnapshot(
          collection(db, 'mediaLibrary'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('mediaLibrary');
            if (!snap.empty) {
              const list = snap.docs.map((d) => {
                const data = d.data() as any;
                const fileUrl = data.downloadURL || data.url || '';
                return {
                  id: d.id,
                  ...data,
                  url: fileUrl,
                  downloadURL: fileUrl,
                } as MediaItem;
              });
              list.sort((a, b) => {
                const timeA = new Date(a.createdAt || a.uploadDate || 0).getTime();
                const timeB = new Date(b.createdAt || b.uploadDate || 0).getTime();
                return timeB - timeA;
              });
              setMediaItems((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('mediaItems', list);
            } else {
              setMediaItems([]);
              setCachedData('mediaItems', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'mediaLibrary');
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
          }
        );
        unsubs.push(uMediaLibrary);

        // 12. Testimonials Real-Time Sync
        logFirestoreOp('listen', 'testimonials', 'Public Testimonials Real-Time Sync');
        const uTestimonials = onSnapshot(
          collection(db, 'testimonials'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('testimonials');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Testimonial[];
              setTestimonials((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('testimonials', list);
            } else {
              setTestimonials([]);
              setCachedData('testimonials', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'testimonials');
          }
        );
        unsubs.push(uTestimonials);

        // 13. Impact Stats Real-Time Sync
        logFirestoreOp('listen', 'stats', 'Public Impact Stats Real-Time Sync');
        const uStats = onSnapshot(
          collection(db, 'stats'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('stats');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ImpactStat[];
              setStats((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('stats', list);
            } else {
              setStats([]);
              setCachedData('stats', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'stats');
          }
        );
        unsubs.push(uStats);

        // 14. FAQs Real-Time Sync
        logFirestoreOp('listen', 'faqs', 'Public FAQs Real-Time Sync');
        const uFaqs = onSnapshot(
          collection(db, 'faqs'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('faqs');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FAQItem[];
              setFaqs((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('faqs', list);
            } else {
              setFaqs([]);
              setCachedData('faqs', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'faqs');
          }
        );
        unsubs.push(uFaqs);

        // 15. Downloadable Resources Real-Time Sync
        logFirestoreOp('listen', 'downloads', 'Downloads Real-Time Sync');
        const uDownloads = onSnapshot(
          collection(db, 'downloads'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('downloads');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DownloadableResource[];
              setDownloads((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('downloads', list);
            } else {
              setDownloads([]);
              setCachedData('downloads', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'downloads');
          }
        );
        unsubs.push(uDownloads);

        // 16. Sermons Real-Time Sync
        logFirestoreOp('listen', 'sermons', 'Chapel Sermons Real-Time Sync');
        const uSermons = onSnapshot(
          collection(db, 'sermons'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('sermons');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SermonLecture[];
              setSermons((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('sermons', list);
            } else {
              setSermons([]);
              setCachedData('sermons', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'sermons');
          }
        );
        unsubs.push(uSermons);

        // 17. Scrapbook Real-Time Sync
        logFirestoreOp('listen', 'scrapbook', 'Heritage Scrapbook Real-Time Sync');
        const uScrapbook = onSnapshot(
          collection(db, 'scrapbook'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('scrapbook');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ScrapbookItem[];
              setScrapbook((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('scrapbook', list);
            } else {
              setScrapbook([]);
              setCachedData('scrapbook', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'scrapbook');
          }
        );
        unsubs.push(uScrapbook);

        // 18. Gallery Albums Real-Time Sync
        logFirestoreOp('listen', 'galleryAlbums', 'Gallery Albums Real-Time Sync');
        const uGallery = onSnapshot(
          collection(db, 'galleryAlbums'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('galleryAlbums');
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as GalleryAlbum[];
              setGalleryAlbums((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('galleryAlbums', list);
            } else {
              setGalleryAlbums([]);
              setCachedData('galleryAlbums', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'galleryAlbums');
          }
        );
        unsubs.push(uGallery);

        // 18b. Student Life Multi-Image Albums Real-Time Sync
        logFirestoreOp('listen', 'studentLifeAlbums', 'Student Life Albums Real-Time Sync');
        const uStudentLifeAlbums = onSnapshot(
          collection(db, 'studentLifeAlbums'),
          async (snap) => {
            firestoreLoadedCollectionsRef.current.add('studentLifeAlbums');
            if (!snap.empty) {
              const list = snap.docs.map((d) => {
                const data = d.data();
                const photos = Array.isArray(data.photos) ? data.photos : [];
                return {
                  id: d.id,
                  ...data,
                  photos,
                  photoCount: photos.length,
                } as StudentLifeAlbum;
              });
              list.sort(
                (a, b) =>
                  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
                  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              );
              setStudentLifeAlbums((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('studentLifeAlbums', list);
            } else {
              setStudentLifeAlbums([]);
              setCachedData('studentLifeAlbums', []);
            }
            setIsFirebaseConnected(true);
            setFirebaseSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'studentLifeAlbums');
          }
        );
        unsubs.push(uStudentLifeAlbums);

        // 19. Dedicated Student Life Real-Time Sync
        logFirestoreOp('listen', 'siteContent/studentLife', 'Student Life Section Real-Time Sync');
        const uStudentLife = onSnapshot(
          doc(db, 'siteContent', 'studentLife'),
          (snap) => {
            if (snap.exists()) {
              hasAuthoritativeStudentLifeRef.current = true;
              firestoreLoadedCollectionsRef.current.add('studentLife');
              const slData = snap.data() as StudentLifeConfig;
              const { lifeAtPcm: _lap, ...cleanSL } = slData;
              setSiteConfig((prev) => {
                const updated: SiteConfig = {
                  ...prev,
                  studentLife: {
                    ...(prev.studentLife || {}),
                    ...cleanSL,
                    lifeAtPcm: prev.lifeAtPcm || prev.studentLife?.lifeAtPcm,
                  } as StudentLifeConfig,
                };
                setCachedData('siteConfig', updated);
                return updated;
              });
              setIsFirebaseConnected(true);
              setFirebaseSyncStatus('synced');
              setLastSyncedAt(new Date());
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, 'siteContent/studentLife');
          }
        );
        unsubs.push(uStudentLife);

        // 20-23. Applications, student records, enrollments and notifications are private:
        // they are loaded by the auth-scoped effect below (all records for admins, only the
        // signed-in user's own records for applicants and students).

        // 24. Academic Subjects collection
        logFirestoreOp('listen', 'academicSubjects', 'Academic Subjects Public Sync');
        const uSubjects = onSnapshot(
          collection(db, 'academicSubjects'),
          async (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AcademicSubject[];
              setAcademicSubjects((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('academicSubjects', list);
            } else {
              setAcademicSubjects([]);
              setCachedData('academicSubjects', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'academicSubjects')
        );
        unsubs.push(uSubjects);

        // 25. Pre-enlistments are private; see the auth-scoped effect below.

        // 26. Fee Structure collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'feeStructure', 'Fee Structure Universal Sync');
        const uFeeStruct = onSnapshot(
          collection(db, 'feeStructure'),
          async (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FeeStructureItem[];
              setFeeStructure((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('feeStructure', list);
            } else {
              setFeeStructure([]);
              setCachedData('feeStructure', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'feeStructure')
        );
        unsubs.push(uFeeStruct);

        // 27. Academic Periods collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'academicPeriods', 'Academic Periods Universal Sync');
        const uPeriods = onSnapshot(
          collection(db, 'academicPeriods'),
          async (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AcademicPeriod[];
              setAcademicPeriods((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('academicPeriods', list);
            } else {
              setAcademicPeriods([]);
              setCachedData('academicPeriods', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'academicPeriods')
        );
        unsubs.push(uPeriods);

        // 28. Class Sections collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'classSections', 'Class Sections Universal Sync');
        const uSections = onSnapshot(
          collection(db, 'classSections'),
          async (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClassSection[];
              setClassSections((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('classSections', list);
            } else {
              setClassSections([]);
              setCachedData('classSections', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'classSections')
        );
        unsubs.push(uSections);

        // 29. Instructors collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'instructors', 'Instructors Faculty Universal Sync');
        const uInstructors = onSnapshot(
          collection(db, 'instructors'),
          async (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as InstructorRecord[];
              setInstructors((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('instructors', list);
            } else {
              setInstructors([]);
              setCachedData('instructors', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'instructors')
        );
        unsubs.push(uInstructors);

        // 30. Enrollment Settings config (Universal Real-Time Sync)
        logFirestoreOp('listen', 'enrollmentSettings', 'Enrollment Settings Universal Sync');
        const uEnrollSettings = onSnapshot(
          doc(db, 'enrollmentSettings', 'global-enrollment-settings'),
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as EnrollmentSystemConfig;
              setEnrollmentSystemConfig(data);
              setCachedData('enrollmentSystemConfig', data);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'enrollmentSettings')
        );
        unsubs.push(uEnrollSettings);

        // 31. Add/drop requests are private; see the auth-scoped effect below.

        // 32. Donations collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'donations', 'Donations Review Universal Sync');
        const uDonations = onSnapshot(
          collection(db, 'donations'),
          async (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DonationRecord[];
              setDonations((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('donations', list);
            } else {
              setDonations([]);
              setCachedData('donations', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'donations')
        );
        unsubs.push(uDonations);

        // 33. Activity Logs collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'activityLogs', 'Activity Audit Logs Universal Sync');
        const uLogs = onSnapshot(
          collection(db, 'activityLogs'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ActivityLogItem[];
              setActivityLogs((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('activityLogs', list);
            } else {
              setActivityLogs([]);
              setCachedData('activityLogs', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'activityLogs')
        );
        unsubs.push(uLogs);

        // 34. Users collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'users', 'Active Users & Roles Universal Sync');
        const uUsers = onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const list = (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserAccount[]).filter(
              (u) => !isUserDeletedRef.current(u)
            );
            setUserAccounts((prev) => {
              const next = syncWithAdminsAndStudents(list, stateRef.current.adminUsers, stateRef.current.students);
              setCachedData('userAccounts', next);
              return areUserAccountsEqual(prev, next) ? prev : next;
            });
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'users')
        );
        unsubs.push(uUsers);

        // 35. Admin Users collection (Universal Real-Time Sync)
        logFirestoreOp('listen', 'adminUsers', 'Admin System Accounts Universal Sync');
        const uAdmins = onSnapshot(
          collection(db, 'adminUsers'),
          async (snap) => {
            if (!snap.empty) {
              const list = (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AdminUser[]).filter(
                (a) => !isUserDeletedRef.current(a)
              );
              setAdminUsers((prev) => (areEntitiesEqual(prev, list) ? prev : list));
              setCachedData('adminUsers', list);
              setUserAccounts((prev) => {
                const next = syncWithAdminsAndStudents(prev, list, stateRef.current.students);
                setCachedData('userAccounts', next);
                return areUserAccountsEqual(prev, next) ? prev : next;
              });
            } else {
              setAdminUsers([]);
              setCachedData('adminUsers', []);
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'adminUsers')
        );
        unsubs.push(uAdmins);

        // 36. Listen to Firebase Auth state & Single User Profile (Targeted Read / Subscription)
        const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
          setFirebaseAuthUser(fbUser);

          // Clean up prior single user listener if user changes
          if (singleUserUnsub) {
            singleUserUnsub();
            singleUserUnsub = null;
          }

          if (fbUser) {
            const emailLower = fbUser.email?.toLowerCase() || '';
            if (isUserDeletedRef.current(emailLower) || isUserDeletedRef.current(fbUser.uid)) {
              setCurrentUserAccount(null);
              setIsAdminLoggedIn(false);
              setIsStudentLoggedIn(false);
              signOut(auth).catch(() => {});
              return;
            }
            // Email-based admin matching only counts once Firebase has verified the user owns
            // that address; otherwise anyone could register an unverified account with an admin email.
            const isEmailVerified = fbUser.emailVerified === true;
            const isSuperAdminEmail = isEmailVerified && SUPER_ADMIN_EMAILS.includes(emailLower);
            // Admin access comes only from the live adminUsers directory (entries an approver
            // created), never from the built-in sample list in initialData.ts.
            const isKnownAdmin = (stateRef.current?.adminUsers || []).find(
              (a) =>
                (a.id === fbUser.uid || (isEmailVerified && a.email.toLowerCase() === emailLower)) &&
                (!a.status || a.status === 'Active')
            );

            let initialRole: UserRole = isSuperAdminEmail
              ? 'Super Admin'
              : isKnownAdmin
              ? (isKnownAdmin.role as UserRole)
              : 'Student/User';
            let initialAdminRole: AdminRole | undefined = isSuperAdminEmail
              ? 'Super Admin'
              : isKnownAdmin
              ? isKnownAdmin.role
              : undefined;

            let acc: UserAccount = {
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: isKnownAdmin?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM User',
              displayName: isKnownAdmin?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM User',
              photoURL: fbUser.photoURL || '',
              avatarUrl: fbUser.photoURL || '',
              role: initialRole,
              adminRole: initialAdminRole,
              status: 'Active',
              verificationStatus: 'Approved',
              authMethod: fbUser.providerData?.[0]?.providerId === 'password' ? 'password' : 'google.com',
              provider: fbUser.providerData?.[0]?.providerId || 'google.com',
              emailVerified: fbUser.emailVerified,
              createdAt: isKnownAdmin?.createdAt || new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };

            // Role granted by the adminUsers directory (by uid, or by verified email). Kept so the
            // live users/{uid} listener below doesn't demote an admin whose profile doc still
            // carries an older non-admin role.
            let directoryAdminRole: AdminRole | undefined = isKnownAdmin?.role;

            // Targeted check of active authenticated user profile and admin collection
            try {
              const [userSnap, adminSnap, adminEmailSnap] = await Promise.all([
                getDoc(doc(db, 'users', fbUser.uid)).catch(() => null),
                getDoc(doc(db, 'adminUsers', fbUser.uid)).catch(() => null),
                isEmailVerified && emailLower
                  ? getDoc(doc(db, 'adminEmails', emailLower)).catch(() => null)
                  : Promise.resolve(null),
              ]);

              // The adminUsers list may not have loaded yet when auth resolves; the email index
              // covers that gap for admins matched by verified email.
              const indexed = adminEmailSnap && adminEmailSnap.exists() ? adminEmailSnap.data() : null;
              if (!directoryAdminRole && indexed?.active === true && indexed.role && !isSuperAdminEmail) {
                directoryAdminRole = indexed.role as AdminRole;
                acc.role = indexed.role as UserRole;
                acc.adminRole = indexed.role as AdminRole;
                acc.verificationStatus = 'Approved';
              }

              const adminDocData = adminSnap && adminSnap.exists() ? (adminSnap.data() as AdminUser) : null;
              if (adminDocData && (!adminDocData.status || adminDocData.status === 'Active')) {
                const adminData = adminDocData;
                directoryAdminRole = adminData.role || 'Admin';
                acc.role = (adminData.role as UserRole) || 'Admin';
                acc.adminRole = adminData.role || 'Admin';
                acc.name = adminData.name || acc.name;
                acc.displayName = adminData.name || acc.displayName;
                acc.department = adminData.department || acc.department;
              }

              if (userSnap && userSnap.exists()) {
                const stored = userSnap.data() as UserAccount;
                acc = {
                  ...acc,
                  ...stored,
                  role: acc.role !== 'Student/User' ? acc.role : stored.role,
                  adminRole: acc.adminRole || stored.adminRole,
                };
                if (isSuperAdminEmail) {
                  acc.role = 'Super Admin';
                  acc.adminRole = 'Super Admin';
                  acc.status = 'Active';
                  acc.verificationStatus = 'Approved';
                } else if (
                  directoryAdminRole &&
                  ['Pending', 'Pending Verification'].includes(acc.status as string)
                ) {
                  // Listed in the admin directory by an administrator: an old pending
                  // request on the profile shouldn't block access.
                  acc.status = 'Active';
                  acc.verificationStatus = 'Approved';
                }
              } else {
                safeSetDoc(doc(db, 'users', fbUser.uid), acc, { merge: true }).catch(() => {});
              }
            } catch {
              // Fallback to local memory/state if client is offline
              const localMatch = (stateRef.current?.userAccounts || []).find(
                (u) => u.uid === fbUser.uid || u.id === fbUser.uid || u.email?.toLowerCase() === emailLower
              );
              if (localMatch) {
                acc = { ...acc, ...localMatch };
              }
            }

            setCurrentUserAccount(acc);

            const isPendingAdmin =
              acc.status === 'Pending' || acc.status === 'Pending Verification' || acc.role === 'Pending User';
            const isRestricted = acc.status === 'Rejected' || acc.status === 'Disabled' || acc.status === 'Inactive';
            const isAdminRole = [
              'Super Admin',
              'Admin',
              'Staff/Editor',
              'Editor',
              'Content Admin',
              'Academic Admin',
              'Registrar',
              'Finance',
            ].includes(acc.role as string);
            const isApprovedStatus = acc.status === 'Active' || acc.status === 'Approved';

            if (isPendingAdmin || isRestricted) {
              setIsAdminLoggedIn(false);
            } else if (isAdminRole && isApprovedStatus) {
              setIsAdminLoggedIn(true);
              setIsStudentLoggedIn(false);
              setCurrentAdminUser({
                id: acc.uid,
                name: acc.name || acc.displayName || 'Administrator',
                email: acc.email,
                username: acc.email.split('@')[0] || 'admin',
                role: acc.adminRole || (acc.role === 'Staff/Editor' ? 'Staff/Editor' : 'Admin'),
                department: acc.department || 'Administration & Executive Leadership',
                status: 'Active',
                createdAt: acc.createdAt,
                avatarUrl: acc.photoURL || acc.avatarUrl,
              });
            } else {
              // Not an admin. Student Portal access comes from a linked student record,
              // which the auth-scoped data effect looks up (see "Private admissions and
              // student data"); a signed-in user without one is treated as an applicant.
              setIsAdminLoggedIn(false);
            }

            // Real-time listener specifically for current user's profile document only
            logFirestoreOp('listen', `users/${fbUser.uid}`, 'Current user profile document listener');
            singleUserUnsub = onSnapshot(
              doc(db, 'users', fbUser.uid),
              (userSnap) => {
                if (userSnap.exists()) {
                  const updatedProfile = userSnap.data() as UserAccount;
                  if (isSuperAdminEmail) {
                    updatedProfile.role = 'Super Admin';
                    updatedProfile.adminRole = 'Super Admin';
                    updatedProfile.status = 'Active';
                    updatedProfile.verificationStatus = 'Approved';
                  } else if (
                    directoryAdminRole &&
                    (updatedProfile.role === 'Student/User' || updatedProfile.role === 'Pending User' || !updatedProfile.role) &&
                    !['Rejected', 'Disabled', 'Inactive'].includes(updatedProfile.status as string)
                  ) {
                    updatedProfile.role = directoryAdminRole as UserRole;
                    updatedProfile.adminRole = directoryAdminRole;
                    updatedProfile.status = 'Active';
                  }
                  setCurrentUserAccount((prev) => (prev ? { ...prev, ...updatedProfile } : updatedProfile));

                  const nowAdminRole = [
                    'Super Admin',
                    'Admin',
                    'Staff/Editor',
                    'Editor',
                    'Content Admin',
                    'Academic Admin',
                    'Registrar',
                    'Finance',
                  ].includes(updatedProfile.role as string);
                  const nowApproved = updatedProfile.status === 'Active' || updatedProfile.status === 'Approved';

                  if (nowAdminRole && nowApproved) {
                    setIsAdminLoggedIn(true);
                    setCurrentAdminUser({
                      id: updatedProfile.uid,
                      name: updatedProfile.name || updatedProfile.displayName || 'Administrator',
                      email: updatedProfile.email,
                      username: updatedProfile.email.split('@')[0] || 'admin',
                      role: updatedProfile.adminRole || (updatedProfile.role === 'Staff/Editor' ? 'Staff/Editor' : 'Admin'),
                      department: updatedProfile.department || 'Administration & Executive Leadership',
                      status: 'Active',
                      createdAt: updatedProfile.createdAt,
                      avatarUrl: updatedProfile.photoURL || updatedProfile.avatarUrl,
                    });
                  } else {
                    setIsAdminLoggedIn(false);
                  }
                }
              },
              (err) => handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`)
            );
          } else {
            // No Firebase user: there is no admin session. Admin access always requires a
            // Firebase-authenticated account whose role is verified above.
            // Student Portal sessions also require Firebase sign-in now, so nothing is
            // restored from localStorage.
            setIsAdminLoggedIn(false);
            setIsStudentLoggedIn(false);
            setCurrentUserAccount(null);
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('pcm_student_session');
                localStorage.removeItem('pcm_user_session');
              } catch {}
            }
          }
        });
        unsubs.push(unsubAuth);

        // 37. Listen to deletedUsers collection (Global Deletion Registry)
        logFirestoreOp('listen', 'deletedUsers', 'Deleted Users Registry Listener');
        const unsubDeleted = onSnapshot(
          collection(db, 'deletedUsers'),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), docId: d.id })) as DeletedUserRecord[];
            const map = new Map<string, DeletedUserRecord>();
            list.forEach((item) => {
              const key = (item.email || item.id || item.uid || '').toLowerCase().trim();
              if (key) map.set(key, item);
            });
            const merged = Array.from(map.values());
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('pcm_deleted_users', JSON.stringify(merged));
              } catch {}
            }
            setDeletedUsers(merged);

            const deletedEmails = new Set(
              merged.map((d) => (d.email || '').toLowerCase().trim()).filter(Boolean)
            );
            const deletedIds = new Set(
              merged.map((d) => (d.id || d.uid || '').toLowerCase().trim()).filter(Boolean)
            );
            const isDel = (u: any) => {
              if (!u) return false;
              const em = (u.email || '').toLowerCase().trim();
              const id = (u.id || u.uid || '').toLowerCase().trim();
              const std = (u.studentId || '').toLowerCase().trim();
              return (
                (em && deletedEmails.has(em)) ||
                (id && deletedIds.has(id)) ||
                (std && (deletedIds.has(std) || deletedEmails.has(std)))
              );
            };

            setUserAccounts((prev) => prev.filter((u) => !isDel(u)));
            setAdminUsers((prev) => prev.filter((a) => !isDel(a)));
            setStudents((prev) => prev.filter((s) => !isDel(s)));
          },
          (err) => console.warn('deletedUsers listener error:', err)
        );
        unsubs.push(unsubDeleted);

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
  }, [syncWithAdminsAndStudents]);

  // Upload media file to Firebase Storage & register in Media Library
  const uploadMediaFile = async (
    file: File | Blob,
    category: string = 'General',
    title?: string,
    altText?: string,
    tags?: string[],
    folder?: string,
    caption?: string
  ): Promise<string> => {
    const rawFileName = (file as File).name || `pcm_media_${Date.now()}.jpg`;
    const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanTitle = title?.trim() || rawFileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const id = `med-${Date.now()}`;
    const storagePath = `mediaLibrary/${id}_${cleanFileName}`;

    // Calculate dimensions
    let dimensions = '1600x1067';
    try {
      const dims = await getImageDimensions(file);
      if (dims.width && dims.height) {
        dimensions = `${dims.width}x${dims.height}`;
      }
    } catch (e) {
      console.warn('Dimensions calculation notice:', e);
    }

    const downloadUrl = await uploadFileToFirebaseStorage(file, storagePath, {
      contentType: file.type || 'image/jpeg',
    });

    // Implement dataUrl persistence in Firestore for small files (<= 800KB) for resilient offline and cross-session persistence
    let inlineDataUrl: string | undefined = undefined;
    if (downloadUrl && downloadUrl.startsWith('data:')) {
      inlineDataUrl = downloadUrl;
    } else if (file.size && file.size <= 800 * 1024) {
      try {
        inlineDataUrl = await blobToDataUrl(file);
      } catch (dataUrlErr) {
        console.warn('Inline dataUrl generation notice:', dataUrlErr);
      }
    }

    const now = new Date();
    const formattedSize = file.size
      ? file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : 'Custom Asset';

    const newMedia: MediaItem = cleanFirestoreData({
      id,
      title: cleanTitle,
      fileName: cleanFileName,
      storagePath,
      downloadURL: downloadUrl,
      url: downloadUrl,
      dataUrl: inlineDataUrl || (downloadUrl.startsWith('data:') ? downloadUrl : undefined),
      category,
      folder: folder || '',
      caption: caption || '',
      altText: altText?.trim() || `PCM ${cleanTitle}`,
      fileSize: formattedSize,
      fileSizeBytes: file.size || 0,
      dimensions,
      contentType: file.type || 'image/jpeg',
      uploadDate: now.toISOString().split('T')[0],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      uploadedBy: currentAdminUser?.name || 'Administrator',
      uploadedByUid: auth.currentUser?.uid || currentAdminUser?.id || '',
      tags: tags || [],
    });

    setMediaItems((prev) => [newMedia, ...prev.filter((m) => m.id !== id)]);
    await safeSetDoc(doc(db, 'mediaLibrary', newMedia.id), newMedia);
    await safeSetDoc(doc(db, 'mediaItems', newMedia.id), newMedia);

    logActivity('CREATE', 'Media Asset', newMedia.id, newMedia.title, `Uploaded media asset to ${category} Media Library.`);
    return downloadUrl;
  };

  // Replace existing media file in Firebase Storage & update Firestore document
  const replaceMediaFile = async (
    id: string,
    newFile: File | Blob
  ): Promise<MediaItem> => {
    const existing = mediaItems.find((m) => m.id === id);
    if (!existing) throw new Error('Media asset not found');

    const rawFileName = (newFile as File).name || `pcm_media_${Date.now()}.jpg`;
    const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `mediaLibrary/${id}_${cleanFileName}`;

    let dimensions = existing.dimensions || '1600x1067';
    try {
      const dims = await getImageDimensions(newFile);
      if (dims.width && dims.height) {
        dimensions = `${dims.width}x${dims.height}`;
      }
    } catch (e) {
      console.warn('Dimensions calculation notice:', e);
    }

    const downloadUrl = await uploadFileToFirebaseStorage(newFile, storagePath, {
      contentType: newFile.type || 'image/jpeg',
    });

    if (existing.storagePath && existing.storagePath !== storagePath) {
      deleteFileFromFirebaseStorage(existing.storagePath).catch(() => {});
    }

    const now = new Date();
    const formattedSize = newFile.size
      ? newFile.size < 1024 * 1024
        ? `${(newFile.size / 1024).toFixed(1)} KB`
        : `${(newFile.size / (1024 * 1024)).toFixed(1)} MB`
      : existing.fileSize;

    const updatedMedia: MediaItem = cleanFirestoreData({
      ...existing,
      fileName: cleanFileName,
      storagePath,
      downloadURL: downloadUrl,
      url: downloadUrl,
      dataUrl: downloadUrl.startsWith('data:') ? downloadUrl : existing.dataUrl,
      fileSize: formattedSize,
      fileSizeBytes: newFile.size || existing.fileSizeBytes || 0,
      dimensions,
      contentType: newFile.type || existing.contentType || 'image/jpeg',
      updatedAt: now.toISOString(),
    });

    setMediaItems((prev) => prev.map((m) => (m.id === id ? updatedMedia : m)));
    await safeSetDoc(doc(db, 'mediaLibrary', id), updatedMedia, { merge: true });
    await safeSetDoc(doc(db, 'mediaItems', id), updatedMedia, { merge: true });

    logActivity('UPDATE', 'Media Asset', id, updatedMedia.title, `Replaced image file for "${updatedMedia.title}".`);
    addToast('success', 'Image Replaced', `File replaced for "${updatedMedia.title}".`);
    return updatedMedia;
  };

  // RBAC Permission Check
  const canPerformAction = (requiredRole: AdminRole): boolean => {
    if (!isAdminLoggedIn || !currentAdminUser) return false;
    if (currentUserAccount?.status && !['Active', 'Approved'].includes(currentUserAccount.status)) return false;
    if (currentUserAccount?.role === 'Student' || currentUserAccount?.role === 'Student/User' || currentUserAccount?.role === 'Pending User') return false;
    if (currentAdminUser.role === 'Super Admin') return true;
    if (requiredRole === 'Super Admin') return false;
    if (currentAdminUser.role === 'Admin') return true;
    if (currentAdminUser.role === requiredRole) return true;
    if (requiredRole === 'Editor' || requiredRole === 'Staff/Editor') return true;
    if (requiredRole === 'Content Admin' && ['Super Admin', 'Admin', 'Content Admin', 'Academic Admin', 'Staff/Editor'].includes(currentAdminUser.role)) return true;
    if (requiredRole === 'Registrar' && ['Super Admin', 'Admin', 'Registrar'].includes(currentAdminUser.role)) return true;
    if (requiredRole === 'Finance' && ['Super Admin', 'Admin', 'Finance'].includes(currentAdminUser.role)) return true;
    if (requiredRole === 'Academic Admin' && ['Super Admin', 'Admin', 'Academic Admin'].includes(currentAdminUser.role)) return true;
    return false;
  };

  const canPerformEnrollmentAction = (action: string, role?: AdminRole): boolean => {
    // Requires a verified admin session; there is no default role.
    if (!isAdminLoggedIn) return false;
    const userRole = role || currentAdminUser?.role || (currentUserAccount?.adminRole as AdminRole);
    if (!userRole) return false;
    if (userRole === 'Super Admin') return true;

    if (userRole === 'Registrar') {
      return [
        'view_dashboard',
        'manage_students',
        'create_student',
        'edit_student',
        'archive_student',
        'restore_student',
        'manage_subjects',
        'manage_sections',
        'review_pre_enlistment',
        'approve_pre_enlistment',
        'review_enrollment',
        'approve_enrollment',
        'reject_enrollment',
        'return_enrollment',
        'manage_add_drop',
        'approve_add_drop',
        'disapprove_add_drop',
      ].includes(action);
    }

    if (userRole === 'Finance') {
      return [
        'view_dashboard',
        'manage_fees',
        'edit_fee_structure',
        'add_fee_structure',
        'delete_fee_structure',
        'record_payment',
        'edit_payment',
        'manage_amount_due',
        'view_assessment',
        'apply_discount',
        'adjust_assessment',
      ].includes(action);
    }

    if (userRole === 'Academic Admin') {
      return [
        'view_dashboard',
        'manage_periods',
        'create_period',
        'edit_period',
        'manage_subjects',
        'create_subject',
        'edit_subject',
        'duplicate_subject',
        'manage_sections',
        'create_section',
        'edit_section',
        'manage_instructors',
        'create_instructor',
        'edit_instructor',
        'manage_settings',
      ].includes(action);
    }

    return false;
  };

  // Site Configuration Updates
  const updateSiteConfig = async (newConfig: Partial<SiteConfig>) => {
    if (newConfig.heroSlides !== undefined) {
      hasAuthoritativeSlideshowRef.current = true;
    }
    if (newConfig.lifeAtPcm !== undefined) {
      hasAuthoritativeLifeAtPcmRef.current = true;
    }
    if (newConfig.studentLife !== undefined) {
      hasAuthoritativeStudentLifeRef.current = true;
    }
    const sanitized = cleanFirestoreData(newConfig);
    setSiteConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig,
        heroSlides: newConfig.heroSlides !== undefined ? newConfig.heroSlides : prev.heroSlides,
        lifeAtPcm: newConfig.lifeAtPcm !== undefined ? newConfig.lifeAtPcm : prev.lifeAtPcm,
        studentLife: newConfig.studentLife !== undefined ? newConfig.studentLife : prev.studentLife,
      };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), sanitized, { merge: true });
      if (newConfig.heroSlides && Array.isArray(newConfig.heroSlides)) {
        await saveSlideshowToFirestore(
          newConfig.heroSlides,
          currentAdminUser?.name || currentUserAccount?.email || 'Administrator'
        );
      }
      if (newConfig.lifeAtPcm) {
        await safeSetDoc(
          doc(db, 'siteContent', 'lifeAtPcm'),
          cleanFirestoreData({
            ...newConfig.lifeAtPcm,
            updatedAt: new Date().toISOString(),
            updatedBy: currentAdminUser?.name || currentUserAccount?.email || 'Administrator',
          }),
          { merge: true }
        );
      }
      if (newConfig.studentLife) {
        const { lifeAtPcm: _lap, ...cleanSL } = newConfig.studentLife;
        await safeSetDoc(
          doc(db, 'siteContent', 'studentLife'),
          cleanFirestoreData({
            ...cleanSL,
            updatedAt: new Date().toISOString(),
            updatedBy: currentAdminUser?.name || currentUserAccount?.email || 'Administrator',
            isPublished: true,
          }),
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('SETTINGS', 'Site Configuration', 'site-config', 'Global Settings', 'Updated global institutional site configuration.');
    addToast('success', 'Configuration Saved', 'Website configuration has been updated and synchronized.');
  };

  const updateContactInfo = async (newInfo: Partial<SiteConfig['contactInfo']>) => {
    const updatedContact = { ...siteConfig.contactInfo, ...newInfo };
    setSiteConfig((prev) => {
      const updated = { ...prev, contactInfo: { ...(prev.contactInfo || {}), ...newInfo } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { contactInfo: cleanFirestoreData(updatedContact) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Contact Information', 'contact-info', 'Campus & Administration Contacts', 'Updated phone, email, and campus address details.');
    addToast('success', 'Contact Details Updated', 'Public contact section synchronized with cloud.');
  };

  const updateSeoSettings = async (newSeo: Partial<SiteConfig['seoSettings']>) => {
    const updatedSeo = { ...siteConfig.seoSettings, ...newSeo };
    setSiteConfig((prev) => {
      const updated = { ...prev, seoSettings: { ...(prev.seoSettings || {}), ...newSeo } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { seoSettings: cleanFirestoreData(updatedSeo) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'SEO & Metadata', 'seo-config', 'Search Engine Configuration', 'Updated meta titles, OpenGraph tags, and keywords.');
    addToast('success', 'SEO Settings Updated', 'Search engine metadata saved to cloud.');
  };

  const updateSiteIdentity = async (newIdentity: Partial<SiteConfig['siteIdentity']>) => {
    const updatedIdentity = { ...siteConfig.siteIdentity, ...newIdentity };
    setSiteConfig((prev) => {
      const updated = { ...prev, siteIdentity: { ...(prev.siteIdentity || {}), ...newIdentity } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { siteIdentity: cleanFirestoreData(updatedIdentity) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Site Identity', 'site-identity', 'Institutional Identity', 'Updated motto, tagline, and institution identity.');
    addToast('success', 'Site Identity Updated', 'Institution branding updated.');
  };

  const updateHomeAbout = async (newHomeAbout: Partial<SiteConfig['homeAbout']>) => {
    const updatedAbout = { ...siteConfig.homeAbout, ...newHomeAbout };
    setSiteConfig((prev) => {
      const updated = { ...prev, homeAbout: { ...(prev.homeAbout || {}), ...newHomeAbout } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { homeAbout: cleanFirestoreData(updatedAbout) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Homepage Section', 'home-about', 'Welcome & About PCM Brief', 'Updated homepage welcome narrative and presidential quote.');
    addToast('success', 'Homepage Content Updated', 'Homepage About section updated.');
  };

  const updateMissionVisionValues = async (newMvv: Partial<SiteConfig['missionVisionValues']>) => {
    const updatedMvv = { ...siteConfig.missionVisionValues, ...newMvv };
    setSiteConfig((prev) => {
      const updated = { ...prev, missionVisionValues: { ...(prev.missionVisionValues || {}), ...newMvv } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { missionVisionValues: cleanFirestoreData(updatedMvv) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Mission & Vision', 'mvv-section', 'Mission, Vision & Core Values', 'Updated institutional mission, vision, and core value statements.');
    addToast('success', 'Mission & Values Updated', 'Pillars and doctrinal statements saved.');
  };

  const updateCtaSections = async (newCtas: Partial<SiteConfig['ctaSections']>) => {
    const updatedCtas = { ...siteConfig.ctaSections, ...newCtas };
    setSiteConfig((prev) => {
      const updated = { ...prev, ctaSections: { ...(prev.ctaSections || {}), ...newCtas } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { ctaSections: cleanFirestoreData(updatedCtas) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'CTA Banners', 'cta-sections', 'Call-to-Action Controls', 'Updated banner headlines, buttons, and target links.');
    addToast('success', 'Call to Action Updated', 'Banners and conversion buttons saved.');
  };

  const updateAdmissionsConfig = async (newAdm: Partial<SiteConfig['admissionsConfig']>) => {
    const updatedAdm = { ...siteConfig.admissionsConfig, ...newAdm };
    setSiteConfig((prev) => {
      const updated = { ...prev, admissionsConfig: { ...(prev.admissionsConfig || {}), ...newAdm } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { admissionsConfig: cleanFirestoreData(updatedAdm) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Admissions Details', 'admissions-config', 'Admissions Key Dates & Rates', 'Updated tuition estimates, downpayment, and key academic dates.');
    addToast('success', 'Admissions Info Saved', 'Admissions portal details updated.');
  };

  const updateFooterConfig = async (newFooter: Partial<SiteConfig['footerConfig']>) => {
    const updatedFooter = { ...siteConfig.footerConfig, ...newFooter };
    setSiteConfig((prev) => {
      const updated = { ...prev, footerConfig: { ...(prev.footerConfig || {}), ...newFooter } };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { footerConfig: cleanFirestoreData(updatedFooter) }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Footer Management', 'footer-config', 'Institutional Footer', 'Updated footer text, accreditation notice, and copyright.');
    addToast('success', 'Footer Updated', 'Footer configuration saved.');
  };

  const updateNavigationMenu = async (newNav: SiteConfig['navigationMenu']) => {
    const sanitizedNav = cleanFirestoreData(newNav);
    setSiteConfig((prev) => {
      const updated = { ...prev, navigationMenu: newNav };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { navigationMenu: sanitizedNav }, { merge: true });
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity('UPDATE', 'Navigation Menu', 'nav-menu', 'Header Navigation Structure', 'Updated menu labels, order, and visibility.');
    addToast('success', 'Navigation Updated', 'Website navbar items updated.');
  };

  const updateStudentLifeConfig = async (newStudentLife: Partial<StudentLifeConfig>) => {
    hasAuthoritativeStudentLifeRef.current = true;
    const currentSL = siteConfig.studentLife || INITIAL_STUDENT_LIFE_CONFIG;
    const updatedSL: StudentLifeConfig = {
      ...currentSL,
      ...newStudentLife,
    };
    const sanitizedSL = cleanFirestoreData(updatedSL);
    setSiteConfig((prev) => {
      const updated = { ...prev, studentLife: updatedSL };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { studentLife: sanitizedSL }, { merge: true });
      const { lifeAtPcm: _lap, ...cleanSL } = updatedSL;
      await safeSetDoc(
        doc(db, 'siteContent', 'studentLife'),
        cleanFirestoreData({
          ...cleanSL,
          updatedAt: new Date().toISOString(),
          updatedBy: currentAdminUser?.name || currentUserAccount?.email || 'Administrator',
          isPublished: true,
        }),
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore write error:', e);
    }
    logActivity(
      'UPDATE',
      'Student Life Section',
      'student-life-config',
      'Spiritual Formation & Student Life',
      'Updated Student Life banner, spiritual formation pillars, student organizations, and weekly ministry opportunities.'
    );
    addToast('success', 'Student Life Section Saved', 'Student Life section configuration has been updated and published.');
  };

  const updateLifeAtPCMConfig = async (newLifeConfig: Partial<LifeAtPCMConfig>) => {
    hasAuthoritativeLifeAtPcmRef.current = true;
    const currentLife = siteConfig.lifeAtPcm || siteConfig.studentLife?.lifeAtPcm || INITIAL_LIFE_AT_PCM_CONFIG;
    const merged: LifeAtPCMConfig = {
      ...currentLife,
      ...newLifeConfig,
      items: newLifeConfig.items !== undefined ? newLifeConfig.items : (currentLife.items || []),
    };
    const sanitizedLife = cleanFirestoreData(merged);
    setSiteConfig((prev) => {
      const updated = {
        ...prev,
        lifeAtPcm: merged,
        studentLife: prev.studentLife
          ? {
              ...prev.studentLife,
              lifeAtPcm: merged,
            }
          : prev.studentLife,
      };
      setCachedData('siteConfig', updated);
      return updated;
    });
    try {
      await safeSetDoc(doc(db, 'siteConfig', 'global'), { lifeAtPcm: sanitizedLife }, { merge: true });
      await safeSetDoc(
        doc(db, 'siteContent', 'lifeAtPcm'),
        cleanFirestoreData({
          ...merged,
          updatedAt: new Date().toISOString(),
          updatedBy: currentAdminUser?.name || currentUserAccount?.email || 'Administrator',
        }),
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore write error for Life at PCM:', e);
    }
    logActivity(
      'UPDATE',
      'Life at PCM Section',
      'life-at-pcm',
      'Homepage Formation Highlights',
      'Updated Life at PCM title, descriptions, or activity cards.'
    );
    addToast('success', 'Life at PCM Saved', 'Life at PCM section details have been updated and permanently saved to Firebase.');
  };

  const saveLifeAtPCMItem = async (item: LifeAtPCMItem) => {
    const currentLife = siteConfig.lifeAtPcm || siteConfig.studentLife?.lifeAtPcm || INITIAL_LIFE_AT_PCM_CONFIG;
    const currentItems = currentLife.items || [];
    const existingIndex = currentItems.findIndex((i) => i.id === item.id);
    let newItems: LifeAtPCMItem[];
    if (existingIndex >= 0) {
      newItems = [...currentItems];
      newItems[existingIndex] = { ...newItems[existingIndex], ...item };
    } else {
      const newOrder = typeof item.order === 'number' ? item.order : currentItems.length + 1;
      newItems = [...currentItems, { ...item, order: newOrder }];
    }
    await updateLifeAtPCMConfig({ items: newItems });
  };

  const deleteLifeAtPCMItem = async (id: string) => {
    const currentLife = siteConfig.lifeAtPcm || siteConfig.studentLife?.lifeAtPcm || INITIAL_LIFE_AT_PCM_CONFIG;
    const currentItems = currentLife.items || [];
    const target = currentItems.find((i) => i.id === id);
    const newItems = currentItems.filter((i) => i.id !== id);
    await updateLifeAtPCMConfig({ items: newItems });
    addToast('info', 'Card Removed', `Removed "${target?.title || id}" from Life at PCM.`);
  };

  const reorderLifeAtPCMItems = async (items: LifeAtPCMItem[]) => {
    const updatedWithOrder = items.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    await updateLifeAtPCMConfig({ items: updatedWithOrder });
  };

  const resetLifeAtPCMToDefault = async () => {
    await updateLifeAtPCMConfig(INITIAL_LIFE_AT_PCM_CONFIG);
    addToast('info', 'Reset to Defaults', 'Life at PCM restored to institutional defaults.');
  };

  // Media Library CRUD (Persistent Cloud Database)
  const addMediaItem = (item: Omit<MediaItem, 'id' | 'uploadDate'>): MediaItem => {
    const id = `med-${Date.now()}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const itemUrl = item.downloadURL || item.url || '';
    const newItem: MediaItem = cleanFirestoreData({
      ...item,
      id,
      url: itemUrl,
      downloadURL: itemUrl,
      uploadDate: dateStr,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      uploadedBy: currentAdminUser?.name || 'Administrator',
      uploadedByUid: auth.currentUser?.uid || currentAdminUser?.id || '',
    });
    setMediaItems((prev) => {
      const next = [newItem, ...prev.filter((m) => m.id !== id)];
      setCachedData('mediaItems', next);
      return next;
    });
    safeSetDoc(doc(db, 'mediaLibrary', newItem.id), newItem).catch((e) => console.warn(e));
    safeSetDoc(doc(db, 'mediaItems', newItem.id), newItem).catch((e) => console.warn(e));
    logActivity('CREATE', 'Media Library', newItem.id, newItem.title, `Added image asset to media library (${newItem.category}).`);
    addToast('success', 'Media Added', `Asset "${newItem.title}" saved to library.`);
    return newItem;
  };

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    const now = new Date().toISOString();
    const normalizedUpdates: Partial<MediaItem> = {
      ...updates,
      updatedAt: now,
      ...(updates.downloadURL && !updates.url ? { url: updates.downloadURL } : {}),
      ...(updates.url && !updates.downloadURL ? { downloadURL: updates.url } : {}),
    };
    const sanitized = cleanFirestoreData(normalizedUpdates);
    setMediaItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...normalizedUpdates } : item));
      setCachedData('mediaItems', next);
      return next;
    });
    safeSetDoc(doc(db, 'mediaLibrary', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    safeSetDoc(doc(db, 'mediaItems', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Media Library', id, updates.title || 'Media Asset', 'Updated media metadata and alt text.');
    addToast('success', 'Media Updated', 'Image asset details updated.');
  };

  const deleteMediaItem = (id: string) => {
    const item = mediaItems.find((m) => m.id === id);
    setMediaItems((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setCachedData('mediaItems', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'mediaLibrary', id)).catch((e) => console.warn(e));
    safeDeleteDoc(doc(db, 'mediaItems', id)).catch((e) => console.warn(e));
    if (item?.storagePath) {
      deleteFileFromFirebaseStorage(item.storagePath).catch((e) => console.warn(e));
    }
    logActivity('DELETE', 'Media Library', id, item?.title || 'Media Asset', 'Removed image asset from media library.');
    addToast('info', 'Media Deleted', 'Image asset removed from library.');
  };

  const deleteMultipleMediaItems = async (ids: string[]): Promise<boolean> => {
    if (!ids || ids.length === 0) return true;
    const targetSet = new Set(ids);
    const itemsToDelete = mediaItems.filter((m) => targetSet.has(m.id));

    // Optimistic UI state update
    setMediaItems((prev) => {
      const next = prev.filter((m) => !targetSet.has(m.id));
      setCachedData('mediaItems', next);
      return next;
    });

    try {
      // Parallel Firestore deletion across collections
      await Promise.all(
        ids.map(async (id) => {
          await Promise.all([
            safeDeleteDoc(doc(db, 'mediaLibrary', id)).catch(() => {}),
            safeDeleteDoc(doc(db, 'mediaItems', id)).catch(() => {}),
            safeDeleteDoc(doc(db, 'uploadedMedia', id)).catch(() => {}),
          ]);
        })
      );

      // Clean up storage paths
      itemsToDelete.forEach((item) => {
        if (item.storagePath) {
          deleteFileFromFirebaseStorage(item.storagePath).catch(() => {});
        }
      });

      logActivity(
        'DELETE',
        'Media Library',
        'bulk-delete',
        `${ids.length} Media Assets`,
        `Permanently deleted ${ids.length} photographic assets from media library.`
      );
      addToast('success', 'Bulk Delete Successful', `Permanently removed ${ids.length} assets.`);
      return true;
    } catch (err: any) {
      console.warn('Bulk media deletion error:', err);
      addToast('error', 'Bulk Delete Failed', err?.message || 'Error deleting selected assets.');
      return false;
    }
  };

  // Gallery Albums CRUD
  const addGalleryAlbum = (album: Omit<GalleryAlbum, 'id'>): GalleryAlbum => {
    const newAlbum: GalleryAlbum = cleanFirestoreData({
      ...album,
      id: `alb-${Date.now()}`,
    });
    setGalleryAlbums((prev) => {
      const next = [newAlbum, ...prev];
      setCachedData('galleryAlbums', next);
      return next;
    });
    safeSetDoc(doc(db, 'galleryAlbums', newAlbum.id), newAlbum, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Gallery Album', newAlbum.id, newAlbum.title, `Created new photo album with ${newAlbum.photos.length} photos.`);
    addToast('success', 'Album Created', `Album "${newAlbum.title}" created.`);
    return newAlbum;
  };

  const updateGalleryAlbum = (id: string, updates: Partial<GalleryAlbum>) => {
    const sanitized = cleanFirestoreData(updates);
    setGalleryAlbums((prev) => {
      const next = prev.map((alb) => (alb.id === id ? { ...alb, ...updates } : alb));
      setCachedData('galleryAlbums', next);
      return next;
    });
    safeSetDoc(doc(db, 'galleryAlbums', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Gallery Album', id, updates.title || 'Album', 'Updated album photos and metadata.');
    addToast('success', 'Album Updated', 'Gallery album saved.');
  };

  const deleteGalleryAlbum = (id: string) => {
    const alb = galleryAlbums.find((a) => a.id === id);
    setGalleryAlbums((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setCachedData('galleryAlbums', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'galleryAlbums', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Gallery Album', id, alb?.title || 'Album', 'Deleted photo album.');
    addToast('info', 'Album Deleted', 'Gallery album deleted.');
  };

  // Student Life in Pictures Albums CRUD (Multi-Image Facebook-inspired Gallery)
  const createStudentLifeAlbum = async (
    albumData: Omit<StudentLifeAlbum, 'id' | 'createdAt' | 'updatedAt' | 'photoCount'>,
    initialPhotos: StudentLifePhotoItem[] = []
  ): Promise<StudentLifeAlbum> => {
    const id = `sl-alb-${Date.now()}`;
    const now = new Date().toISOString();
    const photos = (initialPhotos || []).map((p, idx) => ({
      ...p,
      albumId: id,
      sortOrder: p.sortOrder ?? (idx + 1),
    }));

    const newAlbum: StudentLifeAlbum = cleanFirestoreData({
      ...albumData,
      id,
      photos,
      photoCount: photos.length,
      coverPhotoUrl: albumData.coverPhotoUrl || (photos[0]?.imageUrl || ''),
      status: albumData.status || 'published',
      sortOrder: albumData.sortOrder ?? (studentLifeAlbums.length + 1),
      createdAt: now,
      updatedAt: now,
      createdBy: currentAdminUser?.name || currentUserAccount?.email || 'PCM Administration',
    });

    setStudentLifeAlbums((prev) => {
      const next = [newAlbum, ...prev];
      setCachedData('studentLifeAlbums', next);
      return next;
    });

    try {
      await safeSetDoc(doc(db, 'studentLifeAlbums', id), newAlbum, { merge: true });
    } catch (e) {
      console.warn('Student life album write warning:', e);
    }

    logActivity(
      'CREATE',
      'Student Life Album',
      newAlbum.id,
      newAlbum.title,
      `Created Student Life photo album "${newAlbum.title}" with ${photos.length} photos.`
    );
    addToast('success', 'Album Created', `Album "${newAlbum.title}" created successfully.`);
    return newAlbum;
  };

  const updateStudentLifeAlbum = async (id: string, updates: Partial<StudentLifeAlbum>): Promise<void> => {
    const now = new Date().toISOString();
    const sanitized = cleanFirestoreData({
      ...updates,
      updatedAt: now,
    });

    setStudentLifeAlbums((prev) => {
      const next = prev.map((alb) => {
        if (alb.id !== id) return alb;
        const updated = { ...alb, ...updates, updatedAt: now };
        if (Array.isArray(updated.photos)) {
          updated.photoCount = updated.photos.length;
        }
        return updated;
      });
      setCachedData('studentLifeAlbums', next);
      return next;
    });

    try {
      await safeSetDoc(doc(db, 'studentLifeAlbums', id), sanitized, { merge: true });
    } catch (e) {
      console.warn('Student life album update warning:', e);
    }

    logActivity('UPDATE', 'Student Life Album', id, updates.title || 'Album', 'Updated album details.');
    addToast('success', 'Album Updated', 'Student life album updated.');
  };

  const deleteStudentLifeAlbum = async (id: string): Promise<void> => {
    const alb = studentLifeAlbums.find((a) => a.id === id);
    setStudentLifeAlbums((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setCachedData('studentLifeAlbums', next);
      return next;
    });

    try {
      await safeDeleteDoc(doc(db, 'studentLifeAlbums', id));
    } catch (e) {
      console.warn('Student life album delete warning:', e);
    }

    logActivity('DELETE', 'Student Life Album', id, alb?.title || 'Album', 'Deleted student life album.');
    addToast('info', 'Album Deleted', `Album "${alb?.title || 'Album'}" has been deleted.`);
  };

  const addPhotosToStudentLifeAlbum = async (albumId: string, newPhotos: StudentLifePhotoItem[]): Promise<void> => {
    const targetAlbum = studentLifeAlbums.find((a) => a.id === albumId);
    if (!targetAlbum) return;

    const currentPhotos = targetAlbum.photos || [];
    const maxSort = currentPhotos.reduce((max, p) => Math.max(max, p.sortOrder || 0), 0);

    const formattedPhotos: StudentLifePhotoItem[] = newPhotos.map((p, idx) => ({
      ...p,
      albumId,
      sortOrder: p.sortOrder ?? (maxSort + idx + 1),
    }));

    const combinedPhotos = [...currentPhotos, ...formattedPhotos];
    const coverPhotoUrl = targetAlbum.coverPhotoUrl || formattedPhotos[0]?.imageUrl || '';

    await updateStudentLifeAlbum(albumId, {
      photos: combinedPhotos,
      photoCount: combinedPhotos.length,
      coverPhotoUrl,
    });

    addToast('success', 'Photos Added', `Added ${newPhotos.length} photos to "${targetAlbum.title}".`);
  };

  const updateStudentLifePhoto = async (albumId: string, photoId: string, updates: Partial<StudentLifePhotoItem>): Promise<void> => {
    const targetAlbum = studentLifeAlbums.find((a) => a.id === albumId);
    if (!targetAlbum) return;

    const updatedPhotos = (targetAlbum.photos || []).map((p) =>
      p.id === photoId ? { ...p, ...updates } : p
    );

    await updateStudentLifeAlbum(albumId, {
      photos: updatedPhotos,
    });
  };

  const deleteStudentLifePhoto = async (albumId: string, photoId: string): Promise<void> => {
    const targetAlbum = studentLifeAlbums.find((a) => a.id === albumId);
    if (!targetAlbum) return;

    const currentPhotos = Array.isArray(targetAlbum.photos) ? targetAlbum.photos : [];
    const remainingPhotos = currentPhotos.filter((p) => p.id !== photoId);
    const deletedPhoto = currentPhotos.find((p) => p.id === photoId);

    let newCover = targetAlbum.coverPhotoUrl;
    if (deletedPhoto && deletedPhoto.imageUrl === targetAlbum.coverPhotoUrl) {
      newCover = remainingPhotos[0]?.imageUrl || '';
    } else if (!newCover && remainingPhotos.length > 0) {
      newCover = remainingPhotos[0].imageUrl;
    }

    const now = new Date().toISOString();
    const updates: Partial<StudentLifeAlbum> = {
      photos: remainingPhotos,
      photoCount: remainingPhotos.length,
      coverPhotoUrl: newCover,
      updatedAt: now,
    };

    const sanitized = cleanFirestoreData(updates);

    // Optimistically update local state immediately
    setStudentLifeAlbums((prev) => {
      const next = prev.map((alb) => {
        if (alb.id !== albumId) return alb;
        return {
          ...alb,
          ...updates,
          photoCount: remainingPhotos.length,
        };
      });
      setCachedData('studentLifeAlbums', next);
      return next;
    });

    try {
      await safeSetDoc(doc(db, 'studentLifeAlbums', albumId), sanitized, { merge: true });
    } catch (e) {
      console.warn('Student life photo delete error:', e);
    }

    logActivity(
      'DELETE',
      'Student Life Photo',
      photoId,
      targetAlbum.title,
      `Deleted photo "${deletedPhoto?.caption || deletedPhoto?.fileName || photoId}" from album "${targetAlbum.title}".`
    );
    addToast('info', 'Photo Removed', 'Photo deleted from album.');
  };

  const reorderStudentLifePhotos = async (albumId: string, reorderedPhotos: StudentLifePhotoItem[]): Promise<void> => {
    const withUpdatedOrder = reorderedPhotos.map((p, idx) => ({
      ...p,
      sortOrder: idx + 1,
    }));

    await updateStudentLifeAlbum(albumId, {
      photos: withUpdatedOrder,
    });
  };

  const setStudentLifeAlbumCover = async (albumId: string, coverPhotoUrl: string): Promise<void> => {
    await updateStudentLifeAlbum(albumId, {
      coverPhotoUrl,
    });
    addToast('success', 'Cover Updated', 'Album cover photo updated.');
  };

  const toggleStudentLifeAlbumPublish = async (albumId: string): Promise<void> => {
    const targetAlbum = studentLifeAlbums.find((a) => a.id === albumId);
    if (!targetAlbum) return;
    const newStatus = targetAlbum.status === 'published' ? 'unpublished' : 'published';
    await updateStudentLifeAlbum(albumId, {
      status: newStatus,
    });
    addToast(
      newStatus === 'published' ? 'success' : 'info',
      newStatus === 'published' ? 'Album Published' : 'Album Unpublished',
      `"${targetAlbum.title}" is now ${newStatus === 'published' ? 'published on the public site' : 'unpublished and hidden from public view'}.`
    );
  };

  const moveStudentLifePhoto = async (sourceAlbumId: string, targetAlbumId: string, photoId: string): Promise<void> => {
    const sourceAlbum = studentLifeAlbums.find((a) => a.id === sourceAlbumId);
    const targetAlbum = studentLifeAlbums.find((a) => a.id === targetAlbumId);
    if (!sourceAlbum || !targetAlbum) return;

    const photoToMove = sourceAlbum.photos.find((p) => p.id === photoId);
    if (!photoToMove) return;

    // Remove from source
    await deleteStudentLifePhoto(sourceAlbumId, photoId);
    // Add to target
    await addPhotosToStudentLifeAlbum(targetAlbumId, [{
      ...photoToMove,
      albumId: targetAlbumId,
    }]);

    addToast('success', 'Photo Moved', `Photo moved to "${targetAlbum.title}".`);
  };

  // Announcements CRUD
  const addAnnouncement = (item: Omit<AnnouncementItem, 'id'>) => {
    const newItem: AnnouncementItem = cleanFirestoreData({
      ...item,
      id: `ann-${Date.now()}`,
      status: item.status || 'Published',
    });
    setAnnouncements((prev) => {
      const next = [newItem, ...prev];
      setCachedData('announcements', next);
      return next;
    });
    safeSetDoc(doc(db, 'announcements', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Announcement', newItem.id, newItem.title, 'Created new ticker announcement alert.');
    addToast('success', 'Announcement Published', `New ticker announcement added.`);
  };

  const updateAnnouncement = (id: string, updates: Partial<AnnouncementItem>) => {
    const sanitized = cleanFirestoreData(updates);
    setAnnouncements((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      setCachedData('announcements', next);
      return next;
    });
    safeSetDoc(doc(db, 'announcements', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Announcement', id, updates.title || 'Announcement', 'Updated announcement message.');
    addToast('success', 'Announcement Updated', 'Ticker alert updated.');
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) => {
      const next = prev.map((a) => {
        if (a.id === id) {
          const nextActive = !a.active;
          safeSetDoc(doc(db, 'announcements', id), { active: nextActive }, { merge: true }).catch((e) => console.warn(e));
          logActivity(nextActive ? 'PUBLISH' : 'UNPUBLISH', 'Announcement', id, a.title, `${nextActive ? 'Enabled' : 'Disabled'} announcement ticker.`);
          return { ...a, active: nextActive };
        }
        return a;
      });
      setCachedData('announcements', next);
      return next;
    });
  };

  const deleteAnnouncement = (id: string) => {
    const item = announcements.find((a) => a.id === id);
    setAnnouncements((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setCachedData('announcements', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'announcements', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Announcement', id, item?.title || 'Announcement', 'Deleted announcement ticker item.');
    addToast('info', 'Announcement Removed', 'Ticker message deleted.');
  };

  // Academic Programs CRUD
  const addProgram = (program: Omit<AcademicProgram, 'id'>): AcademicProgram => {
    const mappedLevel = (program.level || (program.degreeLevel ? program.degreeLevel.toLowerCase() : 'undergraduate')) as ProgramLevel;
    const newProg: AcademicProgram = cleanFirestoreData({
      ...program,
      level: mappedLevel,
      degreeLevel: program.degreeLevel || (mappedLevel === 'undergraduate' ? 'Undergraduate' : mappedLevel),
      id: `prog-${Date.now()}`,
      status: program.status || 'Published',
    });
    setPrograms((prev) => {
      const next = [newProg, ...prev];
      setCachedData('programs', next);
      return next;
    });
    safeSetDoc(doc(db, 'programs', newProg.id), newProg, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Academic Program', newProg.id, newProg.name, `Added new academic degree program (${newProg.code}).`);
    addToast('success', 'Program Created', `Added "${newProg.name}" to curriculum directory.`);
    return newProg;
  };

  const updateProgram = (id: string, updates: Partial<AcademicProgram>) => {
    const finalUpdates = { ...updates };
    if (finalUpdates.degreeLevel && !finalUpdates.level) {
      finalUpdates.level = finalUpdates.degreeLevel.toLowerCase() as ProgramLevel;
    } else if (finalUpdates.level && !finalUpdates.degreeLevel) {
      finalUpdates.degreeLevel =
        finalUpdates.level === 'undergraduate'
          ? 'Undergraduate'
          : finalUpdates.level === 'graduate'
          ? 'Graduate'
          : finalUpdates.level === 'senior-high'
          ? 'SHS'
          : finalUpdates.level;
    }
    const sanitized = cleanFirestoreData(finalUpdates);
    setPrograms((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...finalUpdates } : p));
      setCachedData('programs', next);
      return next;
    });
    safeSetDoc(doc(db, 'programs', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Academic Program', id, updates.name || 'Program', 'Updated curriculum, tuition, and admission prerequisites.');
    addToast('success', 'Program Updated', 'Academic degree information saved.');
  };

  const deleteProgram = (id: string) => {
    const prog = programs.find((p) => p.id === id);
    setPrograms((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setCachedData('programs', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'programs', id)).catch((e) => console.warn(e));
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
      updatedAt: new Date().toISOString(),
    });
    setFaculty((prev) => {
      const next = [...prev, newFac];
      setCachedData('faculty', next);
      return next;
    });
    safeSetDoc(doc(db, 'faculty', newFac.id), newFac, { merge: true }).catch((e) => console.warn('addFaculty safeSetDoc error:', e));
    logActivity('CREATE', 'Faculty Member', newFac.id, newFac.name, `Added ${newFac.name} (${newFac.group} - ${newFac.role}) to directory.`);
    addToast('success', 'Faculty Member Added', `Added ${newFac.name} to institutional directory.`);
    return newFac;
  };

  const updateFaculty = (id: string, updates: Partial<FacultyMember>) => {
    const photo = updates.imageUrl !== undefined ? updates.imageUrl : updates.image !== undefined ? updates.image : undefined;
    const normalizedUpdates: Partial<FacultyMember> = {
      ...updates,
      ...(photo !== undefined ? { imageUrl: photo, image: photo } : {}),
      updatedAt: new Date().toISOString(),
    };
    const sanitized = cleanFirestoreData(normalizedUpdates);
    setFaculty((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...normalizedUpdates } : f));
      setCachedData('faculty', next);
      return next;
    });
    setSelectedFaculty((prev) => (prev && prev.id === id ? { ...prev, ...normalizedUpdates } : prev));
    safeSetDoc(doc(db, 'faculty', id), sanitized, { merge: true }).catch((e) => console.warn('updateFaculty safeSetDoc error:', e));
    logActivity('UPDATE', 'Faculty Member', id, updates.name || 'Faculty Member', 'Updated academic credentials, bio, and portrait image.');
    addToast('success', 'Faculty Profile Updated', 'Faculty details saved.');
  };

  const deleteFaculty = (id: string) => {
    const fac = faculty.find((f) => f.id === id);
    setFaculty((prev) => {
      const next = prev.filter((f) => f.id !== id);
      setCachedData('faculty', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'faculty', id)).catch((e) => console.warn('deleteFaculty error:', e));
    logActivity('DELETE', 'Faculty Member', id, fac?.name || 'Faculty Member', 'Removed faculty record from directory.');
    addToast('info', 'Faculty Removed', 'Faculty profile removed.');
  };

  const reorderFaculty = (reordered: FacultyMember[]) => {
    const nowIso = new Date().toISOString();
    const updated = reordered.map((member, index) => ({
      ...member,
      order: index + 1,
      updatedAt: nowIso,
    }));

    setFaculty(updated);
    setCachedData('faculty', updated);

    try {
      const batch = writeBatch(db);
      updated.forEach((member) => {
        batch.set(doc(db, 'faculty', member.id), { order: member.order, updatedAt: nowIso }, { merge: true });
      });
      batch.commit().catch((e) => console.warn('Firestore faculty reorder sync warning:', e));
    } catch (err) {
      console.warn('Batch commit error:', err);
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
    const rawImg = article.imageUrl || article.image || '';
    const newArt: NewsArticle = cleanFirestoreData({
      ...article,
      id: `news-${Date.now()}`,
      imageUrl: rawImg,
      image: rawImg,
      status: article.status || 'Published',
    });
    setNews((prev) => {
      const next = [newArt, ...prev];
      setCachedData('news', next);
      return next;
    });
    safeSetDoc(doc(db, 'news', newArt.id), newArt, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'News Article', newArt.id, newArt.title, 'Published college news/feature article.');
    addToast('success', 'Article Published', `"${newArt.title}" published.`);
    return newArt;
  };

  const updateNewsArticle = (id: string, updates: Partial<NewsArticle>) => {
    const rawImg = updates.imageUrl !== undefined ? updates.imageUrl : updates.image;
    const finalUpdates: Partial<NewsArticle> = {
      ...updates,
      ...(rawImg !== undefined ? { image: rawImg, imageUrl: rawImg } : {}),
    };
    const sanitized = cleanFirestoreData(finalUpdates);
    setNews((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...finalUpdates } : n));
      setCachedData('news', next);
      return next;
    });
    safeSetDoc(doc(db, 'news', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'News Article', id, updates.title || 'News Article', 'Updated article content and cover image.');
    addToast('success', 'Article Updated', 'News article updated.');
  };

  const deleteNewsArticle = (id: string) => {
    const art = news.find((n) => n.id === id);
    setNews((prev) => {
      const next = prev.filter((n) => n.id !== id);
      setCachedData('news', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'news', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'News Article', id, art?.title || 'News Article', 'Deleted news article.');
    addToast('info', 'Article Deleted', 'News article removed.');
  };

  // Events CRUD
  const addEvent = (event: Omit<CollegeEvent, 'id'>): CollegeEvent => {
    const rawImg = event.imageUrl || event.image || '';
    const newEvt: CollegeEvent = cleanFirestoreData({
      ...event,
      id: `evt-${Date.now()}`,
      imageUrl: rawImg,
      image: rawImg,
      registeredAttendees: event.registeredAttendees || [],
    });
    setEvents((prev) => {
      const next = [newEvt, ...prev];
      setCachedData('events', next);
      return next;
    });
    safeSetDoc(doc(db, 'events', newEvt.id), newEvt, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Event', newEvt.id, newEvt.title, `Scheduled college calendar event for ${newEvt.date}.`);
    addToast('success', 'Event Scheduled', `"${newEvt.title}" added to calendar.`);
    return newEvt;
  };

  const updateEvent = (id: string, updates: Partial<CollegeEvent>) => {
    const rawImg = updates.imageUrl !== undefined ? updates.imageUrl : updates.image;
    const finalUpdates: Partial<CollegeEvent> = {
      ...updates,
      ...(rawImg !== undefined ? { image: rawImg, imageUrl: rawImg } : {}),
    };
    const sanitized = cleanFirestoreData(finalUpdates);
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...finalUpdates } : e));
      setCachedData('events', next);
      return next;
    });
    safeSetDoc(doc(db, 'events', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Event', id, updates.title || 'Event', 'Updated event date, venue, and description.');
    addToast('success', 'Event Updated', 'Calendar event saved.');
  };

  const deleteEvent = (id: string) => {
    const evt = events.find((e) => e.id === id);
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      setCachedData('events', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'events', id)).catch((e) => console.warn(e));
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
    setDownloads((prev) => {
      const next = [newRes, ...prev];
      setCachedData('downloads', next);
      return next;
    });
    safeSetDoc(doc(db, 'downloads', newRes.id), newRes, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Resource / Form', newRes.id, newRes.title, `Added downloadable document (${newRes.category}).`);
    addToast('success', 'Resource Added', `"${newRes.title}" is now available for download.`);
    return newRes;
  };

  const updateDownload = (id: string, updates: Partial<DownloadableResource>) => {
    const sanitized = cleanFirestoreData(updates);
    setDownloads((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      setCachedData('downloads', next);
      return next;
    });
    safeSetDoc(doc(db, 'downloads', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Resource / Form', id, updates.title || 'Resource', 'Updated downloadable resource metadata.');
    addToast('success', 'Resource Updated', 'Downloadable document saved.');
  };

  const deleteDownload = (id: string) => {
    const d = downloads.find((item) => item.id === id);
    setDownloads((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setCachedData('downloads', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'downloads', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Resource / Form', id, d?.title || 'Resource', 'Deleted downloadable document.');
    addToast('info', 'Resource Removed', 'Document removed from downloads.');
  };

  // Testimonials CRUD: the list changes only after Firestore confirms the write.
  const addTestimonial = async (item: Omit<Testimonial, 'id'>): Promise<Testimonial | null> => {
    const newItem: Testimonial = cleanFirestoreData({ ...item, id: `test-${Date.now()}` });
    if (!(await safeSetDoc(doc(db, 'testimonials', newItem.id), newItem, { merge: false }))) return null;
    setTestimonials((prev) => {
      const next = [...prev.filter((t) => t.id !== newItem.id), newItem];
      setCachedData('testimonials', next);
      return next;
    });
    logActivity('CREATE', 'Testimonial', newItem.id, newItem.name, `Added testimony quote from ${newItem.name} (${newItem.role}).`);
    addToast('success', 'Testimonial Added', `Added testimonial from ${newItem.name}.`);
    return newItem;
  };

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>, options?: { silent?: boolean }): Promise<boolean> => {
    const target = testimonials.find((t) => t.id === id);
    const sanitized = cleanFirestoreData(updates);
    if (!(await safeSetDoc(doc(db, 'testimonials', id), sanitized, { merge: true }))) return false;
    setTestimonials((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...sanitized } : t));
      setCachedData('testimonials', next);
      return next;
    });
    if (!options?.silent) {
      const name = updates.name || target?.name || 'Testimonial';
      logActivity('UPDATE', 'Testimonial', id, name, 'Updated testimonial.');
      addToast('success', 'Testimonial Updated', `Saved testimonial from ${name}.`);
    }
    return true;
  };

  const deleteTestimonial = async (id: string): Promise<boolean> => {
    const t = testimonials.find((item) => item.id === id);
    if (!(await safeDeleteDoc(doc(db, 'testimonials', id)))) return false;
    setTestimonials((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setCachedData('testimonials', next);
      return next;
    });
    logActivity('DELETE', 'Testimonial', id, t?.name || 'Testimonial', 'Deleted testimonial quote.');
    addToast('info', 'Testimonial Removed', `${t?.name ? `Testimonial from ${t.name}` : 'Testimonial'} deleted.`);
    return true;
  };

  // Stats CRUD
  const updateStat = (id: string, updates: Partial<ImpactStat>) => {
    const sanitized = cleanFirestoreData(updates);
    setStats((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setCachedData('stats', next);
      return next;
    });
    safeSetDoc(doc(db, 'stats', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Institutional Stat', id, updates.label || 'Stat', 'Updated institutional metric values.');
    addToast('success', 'Metric Updated', 'Institutional impact statistic saved.');
  };

  // FAQs CRUD
  const addFaq = (item: Omit<FAQItem, 'id'>) => {
    const newItem: FAQItem = cleanFirestoreData({ ...item, id: `faq-${Date.now()}` });
    setFaqs((prev) => {
      const next = [...prev, newItem];
      setCachedData('faqs', next);
      return next;
    });
    safeSetDoc(doc(db, 'faqs', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'FAQ', newItem.id, newItem.question, 'Added new FAQ entry.');
    addToast('success', 'FAQ Added', 'New question & answer added.');
  };

  const updateFaq = (id: string, updates: Partial<FAQItem>) => {
    const sanitized = cleanFirestoreData(updates);
    setFaqs((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...updates } : f));
      setCachedData('faqs', next);
      return next;
    });
    safeSetDoc(doc(db, 'faqs', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'FAQ', id, updates.question || 'FAQ', 'Updated question and response.');
    addToast('success', 'FAQ Updated', 'FAQ item saved.');
  };

  const deleteFaq = (id: string) => {
    const f = faqs.find((item) => item.id === id);
    setFaqs((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setCachedData('faqs', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'faqs', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'FAQ', id, f?.question || 'FAQ', 'Deleted FAQ entry.');
    addToast('info', 'FAQ Removed', 'FAQ item deleted.');
  };

  // Sermons CRUD
  const addSermon = (item: Omit<SermonLecture, 'id'>) => {
    const newItem: SermonLecture = cleanFirestoreData({ ...item, id: `sermon-${Date.now()}` });
    setSermons((prev) => {
      const next = [newItem, ...prev];
      setCachedData('sermons', next);
      return next;
    });
    safeSetDoc(doc(db, 'sermons', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Sermon / Chapel', newItem.id, newItem.title, `Added chapel audio lecture by ${newItem.speaker}.`);
    addToast('success', 'Sermon Added', `"${newItem.title}" added to chapel archive.`);
  };

  const updateSermon = (id: string, updates: Partial<SermonLecture>) => {
    const sanitized = cleanFirestoreData(updates);
    setSermons((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setCachedData('sermons', next);
      return next;
    });
    safeSetDoc(doc(db, 'sermons', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Sermon / Chapel', id, updates.title || 'Sermon', 'Updated sermon details and audio link.');
    addToast('success', 'Sermon Updated', 'Chapel archive item saved.');
  };

  const deleteSermon = (id: string) => {
    const s = sermons.find((item) => item.id === id);
    setSermons((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setCachedData('sermons', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'sermons', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Sermon / Chapel', id, s?.title || 'Sermon', 'Deleted chapel sermon entry.');
    addToast('info', 'Sermon Removed', 'Chapel sermon removed from archive.');
  };

  // Scrapbook CRUD
  const addScrapbookItem = (item: Omit<ScrapbookItem, 'id'>) => {
    const newItem: ScrapbookItem = cleanFirestoreData({ ...item, id: `sb-${Date.now()}` });
    setScrapbook((prev) => {
      const next = [newItem, ...prev];
      setCachedData('scrapbook', next);
      return next;
    });
    safeSetDoc(doc(db, 'scrapbook', newItem.id), newItem, { merge: true }).catch((e) => console.warn(e));
    logActivity('CREATE', 'Historical Scrapbook', newItem.id, newItem.title, `Added heritage milestone (${newItem.year}).`);
    addToast('success', 'Historical Item Added', `"${newItem.title}" added to heritage archive.`);
  };

  const updateScrapbookItem = (id: string, updates: Partial<ScrapbookItem>) => {
    const sanitized = cleanFirestoreData(updates);
    setScrapbook((prev) => {
      const next = prev.map((sb) => (sb.id === id ? { ...sb, ...updates } : sb));
      setCachedData('scrapbook', next);
      return next;
    });
    safeSetDoc(doc(db, 'scrapbook', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Historical Scrapbook', id, updates.title || 'Heritage Item', 'Updated heritage archive record.');
    addToast('success', 'Heritage Item Updated', 'Scrapbook milestone saved.');
  };

  const deleteScrapbookItem = (id: string) => {
    const sb = scrapbook.find((item) => item.id === id);
    setScrapbook((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setCachedData('scrapbook', next);
      return next;
    });
    safeDeleteDoc(doc(db, 'scrapbook', id)).catch((e) => console.warn(e));
    logActivity('DELETE', 'Historical Scrapbook', id, sb?.title || 'Heritage Item', 'Deleted scrapbook historical record.');
    addToast('info', 'Historical Item Removed', 'Scrapbook record deleted.');
  };

  // Admissions Application Workflow
  // Submits an admission application for the signed-in applicant (Google sign-in required),
  // creating its document checklist and status history. Returns the reference number, or ''
  // if it could not be submitted (the reason is shown as a toast). An applicant with an open
  // application is pointed to it instead of creating a duplicate.
  const submitApplication = async (
    appData: any,
    initialFiles: Record<string, { dataUrl: string; size: number; type: string; name: string }> = {}
  ): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
      addToast('warning', 'Sign In Required', 'Please sign in with your Google account before submitting your application.');
      return '';
    }
    const fullName = String(appData.fullName || '').trim();
    const email = String(appData.email || user.email || '').trim();
    if (!fullName || !email) {
      addToast('error', 'Incomplete Application', 'Your full name and email address are required.');
      return '';
    }

    const program = appData.programName || appData.program || appData.programTitle || '';
    const data = cleanFirestoreData({
      programId: appData.programId || '',
      program,
      programName: program,
      programLevel: appData.programLevel || '',
      fullName,
      email,
      phone: appData.phone || appData.mobileNumber || appData.contactNumber || '',
      dateOfBirth: appData.birthDate || appData.dob || appData.dateOfBirth || '',
      gender: appData.gender || appData.sex || '',
      civilStatus: appData.civilStatus || '',
      address: appData.address || appData.currentAddress || '',
      churchName: appData.churchName || appData.church || '',
      churchAffiliation: appData.churchName || appData.church || '',
      pastorName: appData.pastorName || '',
      pastorContact: appData.pastorPhone || appData.pastorContact || appData.pastorContactNumber || '',
      christianTestimony: appData.testimony || appData.callingTestimony || '',
      callingStatement: appData.ministryCalling || appData.callingStatement || '',
      highestEducation: appData.previousEducation || appData.highestEducationalAttainment || '',
      previousSchool: appData.highSchoolOrCollege || appData.lastSchoolAttended || appData.highSchool || '',
      yearGraduated: appData.yearGraduated || '',
      applicantType: appData.applicantType || 'New Student',
      registrationDetails: appData.registrationDetails || null,
    });

    try {
      const result = await submitAdmissionApplication(
        db,
        { uid: user.uid, name: fullName, email: user.emailVerified ? (user.email || '').toLowerCase() : null },
        data,
        admissionRequirementTemplates(enrollmentSystemConfig),
        initialFiles
      );
      if (!result.ok) {
        addToast('warning', result.duplicateOf ? 'Application Already Open' : 'Application Not Submitted', result.message || 'Please try again.');
        return result.duplicateOf?.referenceNumber ? `DUPLICATE:${result.duplicateOf.referenceNumber}` : '';
      }
      logActivity('CREATE', 'Admission Application', result.applicationId || '', `${fullName} (${result.referenceNumber})`, `New online admission application submitted for ${program}.`);
      addToast('success', 'Application Submitted', `Your application has been received. Reference: ${result.referenceNumber}`);
      return result.referenceNumber || '';
    } catch (e: any) {
      console.warn('Application submit notice:', e);
      addToast('error', 'Application Not Submitted', 'We could not save your application. Please check your connection and try again; nothing was submitted.');
      return '';
    }
  };

  // Admission decisions are limited to enrollment staff (Registrar, Admin, Super Admin).
  const canDecideAdmissions = isAdminLoggedIn && ENROLLMENT_STAFF_ROLES.includes(currentAdminUser?.role || '');
  const canManageEnrollment = isAdminLoggedIn && ['Super Admin', 'Admin', 'Registrar', 'Academic Admin', 'Finance'].includes(currentAdminUser?.role || '');
  const canManageCurriculum = isAdminLoggedIn && ['Super Admin', 'Admin', 'Registrar', 'Academic Admin'].includes(currentAdminUser?.role || '');

  // Subjects per year level: one real-time listener for any signed-in user (students read only).
  const curriculumUid = firebaseAuthUser?.uid || '';
  useEffect(() => {
    if (!curriculumUid) {
      setCurriculumSubjects([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'curriculumSubjects'),
      (snap) => setCurriculumSubjects(snap.docs.map((d) => ({ ...(d.data() as CurriculumSubject), id: d.id }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'curriculumSubjects')
    );
    return () => unsub();
  }, [curriculumUid]);

  const curriculumSlug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);

  const saveCurriculumSubject = async (input: Partial<CurriculumSubject>): Promise<boolean> => {
    if (!canManageCurriculum) {
      addToast('error', 'Not allowed', 'Only the Registrar, Academic Admin or an Admin can change the curriculum.');
      return false;
    }
    const problem = validateCurriculumSubject(input, curriculumSubjects);
    if (problem) {
      addToast('warning', 'Check the subject', problem);
      return false;
    }
    const now = new Date().toISOString();
    const isNew = !input.id;
    const id = input.id || `cur-${curriculumSlug(input.programId || '')}-${curriculumSlug(input.code || '')}-${Date.now().toString(36)}`;
    const data: CurriculumSubject = cleanFirestoreData({
      id,
      programId: input.programId || '',
      programName: input.programName || '',
      yearLevel: input.yearLevel || '',
      semester: input.semester || '',
      code: (input.code || '').trim(),
      title: (input.title || '').trim(),
      description: (input.description || '').trim(),
      units: Number(input.units) || 0,
      prerequisites: (input.prerequisites || '').trim(),
      type: input.type || 'Core',
      order: Number.isFinite(Number(input.order)) ? Number(input.order) : 999,
      status: input.status === 'Inactive' ? 'Inactive' : 'Active',
      ...(isNew ? { createdAt: now } : {}),
      updatedAt: now,
      updatedBy: currentAdminUser?.name || 'Registrar',
    });
    if (!(await safeSetDoc(doc(db, 'curriculumSubjects', id), data, { merge: true }))) return false;
    logActivity(isNew ? 'CREATE' : 'UPDATE', 'Curriculum', id, data.code, `${isNew ? 'Added' : 'Updated'} ${data.code} (${data.yearLevel}${data.semester ? ', ' + data.semester : ''}) in ${data.programName}.`);
    addToast('success', isNew ? 'Subject added' : 'Subject updated', `${data.code} — ${data.title}`);
    return true;
  };

  const deleteCurriculumSubject = async (id: string): Promise<boolean> => {
    if (!canManageCurriculum) {
      addToast('error', 'Not allowed', 'Only the Registrar, Academic Admin or an Admin can change the curriculum.');
      return false;
    }
    const target = curriculumSubjects.find((x) => x.id === id);
    if (!(await safeDeleteDoc(doc(db, 'curriculumSubjects', id)))) return false;
    logActivity('DELETE', 'Curriculum', id, target?.code || id, `Removed ${target?.code || 'a subject'} from ${target?.programName || 'the curriculum'}.`);
    addToast('info', 'Subject removed', target ? `${target.code} — ${target.title}` : 'The subject was removed.');
    return true;
  };

  // Copies the subjects listed in Academic Programs (program curriculum) that are not in the
  // collection yet. Existing entries are never changed.
  const importProgramCurricula = async (): Promise<number> => {
    if (!canManageCurriculum) return 0;
    const items = curriculumToImport(programs, curriculumSubjects);
    if (items.length === 0) {
      addToast('info', 'Nothing to import', 'Every subject listed in Academic Programs is already in the curriculum.');
      return 0;
    }
    const now = new Date().toISOString();
    for (let i = 0; i < items.length; i += 400) {
      const batch = writeBatch(db);
      items.slice(i, i + 400).forEach((it, j) => {
        const id = `cur-${curriculumSlug(it.programId)}-${curriculumSlug(it.code)}-${curriculumSlug(it.yearLevel)}-${(i + j).toString(36)}`;
        batch.set(doc(db, 'curriculumSubjects', id), cleanFirestoreData({ ...it, id, createdAt: now, updatedAt: now, updatedBy: currentAdminUser?.name || 'Registrar' }));
      });
      if (!(await commitBatch(batch, 'curriculumSubjects'))) return 0;
    }
    logActivity('CREATE', 'Curriculum', 'import', 'Academic Programs', `Imported ${items.length} subjects from the program curricula.`);
    addToast('success', 'Curriculum imported', `${items.length} subject${items.length === 1 ? '' : 's'} added from Academic Programs.`);
    return items.length;
  };
  // Payment verification is also open to the Finance office.
  const canVerifyPayments = isAdminLoggedIn && PAYMENT_STAFF_ROLES.includes(currentAdminUser?.role || '');

  const admissionsActor = () => ({
    uid: auth.currentUser?.uid || '',
    name: currentAdminUser?.name || currentUserAccount?.name || 'Admissions Office',
    email: auth.currentUser?.email || '',
    role: currentAdminUser?.role,
  });

  // Moves an application through the admission workflow (see lib/enrollmentWorkflow.ts).
  // Enrollment itself is completed with Finalize Enrollment, which also creates the
  // official student record.
  const updateApplicationStatus = async (id: string, status: ApplicationStatus | WorkflowStatus, note?: string): Promise<boolean> => {
    if (!canDecideAdmissions) {
      addToast('error', 'Permission Denied', 'Only the Registrar, Admin or Super Admin can change an admission decision.');
      return false;
    }
    const targetApp = applications.find((a) => a.id === id);
    if (!targetApp) {
      addToast('error', 'Application Not Found', 'This application could not be found.');
      return false;
    }
    const to = normalizeStatus(status);
    if (to === 'Enrolled') {
      addToast('info', 'Use Finalize Enrollment', 'Open the application and use "Finalize Enrollment" to enroll the student and create their record.');
      return false;
    }
    try {
      const reqSnap = await getDocs(collection(db, 'applications', id, 'requirements'));
      const reqs = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ApplicationRequirement[];
      const result = await transitionApplication(db, admissionsActor(), targetApp as any, to, reqs, note || '');
      addToast(result.ok ? 'success' : 'warning', result.ok ? 'Application Updated' : 'Not Updated', result.message);
      if (result.ok) {
        logActivity('UPDATE', 'Admission Application', id, targetApp.fullName || 'Applicant', `Application status changed to "${to}".`);
      }
      return result.ok;
    } catch (e: any) {
      console.warn('Application status notice:', e);
      addToast('error', 'Not Updated', 'The change could not be saved. Please check your connection and try again.');
      return false;
    }
  };

  const addApplicationNote = async (id: string, note: string) => {
    if (!canDecideAdmissions) {
      addToast('error', 'Permission Denied', 'Only the Registrar, Admin or Super Admin can add review notes.');
      return;
    }
    const targetApp = applications.find((a) => a.id === id);
    const newNotes = `${targetApp?.adminNotes || ''}\n[${new Date().toLocaleDateString()} - ${currentAdminUser.name}]: ${note}`;

    setApplications((prev) => {
      const next = prev.map((app) => (app.id === id ? { ...app, adminNotes: newNotes } : app));
      setCachedData('applications', next);
      return next;
    });

    if (!(await safeSetDoc(doc(db, 'applications', id), cleanFirestoreData({ adminNotes: newNotes }), { merge: true }))) return undefined;

    addToast('info', 'Internal Note Logged', 'Application review note saved.');
  };

  const deleteApplication = async (id: string) => {
    if (!canDecideAdmissions) {
      addToast('error', 'Permission Denied', 'Only the Registrar, Admin or Super Admin can delete applications.');
      return;
    }
    const targetApp = applications.find((a) => a.id === id);
    setApplications((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setCachedData('applications', next);
      return next;
    });

    if (!(await safeDeleteDoc(doc(db, 'applications', id)))) return undefined;

    logActivity('DELETE', 'Admission Application', id, targetApp?.fullName || 'Applicant', 'Deleted admission application record.');
    addToast('info', 'Application Removed', 'Application record deleted.');
  };

  const normalizeRef = (val?: string): string => {
    if (!val) return '';
    return val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  };

  const getApplicationByRef = (ref: string): AdmissionApplication | undefined => {
    const cleanRef = (ref || '').trim();
    if (!cleanRef) return undefined;
    const upperRef = cleanRef.toUpperCase();
    const normRef = normalizeRef(cleanRef);
    const altFormat = upperRef.startsWith('PCM-')
      ? upperRef.replace(/^PCM-(\d{4})-(\d+)$/, '$1-PCM-$2')
      : upperRef.replace(/^(\d{4})-PCM-(\d+)$/, 'PCM-$1-$2');

    // 1. Direct search in applications collection
    const foundApp = applications.find((a) => {
      if (!a) return false;
      const refN = (a.referenceNumber || '').trim().toUpperCase();
      const sId = (a.studentId || '').trim().toUpperCase();
      const aId = (a.id || '').trim().toUpperCase();
      const email = (a.email || '').trim().toLowerCase();

      if (refN === upperRef || sId === upperRef || aId === upperRef || email === cleanRef.toLowerCase()) {
        return true;
      }
      if (refN === altFormat || sId === altFormat) {
        return true;
      }
      if (normRef && (normalizeRef(refN) === normRef || normalizeRef(sId) === normRef || normalizeRef(aId) === normRef)) {
        return true;
      }
      return false;
    });

    if (foundApp) return foundApp;

    // 2. Check studentProfiles and synthesize an application view so student status is immediately found
    const matchedStudent = students.find((s) => {
      if (!s) return false;
      const sId = (s.studentId || '').trim().toUpperCase();
      const appNum = (s.applicationNumber || '').trim().toUpperCase();
      const refNum = ((s as any).referenceNumber || '').trim().toUpperCase();
      const email = (s.email || '').trim().toLowerCase();
      const id = (s.id || '').trim().toUpperCase();

      if (sId === upperRef || appNum === upperRef || refNum === upperRef || id === upperRef || email === cleanRef.toLowerCase()) {
        return true;
      }
      if (sId === altFormat || appNum === altFormat) {
        return true;
      }
      if (normRef && (normalizeRef(sId) === normRef || normalizeRef(appNum) === normRef || normalizeRef(refNum) === normRef || normalizeRef(id) === normRef)) {
        return true;
      }
      return false;
    });

    if (matchedStudent) {
      const synApp: AdmissionApplication = {
        id: `app-sync-${matchedStudent.id}`,
        referenceNumber: matchedStudent.applicationNumber || cleanRef,
        studentId: matchedStudent.studentId,
        fullName: matchedStudent.fullName || matchedStudent.name || 'Admitted Student',
        email: matchedStudent.email || '',
        phone: matchedStudent.phone || matchedStudent.contactNumber || '',
        status: (matchedStudent.enrollmentStatus === 'Approved' || matchedStudent.enrollmentStatus === 'Enrolled') ? 'Accepted' : 'Under Review',
        programId: matchedStudent.programId || 'prog-bth',
        program: matchedStudent.program || 'Bachelor of Theology (B.Th.)',
        programName: matchedStudent.program || 'Bachelor of Theology (B.Th.)',
        address: matchedStudent.address || '',
        church: matchedStudent.homeChurch || '',
        churchName: matchedStudent.homeChurch || '',
        pastorName: matchedStudent.pastorName || '',
        submissionDate: matchedStudent.currentSemester || '2026-08-28',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adminNotes: `Registered student record verified (Student ID: ${matchedStudent.studentId}).`,
      };
      return synApp;
    }

    return undefined;
  };

  const fetchApplicationByRef = async (ref: string): Promise<AdmissionApplication | undefined> => {
    const cleanRef = (ref || '').trim();
    if (!cleanRef) return undefined;
    const inMem = getApplicationByRef(cleanRef);
    if (inMem) return inMem;

    try {
      const qRef = cleanRef.toUpperCase();
      const norm = normalizeRef(cleanRef);
      const altFormat = qRef.startsWith('PCM-')
        ? qRef.replace(/^PCM-(\d{4})-(\d+)$/, '$1-PCM-$2')
        : qRef.replace(/^(\d{4})-PCM-(\d+)$/, 'PCM-$1-$2');

      const appsSnap = await getDocs(collection(db, 'applications'));
      if (!appsSnap.empty) {
        for (const docSnap of appsSnap.docs) {
          const data = { id: docSnap.id, ...docSnap.data() } as AdmissionApplication;
          const refN = (data.referenceNumber || '').trim().toUpperCase();
          const sId = (data.studentId || '').trim().toUpperCase();
          const docId = docSnap.id.toUpperCase();
          if (
            refN === qRef ||
            sId === qRef ||
            docId === qRef ||
            refN === altFormat ||
            sId === altFormat ||
            (norm && (normalizeRef(refN) === norm || normalizeRef(sId) === norm))
          ) {
            setApplications((prev) => {
              const exists = prev.some((a) => a.id === data.id || a.referenceNumber === data.referenceNumber);
              return exists ? prev : [data, ...prev];
            });
            return data;
          }
        }
      }

      const stdSnap = await getDocs(collection(db, 'studentProfiles'));
      if (!stdSnap.empty) {
        for (const docSnap of stdSnap.docs) {
          const s = { id: docSnap.id, ...docSnap.data() } as StudentProfile;
          const sId = (s.studentId || '').trim().toUpperCase();
          const appNum = (s.applicationNumber || '').trim().toUpperCase();
          if (
            sId === qRef ||
            appNum === qRef ||
            sId === altFormat ||
            appNum === altFormat ||
            (norm && (normalizeRef(sId) === norm || normalizeRef(appNum) === norm))
          ) {
            const synApp: AdmissionApplication = {
              id: `app-sync-${s.id}`,
              referenceNumber: s.applicationNumber || cleanRef,
              studentId: s.studentId,
              fullName: s.fullName || s.name || 'Admitted Student',
              email: s.email || '',
              phone: s.phone || s.contactNumber || '',
              status: (s.enrollmentStatus === 'Approved' || s.enrollmentStatus === 'Enrolled') ? 'Accepted' : 'Under Review',
              programId: s.programId || 'prog-bth',
              program: s.program || 'Bachelor of Theology (B.Th.)',
              programName: s.program || 'Bachelor of Theology (B.Th.)',
              address: s.address || '',
              church: s.homeChurch || '',
              churchName: s.homeChurch || '',
              pastorName: s.pastorName || '',
              submissionDate: '2026-08-28',
              adminNotes: `Registered student record verified (Student ID: ${s.studentId}).`,
            };
            setApplications((prev) => [synApp, ...prev]);
            return synApp;
          }
        }
      }
    } catch (e) {
      console.warn('fetchApplicationByRef error:', e);
    }
    return undefined;
  };

  // Contact & Information Inquiries Workflow (Direct Firestore Persistence)
  const submitInquiry = async (inquiryData: {
    name: string;
    email: string;
    phone?: string;
    department?: string;
    subject?: string;
    message: string;
    programInterest?: string;
    type?: 'general_inquiry' | 'program_info_request' | 'campus_visit';
  }): Promise<{ success: boolean; id: string }> => {
    const inquiryId = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newInquiry: ContactInquiry = {
      id: inquiryId,
      name: inquiryData.name.trim(),
      email: inquiryData.email.trim(),
      phone: inquiryData.phone?.trim() || '',
      department: inquiryData.department?.trim() || 'Admissions Office',
      subject: inquiryData.subject?.trim() || 'General Inquiry',
      message: inquiryData.message.trim(),
      programInterest: inquiryData.programInterest?.trim() || '',
      type: inquiryData.type || 'general_inquiry',
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    try {
      await safeSetDoc(doc(db, 'inquiries', newInquiry.id), newInquiry, { merge: true });
    } catch (e) {
      console.warn('Firestore safeSetDoc error on inquiry, retrying setDoc:', e);
      try {
        await setDoc(doc(db, 'inquiries', newInquiry.id), newInquiry, { merge: true });
      } catch (err) {
        console.warn('Fallback setDoc error on inquiry:', err);
      }
    }

    logActivity(
      'CREATE',
      'Inquiry',
      newInquiry.id,
      `${newInquiry.name} (${newInquiry.email})`,
      `New inquiry submitted for ${newInquiry.department || newInquiry.type}.`
    );

    addToast(
      'success',
      'Inquiry Submitted',
      `Thank you, ${newInquiry.name}. Your inquiry has been saved and sent to the ${newInquiry.department}.`
    );

    return { success: true, id: newInquiry.id };
  };

  // Student Portal Actions & Multi-Student Directory
  // The Student ID + shared password login has been retired: it was checked only in the
  // browser and let anyone open any student's records. Students now sign in with Google;
  // their record is linked by their verified email (see the auth-scoped data effect).
  const studentLogin = (_studentId: string, _pass: string): boolean => {
    addToast(
      'info',
      'Sign in with Google',
      'The Student Portal now uses your Google account. Sign in with the email address you gave the Registrar.'
    );
    return false;
  };

  const studentLogout = () => {
    setIsStudentLoggedIn(false);
    setCurrentEnrollmentDraft(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pcm_student_session');
      } catch {}
    }
    signOut(auth).catch(() => {});
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
    if (!(await safeSetDoc(doc(db, 'studentProfiles', studentProfile.id), updated, { merge: true }))) return undefined;
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

  // Firebase uid of the student who owns a record (studentUid / recipientUid), which
  // firestore.rules uses to let students see only their own requests and notifications.
  // The student record an action is about. Never falls back to the built-in demo profile: an
  // admin acting on a student who is not loaded gets null (and a message) instead of writing the
  // demo student into the database.
  const findStudentRecord = (key?: string): StudentProfile | null => {
    if (!key) return null;
    const list: StudentProfile[] = stateRef.current?.students || students;
    const found = list.find((s) => s.id === key || s.studentId === key);
    if (found) return found;
    return isStudentLoggedIn && (studentProfile.id === key || studentProfile.studentId === key) ? studentProfile : null;
  };
  const studentNotFound = () => {
    addToast('error', 'Student record not found', 'This student record is not loaded. Refresh the page and try again.');
  };

  // Saves only the given fields of a student record, so a stale local copy never overwrites
  // newer changes made by another admin or by the student.
  const saveStudentFields = (id: string, fields: Record<string, unknown>) =>
    safeSetDoc(doc(db, 'studentProfiles', id), cleanFirestoreData({ ...fields, updatedAt: new Date().toISOString() }), { merge: true });

  const commitBatch = async (batch: ReturnType<typeof writeBatch>, path: string): Promise<boolean> => {
    try {
      await batch.commit();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  };

  const studentUidFor = (studentKey?: string): string | undefined => {
    if (!studentKey) return undefined;
    const match = (s?: StudentProfile | null) => !!s && (s.id === studentKey || s.studentId === studentKey);
    const fromList = (stateRef.current?.students || []).find((s: StudentProfile) => match(s));
    return fromList?.authUid || (match(studentProfile) ? studentProfile.authUid : undefined) || undefined;
  };

  // Online Enrollment Workflow Engine
  const saveEnrollmentDraft = async (draft: Partial<OnlineEnrollment>): Promise<OnlineEnrollment | null> => {
    const id = draft.id || `enr-draft-${studentProfile.id || Date.now()}`;
    const refNo = draft.referenceNumber || `ENR-DRAFT-${Date.now().toString(36).toUpperCase()}`;
    const draftStudentId = draft.studentId || studentProfile.studentId;
    if (!draftStudentId) return null;

    const fullDraft: OnlineEnrollment = {
      id,
      referenceNumber: refNo,
      studentUid: studentUidFor(draftStudentId),
      studentId: draftStudentId,
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
      estimatedTuition: termFees((draft.selectedSubjects || []).reduce((sum, s) => sum + (s.units || 0), 0), feeStructure, enrollmentSystemConfig).total,
      paymentMethod: draft.paymentMethod || 'GCash',
      paymentOption: draft.paymentOption || `Installment (${enrollmentSystemConfig?.downpaymentPercent ?? 40}% Downpayment)`,
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

    if (!(await safeSetDoc(doc(db, 'enrollments', id), cleanFirestoreData(fullDraft)))) return null;

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
        recipientUid: studentUidFor(studentId),
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

  const markAllNotificationsRead = async (targetStudentId?: string): Promise<void> => {
    // Collect all candidate student identification keys
    const matchIds = new Set<string>();
    if (targetStudentId) {
      matchIds.add(targetStudentId);
      matchIds.add(targetStudentId.trim().toLowerCase());
      matchIds.add(targetStudentId.trim().toUpperCase());
    }
    if (studentProfile?.id) {
      matchIds.add(studentProfile.id);
      matchIds.add(studentProfile.id.trim().toLowerCase());
    }
    if (studentProfile?.studentId) {
      matchIds.add(studentProfile.studentId);
      matchIds.add(studentProfile.studentId.trim().toLowerCase());
      matchIds.add(studentProfile.studentId.trim().toUpperCase());
    }
    if (currentUserAccount?.studentId) {
      matchIds.add(currentUserAccount.studentId);
      matchIds.add(currentUserAccount.studentId.trim().toUpperCase());
    }
    if (currentUserAccount?.uid) matchIds.add(currentUserAccount.uid);
    if (currentUserAccount?.id) matchIds.add(currentUserAccount.id);

    const isMatch = (n: StudentNotification) => {
      // If notification has no specific studentId or no filter keys were determined, treat as matching active student
      if (!n.studentId) return true;
      if (matchIds.size === 0) return true;
      return (
        matchIds.has(n.studentId) ||
        matchIds.has(n.studentId.trim().toLowerCase()) ||
        matchIds.has(n.studentId.trim().toUpperCase())
      );
    };

    setStudentNotifications((prev) =>
      prev.map((n) => (isMatch(n) ? { ...n, read: true } : n))
    );

    try {
      const toUpdate = studentNotifications.filter((n) => !n.read && isMatch(n));
      if (toUpdate.length > 0) {
        const batch = writeBatch(db);
        toUpdate.forEach((n) => {
          batch.set(doc(db, 'studentNotifications', n.id), { read: true }, { merge: true });
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn('Syncing markAllNotificationsRead to Firestore:', e);
    }
  };

  const submitEnrollment = useCallback(
    async (data: Partial<OnlineEnrollment>): Promise<{ success: boolean; referenceNumber?: string; message?: string }> => {
      const subjects = data.selectedSubjects || [];
      if (subjects.length === 0) {
        addToast('error', 'No Subjects Selected', 'Please select at least 1 subject to proceed with enrollment.');
        return { success: false, message: 'Please select at least 1 subject.' };
      }

      if (!(data.studentId || studentProfile.studentId)) {
        addToast('error', 'Student record not found', 'Your student record is not loaded yet. Please refresh and try again.');
        return { success: false, message: 'Student record not loaded.' };
      }
      // Year of submission + time-based suffix: unique, no random collisions.
      const refNo = `ENR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      const id = data.id && !data.id.includes('draft') ? data.id : `enr-${Date.now()}`;
      const now = new Date().toISOString();

      const submission: OnlineEnrollment = {
        id,
        referenceNumber: refNo,
        studentUid: studentUidFor(data.studentId || studentProfile.studentId),
        studentId: data.studentId || studentProfile.studentId,
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
        estimatedTuition: termFees(subjects.reduce((sum, s) => sum + (s.units || 0), 0), feeStructure, enrollmentSystemConfig).total,
        paymentMethod: data.paymentMethod || 'GCash',
        paymentOption: data.paymentOption || `Installment (${enrollmentSystemConfig?.downpaymentPercent ?? 40}% Downpayment)`,
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

      // The request and the student's status change are saved together (students may only
      // change enrollmentStatus/currentSemester on their own record).
      const submitBatch = writeBatch(db);
      submitBatch.set(doc(db, 'enrollments', id), cleanFirestoreData(submission));
      submitBatch.set(
        doc(db, 'studentProfiles', updatedStudent.id),
        { enrollmentStatus: 'Submitted', currentSemester: updatedStudent.currentSemester, updatedAt: now },
        { merge: true }
      );
      if (!(await commitBatch(submitBatch, `enrollments/${id}`))) return { success: false, message: 'Your enrollment could not be saved. Please try again.' };

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
    [studentProfile, addToast, addStudentNotification, logActivity, feeStructure, enrollmentSystemConfig]
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
    if (!(await safeSetDoc(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updated), { merge: true }))) return false;

    logActivity('UPDATE', 'Online Enrollment', enrollmentId, target.studentName, `Enrollment status updated to "${status}".`);
    addToast('info', 'Enrollment Status Updated', `Status changed to ${status}.`);
    return true;
  };

  const approveEnrollment = async (enrollmentId: string, remarks?: string): Promise<boolean> => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    if (!target) return false;
    if (target.status === 'Approved') {
      addToast('info', 'Already approved', `${target.referenceNumber} was already approved.`);
      return true;
    }
    const student = findStudentRecord(target.studentId);
    if (!student) {
      studentNotFound();
      return false;
    }

    // Term assessment from the Fee Structure for the approved subjects.
    const units = (target.selectedSubjects || []).reduce((sum, s) => sum + (Number(s.units) || 0), 0);
    const fees = termFees(units, feeStructure, enrollmentSystemConfig);
    if (fees.total <= 0) {
      addToast('error', 'Fees not set up', 'Add the tuition and fee items in Enrollment & Records → Tuition & Fee Policy before approving enrollments.');
      return false;
    }

    const now = new Date().toISOString();
    const term = `${target.semester}, AY ${target.schoolYear}`;
    const summary = accountSummary(student as any);
    // Re-approving the same term replaces that term's assessment instead of adding it twice.
    const sameTerm = (student.currentSemester || '') === term && typeof (student as any).termAssessment === 'number';
    const baseCharges = summary.totalCharges - (sameTerm ? summary.termAssessment : 0);
    const tuitionTotal = Math.round((baseCharges + fees.total) * 100) / 100;
    const tuitionPaid = summary.totalPaid;
    const tuitionBalance = Math.max(0, Math.round((tuitionTotal - tuitionPaid) * 100) / 100);
    const previousBalance = sameTerm ? summary.previousBalance : summary.balance;

    const enrolledCourses: StudentCourse[] = (target.selectedSubjects || []).map((sub, idx) => ({
      id: sub.id || `crs-${sub.code.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
      code: sub.code,
      title: sub.title,
      units: sub.units,
      instructor: sub.instructor || 'TBA',
      schedule: sub.schedule || 'TBA',
      room: sub.room || 'TBA',
      status: 'Enrolled',
    }));

    const updatedEnrollment: OnlineEnrollment = {
      ...target,
      status: 'Approved',
      approvedAt: now,
      approvedBy: currentAdminUser?.name || 'Office of the Registrar',
      adminRemarks: remarks || 'Officially verified and approved by the Registrar.',
      estimatedTuition: fees.total,
    };
    const studentFields = {
      enrollmentStatus: 'Enrolled' as const,
      courses: enrolledCourses,
      currentSemester: term,
      termAssessment: fees.total,
      termAssessmentLines: fees.lines,
      previousBalance,
      tuitionTotal,
      tuitionPaid,
      tuitionBalance,
      paymentStatus: tuitionBalance <= 0 ? 'Paid' : tuitionPaid > 0 ? 'Partially Paid' : 'Unpaid',
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updatedEnrollment), { merge: true });
    batch.set(doc(db, 'studentProfiles', student.id), cleanFirestoreData(studentFields), { merge: true });
    if (!(await commitBatch(batch, `enrollments/${enrollmentId}`))) return false;

    const updatedStudent = { ...student, ...studentFields } as StudentProfile;
    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updatedEnrollment : e)));
    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

    await addStudentNotification(student.id, {
      type: 'enrollment',
      title: 'Enrollment Approved — Certificate of Registration Ready',
      message: `Your enrollment for ${term} has been officially approved. Assessment: ₱${fees.total.toLocaleString()}; balance due: ₱${tuitionBalance.toLocaleString()}. You can now view your class schedule and Certificate of Registration.`,
      linkSection: 'portal',
    });

    logActivity('UPDATE', 'Online Enrollment', enrollmentId, target.studentName, `Approved enrollment application (${target.referenceNumber}); assessment ₱${fees.total.toLocaleString()}.`);
    addToast('success', 'Enrollment Approved!', `${target.studentName} is now officially enrolled. Assessment ₱${fees.total.toLocaleString()}.`);
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

    const student = findStudentRecord(target.studentId);
    if (!student) {
      studentNotFound();
      return false;
    }
    const batch = writeBatch(db);
    batch.set(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updated), { merge: true });
    batch.set(doc(db, 'studentProfiles', student.id), { enrollmentStatus: 'Returned for Correction', updatedAt: new Date().toISOString() }, { merge: true });
    if (!(await commitBatch(batch, `enrollments/${enrollmentId}`))) return false;

    const updatedStudent: StudentProfile = { ...student, enrollmentStatus: 'Returned for Correction' };
    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)));
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));

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
    if (!(await safeSetDoc(doc(db, 'enrollments', enrollmentId), cleanFirestoreData(updated), { merge: true }))) return false;

    logActivity('UPDATE', 'Online Enrollment', enrollmentId, target.studentName, `Rejected enrollment: ${reason}`);
    addToast('info', 'Enrollment Disapproved', 'Enrollment application has been disapproved.');
    return true;
  };

  const deleteEnrollment = async (enrollmentId: string): Promise<boolean> => {
    const target = enrollments.find((e) => e.id === enrollmentId);
    if (!(await safeDeleteDoc(doc(db, 'enrollments', enrollmentId)))) return false;
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    logActivity('DELETE', 'Online Enrollment', enrollmentId, target?.studentName || 'Enrollment', 'Deleted enrollment record.');
    addToast('info', 'Enrollment Deleted', 'Application record removed.');
    return true;
  };

  // Academic Subjects Catalog & Sections Management
  // Catalog changes update the list only after Firestore confirms them.
  const addAcademicSubject = async (subjectData: Omit<AcademicSubject, 'id'>): Promise<AcademicSubject | null> => {
    const id = `subj-${subjectData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const newSubject: AcademicSubject = cleanFirestoreData({ ...subjectData, id });
    if (!(await safeSetDoc(doc(db, 'academicSubjects', id), newSubject, { merge: false }))) return null;
    setAcademicSubjects((prev) => {
      const next = [...prev.filter((s) => s.id !== id), newSubject];
      setCachedData('academicSubjects', next);
      return next;
    });
    logActivity('CREATE', 'Subject Catalog', id, newSubject.code, `Added academic course ${newSubject.code}: ${newSubject.title}`);
    addToast('success', 'Course Added', `${newSubject.code} has been added to the course catalog.`);
    return newSubject;
  };

  const updateAcademicSubject = async (id: string, updates: Partial<AcademicSubject>): Promise<boolean> => {
    const target = academicSubjects.find((s) => s.id === id);
    const sanitized = cleanFirestoreData(updates);
    if (!(await safeSetDoc(doc(db, 'academicSubjects', id), sanitized, { merge: true }))) return false;
    setAcademicSubjects((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...sanitized } : s));
      setCachedData('academicSubjects', next);
      return next;
    });
    const code = updates.code || target?.code || id;
    logActivity('UPDATE', 'Subject Catalog', id, code, `Updated academic course ${code}.`);
    addToast('success', 'Course Updated', `${code} was saved.`);
    return true;
  };

  const deleteAcademicSubject = async (id: string): Promise<boolean> => {
    const target = academicSubjects.find((s) => s.id === id);
    if (!(await safeDeleteDoc(doc(db, 'academicSubjects', id)))) return false;
    setAcademicSubjects((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setCachedData('academicSubjects', next);
      return next;
    });
    logActivity('DELETE', 'Subject Catalog', id, target?.code || id, `Removed course from catalog.`);
    addToast('info', 'Course Removed', `${target?.code || 'The course'} was removed from the catalog.`);
    return true;
  };

  // Pre-Enlistment Workflow
  const submitPreEnlistment = async (recordData: Omit<PreEnlistmentRecord, 'id' | 'createdAt'>): Promise<PreEnlistmentRecord | null> => {
    const id = `pre-${recordData.studentId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    const now = new Date().toISOString();
    const newRecord: PreEnlistmentRecord = {
      ...recordData,
      id,
      studentUid: studentUidFor(recordData.studentId),
      createdAt: now,
      submittedAt: now,
      status: 'Submitted',
    };

    setPreEnlistments((prev) => {
      const idx = prev.findIndex((p) => p.studentId === recordData.studentId && p.semester === recordData.semester);
      let next: PreEnlistmentRecord[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = newRecord;
      } else {
        next = [newRecord, ...prev];
      }
      setCachedData('preEnlistments', next);
      return next;
    });

    if (!(await safeSetDoc(doc(db, 'preEnlistments', id), cleanFirestoreData(newRecord)))) return null;

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

    setPreEnlistments((prev) => {
      const next = prev.map((p) => (p.id === id ? updated : p));
      setCachedData('preEnlistments', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'preEnlistments', id), cleanFirestoreData(updated), { merge: true }))) return false;

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
  const submitAddDropRequest = async (reqData: Omit<AddDropRequest, 'id' | 'createdAt' | 'status' | 'dateSubmitted'>): Promise<AddDropRequest | null> => {
    const id = `ad-${reqData.studentId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    const now = new Date().toISOString();
    const newReq: AddDropRequest = {
      ...reqData,
      id,
      studentUid: studentUidFor(reqData.studentId),
      dateSubmitted: now.split('T')[0],
      status: 'Pending',
      createdAt: now,
    };

    setAddDropRequests((prev) => {
      const next = [newReq, ...prev];
      setCachedData('addDropRequests', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'addDropRequests', id), cleanFirestoreData(newReq)))) return null;

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

  // Removes the row only after Firestore confirms the delete, so a denied delete never looks successful.
  const deletePreEnlistment = async (id: string): Promise<boolean> => {
    const target = preEnlistments.find((p) => p.id === id);
    if (!(await safeDeleteDoc(doc(db, 'preEnlistments', id)))) return false;
    setPreEnlistments((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setCachedData('preEnlistments', next);
      return next;
    });
    logActivity('DELETE', 'Pre-Enlistment', id, target?.studentName || 'Pre-enlistment', `Deleted pre-enlistment (${target?.semester || ''} ${target?.totalUnits ?? ''} units).`);
    addToast('info', 'Pre-Enlistment Deleted', 'The pre-enlistment record was removed.');
    return true;
  };

  const deleteAddDropRequest = async (id: string): Promise<boolean> => {
    const target = addDropRequests.find((r) => r.id === id);
    if (!(await safeDeleteDoc(doc(db, 'addDropRequests', id)))) return false;
    setAddDropRequests((prev) => {
      const next = prev.filter((r) => r.id !== id);
      setCachedData('addDropRequests', next);
      return next;
    });
    logActivity('DELETE', 'Adding & Dropping', id, target ? `${target.action} ${target.subjectCode}` : 'Add/Drop request', `Deleted add/drop request of ${target?.studentName || 'student'}.`);
    addToast('info', 'Request Deleted', 'The add/drop request was removed. Approved course changes already applied to the student record are kept.');
    return true;
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

    setAddDropRequests((prev) => {
      const next = prev.map((r) => (r.id === id ? updatedReq : r));
      setCachedData('addDropRequests', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'addDropRequests', id), cleanFirestoreData(updatedReq), { merge: true }))) return false;

    // If Approved, update student profile courses & subject catalog enrolled count!
    if (status === 'Approved') {
      const targetStudent = findStudentRecord(target.studentId);
      if (!targetStudent) {
        studentNotFound();
        return false;
      }
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

      // Re-assess this term for the new unit load (Fee Structure) and adjust the running totals.
      const newUnits = updatedCourses.filter((c) => c.status !== 'Dropped').reduce((sum, c) => sum + (c.units || 0), 0);
      const before = accountSummary(targetStudent as any);
      const newTerm = termFees(newUnits, feeStructure, enrollmentSystemConfig);
      const newTermFees = newTerm.total;
      const newTuitionTotal = Math.max(0, Math.round((before.totalCharges - before.termAssessment + newTermFees) * 100) / 100);
      const newBalance = Math.max(0, Math.round((newTuitionTotal - before.totalPaid) * 100) / 100);
      const profileFields = {
        courses: updatedCourses,
        termAssessment: newTermFees,
        termAssessmentLines: newTerm.lines,
        previousBalance: before.previousBalance,
        tuitionTotal: newTuitionTotal,
        tuitionBalance: newBalance,
        paymentStatus: newBalance <= 0 ? 'Paid' : before.totalPaid > 0 ? 'Partially Paid' : 'Unpaid',
      };
      const updatedProfile: StudentProfile = { ...targetStudent, ...profileFields } as StudentProfile;

      setStudents((prev) => {
        const next = prev.map((s) => (s.studentId === target.studentId ? updatedProfile : s));
        setCachedData('students', next);
        return next;
      });
      if (studentProfile.studentId === target.studentId) {
        setStudentProfile(updatedProfile);
        setCachedData('studentProfile', updatedProfile);
      }
      if (!(await saveStudentFields(targetStudent.id, profileFields))) return false;
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
    setFeeStructure((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...updates } : f));
      setCachedData('feeStructure', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'feeStructure', id), cleanFirestoreData(updates), { merge: true }))) return false;
    addToast('success', 'Fee Updated', 'Institutional fee schedule updated.');
    return true;
  };

  const addFeeStructureItem = async (itemData: Omit<FeeStructureItem, 'id'>): Promise<FeeStructureItem | null> => {
    const id = `fee-${Date.now()}`;
    const newItem: FeeStructureItem = { ...itemData, id };
    setFeeStructure((prev) => {
      const next = [...prev, newItem];
      setCachedData('feeStructure', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'feeStructure', id), cleanFirestoreData(newItem)))) return null;
    addToast('success', 'Fee Item Created', `${newItem.name} has been added to the institutional schedule.`);
    return newItem;
  };

  const deleteFeeStructureItem = async (id: string): Promise<boolean> => {
    setFeeStructure((prev) => {
      const next = prev.filter((f) => f.id !== id);
      setCachedData('feeStructure', next);
      return next;
    });
    if (!(await safeDeleteDoc(doc(db, 'feeStructure', id)))) return false;
    addToast('info', 'Fee Item Removed', 'Fee item removed.');
    return true;
  };

  // Assessment Calculation Engine
  const calculateStudentAssessment = useCallback(
    (studentId?: string, overrideUnits?: number, additionalFeeIds?: string[]): StudentAssessment => {
      const activeStudent = findStudentRecord(studentId || studentProfile.studentId) || studentProfile;
      const account = accountSummary(activeStudent as any);
      const term = parseTerm(activeStudent.currentSemester);
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

      // 7. Total: the Registrar's official assessment on the student record wins over this
      // fee-schedule estimate; any difference is shown as an adjustment so the lines add up.
      const computedTotal = Math.max(0, tuitionTotal + miscellaneousTotal + laboratoryTotal + otherFeesTotal - discountsTotal + adjustmentsTotal);
      const hasOfficial = account.totalCharges > 0;
      const totalAssessment = hasOfficial ? account.termAssessment : computedTotal;
      const difference = Math.round((totalAssessment - computedTotal) * 100) / 100;
      if (hasOfficial && Math.abs(difference) >= 0.01) {
        adjustmentsBreakdown.push({ id: 'adj-registrar', name: 'Registrar assessment adjustment', amount: difference, note: 'Difference between the official assessment and the current fee schedule' });
      }
      const previousBalance = hasOfficial ? account.previousBalance : 0;

      // 8. Paid and due: from the official record.
      const totalAmountPaid = hasOfficial ? account.paymentsThisTerm : 0;
      const currentAmountDue = hasOfficial ? account.balance : computedTotal;

      let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' = 'Unpaid';
      if (currentAmountDue <= 0 && totalAssessment > 0) {
        paymentStatus = 'Paid';
      } else if (totalAmountPaid > 0) {
        paymentStatus = 'Partially Paid';
      } else {
        paymentStatus = 'Unpaid';
      }

      const computed: StudentAssessment = {
        id: `asmt-${activeStudent.studentId || 'std'}-${(term.academicYear || '').replace(/\D/g, '')}-${term.semester || 'term'}`,
        studentId: activeStudent.studentId,
        academicYear: term.academicYear,
        semester: term.semester,
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
        adjustmentsTotal: adjustmentsBreakdown.reduce((sum, a) => sum + a.amount, adjustmentsTotal),
        adjustmentsBreakdown,
        totalAssessment,
        previousBalance,
        totalAmountPaid,
        currentAmountDue,
        paymentStatus,
        dueDate: '',
        updatedAt: new Date().toISOString(),
      };
      // The Registrar's itemized assessment, when known, replaces the fee-schedule estimate.
      const official = hasOfficial ? officialAssessmentLines(activeStudent, applications) : null;
      return official ? applyOfficialLines(computed, official) : computed;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, studentProfile, feeStructure, isStudentLoggedIn, applications]
  );

  // Student Document Vault & Verification
  const uploadStudentDocument = async (studentId: string, docData: Omit<StudentDocument, 'id' | 'uploadDate' | 'verificationStatus'>): Promise<StudentDocument | null> => {
    const newDoc: StudentDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'Pending Verification',
    };

    const targetStudent = findStudentRecord(studentId);
    if (!targetStudent) {
      studentNotFound();
      return null;
    }
    const updatedDocs = [newDoc, ...(targetStudent.documents || [])];

    const updatedStudent: StudentProfile = {
      ...targetStudent,
      documents: updatedDocs,
    };

    if (targetStudent.id === studentProfile.id) {
      setStudentProfile(updatedStudent);
    }
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));

    if (!(await saveStudentFields(updatedStudent.id, { documents: updatedDocs }))) return null;

    addToast('success', 'Document Uploaded', `${newDoc.name} submitted for Registrar verification.`);
    return newDoc;
  };

  const updateDocumentVerification = async (studentId: string, docId: string, status: DocumentVerificationStatus, adminFeedback?: string): Promise<boolean> => {
    const targetStudent = findStudentRecord(studentId);
    if (!targetStudent) {
      studentNotFound();
      return false;
    }
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

    if (!(await saveStudentFields(updatedStudent.id, { documents: updatedDocs }))) return false;

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
    const saved = await safeSetDoc(doc(db, 'studentProfiles', id), newStudent);
    if (!saved) {
      // Not persisted (the "Not saved" alert explains why): don't leave a phantom record.
      setStudents((prev) => prev.filter((s) => s.id !== id));
      return newStudent;
    }

    logActivity('CREATE', 'Student Profile', id, newStudent.fullName || newStudent.name || 'Student', `Created student account (${newStudent.studentId}).`);
    addToast('success', 'Student Profile Created', `Added ${newStudent.fullName || newStudent.name || 'Student'} to Student Directory.`);
    return newStudent;
  };

  const updateStudentProfile = async (studentId: string, updates: Partial<StudentProfile>): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || (studentProfile.id === studentId || studentProfile.studentId === studentId ? studentProfile : null);
    if (!target) return false;

    const updated: StudentProfile = cleanFirestoreData({
      ...target,
      ...updates,
    });

    if (target.id === studentProfile.id || target.studentId === studentProfile.studentId) {
      setStudentProfile(updated);
    }
    setStudents((prev) => prev.map((s) => (s.id === updated.id || s.studentId === updated.studentId ? updated : s)));

    // Synchronize avatar across user accounts and Google/Firebase profile if updated
    if (updates.avatarUrl !== undefined) {
      const newPhoto = updates.avatarUrl || '';
      setCurrentUserAccount((prev) => {
        if (!prev) return prev;
        if (prev.role === 'Student' || prev.studentId === target.studentId || prev.email === target.email) {
          return { ...prev, photoURL: newPhoto, avatarUrl: newPhoto };
        }
        return prev;
      });
      setUserAccounts((prev) =>
        prev.map((acc) =>
          acc.studentId === target.studentId || acc.email === target.email
            ? { ...acc, photoURL: newPhoto, avatarUrl: newPhoto }
            : acc
        )
      );
      if (auth.currentUser && (currentUserAccount?.email === target.email || currentUserAccount?.studentId === target.studentId)) {
        updateProfile(auth.currentUser, { photoURL: newPhoto }).catch((err) => console.warn('Auth photoURL sync notice:', err));
      }
    }

    if (!(await saveStudentFields(updated.id, updates as any))) return false;

    logActivity('UPDATE', 'Student Profile', updated.id, updated.fullName || updated.name || 'Student', updates.avatarUrl !== undefined ? 'Updated student profile photo.' : 'Updated student record and academic information.');
    addToast('success', 'Profile Updated', `Updated record for ${updated.fullName || updated.name || 'Student'}.`);
    return true;
  };

  const updateStudentAvatar = async (avatarUrl: string, studentId?: string): Promise<boolean> => {
    const targetId = studentId || studentProfile.studentId || studentProfile.id;
    return await updateStudentProfile(targetId, { avatarUrl });
  };

  const deleteStudentProfile = async (studentId: string): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId);
    const docId = target?.id || studentId;
    if (!docId || !(await safeDeleteDoc(doc(db, 'studentProfiles', docId)))) return false;
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== studentId && s.studentId !== studentId);
      setCachedData('students', next);
      return next;
    });
    logActivity('DELETE', 'Student Profile', studentId, target?.fullName || target?.name || 'Student', 'Deleted student record.');
    addToast('info', 'Student Record Deleted', 'Student profile has been removed.');
    return true;
  };

  const addStudentGrade = async (studentId: string, courseCode: string, midtermGrade: number | string, finalGrade: number | string): Promise<boolean> => {
    const target = findStudentRecord(studentId);
    if (!target) {
      studentNotFound();
      return false;
    }
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

    if (!(await saveStudentFields(updated.id, { courses: updatedCourses }))) return false;

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
      const target = findStudentRecord(studentId);
      if (!target) {
        studentNotFound();
        return false;
      }
      const newPayment: StudentPaymentRecord = {
        ...payment,
        id: `pay-${Date.now()}`,
      };

      const counts = !payment.status || payment.status === 'Verified';
      const newPaid = Math.round(((target.tuitionPaid || 0) + (counts ? payment.amount : 0)) * 100) / 100;
      const newBalance = Math.max(0, Math.round(((target.tuitionTotal || 0) - newPaid) * 100) / 100);
      const paymentFields = {
        tuitionPaid: newPaid,
        tuitionBalance: newBalance,
        paymentStatus: newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid',
        paymentHistory: [newPayment, ...(target.paymentHistory || [])],
      };
      const updated: StudentProfile = { ...target, ...paymentFields } as StudentProfile;

      if (target.id === studentProfile.id) {
        setStudentProfile(updated);
      }
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

      if (!(await saveStudentFields(updated.id, paymentFields))) return false;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, studentProfile, addStudentNotification, logActivity, addToast]
  );

  const archiveStudentProfile = async (studentId: string): Promise<boolean> => {
    return await updateStudentProfile(studentId, { isArchived: true, academicStatus: 'Archived' });
  };

  const restoreStudentProfile = async (studentId: string): Promise<boolean> => {
    return await updateStudentProfile(studentId, { isArchived: false, academicStatus: 'Regular' });
  };

  const updateStudentPaymentRecord = async (
    studentId: string,
    paymentId: string,
    updates: Partial<StudentPaymentRecord>
  ): Promise<boolean> => {
    const target = findStudentRecord(studentId);
    if (!target) {
      studentNotFound();
      return false;
    }
    const counted = (p?: StudentPaymentRecord) => (p && (p.status === 'Verified' || !p.status) ? Number(p.amount) || 0 : 0);
    const oldEntry = (target.paymentHistory || []).find((p) => p.id === paymentId);
    if (!oldEntry) return false;
    const newEntry = { ...oldEntry, ...updates };
    const paymentHistory = (target.paymentHistory || []).map((p) => (p.id === paymentId ? newEntry : p));
    const newPaid = Math.max(0, Math.round(((target.tuitionPaid || 0) - counted(oldEntry) + counted(newEntry)) * 100) / 100);
    const newBalance = Math.max(0, Math.round(((target.tuitionTotal || 0) - newPaid) * 100) / 100);
    const paymentFields = {
      paymentHistory,
      tuitionPaid: newPaid,
      tuitionBalance: newBalance,
      paymentStatus: newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid',
    };
    const updated: StudentProfile = { ...target, ...paymentFields } as StudentProfile;
    if (target.id === studentProfile.id) {
      setStudentProfile(updated);
    }
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (!(await saveStudentFields(updated.id, paymentFields))) return false;
    logActivity('UPDATE', 'Payment Record', paymentId, target.fullName || target.name || 'Student', 'Updated student tuition payment entry.');
    addToast('success', 'Payment Record Updated', 'The payment entry has been modified.');
    return true;
  };

  const updateStudentRequirementStatus = async (
    studentId: string,
    requirementId: string,
    status: StudentRequirementItem['status'],
    remarks?: string,
    file?: any
  ): Promise<boolean> => {
    if (requirementId.startsWith('adm-')) {
      addToast('info', 'Verified in Admissions', 'This document was verified during admission. Manage it in Admissions Review.');
      return false;
    }
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || (studentProfile.id === studentId || studentProfile.studentId === studentId ? studentProfile : null);
    if (!target) return false;

    // The same checklist the screens show (admission requirements list), minus admission documents.
    const existingReqs = studentRequirementsView(target, admissionRequirementTemplates(enrollmentSystemConfig)).filter((r) => !r.id.startsWith('adm-'));

    const now = new Date().toISOString();
    const updatedReqs = existingReqs.map((req) => {
      if (req.id === requirementId || req.name.toLowerCase() === requirementId.toLowerCase()) {
        return {
          ...req,
          status,
          remarks: remarks !== undefined ? remarks : req.remarks,
          file: file || req.file,
          uploadDate: file ? now : req.uploadDate,
          verifiedBy: status === 'Verified' ? currentAdminUser.name || 'Office of Admissions & Registrar' : req.verifiedBy,
          verificationDate: status === 'Verified' ? now.split('T')[0] : req.verificationDate,
        };
      }
      return req;
    });

    const success = await updateStudentProfile(target.id, {
      requirements: updatedReqs,
    });

    if (success) {
      logActivity(
        'UPDATE',
        'Student Requirement',
        requirementId,
        target.fullName || target.name || 'Student',
        `Updated submission status for requirement to "${status}".`
      );
    }
    return success;
  };

  const addStudentSubjectHistory = async (
    studentId: string,
    record: Omit<StudentSubjectHistory, 'id'>
  ): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || (studentProfile.id === studentId || studentProfile.studentId === studentId ? studentProfile : null);
    if (!target) return false;

    const existingSubjects = target.subjectHistory || [];
    const newSubject: StudentSubjectHistory = {
      ...record,
      id: `subj-${Date.now()}`,
    };
    const updatedSubjects = [newSubject, ...existingSubjects];
    const newGPA = calculateGPAFromGrades(updatedSubjects);

    return await updateStudentProfile(target.id, {
      subjectHistory: updatedSubjects,
      gpa: newGPA,
    });
  };

  const updateStudentSubjectHistory = async (
    studentId: string,
    subjectIdOrCode: string,
    updates: Partial<StudentSubjectHistory>
  ): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || (studentProfile.id === studentId || studentProfile.studentId === studentId ? studentProfile : null);
    if (!target) return false;

    const existingSubjects = target.subjectHistory || [];
    const updatedSubjects = existingSubjects.map((s) =>
      s.id === subjectIdOrCode || s.code === subjectIdOrCode ? { ...s, ...updates } : s
    );
    const newGPA = calculateGPAFromGrades(updatedSubjects);

    return await updateStudentProfile(target.id, {
      subjectHistory: updatedSubjects,
      gpa: newGPA,
    });
  };

  const deleteStudentSubjectHistory = async (
    studentId: string,
    subjectIdOrCode: string
  ): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || (studentProfile.id === studentId || studentProfile.studentId === studentId ? studentProfile : null);
    if (!target) return false;

    const existingSubjects = target.subjectHistory || [];
    const updatedSubjects = existingSubjects.filter(
      (s) => s.id !== subjectIdOrCode && s.code !== subjectIdOrCode
    );
    const newGPA = calculateGPAFromGrades(updatedSubjects);

    return await updateStudentProfile(target.id, {
      subjectHistory: updatedSubjects,
      gpa: newGPA,
    });
  };

  const updateStudentEnrollmentStatus = async (
    studentId: string,
    status: EnrollmentStatus,
    remarks?: string
  ): Promise<boolean> => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId) || (studentProfile.id === studentId || studentProfile.studentId === studentId ? studentProfile : null);
    if (!target) return false;

    const updates: Partial<StudentProfile> = {
      enrollmentStatus: status,
      adminRemarks: remarks || target.adminRemarks,
    };

    if (status === 'Enrolled') {
      updates.enrollmentDate = new Date().toISOString().split('T')[0];
    }

    return await updateStudentProfile(target.id, updates);
  };

  // Academic Periods Management
  // Term changes update the list only after Firestore confirms the save.
  const addAcademicPeriod = async (periodData: Omit<AcademicPeriod, 'id'>): Promise<AcademicPeriod | null> => {
    const id = `period-${Date.now()}`;
    const now = new Date().toISOString();
    // New terms never become current here; "Set as Active Term" switches the current term for all records.
    const newPeriod: AcademicPeriod = cleanFirestoreData({ ...periodData, id, isCurrent: false, createdAt: now, updatedAt: now });
    if (!(await safeSetDoc(doc(db, 'academicPeriods', id), newPeriod, { merge: false }))) return null;
    setAcademicPeriods((prev) => {
      const next = [newPeriod, ...prev.filter((p) => p.id !== id)];
      setCachedData('academicPeriods', next);
      return next;
    });
    logActivity('CREATE', 'Academic Period', id, `${newPeriod.academicYear} ${newPeriod.semester}`, 'Created academic period.');
    addToast('success', 'Academic Term Added', `${newPeriod.semester}, AY ${newPeriod.academicYear} was added.`);
    return newPeriod;
  };

  const updateAcademicPeriod = async (id: string, updates: Partial<AcademicPeriod>): Promise<boolean> => {
    const target = academicPeriods.find((p) => p.id === id);
    const sanitized = cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() });
    if (!(await safeSetDoc(doc(db, 'academicPeriods', id), sanitized, { merge: true }))) return false;
    setAcademicPeriods((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...sanitized } : p));
      setCachedData('academicPeriods', next);
      return next;
    });
    const label = `${updates.academicYear || target?.academicYear || ''} ${updates.semester || target?.semester || ''}`.trim() || 'Academic Period';
    logActivity('UPDATE', 'Academic Period', id, label, 'Updated academic period configuration.');
    addToast('success', 'Academic Term Updated', `${label} was saved.`);
    return true;
  };

  const setCurrentAcademicPeriod = async (id: string): Promise<boolean> => {
    setAcademicPeriods((prev) => {
      const next = prev.map((p) => ({ ...p, isCurrent: p.id === id }));
      setCachedData('academicPeriods', next);
      return next;
    });
    try {
      const batch = writeBatch(db);
      academicPeriods.forEach((p) => {
        batch.update(doc(db, 'academicPeriods', p.id), { isCurrent: p.id === id, updatedAt: new Date().toISOString() });
      });
      await batch.commit();
    } catch (e) {
      console.warn(e);
    }
    logActivity('UPDATE', 'Current Academic Term', id, 'Academic Calendar', 'Changed active academic term.');
    addToast('success', 'Active Period Set', 'Current academic term updated.');
    return true;
  };

  const deleteAcademicPeriod = async (id: string): Promise<boolean> => {
    if (academicPeriods.length <= 1) {
      addToast('error', 'Cannot Delete', 'At least one academic period must remain configured.');
      return false;
    }
    const target = academicPeriods.find((p) => p.id === id);
    if (target?.isCurrent) {
      addToast('error', 'Cannot Delete', 'Set another term as active before deleting the current term.');
      return false;
    }
    if (!(await safeDeleteDoc(doc(db, 'academicPeriods', id)))) return false;
    setAcademicPeriods((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setCachedData('academicPeriods', next);
      return next;
    });
    logActivity('DELETE', 'Academic Period', id, target ? `${target.academicYear} ${target.semester}` : 'Academic Period', 'Removed academic term from calendar.');
    addToast('info', 'Period Deleted', 'Academic period removed.');
    return true;
  };

  // Class Sections Management
  const addClassSection = async (sectionData: Omit<ClassSection, 'id'>): Promise<ClassSection | null> => {
    const id = `sec-${Date.now()}`;
    const newSection: ClassSection = cleanFirestoreData({
      ...sectionData,
      id,
      enrolledCount: sectionData.enrolledCount || 0,
      enrolledStudentIds: sectionData.enrolledStudentIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setClassSections((prev) => {
      const next = [newSection, ...prev];
      setCachedData('classSections', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'classSections', id), newSection))) return null;
    logActivity('CREATE', 'Class Section', id, newSection.sectionName, `Created class section ${newSection.sectionCode}.`);
    addToast('success', 'Section Created', `Class section ${newSection.sectionName} added.`);
    return newSection;
  };

  const updateClassSection = async (id: string, updates: Partial<ClassSection>): Promise<boolean> => {
    const sanitized = cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() });
    setClassSections((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...sanitized } : s));
      setCachedData('classSections', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'classSections', id), sanitized, { merge: true }))) return false;
    logActivity('UPDATE', 'Class Section', id, updates.sectionName || 'Section', 'Updated section information.');
    addToast('success', 'Section Updated', 'Class section updated.');
    return true;
  };

  const deleteClassSection = async (id: string): Promise<boolean> => {
    setClassSections((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setCachedData('classSections', next);
      return next;
    });
    if (!(await safeDeleteDoc(doc(db, 'classSections', id)))) return false;
    logActivity('DELETE', 'Class Section', id, 'Class Section', 'Removed class section.');
    addToast('info', 'Section Deleted', 'Class section removed.');
    return true;
  };

  const transferStudentSection = async (studentId: string, fromSectionId: string, toSectionId: string): Promise<boolean> => {
    const toSec = classSections.find((s) => s.id === toSectionId);
    if (!toSec) return false;
    if (toSec.enrolledCount >= toSec.maxCapacity) {
      addToast('error', 'Section Full', `${toSec.sectionName} has reached maximum capacity (${toSec.maxCapacity}).`);
      return false;
    }

    setClassSections((prev) => {
      const next = prev.map((s) => {
        if (s.id === fromSectionId) {
          const studentIds = (s.enrolledStudentIds || []).filter((sid) => sid !== studentId);
          return { ...s, enrolledCount: Math.max(0, s.enrolledCount - 1), enrolledStudentIds: studentIds };
        }
        if (s.id === toSectionId) {
          const studentIds = [...(s.enrolledStudentIds || []), studentId];
          return { ...s, enrolledCount: s.enrolledCount + 1, enrolledStudentIds: studentIds };
        }
        return s;
      });
      setCachedData('classSections', next);
      return next;
    });
    logActivity('UPDATE', 'Section Roster', toSectionId, studentId, `Transferred student from ${fromSectionId} to ${toSec.sectionName}.`);
    addToast('success', 'Student Transferred', `Transferred student to ${toSec.sectionName}.`);
    return true;
  };

  // Instructors Management
  const addInstructor = async (instructorData: Omit<InstructorRecord, 'id'>): Promise<InstructorRecord | null> => {
    const id = `inst-${Date.now()}`;
    const newInst: InstructorRecord = cleanFirestoreData({
      ...instructorData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setInstructors((prev) => {
      const next = [newInst, ...prev];
      setCachedData('instructors', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'instructors', id), newInst))) return null;
    logActivity('CREATE', 'Instructor', id, newInst.fullName, `Added instructor ${newInst.fullName} (${newInst.employeeId}).`);
    addToast('success', 'Instructor Added', `${newInst.fullName} added to faculty roster.`);
    return newInst;
  };

  const updateInstructor = async (id: string, updates: Partial<InstructorRecord>): Promise<boolean> => {
    const sanitized = cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() });
    setInstructors((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...sanitized } : i));
      setCachedData('instructors', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'instructors', id), sanitized, { merge: true }))) return false;
    logActivity('UPDATE', 'Instructor', id, updates.fullName || 'Instructor', 'Updated faculty credentials / load.');
    addToast('success', 'Instructor Updated', 'Instructor record updated.');
    return true;
  };

  const deleteInstructor = async (id: string): Promise<boolean> => {
    setInstructors((prev) => {
      const next = prev.filter((i) => i.id !== id);
      setCachedData('instructors', next);
      return next;
    });
    if (!(await safeDeleteDoc(doc(db, 'instructors', id)))) return false;
    logActivity('DELETE', 'Instructor', id, 'Instructor', 'Removed instructor from directory.');
    addToast('info', 'Instructor Removed', 'Instructor removed from system.');
    return true;
  };

  // Enrollment System Policy Config
  const updateEnrollmentSystemConfig = async (updates: Partial<EnrollmentSystemConfig>): Promise<boolean> => {
    const sanitized = cleanFirestoreData({
      ...enrollmentSystemConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentAdminUser?.name || 'Administrator',
    });
    if (!(await safeSetDoc(doc(db, 'enrollmentSettings', 'global-enrollment-settings'), sanitized, { merge: true }))) return false;
    setEnrollmentSystemConfig(sanitized);
    setCachedData('enrollmentSystemConfig', sanitized);
    logActivity('SETTINGS', 'Enrollment Policy', 'global-settings', 'Enrollment Policies', 'Updated institutional enrollment policies and thresholds.');
    addToast('success', 'Settings Saved', 'Enrollment policies updated.');
    return true;
  };

  // Academic Subject Operations (Clone / Duplicate)
  const duplicateAcademicSubject = async (
    subjectId: string,
    newAcademicYear: string,
    newSemester: string
  ): Promise<AcademicSubject | null> => {
    const source = academicSubjects.find((s) => s.id === subjectId);
    if (!source) throw new Error('Subject not found');
    const id = `subj-${source.code.toLowerCase()}-${Date.now()}`;
    const duplicated: AcademicSubject = cleanFirestoreData({
      ...source,
      id,
      academicYear: newAcademicYear,
      semester: newSemester,
      enrolledCount: 0,
      status: 'Open',
    });
    setAcademicSubjects((prev) => {
      const next = [...prev, duplicated];
      setCachedData('academicSubjects', next);
      return next;
    });
    if (!(await safeSetDoc(doc(db, 'academicSubjects', id), duplicated))) return null;
    logActivity('CREATE', 'Subject Duplicated', id, duplicated.code, `Duplicated ${duplicated.code} to ${newAcademicYear} ${newSemester}.`);
    addToast('success', 'Subject Duplicated', `${duplicated.code} cloned for ${newAcademicYear} ${newSemester}.`);
    return duplicated;
  };

  // Cancel / Reopen Enrollment
  const cancelEnrollment = async (enrollmentId: string, reason: string): Promise<boolean> => {
    return await updateEnrollmentStatus(enrollmentId, 'Cancelled', `Cancelled by Admin: ${reason}`);
  };

  const reopenEnrollment = async (enrollmentId: string): Promise<boolean> => {
    return await updateEnrollmentStatus(enrollmentId, 'Submitted', 'Reopened by Admin for review');
  };

  // Grants the role recorded for this user in the adminUsers directory (matched by uid, or by
  // email once Firebase has verified it). Rejected and disabled accounts are left untouched.
  const applyDirectoryAdminRole = (
    acc: UserAccount,
    uid: string,
    emailLower: string,
    isEmailVerified: boolean
  ) => {
    if (ADMIN_ROLE_NAMES.includes(acc.role as string)) return;
    if (['Rejected', 'Disabled', 'Inactive'].includes(acc.status as string)) return;
    const match = adminUsers.find(
      (a) =>
        (a.id === uid || (isEmailVerified && a.email?.toLowerCase() === emailLower)) &&
        (!a.status || a.status === 'Active')
    );
    if (!match) return;
    acc.role = match.role as UserRole;
    acc.adminRole = match.role;
    acc.status = 'Active';
    acc.verificationStatus = 'Approved';
  };

  // Private admissions and student data, loaded according to who is signed in:
  //   approved admins     -> every record (Admin Workspace)
  //   applicant / student -> only their own application, student record, requests and
  //                          notifications (firestore.rules enforces the same limits)
  //   signed out          -> nothing
  // An existing student record whose email matches the signed-in Google account is linked
  // to that account on first sign-in, which opens the Student Portal.
  const authUid = firebaseAuthUser?.uid || '';
  const authEmail = firebaseAuthUser?.emailVerified ? (firebaseAuthUser.email || '').toLowerCase() : '';
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const privateCacheKeys = ['applications', 'students', 'enrollments', 'studentNotifications', 'preEnlistments', 'addDropRequests', 'studentProfile'];
    const listen = <T,>(label: string, source: any, apply: (rows: T[]) => void) => {
      unsubs.push(
        onSnapshot(
          source,
          (snap: any) => apply(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[]),
          (err: any) => handleFirestoreError(err, OperationType.LIST, label)
        )
      );
    };

    if (isAdminLoggedIn && authUid) {
      listen<AdmissionApplication>('applications', collection(db, 'applications'), (list) => {
        setApplications((prev) => (areEntitiesEqual(prev, list) ? prev : list));
        setCachedData('applications', list);
      });
      listen<StudentProfile>('studentProfiles', collection(db, 'studentProfiles'), (rows) => {
        rawAdminStudentRowsRef.current = rows;
        setRegistryBlockedStudents(rows.filter((s) => isUserDeletedRef.current(s)));
        const list = rows.filter((s) => !isUserDeletedRef.current(s));
        setStudents((prev) => (areEntitiesEqual(prev, list) ? prev : list));
        setCachedData('students', list);
        setUserAccounts((prev) => {
          const next = syncWithAdminsAndStudents(prev, stateRef.current.adminUsers, list);
          setCachedData('userAccounts', next);
          return areUserAccountsEqual(prev, next) ? prev : next;
        });
      });
      listen<OnlineEnrollment>('enrollments', collection(db, 'enrollments'), (list) => {
        setEnrollments((prev) => (areEntitiesEqual(prev, list) ? prev : list));
        setCachedData('enrollments', list);
      });
      listen<StudentNotification>('studentNotifications', collection(db, 'studentNotifications'), (list) => {
        setStudentNotifications((prev) => (areEntitiesEqual(prev, list) ? prev : list));
        setCachedData('studentNotifications', list);
      });
      listen<PreEnlistmentRecord>('preEnlistments', collection(db, 'preEnlistments'), (list) => {
        setPreEnlistments((prev) => (areEntitiesEqual(prev, list) ? prev : list));
        setCachedData('preEnlistments', list);
      });
      listen<AddDropRequest>('addDropRequests', collection(db, 'addDropRequests'), (list) => {
        setAddDropRequests((prev) => (areEntitiesEqual(prev, list) ? prev : list));
        setCachedData('addDropRequests', list);
      });
      listen<StudentBalancePayment>('studentPayments', collection(db, 'studentPayments'), setStudentPayments);
      return () => unsubs.forEach((u) => u());
    }

    // Not an admin: never keep other people's records in this browser.
    if (typeof window !== 'undefined') {
      privateCacheKeys.forEach((k) => {
        try {
          localStorage.removeItem(`pcm_cache_${k}`);
        } catch {}
      });
    }
    setApplications([]);
    setStudents([]);
    setEnrollments([]);
    setStudentNotifications([]);
    setPreEnlistments([]);
    setAddDropRequests([]);
    setStudentPayments([]);

    if (!authUid) {
      setIsStudentLoggedIn(false);
      return;
    }

    // Applications: by uid, plus older ones made with the same verified email.
    const appsByKey: Record<string, AdmissionApplication[]> = { uid: [], email: [] };
    const publishApps = () => {
      const merged = new Map<string, AdmissionApplication>();
      [...appsByKey.uid, ...appsByKey.email].forEach((a) => merged.set(a.id, a));
      setApplications(Array.from(merged.values()));
    };
    listen<AdmissionApplication>('applications', query(collection(db, 'applications'), where('applicantUid', '==', authUid)), (list) => {
      appsByKey.uid = list;
      publishApps();
    });
    if (authEmail) {
      listen<AdmissionApplication>('applications', query(collection(db, 'applications'), where('email', '==', authEmail)), (list) => {
        appsByKey.email = list;
        publishApps();
      });
    }

    // Student record: linked by uid, or found by verified email and linked now.
    const profilesByKey: Record<string, StudentProfile[]> = { uid: [], email: [] };
    const publishProfile = () => {
      const linked = profilesByKey.uid[0];
      const unlinked = profilesByKey.email.find((p) => !p.authUid);
      if (!linked && unlinked) {
        updateDoc(doc(db, 'studentProfiles', unlinked.id), {
          authUid,
          linkedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).catch((e) => console.warn('Student record link notice:', e));
      }
      const mine = linked || unlinked;
      if (mine) {
        setStudents([mine]);
        setStudentProfile(mine);
        setIsStudentLoggedIn(true);
      } else {
        setIsStudentLoggedIn(false);
      }
    };
    listen<StudentProfile>('studentProfiles', query(collection(db, 'studentProfiles'), where('authUid', '==', authUid)), (list) => {
      profilesByKey.uid = list;
      publishProfile();
    });
    if (authEmail) {
      listen<StudentProfile>('studentProfiles', query(collection(db, 'studentProfiles'), where('email', '==', authEmail)), (list) => {
        profilesByKey.email = list;
        publishProfile();
      });
    }

    listen<OnlineEnrollment>('enrollments', query(collection(db, 'enrollments'), where('studentUid', '==', authUid)), setEnrollments);
    listen<PreEnlistmentRecord>('preEnlistments', query(collection(db, 'preEnlistments'), where('studentUid', '==', authUid)), setPreEnlistments);
    listen<AddDropRequest>('addDropRequests', query(collection(db, 'addDropRequests'), where('studentUid', '==', authUid)), setAddDropRequests);
    listen<StudentBalancePayment>('studentPayments', query(collection(db, 'studentPayments'), where('studentUid', '==', authUid)), setStudentPayments);
    listen<StudentNotification>('studentNotifications', query(collection(db, 'studentNotifications'), where('recipientUid', '==', authUid)), setStudentNotifications);

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminLoggedIn, authUid, authEmail]);

  // Keep the adminEmails/{email} index in step with the active adminUsers directory.
  // firestore.rules can't search adminUsers by email, so it checks this index to recognise
  // admins whose adminUsers entry isn't keyed by their Firebase uid. Super Admin and Admin
  // sessions maintain it (an Admin session leaves Super Admin entries alone, as the rules
  // require); documents are only added, updated or removed here.
  useEffect(() => {
    const sessionRole = currentAdminUser?.role;
    if (!isAdminLoggedIn || !firebaseAuthUser || (sessionRole !== 'Super Admin' && sessionRole !== 'Admin')) return;
    if (adminUsers.length === 0) return;
    const mayTouch = (role?: string) => sessionRole === 'Super Admin' || role !== 'Super Admin';
    let cancelled = false;
    (async () => {
      try {
        const desired = new Map<string, { email: string; role: string; adminId: string }>();
        adminUsers.forEach((a) => {
          const email = a.email?.trim().toLowerCase();
          if (email && (!a.status || a.status === 'Active')) {
            desired.set(email, { email, role: a.role, adminId: a.id });
          }
        });
        const snap = await getDocs(collection(db, 'adminEmails'));
        if (cancelled) return;
        const existing = new Map(snap.docs.map((d) => [d.id, d.data()]));
        const batch = writeBatch(db);
        let changes = 0;
        desired.forEach((entry, email) => {
          const cur = existing.get(email);
          if (!cur || cur.role !== entry.role || cur.active !== true || cur.adminId !== entry.adminId) {
            if (!mayTouch(entry.role) || !mayTouch(cur?.role)) return;
            batch.set(doc(db, 'adminEmails', email), { ...entry, active: true, updatedAt: new Date().toISOString() });
            changes++;
          }
        });
        existing.forEach((cur, email) => {
          if (!desired.has(email) && mayTouch(cur?.role)) {
            batch.delete(doc(db, 'adminEmails', email));
            changes++;
          }
        });
        if (changes > 0 && !cancelled) await batch.commit();
      } catch (e) {
        console.warn('adminEmails index sync notice:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdminLoggedIn, currentAdminUser?.role, firebaseAuthUser, adminUsers]);

  // Admin view: when the Deletion Registry changes, re-split the loaded student records into
  // visible and registry-blocked, so a removed or restored entry shows its student again at once.
  useEffect(() => {
    if (!isAdminLoggedIn) {
      rawAdminStudentRowsRef.current = null;
      setRegistryBlockedStudents([]);
      return;
    }
    const rows = rawAdminStudentRowsRef.current;
    if (!rows) return;
    setRegistryBlockedStudents(rows.filter((s) => isUserDeleted(s)));
    const visible = rows.filter((s) => !isUserDeleted(s));
    setStudents((prev) => (areEntitiesEqual(prev, visible) ? prev : visible));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserDeleted, isAdminLoggedIn]);

  // An account deleted by an administrator is signed out in every browser where it is open.
  // The deletion registry (deletedUsers) is a live listener, so this runs as soon as the
  // deletion is saved, and also covers a deleted user whose sign-in completed before the
  // registry had loaded.
  const forcedSignOutUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!firebaseAuthUser) {
      forcedSignOutUidRef.current = null;
      return;
    }
    const uid = firebaseAuthUser.uid;
    const email = (firebaseAuthUser.email || '').toLowerCase().trim();
    const deleted = (email && isUserDeleted(email)) || isUserDeleted(uid);
    if (!deleted || forcedSignOutUidRef.current === uid) return;
    forcedSignOutUidRef.current = uid;

    setIsAdminLoggedIn(false);
    setIsStudentLoggedIn(false);
    setCurrentUserAccount(null);
    setCurrentEnrollmentDraft(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pcm_admin_session');
        localStorage.removeItem('pcm_user_session');
        localStorage.removeItem('pcm_student_session');
      } catch {}
    }
    signOut(auth).catch(() => {});
    addToast({
      title: 'Signed Out',
      message: 'This account has been removed by a PCM administrator, so you have been signed out. Contact the school office if you think this is a mistake.',
      type: 'error',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseAuthUser, isUserDeleted]);

  // Admin CMS Auth & Management
  // Admin sign-in goes through Firebase Auth (email + password). The admin's role is then
  // verified by signInWithEmail / the auth listener against Firestore; no passwords are
  // compared in the browser.
  const adminLogin = async (user: string, pass: string): Promise<boolean> => {
    const trimmedUser = user.trim().toLowerCase();

    // Allow signing in with an admin username by mapping it to that admin's email.
    const email = trimmedUser.includes('@')
      ? trimmedUser
      : adminUsers.find((u) => u.username?.toLowerCase() === trimmedUser)?.email?.toLowerCase() || '';

    if (!email) {
      addToast({
        title: 'Login Failed',
        message: 'Enter the email address of your administrator account.',
        type: 'error',
      });
      return false;
    }

    const res = await signInWithEmail(email, pass);
    if (!res.success || res.isPending) return false;

    if (!ADMIN_ROLE_NAMES.includes(res.role || '')) {
      addToast({
        title: 'Access Restricted',
        message: 'This account is not authorized to access the Admin Workspace.',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  const adminLogout = () => {
    logActivity('LOGOUT', 'Admin Session', currentAdminUser?.id || '', currentAdminUser?.name || '', 'Ended admin session.');
    setIsAdminLoggedIn(false);
    setCurrentUserAccount(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pcm_admin_session');
        localStorage.removeItem('pcm_user_session');
      } catch {}
    }
    signOut(auth).catch(() => {});
    addToast('info', 'Session Terminated', 'You have been signed out of the Admin CMS.');
  };

  // Adding, approving or changing admin accounts is limited to the Super Admin and Admin
  // roles, and only a Super Admin may grant or alter the Super Admin role. firestore.rules
  // enforces the same limits on the database.
  const canManageAdminRole = (role?: string, previousRole?: string): boolean => {
    if (!canPerformAction('Admin')) return false;
    if ((role === 'Super Admin' || previousRole === 'Super Admin') && !isSuperAdminSession()) return false;
    return true;
  };

  const denyAdminManagement = (role?: string) => {
    addToast(
      'error',
      'Permission Denied',
      role === 'Super Admin'
        ? 'Only a Super Admin can grant or change the Super Admin role.'
        : 'Only the Super Admin and Admin users can add, approve or change administrator accounts.'
    );
  };

  const addAdminUser = (user: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser => {
    if (!canManageAdminRole(user.role)) {
      denyAdminManagement(user.role);
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
    // Any admin may edit their own profile details; role, status and email changes (or
    // edits to other admins) need an approver.
    const existingAdmin = adminUsers.find((u) => u.id === id);
    const isOwnRecord =
      id === currentAdminUser?.id ||
      (!!existingAdmin?.email && existingAdmin.email.toLowerCase() === currentUserAccount?.email?.toLowerCase());
    const changesAccess =
      (updates.role !== undefined && updates.role !== existingAdmin?.role) ||
      (updates.status !== undefined && updates.status !== existingAdmin?.status) ||
      (updates.email !== undefined && updates.email !== existingAdmin?.email);
    if ((changesAccess || !isOwnRecord) && !canManageAdminRole(updates.role, existingAdmin?.role)) {
      denyAdminManagement(updates.role || existingAdmin?.role);
      return;
    }
    const sanitized = cleanFirestoreData(updates);
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );

    // If updating current logged in admin user, update currentAdminUser state
    if (currentAdminUser?.id === id) {
      setCurrentAdminUser((prev) => ({ ...prev, ...updates }));
    }

    // Synchronize avatar across user accounts and Google/Firebase profile if updated
    if (updates.avatarUrl !== undefined) {
      const newPhoto = updates.avatarUrl || '';
      const targetUser = adminUsers.find((u) => u.id === id) || currentAdminUser;
      setCurrentUserAccount((prev) => {
        if (!prev) return prev;
        if (prev.role === 'Admin' || prev.email === targetUser?.email) {
          return { ...prev, photoURL: newPhoto, avatarUrl: newPhoto };
        }
        return prev;
      });
      setUserAccounts((prev) =>
        prev.map((acc) =>
          acc.email === targetUser?.email || (acc.role === 'Admin' && currentAdminUser?.id === id)
            ? { ...acc, photoURL: newPhoto, avatarUrl: newPhoto }
            : acc
        )
      );
      if (auth.currentUser && (currentUserAccount?.email === targetUser?.email || currentUserAccount?.role === 'Admin')) {
        updateProfile(auth.currentUser, { photoURL: newPhoto }).catch((err) => console.warn('Auth photoURL sync notice:', err));
      }
    }

    setDoc(doc(db, 'adminUsers', id), sanitized, { merge: true }).catch((e) => console.warn(e));
    logActivity('UPDATE', 'Admin User', id, updates.name || currentAdminUser?.name || 'Admin', updates.avatarUrl !== undefined ? 'Updated administrator profile photo.' : 'Updated user role or permissions.');
    addToast('success', 'Admin Profile Updated', 'Admin account updated.');
  };

  const updateAdminAvatar = async (avatarUrl: string, adminId?: string): Promise<boolean> => {
    const targetId = adminId || currentAdminUser.id;
    updateAdminUser(targetId, { avatarUrl });
    return true;
  };

  const updateUserAvatar = async (avatarUrl: string): Promise<boolean> => {
    if (currentUserAccount?.role === 'Student' || (!isAdminLoggedIn && isStudentLoggedIn)) {
      return await updateStudentAvatar(avatarUrl);
    } else {
      return await updateAdminAvatar(avatarUrl);
    }
  };

  const deleteAdminUser = (id: string) => {
    const existingAdmin = adminUsers.find((u) => u.id === id);
    if (!canManageAdminRole(undefined, existingAdmin?.role)) {
      denyAdminManagement(existingAdmin?.role);
      return;
    }
    if (adminUsers.length <= 1) {
      addToast('error', 'Cannot Delete', 'You cannot delete the only remaining admin account.');
      return;
    }
    deleteUserAccount(id);
  };

  // Google / Firebase Authentication & Multi-Role Identity
  const signInWithGoogle = async (
    requestedRole?: UserRole | AdminRole,
    customEmail?: string,
    customName?: string
  ): Promise<{ success: boolean; isPending?: boolean; isDisabled?: boolean; role?: string; user?: UserAccount; message?: string }> => {
    const wantsAdmin =
      requestedRole === 'Admin' ||
      requestedRole === 'Super Admin' ||
      requestedRole === 'Staff/Editor' ||
      requestedRole === 'Editor' ||
      requestedRole === 'Pending User';

    try {
      // Always authenticate with Google. customEmail is only a hint for the account picker;
      // it never creates an identity by itself.
      let fbUser: FirebaseUser;
      try {
        if (customEmail && customEmail.trim()) {
          googleProvider.setCustomParameters({ prompt: 'select_account', login_hint: customEmail.trim() });
        } else {
          googleProvider.setCustomParameters({ prompt: 'select_account' });
        }
        const result = await signInWithPopup(auth, googleProvider);
        fbUser = result.user;
      } catch (popupErr: any) {
        if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/operation-not-supported-in-this-environment') {
          // Fall back to a full-page redirect; the auth listener finishes sign-in on return.
          await signInWithRedirect(auth, googleProvider);
          return { success: false, message: 'Redirecting to Google sign-in…' };
        }
        throw popupErr;
      }

      const emailLower = fbUser.email?.toLowerCase() || '';
      const isEmailVerified = fbUser.emailVerified === true;
      const isSuperAdminEmail = isEmailVerified && SUPER_ADMIN_EMAILS.includes(emailLower);

      // Check Firestore doc first with memory fallback
      let existingAccount: UserAccount | null = null;
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          existingAccount = snap.data() as UserAccount;
        }
      } catch {
        existingAccount =
          userAccounts.find(
            (u) => u.uid === fbUser.uid || u.id === fbUser.uid || u.email?.toLowerCase() === emailLower
          ) || null;
      }

      let accountData: UserAccount;

      if (existingAccount) {
        accountData = {
          ...existingAccount,
          name: fbUser.displayName || existingAccount.name || 'PCM User',
          displayName: fbUser.displayName || existingAccount.displayName || 'PCM User',
          photoURL: fbUser.photoURL || existingAccount.photoURL || '',
          avatarUrl: fbUser.photoURL || existingAccount.avatarUrl || '',
          lastLogin: new Date().toISOString(),
          authMethod: 'google.com',
          provider: 'google.com',
          emailVerified: fbUser.emailVerified,
        };

        // A signed-in user without an admin role asking for admin access becomes a Pending
        // request. Existing admins of any role keep their access, and rejected or disabled
        // accounts are left as they are (only an approver can change them).
        if (
          wantsAdmin &&
          !ADMIN_ROLE_NAMES.includes(existingAccount.role as string) &&
          !['Approved', 'Rejected', 'Disabled', 'Inactive'].includes(existingAccount.status as string)
        ) {
          accountData.status = 'Pending';
          accountData.verificationStatus = 'Pending';
          accountData.requestedRole = (requestedRole as AdminRole) || 'Admin';
          accountData.requestedAt = new Date().toISOString();
        }
      } else {
        // First time registration with Google
        if (isSuperAdminEmail) {
          accountData = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Angelo Perfecto',
            displayName: fbUser.displayName || 'Angelo Perfecto',
            photoURL: fbUser.photoURL || '',
            avatarUrl: fbUser.photoURL || '',
            role: 'Super Admin',
            adminRole: 'Super Admin',
            department: 'Administration & Executive Leadership',
            status: 'Active',
            verificationStatus: 'Approved',
            authMethod: 'google.com',
            provider: 'google.com',
            emailVerified: fbUser.emailVerified,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
        } else if (wantsAdmin) {
          // New admin request must be Pending Verification
          accountData = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Admin Applicant',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Admin Applicant',
            photoURL: fbUser.photoURL || '',
            avatarUrl: fbUser.photoURL || '',
            role: 'Pending User',
            requestedRole: (requestedRole as AdminRole) || 'Admin',
            department: 'Administration & Management',
            status: 'Pending',
            verificationStatus: 'Pending',
            authMethod: 'google.com',
            provider: 'google.com',
            emailVerified: fbUser.emailVerified,
            requestedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
        } else {
          // Standard student/user registration
          accountData = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Student',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'PCM Student',
            photoURL: fbUser.photoURL || '',
            avatarUrl: fbUser.photoURL || '',
            role: 'Student/User',
            department: 'Undergraduate Theology',
            status: 'Active',
            verificationStatus: 'Approved',
            authMethod: 'google.com',
            provider: 'google.com',
            emailVerified: fbUser.emailVerified,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
        }
      }

      if (isSuperAdminEmail) {
        accountData.role = 'Super Admin';
        accountData.adminRole = 'Super Admin';
        accountData.status = 'Active';
        accountData.verificationStatus = 'Approved';
      } else {
        applyDirectoryAdminRole(accountData, fbUser.uid, emailLower, isEmailVerified);
      }

      // Persist to Firestore
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await safeSetDoc(userDocRef, accountData, { merge: true });
      } catch (e) {
        console.warn('Firestore setDoc notice:', e);
      }

      setCurrentUserAccount(accountData);
      setFirebaseAuthUser(fbUser as any);
      setUserAccounts((prev) => [accountData, ...prev.filter((u) => u.uid !== accountData.uid && u.id !== accountData.uid)]);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pcm_user_session', JSON.stringify(accountData));
        } catch {}
      }

      const isPending = accountData.status === 'Pending' || accountData.status === 'Pending Verification' || accountData.role === 'Pending User';
      const isDisabled = accountData.status === 'Disabled' || accountData.status === 'Rejected' || accountData.status === 'Inactive';

      if (isPending) {
        setIsAdminLoggedIn(false);
        setIsStudentLoggedIn(false);
        addToast({
          type: 'warning',
          title: 'Verification Pending',
          message: 'Your account is currently pending verification. Please wait for an administrator to approve your access.',
        });
        logActivity('LOGIN', 'Google Auth', accountData.uid, accountData.name, `Google sign-in attempt with status Pending Verification.`);
        return {
          success: true,
          isPending: true,
          role: accountData.role,
          user: accountData,
          message: 'Your account is currently pending verification. Please wait for an administrator to approve your access.',
        };
      }

      if (isDisabled) {
        setIsAdminLoggedIn(false);
        setIsStudentLoggedIn(false);
        const msg = accountData.status === 'Rejected'
          ? 'Your administrative access request has been rejected. Please contact the Super Admin for assistance.'
          : 'Your account has been deactivated or disabled by an administrator.';
        addToast({
          type: 'error',
          title: 'Access Restricted',
          message: msg,
        });
        return {
          success: false,
          isDisabled: true,
          role: accountData.role,
          user: accountData,
          message: msg,
        };
      }

      const isAdminRole = ['Super Admin', 'Admin', 'Staff/Editor', 'Editor', 'Content Admin', 'Academic Admin', 'Registrar', 'Finance'].includes(accountData.role as string);

      if (isAdminRole) {
        const adminObj: AdminUser = {
          id: accountData.uid,
          name: accountData.name,
          email: accountData.email,
          username: accountData.email.split('@')[0] || 'admin',
          role: accountData.adminRole || (accountData.role === 'Staff/Editor' ? 'Staff/Editor' : 'Admin'),
          department: accountData.department || 'Administration & Executive Leadership',
          status: 'Active',
          createdAt: accountData.createdAt,
          avatarUrl: accountData.photoURL || accountData.avatarUrl,
        };
        setIsAdminLoggedIn(true);
        setIsStudentLoggedIn(false);
        setCurrentAdminUser(adminObj);
        addToast({
          type: 'success',
          title: 'Administrator Verified',
          message: `Welcome back, ${accountData.name}! (${accountData.adminRole || accountData.role})`,
        });
        logActivity('LOGIN', 'Admin Session', accountData.uid, accountData.name, `Authenticated via Google (${accountData.role}).`);
        return { success: true, role: accountData.role, user: accountData };
      } else {
        // Student Portal access follows from a linked student record (auth-scoped effect).
        setIsAdminLoggedIn(false);
        addToast({
          type: 'success',
          title: 'Sign-in Successful',
          message: `Welcome to Philippine College of Ministry, ${accountData.name}!`,
        });
        logActivity('LOGIN', 'User Session', accountData.uid, accountData.name, `Signed in via Google.`);
        return { success: true, role: accountData.role, user: accountData };
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        addToast({ type: 'info', title: 'Sign-In Cancelled', message: 'Google sign-in popup was closed.' });
      } else {
        addToast({ type: 'error', title: 'Google Sign-In Error', message: err?.message || 'Unable to authenticate with Google.' });
      }
      return { success: false, message: err?.message };
    }
  };

  const signInWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; isPending?: boolean; isDisabled?: boolean; role?: string; user?: UserAccount; message?: string }> => {
    const trimmedEmail = email.trim();
    const trimmedEmailLower = trimmedEmail.toLowerCase();
    const trimmedPass = pass.trim();

    // Authenticate with Firebase Auth only. There is no fallback: if Firebase can't verify
    // the password, sign-in fails.
    try {
      let fbUser: FirebaseUser;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
        fbUser = userCredential.user;
      } catch (authErr: any) {
        if (authErr?.code === 'auth/operation-not-allowed') {
          throw new Error('Email/password sign-in is not enabled for this site. Please sign in with Google.');
        }
        throw authErr;
      }

      const emailLower = fbUser.email?.toLowerCase() || trimmedEmailLower;
      const isEmailVerified = fbUser.emailVerified === true;
      const isSuperAdminEmail = isEmailVerified && SUPER_ADMIN_EMAILS.includes(emailLower);

      // Read profile from Firestore
      let userAcc: UserAccount | null = null;
      try {
        const docSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (docSnap.exists()) {
          userAcc = docSnap.data() as UserAccount;
        }
      } catch (e) {
        console.warn('Firestore read error during email sign-in:', e);
      }

      if (!userAcc) {
        userAcc = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email || trimmedEmail,
          name: fbUser.displayName || trimmedEmail.split('@')[0],
          displayName: fbUser.displayName || trimmedEmail.split('@')[0],
          photoURL: fbUser.photoURL || '',
          avatarUrl: fbUser.photoURL || '',
          role: isSuperAdminEmail ? 'Super Admin' : 'Student/User',
          adminRole: isSuperAdminEmail ? 'Super Admin' : undefined,
          status: 'Active',
          verificationStatus: 'Approved',
          authMethod: 'password',
          provider: 'password',
          emailVerified: fbUser.emailVerified,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
      }

      if (isSuperAdminEmail) {
        userAcc.role = 'Super Admin';
        userAcc.adminRole = 'Super Admin';
        userAcc.status = 'Active';
        userAcc.verificationStatus = 'Approved';
      } else {
        applyDirectoryAdminRole(userAcc, fbUser.uid, emailLower, isEmailVerified);
      }

      // Admin access tied to an email address requires proof of ownership first.
      const isAdminEmail =
        SUPER_ADMIN_EMAILS.includes(emailLower) ||
        adminUsers.some((a) => a.email?.toLowerCase() === emailLower);
      if (isAdminEmail && !isEmailVerified) {
        sendEmailVerification(fbUser).catch((e) => console.warn('Verification email notice:', e));
        addToast({
          type: 'info',
          title: 'Verify Your Email',
          message: `We sent a verification link to ${fbUser.email}. Open it, then sign in again to access the Admin Workspace.`,
        });
      }

      userAcc.lastLogin = new Date().toISOString();
      safeSetDoc(doc(db, 'users', fbUser.uid), userAcc, { merge: true }).catch(console.warn);

      setCurrentUserAccount(userAcc);
      setFirebaseAuthUser(fbUser);

      const isPending = userAcc.status === 'Pending' || userAcc.status === 'Pending Verification' || userAcc.role === 'Pending User';
      const isDisabled = userAcc.status === 'Disabled' || userAcc.status === 'Rejected' || userAcc.status === 'Inactive';

      if (isPending) {
        setIsAdminLoggedIn(false);
        setIsStudentLoggedIn(false);
        const msg = 'Your account is currently pending verification. Please wait for an administrator to approve your access.';
        addToast({
          type: 'warning',
          title: 'Verification Pending',
          message: msg,
        });
        return {
          success: true,
          isPending: true,
          role: userAcc.role,
          user: userAcc,
          message: msg,
        };
      }

      if (isDisabled) {
        setIsAdminLoggedIn(false);
        setIsStudentLoggedIn(false);
        const msg = userAcc.status === 'Rejected'
          ? 'Your administrative access request has been rejected. Please contact the Super Admin for assistance.'
          : 'Your account has been deactivated or disabled by an administrator.';
        addToast({
          type: 'error',
          title: 'Access Restricted',
          message: msg,
        });
        return {
          success: false,
          isDisabled: true,
          role: userAcc.role,
          user: userAcc,
          message: msg,
        };
      }

      const isAdminRole = ['Super Admin', 'Admin', 'Staff/Editor', 'Editor', 'Content Admin', 'Academic Admin', 'Registrar', 'Finance'].includes(userAcc.role as string);

      if (isAdminRole) {
        const adminObj: AdminUser = {
          id: userAcc.uid,
          name: userAcc.name,
          email: userAcc.email,
          username: userAcc.email.split('@')[0] || 'admin',
          role: userAcc.adminRole || (userAcc.role === 'Staff/Editor' ? 'Staff/Editor' : 'Admin'),
          department: userAcc.department || 'Administration & Executive Leadership',
          status: 'Active',
          createdAt: userAcc.createdAt,
          avatarUrl: userAcc.photoURL || userAcc.avatarUrl,
        };
        setIsAdminLoggedIn(true);
        setIsStudentLoggedIn(false);
        setCurrentAdminUser(adminObj);
        addToast({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome, ${userAcc.name} (${userAcc.adminRole || userAcc.role})`,
        });
        logActivity('LOGIN', 'Admin Session', userAcc.uid, userAcc.name, `Logged in via Email/Password.`);
        return { success: true, role: userAcc.role, user: userAcc };
      } else {
        // Student Portal access follows from a linked student record (auth-scoped effect).
        setIsAdminLoggedIn(false);
        addToast({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome, ${userAcc.name}!`,
        });
        logActivity('LOGIN', 'User Session', userAcc.uid, userAcc.name, `Logged in via Email/Password.`);
        return { success: true, role: userAcc.role, user: userAcc };
      }
    } catch (err: any) {
      console.error('Email sign in error:', err);
      let errorMsg = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMsg = 'This user account has been disabled.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: errorMsg,
      });
      return { success: false, message: errorMsg };
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    pass: string,
    requestedRole: UserRole | AdminRole = 'Student/User',
    department: string = 'General'
  ): Promise<{ success: boolean; isPending?: boolean; user?: UserAccount; message?: string }> => {
    const trimmedEmail = email.trim();
    const trimmedEmailLower = trimmedEmail.toLowerCase();
    const isRequestingAdmin = requestedRole === 'Admin' || requestedRole === 'Super Admin' || requestedRole === 'Staff/Editor' || requestedRole === 'Editor' || requestedRole === 'Pending User';

    try {
      let fbUser: FirebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass.trim());
        fbUser = userCredential.user;
        await updateProfile(fbUser, { displayName: name.trim() }).catch(() => {});
      } catch (authErr: any) {
        if (authErr?.code === 'auth/operation-not-allowed') {
          throw new Error('Email/password registration is not enabled for this site. Please sign in with Google.');
        }
        throw authErr;
      }

      // A brand-new password account is unverified, so it never receives Super Admin here.
      // The owner of a Super Admin email gets a verification link; once verified, the auth
      // listener grants the role on their next sign-in.
      const isSuperAdminEmail = fbUser.emailVerified === true && SUPER_ADMIN_EMAILS.includes(trimmedEmailLower);
      if (!fbUser.emailVerified && SUPER_ADMIN_EMAILS.includes(trimmedEmailLower)) {
        sendEmailVerification(fbUser).catch((e) => console.warn('Verification email notice:', e));
      }

      let newAccount: UserAccount;

      if (isSuperAdminEmail) {
        newAccount = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: name.trim() || 'Angelo Perfecto',
          displayName: name.trim() || 'Angelo Perfecto',
          email: trimmedEmail,
          role: 'Super Admin',
          adminRole: 'Super Admin',
          department: 'Administration & Executive Leadership',
          status: 'Active',
          verificationStatus: 'Approved',
          authMethod: 'password',
          provider: 'password',
          emailVerified: fbUser.emailVerified,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
      } else if (isRequestingAdmin) {
        // Newly registered admin user MUST be initially Pending Verification
        newAccount = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: name.trim(),
          displayName: name.trim(),
          email: trimmedEmail,
          role: 'Pending User',
          requestedRole: (requestedRole as AdminRole) || 'Admin',
          department: department || 'Office of Administration',
          status: 'Pending',
          verificationStatus: 'Pending',
          authMethod: 'password',
          provider: 'password',
          emailVerified: fbUser.emailVerified,
          requestedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
      } else {
        newAccount = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: name.trim(),
          displayName: name.trim(),
          email: trimmedEmail,
          role: 'Student/User',
          department: department || 'Undergraduate Studies',
          status: 'Active',
          verificationStatus: 'Approved',
          authMethod: 'password',
          provider: 'password',
          emailVerified: fbUser.emailVerified,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
      }

      await safeSetDoc(doc(db, 'users', fbUser.uid), cleanFirestoreData(newAccount));

      setCurrentUserAccount(newAccount);
      setFirebaseAuthUser(fbUser);
      setUserAccounts((prev) => [newAccount, ...prev.filter((u) => u.uid !== newAccount.uid)]);

      if (isRequestingAdmin && !isSuperAdminEmail) {
        setIsAdminLoggedIn(false);
        setIsStudentLoggedIn(false);
        const msg = 'Your administrative registration has been submitted and is currently awaiting Super Admin review and verification.';
        addToast({
          type: 'info',
          title: 'Pending Verification',
          message: msg,
        });
        logActivity('REGISTER', 'Admin Application', newAccount.uid, newAccount.name, `Registered with status Pending Verification (${newAccount.requestedRole}).`);
        return { success: true, isPending: true, user: newAccount, message: msg };
      } else if (isSuperAdminEmail) {
        setIsAdminLoggedIn(true);
        setCurrentAdminUser({
          id: newAccount.uid,
          name: newAccount.name,
          email: newAccount.email,
          username: newAccount.email.split('@')[0],
          role: 'Super Admin',
          department: newAccount.department,
          status: 'Active',
          createdAt: newAccount.createdAt,
        });
        addToast({
          type: 'success',
          title: 'Super Admin Initialized',
          message: 'Welcome Angelo Perfecto! Super Admin privileges active.',
        });
        return { success: true, isPending: false, user: newAccount };
      } else {
        setIsStudentLoggedIn(true);
        addToast({
          type: 'success',
          title: 'Registration Complete',
          message: `Welcome to PCM, ${newAccount.name}! Your student account is active.`,
        });
        return { success: true, isPending: false, user: newAccount };
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMsg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: errorMsg,
      });
      return { success: false, message: errorMsg };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
    if (!email || !email.includes('@')) {
      addToast({ type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address.' });
      return { success: false, message: 'Invalid email' };
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      addToast({
        type: 'success',
        title: 'Password Reset Email Sent',
        message: `Instructions to reset your password have been sent to ${email.trim()}.`,
      });
      return { success: true };
    } catch (err: any) {
      console.error('Password reset error:', err);
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Unable to send password reset email.',
      });
      return { success: false, message: err.message };
    }
  };

  const signOutUser = async () => {
    try {
      const email = currentUserAccount?.email || firebaseAuthUser?.email || currentAdminUser?.email || 'User';
      await signOut(auth).catch(() => {});
      setFirebaseAuthUser(null);
      setCurrentUserAccount(null);
      setIsAdminLoggedIn(false);
      setIsStudentLoggedIn(false);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('pcm_admin_session');
          localStorage.removeItem('pcm_user_session');
          localStorage.removeItem('pcm_student_session');
        } catch {}
      }
      logActivity('LOGOUT', 'User Session', 'auth', email, 'User signed out from PCM session.');
      addToast('info', 'Signed Out', `You have been securely signed out.`);
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
    // 1. Locate target account across all user sources
    const target =
      userAccounts.find((u) => u.id === userId || u.uid === userId || u.email?.toLowerCase() === userId.toLowerCase()) ||
      (adminUsers.find((a) => a.id === userId || a.email?.toLowerCase() === userId.toLowerCase()) as any) ||
      (students.find((s) => s.id === userId || s.studentId === userId || s.email?.toLowerCase() === userId.toLowerCase()) as any);

    const targetEmail = (target?.email || (userId.includes('@') ? userId : '')).toLowerCase().trim();

    const targetIsSuper = target?.role === 'Super Admin' || target?.adminRole === 'Super Admin';
    if (!canManageAdminRole(undefined, targetIsSuper ? 'Super Admin' : undefined)) {
      denyAdminManagement(targetIsSuper ? 'Super Admin' : undefined);
      return;
    }

    if (targetEmail === 'angeloperfecto.epc@gmail.com') {
      addToast({
        title: 'Action Protected',
        message: 'The primary Super Administrator account (angeloperfecto.epc@gmail.com) cannot be deleted.',
        type: 'error',
      });
      return;
    }

    const adminActor = currentAdminUser?.name || currentUserAccount?.name || 'Administrator';
    const deletedRecord: DeletedUserRecord = {
      id: target?.id || userId,
      uid: target?.uid || (target?.id && target.id.startsWith('uid-') ? target.id.replace('uid-', '') : userId),
      email: targetEmail || `${userId}@pcm.local`,
      name: target?.name || target?.displayName || target?.fullName || 'User Account',
      role: target?.role || 'Admin',
      adminRole: target?.adminRole || (target?.role === 'Super Admin' ? 'Super Admin' : undefined),
      department: target?.department || target?.degreeProgram,
      studentId: target?.studentId,
      deletedAt: new Date().toISOString(),
      deletedBy: adminActor,
      originalAccount: target ? { ...target } : undefined,
    };

    // 2. Add to deletedUsers immediately in state and persistent localStorage
    setDeletedUsers((prev) => {
      const next = [
        ...prev.filter((d) => d.email.toLowerCase() !== deletedRecord.email.toLowerCase() && d.id !== deletedRecord.id),
        deletedRecord,
      ];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pcm_deleted_users', JSON.stringify(next));
        } catch {}
      }
      return next;
    });

    // 3. Purge immediately from local React active states
    setUserAccounts((prev) => prev.filter((u) => u.id !== userId && u.uid !== userId && u.email?.toLowerCase() !== targetEmail));
    setAdminUsers((prev) => prev.filter((a) => a.id !== userId && a.email?.toLowerCase() !== targetEmail));
    setStudents((prev) => prev.filter((s) => s.id !== userId && s.studentId !== userId && s.email?.toLowerCase() !== targetEmail));

    // 4. Save deletion tombstone to Firestore `deletedUsers` collection
    const docId = (deletedRecord.email || deletedRecord.uid || deletedRecord.id).replace(/[/\\?%*:|"<>]/g, '_').toLowerCase();
    try {
      await safeSetDoc(doc(db, 'deletedUsers', docId), cleanFirestoreData(deletedRecord));
    } catch (err) {
      console.warn('Failed to record deleted user tombstone in Firestore:', err);
    }

    // 5. Clean up from Firestore collections: users, adminUsers, studentProfiles
    const possibleDocIds = new Set<string>();
    if (userId) possibleDocIds.add(userId);
    if (deletedRecord.id) possibleDocIds.add(deletedRecord.id);
    if (deletedRecord.uid) possibleDocIds.add(deletedRecord.uid);
    if (target?.uid) possibleDocIds.add(target.uid);
    if (target?.id) possibleDocIds.add(target.id);
    if (target?.studentId) possibleDocIds.add(target.studentId);

    adminUsers.forEach((a) => {
      if (a.email?.toLowerCase() === targetEmail || a.id === userId) {
        possibleDocIds.add(a.id);
      }
    });

    students.forEach((s) => {
      if (s.email?.toLowerCase() === targetEmail || s.id === userId || s.studentId === userId) {
        possibleDocIds.add(s.id);
        if (s.studentId) possibleDocIds.add(s.studentId);
      }
    });

    // Remove admin rights at the database level straight away (firestore.rules read this index).
    if (targetEmail) {
      safeDeleteDoc(doc(db, 'adminEmails', targetEmail)).catch(console.warn);
    }

    for (const dId of possibleDocIds) {
      safeDeleteDoc(doc(db, 'users', dId)).catch(console.warn);
      safeDeleteDoc(doc(db, 'adminUsers', dId)).catch(console.warn);
      safeDeleteDoc(doc(db, 'studentProfiles', dId)).catch(console.warn);
    }

    logActivity('DELETE', 'User Account', userId, deletedRecord.name, `Permanently deleted user account (${deletedRecord.email}) by ${adminActor}.`);
    addToast('info', 'User Account Permanently Deleted', `"${deletedRecord.name}" (${deletedRecord.email}) has been permanently deleted and marked in the Deletion Registry.`);
  };

  const restoreUserAccount = async (userIdOrEmail: string): Promise<boolean> => {
    const cleanTarget = userIdOrEmail.trim().toLowerCase();
    const record = deletedUsers.find(
      (d) =>
        d.id.toLowerCase() === cleanTarget ||
        d.uid?.toLowerCase() === cleanTarget ||
        d.email.toLowerCase() === cleanTarget
    );

    if (!record) {
      addToast('error', 'Restore Failed', 'No deleted user record found matching this identifier.');
      return false;
    }

    const adminActor = currentAdminUser?.name || currentUserAccount?.name || 'Administrator';

    // 1. Remove from deletedUsers tombstone in Firestore
    const docId = record.docId || (record.email || record.uid || record.id).replace(/[/\\?%*:|"<>]/g, '_').toLowerCase();
    try {
      await safeDeleteDoc(doc(db, 'deletedUsers', docId));
    } catch (e) {
      console.warn('Failed to delete tombstone from deletedUsers:', e);
    }

    // 2. Remove from deletedUsers state and persistent localStorage
    setDeletedUsers((prev) => {
      const next = prev.filter(
        (d) =>
          d.id.toLowerCase() !== cleanTarget &&
          d.uid?.toLowerCase() !== cleanTarget &&
          d.email.toLowerCase() !== record.email.toLowerCase()
      );
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pcm_deleted_users', JSON.stringify(next));
        } catch {}
      }
      return next;
    });

    // 3. Reconstruct active user account
    const restoredAccount: UserAccount = record.originalAccount || {
      id: record.uid || record.id,
      uid: record.uid || record.id,
      email: record.email,
      name: record.name,
      displayName: record.name,
      role: (record.role as UserRole) || 'Admin',
      adminRole: (record.adminRole as AdminRole) || undefined,
      department: record.department,
      studentId: record.studentId,
      status: 'Active',
      verificationStatus: 'Approved',
      provider: record.email.endsWith('@pcm.edu.ph') ? 'google.com' : 'password',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    restoredAccount.status = 'Active';
    restoredAccount.verificationStatus = 'Approved';

    try {
      await safeSetDoc(doc(db, 'users', restoredAccount.uid || restoredAccount.id), cleanFirestoreData(restoredAccount));

      // If it was an admin user (any staff role, e.g. Editor, Registrar, Finance), also restore into adminUsers
      const restoredAdminRole =
        record.adminRole ||
        restoredAccount.adminRole ||
        (ADMIN_ROLE_NAMES.includes(restoredAccount.role) && restoredAccount.role !== 'Student/User' ? restoredAccount.role : undefined);
      if (restoredAdminRole) {
        const restoredAdmin: AdminUser = {
          id: restoredAccount.uid || restoredAccount.id,
          name: restoredAccount.name,
          email: restoredAccount.email,
          username: restoredAccount.email.split('@')[0],
          role: restoredAdminRole as AdminRole,
          department: restoredAccount.department || 'Office of Administration',
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
        await safeSetDoc(doc(db, 'adminUsers', restoredAdmin.id), cleanFirestoreData(restoredAdmin));
        setAdminUsers((prev) => [...prev.filter((a) => a.email.toLowerCase() !== restoredAdmin.email.toLowerCase() && a.id !== restoredAdmin.id), restoredAdmin]);
      }

      // If it was a student, restore studentProfile
      if (restoredAccount.role === 'Student' || restoredAccount.studentId) {
        const restoredStudent: StudentProfile = {
          id: restoredAccount.uid || restoredAccount.id,
          studentId: restoredAccount.studentId || `PCM-STD-${Date.now().toString().slice(-4)}`,
          fullName: restoredAccount.name,
          name: restoredAccount.name,
          email: restoredAccount.email,
          program: restoredAccount.department || 'Bachelor of Arts in Theology',
          degreeProgram: restoredAccount.department || 'Bachelor of Arts in Theology',
          yearLevel: '1st Year',
          academicStatus: 'Regular',
          enrollmentStatus: 'Enrolled',
          currentSemester: '1st Semester, AY 2026–2027',
          academicYear: '2026–2027',
          totalUnitsEarned: 0,
          gpa: 0,
          courses: [],
          tuitionTotal: 25000,
          tuitionPaid: 0,
          tuitionBalance: 25000,
          homeChurch: 'Philippine College of Ministry Chapel',
          mentorName: 'Dr. Emmanuel Santos',
          avatarUrl: restoredAccount.avatarUrl || restoredAccount.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
          practicumEntries: [],
          createdAt: new Date().toISOString(),
        };
        await safeSetDoc(doc(db, 'studentProfiles', restoredStudent.id), cleanFirestoreData(restoredStudent));
        setStudents((prev) => [...prev.filter((s) => s.email.toLowerCase() !== restoredStudent.email.toLowerCase() && s.id !== restoredStudent.id), restoredStudent]);
      }

      setUserAccounts((prev) => [...prev.filter((u) => u.email.toLowerCase() !== restoredAccount.email.toLowerCase() && u.id !== restoredAccount.id), restoredAccount]);
    } catch (err) {
      console.warn('Error saving restored account to Firestore:', err);
    }

    logActivity('RESTORE', 'User Account', restoredAccount.id, restoredAccount.name, `Manually restored user account (${restoredAccount.email}) by ${adminActor}.`);
    addToast('success', 'User Account Restored', `"${restoredAccount.name}" (${restoredAccount.email}) has been restored as an Active user.`);
    return true;
  };

  // Erases a registry entry without restoring the old account. The person is no longer blocked:
  // a later sign-in starts as a brand-new user with no previous role or records.
  const removeDeletedUserRecord = async (userIdOrEmail: string): Promise<boolean> => {
    const cleanTarget = userIdOrEmail.trim().toLowerCase();
    const record = deletedUsers.find(
      (d) => d.id.toLowerCase() === cleanTarget || d.uid?.toLowerCase() === cleanTarget || d.email.toLowerCase() === cleanTarget
    );
    if (!record) {
      addToast('error', 'Not Found', 'No deletion registry entry matches this account.');
      return false;
    }
    const wasSuper = record.role === 'Super Admin' || record.adminRole === 'Super Admin';
    if (!canManageAdminRole(undefined, wasSuper ? 'Super Admin' : undefined)) {
      denyAdminManagement(wasSuper ? 'Super Admin' : undefined);
      return false;
    }
    const docId = record.docId || (record.email || record.uid || record.id).replace(/[/\\?%*:|"<>]/g, '_').toLowerCase();
    if (!(await safeDeleteDoc(doc(db, 'deletedUsers', docId)))) return false;
    setDeletedUsers((prev) => {
      const next = prev.filter((d) => d !== record && d.email.toLowerCase() !== record.email.toLowerCase());
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pcm_deleted_users', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    const adminActor = currentAdminUser?.name || currentUserAccount?.name || 'Administrator';
    logActivity('DELETE', 'Deletion Registry', record.id, record.name, `Removed ${record.email} from the deletion registry (not restored) by ${adminActor}.`);
    addToast('info', 'Registry Entry Removed', `${record.name} (${record.email}) is no longer blocked. Their old account was not restored.`);
    return true;
  };

  const updateUserAccountRole = async (userId: string, role: UserRole, adminRole?: AdminRole) => {
    const targetUser = userAccounts.find((u) => u.id === userId || u.uid === userId);
    const grantsSuper = role === 'Super Admin' || adminRole === 'Super Admin';
    const hadSuper = targetUser?.role === 'Super Admin' || targetUser?.adminRole === 'Super Admin';
    if (!canManageAdminRole(grantsSuper ? 'Super Admin' : role, hadSuper ? 'Super Admin' : undefined)) {
      denyAdminManagement(grantsSuper || hadSuper ? 'Super Admin' : role);
      return;
    }
    if (targetUser?.email?.toLowerCase() === 'angeloperfecto.epc@gmail.com') {
      addToast({
        title: 'Action Protected',
        message: 'The primary Super Administrator role cannot be modified or demoted.',
        type: 'error',
      });
      return;
    }
    try {
      const updates: Partial<UserAccount> = {
        role,
        adminRole: ['Admin', 'Super Admin', 'Staff/Editor'].includes(role) ? (adminRole || 'Admin') : undefined,
      };

      setUserAccounts((prev) =>
        prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u))
      );

      if (currentUserAccount?.uid === userId || currentUserAccount?.id === userId) {
        setCurrentUserAccount((prev) => (prev ? { ...prev, ...updates } : null));
        if (role === 'Admin' || role === 'Super Admin' || role === 'Staff/Editor') {
          setIsAdminLoggedIn(true);
        } else if (role === 'Student' || role === 'Student/User') {
          setIsStudentLoggedIn(true);
          setIsAdminLoggedIn(false);
        }
      }

      if (['Admin', 'Super Admin', 'Staff/Editor'].includes(role) && targetUser) {
        const adminRecord: AdminUser = {
          id: targetUser.id || targetUser.uid || `adm-${Date.now()}`,
          name: targetUser.name,
          email: targetUser.email,
          username: targetUser.email.split('@')[0] || 'admin',
          role: adminRole || 'Admin',
          department: targetUser.department || 'Administration & Executive Leadership',
          status: 'Active',
          createdAt: targetUser.createdAt || new Date().toISOString().split('T')[0],
          lastLogin: targetUser.lastLogin || 'Never',
          avatarUrl: targetUser.avatarUrl || targetUser.photoURL || '',
        };
        setAdminUsers((prev) => [adminRecord, ...prev.filter((a) => a.id !== userId && a.email.toLowerCase() !== targetUser.email.toLowerCase())]);
        safeSetDoc(doc(db, 'adminUsers', adminRecord.id), cleanFirestoreData(adminRecord)).catch(console.warn);
      }

      try {
        await safeUpdateDoc(doc(db, 'users', userId), updates);
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

  // Super Admin and Admin Verification and User Management Actions
  const approveUserAccess = async (userId: string, assignedAdminRole: AdminRole = 'Admin'): Promise<boolean> => {
    if (!canPerformAction('Admin')) {
      addToast({ type: 'error', title: 'Admin Privileges Required', message: 'Only the Super Admin and authorized Admin Users can approve administrative user access.' });
      return false;
    }
    if (assignedAdminRole === 'Super Admin' && !isSuperAdminSession()) {
      denyAdminManagement('Super Admin');
      return false;
    }

    const target = userAccounts.find((u) => u.id === userId || u.uid === userId);
    if (!target) {
      addToast({ type: 'error', title: 'User Not Found', message: 'Could not find the target user account.' });
      return false;
    }

    const approverAttribution = currentAdminUser?.name
      ? `${currentAdminUser.name} (${currentAdminUser.role})`
      : currentAdminUser?.email || 'Authorized Administrator';

    const updates: Partial<UserAccount> = {
      role: 'Admin',
      adminRole: assignedAdminRole,
      status: 'Active',
      verificationStatus: 'Approved',
      approvedBy: approverAttribution,
      approvedAt: new Date().toISOString(),
    };

    setUserAccounts((prev) => prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u)));

    try {
      await safeUpdateDoc(doc(db, 'users', userId), updates);
    } catch (e) {
      console.warn('Firestore update notice:', e);
    }

    const adminRecord: AdminUser = {
      id: userId,
      name: target.name,
      email: target.email,
      username: target.email.split('@')[0] || 'admin',
      role: assignedAdminRole,
      department: target.department || 'Administration & Executive Leadership',
      status: 'Active',
      createdAt: target.createdAt || new Date().toISOString().split('T')[0],
      lastLogin: target.lastLogin || 'Never',
      avatarUrl: target.avatarUrl || target.photoURL || '',
    };
    setAdminUsers((prev) => [adminRecord, ...prev.filter((a) => a.id !== userId && a.email.toLowerCase() !== target.email.toLowerCase())]);
    safeSetDoc(doc(db, 'adminUsers', userId), cleanFirestoreData(adminRecord)).catch(console.warn);

    logActivity('APPROVAL', 'User Verification', userId, target.name, `Approved admin access (${assignedAdminRole}) for ${target.email} by ${approverAttribution}.`);
    addToast({
      type: 'success',
      title: 'User Approved & Verified',
      message: `${target.name} (${target.email}) has been granted ${assignedAdminRole} privileges.`,
    });
    return true;
  };

  const rejectUserAccess = async (userId: string, reason: string = 'Access denied by Administrator'): Promise<boolean> => {
    if (!canPerformAction('Admin')) {
      addToast({ type: 'error', title: 'Admin Privileges Required', message: 'Only the Super Admin and authorized Admin Users can reject access requests.' });
      return false;
    }

    const target = userAccounts.find((u) => u.id === userId || u.uid === userId);
    if (target?.email?.toLowerCase() === 'angeloperfecto.epc@gmail.com' || target?.email?.toLowerCase() === 'president@pcm.edu.ph') {
      addToast({ type: 'error', title: 'Protected Account', message: 'The primary Super Administrator accounts cannot be rejected.' });
      return false;
    }
    if ((target?.role === 'Super Admin' || target?.adminRole === 'Super Admin') && !isSuperAdminSession()) {
      denyAdminManagement('Super Admin');
      return false;
    }

    const updates: Partial<UserAccount> = {
      status: 'Rejected',
      verificationStatus: 'Rejected',
      rejectionReason: reason,
    };

    setUserAccounts((prev) => prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u)));
    try {
      await safeUpdateDoc(doc(db, 'users', userId), updates);
    } catch (e) {
      console.warn('Firestore update notice:', e);
    }

    setAdminUsers((prev) => prev.filter((a) => a.id !== userId && a.email.toLowerCase() !== target?.email.toLowerCase()));
    safeDeleteDoc(doc(db, 'adminUsers', userId)).catch(console.warn);

    logActivity('REJECTION', 'User Verification', userId, target?.name || userId, `Rejected admin access request for ${target?.email}.`);
    addToast({
      type: 'info',
      title: 'Request Rejected',
      message: `Admin access request for ${target?.name || 'user'} has been rejected.`,
    });
    return true;
  };

  const activateUser = async (userId: string): Promise<boolean> => {
    if (!canPerformAction('Super Admin')) {
      addToast({ type: 'error', title: 'Super Admin Required', message: 'Only the Super Admin can activate accounts.' });
      return false;
    }

    const target = userAccounts.find((u) => u.id === userId || u.uid === userId);
    const updates: Partial<UserAccount> = {
      status: 'Active',
      verificationStatus: 'Approved',
    };

    setUserAccounts((prev) => prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u)));
    try {
      await safeUpdateDoc(doc(db, 'users', userId), updates);
    } catch (e) {
      console.warn('Firestore update notice:', e);
    }

    if (target) {
      setAdminUsers((prev) => prev.map((a) => (a.id === userId || a.email.toLowerCase() === target.email.toLowerCase() ? { ...a, status: 'Active' } : a)));
      safeUpdateDoc(doc(db, 'adminUsers', userId), { status: 'Active' }).catch(console.warn);
    }

    logActivity('UPDATE', 'User Account', userId, target?.name || userId, `Activated user account (${target?.email}).`);
    addToast({ type: 'success', title: 'Account Activated', message: `Account for ${target?.name || 'user'} is now active.` });
    return true;
  };

  const deactivateUser = async (userId: string): Promise<boolean> => {
    if (!canPerformAction('Super Admin')) {
      addToast({ type: 'error', title: 'Super Admin Required', message: 'Only the Super Admin can deactivate accounts.' });
      return false;
    }

    const target = userAccounts.find((u) => u.id === userId || u.uid === userId);
    if (target?.email?.toLowerCase() === 'angeloperfecto.epc@gmail.com') {
      addToast({ type: 'error', title: 'Protected Account', message: 'The primary Super Administrator account cannot be deactivated.' });
      return false;
    }

    const updates: Partial<UserAccount> = {
      status: 'Disabled',
    };

    setUserAccounts((prev) => prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u)));
    try {
      await safeUpdateDoc(doc(db, 'users', userId), updates);
    } catch (e) {
      console.warn('Firestore update notice:', e);
    }

    if (target) {
      setAdminUsers((prev) => prev.map((a) => (a.id === userId || a.email.toLowerCase() === target.email.toLowerCase() ? { ...a, status: 'Inactive' } : a)));
      safeUpdateDoc(doc(db, 'adminUsers', userId), { status: 'Inactive' }).catch(console.warn);
    }

    logActivity('UPDATE', 'User Account', userId, target?.name || userId, `Deactivated user account (${target?.email}).`);
    addToast({ type: 'info', title: 'Account Deactivated', message: `Account for ${target?.name || 'user'} has been disabled.` });
    return true;
  };

  const changeUserRole = async (userId: string, newRole: UserRole, newAdminRole?: AdminRole): Promise<boolean> => {
    if (!canPerformAction('Super Admin')) {
      addToast({ type: 'error', title: 'Super Admin Required', message: 'Only the Super Admin can change user roles.' });
      return false;
    }

    const target = userAccounts.find((u) => u.id === userId || u.uid === userId);
    if (target?.email?.toLowerCase() === 'angeloperfecto.epc@gmail.com') {
      addToast({ type: 'error', title: 'Protected Account', message: 'The primary Super Administrator role cannot be changed or demoted.' });
      return false;
    }

    const updates: Partial<UserAccount> = {
      role: newRole,
      adminRole: ['Admin', 'Super Admin', 'Staff/Editor'].includes(newRole) ? (newAdminRole || 'Admin') : undefined,
    };

    setUserAccounts((prev) => prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u)));
    try {
      await safeUpdateDoc(doc(db, 'users', userId), updates);
    } catch (e) {
      console.warn('Firestore update notice:', e);
    }

    if (['Admin', 'Super Admin', 'Staff/Editor'].includes(newRole) && target) {
      const adminRecord: AdminUser = {
        id: userId,
        name: target.name,
        email: target.email,
        username: target.email.split('@')[0] || 'admin',
        role: newAdminRole || 'Admin',
        department: target.department || 'Administration & Management',
        status: target.status === 'Active' ? 'Active' : 'Inactive',
        createdAt: target.createdAt || new Date().toISOString().split('T')[0],
        lastLogin: target.lastLogin || 'Never',
        avatarUrl: target.avatarUrl || target.photoURL || '',
      };
      setAdminUsers((prev) => [adminRecord, ...prev.filter((a) => a.id !== userId && a.email.toLowerCase() !== target.email.toLowerCase())]);
      safeSetDoc(doc(db, 'adminUsers', userId), cleanFirestoreData(adminRecord)).catch(console.warn);
    } else if (target) {
      // Demoted from admin
      setAdminUsers((prev) => prev.filter((a) => a.id !== userId && a.email.toLowerCase() !== target.email.toLowerCase()));
      safeDeleteDoc(doc(db, 'adminUsers', userId)).catch(console.warn);
    }

    logActivity('UPDATE', 'User Role', userId, target?.name || userId, `Updated role to ${newRole} (${newAdminRole || 'N/A'}).`);
    addToast({ type: 'success', title: 'Role Updated', message: `Updated ${target?.name || 'user'} to ${newRole}.` });
    return true;
  };

  const revokeAdminAccess = async (userId: string): Promise<boolean> => {
    return changeUserRole(userId, 'Student/User');
  };

  const updateUserPermissions = async (userId: string, permissions: string[]): Promise<boolean> => {
    if (!canPerformAction('Super Admin')) {
      addToast({ type: 'error', title: 'Super Admin Required', message: 'Only the Super Admin can update permissions.' });
      return false;
    }
    const updates = { customPermissions: permissions };
    setUserAccounts((prev) => prev.map((u) => (u.id === userId || u.uid === userId ? { ...u, ...updates } : u)));
    safeUpdateDoc(doc(db, 'users', userId), updates).catch(console.warn);
    addToast({ type: 'success', title: 'Permissions Updated', message: 'User permissions saved.' });
    return true;
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
      videos,
      homepageVideoConfig,
    };
    return JSON.stringify(fullDb, null, 2);
  };

  // Import and reset overwrite live Firestore data, so only a signed-in Super Admin may run them.
  const isSuperAdminSession = () => isAdminLoggedIn && currentAdminUser?.role === 'Super Admin';

  const importDatabaseJson = async (jsonString: string): Promise<boolean> => {
    if (!isSuperAdminSession()) {
      addToast('error', 'Permission Denied', 'Only a Super Admin can restore a database backup.');
      return false;
    }
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
      if (data.studentLifeAlbums && Array.isArray(data.studentLifeAlbums)) setStudentLifeAlbums(data.studentLifeAlbums);
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
        studentLifeAlbums: data.studentLifeAlbums || stateRef.current.studentLifeAlbums,
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
    if (!isSuperAdminSession()) {
      addToast('error', 'Permission Denied', 'Only a Super Admin can reset the database.');
      return;
    }
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
    setStudentLifeAlbums(INITIAL_STUDENT_LIFE_ALBUMS);
    // Applications, students and admin accounts are real records: Reset never replaces them.
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
      studentLifeAlbums: INITIAL_STUDENT_LIFE_ALBUMS,
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

    setDonations((prev) => {
      const next = [newDonation, ...prev];
      setCachedData('donations', next);
      return next;
    });

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
    const safeInstructions = normalizeInstructions(method.instructions);
    const newMethod: DonationPaymentMethod = cleanFirestoreData({
      ...method,
      instructions: safeInstructions,
      id: `pay-${Date.now()}`,
      order: method.order || donationMethods.length + 1,
      active: method.active !== undefined ? method.active : true,
    });

    setDonationMethods((prev) => {
      const next = [...prev, newMethod];
      setCachedData('donationMethods', next);
      return next;
    });

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
    const safeUpdates = { ...updates };
    if (safeUpdates.instructions !== undefined) {
      safeUpdates.instructions = normalizeInstructions(safeUpdates.instructions);
    }
    const sanitized = cleanFirestoreData(safeUpdates);
    setDonationMethods((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...safeUpdates } : m));
      setCachedData('donationMethods', next);
      return next;
    });

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
    setDonationMethods((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setCachedData('donationMethods', next);
      return next;
    });

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
    setDonations((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      setCachedData('donations', next);
      return next;
    });

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
    setDonations((prev) => {
      const next = prev.filter((d) => d.id !== id);
      setCachedData('donations', next);
      return next;
    });

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
    setCachedData('donationSettings', updated);

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

  // YouTube Video Management Handlers
  const addYouTubeVideo = async (
    videoData: Omit<YouTubeVideo, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<YouTubeVideo> => {
    const id = generateVideoId();
    const now = getCurrentTimestamp();
    const vidId = videoData.youtubeVideoId || extractYouTubeVideoId(videoData.youtubeUrl) || '';
    const newVideo: YouTubeVideo = cleanFirestoreData({
      ...videoData,
      id,
      youtubeVideoId: vidId,
      thumbnailUrl:
        videoData.thumbnailUrl || getYouTubeThumbnailUrl(vidId, 'hq'),
      displayOrder: videoData.displayOrder ?? videos.length + 1,
      isFeatured: !!videoData.isFeatured,
      isPublished: videoData.isPublished !== undefined ? videoData.isPublished : true,
      showOnHome: videoData.showOnHome !== undefined ? videoData.showOnHome : true,
      createdAt: now,
      updatedAt: now,
    });

    if (newVideo.isFeatured) {
      setVideos((prev) => {
        const next = [newVideo, ...prev.map((v) => ({ ...v, isFeatured: false }))];
        setCachedData('videos', next);
        return next;
      });
      updateHomepageVideoConfig({ featuredVideoId: id });
    } else {
      setVideos((prev) => {
        const next = [...prev, newVideo];
        setCachedData('videos', next);
        return next;
      });
    }

    await safeSetDoc(doc(db, 'videos', id), newVideo, { merge: true });
    logActivity('CREATE', 'YouTube Video', id, newVideo.title, `Added YouTube video "${newVideo.title}" (${newVideo.youtubeVideoId}).`);
    addToast('success', 'Video Added', `"${newVideo.title}" saved and synced to database.`);
    return newVideo;
  };

  const updateYouTubeVideo = async (
    id: string,
    updates: Partial<YouTubeVideo>
  ): Promise<boolean> => {
    const now = getCurrentTimestamp();
    const sanitizedUpdates: Partial<YouTubeVideo> = cleanFirestoreData({
      ...updates,
      updatedAt: now,
    });

    if (sanitizedUpdates.youtubeUrl && !sanitizedUpdates.youtubeVideoId) {
      const extracted = extractYouTubeVideoId(sanitizedUpdates.youtubeUrl);
      if (extracted) {
        sanitizedUpdates.youtubeVideoId = extracted;
        if (!sanitizedUpdates.thumbnailUrl) {
          sanitizedUpdates.thumbnailUrl = getYouTubeThumbnailUrl(extracted, 'hq');
        }
      }
    }

    setVideos((prev) => {
      const next = prev.map((v) => {
        if (v.id === id) {
          return { ...v, ...sanitizedUpdates };
        }
        if (sanitizedUpdates.isFeatured) {
          return { ...v, isFeatured: false };
        }
        return v;
      });
      setCachedData('videos', next);
      return next;
    });

    if (sanitizedUpdates.isFeatured) {
      updateHomepageVideoConfig({ featuredVideoId: id });
    }

    const success = await safeSetDoc(doc(db, 'videos', id), sanitizedUpdates, { merge: true });
    logActivity('UPDATE', 'YouTube Video', id, updates.title || 'Video', `Updated YouTube video details.`);
    addToast('success', 'Video Updated', 'YouTube video details updated successfully.');
    return success;
  };

  const deleteYouTubeVideo = async (id: string): Promise<boolean> => {
    const target = videos.find((v) => v.id === id);
    setVideos((prev) => {
      const next = prev.filter((v) => v.id !== id);
      setCachedData('videos', next);
      return next;
    });

    if (homepageVideoConfig.featuredVideoId === id) {
      const remaining = videos.filter((v) => v.id !== id);
      if (remaining.length > 0) {
        updateHomepageVideoConfig({ featuredVideoId: remaining[0].id });
      } else {
        updateHomepageVideoConfig({ featuredVideoId: '' });
      }
    }

    const success = await safeDeleteDoc(doc(db, 'videos', id));
    logActivity('DELETE', 'YouTube Video', id, target?.title || 'Video', `Deleted YouTube video from database.`);
    addToast('info', 'Video Deleted', 'YouTube video deleted from database.');
    return success;
  };

  const togglePublishYouTubeVideo = async (id: string): Promise<boolean> => {
    const video = videos.find((v) => v.id === id);
    if (!video) return false;
    const newStatus = !video.isPublished;
    return updateYouTubeVideo(id, { isPublished: newStatus });
  };

  const setFeaturedYouTubeVideo = async (id: string): Promise<boolean> => {
    const now = getCurrentTimestamp();
    setVideos((prev) => {
      const next = prev.map((v) => ({
        ...v,
        isFeatured: v.id === id,
        updatedAt: v.id === id ? now : v.updatedAt,
      }));
      setCachedData('videos', next);
      return next;
    });

    try {
      const batch = writeBatch(db);
      videos.forEach((v) => {
        const ref = doc(db, 'videos', v.id);
        batch.set(ref, { isFeatured: v.id === id, updatedAt: now }, { merge: true });
      });
      await batch.commit();
    } catch {
      await safeSetDoc(doc(db, 'videos', id), { isFeatured: true, updatedAt: now }, { merge: true });
    }

    await updateHomepageVideoConfig({ featuredVideoId: id });
    const match = videos.find((v) => v.id === id);
    logActivity('UPDATE', 'YouTube Video', id, match?.title || 'Video', `Set as Homepage Featured Video.`);
    addToast('success', 'Featured Video Set', `"${match?.title || 'Video'}" is now the HOME featured video.`);
    return true;
  };

  const reorderYouTubeVideos = async (orderedIds: string[]): Promise<boolean> => {
    const now = getCurrentTimestamp();
    setVideos((prev) => {
      const map = new Map(prev.map((v) => [v.id, v]));
      const reordered: YouTubeVideo[] = [];
      orderedIds.forEach((id, index) => {
        const item = map.get(id);
        if (item) {
          reordered.push({ ...item, displayOrder: index + 1, updatedAt: now });
          map.delete(id);
        }
      });
      map.forEach((item) => {
        reordered.push({ ...item, displayOrder: reordered.length + 1 });
      });
      setCachedData('videos', reordered);
      return reordered;
    });

    try {
      const batch = writeBatch(db);
      orderedIds.forEach((id, index) => {
        const docRef = doc(db, 'videos', id);
        batch.set(docRef, { displayOrder: index + 1, updatedAt: now }, { merge: true });
      });
      await batch.commit();
    } catch {
      for (let i = 0; i < orderedIds.length; i++) {
        await safeSetDoc(doc(db, 'videos', orderedIds[i]), { displayOrder: i + 1, updatedAt: now }, { merge: true });
      }
    }
    addToast('success', 'Sequence Saved', 'Video sequence updated and saved.');
    return true;
  };

  const updateHomepageVideoConfig = async (
    updates: Partial<HomepageVideoConfig>
  ): Promise<boolean> => {
    const now = getCurrentTimestamp();
    const newConfig: HomepageVideoConfig = cleanFirestoreData({
      ...homepageVideoConfig,
      ...updates,
      updatedAt: now,
    });
    setHomepageVideoConfig(newConfig);
    setCachedData('homepageVideoConfig', newConfig);
    const success = await safeSetDoc(doc(db, 'homepageVideoConfig', 'global'), newConfig, { merge: true });
    logActivity('UPDATE', 'HomepageVideoConfig', 'global', 'Homepage Video Settings', 'Updated homepage video settings & display options.');
    return success;
  };

  const syncVideosToFirebase = async (customVideos?: YouTubeVideo[]): Promise<boolean> => {
    const listToSync = customVideos || videos;
    try {
      const batch = writeBatch(db);
      listToSync.forEach((v) => {
        const ref = doc(db, 'videos', v.id);
        batch.set(ref, cleanFirestoreData(v), { merge: true });
      });
      const configRef = doc(db, 'homepageVideoConfig', 'global');
      batch.set(configRef, cleanFirestoreData(homepageVideoConfig), { merge: true });
      await batch.commit();
      addToast('success', 'Firebase Synchronized', `Saved ${listToSync.length} videos and settings to Firestore.`);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'videos');
      for (const v of listToSync) {
        await safeSetDoc(doc(db, 'videos', v.id), v, { merge: true });
      }
      await safeSetDoc(doc(db, 'homepageVideoConfig', 'global'), homepageVideoConfig, { merge: true });
      addToast('success', 'Firebase Synchronized', 'Videos synced successfully.');
      return true;
    }
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
        updateStudentLifeConfig,
        updateLifeAtPCMConfig,
        saveLifeAtPCMItem,
        deleteLifeAtPCMItem,
        reorderLifeAtPCMItems,
        resetLifeAtPCMToDefault,

        // Media Library & Albums
        mediaItems,
        mediaLibrary: mediaItems,
        setMediaItems,
        addMediaItem,
        updateMediaItem,
        deleteMediaItem,
        deleteMultipleMediaItems,
        replaceMediaFile,
        galleryAlbums,
        setGalleryAlbums,
        addGalleryAlbum,
        updateGalleryAlbum,
        deleteGalleryAlbum,

        // Student Life Albums (Facebook-inspired Multi-Image Gallery)
        studentLifeAlbums,
        setStudentLifeAlbums,
        createStudentLifeAlbum,
        updateStudentLifeAlbum,
        deleteStudentLifeAlbum,
        addPhotosToStudentLifeAlbum,
        updateStudentLifePhoto,
        deleteStudentLifePhoto,
        reorderStudentLifePhotos,
        setStudentLifeAlbumCover,
        toggleStudentLifeAlbumPublish,
        moveStudentLifePhoto,

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
        canDecideAdmissions,
        canManageEnrollment,
        curriculumSubjects,
        canManageCurriculum,
        saveCurriculumSubject,
        deleteCurriculumSubject,
        importProgramCurricula,
        canVerifyPayments,
        admissionsActor,
        addApplicationNote,
        deleteApplication,
        getApplicationByRef,
        fetchApplicationByRef,
        activeTrackerRef,
        setActiveTrackerRef,
        submitInquiry,

        // Google / Firebase User Accounts & Authentication
        currentUserAccount,
        setCurrentUserAccount,
        firebaseAuthUser,
        userAccounts,
        userAccountModalOpen,
        setUserAccountModalOpen,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        signOutUser,
        addUserAccount,
        deleteUserAccount,
        restoreUserAccount,
        removeDeletedUserRecord,
        isUserDeleted,
        deletedUsers,
        updateUserAccountRole,
        approveUserAccess,
        rejectUserAccess,
        activateUser,
        deactivateUser,
        changeUserRole,
        revokeAdminAccess,
        updateUserPermissions,
        linkStudentIdToUser,

        // Student Portal & Multi-Student Directory
        isStudentLoggedIn,
        setIsStudentLoggedIn,
        currentStudent: isStudentLoggedIn ? studentProfile : null,
        studentProfile,
        setStudentProfile,
        students,
        registryBlockedStudents,
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
        updateStudentAvatar,
        deleteStudentProfile,
        archiveStudentProfile,
        restoreStudentProfile,
        addStudentGrade,
        recordStudentPayment,
        updateStudentPaymentRecord,
        updateStudentRequirementStatus,
        addStudentSubjectHistory,
        updateStudentSubjectHistory,
        deleteStudentSubjectHistory,
        updateStudentEnrollmentStatus,

        // Enrollment Submenu Navigation
        enrollmentActiveSubTab,
        setEnrollmentActiveSubTab,

        // Academic Periods Management
        academicPeriods,
        setAcademicPeriods,
        currentAcademicPeriod,
        addAcademicPeriod,
        updateAcademicPeriod,
        setCurrentAcademicPeriod,
        deleteAcademicPeriod,

        // Class Sections Management
        classSections,
        setClassSections,
        addClassSection,
        updateClassSection,
        deleteClassSection,
        transferStudentSection,

        // Instructors Faculty Management
        instructors,
        setInstructors,
        addInstructor,
        updateInstructor,
        deleteInstructor,

        // Enrollment System Policy Config
        enrollmentSystemConfig,
        setEnrollmentSystemConfig,
        updateEnrollmentSystemConfig,

        // Academic Subjects Catalog & Sections
        academicSubjects,
        setAcademicSubjects,
        addAcademicSubject,
        updateAcademicSubject,
        deleteAcademicSubject,
        duplicateAcademicSubject,

        // Pre-Enlistment Module
        preEnlistments,
        setPreEnlistments,
        submitPreEnlistment,
        updatePreEnlistmentStatus,
        deletePreEnlistment,

        // Adding & Dropping Module
        addDropRequests,
        studentPayments,
        setAddDropRequests,
        submitAddDropRequest,
        reviewAddDropRequest,
        deleteAddDropRequest,

        // Assessment & Fee Structure Module
        feeStructure,
        setFeeStructure,
        updateFeeStructureItem,
        addFeeStructureItem,
        deleteFeeStructureItem,
        calculateStudentAssessment,

        // Extended Workflow & RBAC
        cancelEnrollment,
        reopenEnrollment,
        canPerformEnrollmentAction,

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
        updateAdminAvatar,
        updateUserAvatar,
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

        // YouTube Video Management & Homepage Video Control
        videos,
        setVideos,
        homepageVideoConfig,
        setHomepageVideoConfig,
        featuredVideo,
        addYouTubeVideo,
        updateYouTubeVideo,
        deleteYouTubeVideo,
        togglePublishYouTubeVideo,
        setFeaturedYouTubeVideo,
        reorderYouTubeVideos,
        updateHomepageVideoConfig,
        syncVideosToFirebase,

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
