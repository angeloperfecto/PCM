// Correcting or removing a student's payment (Super Admin, Admin, Registrar), e.g. a wrong amount or reference.
//
// A payment can be written down in up to three places: the student record's ledger (paymentHistory for cashier
// receipts, paymentRecords for verified enrollment/balance payments, with the running tuitionPaid / tuitionBalance),
// the balance-payment report (studentPayments/{id}) and the admission application's payment
// (applications/{appId}/payments/{id}). Every copy is changed together and the student's paid total and balance
// follow, so all screens agree. Each change needs a reason, kept with the payment and in the activity log.

import { Firestore, collection, doc, getDoc, getDocs, query, runTransaction, where, writeBatch } from 'firebase/firestore';
import { normalizeStatus, verifiedPaymentTotal, type ApplicationPayment } from './enrollmentWorkflow';
import type { StudentProfile } from './types';

export interface PaymentEdit {
  amount: number;
  method: string;
  referenceNo: string;
  paidOn: string;
}

export interface Actor {
  uid: string;
  name: string;
  role?: string;
}

const EDITOR_ROLES = ['Super Admin', 'Admin', 'Registrar'];
/** Who may correct or delete payments (Finance verifies them; corrections stay with the Registrar and Admins). */
export const canEditPayments = (role?: string) => EDITOR_ROLES.includes(String(role || ''));

const round = (n: number) => Math.round(n * 100) / 100;
const now = () => new Date().toISOString();

export function checkPaymentEdit(edit: PaymentEdit | null, reason: string): string | null {
  if (reason.trim().length < 5) return 'Please give the reason for this change (at least 5 characters).';
  if (!edit) return null;
  if (!Number.isFinite(edit.amount) || edit.amount <= 0) return 'Enter the correct amount (more than ₱0).';
  if (!edit.method.trim()) return 'Choose how it was paid.';
  if (!edit.referenceNo.trim()) return 'Enter the reference or receipt number.';
  if (!edit.paidOn) return 'Enter the date it was paid.';
  if (edit.paidOn > new Date().toISOString().slice(0, 10)) return 'The payment date cannot be in the future.';
  return null;
}

/**
 * Edits (edit) or deletes (edit = null) a payment of an enrolled student, wherever it is recorded, and keeps the
 * student's paid total and balance right.
 */
