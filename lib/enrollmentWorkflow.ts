// Admission-to-enrollment workflow: stages, allowed transitions, requirement rules and
// applicant-facing instructions. Pure functions only (no Firebase), so they can be shared by
// the applicant tracker, the admin review screens and the tests.

// 1. Online application (Submitted; unfinished forms are saved as a draft per account)
// -> 2. Review (Under Review; Requirements Incomplete for documents, For Correction for details)
// -> 3. Admission decision (For Admission Approval -> Admitted)
// -> 4. Requirements (Admitted, until every required document is verified)
// -> 5. Registration (For Registration: the admitted student picks year level, term and subjects)
// -> 6. Assessment and payment (For Assessment -> For Payment)
// -> 7. Final verification (For Enrollment: checklist reviewed by the Registrar)
// -> 8. Official enrollment (Enrolled: student record, Student ID, portal) .
// Rejected, Deferred and Withdrawn are outcomes. Stored values never change; staff and
// applicants see the names in STATUS_LABELS.
export type WorkflowStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Requirements Incomplete'
  | 'For Correction'
  | 'For Admission Approval'
  | 'Admitted'
  | 'For Registration'
  | 'For Assessment'
  | 'For Payment'
  | 'For Enrollment'
  | 'Enrolled'
  | 'Rejected'
  | 'Deferred'
  | 'Withdrawn';

// Names shown to applicants and staff for each stored status.
export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  Submitted: 'Submitted',
  'Under Review': 'Under Review',
  'Requirements Incomplete': 'Incomplete Requirements',
  'For Correction': 'For Correction',
  'For Admission Approval': 'For Admission Decision',
  Admitted: 'Admitted',
  'For Registration': 'For Registration',
  'For Assessment': 'For Assessment',
  'For Payment': 'Pending Payment',
  'For Enrollment': 'For Final Verification',
  Enrolled: 'Officially Enrolled',
  Rejected: 'Rejected',
  Deferred: 'Deferred',
  Withdrawn: 'Withdrawn',
};

export function statusLabel(status?: string | null): string {
  return STATUS_LABELS[normalizeStatus(status)];
}

// Academic registration chosen by the admitted student (applications/{id}.registration).
export interface RegisteredSubject {
  subjectId: string;
  code: string;
  title: string;
  units: number;
  section?: string;
  schedule?: string;
  room?: string;
  instructor?: string;
}

export interface EnrollmentRegistration {
  programId?: string;
  programName: string;
  yearLevel: string;
  academicYear: string;
  semester: string;
  subjects: RegisteredSubject[];
  totalUnits: number;
  submittedAt: string;
  submittedBy: string;
}

export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export interface RegistrationPolicy {
  minUnits: number;
  maxUnits: number;
  maxSubjects: number;
  enforceScheduleConflicts?: boolean;
  enforceSectionCapacity?: boolean;
}

// Catalog entry as stored in academicSubjects (only the fields the checks need).
export interface CatalogSubject {
  id: string;
  code: string;
  units: number;
  schedule?: string;
  capacity?: number;
  enrolledCount?: number;
  status?: string;
  isArchived?: boolean;
}

