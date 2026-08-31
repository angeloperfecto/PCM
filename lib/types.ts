export type NavSection =
  | 'home'
  | 'why-choose-pcm'
  | 'about'
  | 'academics'
  | 'admissions'
  | 'student-life'
  | 'ministry'
  | 'news-events'
  | 'resources'
  | 'scrapbook'
  | 'contact'
  | 'apply'
  | 'portal'
  | 'admin'
  | 'migration-report';

export type ContentStatus = 'Published' | 'Draft' | 'Scheduled' | 'Unpublished';

export type ProgramLevel = 'senior-high' | 'undergraduate' | 'graduate' | 'certificate' | 'diploma' | 'SHS' | 'Associate' | 'Undergraduate' | 'Graduate' | 'Certificate' | string;

export interface AcademicProgram {
  id: string;
  name: string;
  title?: string;
  code: string;
  level?: ProgramLevel;
  degreeLevel?: 'SHS' | 'Associate' | 'Undergraduate' | 'Graduate' | 'Certificate' | string;
  duration: string;
  credits?: number;
  totalUnits?: number;
  units?: number;
  studyMode?: 'On-Campus Full-Time' | 'Modular / Hybrid' | 'Evening & Weekend' | 'Online & Modular' | string;
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  objectives?: string[];
  curriculum?: {
    yearOrModule: string;
    courses: { code: string; title: string; units: number; description?: string }[];
  }[];
  careerOpportunities?: string[];
  careerOutcomes?: string[];
  admissionRequirements?: string[];
  admissionReqs?: string[];
  tuitionPerUnit?: number;
  tuitionEst?: string;
  featured?: boolean;
  status?: ContentStatus;
  order?: number;
}

export type Program = AcademicProgram;

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  category: 'Admissions' | 'Academic' | 'Chapel' | 'Conference' | 'General';
  linkUrl?: string;
  isUrgent?: boolean;
  active: boolean;
  status?: ContentStatus;
  order?: number;
}

export type Announcement = AnnouncementItem;

export interface NewsArticle {
  id: string;
  slug?: string;
  title: string;
  category: 'Academic' | 'Ministry' | 'Community' | 'Campus Life' | 'Spiritual Formation' | 'Admissions' | 'Spiritual' | string;
  date: string;
  author: string;
  readTime?: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  image?: string;
  featured?: boolean;
  published?: boolean;
  tags?: string[];
  status?: ContentStatus;
  order?: number;
}

export interface CollegeEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'Conference' | 'Chapel' | 'Seminar' | 'Orientation' | 'Retreat' | 'Graduation' | 'Academic' | 'Spiritual' | 'Community' | 'Outreach' | string;
  description: string;
  speaker?: string;
  featured?: boolean;
  registrationOpen?: boolean;
  registrationFee?: string;
  maxAttendees?: number;
  capacity?: number;
  registeredCount?: number;
  registeredAttendees?: Array<{ name: string; email: string; date: string }>;
  imageUrl?: string;
  image?: string;
  status?: ContentStatus;
  order?: number;
}

export type PCMEvent = CollegeEvent;

export interface FacultyMember {
  id: string;
  name: string;
  title?: string;
  group: 'Board of Trustees' | 'Administration' | 'Faculty' | 'Emeritus & Adjunct' | 'Key Administrators' | 'Resident Faculty' | 'Adjunct Faculty' | 'Administrative Staff' | string;
  role: string;
  department?: string;
  credentials?: string;
  degrees?: string[];
  subjectTaught?: string[];
  coursesTaught?: string[];
  bio: string;
  imageUrl?: string;
  image?: string;
  email?: string;
  phone?: string;
  featured?: boolean;
  status?: ContentStatus;
  order?: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  category: 'Student' | 'Alumni' | 'Faculty' | 'Ministry Leader';
  quote: string;
  programOrMinistry: string;
  batchOrYear?: string;
  avatarUrl?: string;
  status?: ContentStatus;
  order?: number;
}

export interface ImpactStat {
  id: string;
  value: string;
  label: string;
  description: string;
  iconName: string;
  order?: number;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Additional Documents Required'
  | 'Exam Scheduled'
  | 'Interviewed'
  | 'Accepted'
  | 'Waitlisted'
  | 'Rejected'
  | 'Enrolled';

export interface AdmissionApplication {
  id: string;
  referenceNumber: string;
  trackingNumber?: string;
  createdAt?: string;
  submissionDate?: string;
  updatedAt?: string;
  status: ApplicationStatus;
  programId?: string;
  programName?: string;
  program?: string;
  studyMode?: string;
  
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string;
  birthdate?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Prefer not to say' | string;
  civilStatus?: 'Single' | 'Married' | 'Widowed' | string;
  citizenship?: string;
  address?: string;
  city?: string;
  province?: string;
  
