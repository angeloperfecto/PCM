'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Church,
  Award,
  ShieldCheck,
  Calendar,
  HeartHandshake,
  Edit3,
  CheckCircle2,
  Copy,
  BookOpen,
  QrCode,
  Save,
  X,
  GraduationCap,
  Camera,
  FileCheck,
  PhilippinePeso,
  Printer,
  Upload,
  Eye,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { programForStudent, subjectsForProgram } from '@/lib/curriculum';
import { AdmissionDocumentsPanel, toStudentRequirementItems, useStudentAdmissionDocuments } from '@/components/enrollment/AdmissionDocumentsPanel';
import { CertificateOfRegistration, printCertificate } from '@/components/enrollment/CertificateOfRegistration';
import { EditStudentInfoForm } from './EditStudentInfoForm';
import { accountSummary, ledgerPayments, parseTerm } from '@/lib/studentLedger';
import { StudentProfile, StudentRequirementItem } from '@/lib/types';
import { ChangeAvatarModal } from '@/components/modals/ChangeAvatarModal';
import { studentRequirementsView, calculateGPAFromGrades } from '@/lib/studentDefaults';
import { admissionRequirementTemplates } from '@/lib/enrollmentWorkflow';
import { uploadStudentFile } from '@/lib/storageService';
import { isValidImageSrc } from '@/lib/utils';

