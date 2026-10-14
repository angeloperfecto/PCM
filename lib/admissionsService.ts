// Firestore operations for the admission-to-enrollment workflow. Every write here is also
// checked by firestore.rules: applicants can only create and update their own application
// and documents, and only enrollment staff (Registrar, Admin, Super Admin) can make
// decisions, verify documents or create official student records.

import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  query,
  runTransaction,
  where,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import { blobToDataUrl, compressImageFile } from './firebase';
import {
  ApplicationPayment,
  ApplicationRequirement,
  CatalogSubject,
  EnrollmentAssessment,
  EnrollmentRegistration,
  NOTE_REQUIRED_STATUSES,
  RegisteredSubject,
  RegistrationPolicy,
  STATUS_LABELS,
  FeeLine,
  PaymentStatus,
  RequirementTemplate,
  verifiedPaymentTotal,
  WorkflowStatus,
  applicantResubmissionStatus,
  canFinalizeEnrollment,
  formatStudentId,
  isOpenApplication,
  nextStepsFor,
  normalizeStatus,
  summarizeRequirements,
  transitionBlocker,
  validateRegistration,
  validateRequirementFile,
  missingRequirements
} from './enrollmentWorkflow';

export interface Actor {
  uid: string;
  name: string;
  email?: string | null;
  role?: string;
}

export interface ApplicationRecord {
  id: string;
  referenceNumber: string;
  status: string;
  applicantUid?: string;
  fullName: string;
  email: string;
  program?: string;
  programName?: string;
  programId?: string;
  studentId?: string;
  studentRecordId?: string;
  [key: string]: any;
}

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function addHistory(batch: WriteBatch, db: Firestore, appId: string, entry: {
  status: WorkflowStatus;
  previousStatus?: string | null;
  actor: 'applicant' | 'staff';
  byName: string;
  byRole?: string;
  note?: string;
}) {
  const id = newId('hist');
  batch.set(doc(db, 'applications', appId, 'history', id), {
    id,
    ...entry,
    previousStatus: entry.previousStatus ?? null,
    note: entry.note || '',
    at: now(),
  });
}

function notifyApplicant(batch: WriteBatch, db: Firestore, app: ApplicationRecord, title: string, message: string) {
  if (!app.applicantUid) return;
  const id = newId('notif');
  batch.set(doc(db, 'studentNotifications', id), {
    id,
    studentId: app.studentRecordId || app.applicantUid,
    recipientUid: app.applicantUid,
    applicationId: app.id,
    title,
    message,
    type: 'enrollment',
    read: false,
    createdAt: now(),
    linkSection: 'portal',
  });
}

function notifyStaff(batch: WriteBatch, db: Firestore, app: { id: string; referenceNumber: string }, actorUid: string, title: string, message: string) {
  const id = newId('staff');
  batch.set(doc(db, 'staffNotifications', id), {
    id,
    applicationId: app.id,
    referenceNumber: app.referenceNumber,
    title,
    message,
    createdByUid: actorUid,
    read: false,
    createdAt: now(),
  });
}

function generateReference(): string {
  const year = new Date().getFullYear();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `PCM-${year}-${code}`;
}

// Turns a selected file into a data URL small enough to store in Firestore. Images are
// resized/compressed first; PDFs must already be within the limit.
export async function prepareRequirementFile(file: File): Promise<{ dataUrl: string; size: number; type: string; name: string }> {
  let blob: Blob = file;
  let type = file.type;
  if (file.type.startsWith('image/')) {
    blob = await compressImageFile(file, 1600, 1600, 0.8);
    type = blob.type || file.type;
  }
  const problem = validateRequirementFile({ name: file.name, type, size: blob.size });
  if (problem) throw new Error(problem);
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, size: blob.size, type, name: file.name };
}

// ---------------------------------------------------------------------------
// Applicant actions
// ---------------------------------------------------------------------------

export interface SubmitApplicationResult {
  ok: boolean;
  applicationId?: string;
  referenceNumber?: string;
  duplicateOf?: ApplicationRecord;
  message?: string;
}

export async function findOpenApplication(db: Firestore, applicant: Actor): Promise<ApplicationRecord | null> {
  const found: ApplicationRecord[] = [];
  const byUid = await getDocs(query(collection(db, 'applications'), where('applicantUid', '==', applicant.uid)));
  byUid.forEach((d) => found.push({ id: d.id, ...(d.data() as any) }));
  if (applicant.email) {
    // Applications made before sign-in was required are matched by the verified email.
    const byEmail = await getDocs(query(collection(db, 'applications'), where('email', '==', applicant.email)));
    byEmail.forEach((d) => found.push({ id: d.id, ...(d.data() as any) }));
  }
  return found.find((a) => isOpenApplication(a.status)) || null;
}

