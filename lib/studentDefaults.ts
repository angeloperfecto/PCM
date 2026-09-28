import { StudentProfile, StudentRequirementItem, StudentSubjectHistory, StudentPaymentRecord } from './types';

export const DEFAULT_REQUIREMENTS_LIST: Omit<StudentRequirementItem, 'id' | 'status'>[] = [
  {
    name: 'PSA Birth Certificate',
    description: 'Original or certified true copy of Philippine Statistics Authority (PSA) Birth Certificate.',
    required: true,
  },
  {
    name: '2×2 / Passport Photo',
    description: 'Recent 2x2 ID photograph with white background, formal attire.',
    required: true,
  },
  {
    name: 'Transcript of Records / Form 138',
    description: 'Official Transcript of Records (TOR) from previous college or Form 138/SF9 from Senior High School.',
    required: true,
  },
  {
    name: 'Diploma / Certificate of Graduation',
    description: 'Photocopy of high school diploma or previous collegiate degree certificate.',
    required: true,
  },
  {
    name: 'Church Endorsement / Recommendation',
    description: 'Official endorsement letter signed by local church leadership or governing board.',
    required: true,
  },
  {
    name: 'Pastoral Recommendation Letter',
    description: 'Confidential recommendation letter from current Pastor/Church Elder detailing spiritual character and ministry calling.',
    required: true,
  },
  {
    name: 'Medical / Health Clearance Certificate',
    description: 'Physician physical examination certificate and chest X-ray result within the last 6 months.',
    required: false,
  },
  {
    name: 'Other Supporting Documents',
    description: 'Certificates of ministry training, baptismal certificate, or transfer credentials if applicable.',
    required: false,
  },
];

export function getDefaultStudentRequirements(): StudentRequirementItem[] {
  return DEFAULT_REQUIREMENTS_LIST.map((req, idx) => ({
    id: `req-${idx + 1}`,
    name: req.name,
    description: req.description,
    required: req.required,
    status: 'Pending',
  }));
}

export function calculateStudentAge(dateOfBirth: string): number | undefined {
  if (!dateOfBirth) return undefined;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : undefined;
}