export async function correctStudentPayment(
  db: Firestore,
  staff: Actor,
  studentRecordId: string,
  paymentId: string,
  edit: PaymentEdit | null,
  reason: string
): Promise<{ ok: boolean; message: string; summary?: string }> {
  const problem = checkPaymentEdit(edit, reason);
  if (problem) return { ok: false, message: problem };
  const amount = edit ? round(edit.amount) : 0;
  const stamp = { editedBy: staff.name, editedAt: now(), editReason: reason.trim() };

  // The admission application(s) of this student, to find an enrollment payment with the same id.
  const apps = new Map<string, true>();
  for (const field of ['studentRecordId', 'linkedStudentRecordId']) {
    const snap = await getDocs(query(collection(db, 'applications'), where(field, '==', studentRecordId)));
    snap.docs.forEach((d) => apps.set(d.id, true));
  }
  let appPaymentRef: ReturnType<typeof doc> | null = null;
  let appRef: ReturnType<typeof doc> | null = null;
  for (const appId of apps.keys()) {
    const ref = doc(db, 'applications', appId, 'payments', paymentId);
    if ((await getDoc(ref)).exists()) {
      appPaymentRef = ref;
      appRef = doc(db, 'applications', appId);
      break;
    }
  }
  // The application's verified total after the change, added up from its payments.
  let appVerifiedAfter = 0;
  if (appRef) {
    const all = (await getDocs(collection(db, 'applications', appRef.id, 'payments'))).docs.map((d) => ({ ...(d.data() as ApplicationPayment), id: d.id }));
    const after = edit ? all.map((p) => (p.id === paymentId ? { ...p, amount: round(edit.amount) } : p)) : all.filter((p) => p.id !== paymentId);
    appVerifiedAfter = round(verifiedPaymentTotal(after));
  }

  return runTransaction(db, async (tx) => {
    const profileRef = doc(db, 'studentProfiles', studentRecordId);
    const reportRef = doc(db, 'studentPayments', paymentId);
    const [profileSnap, reportSnap, appPaySnap, appSnap] = await Promise.all([
      tx.get(profileRef),
      tx.get(reportRef),
      appPaymentRef ? tx.get(appPaymentRef) : Promise.resolve(null),
      appRef ? tx.get(appRef) : Promise.resolve(null),
    ]);
    if (!profileSnap.exists()) return { ok: false, message: 'The student record was not found.' };
    const profile = profileSnap.data() as StudentProfile & { paymentRecords?: any[] };
    const history: any[] = Array.isArray(profile.paymentHistory) ? (profile.paymentHistory as any[]) : [];
    const records: any[] = Array.isArray(profile.paymentRecords) ? profile.paymentRecords : [];
    const inHistory = history.find((p) => p?.id === paymentId);
    const inRecords = records.find((p) => p?.id === paymentId);
    const onRecord = inHistory || inRecords;
    if (!onRecord && !reportSnap.exists() && !appPaySnap?.exists()) return { ok: false, message: 'This payment was not found.' };

    const before = onRecord || reportSnap.data() || appPaySnap?.data() || {};
    const oldAmount = Number(before.amount) || 0;
    const counted = (p: any) => !!p && (!p.status || p.status === 'Verified');
    const oldCounted = onRecord && counted(onRecord) ? oldAmount : 0;
    const newCounted = edit && onRecord && counted(onRecord) ? amount : 0;

    // The student record (ledger and running totals).
    if (onRecord) {
      const patchHistory = (p: any) =>
        edit ? { ...p, amount, paymentMethod: edit.method, referenceNumber: edit.referenceNo.trim(), paymentDate: edit.paidOn, ...stamp } : p;
      const patchRecord = (p: any) => (edit ? { ...p, amount, method: edit.method, referenceNo: edit.referenceNo.trim(), paymentDate: edit.paidOn, ...stamp } : p);
      const paid = Math.max(0, round((Number(profile.tuitionPaid) || 0) - oldCounted + newCounted));
      const balance = Math.max(0, round((Number(profile.tuitionTotal) || 0) - paid));
      tx.update(profileRef, {
        ...(inHistory ? { paymentHistory: edit ? history.map((p) => (p?.id === paymentId ? patchHistory(p) : p)) : history.filter((p) => p?.id !== paymentId) } : {}),
        ...(inRecords ? { paymentRecords: edit ? records.map((p) => (p?.id === paymentId ? patchRecord(p) : p)) : records.filter((p) => p?.id !== paymentId) } : {}),
        tuitionPaid: paid,
        tuitionBalance: balance,
        paymentStatus: balance <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid',
        updatedAt: now(),
      });
    }
    // The balance-payment report.
    if (reportSnap.exists()) {
      if (edit) tx.update(reportRef, { amount, method: edit.method, referenceNo: edit.referenceNo.trim(), paidOn: edit.paidOn, ...stamp });
      else tx.delete(reportRef);
    }
    // The admission application's payment, and its verified total.
    if (appPaymentRef && appPaySnap?.exists() && appRef && appSnap?.exists()) {
      if (edit) tx.update(appPaymentRef, { amount, method: edit.method, referenceNo: edit.referenceNo.trim(), paidOn: edit.paidOn, ...stamp });
      else tx.delete(appPaymentRef);
      if (appPaySnap.data().status === 'Verified') tx.update(appRef, { amountPaidVerified: appVerifiedAfter, updatedAt: now() });
    }
    const what = edit
      ? `Payment ${paymentId} changed from ₱${oldAmount.toLocaleString()} to ₱${amount.toLocaleString()} (${edit.method}, ref ${edit.referenceNo.trim()}, paid ${edit.paidOn})`
      : `Payment ${paymentId} of ₱${oldAmount.toLocaleString()} (ref ${before.referenceNo || before.referenceNumber || '—'}) deleted`;
    return {
      ok: true,
      message: edit ? 'Payment corrected. The student’s balance was updated.' : 'Payment deleted. The student’s balance was updated.',
      summary: `${what}. Reason: ${reason.trim()}`,
    };
  });
}