export async function submitAdmissionApplication(
  db: Firestore,
  applicant: Actor,
  data: Record<string, any>,
  templates: RequirementTemplate[],
  initialFiles: Record<string, { dataUrl: string; size: number; type: string; name: string }> = {}
): Promise<SubmitApplicationResult> {
  if (!applicant.uid) return { ok: false, message: 'Please sign in with Google before submitting your application.' };

  const existing = await findOpenApplication(db, applicant);
  if (existing) {
    return {
      ok: false,
      duplicateOf: existing,
      message: `You already have an open application (${existing.referenceNumber}). You can track it and upload documents instead of applying again.`,
    };
  }

  const appId = newId('app');
  const referenceNumber = generateReference();
  const timestamp = now();
  const app: ApplicationRecord = {
    ...data,
    id: appId,
    referenceNumber,
    status: 'Submitted',
    applicantUid: applicant.uid,
    applicantEmail: applicant.email || '',
    fullName: String(data.fullName || '').trim(),
    email: String(data.email || applicant.email || '').trim().toLowerCase(),
    submissionDate: timestamp.split('T')[0],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const batch = writeBatch(db);
  batch.set(doc(db, 'applications', appId), app);
  templates.forEach((t, i) => {
    const file = initialFiles[t.id];
    const req: ApplicationRequirement = {
      id: t.id,
      name: t.name,
      description: t.description,
      required: t.required,
      status: file ? 'Submitted' : 'Missing',
      applicantUid: applicant.uid,
      order: i,
      ...(file
        ? { fileName: file.name, fileType: file.type, fileSize: file.size, fileDataUrl: file.dataUrl, uploadedAt: timestamp }
        : {}),
    };
    batch.set(doc(db, 'applications', appId, 'requirements', t.id), req);
  });
  addHistory(batch, db, appId, { status: 'Submitted', actor: 'applicant', byName: app.fullName || 'Applicant' });
  notifyApplicant(batch, db, app, 'Application received', `Your application ${referenceNumber} was received. ${nextStepsFor('Submitted')}`);
  notifyStaff(batch, db, app, applicant.uid, 'New admission application', `${app.fullName} applied for ${app.programName || app.program || 'a program'} (${referenceNumber}).`);
  await batch.commit();

  return { ok: true, applicationId: appId, referenceNumber };
}

export async function uploadRequirementFile(
  db: Firestore,
  applicant: Actor,
  app: ApplicationRecord,
  requirement: ApplicationRequirement,
  allRequirements: ApplicationRequirement[],
  file: File
): Promise<{ ok: boolean; message: string; newStatus?: WorkflowStatus }> {
  // Enrolled students may still send missing or returned admission documents.
  if (!isOpenApplication(app.status) && normalizeStatus(app.status) !== 'Enrolled') {
    return { ok: false, message: 'This application is closed, so documents can no longer be changed.' };
  }
  if (requirement.status === 'Verified') {
    return { ok: false, message: `"${requirement.name}" is already verified and cannot be replaced.` };
  }

  let prepared;
  try {
    prepared = await prepareRequirementFile(file);
  } catch (e: any) {
    return { ok: false, message: e?.message || 'The file could not be read. Please try another file.' };
  }

  const timestamp = now();
  const updated: ApplicationRequirement = {
    ...requirement,
    status: 'Submitted',
    fileName: prepared.name,
    fileType: prepared.type,
    fileSize: prepared.size,
    fileDataUrl: prepared.dataUrl,
    uploadedAt: timestamp,
  };

  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id, 'requirements', requirement.id), {
    status: 'Submitted',
    fileName: prepared.name,
    fileType: prepared.type,
    fileSize: prepared.size,
    fileDataUrl: prepared.dataUrl,
    uploadedAt: timestamp,
  });

  const nextReqs = allRequirements.map((r) => (r.id === requirement.id ? updated : r));
  const newStatus = applicantResubmissionStatus(app.status, nextReqs);
  if (newStatus) {
    batch.update(doc(db, 'applications', app.id), { status: newStatus, updatedAt: timestamp });
    addHistory(batch, db, app.id, {
      status: newStatus,
      previousStatus: app.status,
      actor: 'applicant',
      byName: app.fullName || 'Applicant',
      note: 'All required documents re-submitted.',
    });
    notifyApplicant(batch, db, app, 'Documents received', 'All required documents are in. Your application is back under review.');
  }
  notifyStaff(batch, db, app, applicant.uid, 'Document uploaded', `${app.fullName} uploaded "${requirement.name}" (${app.referenceNumber}).`);
  await batch.commit();

  return {
    ok: true,
    message: newStatus
      ? 'Document uploaded. All required documents are in, so your application is back under review.'
      : `"${requirement.name}" uploaded. The Admissions Office will review it.`,
    newStatus: newStatus || undefined,
  };
}

// ---------------------------------------------------------------------------
// Staff actions (Registrar, Admin, Super Admin)
// ---------------------------------------------------------------------------

export async function transitionApplication(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  to: WorkflowStatus,
  requirements: ApplicationRequirement[],
  note: string
): Promise<{ ok: boolean; message: string }> {
  const blocker = transitionBlocker(app.status, to, requirements, { registration: app.registration });
  if (blocker) return { ok: false, message: blocker };
  if (NOTE_REQUIRED_STATUSES.includes(to) && !note.trim()) {
    return { ok: false, message: 'Please add a note explaining this decision; the applicant will see it.' };
  }

  const timestamp = now();
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), {
    status: to,
    updatedAt: timestamp,
    lastDecisionBy: staff.name,
    lastDecisionAt: timestamp,
    // Each decision replaces the note shown to the applicant (an empty note clears an old one).
    applicantMessage: note.trim(),
  });
  addHistory(batch, db, app.id, {
    status: to,
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: note.trim(),
  });
  const summary = summarizeRequirements(requirements);
  notifyApplicant(
    batch,
    db,
    app,
    `Application status: ${STATUS_LABELS[to]}`,
    `${nextStepsFor(to, summary)}${note.trim() ? ` Note from the Admissions Office: ${note.trim()}` : ''}`
  );
  await batch.commit();
  return { ok: true, message: `Application moved to "${STATUS_LABELS[to]}".` };
}

export async function reviewRequirement(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  requirement: ApplicationRequirement,
  verdict: 'Verified' | 'Rejected',
  remarks: string
): Promise<{ ok: boolean; message: string }> {
  if (requirement.status === 'Missing') {
    return { ok: false, message: 'Nothing has been uploaded for this requirement yet.' };
  }
  if (verdict === 'Rejected' && !remarks.trim()) {
    return { ok: false, message: 'Please explain what needs to be fixed; the applicant will see your remarks.' };
  }
  const timestamp = now();
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id, 'requirements', requirement.id), {
    status: verdict,
    reviewedBy: staff.name,
    reviewedAt: timestamp,
    remarks: remarks.trim(),
  });
  batch.update(doc(db, 'applications', app.id), { updatedAt: timestamp });
  if (verdict === 'Rejected') {
    notifyApplicant(batch, db, app, `Please replace: ${requirement.name}`, `The Admissions Office could not accept "${requirement.name}": ${remarks.trim()}`);
  }
  await batch.commit();
  return { ok: true, message: `"${requirement.name}" marked ${verdict}.` };
}

