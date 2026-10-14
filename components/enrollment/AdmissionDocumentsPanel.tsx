'use client';

import React from 'react';
import { auth, db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import { reviewRequirement, uploadRequirementFile } from '@/lib/admissionsService';
import type { ApplicationRequirement } from '@/lib/enrollmentWorkflow';
import type { StudentProfile, StudentRequirementItem } from '@/lib/types';
import { RequirementsChecklist } from './RequirementsChecklist';
import { useApplicationDetails } from './useApplicationDetails';

// The admission application a student record came from (set when Admissions finalized enrollment).
export function linkedApplication(profile: Partial<StudentProfile> | null | undefined, applications: any[]): any | null {
  if (!profile) return null;
  return (
    applications.find((a) => a && profile.id && a.studentRecordId === profile.id) ||
    applications.find((a) => a && profile.applicationNumber && a.referenceNumber === profile.applicationNumber) ||
    applications.find((a) => a && profile.studentId && a.studentId === profile.studentId && a.studentRecordId) ||
    null
  );
}

// A student's admission documents, live from their admission application — the same checklist
// Admissions Review shows. `app` is null for students without an application (e.g. added by hand).
export function useStudentAdmissionDocuments(profile: Partial<StudentProfile> | null | undefined) {
  const { applications } = usePCM();
  const app = linkedApplication(profile, applications || []);
  const { requirements, loading, error } = useApplicationDetails(app?.id || null);
  return { app, requirements, loading: !!app && loading, error };
}

// Same documents in the shape older screens use.
export function toStudentRequirementItems(reqs: ApplicationRequirement[]): StudentRequirementItem[] {
  return reqs.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || '',
    required: r.required,
    status: r.status === 'Missing' ? 'Pending' : (r.status as StudentRequirementItem['status']),
    file: r.fileDataUrl ? { name: r.fileName || r.name, url: r.fileDataUrl, type: r.fileType } : undefined,
    uploadDate: r.uploadedAt,
    verifiedBy: r.reviewedBy,
    verificationDate: r.reviewedAt,
    remarks: r.remarks,
  }));
}

// The admission documents checklist, identical to Admissions Review. Students upload missing or
// returned documents (reviewed by the Registrar in Admissions); staff verify or return them.
export const AdmissionDocumentsPanel: React.FC<{
  mode: 'student' | 'staff';
  app: any;
  requirements: ApplicationRequirement[];
  loading: boolean;
  error?: string | null;
}> = ({ mode, app, requirements, loading, error }) => {
  const { canDecideAdmissions, admissionsActor } = usePCM();

  return (
    <div className="space-y-3" data-testid="admission-documents-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-slate-600">
          From admission application <span className="font-mono font-semibold">{app.referenceNumber}</span> — the same checklist the Registrar sees in
          Admissions Review.
        </p>
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Loading documents…</p>
      ) : error ? (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      ) : requirements.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-center text-xs text-slate-500">No document checklist was created for this application.</p>
      ) : mode === 'student' ? (
        <RequirementsChecklist
          mode="applicant"
          requirements={requirements}
          onUpload={(req, file) =>
            uploadRequirementFile(db, { uid: auth.currentUser?.uid || '', name: app.fullName, email: auth.currentUser?.email }, app, req, requirements, file)
          }
        />
      ) : (
        <RequirementsChecklist
          mode="staff"
          requirements={requirements}
          readOnly={!canDecideAdmissions}
          onReview={(req, verdict, remarks) => reviewRequirement(db, admissionsActor(), app, req, verdict, remarks)}
        />
      )}
    </div>
  );
};
