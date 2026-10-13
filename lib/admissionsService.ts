// Firestore operations for the admission-to-enrollment workflow. Every write here is also
// checked by firestore.rules: applicants can only create and update their own application
// and documents, and only enrollment staff (Registrar, Admin, Super Admin) can make
// decisions, verify documents or create official student records.

import {
  Firestore,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import { blobToDataUrl, compressImageFile } from './firebase';
import {
  ApplicationRequirement,
  RequirementTemplate,
  WorkflowStatus,
  applicantResubmissionStatus,
  canFinalizeEnrollment,
  formatStudentId,
  isOpenApplication,
  nextStepsFor,
  normalizeStatus,
  summarizeRequirements,
  transitionBlocker,
  validateRequirementFile,
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
  if (!isOpenApplication(app.status)) {
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
  const blocker = transitionBlocker(app.status, to, requirements);
  if (blocker) return { ok: false, message: blocker };
  if ((to === 'Rejected' || to === 'Deferred' || to === 'Requirements Incomplete') && !note.trim()) {
    return { ok: false, message: 'Please add a note explaining this decision; the applicant will see it.' };
  }

  const timestamp = now();
  const batch = writeBatch(db);
  batch.update(doc(db, 'applications', app.id), {
    status: to,
    updatedAt: timestamp,
    lastDecisionBy: staff.name,
    lastDecisionAt: timestamp,
    ...(note.trim() ? { applicantMessage: note.trim() } : {}),
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
    `Application status: ${to}`,
    `${nextStepsFor(to, summary)}${note.trim() ? ` Note from the Admissions Office: ${note.trim()}` : ''}`
  );
  await batch.commit();
  return { ok: true, message: `Application moved to "${to}".` };
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
  options: FinalizeOptions
): Promise<FinalizeResult> {
  const blocker = canFinalizeEnrollment(app.status, requirements);
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
    program: app.programName || app.program || '',
    programId: app.programId || '',
    degreeProgram: app.programName || app.program || '',
    yearLevel: options.yearLevel,
    academicYear: options.academicYear,
    semester: options.semester,
    currentSemester: `${options.semester}, AY ${options.academicYear}`,
    enrollmentStatus: 'Enrolled',
    academicStatus: existing?.data?.academicStatus || 'Regular',
    admissionRequirementsVerified: true,
    verifiedAdmissionDocuments: verifiedDocs,
    enrolledAt: timestamp,
    enrolledBy: staff.name,
    updatedAt: timestamp,
    ...(existing ? {} : { createdAt: timestamp, courses: [], subjectHistory: [], practicumEntries: [], documents: [] }),
  };

  const appWithRecord = { ...app, studentRecordId: recordId };
  const batch = writeBatch(db);
  batch.set(doc(db, 'studentProfiles', recordId), profile, { merge: true });
  batch.update(doc(db, 'applications', app.id), {
    status: 'Enrolled',
    studentId,
    studentRecordId: recordId,
    enrolledAt: timestamp,
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
    'You are officially enrolled',
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
