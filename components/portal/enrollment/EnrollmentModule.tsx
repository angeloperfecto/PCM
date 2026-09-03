'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Printer,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  Download,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { OnlineEnrollment } from '@/lib/types';

interface EnrollmentModuleProps {
  onOpenWizard: () => void;
  onOpenCORModal: () => void;
}

export const EnrollmentModule: React.FC<EnrollmentModuleProps> = ({
  onOpenWizard,
  onOpenCORModal,
}) => {
  const { studentProfile, enrollments } = usePCM();

  // Latest online enrollment application
  const latestEnrollment =
    enrollments.find((e) => e.studentId === studentProfile.studentId) ||
    enrollments[0];

  const isOfficiallyEnrolled =
    studentProfile.enrollmentStatus === 'Approved' ||
    (studentProfile.enrollmentStatus as string) === 'Enrolled' ||
    (studentProfile.enrollmentStatus as string) === 'Officially Enrolled' ||
    latestEnrollment?.status === 'Approved';

  const enrolledCourses = (studentProfile.courses || []).filter(
    (c) => c.status !== 'Dropped'
  );

  const totalEnrolledUnits = enrolledCourses.reduce(
    (sum, c) => sum + (c.units || 0),
    0
  );

  const requiredDocuments = [
    {
      name: 'Official Transcript of Records / Form 138',
      desc: 'Academic records from previous school/institution',
      status: 'Verified',
      date: 'Aug 05, 2026',
    },
    {
      name: 'Pastoral Recommendation & Church Endorsement',
      desc: 'Signed by Senior Pastor Danilo Santos',
      status: 'Verified',
      date: 'Aug 07, 2026',
    },
    {
      name: 'Certificate of Good Moral Character',
      desc: 'Official institutional clearance',
      status: 'Verified',
      date: 'Aug 06, 2026',
    },
    {
      name: 'Proof of Downpayment / Bank Deposit Slip',
      desc: 'BDO Unibank Ref #849182 • ₱5,000.00',
      status: 'Verified',
      date: 'Aug 10, 2026',
    },
  ];

  return (
    <div id="pcm-enrollment-module" className="space-y-6">
      {/* Official Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#588B76] uppercase">
                Academic Year 2026–2027 • 1st Semester
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Ref: {latestEnrollment?.referenceNumber || 'ENR-2026-0418'}
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#18392B] mt-1">
              Official Enrollment & Certificate of Registration
            </h3>
            <p className="text-xs text-slate-500">
              Your official academic matriculation status, verified course load, and Certificate of Registration (COR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCORModal}
              className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>View & Print Official COR</span>
            </button>

            <button
              onClick={onOpenWizard}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Enrollment Application Wizard</span>
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Course Enlistment', desc: `${totalEnrolledUnits} units selected`, completed: true },
            { step: '2', title: 'Document Verification', desc: 'TOR & Pastoral Endorsement', completed: true },
            { step: '3', title: 'Registrar Approval', desc: 'Dean & Registrar signed', completed: isOfficiallyEnrolled },
            { step: '4', title: 'Official COR Released', desc: 'Matriculation certified', completed: isOfficiallyEnrolled },
          ].map((st) => (
            <div
              key={st.step}
              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                st.completed
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[10px] text-[#588B76]">Step 0{st.step}</span>
                {st.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <strong className="font-serif text-sm block font-bold text-slate-900">{st.title}</strong>
              <p className="text-[11px] text-slate-600">{st.desc}</p>
            </div>
          ))}
        </div>

        {/* Matriculation Summary */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Matriculation Status</span>
            <strong className="text-emerald-800 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {studentProfile.enrollmentStatus || 'Officially Enrolled'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Student ID</span>
            <strong className="font-mono text-[#18392B] font-bold">{studentProfile.studentId}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Degree Program</span>
            <strong className="font-semibold text-slate-900">{studentProfile.degreeProgram}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Enrolled Load</span>
            <strong className="font-mono font-bold text-purple-900">
              {enrolledCourses.length} Subjects ({totalEnrolledUnits} Units)
            </strong>
          </div>
        </div>
      </div>

      {/* Officially Enrolled Subjects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#588B76]" />
              Officially Enrolled Subject Schedule
            </h4>
            <p className="text-xs text-slate-500">Official section assignments for AY 2026–2027 (1st Semester)</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Certified by Registrar
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#18392B] text-white">
                  <th className="p-3.5 font-bold">Course Code</th>
                  <th className="p-3.5 font-bold">Subject Title</th>
                  <th className="p-3.5 font-bold">Units</th>
                  <th className="p-3.5 font-bold">Class Schedule</th>
                  <th className="p-3.5 font-bold">Room</th>
                  <th className="p-3.5 font-bold">Faculty Instructor</th>
                  <th className="p-3.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {enrolledCourses.map((c) => (
                  <tr key={c.id || c.code} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#18392B]">{c.code}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{c.title}</td>
                    <td className="p-3.5 font-mono">{c.units} Units</td>
                    <td className="p-3.5">{c.schedule}</td>
                    <td className="p-3.5 text-slate-600">{c.room}</td>
                    <td className="p-3.5 text-slate-500">{c.instructor}</td>
                    <td className="p-3.5 text-center">
                      <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                        {c.status || 'Enrolled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td colSpan={2} className="p-3.5 text-right">Total Matriculated Load:</td>
                  <td colSpan={5} className="p-3.5 font-mono text-purple-900">
                    {totalEnrolledUnits} Academic Units
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Enrollment Documents & Admission Clearances */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-700" />
            Enrollment Documents & Verification Vault
          </h4>
          <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            All Requirements Verified (4/4)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requiredDocuments.map((doc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <strong className="text-slate-900">{doc.name}</strong>
                </div>
                <p className="text-[11px] text-slate-500">{doc.desc}</p>
                <span className="text-[10px] text-slate-400 font-mono block">Verified: {doc.date}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