// Flags specific documents as needing replacement and moves the application to
// "Requirements Incomplete" in one step.
export async function requestMissingRequirements(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  requirements: ApplicationRequirement[],
  flagged: { id: string; remarks: string }[],
  note: string
): Promise<{ ok: boolean; message: string }> {
  if (flagged.length === 0 && !note.trim()) {
    return { ok: false, message: 'Select the documents that are missing or add a note describing what is needed.' };
  }
  // Asking again while already "Requirements Incomplete" is allowed (it just updates the list).
  if (normalizeStatus(app.status) !== 'Requirements Incomplete') {
    const blocker = transitionBlocker(app.status, 'Requirements Incomplete', requirements);
    if (blocker) return { ok: false, message: blocker };
  }

  const timestamp = now();
  const batch = writeBatch(db);
  flagged.forEach((f) => {
    const req = requirements.find((r) => r.id === f.id);
    if (!req) return;
    batch.update(doc(db, 'applications', app.id, 'requirements', f.id), {
      status: req.status === 'Missing' ? 'Missing' : 'Rejected',
      remarks: f.remarks.trim() || 'Please submit this document.',
      reviewedBy: staff.name,
      reviewedAt: timestamp,
    });
  });
  const names = flagged.map((f) => requirements.find((r) => r.id === f.id)?.name).filter(Boolean).join(', ');
  const message = [names ? `Needed: ${names}.` : '', note.trim()].filter(Boolean).join(' ');
  batch.update(doc(db, 'applications', app.id), {
    status: 'Requirements Incomplete',
    updatedAt: timestamp,
    lastDecisionBy: staff.name,
    lastDecisionAt: timestamp,
    applicantMessage: message,
  });
  addHistory(batch, db, app.id, {
    status: 'Requirements Incomplete',
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: message,
  });
  notifyApplicant(batch, db, app, 'Action needed: documents', `Please submit the following so we can continue your application. ${message}`);
  await batch.commit();
  return { ok: true, message: 'Applicant notified of the missing requirements.' };
}

// Applications made before the document checklist existed have none; staff can create it so
// the applicant can upload documents and the workflow checks apply.
// Adds current admission requirements that an application's checklist is missing (for example,
// documents added to the list after the applicant applied). Existing items are left untouched.
export async function addMissingRequirements(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  existing: ApplicationRequirement[],
  templates: RequirementTemplate[]
): Promise<{ ok: boolean; message: string }> {
  const missing = missingRequirements(templates, existing);
  if (missing.length === 0) return { ok: false, message: 'The checklist already has every current requirement.' };
  const batch = writeBatch(db);
  missing.forEach((t, i) => {
    batch.set(doc(db, 'applications', app.id, 'requirements', t.id), {
      id: t.id,
      name: t.name,
      description: t.description,
      required: t.required,
      status: 'Missing',
      applicantUid: app.applicantUid || '',
      order: existing.length + i,
    });
  });
  batch.update(doc(db, 'applications', app.id), { updatedAt: now() });
  addHistory(batch, db, app.id, {
    status: normalizeStatus(app.status),
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: `Added to document checklist: ${missing.map((m) => m.name).join(', ')}.`,
  });
  await batch.commit();
  return { ok: true, message: `Added ${missing.length} document${missing.length === 1 ? '' : 's'} to the checklist.` };
}

export async function createRequirementChecklist(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  templates: RequirementTemplate[]
): Promise<{ ok: boolean; message: string }> {
  const batch = writeBatch(db);
  templates.forEach((t, i) => {
    batch.set(doc(db, 'applications', app.id, 'requirements', t.id), {
      id: t.id,
      name: t.name,
      description: t.description,
      required: t.required,
      status: 'Missing',
      applicantUid: app.applicantUid || '',
      order: i,
    });
  });
  batch.update(doc(db, 'applications', app.id), { updatedAt: now() });
  addHistory(batch, db, app.id, {
    status: normalizeStatus(app.status),
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: 'Document checklist created.',
  });
  await batch.commit();
  return { ok: true, message: 'Document checklist created.' };
}

// Staff may add a requirement for one applicant (e.g. an extra clearance).
export async function addRequirement(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  existing: ApplicationRequirement[],
  name: string,
  required: boolean,
  description: string
): Promise<{ ok: boolean; message: string }> {
  const clean = name.trim();
  if (!clean) return { ok: false, message: 'Enter the name of the requirement.' };
  if (existing.some((r) => r.name.toLowerCase() === clean.toLowerCase())) {
    return { ok: false, message: `"${clean}" is already on this applicant's checklist.` };
  }
  const id = `custom-${Date.now()}`;
  const batch = writeBatch(db);
  batch.set(doc(db, 'applications', app.id, 'requirements', id), {
    id,
    name: clean,
    description: description.trim(),
    required,
    status: 'Missing',
    applicantUid: app.applicantUid || '',
    order: existing.length,
  });
  batch.update(doc(db, 'applications', app.id), { updatedAt: now() });
  addHistory(batch, db, app.id, {
    status: normalizeStatus(app.status),
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: `Added ${required ? 'required' : 'optional'} requirement "${clean}".`,
  });
  notifyApplicant(batch, db, app, 'New requirement added', `The Admissions Office added "${clean}" to your checklist.`);
  await batch.commit();
  return { ok: true, message: `"${clean}" added to the checklist.` };
}

