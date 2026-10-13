// Admission-to-enrollment workflow: stages, allowed transitions, requirement rules and
// applicant-facing instructions. Pure functions only (no Firebase), so they can be shared by
// the applicant tracker, the admin review screens and the tests.

export type WorkflowStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Requirements Incomplete'
  | 'For Admission Approval'
  | 'Admitted'
  | 'For Enrollment'
  | 'Enrolled'
  | 'Rejected'
  | 'Deferred';

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
  { status: 'For Admission Approval', label: 'For Admission Approval' },
  { status: 'Admitted', label: 'Admitted' },
  { status: 'For Enrollment', label: 'For Enrollment' },
  { status: 'Enrolled', label: 'Enrolled' },
];

export const FINAL_STATUSES: WorkflowStatus[] = ['Enrolled', 'Rejected'];

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
  if (status === 'Rejected' || status === 'Deferred') return status;
  return LEGACY_STATUS_MAP[status] || 'Under Review';
}

// Index of the stage on the tracker (Rejected/Deferred return -1).
export function stageIndex(status?: string | null): number {
  const s = normalizeStatus(status);
  return TRACKER_STAGES.findIndex((stage) => stage.status === s);
}

// Transitions staff may make from each status. Moving to 'Enrolled' happens only through
// finalizeEnrollment, which also creates the official student record.
export const STAFF_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  Submitted: ['Under Review', 'Requirements Incomplete', 'Rejected', 'Deferred'],
  'Under Review': ['Requirements Incomplete', 'For Admission Approval', 'Rejected', 'Deferred'],
  'Requirements Incomplete': ['Under Review', 'For Admission Approval', 'Rejected', 'Deferred'],
  'For Admission Approval': ['Admitted', 'Requirements Incomplete', 'Rejected', 'Deferred'],
  Admitted: ['For Enrollment', 'Requirements Incomplete', 'Deferred'],
  'For Enrollment': ['Requirements Incomplete', 'Deferred'],
  Enrolled: [],
  Rejected: ['Under Review'],
  Deferred: ['Under Review'],
};

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
  reqs: ApplicationRequirement[]
): string | null {
  const current = normalizeStatus(from);
  if (!STAFF_TRANSITIONS[current].includes(to)) {
    return `An application that is "${current}" cannot be moved to "${to}".`;
  }
  const summary = summarizeRequirements(reqs);
  if (to === 'For Admission Approval' && !summary.allRequiredSubmitted) {
    return 'All required documents must be submitted before the application goes for admission approval.';
  }
  if (to === 'For Enrollment' && !summary.allRequiredVerified) {
    return 'All required documents must be verified before the applicant can proceed to enrollment.';
  }
  return null;
}

export function canFinalizeEnrollment(status: string | undefined, reqs: ApplicationRequirement[]): string | null {
  if (normalizeStatus(status) !== 'For Enrollment') {
    return 'Only applications marked "For Enrollment" can be finalized.';
  }
  if (!summarizeRequirements(reqs).allRequiredVerified) {
    return 'All required documents must be verified before enrollment is finalized.';
  }
  return null;
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
    case 'For Admission Approval':
      return 'Your documents are complete and your application is with the Admissions Committee for a decision.';
    case 'Admitted':
      return 'Congratulations, you have been admitted! The Registrar is verifying your documents before enrollment.';
    case 'For Enrollment':
      return 'Your requirements are verified. The Registrar will confirm your enrollment and assign your official Student ID.';
    case 'Enrolled':
      return 'You are officially enrolled. Open the Student Portal to see your Student ID, program and enrollment details.';
    case 'Deferred':
      return 'Your application has been deferred. Please read the note from the Admissions Office; we will contact you about the next intake.';
    case 'Rejected':
      return 'We are unable to offer admission at this time. Please read the note from the Admissions Office for details.';
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

// Applications that still count as "open" for duplicate checks.
export function isOpenApplication(status?: string | null): boolean {
  const s = normalizeStatus(status);
  return s !== 'Rejected' && s !== 'Enrolled';
}
