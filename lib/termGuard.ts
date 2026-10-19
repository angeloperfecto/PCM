// Last check before a student's enrollment request is saved: the term and subjects are read again
// directly from the database (inside a read-only transaction, which never uses the page's live copy),
// so a change the Registrar made a moment ago (closing the window, changing the active term, closing
// or removing a subject) is never missed.

import { collection, doc, getDocs, runTransaction, type Firestore } from 'firebase/firestore';
import { addDropWindowOpen, enrollmentWindowOpen, normAY, preEnlistmentWindowOpen, semesterKind, termLabel, todayPH, windowNote } from './reenrollment';
import { isTermOffering } from './termSubjects';
import type { AcademicPeriod, AcademicSubject } from './types';

export type TermWindow = 'enrollment' | 'preEnlistment' | 'addDrop';

const sameTermRef = (p: Partial<AcademicPeriod>, t: { semester?: string; academicYear?: string }) =>
  normAY(p.academicYear) === normAY(t.academicYear) &&
  (semesterKind(p.semester) || String(p.semester || '').trim()) === (semesterKind(t.semester) || String(t.semester || '').trim());

/** '' when the request may be saved, otherwise a message for the student. */
export async function checkTermBeforeSubmit(
  db: Firestore,
  term: { id?: string; semester?: string; academicYear?: string },
  window: TermWindow,
  offeringIds: string[] = []
): Promise<string> {
  const label = termLabel(term.semester, term.academicYear);
  // Which term document: the one passed in, else found by semester and academic year.
  let periodId = term.id || '';
  if (!periodId) {
    try {
      const snap = await getDocs(collection(db, 'academicPeriods'));
      periodId = snap.docs.find((d) => sameTermRef(d.data() as AcademicPeriod, term))?.id || '';
    } catch {
      return 'We could not confirm the enrollment schedule. Please check your connection and try again.';
    }
    if (!periodId) return `${label} is no longer an academic term. Please refresh the page.`;
  }
  const ids = Array.from(new Set(offeringIds.filter(Boolean)));
  try {
    return await runTransaction(db, async (tx) => {
      const ps = await tx.get(doc(db, 'academicPeriods', periodId));
      if (!ps.exists()) return `${label} is no longer an academic term. Please refresh the page.`;
      const period = { id: ps.id, ...ps.data() } as AcademicPeriod;
      if (!sameTermRef(period, term)) return `The Registrar changed this term to ${termLabel(period.semester, period.academicYear)}. Please review your enrollment.`;
      const today = todayPH();
      if (period.closedAt) return `${label} has been closed by the Registrar.`;
      const ok =
        window === 'enrollment' ? enrollmentWindowOpen(period, today) : window === 'preEnlistment' ? preEnlistmentWindowOpen(period, today) : addDropWindowOpen(period, today);
      if (!ok) {
        const [status, start, end, name] =
          window === 'enrollment'
            ? [period.enrollmentStatus, period.enrollmentStartDate, period.enrollmentEndDate, 'Enrollment']
            : window === 'preEnlistment'
              ? [period.preEnlistmentStatus, period.preEnlistmentStartDate, period.preEnlistmentEndDate, 'Pre-enlistment']
              : [period.addDropStatus, period.addDropStartDate, period.addDropEndDate, 'Adding & dropping'];
        return `${name} for ${label} is not open: ${windowNote(status, start, end, today)}`;
      }
      // Subjects: still offered in this term and open (ids that aren't catalog offerings are skipped).
      for (const id of ids) {
        const snap = await tx.get(doc(db, 'academicSubjects', id));
        if (!snap.exists()) continue;
        const o = { id: snap.id, ...snap.data() } as AcademicSubject;
        if (o.isArchived) return `${o.code} is no longer offered in ${label}. Please choose your subjects again.`;
        if (o.academicYear && !isTermOffering(o, term)) return `${o.code} is not offered in ${label}. Please choose your subjects again.`;
        if (o.status === 'Closed') return `${o.code}${o.section ? ` (${o.section})` : ''} was closed by the Registrar. Please choose another subject or section.`;
      }
      return '';
    });
  } catch {
    return 'We could not confirm the enrollment schedule. Please check your connection and try again.';
  }
}
