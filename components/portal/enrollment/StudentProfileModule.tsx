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
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { StudentProfile } from '@/lib/types';

export const StudentProfileModule: React.FC = () => {
  const { studentProfile, updateStudentProfile, addToast } = usePCM();
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form edit state
  const [formData, setFormData] = useState({
    phone: studentProfile.phone || '',
    email: studentProfile.email || '',
    address: studentProfile.address || '',
    homeChurch: studentProfile.homeChurch || '',
    pastorName: studentProfile.pastorName || '',
    presbytery: studentProfile.presbytery || 'Northern Luzon Evangelical Fellowship',
    emergencyContactName: studentProfile.emergencyContactName || '',
    emergencyContactRelation: studentProfile.emergencyContactRelation || '',
    emergencyContactPhone: studentProfile.emergencyContactPhone || '',
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentProfile.studentId);
    setCopiedId(true);
    addToast('info', 'Student ID Copied', `${studentProfile.studentId} copied to clipboard.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateStudentProfile(studentProfile.studentId, formData);
    if (success) {
      setIsEditing(false);
    }
  };

  const completedUnits = (studentProfile.courses || [])
    .filter((c) => c.status === 'Completed' || c.finalGrade)
    .reduce((sum, c) => sum + (c.units || 0), 64);

  const totalCurriculumUnits = 128;
  const progressPercent = Math.min(100, Math.round((completedUnits / totalCurriculumUnits) * 100));

  return (
    <div id="pcm-student-profile-module" className="space-y-6">
      {/* Primary Institutional Identity Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-100/50 via-purple-50/20 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#18392B] to-[#588B76] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md ring-4 ring-purple-100">
              {studentProfile.fullName
                ? studentProfile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                : 'ST'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
                  {studentProfile.fullName}
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {studentProfile.enrollmentStatus || 'Officially Enrolled'}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-700" />
                <span>{studentProfile.degreeProgram}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {studentProfile.yearLevel}
                </span>
                <span className="text-slate-300">•</span>
                <span>{studentProfile.currentSemester}</span>
              </p>

              {/* Student ID Badging */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Official ID:</span>
                  <strong className="font-mono text-sm font-bold text-[#18392B]">
                    {studentProfile.studentId}
                  </strong>
                  <button
                    onClick={handleCopyId}
                    title="Copy Student ID"
                    className="text-slate-400 hover:text-purple-700 transition ml-1 p-0.5 rounded"
                  >
                    {copiedId ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100/70 px-2.5 py-1 rounded-lg border border-purple-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {studentProfile.academicStatus || "Dean's Honor List"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white hover:bg-slate-50 text-purple-800 border border-purple-300 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-xs"
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile Information'}</span>
            </button>

            <div className="text-[11px] text-slate-500 font-mono">
              Academic Term: AY 2026–2027 (1st Sem)
            </div>
          </div>
        </div>

        {/* Academic Degree Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-700" />
              Degree Progress — Bachelor of Theology Curriculum
            </span>
            <span className="font-mono font-bold text-purple-900">
              {completedUnits} / {totalCurriculumUnits} Units Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-700 to-[#18392B] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Profile Edit Form Modal/Drawer if active */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-purple-50/50 rounded-2xl border-2 border-purple-300 p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-purple-200 pb-3">
            <h3 className="font-serif text-lg font-bold text-purple-950 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-700" />
              Update Contact & Ministry Information
            </h3>
            <span className="text-xs text-purple-700 font-medium">Changes sync directly to your official student record</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="+63 917 123 4567"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Personal Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="student@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Complete Home Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Brgy. Lamtang, La Trinidad, Benguet"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Home Church / Ministry Congregation</label>
              <input
                type="text"
                value={formData.homeChurch}
                onChange={(e) => setFormData({ ...formData, homeChurch: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Baguio Christian Fellowship"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sponsoring / Senior Pastor</label>
              <input
                type="text"
                value={formData.pastorName}
                onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Rev. Danilo Santos"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Person</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Maria Dela Cruz"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Relationship & Phone</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                  className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Mother / Spouse"
                />
                <input
                  type="text"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="+63 918..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Record Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Profile Information Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Academic Standing & Advisor */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">Academic Standing & Advisory</h3>
              <p className="text-[11px] text-slate-500">Official scholastic standing at Philippine College of Ministry</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Cumulative GPA</span>
              <strong className="font-mono text-lg font-extrabold text-[#18392B]">
                {studentProfile.gpa || '1.28'}
              </strong>
              <span className="text-[10px] text-emerald-700 block font-medium">President&apos;s Honor Level</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Term Load</span>
              <strong className="font-mono text-lg font-extrabold text-purple-900">
                {(studentProfile.courses || []).reduce((sum, c) => sum + (c.units || 0), 0)} Units
              </strong>
              <span className="text-[10px] text-slate-600 block">
                {(studentProfile.courses || []).length} Subjects Enrolled
              </span>
            </div>

            <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Appointed Academic Advisor</span>
              <strong className="text-slate-900 block font-serif text-sm">
                Dr. Jonathan Reyes, Th.D.
              </strong>
              <p className="text-[11px] text-slate-600">Dean of Academic Affairs & Professor of Systematic Theology</p>
            </div>

            <div className="col-span-2 bg-purple-50/50 p-3 rounded-xl border border-purple-200 text-purple-900">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px]">Academic Clearance Status</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  Fully Cleared
                </span>
              </div>
              <p className="text-[10px] text-purple-700 mt-1">
                Prerequisites verified. Library, registrar, and spiritual life obligations in good order.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Personal & Contact Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">Personal & Contact Details</h3>
              <p className="text-[11px] text-slate-500">Institutional records registered with the Registrar</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date of Birth / Age:
              </span>
              <span className="font-semibold text-slate-900">October 14, 2002 (23 yrs)</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Number:
              </span>
              <span className="font-mono font-semibold text-slate-900">{studentProfile.phone || '+63 917 842 1904'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Student Email:
              </span>
              <span className="font-mono text-slate-900">{studentProfile.email || 'j.delacruz@student.pcm.edu.ph'}</span>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Current Address:
              </span>
              <span className="font-medium text-slate-900 text-right max-w-[220px]">
                {studentProfile.address || 'Km. 6, Lamtang, La Trinidad, 2601 Benguet'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Civil Status / Citizenship:</span>
              <span className="font-semibold text-slate-900">Single • Filipino</span>
            </div>
          </div>
        </div>

        {/* Section 3: Ministry & Pastoral Background */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Church className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">Ministry & Church Endorsement</h3>
              <p className="text-[11px] text-slate-500">Sending congregation and spiritual endorsement</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Home Congregation</span>
              <strong className="text-slate-900 block font-serif text-sm">
                {studentProfile.homeChurch || 'Baguio Christian Fellowship (Central Assembly)'}
              </strong>
              <p className="text-[11px] text-slate-600">Sponsoring Pastor: {studentProfile.pastorName || 'Rev. Danilo Santos, M.Div.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block text-[10px]">Ministry Calling Focus</span>
                <strong className="text-slate-900 font-semibold">Pastoral Preaching & Youth</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block text-[10px]">Water Baptism Year</span>
                <strong className="text-slate-900 font-semibold">2018 (Confirmed)</strong>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Spiritual Formation Mentor</span>
              <strong className="text-slate-900 font-semibold">Pastor Jonathan Reyes</strong>
              <span className="text-[10px] text-slate-500 block">Weekly Discipleship Group #04</span>
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Contacts & Health Record */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">Emergency Contact & Safety</h3>
              <p className="text-[11px] text-slate-500">Designated contact for campus emergencies</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Designated Contact</span>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                  {studentProfile.emergencyContactRelation || 'Mother'}
                </span>
              </div>
              <strong className="font-serif text-sm block font-bold text-slate-900">
                {studentProfile.emergencyContactName || 'Maria Elena Dela Cruz'}
              </strong>
              <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{studentProfile.emergencyContactPhone || '+63 918 234 5678'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Campus Clinic Health Record</span>
              <div className="flex justify-between items-center text-slate-700">
                <span>Blood Type: <strong className="font-mono">O+</strong></span>
                <span>Medical Clearance: <strong className="text-emerald-700 font-semibold">Valid (AY 26–27)</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