// Corrections to the applicant's details by staff, recorded in the history.
export const EDITABLE_APPLICANT_FIELDS: { key: string; label: string }[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'phone', label: 'Mobile number' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'civilStatus', label: 'Civil status' },
  { key: 'address', label: 'Address' },
  { key: 'programName', label: 'Program' },
  { key: 'churchName', label: 'Home church' },
  { key: 'pastorName', label: 'Senior pastor' },
  { key: 'previousSchool', label: 'Previous school' },
];

export async function updateApplicantDetails(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  changes: Record<string, string>
): Promise<{ ok: boolean; message: string }> {
  const allowed = new Set(EDITABLE_APPLICANT_FIELDS.map((f) => f.key));
  const update: Record<string, string> = {};
  const changedLabels: string[] = [];
  Object.entries(changes).forEach(([k, v]) => {
    if (!allowed.has(k)) return;
    const value = String(v ?? '').trim();
    if (value === String(app[k] ?? '').trim()) return;
    update[k] = value;
    if (k === 'programName') update.program = value;
    changedLabels.push(EDITABLE_APPLICANT_FIELDS.find((f) => f.key === k)!.label);
  });
  if (changedLabels.length === 0) return { ok: false, message: 'No changes to save.' };
  if ('fullName' in update && !update.fullName) return { ok: false, message: 'Full name cannot be empty.' };

  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), { ...update, updatedAt: now() });
  addHistory(batch, db, app.id, {
    status: normalizeStatus(app.status),
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: `Corrected applicant details: ${changedLabels.join(', ')}.`,
  });
  await batch.commit();
  return { ok: true, message: `Updated ${changedLabels.join(', ')}.` };
}

// Step 5: enrollment assessment. Saving it moves the application to "For Payment".
export async function saveAssessment(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  requirements: ApplicationRequirement[],
  input: { units: number; items: FeeLine[]; minimumPayment: number; notes: string },
  payments: ApplicationPayment[] = []
): Promise<{ ok: boolean; message: string }> {
  const current = normalizeStatus(app.status);
  if (current !== 'For Assessment' && current !== 'For Payment') {
    return { ok: false, message: 'Assessments are made once the applicant is "For Assessment".' };
  }
  // Revising after money was verified would lose track of it; record adjustments instead.
  if (payments.some((p) => p.status === 'Verified')) {
    return { ok: false, message: 'A payment has already been verified, so the assessment can no longer be revised. Record any adjustment in the student’s ledger after enrollment.' };
  }
  if (!summarizeRequirements(requirements).allRequiredVerified) {
    return { ok: false, message: 'All required documents must be verified before the assessment.' };
  }
  if (!app.registration?.subjects?.length) {
    return { ok: false, message: 'The student has no academic registration on file. Send the application back to "For Registration" first.' };
  }
  const items = input.items
    .map((i) => ({ name: i.name.trim(), amount: Math.round(Number(i.amount) * 100) / 100 }))
    .filter((i) => i.name);
  if (items.length === 0) return { ok: false, message: 'Add at least one fee line, or use "No payment required".' };
  if (items.some((i) => !Number.isFinite(i.amount) || i.amount < 0)) return { ok: false, message: 'Fee amounts must be zero or more.' };
  const total = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  const minimumPayment = Math.round(Number(input.minimumPayment) * 100) / 100;
  if (!Number.isFinite(minimumPayment) || minimumPayment <= 0 || minimumPayment > total) {
    return { ok: false, message: `The minimum payment must be more than ₱0 and no more than the total (₱${total.toLocaleString()}).` };
  }

  const timestamp = now();
  const assessment: EnrollmentAssessment = {
    units: Number(input.units) || 0,
    items,
    total,
    minimumPayment,
    notes: input.notes.trim(),
    assessedBy: staff.name,
    assessedAt: timestamp,
  };
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), {
    status: 'For Payment',
    assessment,
    paymentStatus: 'Awaiting Payment',
    amountPaidVerified: 0,
    updatedAt: timestamp,
    lastDecisionBy: staff.name,
    lastDecisionAt: timestamp,
  });
  addHistory(batch, db, app.id, {
    status: 'For Payment',
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: `Assessment saved: total ₱${total.toLocaleString()}, minimum payment ₱${minimumPayment.toLocaleString()}.`,
  });
  notifyApplicant(
    batch,
    db,
    app,
    'Enrollment assessment ready',
    `Your assessment totals ₱${total.toLocaleString()}. Please pay at least ₱${minimumPayment.toLocaleString()} and submit your payment details on your application page.`
  );
  await batch.commit();
  return { ok: true, message: 'Assessment saved and the applicant was asked to pay.' };
}

// Step 6 alternative: no payment is required (e.g. full scholarship). A reason is recorded.
export async function waivePayment(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  requirements: ApplicationRequirement[],
  reason: string
): Promise<{ ok: boolean; message: string }> {
  const current = normalizeStatus(app.status);
  if (current !== 'For Assessment' && current !== 'For Payment') {
    return { ok: false, message: 'Payment can only be waived during assessment or payment.' };
  }
  if (!summarizeRequirements(requirements).allRequiredVerified) {
    return { ok: false, message: 'All required documents must be verified first.' };
  }
  if (!app.registration?.subjects?.length) {
    return { ok: false, message: 'The student has no academic registration on file. Send the application back to "For Registration" first.' };
  }
  if (!reason.trim()) return { ok: false, message: 'Please record why no payment is required.' };
  const timestamp = now();
  const assessment: EnrollmentAssessment = app.assessment || {
    units: 0,
    items: [],
    total: 0,
    minimumPayment: 0,
    notes: '',
    assessedBy: staff.name,
    assessedAt: timestamp,
  };
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), {
    status: 'For Enrollment',
    assessment: { ...assessment, notes: [assessment.notes, `Payment waived: ${reason.trim()}`].filter(Boolean).join(' ') },
    paymentStatus: 'Waived',
    paymentWaivedReason: reason.trim(),
    paymentVerifiedBy: staff.name,
    paymentVerifiedAt: timestamp,
    updatedAt: timestamp,
    lastDecisionBy: staff.name,
    lastDecisionAt: timestamp,
  });
  addHistory(batch, db, app.id, {
    status: 'For Enrollment',
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: `No payment required: ${reason.trim()}`,
  });
  notifyApplicant(batch, db, app, 'No payment required', `No payment is required for your enrollment. ${nextStepsFor('For Enrollment')}`);
  await batch.commit();
  return { ok: true, message: 'Payment waived; the applicant is ready for enrollment confirmation.' };
}

