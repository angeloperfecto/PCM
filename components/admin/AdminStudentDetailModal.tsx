'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  StudentProfile,
  StudentRequirementItem,
  StudentSubjectHistory,
  StudentPaymentRecord,
  EnrollmentStatus,
} from '@/lib/types';
import {
  calculateGPAFromGrades,
  getDefaultStudentRequirements,
} from '@/lib/studentDefaults';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Church,
  BookOpen,
  Award,
  ShieldCheck,
  Calendar,
  HeartHandshake,
  DollarSign,
  FileCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Save,
  Eye,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AdminStudentDetailModalProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminStudentDetailModal: React.FC<AdminStudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const {
    updateStudentProfile,
    updateStudentRequirementStatus,
    addStudentSubjectHistory,
    updateStudentSubjectHistory,
    deleteStudentSubjectHistory,
    recordStudentPayment,
    updateStudentPaymentRecord,
    updateStudentEnrollmentStatus,
    addToast,
    logActivity,
    programs,
    faculty,
  } = usePCM();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'requirements' | 'academics' | 'payments' | 'advising' | 'cor'
  >('profile');

  // Edit Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<StudentProfile>>({});

  // Add Subject Grade State
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: 'THEO 101',
    title: 'Biblical Hermeneutics & Exegesis',
    units: 3,
    semester: '1st Semester, AY 2026–2027',
    academicYear: '2026–2027',
    midtermGrade: '1.25',
    finalGrade: '1.25',
    grade: '1.25',
    instructor: 'Dr. Benjamin Villanueva',
    status: 'Passed' as 'Passed' | 'In Progress' | 'Incomplete' | 'Credited' | 'Failed',
  });

  // Record Payment State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState(() => ({
    amount: 5000,
    paymentMethod: 'GCash / Bank Transfer',
    referenceNumber: 'REF-202601',
    officialReceiptNumber: 'OR-2026-001',
    remarks: 'Tuition installment payment',
  }));

  // Requirement Verification State
  const [verifyingReqId, setVerifyingReqId] = useState<string | null>(null);
  const [reqRemarks, setReqRemarks] = useState('');

  if (!isOpen || !student) return null;

  // Initialize edit form when starting editing
  const handleStartEdit = () => {
    setProfileForm({
      fullName: student.fullName || student.name || '',
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      suffix: student.suffix || '',
      preferredName: student.preferredName || '',
      email: student.email || '',
      mobileNumber: student.mobileNumber || student.phone || '',
      dateOfBirth: student.dateOfBirth || student.birthDate || '',
      placeOfBirth: student.placeOfBirth || '',
      sex: student.sex || student.gender || 'Male',
      civilStatus: student.civilStatus || 'Single',
      nationality: student.nationality || 'Filipino',
      religion: student.religion || 'Christian',
      currentAddress: student.currentAddress || student.address || '',
      permanentAddress: student.permanentAddress || student.address || '',
      city: student.city || 'Baguio City',
      province: student.province || 'Benguet',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      guardianName: student.guardianName || '',
      guardianContactNumber: student.guardianContactNumber || '',
      emergencyContactPerson: student.emergencyContactPerson || student.emergencyContactName || '',
      emergencyContactNumber: student.emergencyContactNumber || student.emergencyContactPhone || '',
      emergencyContactRelationship: student.emergencyContactRelationship || '',
      lastSchoolAttended: student.lastSchoolAttended || '',
      highestEducationalAttainment: student.highestEducationalAttainment || '',
      previousCourse: student.previousCourse || '',
      yearGraduated: student.yearGraduated || '',
      homeChurch: student.homeChurch || student.churchName || '',
      pastorName: student.pastorName || '',
      pastorContactNumber: student.pastorContactNumber || '',
      ministryDepartment: student.ministryDepartment || '',
      ministryRole: student.ministryRole || '',
      program: student.program || student.degreeProgram || '',
      yearLevel: student.yearLevel || '1st Year',
      section: student.section || 'Section A',
      assignedAdviser: student.assignedAdviser || 'Dr. Benjamin Villanueva',
      academicStatus: student.academicStatus || 'Regular',
      enrollmentStatus: student.enrollmentStatus || 'Enrolled',
      adminNotes: student.adminNotes || '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const success = await updateStudentProfile(student.id, profileForm);
    if (success) {
      setIsEditingProfile(false);
      addToast('success', 'Profile Updated', 'Official student record synchronized with Firestore.');
    }
  };

  // Requirement status update
  const handleUpdateReqStatus = async (
    reqId: string,
    status: StudentRequirementItem['status']
  ) => {
    const success = await updateStudentRequirementStatus(student.id, reqId, status, reqRemarks);
    if (success) {
      setVerifyingReqId(null);
      setReqRemarks('');
      addToast('success', 'Requirement Updated', `Document marked as ${status}.`);
    }
  };

  // Add Subject Grade
  const handleAddSubjectGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addStudentSubjectHistory(student.id, {
      code: newSubject.code,
      title: newSubject.title,
      units: Number(newSubject.units),
      semester: newSubject.semester,
      academicYear: newSubject.academicYear,
      midtermGrade: newSubject.midtermGrade,
      finalGrade: newSubject.finalGrade,
      grade: newSubject.finalGrade,
      instructor: newSubject.instructor,
      status: newSubject.status,
    });

    if (success) {
      setIsAddSubjectOpen(false);
      addToast('success', 'Subject Grade Recorded', `${newSubject.code} added to student permanent ledger.`);
    }
  };

  // Delete Subject Grade
  const handleDeleteSubject = async (subjectIdOrCode: string) => {
    if (!confirm('Are you sure you want to remove this course grade from the student ledger?')) return;
    const success = await deleteStudentSubjectHistory(student.id, subjectIdOrCode);
    if (success) {
      addToast('info', 'Subject Removed', 'Course entry deleted from academic ledger.');
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await recordStudentPayment(student.id, {
      amount: Number(newPayment.amount),
      paymentMethod: newPayment.paymentMethod,
      referenceNumber: newPayment.referenceNumber,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Verified',
      officialReceiptNumber: newPayment.officialReceiptNumber,
      remarks: newPayment.remarks,
    });

    if (success) {
      setIsRecordPaymentOpen(false);
      addToast('success', 'Payment Credited', `Official receipt ${newPayment.officialReceiptNumber} issued.`);
    }
  };

  // Requirements list with fallback
  const requirementsList = student.requirements && student.requirements.length > 0
    ? student.requirements
    : getDefaultStudentRequirements();

  // Subject history list
  const subjectsList = student.subjectHistory || [];

  // Payment history list
  const paymentList = student.paymentHistory || student.paymentRecords || [];

  return (
    <div id="pcm-admin-student-modal" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Institutional Header */}
        <div className="bg-[#18392B] text-white p-5 flex items-center justify-between border-b-2 border-[#588B76]">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-white/20 shrink-0">
              {student.avatarUrl || student.profilePhoto ? (
                <Image
                  src={student.avatarUrl || student.profilePhoto || ''}
                  alt={student.fullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm">
                  {student.fullName ? student.fullName.slice(0, 2).toUpperCase() : 'ST'}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                  {student.fullName || student.name}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold bg-[#588B76]/30 text-emerald-300 border border-emerald-400/20">
                  {student.academicStatus || 'Regular'}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  {student.enrollmentStatus || 'Enrolled'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Permanent ID: <strong className="text-white">{student.studentId}</strong> • App Ref:{' '}
                {student.applicationNumber || 'N/A'} • {student.program || student.degreeProgram}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
          {[
            { id: 'profile', label: 'Student Profile', icon: User },
            { id: 'requirements', label: 'Requirements Checklist', icon: FileCheck, count: requirementsList.filter((r) => r.status === 'Submitted' || r.status === 'Pending').length },
            { id: 'academics', label: 'Permanent Academic Ledger', icon: BookOpen, count: subjectsList.length },
            { id: 'payments', label: 'Tuition & Payments', icon: DollarSign },
            { id: 'advising', label: 'Advising & Status', icon: Award },
            { id: 'cor', label: 'Official COR Voucher', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#18392B] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-[#588B76]'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-500 text-white font-bold'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* ========================================================================= */}
          {/* TAB 1: PROFILE & PERSONAL DETAILS */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Comprehensive Student Information
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Complete demographic, family, and church background as recorded in Cloud Firestore.
                  </p>
                </div>

                {!isEditingProfile ? (
                  <button
                    onClick={handleStartEdit}
                    className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile Data</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card: Personal Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] border-b border-slate-200 pb-1.5">
                      1. Personal Information
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Full Legal Name:</span>
                        <strong className="text-slate-900">{student.fullName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date of Birth:</span>
                        <strong className="text-slate-900">{student.dateOfBirth || student.birthDate || 'N/A'} ({student.age || '—'} yrs)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Place of Birth:</span>
                        <strong className="text-slate-900">{student.placeOfBirth || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sex / Gender:</span>
                        <strong className="text-slate-900">{student.sex || student.gender || 'Male'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Civil Status:</span>
                        <strong className="text-slate-900">{student.civilStatus || 'Single'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nationality:</span>
                        <strong className="text-slate-900">{student.nationality || 'Filipino'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Religion:</span>
                        <strong className="text-slate-900">{student.religion || 'Christian'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card: Contact Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] border-b border-slate-200 pb-1.5">
                      2. Contact Information
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Primary Mobile:</span>
                        <strong className="text-slate-900 font-mono">{student.mobileNumber || student.phone || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email Address:</span>
                        <strong className="text-slate-900 font-mono">{student.email}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Facebook Profile:</span>
                        <strong className="text-slate-900">{student.facebookAccount || 'None'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Address:</span>
                        <strong className="text-slate-900 text-right max-w-[200px] truncate">{student.currentAddress || student.address || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Permanent Address:</span>
                        <strong className="text-slate-900 text-right max-w-[200px] truncate">{student.permanentAddress || student.address || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">City / Municipality:</span>
                        <strong className="text-slate-900">{student.city || 'Baguio City'}, {student.province || 'Benguet'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card: Family Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] border-b border-slate-200 pb-1.5">
                      3. Family & Emergency Contact
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Father&apos;s Name:</span>
                        <strong className="text-slate-900">{student.fatherName || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mother&apos;s Maiden Name:</span>
                        <strong className="text-slate-900">{student.motherName || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Guardian Name:</span>
                        <strong className="text-slate-900">{student.guardianName || student.emergencyContactName || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Emergency Contact Person:</span>
                        <strong className="text-slate-900">{student.emergencyContactPerson || student.emergencyContactName || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Emergency Number:</span>
                        <strong className="text-slate-900 font-mono">{student.emergencyContactNumber || student.emergencyContactPhone || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Relationship:</span>
                        <strong className="text-slate-900">{student.emergencyContactRelationship || student.emergencyContactRelation || 'Parent'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card: Church & Ministry */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] border-b border-slate-200 pb-1.5">
                      4. Church & Ministry Background
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Home Church:</span>
                        <strong className="text-slate-900">{student.homeChurch || student.churchName || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pastor / Overseer:</span>
                        <strong className="text-slate-900">{student.pastorName || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pastor Contact:</span>
                        <strong className="text-slate-900 font-mono">{student.pastorContactNumber || student.pastorPhone || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ministry Role:</span>
                        <strong className="text-slate-900">{student.ministryRole || 'Youth Leader'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ministry Department:</span>
                        <strong className="text-slate-900">{student.ministryDepartment || 'Music / Youth'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Spiritual Mentor:</span>
                        <strong className="text-slate-900">{student.mentorName || student.spiritualMentor || 'Dr. Benjamin Villanueva'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Editable Profile Form */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={profileForm.fullName || ''}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth || ''}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={profileForm.mobileNumber || ''}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Home Church</label>
                    <input
                      type="text"
                      value={profileForm.homeChurch || ''}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, homeChurch: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Pastor Name</label>
                    <input
                      type="text"
                      value={profileForm.pastorName || ''}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, pastorName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContactPerson || ''}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, emergencyContactPerson: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REQUIREMENTS CHECKLIST & VERIFICATION */}
          {/* ========================================================================= */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Official Admissions Requirement Documents
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Inspect student credentials, download attached files, and mark verification statuses.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {requirementsList.map((req) => {
                  const hasFile = req.file && req.file.url;
                  const isVerifying = verifyingReqId === req.id;

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-xl border transition ${
                        req.status === 'Verified'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : req.status === 'Rejected'
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 text-xs">{req.name}</strong>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                req.status === 'Verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'Submitted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : req.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {req.status}
                            </span>
                            {req.required && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                                Mandatory
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{req.description}</p>

                          {hasFile && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[11px] font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5 text-[#588B76]" />
                                {req.file?.name}
                              </span>
                              <a
                                href={req.file?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-[#588B76] hover:underline inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview File</span>
                              </a>
                            </div>
                          )}

                          {req.remarks && (
                            <p className="text-[11px] text-slate-500 italic mt-1">
                              Registrar Notes: {req.remarks}
                            </p>
                          )}
                        </div>

                        {/* Verification Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {req.status !== 'Verified' && (
                            <button
                              onClick={() => handleUpdateReqStatus(req.id, 'Verified')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                          )}

                          {req.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                setVerifyingReqId(req.id);
                                const reason = prompt('State rejection reason or required correction:', 'Missing official signature or unclear photocopy.');
                                if (reason) {
                                  updateStudentRequirementStatus(student.id, req.id, 'Rejected', reason);
                                }
                              }}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ACADEMIC RECORDS & SUBJECT HISTORY */}
          {/* ========================================================================= */}
          {activeTab === 'academics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Official Scholastic Transcript & Permanent Grades Ledger
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Academic grades, term GPA, and earned units credited toward the curriculum.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddSubjectOpen(true)}
                  className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Subject Grade</span>
                </button>
              </div>

              {/* GPA & Units Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Cumulative GPA</span>
                  <strong className="font-mono text-xl font-bold text-[#18392B]">
                    {student.gpa ? student.gpa.toFixed(2) : calculateGPAFromGrades(subjectsList).toFixed(2)}
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Enrolled Subjects</span>
                  <strong className="font-mono text-xl font-bold text-slate-800">
                    {subjectsList.length} Courses
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Earned Units</span>
                  <strong className="font-mono text-xl font-bold text-emerald-700">
                    {subjectsList.filter((s) => s.status === 'Passed' || s.grade).reduce((sum, s) => sum + (s.units || 3), 0)} Units
                  </strong>
                </div>
              </div>

              {/* Subjects Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-3">Course Code</th>
                      <th className="p-3">Descriptive Title</th>
                      <th className="p-3">Units</th>
                      <th className="p-3">Midterm</th>
                      <th className="p-3">Final</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectsList.length > 0 ? (
                      subjectsList.map((subj) => (
                        <tr key={subj.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-[#18392B]">{subj.code}</td>
                          <td className="p-3 font-medium text-slate-900">{subj.title}</td>
                          <td className="p-3 font-mono">{subj.units || 3}</td>
                          <td className="p-3 font-mono font-bold">{subj.midtermGrade || '—'}</td>
                          <td className="p-3 font-mono font-bold text-emerald-700">{subj.finalGrade || subj.grade || '—'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {subj.status || 'Passed'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteSubject(subj.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete Course Grade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No historical subject grades recorded yet. Click &quot;Record Subject Grade&quot; above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal: Add Subject Grade */}
              {isAddSubjectOpen && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <strong className="text-slate-800 text-xs">Record Official Subject Grade</strong>
                    <button onClick={() => setIsAddSubjectOpen(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddSubjectGrade} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Course Code</label>
                      <input
                        type="text"
                        value={newSubject.code}
                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Subject Title</label>
                      <input
                        type="text"
                        value={newSubject.title}
                        onChange={(e) => setNewSubject({ ...newSubject, title: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Units</label>
                      <input
                        type="number"
                        value={newSubject.units}
                        onChange={(e) => setNewSubject({ ...newSubject, units: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Midterm Grade</label>
                      <input
                        type="text"
                        value={newSubject.midtermGrade}
                        onChange={(e) => setNewSubject({ ...newSubject, midtermGrade: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Final Grade</label>
                      <input
                        type="text"
                        value={newSubject.finalGrade}
                        onChange={(e) => setNewSubject({ ...newSubject, finalGrade: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Instructor</label>
                      <input
                        type="text"
                        value={newSubject.instructor}
                        onChange={(e) => setNewSubject({ ...newSubject, instructor: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-[#18392B] hover:bg-[#588B76] text-white font-bold py-1.5 rounded text-xs transition"
                      >
                        Save Course Entry
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: TUITION & PAYMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Tuition Assessment & Payment Ledger
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Financial billing summary, official receipts, and balance tracking.
                  </p>
                </div>

                <button
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Official Receipt / Payment</span>
                </button>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Assessment</span>
                  <strong className="font-mono text-xl font-bold text-slate-900">
                    ₱{(student.tuitionTotal || 18500).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Total Amount Paid</span>
                  <strong className="font-mono text-xl font-bold text-emerald-800">
                    ₱{(student.tuitionPaid || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                  <span className="text-amber-700 block text-[10px] uppercase font-bold">Outstanding Balance</span>
                  <strong className="font-mono text-xl font-bold text-amber-900">
                    ₱{(student.tuitionBalance ?? Math.max(0, (student.tuitionTotal || 18500) - (student.tuitionPaid || 0))).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Payments History Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-3">Official Receipt (OR)</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Reference / Remarks</th>
                      <th className="p-3 text-right">Amount Paid</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentList.length > 0 ? (
                      paymentList.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-[#18392B]">
                            {pay.officialReceiptNumber || 'OR-PENDING'}
                          </td>
                          <td className="p-3 font-mono">{pay.paymentDate || pay.date}</td>
                          <td className="p-3">{pay.paymentMethod || 'Bank Deposit'}</td>
                          <td className="p-3 text-slate-500">{pay.remarks || pay.referenceNumber || 'Tuition'}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ₱{(pay.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {pay.status || 'Verified'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          No payment transactions recorded yet. Click &quot;Issue Official Receipt&quot; to credit tuition.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Record Payment Form */}
              {isRecordPaymentOpen && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <strong className="text-slate-800 text-xs">Record Tuition Collection & Issue OR</strong>
                    <button onClick={() => setIsRecordPaymentOpen(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleRecordPayment} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Official Receipt No. (OR)</label>
                      <input
                        type="text"
                        value={newPayment.officialReceiptNumber}
                        onChange={(e) => setNewPayment({ ...newPayment, officialReceiptNumber: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Amount (₱)</label>
                      <input
                        type="number"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Payment Method</label>
                      <select
                        value={newPayment.paymentMethod}
                        onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                      >
                        <option value="GCash / Bank Transfer">GCash / Electronic Bank Transfer</option>
                        <option value="Cash at Cashier Window">Cash at Cashier Window</option>
                        <option value="Church Sponsor Check">Church Sponsor Check</option>
                        <option value="Scholarship Grant">Scholarship Grant Voucher</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Remarks / Reference Code</label>
                      <input
                        type="text"
                        value={newPayment.remarks}
                        onChange={(e) => setNewPayment({ ...newPayment, remarks: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 rounded text-xs transition cursor-pointer"
                      >
                        Issue Receipt & Post Ledger
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ADVISING & STATUS */}
          {/* ========================================================================= */}
          {activeTab === 'advising' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="font-serif text-base font-bold text-slate-900">
                  Academic Advising & Enrollment Governance
                </h4>
                <p className="text-[11px] text-slate-500">
                  Modify enrollment status, cohort section, appointed faculty adviser, and administrative remarks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                    Institutional Standing
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Enrollment Standing
                    </label>
                    <select
                      value={student.enrollmentStatus || 'Enrolled'}
                      onChange={async (e) => {
                        await updateStudentEnrollmentStatus(student.id, e.target.value as EnrollmentStatus);
                        addToast('success', 'Status Updated', `Enrollment changed to ${e.target.value}.`);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted (For Review)</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Enrolled">Officially Enrolled</option>
                      <option value="For Revision">Returned for Revision</option>
                      <option value="Rejected">Application Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Academic Cohort Section
                    </label>
                    <input
                      type="text"
                      defaultValue={student.section || 'Section A'}
                      onBlur={async (e) => {
                        await updateStudentProfile(student.id, { section: e.target.value });
                        addToast('info', 'Section Updated', `Cohort set to ${e.target.value}.`);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Assigned Faculty Adviser
                    </label>
                    <input
                      type="text"
                      defaultValue={student.assignedAdviser || 'Dr. Benjamin Villanueva'}
                      onBlur={async (e) => {
                        await updateStudentProfile(student.id, { assignedAdviser: e.target.value });
                        addToast('info', 'Adviser Updated', `Adviser set to ${e.target.value}.`);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                    Registrar Confidential Notes & Remarks
                  </span>
                  <textarea
                    rows={6}
                    defaultValue={student.adminNotes || ''}
                    onBlur={async (e) => {
                      await updateStudentProfile(student.id, { adminNotes: e.target.value });
                      addToast('info', 'Notes Saved', 'Registrar notes synchronized to Firestore.');
                    }}
                    placeholder="Enter confidential admissions notes, clearance follow-ups, or disciplinary status..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    Notes are strictly private to administrators and registrars.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PRINTABLE COR VOUCHER */}
          {/* ========================================================================= */}
          {activeTab === 'cor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Official Certificate of Registration (COR)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Institutional enrollment voucher ready for printing or digital PDF export.
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
              </div>

              {/* Printable Voucher Paper */}
              <div className="bg-white border-2 border-slate-300 rounded-xl p-8 max-w-3xl mx-auto shadow-md space-y-6 font-serif">
                {/* Header */}
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
                    1st Semester, Academic Year 2026–2027
                  </p>
                </div>

                {/* Student Info Box */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Student Name:</span>
                    <strong className="text-slate-900 text-sm">{student.fullName}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Permanent Student ID:</span>
                    <strong className="font-mono text-slate-900 text-sm">{student.studentId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Degree Program:</span>
                    <strong className="text-slate-800">{student.program || student.degreeProgram}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Year Level & Section:</span>
                    <strong className="text-slate-800">{student.yearLevel} • {student.section || 'Section A'}</strong>
                  </div>
                </div>

                {/* Courses Table */}
                <div className="space-y-2 font-sans">
                  <strong className="text-xs text-slate-900 uppercase tracking-wider block">
                    Officially Enlisted Courses
                  </strong>
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-2">Course Code</th>
                        <th className="p-2">Course Title</th>
                        <th className="p-2 text-center">Units</th>
                        <th className="p-2">Schedule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(student.courses && student.courses.length > 0
                        ? student.courses
                        : [
                            { code: 'THEO 101', title: 'Systematic Theology I', units: 3, schedule: 'M/Th 8:30–10:00' },
                            { code: 'BIBL 102', title: 'New Testament Survey', units: 3, schedule: 'T/F 10:30–12:00' },
                            { code: 'MINI 105', title: 'Principles of Christian Leadership', units: 3, schedule: 'W 1:30–4:30' },
                          ]
                      ).map((c, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono font-bold">{c.code}</td>
                          <td className="p-2">{c.title}</td>
                          <td className="p-2 text-center font-mono">{c.units}u</td>
                          <td className="p-2 text-slate-600">{c.schedule || 'TBA'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tuition Assessment */}
                <div className="border border-slate-300 rounded-lg p-3 font-sans text-xs flex justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Tuition Assessment</span>
                    <strong className="text-slate-900 font-mono">₱{(student.tuitionTotal || 18500).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Payments Credited</span>
                    <strong className="text-emerald-700 font-mono">₱{(student.tuitionPaid || 0).toLocaleString()}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Net Remaining Balance</span>
                    <strong className="text-amber-800 font-mono">
                      ₱{(student.tuitionBalance ?? Math.max(0, (student.tuitionTotal || 18500) - (student.tuitionPaid || 0))).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-10 grid grid-cols-2 gap-8 text-center font-sans text-xs">
                  <div>
                    <div className="border-b border-slate-900 w-48 mx-auto pb-1 font-bold">
                      {student.assignedAdviser || 'Dr. Benjamin Villanueva'}
                    </div>
                    <span className="text-slate-500 text-[10px] block mt-1">Dean of Academic Affairs</span>
                  </div>

                  <div>
                    <div className="border-b border-slate-900 w-48 mx-auto pb-1 font-bold">
                      Office of the Registrar
                    </div>
                    <span className="text-slate-500 text-[10px] block mt-1">Institutional Seal & Registrar</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Record ID: {student.id} • Last synchronized with Firestore
          </span>
          <button
            onClick={onClose}
            className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