export function generateStudentId(academicYear?: string): string {
  const year = academicYear ? academicYear.split('-')[0].trim() : new Date().getFullYear().toString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${year}-PCM-${randomSuffix}`;
}

export function generateApplicationNumber(academicYear?: string): string {
  const year = academicYear ? academicYear.split('-')[0].trim() : new Date().getFullYear().toString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `APP-${year}-${randomSuffix}`;
}

export function calculateGPAFromGrades(subjects: StudentSubjectHistory[] = []): number {
  const graded = subjects.filter((s) => {
    const val = typeof s.grade === 'number' ? s.grade : parseFloat(s.grade);
    return !isNaN(val) && val > 0;
  });

  if (graded.length === 0) return 0;
  const totalUnits = graded.reduce((sum, s) => sum + (s.units || 3), 0);
  if (totalUnits === 0) return 0;

  const weightedSum = graded.reduce((sum, s) => {
    const grade = typeof s.grade === 'number' ? s.grade : parseFloat(s.grade);
    return sum + grade * (s.units || 3);
  }, 0);

  return parseFloat((weightedSum / totalUnits).toFixed(2));
}

export function normalizeStudentProfile(raw: Partial<StudentProfile>): StudentProfile {
  const fallbackId = raw.id || `stu-${Date.now()}`;
  const studentId = raw.studentId || generateStudentId(raw.academicYear);
  const firstName = raw.firstName || raw.fullName?.split(' ')[0] || '';
  const lastName = raw.lastName || raw.fullName?.split(' ').slice(1).join(' ') || '';
  const fullName = raw.fullName || [firstName, raw.middleName, lastName, raw.suffix].filter(Boolean).join(' ') || raw.name || 'Student';

  const defaultReqs = getDefaultStudentRequirements();
  const existingReqs = raw.requirements && raw.requirements.length > 0 ? raw.requirements : defaultReqs;

  const tuitionTotal = raw.tuitionTotal ?? 18500;
  const tuitionPaid = raw.tuitionPaid ?? 0;
  const tuitionBalance = raw.tuitionBalance ?? Math.max(0, tuitionTotal - tuitionPaid);

  return {
    id: fallbackId,
    studentId,
    applicationNumber: raw.applicationNumber || generateApplicationNumber(raw.academicYear),
    fullName,
    name: fullName,
    firstName,
    middleName: raw.middleName || '',
    lastName,
    suffix: raw.suffix || '',
    preferredName: raw.preferredName || firstName,
    email: raw.email || `${studentId.toLowerCase().replace(/-/g, '.')}@student.pcm.edu.ph`,
    linkedGoogleUid: raw.linkedGoogleUid,
    authUid: raw.authUid,
    portalPassword: raw.portalPassword || 'pcmstudent',
    avatarUrl: raw.avatarUrl || raw.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    profilePhoto: raw.profilePhoto || raw.avatarUrl,

    // Personal
    dateOfBirth: raw.dateOfBirth || raw.birthDate || '2004-01-01',
    birthDate: raw.birthDate || raw.dateOfBirth || '2004-01-01',
    placeOfBirth: raw.placeOfBirth || '',
    age: raw.age || calculateStudentAge(raw.dateOfBirth || raw.birthDate || '') || 20,
    sex: raw.sex || raw.gender || 'Male',
    gender: raw.gender || raw.sex || 'Male',
    civilStatus: raw.civilStatus || 'Single',
    nationality: raw.nationality || 'Filipino',
    religion: raw.religion || 'Christian (Evangelical / Church of Christ)',

    // Contact
    mobileNumber: raw.mobileNumber || raw.contactNumber || raw.phone || '',
    contactNumber: raw.contactNumber || raw.mobileNumber || raw.phone || '',
    phone: raw.phone || raw.mobileNumber || raw.contactNumber || '',
    facebookAccount: raw.facebookAccount || '',
    currentAddress: raw.currentAddress || raw.address || '',
    permanentAddress: raw.permanentAddress || raw.currentAddress || raw.address || '',
    address: raw.address || raw.currentAddress || '',
    city: raw.city || 'Baguio City',
    province: raw.province || 'Benguet',
    zipCode: raw.zipCode || '2600',

    // Family
    fatherName: raw.fatherName || '',
    motherName: raw.motherName || '',
    guardianName: raw.guardianName || raw.emergencyContact?.name || '',
    guardianRelationship: raw.guardianRelationship || raw.emergencyContact?.relationship || 'Parent / Guardian',
    guardianContactNumber: raw.guardianContactNumber || raw.guardianPhone || raw.emergencyContact?.phone || '',
    guardianPhone: raw.guardianPhone || raw.guardianContactNumber || '',
    guardianEmail: raw.guardianEmail || '',
    guardianAddress: raw.guardianAddress || raw.address || '',
    emergencyContactPerson: raw.emergencyContactPerson || raw.emergencyContactName || raw.emergencyContact?.name || '',
    emergencyContactName: raw.emergencyContactName || raw.emergencyContactPerson || '',
    emergencyContactNumber: raw.emergencyContactNumber || raw.emergencyContactPhone || raw.emergencyContact?.phone || '',
    emergencyContactPhone: raw.emergencyContactPhone || raw.emergencyContactNumber || '',
    emergencyContactRelationship: raw.emergencyContactRelationship || raw.emergencyContactRelation || raw.emergencyContact?.relationship || '',
    emergencyContactRelation: raw.emergencyContactRelation || raw.emergencyContactRelationship || '',
    emergencyContact: raw.emergencyContact || {
      name: raw.emergencyContactPerson || raw.guardianName || '',
      relationship: raw.emergencyContactRelationship || 'Parent',
      phone: raw.emergencyContactNumber || raw.guardianPhone || '',
    },

    // Education
    lastSchoolAttended: raw.lastSchoolAttended || '',
    schoolAddress: raw.schoolAddress || '',
    highestEducationalAttainment: raw.highestEducationalAttainment || 'Senior High School Graduate',
    previousCourse: raw.previousCourse || '',
    yearGraduated: raw.yearGraduated || '2024',
    graduationDate: raw.graduationDate || '',
    previousSchoolId: raw.previousSchoolId || '',
    honorsAwards: raw.honorsAwards || '',

    // Church & Ministry
    homeChurch: raw.homeChurch || raw.churchName || 'Philippine Church of Christ',
    churchName: raw.churchName || raw.homeChurch || 'Philippine Church of Christ',
    churchAddress: raw.churchAddress || '',
    churchContactNumber: raw.churchContactNumber || '',
    pastorName: raw.pastorName || 'Rev. Pastor',
    pastorContactNumber: raw.pastorContactNumber || raw.pastorPhone || '',
    pastorPhone: raw.pastorPhone || raw.pastorContactNumber || '',
    ministryDepartment: raw.ministryDepartment || 'Youth & Worship Ministry',
    ministryRole: raw.ministryRole || 'Youth Leader / Musician',
    yearsInMinistry: raw.yearsInMinistry || 2,
    dateStartedInMinistry: raw.dateStartedInMinistry || '',
    ministryExperience: raw.ministryExperience || '',
    churchRecommendationStatus: raw.churchRecommendationStatus || 'Verified',
    pastorRecommendationStatus: raw.pastorRecommendationStatus || 'Verified',
    presbytery: raw.presbytery || 'Northern Luzon Evangelical Fellowship',
    mentorName: raw.mentorName || raw.spiritualMentor || 'Dr. Benjamin Villanueva',
    spiritualMentor: raw.spiritualMentor || raw.mentorName || 'Dr. Benjamin Villanueva',

    // Enrollment
    applicantType: raw.applicantType || 'New Student',
    program: raw.program || raw.degreeProgram || 'Bachelor of Arts in Theology',
    programId: raw.programId || 'prog-bth',
    degreeProgram: raw.degreeProgram || raw.program || 'Bachelor of Arts in Theology',
    major: raw.major || raw.specialization || 'General Pastoral Ministry',
    specialization: raw.specialization || raw.major || 'General Pastoral Ministry',
    yearLevel: raw.yearLevel || '1st Year',
    section: raw.section || 'Section A',
    assignedAdviser: raw.assignedAdviser || 'Dr. Benjamin Villanueva',
    academicStatus: raw.academicStatus || 'Regular',
    enrollmentStatus: raw.enrollmentStatus || 'Submitted',
    currentSemester: raw.currentSemester || '1st Semester, AY 2026–2027',
    semester: raw.semester || '1st Semester',
    academicYear: raw.academicYear || '2026–2027',
    applicationDate: raw.applicationDate || new Date().toISOString().split('T')[0],
    enrollmentDate: raw.enrollmentDate || new Date().toISOString().split('T')[0],

    // Requirements & Documents
    requirements: existingReqs,
    uploadedDocuments: raw.uploadedDocuments || raw.documents || [],
    documents: raw.documents || raw.uploadedDocuments || [],

    // Account
    authProvider: raw.authProvider || 'PCM Academic Portal',
    accountStatus: raw.accountStatus || 'Active',
    verificationStatus: raw.verificationStatus || 'Verified',
    lastLogin: raw.lastLogin || new Date().toISOString(),
    portalAccess: raw.portalAccess !== false,

    // Payments
    enrollmentFee: raw.enrollmentFee ?? 1500,
    tuitionTotal,
    tuitionPaid,
    tuitionBalance,
    paymentStatus: raw.paymentStatus || (tuitionPaid >= tuitionTotal ? 'Paid' : tuitionPaid > 0 ? 'Partially Paid' : 'Unpaid'),
    paymentRecords: raw.paymentRecords || raw.paymentHistory || [],
    paymentHistory: raw.paymentHistory || raw.paymentRecords || [],
    scholarshipDiscount: raw.scholarshipDiscount || 0,
    scholarshipType: raw.scholarshipType || '',
    officialReceiptNumber: raw.officialReceiptNumber || '',
    paymentRemarks: raw.paymentRemarks || '',

    // Academic
    gpa: raw.gpa || 3.75,
    totalUnitsEarned: raw.totalUnitsEarned || 0,
    courses: raw.courses || [],
    subjectHistory: raw.subjectHistory || [],
    practicumEntries: raw.practicumEntries || [],
    attendanceAverage: raw.attendanceAverage || '98%',

    // Metadata
    adminNotes: raw.adminNotes || '',
    adminRemarks: raw.adminRemarks || '',
    isArchived: raw.isArchived || false,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