// Fields an applicant may change when the Admissions Office returns the application for correction.
export const APPLICANT_CORRECTION_FIELDS: { key: string; label: string }[] = EDITABLE_APPLICANT_FIELDS.filter((f) => f.key !== 'programName');

// Step 2: the applicant corrects their details and sends the application back for review.
export async function resubmitCorrections(
  db: Firestore,
  applicant: Actor,
  app: ApplicationRecord,
  changes: Record<string, string>
): Promise<{ ok: boolean; message: string }> {
  if (normalizeStatus(app.status) !== 'For Correction') {
    return { ok: false, message: 'Corrections can be sent while the application is "For Correction".' };
  }
  const allowed = new Set(APPLICANT_CORRECTION_FIELDS.map((f) => f.key));
  const update: Record<string, string> = {};
  const changedLabels: string[] = [];
  Object.entries(changes).forEach(([k, v]) => {
    if (!allowed.has(k)) return;
    const value = String(v ?? '').trim();
    if (value === String(app[k] ?? '').trim()) return;
    update[k] = value;
    changedLabels.push(APPLICANT_CORRECTION_FIELDS.find((f) => f.key === k)!.label);
  });
  if ('fullName' in update && !update.fullName) return { ok: false, message: 'Full name cannot be empty.' };
  const timestamp = now();
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), { ...update, status: 'Under Review', correctedAt: timestamp, updatedAt: timestamp });
  addHistory(batch, db, app.id, {
    status: 'Under Review',
    previousStatus: app.status,
    actor: 'applicant',
    byName: app.fullName || applicant.name,
    note: changedLabels.length ? `Corrected: ${changedLabels.join(', ')}.` : 'Confirmed details without changes.',
  });
  notifyStaff(batch, db, app, applicant.uid, 'Corrections submitted', `${app.fullName} sent their corrected application back for review${changedLabels.length ? ` (${changedLabels.join(', ')})` : ''}.`);
  await batch.commit();
  return { ok: true, message: 'Thank you. Your corrected application is back with the Admissions Office.' };
}

// Step 5: the admitted student submits their academic registration (program, year level,
// term and subjects). It moves the application to "For Assessment".
export async function submitRegistration(
  db: Firestore,
  applicant: Actor,
  app: ApplicationRecord,
  input: { programId?: string; programName: string; yearLevel: string; academicYear: string; semester: string; subjects: RegisteredSubject[] },
  policy: RegistrationPolicy,
  catalog: CatalogSubject[]
): Promise<{ ok: boolean; message: string }> {
  if (normalizeStatus(app.status) !== 'For Registration') {
    return { ok: false, message: 'Subjects can be chosen once the Registrar opens your registration.' };
  }
  const problem = validateRegistration(input, policy, catalog);
  if (problem) return { ok: false, message: problem };
  const timestamp = now();
  const subjects = input.subjects.map((sub) => ({
    subjectId: sub.subjectId,
    code: sub.code,
    title: sub.title,
    units: Number(sub.units) || 0,
    section: sub.section || '',
    schedule: sub.schedule || '',
    room: sub.room || '',
    instructor: sub.instructor || '',
  }));
  const registration: EnrollmentRegistration = {
    ...(input.programId ? { programId: input.programId } : {}),
    programName: input.programName.trim(),
    yearLevel: input.yearLevel,
    academicYear: input.academicYear,
    semester: input.semester,
    subjects,
    totalUnits: subjects.reduce((sum, sub) => sum + sub.units, 0),
    submittedAt: timestamp,
    submittedBy: app.fullName || applicant.name,
  };
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), { registration, status: 'For Assessment', updatedAt: timestamp });
  addHistory(batch, db, app.id, {
    status: 'For Assessment',
    previousStatus: app.status,
    actor: 'applicant',
    byName: app.fullName || applicant.name,
    note: `Registration: ${registration.yearLevel}, ${registration.semester} AY ${registration.academicYear}; ${subjects.length} subjects, ${registration.totalUnits} units.`,
  });
  notifyStaff(batch, db, app, applicant.uid, 'Registration submitted', `${app.fullName} registered for ${subjects.length} subjects (${registration.totalUnits} units). Ready for assessment.`);
  notifyApplicant(batch, db, app, 'Registration received', nextStepsFor('For Assessment'));
  await batch.commit();
  return { ok: true, message: 'Registration submitted. The Registrar will prepare your assessment.' };
}

// The applicant withdraws their own application (any open stage before enrollment).
export async function withdrawApplication(
  db: Firestore,
  applicant: Actor,
  app: ApplicationRecord,
  reason: string
): Promise<{ ok: boolean; message: string }> {
  if (!isOpenApplication(app.status)) return { ok: false, message: 'This application can no longer be withdrawn.' };
  if (!reason.trim()) return { ok: false, message: 'Please tell us briefly why you are withdrawing.' };
  const timestamp = now();
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), {
    status: 'Withdrawn',
    withdrawnAt: timestamp,
    withdrawalReason: reason.trim(),
    updatedAt: timestamp,
  });
  addHistory(batch, db, app.id, {
    status: 'Withdrawn',
    previousStatus: app.status,
    actor: 'applicant',
    byName: app.fullName || applicant.name,
    note: reason.trim(),
  });
  notifyStaff(batch, db, app, applicant.uid, 'Application withdrawn', `${app.fullName} withdrew application ${app.referenceNumber}: ${reason.trim()}`);
  await batch.commit();
  return { ok: true, message: 'Your application was withdrawn.' };
}

