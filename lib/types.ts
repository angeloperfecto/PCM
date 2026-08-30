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

export type ProgramLevel = 'senior-high' | 'undergraduate' | 'graduate' | 'certificate' | 'diploma';

export interface AcademicProgram {
  id: string;
  name: string;
  code: string;
  level: ProgramLevel;
  duration: string;
  credits: number;
  studyMode: 'On-Campus Full-Time' | 'Modular / Hybrid' | 'Evening & Weekend' | 'Online & Modular';
  shortDescription: string;
  fullDescription: string;
  objectives: string[];
  curriculum: {
    yearOrModule: string;
    courses: { code: string; title: string; units: number; description?: string }[];
  }[];
  careerOpportunities: string[];
  admissionRequirements: string[];
  tuitionPerUnit: number;
  featured?: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  category: 'Admissions' | 'Academic' | 'Chapel' | 'Conference' | 'General';
  linkUrl?: string;
  isUrgent?: boolean;
  active: boolean;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  category: 'Academic' | 'Ministry' | 'Community' | 'Campus Life' | 'Spiritual Formation';
  date: string;
  author: string;
  readTime: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  featured?: boolean;
  tags: string[];
}

export interface CollegeEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'Conference' | 'Chapel' | 'Seminar' | 'Orientation' | 'Retreat' | 'Graduation';
  description: string;
  speaker?: string;
  featured?: boolean;
  registrationOpen: boolean;
  registrationFee?: string;
  maxAttendees?: number;
  registeredCount: number;
}

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  group: 'Board of Trustees' | 'Administration' | 'Faculty' | 'Emeritus & Adjunct';
  role: string;
  credentials: string;
  degrees: string[];
  subjectTaught?: string[];
  coursesTaught: string[];
  bio: string;
  imageUrl: string;
  email: string;
  featured?: boolean;
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
}

export interface ImpactStat {
  id: string;
  value: string;
  label: string;
  description: string;
  iconName: string;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Additional Documents Required'
  | 'Accepted'
  | 'Rejected'
  | 'Enrolled';

export interface AdmissionApplication {
  id: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  programId: string;
  programName: string;
  studyMode: string;
  
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'Male' | 'Female';
  civilStatus: 'Single' | 'Married' | 'Widowed';
  citizenship: string;
  address: string;
  city: string;
  province: string;
  
  // Faith & Ministry Background
  salvationYear: string;
  waterBaptized: boolean;
  homeChurch: string;
  churchDenomination: string;
  pastorName: string;
  pastorContact: string;
  currentMinistryInvolvement: string;
  personalTestimony: string;
  callingStatement: string;
  
  // Academic Background
  highestEducation: string;
  previousSchool: string;
  yearGraduated: string;
  gpaOrHonors?: string;
  
  // Documents
  documents: {
    idPhoto: boolean;
    transcriptOfRecords: boolean;
    pastoralRecommendation: boolean;
    personalTestimonyDoc: boolean;
    birthCertificate: boolean;
  };
  
  // Internal Notes for Admissions Staff
  internalNotes?: string[];
  interviewerRemarks?: string;
}

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
  status: 'Pending Review' | 'Approved';
}

export interface StudentProfile {
  id: string;
  studentId: string;
  fullName: string;
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
  courses: StudentCourse[];
  practicumEntries: PracticumEntry[];
}

export type AdminRole = 'Super Admin' | 'Content Manager' | 'Admissions Staff' | 'Academic Staff';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl: string;
  department: string;
}

export interface DownloadableResource {
  id: string;
  title: string;
  category: 'Prospectus' | 'Application Form' | 'Academic Calendar' | 'Student Handbook' | 'Journal' | 'Practicum Manual';
  fileSize: string;
  format: 'PDF' | 'DOCX' | 'ZIP';
  downloadCount: number;
  description: string;
}

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
}

export interface FAQItem {
  id: string;
  category: 'Admissions' | 'Academics' | 'Student Life' | 'Financial & Scholarships' | 'Spiritual Formation';
  question: string;
  answer: string;
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

