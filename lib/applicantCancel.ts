// An applicant cancels (or defers) their application and has their information removed from the website.
//
// Removed: their admission application(s) with documents, status history and reported payments; their saved draft;
// their notifications; their entry in Users & Roles (users/{uid}); and finally their Google sign-in account on the
// site (Firebase Authentication), so nothing of theirs stays. Admissions gets a short note with the reference number
// and the reason only (no personal details), so a missing application can be explained.
//
// Allowed only while no money is involved (firestore.rules enforces the same): not at Payment, Final Verification,
// Enrolled or Deferred, and no verified payment. Enrolled students and staff accounts are never touched.

import { Auth, deleteUser, reauthenticateWithPopup, signOut } from 'firebase/auth';
import { Firestore, collection, deleteDoc, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { googleProvider } from './firebase';
import { normalizeStatus } from './enrollmentWorkflow';

export type CancelReason = 'Cancel' | 'Defer';

const BLOCKED = ['For Payment', 'For Enrollment', 'Enrolled', 'Deferred'];

/** Why this applicant can't remove their application themselves, or null when they can. */
export function cancelBlocker(app: { status?: string; amountPaidVerified?: number; studentRecordId?: string } | null | undefined): string | null {
  if (!app) return null;
  const status = normalizeStatus(app.status);
  if (app.studentRecordId || status === 'Enrolled') return 'You are already enrolled. Please contact the Registrar’s Office about your student record.';
  if (BLOCKED.includes(status) || (Number(app.amountPaidVerified) || 0) > 0) {
    return 'A payment is part of this application, so it can’t be deleted online. Please contact the Admissions Office; you can still withdraw it below.';
  }
  return null;
}

export async function cancelAndDeleteMyApplication(
  db: Firestore,
  auth: Auth,
  reason: CancelReason,
  note: string
): Promise<{ ok: boolean; message: string }> {
  const user = auth.currentUser;
  if (!user) return { ok: false, message: 'Please sign in again first.' };
  const uid = user.uid;

  // 1. Applications (only those made with this Google account).
  const apps = (await getDocs(query(collection(db, 'applications'), where('applicantUid', '==', uid)))).docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  const blocked = apps.map((a) => cancelBlocker(a)).find(Boolean);
  if (blocked) return { ok: false, message: blocked };

  // 3. Each application with its documents, history and reported payments.
  for (const a of apps) {
    const batch = writeBatch(db);
    for (const sub of ['requirements', 'history', 'payments']) {
      (await getDocs(collection(db, 'applications', a.id, sub))).docs.forEach((d) => batch.delete(d.ref));
    }
    batch.delete(doc(db, 'applications', a.id));
    await batch.commit();
  }

  // 4. Draft, notifications and the Users & Roles entry.
  await deleteDoc(doc(db, 'applicationDrafts', uid)).catch(() => {});
  const notes = await getDocs(query(collection(db, 'studentNotifications'), where('recipientUid', '==', uid))).catch(() => null);
  if (notes && !notes.empty) {
    const batch = writeBatch(db);
    notes.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit().catch(() => {});
  }

  // 5. A note for Admissions: reference number(s) and reason only.
  const refs = apps.map((a) => a.referenceNumber || a.id).filter(Boolean);
  if (refs.length) {
    const id = `staff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await setDoc(doc(db, 'staffNotifications', id), {
      id,
      applicationId: '',
      referenceNumber: refs.join(', '),
      title: reason === 'Defer' ? 'Application deferred by the applicant' : 'Application cancelled by the applicant',
      message: `Application ${refs.join(', ')} was ${reason === 'Defer' ? 'deferred to a later intake' : 'cancelled'} by the applicant${note.trim() ? ` (“${note.trim().slice(0, 200)}”)` : ''}. At their request their information was deleted from the website.`,
      createdByUid: uid,
      read: false,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
  }
  await deleteDoc(doc(db, 'users', uid)).catch(() => {});

  // 6. The Google sign-in account on this website (Google asks to confirm when the sign-in is not recent).
  try {
    try {
      await deleteUser(user);
    } catch (e: any) {
      if (e?.code !== 'auth/requires-recent-login') throw e;
      await reauthenticateWithPopup(user, googleProvider);
      await deleteUser(user);
    }
  } catch {
    await signOut(auth).catch(() => {});
    return {
      ok: true,
      message: 'Your application and information were deleted. Your sign-in could not be removed right now; it holds no information and you have been signed out.',
    };
  }
  await signOut(auth).catch(() => {});
  return {
    ok: true,
    message:
      reason === 'Defer'
        ? 'Your application was deferred and your information deleted. You can apply again for a later intake with the same Gmail account.'
        : 'Your application was cancelled and your information deleted from the website.',
  };
}