// Draft of the online application form, saved per Google account so it can be finished
// later or on another device (applicationDrafts/{uid}; only the owner can read or write it).
export async function saveApplicationDraft(db: Firestore, uid: string, step: number, data: Record<string, any>): Promise<void> {
  await setDoc(doc(db, 'applicationDrafts', uid), { uid, step, data, updatedAt: now() });
}

export async function loadApplicationDraft(db: Firestore, uid: string): Promise<{ step: number; data: Record<string, any>; updatedAt: string } | null> {
  const snap = await getDoc(doc(db, 'applicationDrafts', uid));
  return snap.exists() ? (snap.data() as any) : null;
}

export async function deleteApplicationDraft(db: Firestore, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'applicationDrafts', uid));
}

// Step 6: the applicant reports a payment for verification.
export async function submitPayment(
  db: Firestore,
  applicant: Actor,
  app: ApplicationRecord,
  input: { amount: number; method: string; referenceNo: string; paidOn: string; proof?: File | null }
): Promise<{ ok: boolean; message: string }> {
  if (normalizeStatus(app.status) !== 'For Payment') {
    return { ok: false, message: 'Payments can be submitted once your assessment is ready.' };
  }
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: 'Enter the amount you paid.' };
  if (!input.method) return { ok: false, message: 'Choose how you paid.' };
  if (input.referenceNo.trim().length < 4) return { ok: false, message: 'Enter the reference or receipt number from your payment.' };
  if (!input.paidOn) return { ok: false, message: 'Enter the date you paid.' };
  if (input.paidOn > new Date().toISOString().slice(0, 10)) return { ok: false, message: 'The payment date cannot be in the future.' };

  let proof: { dataUrl: string; name: string } | null = null;
  if (input.proof) {
    try {
      const prepared = await prepareRequirementFile(input.proof);
      proof = { dataUrl: prepared.dataUrl, name: prepared.name };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'The proof of payment could not be read.' };
    }
  }

  const id = newId('pay');
  const timestamp = now();
  const payment: ApplicationPayment = {
    id,
    applicantUid: applicant.uid,
    amount,
    method: input.method,
    referenceNo: input.referenceNo.trim(),
    paidOn: input.paidOn,
    status: 'Submitted',
    submittedAt: timestamp,
    ...(proof ? { proofDataUrl: proof.dataUrl, proofFileName: proof.name } : {}),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'applications', app.id, 'payments', id), payment);
  batch.update(doc(db, 'applications', app.id), { paymentStatus: 'Submitted', updatedAt: timestamp });
  notifyStaff(batch, db, app, applicant.uid, 'Payment submitted', `${app.fullName} reported a ₱${amount.toLocaleString()} payment via ${input.method} (ref ${payment.referenceNo}).`);
  notifyApplicant(batch, db, app, 'Payment submitted', `We received your payment details (₱${amount.toLocaleString()}, ref ${payment.referenceNo}). The Finance Office will verify it.`);
  await batch.commit();
  return { ok: true, message: 'Payment details submitted for verification.' };
}

// Step 6: staff (Registrar, Admin, Super Admin or Finance) verify or reject a payment. Once
// the verified total reaches the minimum, the application moves to "For Enrollment".
export async function reviewPayment(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  payments: ApplicationPayment[],
  payment: ApplicationPayment,
  verdict: 'Verified' | 'Rejected',
  remarks: string
): Promise<{ ok: boolean; message: string }> {
  if (normalizeStatus(app.status) !== 'For Payment') {
    return { ok: false, message: 'Payments are verified while the application is "For Payment".' };
  }
  if (payment.status !== 'Submitted') return { ok: false, message: 'This payment has already been reviewed.' };
  if (verdict === 'Rejected' && !remarks.trim()) return { ok: false, message: 'Please explain why the payment could not be verified.' };

  const timestamp = now();
  const updatedPayments = payments.map((p) => (p.id === payment.id ? { ...p, status: verdict } : p));
  const verifiedTotal = verifiedPaymentTotal(updatedPayments as ApplicationPayment[]);
  const minimum = Number(app.assessment?.minimumPayment) || 0;
  const cleared = verdict === 'Verified' && minimum > 0 && verifiedTotal >= minimum;
  const stillPending = updatedPayments.some((p) => p.status === 'Submitted');
  const paymentStatus: PaymentStatus = cleared
    ? 'Verified'
    : verifiedTotal > 0
    ? stillPending ? 'Submitted' : 'Partially Paid'
    : stillPending ? 'Submitted' : verdict === 'Rejected' ? 'Rejected' : 'Awaiting Payment';

  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id, 'payments', payment.id), {
    status: verdict,
    reviewedBy: staff.name,
    reviewedAt: timestamp,
    remarks: remarks.trim(),
  });
  batch.update(doc(db, 'applications', app.id), {
    paymentStatus,
    amountPaidVerified: verifiedTotal,
    updatedAt: timestamp,
    ...(cleared
      ? { status: 'For Enrollment', paymentVerifiedBy: staff.name, paymentVerifiedAt: timestamp, lastDecisionBy: staff.name, lastDecisionAt: timestamp }
      : {}),
  });
  addHistory(batch, db, app.id, {
    status: cleared ? 'For Enrollment' : 'For Payment',
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: `Payment ₱${Number(payment.amount).toLocaleString()} (ref ${payment.referenceNo}) ${verdict.toLowerCase()}${remarks.trim() ? `: ${remarks.trim()}` : ''}. Verified total ₱${verifiedTotal.toLocaleString()} of ₱${minimum.toLocaleString()} minimum.`,
  });
  notifyApplicant(
    batch,
    db,
    app,
    verdict === 'Verified' ? 'Payment verified' : 'Payment not verified',
    verdict === 'Verified'
      ? cleared
        ? `Your payment was verified. ${nextStepsFor('For Enrollment')}`
        : `Your payment of ₱${Number(payment.amount).toLocaleString()} was verified. ₱${Math.max(0, minimum - verifiedTotal).toLocaleString()} more is needed to reach the minimum payment.`
      : `We could not verify your payment (ref ${payment.referenceNo}): ${remarks.trim()}`
  );
  await batch.commit();
  return {
    ok: true,
    message: cleared ? 'Payment verified. The applicant is ready for enrollment confirmation.' : `Payment ${verdict.toLowerCase()}.`,
  };
}

