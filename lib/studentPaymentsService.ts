// Payments students report against their balance after enrollment. A report never changes the
// balance by itself: it is stored in studentPayments/{id} as "Submitted", and only a payment
// staff member (Registrar, Admin, Super Admin or Finance) can verify it. Verification updates the
// student record's paid amount, balance and payment records in one transaction.
// firestore.rules enforces the same: students create their own "Submitted" reports only.

import { Firestore, doc, runTransaction, writeBatch } from 'firebase/firestore';
import type { StudentBalancePayment, StudentProfile } from './types';
import { prepareRequirementFile } from './admissionsService';

interface Actor {
  uid: string;
  name: string;
  role?: string;
}

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function balanceOf(profile: Pick<StudentProfile, 'tuitionTotal' | 'tuitionPaid' | 'tuitionBalance'>): number {
  if (typeof profile.tuitionBalance === 'number') return Math.max(0, profile.tuitionBalance);
  return Math.max(0, (Number(profile.tuitionTotal) || 0) - (Number(profile.tuitionPaid) || 0));
}

export async function submitBalancePayment(
  db: Firestore,
  student: Actor,
  profile: StudentProfile,
  pendingTotal: number,
  input: { amount: number; method: string; referenceNo: string; paidOn: string; proof?: File | null }
): Promise<{ ok: boolean; message: string }> {
  const balance = balanceOf(profile);
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (balance <= 0) return { ok: false, message: 'Your account has no outstanding balance.' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: 'Enter the amount you paid.' };
  if (amount + pendingTotal > balance + 0.009) {
    return {
      ok: false,
      message: `This is more than your balance of ₱${balance.toLocaleString()}${pendingTotal ? ` (₱${pendingTotal.toLocaleString()} is already waiting for verification)` : ''}.`,
    };
  }
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

  const id = newId('spay');
  const timestamp = now();
  const payment: StudentBalancePayment = {
    id,
    studentRecordId: profile.id,
    studentId: profile.studentId,
    studentUid: student.uid,
    studentName: profile.fullName || profile.name || student.name,
    amount,
    method: input.method,
    referenceNo: input.referenceNo.trim(),
    paidOn: input.paidOn,
    term: profile.currentSemester || '',
    status: 'Submitted',
    submittedAt: timestamp,
    ...(proof ? { proofDataUrl: proof.dataUrl, proofFileName: proof.name } : {}),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'studentPayments', id), payment);
  const staffId = newId('staff');
  batch.set(doc(db, 'staffNotifications', staffId), {
    id: staffId,
    // Not an admissions application; the payment is reviewed under Enrollment & Records → Student Payments.
    applicationId: '',
    referenceNumber: profile.studentId,
    title: 'Balance payment submitted',
    message: `${payment.studentName} (${profile.studentId}) reported a ₱${amount.toLocaleString()} payment via ${input.method} (ref ${payment.referenceNo}).`,
    createdByUid: student.uid,
    read: false,
    createdAt: timestamp,
  });
  await batch.commit();
  return { ok: true, message: 'Payment reported. The Finance Office will verify it; your balance updates once it is verified.' };
}

export async function reviewBalancePayment(
  db: Firestore,
  staff: Actor,
  payment: StudentBalancePayment,
  verdict: 'Verified' | 'Rejected',
  remarks: string
): Promise<{ ok: boolean; message: string }> {
  if (verdict === 'Rejected' && !remarks.trim()) return { ok: false, message: 'Please give the reason for rejecting this payment; the student will see it.' };
  const timestamp = now();
  return runTransaction(db, async (tx) => {
    const paymentRef = doc(db, 'studentPayments', payment.id);
    const profileRef = doc(db, 'studentProfiles', payment.studentRecordId);
    const [paySnap, profileSnap] = await Promise.all([tx.get(paymentRef), tx.get(profileRef)]);
    if (!paySnap.exists() || (paySnap.data() as StudentBalancePayment).status !== 'Submitted') {
      return { ok: false, message: 'This payment has already been reviewed.' };
    }
    if (!profileSnap.exists()) return { ok: false, message: 'The student record for this payment was not found.' };
    const profile = profileSnap.data() as StudentProfile;

    tx.update(paymentRef, { status: verdict, reviewedBy: staff.name, reviewedAt: timestamp, remarks: remarks.trim() });
    let message = '';
    if (verdict === 'Verified') {
      const paid = Math.round(((Number(profile.tuitionPaid) || 0) + payment.amount) * 100) / 100;
      const balance = Math.max(0, Math.round(((Number(profile.tuitionTotal) || 0) - paid) * 100) / 100);
      const record = {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        referenceNo: payment.referenceNo,
        paymentDate: payment.paidOn,
        status: 'Verified',
        verifiedBy: staff.name,
        verifiedAt: timestamp,
        description: 'Balance payment',
      };
      tx.update(profileRef, {
        tuitionPaid: paid,
        tuitionBalance: balance,
        paymentStatus: balance <= 0 ? 'Paid' : 'Partially Paid',
        paymentRecords: [...((profile as any).paymentRecords || []), record],
        updatedAt: timestamp,
      });
      message = `Payment of ₱${payment.amount.toLocaleString()} verified. New balance: ₱${balance.toLocaleString()}.`;
    } else {
      message = 'Payment rejected; the student was told why.';
    }
    const notifId = newId('notif');
    tx.set(doc(db, 'studentNotifications', notifId), {
      id: notifId,
      studentId: payment.studentRecordId,
      recipientUid: payment.studentUid,
      title: verdict === 'Verified' ? 'Payment verified' : 'Payment not verified',
      message:
        verdict === 'Verified'
          ? `Your payment of ₱${payment.amount.toLocaleString()} (ref ${payment.referenceNo}) was verified and posted to your account.`
          : `Your payment report of ₱${payment.amount.toLocaleString()} (ref ${payment.referenceNo}) could not be verified: ${remarks.trim()}`,
      type: 'payment',
      read: false,
      createdAt: timestamp,
      linkSection: 'portal',
    });
    return { ok: true, message };
  });
}