  // Faith & Ministry Background
  salvationYear?: string;
  yearsInFaith?: string;
  waterBaptized?: boolean;
  homeChurch?: string;
  churchName?: string;
  church?: string;
  churchAffiliation?: string;
  christianTestimony?: string;
  churchDenomination?: string;
  pastorName?: string;
  pastorContact?: string;
  currentMinistryInvolvement?: string;
  ministryExperience?: string;
  personalTestimony?: string;
  salvationTestimony?: string;
  callingStatement?: string;
  financialAidRequired?: boolean;
  
  // Academic Background
  highestEducation?: string;
  previousSchool?: string;
  previousCollege?: string;
  highSchool?: string;
  yearGraduated?: string;
  gpaOrHonors?: string;
  
  // Documents
  documents?: {
    idPhoto?: boolean;
    transcriptOfRecords?: boolean;
    pastoralRecommendation?: boolean;
    personalTestimonyDoc?: boolean;
    birthCertificate?: boolean;
  };
  
  // Internal Notes for Admissions Staff
  adminNotes?: string;
  internalNotes?: string[];
  notes?: string[];
  interviewerRemarks?: string;
}

export type Application = AdmissionApplication;

export interface StudentCourse {
  id: string;
  code: string;
  title: string;
  units: number;
  schedule: string;
  room: string;
  instructor: string;
  midtermGrade?: number | string;
  finalGrade?: number | string;
  status: 'In Progress' | 'Completed' | 'Enrolled';
}

export interface PracticumEntry {
  id: string;
  date: string;
  ministryType: 'Preaching / Teaching' | 'Youth Ministry' | 'Evangelism & Outreach' | 'Counseling & Visitation' | 'Worship & Media' | 'Church Administration';
  location: string;
  hours: number;
  description: string;
  supervisorName: string;
  status: 'Pending Review' | 'Pending Verification' | 'Approved' | 'Rejected' | string;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  fullName: string;
  name?: string;
  email: string;
  program: string;
  yearLevel: string;
  currentSemester: string;
  academicYear: string;
  gpa: number;
  totalUnitsEarned: number;
  mentorName: string;
  homeChurch: string;
  avatarUrl: string;
  tuitionTotal: number;
  tuitionPaid: number;
  tuitionBalance?: number;
  courses: StudentCourse[];
  practicumEntries: PracticumEntry[];
}

export type AdminRole = 'Super Admin' | 'Content Admin' | 'Editor';

export type UserRole = 'Admin' | 'Student' | 'Member';

export interface UserAccount {
  id: string; // Firebase UID
  uid: string;
  email: string;
  name: string;
  displayName: string;
  photoURL?: string;
  avatarUrl?: string;
  role: UserRole;
  adminRole?: AdminRole;
  studentId?: string;
  department?: string;
  homeChurch?: string;
  status: 'Active' | 'Pending' | 'Inactive' | string;
  provider: string; // 'google.com' | 'password'
  emailVerified?: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: AdminRole;
  avatarUrl?: string;
  department?: string;
  status?: 'Active' | 'Inactive' | string;
  createdAt: string;
  lastLogin?: string;
}

export interface DownloadableResource {
  id: string;
  title: string;
  category: 'Prospectus' | 'Application Form' | 'Academic Calendar' | 'Student Handbook' | 'Journal' | 'Practicum Manual' | 'Official Forms' | 'Admissions' | 'Academic' | 'Theology' | 'Institutional' | 'Forms' | string;
  fileSize: string;
  format?: 'PDF' | 'DOCX' | 'ZIP' | string;
  fileType?: string;
  downloadCount?: number;
  downloadsCount?: number;
  description: string;
  fileUrl?: string;
  url?: string;
  year?: string;
  status?: ContentStatus;
  order?: number;
}

export type DownloadResource = DownloadableResource;

export interface SermonLecture {
  id: string;
  title: string;
  speaker: string;
  series: string;
  date: string;
  duration: string;
  passage: string;
  audioUrl?: string;
  videoUrl?: string;
  category: 'Chapel Service' | 'Theology Lecture' | 'Spiritual Retreat' | 'Commencement';
  description: string;
  status?: ContentStatus;
}

export interface FAQItem {
  id: string;
  category: 'Admissions' | 'Academics' | 'Student Life' | 'Financial & Scholarships' | 'Spiritual Formation';
  question: string;
  answer: string;
  order?: number;
}

export interface ScrapbookItem {
  id: string;
  title: string;
  category: 'Campus Life & Lamtang' | 'Chapel & Worship' | 'Missions & Outreach' | 'Graduation & Convocation' | 'Retreats & Fellowship' | 'Heritage & Pioneers';
  imageUrl: string;
  date: string;
  year: string;
  location: string;
  caption: string;
  tags: string[];
  status?: ContentStatus;
  order?: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  date?: string;
  category?: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  coverImage: string;
  photos: GalleryPhoto[];
  status: ContentStatus;
  order: number;
}

export interface MediaItem {
  id: string;
  title: string;
  altText: string;
  url: string;
  category: 'Banner' | 'Faculty' | 'Campus' | 'Events' | 'Documents' | 'Logos' | 'General' | 'Chapel' | 'Archive' | string;
  fileSize: string;
  dimensions?: string;
  uploadDate?: string;
  usedInLocations?: string[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  adminName?: string;
  userName?: string;
  adminRole?: AdminRole | string;
  userRole?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' | 'RESTORE' | 'SETTINGS' | string;
  entityType?: string;
  entity?: string;
  entityId?: string;
  entityName?: string;
  description?: string;
  details?: string;
}

export interface HeroSlide {
  id: string;
  image: string;
  tag: string;
  headline: string;
  subtext: string;
  primaryCtaText?: string;
  primaryBtnText?: string;
  primaryCtaLink?: NavSection | string;
  primaryBtnLink?: string;
  secondaryCtaText?: string;
  secondaryBtnText?: string;
  secondaryCtaLink?: string;
  secondaryBtnLink?: string;
  active: boolean;
  order?: number;
}

export interface NavMenuItem {
  id: string;
  label: string;
  section: NavSection;
  isExternal?: boolean;
  externalUrl?: string;
  isVisible: boolean;
  order: number;
  dropdown?: {
    id: string;
    label: string;
    subSection?: string;
    actionType?: 'navigate' | 'modal';
    modalTarget?: 'statementOfFaith' | 'requestInfo' | 'tuitionCalculator';
    order: number;
    isVisible: boolean;
  }[];
}

export interface SiteConfig {
  siteIdentity: {
    institutionName: string;
    name?: string;
    acronym: string;
    motto: string;
    tagline: string;
    establishedYear: string;
    foundedYear?: number | string;
    affiliation: string;
    logoUrl?: string;
  };
  seoSettings: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    canonicalUrl: string;
  };
  contactInfo: {
    addressLine1: string;
    addressLine2: string;
    address?: string;
    poBox: string;
    phonePrimary: string;
    phoneSecondary: string;
    phone?: string;
    emailGeneral: string;
    emailAdmissions: string;
    admissionsEmail?: string;
    emailPresident: string;
    email?: string;
    officeHoursWeekday: string;
    officeHoursWeekend: string;
    officeHours?: string;
    googleMapsEmbedUrl: string;
    googleMapsDirectionsUrl: string;
    facebookUrl: string;
    youtubeUrl: string;
    instagramUrl: string;
    contactFormRecipientEmail: string;
  };
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
  heroSlides: HeroSlide[];
  homeAbout: {
    badgeText: string;
    headline: string;
    leadParagraph: string;
    bodyParagraph: string;
    historyExcerpt: string;
    presidentQuote: string;
    presidentName: string;
    presidentTitle: string;
    presidentImage: string;
  };
  missionVisionValues: {
    missionTitle: string;
    missionStatement: string;
    mission?: string;
    visionTitle: string;
    visionStatement: string;
    vision?: string;
    valuesTitle: string;
    valuesSubtitle: string;
    coreValues: {
      id: string;
      title: string;
      description: string;
      scriptureReference: string;
      iconName: string;
    }[];
  };
  ctaSections: {
    homeCtaTitle: string;
    homeCtaSubtitle: string;
    homeCtaPrimaryButtonText: string;
    homeCtaPrimaryButtonLink: NavSection;
    homeCtaSecondaryButtonText: string;
    homeCtaSecondaryButtonLink: NavSection;
    homeCtaTag: string;
    giveCtaTitle: string;
    giveCtaSubtitle: string;
    giveCtaButtonText: string;
  };
  admissionsConfig: {
    academicYear: string;
    semester: string;
    statusBadge: string;
    tuitionPerUnit: number;
    estimatedSemestralTuition: string;
    downpaymentRequired: string;
    scholarshipSummary: string;
    applicationFee: string;
    entranceExamSchedule: string;
    orientationDate: string;
    classesStartDate: string;
    steps: {
      stepNumber: number;
      title: string;
      description: string;
      duration: string;
    }[];
  };
  navigationMenu: NavMenuItem[];
  footerConfig: {
    campusDescription: string;
    aboutText?: string;
    accreditationText: string;
    copyrightText: string;
    quickLinksTitle: string;
    academicLinksTitle: string;
    resourcesLinksTitle: string;
  };
}

export interface MigrationAuditItem {
  id: string;
  sourceUrl: string;
  targetPage: string;
  pageTitle: string;
  status: 'MIGRATED' | 'PARTIALLY MIGRATED' | 'REQUIRES REVIEW' | 'FAILED';
  imagesCount: number;
  documentsCount: number;
  linksCount: number;
  notes: string;
  lastChecked: string;
}