// Permanently deletes an application with its documents, payments and status history
// (Firestore does not delete subcollections automatically, and uploaded documents are
// private data). A linked official student record is NOT deleted. The deletion itself is
// recorded in activityLogs.
export async function deleteApplicationCompletely(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord
): Promise<{ ok: boolean; message: string }> {
  const refs = [] as ReturnType<typeof doc>[];
  for (const sub of ['requirements', 'payments', 'history']) {
    const snap = await getDocs(collection(db, 'applications', app.id, sub));
    snap.forEach((d) => refs.push(d.ref));
  }
  // Batches hold up to 500 writes; delete subcollection documents first, the application last.
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  const finalBatch = writeBatch(db);
  finalBatch.delete(doc(db, 'applications', app.id));
  const logId = newId('log');
  // Same shape as store.logActivity entries, so it appears in the admin activity log.
  finalBatch.set(doc(db, 'activityLogs', logId), {
    id: logId,
    timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
    adminName: staff.name,
    adminRole: staff.role || '',
    action: 'DELETE',
    entityType: 'Admission Application',
    entityId: app.id,
    entityName: `${app.fullName || 'Unnamed application'}${app.referenceNumber ? ` (${app.referenceNumber})` : ''}`,
    description: `Deleted application${app.referenceNumber ? ` ${app.referenceNumber}` : ''} with ${refs.length} related record(s).${
      app.studentRecordId ? ` Student record ${app.studentId || app.studentRecordId} was kept.` : ''
    }`,
  });
  await finalBatch.commit();
  return {
    ok: true,
    message: `Application ${app.referenceNumber || app.id} deleted.${app.studentRecordId ? ` The student record ${app.studentId || ''} was kept.` : ''}`,
  };
}

export interface FinalizeOptions {
  academicYear: string;
  semester: string;
  yearLevel: string;
}

export interface FinalizeResult {
  ok: boolean;
  message: string;
  studentId?: string;
  studentRecordId?: string;
  reusedExistingRecord?: boolean;
}

// Assigns the next official Student ID from a counter document. The transaction guarantees
// two staff members finalizing at the same moment never receive the same number.
async function allocateStudentId(db: Firestore, year: number): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = await runTransaction(db, async (tx) => {
      const ref = doc(db, 'systemConfig', 'studentIdCounter');
      const snap = await tx.get(ref);
      const key = String(year);
      const next = ((snap.exists() ? (snap.data() as any)[key] : 0) || 0) + 1;
      tx.set(ref, { [key]: next, updatedAt: now() }, { merge: true });
      return formatStudentId(year, next);
    });
    // Older records used random numbers in the same format; skip any already taken.
    const taken = await getDocs(query(collection(db, 'studentProfiles'), where('studentId', '==', candidate)));
    if (taken.empty) return candidate;
  }
  throw new Error('Could not allocate a unique Student ID. Please try again.');
}

// Finds an existing student record for this applicant so enrollment updates it instead of
// creating a duplicate.
async function findExistingStudentRecord(db: Firestore, app: ApplicationRecord): Promise<{ id: string; data: any } | null> {
  const lookups: [string, string | undefined][] = [
    ['applicationNumber', app.referenceNumber],
    ['authUid', app.applicantUid],
    ['email', app.email?.toLowerCase()],
  ];
  for (const [field, value] of lookups) {
    if (!value) continue;
    const snap = await getDocs(query(collection(db, 'studentProfiles'), where(field, '==', value)));
    if (!snap.empty) return { id: snap.docs[0].id, data: snap.docs[0].data() };
  }
  return null;
}

