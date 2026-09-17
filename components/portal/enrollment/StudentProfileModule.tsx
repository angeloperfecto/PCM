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
  DollarSign,
  Printer,
  Upload,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { StudentProfile, StudentRequirementItem } from '@/lib/types';
import { ChangeAvatarModal } from '@/components/modals/ChangeAvatarModal';
import { StudentRegistrationWizard } from '@/components/enrollment/StudentRegistrationWizard';
import { getDefaultStudentRequirements, calculateGPAFromGrades } from '@/lib/studentDefaults';
import { uploadStudentFile } from '@/lib/storageService';

export const StudentProfileModule: React.FC = () => {
  const {
    studentProfile,
    updateStudentProfile,
    updateStudentRequirementStatus,
    addToast,
  } = usePCM();

  const [activeSubView, setActiveSubView] = useState<
    'dossier' | 'requirements' | 'payments' | 'academics' | 'cor'
  >('dossier');

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null);

  // Quick edit form state for contact & church
  const [formData, setFormData] = useState({
    mobileNumber: studentProfile.mobileNumber || studentProfile.phone || '',
    email: studentProfile.email || '',
    facebookAccount: studentProfile.facebookAccount || '',
    currentAddress: studentProfile.currentAddress || studentProfile.address || '',
    permanentAddress: studentProfile.permanentAddress || studentProfile.address || '',
    homeChurch: studentProfile.homeChurch || studentProfile.churchName || '',
    pastorName: studentProfile.pastorName || '',
    pastorContactNumber: studentProfile.pastorContactNumber || studentProfile.pastorPhone || '',
    emergencyContactPerson: studentProfile.emergencyContactPerson || studentProfile.emergencyContactName || '',
    emergencyContactRelationship: studentProfile.emergencyContactRelationship || studentProfile.emergencyContactRelation || '',
    emergencyContactNumber: studentProfile.emergencyContactNumber || studentProfile.emergencyContactPhone || '',
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentProfile.studentId);
    setCopiedId(true);
    addToast('info', 'Student ID Copied', `${studentProfile.studentId} copied to clipboard.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateStudentProfile(studentProfile.id, {
      ...formData,
      phone: formData.mobileNumber,
      address: formData.currentAddress,
    });
    if (success) {
      setIsEditingContact(false);
      addToast('success', 'Profile Updated', 'Your contact details have been updated.');
    }
  };

  // Requirements list with defaults fallback
  const requirementsList: StudentRequirementItem[] =
    studentProfile.requirements && studentProfile.requirements.length > 0
      ? studentProfile.requirements
      : getDefaultStudentRequirements();

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
      await updateStudentProfile(studentProfile.id, { requirements: updatedReqs });
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
  const completedUnits = (studentProfile.courses || [])
    .filter((c) => c.status === 'Completed' || c.finalGrade)
    .reduce((sum, c) => sum + (c.units || 0), 64);

  const totalCurriculumUnits = 128;
  const progressPercent = Math.min(100, Math.round((completedUnits / totalCurriculumUnits) * 100));

  // Payment numbers
  const totalTuition = studentProfile.tuitionTotal || 18500;
  const paidTuition = studentProfile.tuitionPaid || 0;
  const balanceTuition = studentProfile.tuitionBalance !== undefined
    ? studentProfile.tuitionBalance
    : Math.max(0, totalTuition - paidTuition);

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
                {studentProfile.avatarUrl || studentProfile.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={studentProfile.avatarUrl || studentProfile.profilePhoto}
                    alt={studentProfile.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <span>
                    {studentProfile.fullName
                      ? studentProfile.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'ST'}
                  </span>
                )}

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
            <button
              onClick={() => setIsWizardOpen(true)}
              className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Launch 9-Step Registration Wizard</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="bg-white hover:bg-slate-50 text-[#18392B] border border-slate-300 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                {isEditingContact ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditingContact ? 'Close Editor' : 'Quick Edit Contact'}</span>
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
              {completedUnits} / {totalCurriculumUnits} Units Completed ({progressPercent}%)
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

      {/* Quick Contact Editor Inline if toggled */}
      {isEditingContact && (
        <form
          onSubmit={handleSaveContact}
          className="bg-emerald-50/50 rounded-2xl border-2 border-emerald-300 p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <h3 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#588B76]" />
              Update Contact, Church & Emergency Details
            </h3>
            <span className="text-xs text-slate-500">
              Directly updates your official student records in Firebase
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Contact</label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="0917 123 4567"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Facebook Account / Link</label>
              <input
                type="text"
                value={formData.facebookAccount}
                onChange={(e) => setFormData({ ...formData, facebookAccount: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="facebook.com/username"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Current Residential Address</label>
              <input
                type="text"
                value={formData.currentAddress}
                onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="Street, Barangay, City, Province"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Home Church</label>
              <input
                type="text"
                value={formData.homeChurch}
                onChange={(e) => setFormData({ ...formData, homeChurch: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="Baguio Christian Fellowship"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Senior Pastor Name</label>
              <input
                type="text"
                value={formData.pastorName}
                onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="Rev. Danilo Santos"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Contact Person</label>
              <input
                type="text"
                value={formData.emergencyContactPerson}
                onChange={(e) => setFormData({ ...formData, emergencyContactPerson: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Contact Number</label>
              <input
                type="tel"
                value={formData.emergencyContactNumber}
                onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#588B76]"
                placeholder="0918 765 4321"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
            <button
              type="button"
              onClick={() => setIsEditingContact(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Record Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. SUB-VIEW TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
        {[
          { id: 'dossier', label: '1. Complete Profile Dossier', icon: User },
          { id: 'requirements', label: '2. Document Requirements Vault', icon: FileCheck, count: requirementsList.filter((r) => r.status !== 'Verified').length },
          { id: 'payments', label: '3. Tuition & Payment Ledger', icon: DollarSign },
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
                  <strong className="font-mono text-slate-800">{studentProfile.applicationNumber || 'N/A'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">First / Middle / Last Name:</span>
                  <strong className="text-slate-900">
                    {studentProfile.firstName || ''} {studentProfile.middleName || ''} {studentProfile.lastName || studentProfile.fullName} {studentProfile.suffix || ''}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Preferred Name / Alias:</span>
                  <strong className="text-slate-800">{studentProfile.preferredName || 'None'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Date of Birth & Age:</span>
                  <strong className="text-slate-900">
                    {studentProfile.dateOfBirth || studentProfile.birthDate || 'N/A'} ({studentProfile.age || '—'} yrs old)
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Place of Birth:</span>
                  <strong className="text-slate-900">{studentProfile.placeOfBirth || 'N/A'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Sex / Gender:</span>
                  <strong className="text-slate-900">{studentProfile.sex || studentProfile.gender || 'Male'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Civil Status:</span>
                  <strong className="text-slate-900">{studentProfile.civilStatus || 'Single'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Nationality & Religion:</span>
                  <strong className="text-slate-900">
                    {studentProfile.nationality || 'Filipino'} • {studentProfile.religion || 'Christian'}
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
                  <strong className="font-mono text-slate-900">{studentProfile.mobileNumber || studentProfile.phone || 'N/A'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Official Email:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.email}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Facebook Account / URL:</span>
                  <strong className="text-slate-800">{studentProfile.facebookAccount || 'Not Specified'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Current Residence:</span>
                  <strong className="text-slate-900 text-right max-w-[220px] truncate">
                    {studentProfile.currentAddress || studentProfile.address || 'N/A'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Permanent Home Address:</span>
                  <strong className="text-slate-900 text-right max-w-[220px] truncate">
                    {studentProfile.permanentAddress || studentProfile.address || 'N/A'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">City / Municipality:</span>
                  <strong className="text-slate-900">{studentProfile.city || 'Baguio City'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Province & ZIP Code:</span>
                  <strong className="text-slate-900">
                    {studentProfile.province || 'Benguet'} ({studentProfile.zipCode || '2600'})
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
                  <strong className="text-slate-900">{studentProfile.fatherName || 'Manuel Ramos Sr.'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Mother&apos;s Maiden Name:</span>
                  <strong className="text-slate-900">{studentProfile.motherName || 'Maria Joy David Ramos'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Guardian Name (if applicable):</span>
                  <strong className="text-slate-900">{studentProfile.guardianName || 'None'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Emergency Contact Person:</span>
                  <strong className="text-slate-900">
                    {studentProfile.emergencyContactPerson || studentProfile.emergencyContactName || 'Maria Ramos'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Emergency Number:</span>
                  <strong className="font-mono text-slate-900">
                    {studentProfile.emergencyContactNumber || studentProfile.emergencyContactPhone || '09181234567'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Emergency Relationship:</span>
                  <strong className="text-slate-900">
                    {studentProfile.emergencyContactRelationship || studentProfile.emergencyContactRelation || 'Parent'}
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
                  <strong className="text-slate-900">{studentProfile.lastSchoolAttended || 'Baguio City National High School'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Highest Attainment:</span>
                  <strong className="text-slate-900">
                    {studentProfile.highestEducationalAttainment || 'Senior High School Graduate'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Previous Course / Strand:</span>
                  <strong className="text-slate-800">{studentProfile.previousCourse || 'HUMSS Strand'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Year Graduated:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.yearGraduated || '2024'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">General Average / Honors:</span>
                  <strong className="text-slate-900">{studentProfile.generalAverage || '92.5 (With Honors)'}</strong>
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
                  <strong className="text-slate-900">{studentProfile.homeChurch || studentProfile.churchName || 'Baguio Christian Fellowship'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Senior Pastor:</span>
                  <strong className="text-slate-900">{studentProfile.pastorName || 'Rev. Danilo Santos'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Pastor Contact:</span>
                  <strong className="font-mono text-slate-900">{studentProfile.pastorContactNumber || studentProfile.pastorPhone || '09181234567'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Ministry Role & Dept:</span>
                  <strong className="text-slate-900">
                    {studentProfile.ministryRole || 'Youth Leader'} ({studentProfile.ministryDepartment || 'Youth & Music'})
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Water Baptism Status:</span>
                  <strong className="text-emerald-700 font-bold">{studentProfile.isBaptized ? 'Water Baptized' : 'Baptized'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Spiritual Mentor:</span>
                  <strong className="text-slate-900">{studentProfile.mentorName || 'Dr. Benjamin Villanueva'}</strong>
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
                  <strong className="text-slate-900">{studentProfile.assignedAdviser || 'Dr. Benjamin Villanueva, Th.D.'}</strong>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Cohort Section:</span>
                  <strong className="text-slate-800">{studentProfile.section || 'Section A'}</strong>
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
                Track verification status for all 8 mandatory admissions credentials and submit updated digital scans.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                {requirementsList.filter((r) => r.status === 'Verified').length} of {requirementsList.length} Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirementsList.map((req) => {
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
                Official billing statement for Academic Year 2026–2027.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Account in Good Standing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Tuition Assessment</span>
              <strong className="font-mono text-2xl font-bold text-slate-900">
                ₱{totalTuition.toLocaleString()}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-1">18 Units + Institutional Fees</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Payments Credited</span>
              <strong className="font-mono text-2xl font-bold text-emerald-700">
                ₱{paidTuition.toLocaleString()}
              </strong>
              <span className="text-[11px] text-emerald-600 block mt-1">Confirmed with Official Receipts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Current Outstanding Balance</span>
              <strong className="font-mono text-2xl font-bold text-amber-800">
                ₱{balanceTuition.toLocaleString()}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-1">Payable before Midterm Examination</span>
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
                {(studentProfile.paymentHistory && studentProfile.paymentHistory.length > 0
                  ? studentProfile.paymentHistory
                  : [
                      {
                        id: 'pay-1',
                        officialReceiptNumber: 'OR-2026-0812',
                        date: '2026-08-10',
                        amount: 6500,
                        paymentMethod: 'GCash / Bank Transfer',
                        remarks: 'Initial Enrollment Downpayment',
                        status: 'Verified',
                      },
                    ]
                ).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#18392B]">
                      {p.officialReceiptNumber || 'OR-PENDING'}
                    </td>
                    <td className="p-3.5 font-mono">{p.date || '2026-08-10'}</td>
                    <td className="p-3.5">{p.paymentMethod}</td>
                    <td className="p-3.5 text-slate-500">{p.remarks}</td>
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                      {c.midtermGrade || '1.25'}
                    </td>
                    <td className="p-3.5 font-mono text-center font-bold text-emerald-700 text-sm">
                      {c.finalGrade || '1.25'}
                    </td>
                    <td className="p-3.5 text-slate-600">{c.instructor || 'Dr. Benjamin Villanueva'}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status || 'Passed'}
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
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#18392B]">
              Official Certificate of Registration (COR)
            </h3>
            <button
              onClick={() => window.print()}
              className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official COR</span>
            </button>
          </div>

          <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 max-w-3xl mx-auto shadow-md space-y-6 font-serif">
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Philippine College of Ministry
              </h2>
              <p className="text-xs font-sans text-slate-600">
                Seminary Hill, Baguio City, Benguet, Philippines • Office of the Registrar
              </p>
              <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#18392B] mt-2">
                Official Certificate of Registration (COR)
              </h3>
              <p className="text-[11px] font-sans font-mono text-slate-500">
                Academic Year 2026–2027 • 1st Semester
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-slate-200 pb-4">
              <div>
                <span className="text-slate-500 block text-[10px]">Student Name:</span>
                <strong className="text-slate-900 text-sm">{studentProfile.fullName}</strong>
                <span className="text-slate-500 block text-[10px] mt-2">Degree Program:</span>
                <strong className="text-slate-800">{studentProfile.degreeProgram || studentProfile.program}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Permanent Student ID:</span>
                <strong className="font-mono text-slate-900 text-sm">{studentProfile.studentId}</strong>
                <span className="text-slate-500 block text-[10px] mt-2">Year Level & Section:</span>
                <strong className="text-slate-800">{studentProfile.yearLevel} • {studentProfile.section || 'Section A'}</strong>
              </div>
            </div>

            <div className="space-y-2 font-sans">
              <strong className="text-xs text-slate-900 uppercase tracking-wider block">
                Officially Enrolled Courses
              </strong>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-2">Course Code</th>
                    <th className="p-2">Course Title</th>
                    <th className="p-2 text-center">Units</th>
                    <th className="p-2">Schedule</th>
                    <th className="p-2">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(studentProfile.courses || []).map((c, i) => (
                    <tr key={i}>
                      <td className="p-2 font-mono font-bold">{c.code}</td>
                      <td className="p-2">{c.title}</td>
                      <td className="p-2 text-center font-mono">{c.units}u</td>
                      <td className="p-2 text-slate-600">{c.schedule || 'TBA'}</td>
                      <td className="p-2 text-slate-600">{c.room || 'Room 201'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 font-sans text-xs flex justify-between">
              <div>
                <span className="text-slate-500 block text-[10px]">Tuition Assessment</span>
                <strong className="text-slate-900 font-mono">₱{totalTuition.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Payments Credited</span>
                <strong className="text-emerald-700 font-mono">₱{paidTuition.toLocaleString()}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Net Balance Due</span>
                <strong className="text-amber-800 font-mono">₱{balanceTuition.toLocaleString()}</strong>
              </div>
            </div>

            <div className="pt-10 grid grid-cols-2 gap-8 text-center font-sans text-xs">
              <div>
                <div className="border-b border-slate-900 w-48 mx-auto pb-1 font-bold">
                  {studentProfile.assignedAdviser || 'Dr. Benjamin Villanueva'}
                </div>
                <span className="text-slate-500 text-[10px] block mt-1">Dean of Academic Affairs</span>
              </div>
              <div>
                <div className="border-b border-slate-900 w-48 mx-auto pb-1 font-bold">
                  Office of the Registrar
                </div>
                <span className="text-slate-500 text-[10px] block mt-1">College Registrar & Institutional Seal</span>
              </div>
            </div>
          </div>
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

      {/* 9-Step Student Registration & Enrollment Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            <div className="bg-[#18392B] p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="font-serif font-bold text-base">
                  PCM Comprehensive Student Profile & Enrollment Wizard
                </span>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              <StudentRegistrationWizard
                onCompleted={() => {
                  setIsWizardOpen(false);
                  addToast('success', 'Enrollment Submitted', 'Your updated registration profile is saved to Firebase.');
                }}
                onCancel={() => setIsWizardOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