/**
 * Edits (edit) or deletes (edit = null) a payment of an admission application that is not yet enrolled, and
 * updates its verified total. At "Pending Payment" a corrected total that now covers the downpayment moves the
 * applicant to Final Verification, like verifying a payment does.
 */
export async function correctApplicationPayment(
  db: Firestore,
  staff: Actor,
  app: { id: string; status: string; assessment?: { minimumPayment?: number } | null; paymentStatus?: string },
  payments: ApplicationPayment[],
  paymentId: string,
  edit: PaymentEdit | null,
  reason: string
): Promise<{ ok: boolean; message: string }> {
  const problem = checkPaymentEdit(edit, reason);
  if (problem) return { ok: false, message: problem };
  const status = normalizeStatus(app.status);
  if (status === 'Enrolled') return { ok: false, message: 'This student is enrolled; correct the payment in the student’s account.' };
  const target = payments.find((p) => p.id === paymentId);
  if (!target) return { ok: false, message: 'This payment was not found.' };
  const amount = edit ? round(edit.amount) : 0;
  const after = edit ? payments.map((p) => (p.id === paymentId ? { ...p, amount } : p)) : payments.filter((p) => p.id !== paymentId);
  const verified = round(verifiedPaymentTotal(after));
  const minimum = Number(app.assessment?.minimumPayment) || 0;
  const pending = after.some((p) => p.status === 'Submitted');
  const accepted = app.paymentStatus === 'Waived';
  const cleared = minimum > 0 && verified >= minimum;
  const timestamp = now();
  const stamp = { editedBy: staff.name, editedAt: timestamp, editReason: reason.trim() };

  const batch = writeBatch(db);
  const payRef = doc(db, 'applications', app.id, 'payments', paymentId);
  if (edit) batch.update(payRef, { amount, method: edit.method, referenceNo: edit.referenceNo.trim(), paidOn: edit.paidOn, ...stamp });
  else batch.delete(payRef);
  const moveOn = status === 'For Payment' && cleared && !pending;
  batch.update(doc(db, 'applications', app.id), {
    amountPaidVerified: verified,
    ...(accepted
      ? {}
      : { paymentStatus: cleared ? 'Verified' : verified > 0 ? (pending ? 'Submitted' : 'Partially Paid') : pending ? 'Submitted' : 'Awaiting Payment' }),
    ...(moveOn ? { status: 'For Enrollment', paymentVerifiedBy: staff.name, paymentVerifiedAt: timestamp, lastDecisionBy: staff.name, lastDecisionAt: timestamp } : {}),
    updatedAt: timestamp,
  });
  const histId = `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  batch.set(doc(db, 'applications', app.id, 'history', histId), {
    id: histId,
    status: moveOn ? 'For Enrollment' : status,
    previousStatus: app.status,
    actor: 'staff',
    byName: staff.name,
    byRole: staff.role || '',
    note: `${edit ? `Payment ₱${Number(target.amount).toLocaleString()} (ref ${target.referenceNo}) corrected to ₱${amount.toLocaleString()} (${edit.method}, ref ${edit.referenceNo.trim()})` : `Payment ₱${Number(target.amount).toLocaleString()} (ref ${target.referenceNo}) deleted`}: ${reason.trim()}. Verified total ₱${verified.toLocaleString()} of ₱${minimum.toLocaleString()} minimum.`,
    at: timestamp,
  });
  await batch.commit();
  const belowNow = status === 'For Enrollment' && !accepted && !cleared;
  return {
    ok: true,
    message: `${edit ? 'Payment corrected' : 'Payment deleted'}.${moveOn ? ' The downpayment is complete, so the applicant moved to Final Verification.' : ''}${
      belowNow ? ' The verified payments no longer cover the downpayment, so enrollment can’t be finalized until more is paid (move the application back to For Assessment to continue to Payment).' : ''
    }`,
  };
}