// Why a registration cannot be submitted, or null when it follows PCM's academic policies.
export function validateRegistration(
  reg: Pick<EnrollmentRegistration, 'programName' | 'yearLevel' | 'academicYear' | 'semester' | 'subjects'>,
  policy: RegistrationPolicy,
  catalog: CatalogSubject[] = []
): string | null {
  if (!reg.programName?.trim()) return 'Choose your academic program.';
  if (!reg.yearLevel?.trim()) return 'Choose your year level.';
  if (!reg.academicYear?.trim() || !reg.semester?.trim()) return 'There is no open enrollment term. Please contact the Registrar.';
  if (!reg.subjects || reg.subjects.length === 0) return 'Select at least one subject.';
  const codes = reg.subjects.map((s) => s.code.trim().toUpperCase());
  const dup = codes.find((c, i) => codes.indexOf(c) !== i);
  if (dup) return `${dup} is selected more than once.`;
  if (policy.maxSubjects > 0 && reg.subjects.length > policy.maxSubjects) {
    return `You can take at most ${policy.maxSubjects} subjects this term.`;
  }
  const units = reg.subjects.reduce((sum, s) => sum + (Number(s.units) || 0), 0);
  if (policy.minUnits > 0 && units < policy.minUnits) return `A full load needs at least ${policy.minUnits} units (you have ${units}).`;
  if (policy.maxUnits > 0 && units > policy.maxUnits) return `The maximum load is ${policy.maxUnits} units (you have ${units}).`;
  if (policy.enforceScheduleConflicts) {
    const times = reg.subjects.map((s) => (s.schedule || '').trim().toLowerCase()).filter(Boolean);
    const clash = times.find((t, i) => times.indexOf(t) !== i);
    if (clash) {
      const clashing = reg.subjects.filter((s) => (s.schedule || '').trim().toLowerCase() === clash);
      return `${clashing.map((s) => s.code).join(' and ')} meet at the same time (${(clashing[0].schedule || '').trim()}). Choose a different subject or section.`;
    }
  }
  for (const s of reg.subjects) {
    const c = catalog.find((x) => x.id === s.subjectId);
    if (!c) continue;
    if (c.isArchived || (c.status && c.status !== 'Open')) return `${s.code} is not open for enrollment.`;
    if (policy.enforceSectionCapacity && Number(c.capacity) > 0 && Number(c.enrolledCount || 0) >= Number(c.capacity)) {
      return `${s.code} is full. Choose another subject or section.`;
    }
  }
  return null;
}

export type PaymentStatus = 'Awaiting Payment' | 'Submitted' | 'Partially Paid' | 'Verified' | 'Waived' | 'Rejected';

export interface FeeLine {
  name: string;
  amount: number;
}

// Fee assessment recorded by staff on the application (applications/{id}.assessment).
export interface EnrollmentAssessment {
  units: number;
  items: FeeLine[];
  total: number;
  minimumPayment: number; // amount that must be verified before enrollment can be confirmed
  notes?: string;
  assessedBy: string;
  assessedAt: string;
}

