'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { ArrowUpCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import { programForStudent, subjectsForProgram } from '@/lib/curriculum';
import { completedYearLevelPromotion } from '@/lib/reenrollment';
import type { CurriculumOf } from '@/lib/grades';
import type { StudentProfile } from '@/lib/types';

/** Each student's program curriculum (Academic Programs → Subjects per Year Level). */
export function useCurriculumOf(): CurriculumOf {
  const { programs, curriculumSubjects } = usePCM();
  return useCallback((s: StudentProfile) => subjectsForProgram(curriculumSubjects || [], programForStudent(programs || [], s)), [programs, curriculumSubjects]);
}

const inactive = (s: StudentProfile) => s.isArchived || /alumni|graduat|withdrawn|dropped/i.test(String(s.academicStatus || s.enrollmentStatus || ''));

// Students who have completed every subject of their year level (e.g. all 1st Year subjects) but are still
// in that year level, e.g. because their grades were published before year levels moved up automatically.
// New grades move students up when they are published; this catches up the rest.
export const YearLevelPromotionCard: React.FC = () => {
  const { students, canManageCurriculum, currentAdminUser, addToast, logActivity } = usePCM();
  const curriculumOf = useCurriculumOf();
  const [busy, setBusy] = useState(false);
  const ready = useMemo(
    () =>
      (students || [])
        .filter((s) => s && !inactive(s))
        .map((s) => ({ student: s, promotion: completedYearLevelPromotion(s, curriculumOf(s)) }))
        .filter((x): x is { student: StudentProfile; promotion: { from: string; to: string } } => !!x.promotion),
    [students, curriculumOf]
  );
  if (!ready.length) return null;

  const apply = async () => {
    if (!window.confirm(`Move ${ready.length} student${ready.length === 1 ? '' : 's'} up to the next year level? Each has completed every subject of their current year level.`)) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      for (let i = 0; i < ready.length; i += 200) {
        const batch = writeBatch(db);
        for (const { student, promotion } of ready.slice(i, i + 200)) {
          batch.set(
            doc(db, 'studentProfiles', student.id),
            { yearLevel: promotion.to, yearLevelUpdatedAt: now, yearLevelNote: `Moved up from ${promotion.from} after completing all ${promotion.from} subjects.`, updatedAt: now },
            { merge: true }
          );
          const uid = student.authUid || student.linkedGoogleUid;
          if (uid) {
            const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            batch.set(doc(db, 'studentNotifications', id), {
              id,
              recipientUid: uid,
              studentId: student.studentId || '',
              type: 'enrollment',
              title: `You are now in ${promotion.to}`,
              message: `You completed all ${promotion.from} subjects, so your year level is now ${promotion.to}.`,
              read: false,
              createdAt: now,
            });
          }
        }
        await batch.commit();
      }
      logActivity('UPDATE', 'Student Records', 'year-levels', 'Year levels', `Moved ${ready.length} student(s) up a year level after completing their year level (${currentAdminUser?.name || 'Registrar'}).`);
      addToast('success', 'Year levels updated', `${ready.length} student${ready.length === 1 ? '' : 's'} moved up.`);
    } catch (e: any) {
      addToast('error', 'Not saved', e?.code === 'permission-denied' ? 'You do not have permission to change year levels.' : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950" data-testid="year-level-promotion">
      <p className="flex items-center gap-1.5 text-sm font-bold text-[#18392B]">
        <ArrowUpCircle className="h-4 w-4 text-[#588B76]" /> {ready.length} student{ready.length === 1 ? ' has' : 's have'} completed their year level
      </p>
      <p>They passed (or were credited) every subject of their year level in their program’s curriculum, so they move up to the next year level.</p>
      <ul className="max-h-40 space-y-0.5 overflow-y-auto">
        {ready.map(({ student, promotion }) => (
          <li key={student.id}>
            <strong>{student.fullName || student.name}</strong>
            {student.studentId ? <span className="font-mono text-emerald-800"> · {student.studentId}</span> : null} — {promotion.from} → <strong>{promotion.to}</strong>
          </li>
        ))}
      </ul>
      {canManageCurriculum && (
        <button type="button" disabled={busy} onClick={apply} className="rounded-lg bg-[#18392B] px-3 py-2 font-bold text-white hover:bg-[#23533e] disabled:opacity-50">
          {busy ? 'Updating…' : `Move ${ready.length} student${ready.length === 1 ? '' : 's'} up`}
        </button>
      )}
    </div>
  );
};