export const StudentProfileModule: React.FC = () => {
  const {
    enrollmentSystemConfig,
    studentProfile,
    updateStudentProfile,
    updateStudentRequirementStatus,
    addToast,
    programs,
    curriculumSubjects,
  } = usePCM();

  const [activeSubView, setActiveSubView] = useState<
    'dossier' | 'requirements' | 'payments' | 'academics' | 'cor'
  >('dossier');

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentProfile.studentId);
    setCopiedId(true);
    addToast('info', 'Student ID Copied', `${studentProfile.studentId} copied to clipboard.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Admission documents verified in Admissions, then the student's own requirement items.
  // Admission documents, live from the student's admission application (same as Admissions Review).
  const admissionDocs = useStudentAdmissionDocuments(studentProfile);
  const requirementsList: StudentRequirementItem[] = admissionDocs.app
    ? toStudentRequirementItems(admissionDocs.requirements)
    : studentRequirementsView(studentProfile, admissionRequirementTemplates(enrollmentSystemConfig));

  // Document upload handler
  const handleFileUpload = async (reqId: string, file: File) => {
    setUploadingReqId(reqId);
    try {
      const uploadRes = await uploadStudentFile(file, studentProfile.studentId, 'requirements', reqId);
      if (!uploadRes.success) {
        throw new Error(uploadRes.error || 'Failed to upload document.');
      }
      // Update requirement in store
      const updatedReqs = requirementsList.map((r) =>
        r.id === reqId
          ? {
              ...r,
              file: {
                name: uploadRes.fileName,
                url: uploadRes.url,
                size: uploadRes.fileSize,
                type: uploadRes.fileType,
              },
              status: 'Submitted' as const,
              uploadedAt: new Date().toISOString(),
            }
          : r
      );
      // Admission documents are kept on the record separately; save only the student's own items.
      await updateStudentProfile(studentProfile.id, { requirements: updatedReqs.filter((r) => !r.id.startsWith('adm-')) });
      addToast('success', 'Document Uploaded', `${file.name} successfully submitted for review.`);
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Could not upload file.');
    } finally {
      setUploadingReqId(null);
    }
  };

  // Subjects history
  const subjectsList = studentProfile.subjectHistory || [];

  // Completed units calculation
  // Units earned (passed subjects in the academic history) against the program's curriculum.
  const completedUnits = Number(studentProfile.totalUnitsEarned) || 0;
  const totalCurriculumUnits = subjectsForProgram(curriculumSubjects, programForStudent(programs, studentProfile))
    .filter((s) => s.status !== 'Inactive')
    .reduce((t, s) => t + (Number(s.units) || 0), 0);
  const progressPercent = totalCurriculumUnits ? Math.min(100, Math.round((completedUnits / totalCurriculumUnits) * 100)) : 0;

  // Payment numbers
  const account = accountSummary(studentProfile as any);
  const totalTuition = account.termAssessment;
  const paidTuition = account.paymentsThisTerm;
  const balanceTuition = account.balance;
  const ledger = ledgerPayments(studentProfile as any);
  const termLabel = parseTerm(studentProfile.currentSemester);

  return (
    <div id="pcm-student-profile-module" className="space-y-6 font-sans">
      {/* 1. PRIMARY INSTITUTIONAL IDENTITY CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#588B76]/15 via-emerald-50/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group">
              <div
                onClick={() => setIsAvatarModalOpen(true)}
                title="Click to update official student photo"
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#18392B] to-[#588B76] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md ring-4 ring-[#588B76]/20 overflow-hidden cursor-pointer relative"
              >
                {(() => {
                  const rawPhoto = studentProfile.avatarUrl || studentProfile.profilePhoto;
                  const photoSrc = isValidImageSrc(rawPhoto) ? rawPhoto.trim() : null;
                  if (photoSrc) {
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoSrc}
                        alt={studentProfile.fullName || 'Student'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    );
                  }
                  return (
                    <span>
                      {studentProfile.fullName
                        ? studentProfile.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        : 'ST'}
                    </span>
                  );
                })()}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-6 h-6 drop-shadow" />
                </div>
              </div>

              {/* Photo change badge */}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Update Profile Photo"
                className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-[#18392B] hover:bg-[#588B76] text-amber-300 hover:text-white rounded-full border-2 border-white shadow-md transition cursor-pointer flex items-center justify-center z-10"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
                  {studentProfile.fullName || studentProfile.name}
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {studentProfile.enrollmentStatus || 'Officially Enrolled'}
                </span>
                <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-300">
                  {studentProfile.academicStatus || 'Regular'}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-600 flex flex-wrap items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#18392B]" />
                <span className="font-bold text-slate-800">{studentProfile.degreeProgram || studentProfile.program}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs text-[#18392B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {studentProfile.yearLevel || '1st Year'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600 font-medium">{studentProfile.section || 'Section A'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600">{studentProfile.currentSemester || '1st Sem, AY 2026–2027'}</span>
              </p>

              {/* Student ID & Application Number Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Permanent ID:</span>
                  <strong className="font-mono text-sm font-bold text-[#18392B]">
                    {studentProfile.studentId}
                  </strong>
                  <button
                    onClick={handleCopyId}
                    title="Copy Student ID"
                    className="text-slate-400 hover:text-[#18392B] transition ml-1 p-0.5 rounded cursor-pointer"
                  >
                    {copiedId ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {studentProfile.applicationNumber && (
                  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg text-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">App No:</span>
                    <strong className="font-mono text-slate-800">{studentProfile.applicationNumber}</strong>
                  </div>
                )}

                <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                  GPA: {studentProfile.gpa ? studentProfile.gpa.toFixed(2) : '1.25'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="bg-white hover:bg-slate-50 text-[#18392B] border border-slate-300 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                {isEditingContact ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditingContact ? 'Close Editor' : 'Edit My Information'}</span>
              </button>

              <button
                onClick={() => setActiveSubView('cor')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View COR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Academic Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#18392B]" />
              Curriculum Progress — {studentProfile.degreeProgram || studentProfile.program}
            </span>
            <span className="font-mono font-bold text-[#18392B]">
              {totalCurriculumUnits ? `${completedUnits} / ${totalCurriculumUnits} Units Completed (${progressPercent}%)` : `${completedUnits} Units Completed`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#18392B] to-[#588B76] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Edit my information */}
      {isEditingContact && <EditStudentInfoForm onClose={() => setIsEditingContact(false)} />}

      {/* 2. SUB-VIEW TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2 text-xs font-bold">
        {[
          { id: 'dossier', label: '1. Complete Profile Dossier', icon: User },
          { id: 'requirements', label: '2. Document Requirements Vault', icon: FileCheck, count: requirementsList.filter((r) => r.status !== 'Verified').length },
          { id: 'payments', label: '3. Tuition & Payment Ledger', icon: PhilippinePeso },
          { id: 'academics', label: '4. Scholastic Records & Grades', icon: BookOpen },
          { id: 'cor', label: '5. Official Certificate of Registration (COR)', icon: Printer },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubView(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-[#588B76]'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-500 text-white font-bold'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: COMPLETE PROFILE DOSSIER (12 SECTIONS) */}
      {/* ========================================================================= */}
      {activeSubView === 'dossier' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section A: Personal Information */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-[#18392B]" />
                <h3 className="font-serif text-sm font-bold text-[#18392B] uppercase tracking-wider">
                  A. Personal Information
                </h3>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Student ID Number:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.studentId}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Application Number:</span>
                  <strong className="font-mono text-slate-800">{studentProfile.applicationNumber || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">First / Middle / Last Name:</span>
                  <strong className="text-slate-900">
                    {studentProfile.firstName || ''} {studentProfile.middleName || ''} {studentProfile.lastName || studentProfile.fullName} {studentProfile.suffix || ''}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Preferred Name / Alias:</span>
                  <strong className="text-slate-800">{studentProfile.preferredName || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Date of Birth & Age:</span>
                  <strong className="text-slate-900">
                    {studentProfile.dateOfBirth || studentProfile.birthDate || '—'} ({studentProfile.age || '—'} yrs old)
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Place of Birth:</span>
                  <strong className="text-slate-900">{studentProfile.placeOfBirth || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Sex / Gender:</span>
                  <strong className="text-slate-900">{studentProfile.sex || studentProfile.gender || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Civil Status:</span>
                  <strong className="text-slate-900">{studentProfile.civilStatus || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Nationality & Religion:</span>
                  <strong className="text-slate-900">
                    {studentProfile.nationality || '—'} • {studentProfile.religion || '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Section B: Contact Information */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Phone className="w-4 h-4 text-[#18392B]" />
                <h3 className="font-serif text-sm font-bold text-[#18392B] uppercase tracking-wider">
                  B. Contact Information
                </h3>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Primary Mobile Number:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.mobileNumber || studentProfile.phone || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Official Email:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.email}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Facebook Account / URL:</span>
                  <strong className="text-slate-800">{studentProfile.facebookAccount || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Current Residence:</span>
                  <strong className="text-slate-900 text-right max-w-[220px] truncate">
                    {studentProfile.currentAddress || studentProfile.address || '—'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Permanent Home Address:</span>
                  <strong className="text-slate-900 text-right max-w-[220px] truncate">
                    {studentProfile.permanentAddress || studentProfile.address || '—'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">City / Municipality:</span>
                  <strong className="text-slate-900">{studentProfile.city || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Province & ZIP Code:</span>
                  <strong className="text-slate-900">
                    {studentProfile.province || '—'} ({studentProfile.zipCode || '—'})
                  </strong>
                </div>
              </div>
            </div>

            {/* Section C: Family & Emergency Contact */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <HeartHandshake className="w-4 h-4 text-[#18392B]" />
                <h3 className="font-serif text-sm font-bold text-[#18392B] uppercase tracking-wider">
                  C. Family & Emergency Contact
                </h3>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Father&apos;s Full Name:</span>
                  <strong className="text-slate-900">{studentProfile.fatherName || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Mother&apos;s Maiden Name:</span>
                  <strong className="text-slate-900">{studentProfile.motherName || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Guardian Name (if applicable):</span>
                  <strong className="text-slate-900">{studentProfile.guardianName || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Emergency Contact Person:</span>
                  <strong className="text-slate-900">
                    {studentProfile.emergencyContactPerson || studentProfile.emergencyContactName || '—'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Emergency Number:</span>
                  <strong className="font-mono text-slate-900">
                    {studentProfile.emergencyContactNumber || studentProfile.emergencyContactPhone || '—'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Emergency Relationship:</span>
                  <strong className="text-slate-900">
                    {studentProfile.emergencyContactRelationship || studentProfile.emergencyContactRelation || '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Section D: Educational Background */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap className="w-4 h-4 text-[#18392B]" />
                <h3 className="font-serif text-sm font-bold text-[#18392B] uppercase tracking-wider">
                  D. Educational Background
                </h3>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Last School Attended:</span>
                  <strong className="text-slate-900">{studentProfile.lastSchoolAttended || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Highest Attainment:</span>
                  <strong className="text-slate-900">
                    {studentProfile.highestEducationalAttainment || '—'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Previous Course / Strand:</span>
                  <strong className="text-slate-800">{studentProfile.previousCourse || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Year Graduated:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.yearGraduated || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">General Average / Honors:</span>
                  <strong className="text-slate-900">{studentProfile.generalAverage || '—'}</strong>
                </div>
              </div>
            </div>

            {/* Section E: Church & Ministry */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Church className="w-4 h-4 text-[#18392B]" />
                <h3 className="font-serif text-sm font-bold text-[#18392B] uppercase tracking-wider">
                  E. Church & Ministry Information
                </h3>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Home Church / Congregation:</span>
                  <strong className="text-slate-900">{studentProfile.homeChurch || studentProfile.churchName || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Senior Pastor:</span>
                  <strong className="text-slate-900">{studentProfile.pastorName || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Pastor Contact:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.pastorContactNumber || studentProfile.pastorPhone || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Ministry Role & Dept:</span>
                  <strong className="text-slate-900">
                    {studentProfile.ministryRole || '—'} ({studentProfile.ministryDepartment || '—'})
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Water Baptism Status:</span>
                  <strong className="text-emerald-700 font-bold">{studentProfile.isBaptized === true || studentProfile.waterBaptized === true ? 'Water baptized' : studentProfile.isBaptized === false || studentProfile.waterBaptized === false ? 'Not yet baptized' : '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Spiritual Mentor:</span>
                  <strong className="text-slate-900">{studentProfile.mentorName || '—'}</strong>
                </div>
              </div>
            </div>

            {/* Section F: Institutional Governance & Advising */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-[#18392B]" />
                <h3 className="font-serif text-sm font-bold text-[#18392B] uppercase tracking-wider">
                  F. Institutional Standing & Advising
                </h3>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Academic Standing:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {studentProfile.academicStatus || 'Regular'}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Assigned Academic Adviser:</span>
                  <strong className="text-slate-900">{studentProfile.assignedAdviser || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Cohort Section:</span>
                  <strong className="text-slate-800">{studentProfile.section || '—'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Clearance Status:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fully Cleared
                  </span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Profile Completion:</span>
                  <strong className="font-mono text-[#18392B] font-bold">100% Verified</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: DOCUMENT REQUIREMENTS VAULT */}
      {/* ========================================================================= */}
      {activeSubView === 'requirements' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Official Admissions Documents Vault
              </h3>
              <p className="text-xs text-slate-500">
                {admissionDocs.app
                  ? 'Your admission documents and their verification status. Upload any missing or returned document here; the Registrar reviews it in Admissions.'
                  : 'Track the verification status of your admission documents and submit updated digital scans.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                {requirementsList.filter((r) => r.status === 'Verified').length} of {requirementsList.length} Verified
              </span>
            </div>
          </div>

          {admissionDocs.app && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <AdmissionDocumentsPanel mode="student" app={admissionDocs.app} requirements={admissionDocs.requirements} loading={admissionDocs.loading} error={admissionDocs.error} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(admissionDocs.app ? [] : requirementsList).map((req) => {
              const hasFile = req.file && req.file.url;
              const isUploading = uploadingReqId === req.id;

              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border transition bg-white shadow-xs space-y-3 ${
                    req.status === 'Verified'
                      ? 'border-emerald-200'
                      : req.status === 'Rejected'
                      ? 'border-rose-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-xs">{req.name}</strong>
                        {req.required && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{req.description}</p>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        req.status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : req.status === 'Submitted'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : req.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Uploaded File Info */}
                  {hasFile ? (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck className="w-4 h-4 text-[#588B76] shrink-0" />
                        <span className="font-mono text-slate-800 truncate">{req.file?.name}</span>
                      </div>

                      <a
                        href={req.file?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#588B76] hover:underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </a>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      No document scan submitted yet
                    </div>
                  )}

                  {req.remarks && (
                    <div className="p-2 bg-amber-50 rounded-lg text-[11px] text-amber-900 border border-amber-200">
                      <strong>Registrar Notes:</strong> {req.remarks}
                    </div>
                  )}

                  {/* Upload Control */}
                  <div className="pt-1 flex items-center justify-end">
                    <label className="bg-white hover:bg-slate-50 text-[#18392B] border border-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[#588B76]" />
                      <span>{isUploading ? 'Uploading...' : hasFile ? 'Replace Document' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(req.id, file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: TUITION & PAYMENT LEDGER */}
      {/* ========================================================================= */}
      {activeSubView === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Student Financial Assessment & Official Payment Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Official billing statement for {studentProfile.currentSemester || 'the current term'}.
              </p>
            </div>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${balanceTuition > 0 ? 'text-amber-900 bg-amber-100 border-amber-300' : 'text-emerald-800 bg-emerald-100 border-emerald-300'}`}>
              {balanceTuition > 0 ? 'Balance due' : 'Fully paid'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Tuition Assessment</span>
              <strong className="font-mono text-2xl font-bold text-slate-900">
                ₱{totalTuition.toLocaleString()}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-1">{termLabel.semester ? `${termLabel.semester} ${termLabel.academicYear}` : 'Current term'}{account.previousBalance > 0 ? ` · plus ₱${account.previousBalance.toLocaleString()} previous balance` : ''}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Payments Credited</span>
              <strong className="font-mono text-2xl font-bold text-emerald-700">
                ₱{paidTuition.toLocaleString()}
              </strong>
              <span className="text-[11px] text-emerald-600 block mt-1">Verified by the Finance Office</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Current Outstanding Balance</span>
              <strong className="font-mono text-2xl font-bold text-amber-800">
                ₱{balanceTuition.toLocaleString()}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-1">Pay from Amount Due &amp; Payment</span>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-xs text-[#18392B]">
              Official Payment Transactions & Receipts
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                <tr>
                  <th className="p-3.5">Official Receipt (OR)</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Description / Remarks</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">No payments recorded yet.</td>
                  </tr>
                )}
                {ledger.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#18392B]">
                      {p.receipt || p.reference || '—'}
                    </td>
                    <td className="p-3.5 font-mono">{(p.date || '').slice(0, 10) || '—'}</td>
                    <td className="p-3.5">{p.method || '—'}</td>
                    <td className="p-3.5 text-slate-500">{p.description || '—'}</td>
                    <td className="p-3.5 font-mono font-bold text-right text-slate-900">
                      ₱{(p.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status || 'Verified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: SCHOLASTIC RECORDS & GRADES */}
      {/* ========================================================================= */}
      {activeSubView === 'academics' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Permanent Academic Grades Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Official grades recorded by the Office of the Registrar.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block">Scholastic Average</span>
                <strong className="font-mono text-base text-[#18392B]">
                  {studentProfile.gpa ? studentProfile.gpa.toFixed(2) : calculateGPAFromGrades(subjectsList).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                <tr>
                  <th className="p-3.5">Course Code</th>
                  <th className="p-3.5">Descriptive Course Title</th>
                  <th className="p-3.5 text-center">Units</th>
                  <th className="p-3.5 text-center">Midterm</th>
                  <th className="p-3.5 text-center">Final Grade</th>
                  <th className="p-3.5">Faculty Instructor</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(studentProfile.courses || []).map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#18392B]">{c.code}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{c.title}</td>
                    <td className="p-3.5 font-mono text-center">{c.units}u</td>
                    <td className="p-3.5 font-mono text-center font-bold text-slate-700">
                      {c.midtermGrade || '—'}
                    </td>
                    <td className="p-3.5 font-mono text-center font-bold text-emerald-700 text-sm">
                      {c.finalGrade || <span className="text-[11px] font-semibold text-slate-400">Not yet released</span>}
                    </td>
                    <td className="p-3.5 text-slate-600">{c.instructor || 'TBA'}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.finalGrade ? c.gradeRemark || c.status : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: OFFICIAL CERTIFICATE OF REGISTRATION (COR) */}
      {/* ========================================================================= */}
      {activeSubView === 'cor' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-bold text-[#18392B]">Official Certificate of Registration (COR)</h3>
            <div className="flex justify-end gap-2 print:hidden">
              <button
                onClick={() => printCertificate()}
                className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print COR</span>
              </button>
            </div>
          </div>
          <CertificateOfRegistration student={studentProfile} />
        </div>
      )}

      {/* Change Avatar Modal */}
      {isAvatarModalOpen && (
        <ChangeAvatarModal
          isOpen={isAvatarModalOpen}
          currentAvatarUrl={studentProfile.avatarUrl}
          userName={studentProfile.fullName || 'Student'}
          userRole="Student"
          onClose={() => setIsAvatarModalOpen(false)}
          onSave={async (url) => {
            await updateStudentProfile(studentProfile.id, { avatarUrl: url, profilePhoto: url });
            setIsAvatarModalOpen(false);
            addToast('success', 'Photo Updated', 'Your student avatar has been saved.');
          }}
        />
      )}

    </div>
  );
};