// A payment the applicant reports (applications/{id}/payments/{paymentId}).
export interface ApplicationPayment {
  id: string;
  applicantUid: string;
  amount: number;
  method: string;
  referenceNo: string;
  paidOn: string;
  proofDataUrl?: string;
  proofFileName?: string;
  status: 'Submitted' | 'Verified' | 'Rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export const PAYMENT_METHODS = ['GCash', 'Bank Transfer (BDO)', 'Bank Transfer (Metrobank)', 'Over-the-Counter Cashier', 'Scholarship Grant'];

export function verifiedPaymentTotal(payments: ApplicationPayment[]): number {
  return payments.filter((p) => p.status === 'Verified').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

// Builds a draft assessment from the Registrar's fee structure (Enrollment & Records ->
// Fees) and enrollment settings. Staff can edit every line before saving.
export function draftAssessmentLines(
  feeStructure: { name: string; amount: number; isPerUnit?: boolean; required?: boolean }[],
  units: number,
  defaults: { tuitionPerUnit?: number; registrationFee?: number }
): FeeLine[] {
  const required = feeStructure.filter((f) => f.required !== false);
  if (required.length > 0) {
    return required.map((f) => ({
      name: f.isPerUnit ? `${f.name} (${units} units × ₱${Number(f.amount).toLocaleString()})` : f.name,
      amount: Math.round((f.isPerUnit ? units * Number(f.amount) : Number(f.amount)) * 100) / 100,
    }));
  }
  const lines: FeeLine[] = [];
  if (defaults.tuitionPerUnit) lines.push({ name: `Tuition (${units} units × ₱${defaults.tuitionPerUnit.toLocaleString()})`, amount: units * defaults.tuitionPerUnit });
  if (defaults.registrationFee) lines.push({ name: 'Registration Fee', amount: defaults.registrationFee });
  return lines;
}

export type RequirementStatus = 'Missing' | 'Submitted' | 'Verified' | 'Rejected';

export interface ApplicationRequirement {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  status: RequirementStatus;
  applicantUid: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  uploadedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  order?: number;
}

export interface ApplicationHistoryEntry {
  id: string;
  status: WorkflowStatus;
  previousStatus?: WorkflowStatus | null;
  actor: 'applicant' | 'staff';
  byName: string;
  byRole?: string;
  note?: string;
  at: string;
}

// The stages shown on the progress tracker, in order. 'Rejected' and 'Deferred' are
// outcomes shown separately rather than steps.
export const TRACKER_STAGES: { status: WorkflowStatus; label: string }[] = [
  { status: 'Submitted', label: 'Application Submitted' },
  { status: 'Under Review', label: 'Under Review' },
  { status: 'Requirements Incomplete', label: 'Requirements' },
  { status: 'For Admission Approval', label: 'Admission Decision' },
  { status: 'Admitted', label: 'Admitted' },
  { status: 'For Registration', label: 'Registration' },
  { status: 'For Assessment', label: 'Assessment' },
  { status: 'For Payment', label: 'Payment' },
  { status: 'For Enrollment', label: 'Final Verification' },
  { status: 'Enrolled', label: 'Officially Enrolled' },
];

export const FINAL_STATUSES: WorkflowStatus[] = ['Enrolled', 'Rejected', 'Withdrawn'];

/** Admitted applicants use the Student Portal (admitted view) from these statuses until they are enrolled. */
export const ADMITTED_PORTAL_STATUSES: WorkflowStatus[] = ['Admitted', 'For Registration', 'For Assessment', 'For Payment', 'For Enrollment'];

// Older applications used a different status vocabulary; map them onto the workflow.
const LEGACY_STATUS_MAP: Record<string, WorkflowStatus> = {
  Draft: 'Submitted',
  Submitted: 'Submitted',
  'Under Review': 'Under Review',
  'Additional Documents Required': 'Requirements Incomplete',
  'Exam Scheduled': 'Under Review',
  Interviewed: 'Under Review',
  Accepted: 'Admitted',
  Waitlisted: 'Deferred',
  Rejected: 'Rejected',
  Enrolled: 'Enrolled',
};

export function normalizeStatus(status?: string | null): WorkflowStatus {
  if (!status) return 'Submitted';
  if ((TRACKER_STAGES.map((s) => s.status) as string[]).includes(status)) return status as WorkflowStatus;
  if (status === 'Rejected' || status === 'Deferred' || status === 'Withdrawn' || status === 'For Correction') return status;
  return LEGACY_STATUS_MAP[status] || 'Under Review';
}

// Index of the stage on the tracker (Rejected/Deferred return -1).
export function stageIndex(status?: string | null): number {
  const s = normalizeStatus(status);
  // Corrections happen at the same point as missing documents.
  const shown = s === 'For Correction' ? 'Requirements Incomplete' : s;
  return TRACKER_STAGES.findIndex((stage) => stage.status === shown);
}

// Status moves staff may make with the decision buttons. Some steps happen only through
// their own action so the required data is captured:
//   For Registration -> For Assessment submitRegistration (by the student) or this button
//                                      once a registration is on file
//   For Assessment -> For Payment      saveAssessment (fees)
//   For Assessment -> For Enrollment   waivePayment (no payment required, with reason)
//   For Payment    -> For Enrollment   reviewPayment (verified total reaches the minimum)
//   For Enrollment -> Enrolled         finalizeEnrollment (creates the student record)
// firestore.rules enforces the same order (validStaffTransition).
export const STAFF_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  Submitted: ['Under Review', 'Requirements Incomplete', 'For Correction', 'Rejected', 'Deferred', 'Withdrawn'],
  'Under Review': ['Requirements Incomplete', 'For Correction', 'For Admission Approval', 'Rejected', 'Deferred', 'Withdrawn'],
  'Requirements Incomplete': ['Under Review', 'For Correction', 'For Admission Approval', 'Rejected', 'Deferred', 'Withdrawn'],
  'For Correction': ['Under Review', 'Rejected', 'Deferred', 'Withdrawn'],
  'For Admission Approval': ['Admitted', 'Requirements Incomplete', 'For Correction', 'Rejected', 'Deferred', 'Withdrawn'],
  Admitted: ['For Registration', 'Requirements Incomplete', 'Deferred', 'Withdrawn'],
  'For Registration': ['For Assessment', 'Admitted', 'Deferred', 'Withdrawn'],
  'For Assessment': ['For Registration', 'Deferred', 'Withdrawn'],
  'For Payment': ['For Assessment', 'Deferred', 'Withdrawn'],
  'For Enrollment': ['For Assessment', 'Deferred', 'Withdrawn'],
  Enrolled: [],
  Rejected: ['Under Review'],
  Deferred: ['Under Review'],
  Withdrawn: [],
};

// Decisions that must carry a note for the applicant.
export const NOTE_REQUIRED_STATUSES: WorkflowStatus[] = ['Rejected', 'Deferred', 'Requirements Incomplete', 'For Correction', 'Withdrawn'];

export interface RequirementSummary {
  total: number;
  required: number;
  missing: ApplicationRequirement[];
  rejected: ApplicationRequirement[];
  awaitingReview: ApplicationRequirement[];
  verified: number;
  allRequiredSubmitted: boolean;
  allRequiredVerified: boolean;
}

export function summarizeRequirements(reqs: ApplicationRequirement[]): RequirementSummary {
  const required = reqs.filter((r) => r.required);
  return {
    total: reqs.length,
    required: required.length,
    missing: required.filter((r) => r.status === 'Missing'),
    rejected: required.filter((r) => r.status === 'Rejected'),
    awaitingReview: reqs.filter((r) => r.status === 'Submitted'),
    verified: reqs.filter((r) => r.status === 'Verified').length,
    allRequiredSubmitted: required.every((r) => r.status === 'Submitted' || r.status === 'Verified'),
    allRequiredVerified: required.every((r) => r.status === 'Verified'),
  };
}

// Why a staff transition is not allowed right now, or null if it is.
export function transitionBlocker(
  from: string | undefined,
  to: WorkflowStatus,
  reqs: ApplicationRequirement[],
  app?: { registration?: EnrollmentRegistration | null }
): string | null {
  const current = normalizeStatus(from);
  if (!STAFF_TRANSITIONS[current].includes(to)) {
    return `An application that is "${STATUS_LABELS[current]}" cannot be moved to "${STATUS_LABELS[to]}".`;
  }
  const summary = summarizeRequirements(reqs);
  if (to === 'For Admission Approval' && !summary.allRequiredSubmitted) {
    return 'All required documents must be submitted before the application goes for an admission decision.';
  }
  if ((to === 'For Registration' || to === 'For Assessment') && !summary.allRequiredVerified) {
    return 'All required documents must be verified first.';
  }
  if (to === 'For Assessment' && current === 'For Registration' && !app?.registration?.subjects?.length) {
    return 'The student has not submitted their academic registration (subjects) yet.';
  }
  return null;
}

// Every mandatory condition for official enrollment: right stage, all required documents
// verified, an assessment on file, and payment verified (or waived with a reason).
export function canFinalizeEnrollment(
  status: string | undefined,
  reqs: ApplicationRequirement[],
  app?: { assessment?: EnrollmentAssessment | null; paymentStatus?: string; registration?: EnrollmentRegistration | null }
): string | null {
  if (normalizeStatus(status) !== 'For Enrollment') {
    return 'Only applications at "For Final Verification" can be finalized.';
  }
  if (!summarizeRequirements(reqs).allRequiredVerified) {
    return 'All required documents must be verified before enrollment is finalized.';
  }
  if (app) {
    if (!app.registration?.subjects?.length) return 'The student’s academic registration (program, term and subjects) must be on file.';
    if (!app.assessment) return 'An enrollment assessment must be saved first.';
    if (app.paymentStatus !== 'Verified' && app.paymentStatus !== 'Waived') {
      return 'Payment must be verified (or waived) before enrollment is confirmed.';
    }
  }
  return null;
}

export interface ChecklistItem {
  label: string;
  ok: boolean;
  detail: string;
}

// Final enrollment verification: everything the Registrar confirms before official enrollment.
export function finalVerificationChecklist(
  app: { status?: string; assessment?: EnrollmentAssessment | null; paymentStatus?: string; paymentWaivedReason?: string; registration?: EnrollmentRegistration | null },
  reqs: ApplicationRequirement[],
  payments: ApplicationPayment[]
): ChecklistItem[] {
  const summary = summarizeRequirements(reqs);
  const verified = verifiedPaymentTotal(payments);
  const reg = app.registration;
  const admitted = stageIndex(app.status) >= stageIndex('Admitted');
  return [
    { label: 'Admission approved', ok: admitted, detail: admitted ? 'The applicant was admitted.' : 'The applicant has not been admitted.' },
    {
      label: 'Required documents verified',
      ok: summary.allRequiredVerified,
      detail: `${summary.verified} of ${summary.total} documents verified${summary.allRequiredVerified ? '' : ` · ${summary.missing.length + summary.rejected.length + summary.awaitingReview.length} still open`}.`,
    },
    {
      label: 'Academic registration on file',
      ok: !!reg?.subjects?.length,
      detail: reg?.subjects?.length
        ? `${reg.programName} · ${reg.yearLevel} · ${reg.semester}, AY ${reg.academicYear} · ${reg.subjects.length} subjects, ${reg.totalUnits} units.`
        : 'No subjects selected.',
    },
    {
      label: 'Assessment saved',
      ok: !!app.assessment,
      detail: app.assessment ? `Total ₱${Number(app.assessment.total).toLocaleString()}, minimum ₱${Number(app.assessment.minimumPayment).toLocaleString()}.` : 'No assessment yet.',
    },
    {
      label: 'Payment verified or authorized exemption',
      ok: app.paymentStatus === 'Verified' || app.paymentStatus === 'Waived',
      detail:
        app.paymentStatus === 'Waived'
          ? `Exempted: ${app.paymentWaivedReason || 'reason on record'}.`
          : `₱${verified.toLocaleString()} verified${app.assessment ? ` of ₱${Number(app.assessment.minimumPayment).toLocaleString()} minimum` : ''}.`,
    },
  ];
}

// After an applicant uploads documents, a "Requirements Incomplete" application returns to
// review once every required document has been submitted again.
export function applicantResubmissionStatus(
  status: string | undefined,
  reqs: ApplicationRequirement[]
): WorkflowStatus | null {
  if (normalizeStatus(status) !== 'Requirements Incomplete') return null;
  return summarizeRequirements(reqs).allRequiredSubmitted ? 'Under Review' : null;
}

// Plain-language instructions for the applicant at each stage.
export function nextStepsFor(status: string | undefined, summary?: RequirementSummary): string {
  switch (normalizeStatus(status)) {
    case 'Submitted':
      return 'Your application has been received. Upload any missing documents below while the Admissions Office prepares your review.';
    case 'Under Review':
      return 'The Admissions Office is reviewing your application and documents. No action is needed unless we request more information.';
    case 'Requirements Incomplete': {
      const outstanding = summary ? summary.missing.length + summary.rejected.length : 0;
      return outstanding > 0
        ? `Action needed: please submit or replace ${outstanding} document${outstanding === 1 ? '' : 's'} listed below. Your application returns to review automatically once all required documents are in.`
        : 'Action needed: please review the remarks from the Admissions Office below.';
    }
    case 'For Correction':
      return 'Action needed: the Admissions Office asked you to correct some details in your application. Read the note, update the details below and send them back for review.';
    case 'For Admission Approval':
      return 'Your documents are complete and your application is with the Admissions Committee for a decision.';
    case 'Admitted': {
      const outstanding = summary ? summary.missing.length + summary.rejected.length : 0;
      return outstanding > 0
        ? `Congratulations, you have been admitted! Please complete your remaining enrollment requirements (${outstanding} outstanding) below.`
        : 'Congratulations, you have been admitted! You can now use the MyPCM Student Portal to follow your enrollment. Once the Registrar has verified your documents you will choose your subjects.';
    }
    case 'For Registration':
      return 'Action needed: choose your year level and subjects for the term below and submit your registration.';
    case 'For Assessment':
      return 'Your registration was received. The Registrar is preparing your enrollment assessment (fees). You will be notified when it is ready.';
    case 'For Payment':
      return 'Your assessment is ready. Please pay at least the downpayment shown below (see How to pay) and submit your payment details for verification. The rest of your fees becomes your balance, payable after enrollment.';
    case 'For Enrollment':
      return 'Your payment is settled. The Registrar is doing the final verification and will confirm your enrollment and Student ID.';
    case 'Enrolled':
      return 'You are officially enrolled and your Student Portal is active. Open it to see your Student ID, classes and records.';
    case 'Deferred':
      return 'Your application has been deferred. Please read the note from the Admissions Office; we will contact you about the next intake.';
    case 'Rejected':
      return 'We are unable to offer admission at this time. Please read the note from the Admissions Office for details.';
    case 'Withdrawn':
      return 'This application was withdrawn. You can start a new application at any time.';
  }
}

export interface RequirementTemplate {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

export const DEFAULT_REQUIREMENTS: RequirementTemplate[] = [
  { id: 'id-photo', name: '2x2 ID Photo', description: 'Recent photo with white background.', required: true },
  { id: 'birth-certificate', name: 'PSA Birth Certificate', description: 'Clear scan or photo of all pages.', required: true },
  { id: 'academic-records', name: 'Form 138 / Transcript of Records', description: 'Latest report card or transcript.', required: true },
  { id: 'good-moral', name: 'Certificate of Good Moral Character', description: 'From your last school attended.', required: true },
  { id: 'pastoral-recommendation', name: 'Pastoral Recommendation Letter', description: 'Signed by your senior pastor.', required: true },
  { id: 'testimony-essay', name: 'Christian Testimony Essay', description: 'Optional if already written in the application.', required: false },
];

// Uses the Registrar's configured list (enrollment settings) when present.
export function requirementTemplates(configuredRequired?: string[]): RequirementTemplate[] {
  if (!configuredRequired || configuredRequired.length === 0) return DEFAULT_REQUIREMENTS;
  return configuredRequired.map((name, i) => {
    const known = DEFAULT_REQUIREMENTS.find((d) => d.name.toLowerCase() === name.toLowerCase());
    return known || { id: `req-${i + 1}-${slug(name)}`, name, description: '', required: true };
  });
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// Documents are stored inside Firestore (Firebase Storage is not enabled for this
// project), so each file must fit comfortably within a 1 MB document.
export const MAX_REQUIREMENT_BYTES = 700 * 1024;
export const ALLOWED_REQUIREMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function validateRequirementFile(file: { name: string; type: string; size: number }): string | null {
  if (!ALLOWED_REQUIREMENT_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported file type. Please upload a PDF, JPG, PNG or WEBP file.`;
  }
  if (file.size > MAX_REQUIREMENT_BYTES) {
    return `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files must be 700 KB or smaller; please scan at a lower resolution or compress the PDF.`;
  }
  return null;
}

// Official Student ID format, e.g. 2026-PCM-0007.
export function formatStudentId(year: number, sequence: number): string {
  return `${year}-PCM-${String(sequence).padStart(4, '0')}`;
}

// Roles allowed to make admission decisions, verify documents and finalize enrollment.
export const ENROLLMENT_STAFF_ROLES = ['Super Admin', 'Admin', 'Registrar'];

export function isEnrollmentStaffRole(role?: string | null): boolean {
  return !!role && ENROLLMENT_STAFF_ROLES.includes(role);
}

// Payment verification is also open to the Finance office.
export const PAYMENT_STAFF_ROLES = [...ENROLLMENT_STAFF_ROLES, 'Finance'];

// Applications that still count as "open" for duplicate checks.
export function isOpenApplication(status?: string | null): boolean {
  const s = normalizeStatus(status);
  return s !== 'Rejected' && s !== 'Enrolled' && s !== 'Withdrawn';
}
