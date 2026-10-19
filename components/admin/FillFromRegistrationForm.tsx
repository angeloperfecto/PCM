'use client';

import React, { useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { FileInput } from 'lucide-react';
import { db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import { missingDetailsWithCount } from '@/lib/profileFromApplication';
import type { StudentProfile } from '@/lib/types';

/** The admission application this student record was created from (or linked to). */
export function applicationForStudent(applications: any[], s: StudentProfile): any | undefined {
  const ref = s.applicationNumber || (s as any).referenceNumber;
  return applications.find(
    (a) => a.studentRecordId === s.id || a.linkedStudentRecordId === s.id || (ref && a.referenceNumber === ref)
  );
}

// For records finalized before every registration answer was copied over: fills only the details
// still empty on the student record from that student's own registration form. Nothing is overwritten.
export const FillFromRegistrationForm: React.FC<{ student: StudentProfile }> = ({ student }) => {
  const { applications, addToast, logActivity } = usePCM();
  const [saving, setSaving] = useState(false);
  const app = useMemo(() => applicationForStudent(applications as any[], student), [applications, student]);
  const { fill: missing, count } = useMemo(() => (app ? missingDetailsWithCount(student as any, app) : { fill: {}, count: 0 }), [app, student]);
  if (!app || count === 0) return null;

  const fill = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'studentProfiles', student.id), { ...missing, updatedAt: new Date().toISOString() });
      logActivity('UPDATE', 'Student Profile', student.id, student.fullName || student.studentId, `Filled ${count} empty detail(s) from registration form ${app.referenceNumber || app.id}.`);
      addToast('success', 'Details filled in', `${count} empty detail${count === 1 ? '' : 's'} copied from the registration form.`);
    } catch (err: any) {
      addToast('error', 'Not saved', err?.code === 'permission-denied' ? 'Your account cannot change student records.' : 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950" data-testid="fill-from-form">
      <p>
        <strong>{count} answer{count === 1 ? '' : 's'}</strong> from registration form {app.referenceNumber || app.id}{' '}
        {count === 1 ? 'is' : 'are'} not on this record yet. Copying fills only empty details; nothing already on the record changes.
      </p>
      <button
        type="button"
        onClick={fill}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-sky-800 px-3 py-1.5 font-bold text-white hover:bg-sky-900 disabled:opacity-60"
      >
        <FileInput className="h-3.5 w-3.5" /> {saving ? 'Copying…' : 'Copy missing details'}
      </button>
    </div>
  );
};