export async function finalizeEnrollment(
  db: Firestore,
  staff: Actor,
  app: ApplicationRecord,
  requirements: ApplicationRequirement[],
  options: FinalizeOptions,
  payments: ApplicationPayment[] = []
): Promise<FinalizeResult> {
  const blocker = canFinalizeEnrollment(app.status, requirements, {
    assessment: app.assessment,
    paymentStatus: app.paymentStatus,
    registration: app.registration,
  });
  if (blocker) return { ok: false, message: blocker };
  if (!options.academicYear.trim() || !options.semester.trim() || !options.yearLevel.trim()) {
    return { ok: false, message: 'Academic year, semester and year level are required.' };
  }

  const existing = await findExistingStudentRecord(db, app);
  const studentId: string =
    existing?.data?.studentId || (await allocateStudentId(db, parseInt(options.academicYear, 10) || new Date().getFullYear()));
  const recordId = existing?.id || `std-${studentId}`;
  const timestamp = now();

  const verifiedDocs = requirements
    .filter((r) => r.status === 'Verified')
    .map((r) => ({ id: r.id, name: r.name, verifiedBy: r.reviewedBy || '', verifiedAt: r.reviewedAt || '' }));

  const profile = {
    id: recordId,
    studentId,
    applicationNumber: app.referenceNumber,
    referenceNumber: app.referenceNumber,
    authUid: app.applicantUid || existing?.data?.authUid || '',
    fullName: app.fullName,
    name: app.fullName,
    email: (app.email || '').toLowerCase(),
    phone: app.phone || existing?.data?.phone || '',
    dateOfBirth: app.dateOfBirth || app.birthDate || existing?.data?.dateOfBirth || '',
    gender: app.gender || existing?.data?.gender || '',
    civilStatus: app.civilStatus || existing?.data?.civilStatus || '',
    address: app.address || existing?.data?.address || '',
    homeChurch: app.churchName || app.churchAffiliation || existing?.data?.homeChurch || '',
    pastorName: app.pastorName || existing?.data?.pastorName || '',
    mentorName: existing?.data?.mentorName || '',
    avatarUrl: existing?.data?.avatarUrl || '',
    program: app.registration?.programName || app.programName || app.program || '',
    programId: app.registration?.programId || app.programId || '',
    degreeProgram: app.registration?.programName || app.programName || app.program || '',
    yearLevel: options.yearLevel,
    // Subjects from the student's registration, shown in the Student Portal and COR.
    courses: (app.registration?.subjects || []).map((sub: RegisteredSubject) => ({
      id: sub.subjectId,
      code: sub.code,
      title: sub.title,
      units: Number(sub.units) || 0,
      schedule: sub.schedule || '',
      room: sub.room || '',
      instructor: sub.instructor || '',
      status: 'Enrolled',
    })),
    totalUnitsEnrolled: Number(app.registration?.totalUnits) || 0,
    academicYear: options.academicYear,
    semester: options.semester,
    currentSemester: `${options.semester}, AY ${options.academicYear}`,
    enrollmentStatus: 'Enrolled',
    academicStatus: existing?.data?.academicStatus || 'Regular',
    admissionRequirementsVerified: true,
    verifiedAdmissionDocuments: verifiedDocs,
    // Fees and verified payments from the assessment and payment steps.
    tuitionTotal: Number(app.assessment?.total) || 0,
    // The Registrar's itemized assessment, shown on the assessment slip and COR.
    termAssessment: Number(app.assessment?.total) || 0,
    previousBalance: 0,
    termAssessmentLines: (app.assessment?.items || []).map((l: { name: string; amount: number }) => ({ name: l.name, amount: Number(l.amount) || 0 })),
    tuitionPaid: verifiedPaymentTotal(payments),
    tuitionBalance: Math.max(0, (Number(app.assessment?.total) || 0) - verifiedPaymentTotal(payments)),
    paymentStatus:
      app.paymentStatus === 'Waived' || (Number(app.assessment?.total) || 0) <= verifiedPaymentTotal(payments)
        ? 'Paid'
        : 'Partially Paid',
    paymentRecords: payments
      .filter((p) => p.status === 'Verified')
      .map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        referenceNo: p.referenceNo,
        paymentDate: p.paidOn,
        status: 'Verified',
        verifiedBy: p.reviewedBy || '',
        verifiedAt: p.reviewedAt || '',
        description: 'Enrollment payment',
      })),
    // Step 8: Student Portal activation.
    portalAccess: true,
    accountStatus: 'Active',
    portalActivatedAt: timestamp,
    enrolledAt: timestamp,
    enrolledBy: staff.name,
    updatedAt: timestamp,
    ...(existing ? {} : { createdAt: timestamp, subjectHistory: [], practicumEntries: [], documents: [] }),
  };

  const appWithRecord = { ...app, studentRecordId: recordId };
  const batch = writeBatch(db);
  batch.set(doc(db, 'studentProfiles', recordId), profile, { merge: true });
  // Seat counts for the registered subjects (only catalog entries that still exist).
  const subjectIds: string[] = Array.from(new Set<string>((app.registration?.subjects || []).map((sub: RegisteredSubject) => sub.subjectId).filter(Boolean)));
  const existingSubjects = await Promise.all(subjectIds.map((id) => getDoc(doc(db, 'academicSubjects', id)).then((snap) => (snap.exists() ? id : null)).catch(() => null)));
  existingSubjects.filter(Boolean).forEach((id) => batch.update(doc(db, 'academicSubjects', id as string), { enrolledCount: increment(1) }));
  batch.update(doc(db, 'applications', app.id), {
    status: 'Enrolled',
    studentId,
    studentRecordId: recordId,
    enrolledAt: timestamp,
    enrollmentConfirmation: {
      studentId,
      confirmedAt: timestamp,
      confirmedBy: staff.name,
      academicYear: options.academicYear,
      semester: options.semester,
      yearLevel: options.yearLevel,
      programName: app.registration?.programName || app.programName || app.program || '',
      totalUnits: Number(app.registration?.totalUnits) || 0,
      subjectCount: (app.registration?.subjects || []).length,
    },
    updatedAt: timestamp,
    lastDecisionBy: staff.name,
    lastDecisionAt: timestamp,
  });
  addHistory(batch, db, app.id, {
    status: 'Enrolled',
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role,
    note: `Enrolled for ${options.semester}, AY ${options.academicYear} (${options.yearLevel}). Student ID ${studentId}.`,
  });
  notifyApplicant(
    batch,
    db,
    appWithRecord,
    'You are officially enrolled — Student Portal activated',
    `Welcome to PCM! Your Student ID is ${studentId}. ${nextStepsFor('Enrolled')}`
  );
  await batch.commit();

  return {
    ok: true,
    message: existing
      ? `Enrollment confirmed. Existing student record ${studentId} was updated (no duplicate created).`
      : `Enrollment confirmed. Student record ${studentId} created.`,
    studentId,
    studentRecordId: recordId,
    reusedExistingRecord: !!existing,
  };
}
