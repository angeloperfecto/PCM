'use client';

import React, { useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { EnrollmentSystemConfig } from '@/lib/types';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Bell,
  Download,
  ShieldAlert,
  HelpCircle,
  Database,
} from 'lucide-react';

export const EnrollmentSettingsAdminView: React.FC = () => {
  const {
    enrollmentConfig,
    updateEnrollmentConfig,
    canPerformEnrollmentAction,
    enrollments,
    preEnlistments,
    addDropRequests,
    students,
    addToast,
  } = usePCM();

  const [formData, setFormData] = useState<EnrollmentSystemConfig>(enrollmentConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (enrollmentConfig) {
      setFormData(enrollmentConfig);
    }
  }, [enrollmentConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateEnrollmentConfig(formData);
      addToast('success', 'Settings Saved', 'System enrollment policies and access toggles updated.');
    } catch (err) {
      addToast('error', 'Error', 'Failed to update enrollment settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const exportBundle = {
      timestamp: new Date().toISOString(),
      institution: 'Philippine College of Ministry',
      systemConfig: formData,
      statistics: {
        totalStudents: students.length,
        totalEnrollments: enrollments.length,
        totalPreEnlistments: preEnlistments.length,
        totalAddDropRequests: addDropRequests.length,
      },
      enrollments,
      preEnlistments,
      addDropRequests,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PCM_Enrollment_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast('success', 'Backup Exported', 'Enrollment database archive downloaded as JSON.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>Enrollment System Governance & Portal Controls</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure student accessibility switches, enrollment windows, institutional notice banners, and data archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportData}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Enrollment Data</span>
          </button>

          {canPerformEnrollmentAction('manage_settings') && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#18392B] text-white hover:bg-[#23523e] transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Accessibility Switches */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
              <Unlock className="w-4 h-4 text-[#18392B]" />
              <span>Student Portal Feature Switches</span>
            </h4>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Allow Pre-Enlistment */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Student Pre-Enlistment</span>
                  <span className="text-slate-500 text-[11px]">
                    Enables the Pre-enlistment module in the student portal for selecting prospective courses.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowPreEnlistment}
                    onChange={(e) => setFormData({ ...formData, allowPreEnlistment: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#18392B]"></div>
                </label>
              </div>

              {/* Allow Official Registration */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Official Online Registration</span>
                  <span className="text-slate-500 text-[11px]">
                    Allows students to proceed with formal enrollment submission and section reservation.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowOnlineRegistration}
                    onChange={(e) => setFormData({ ...formData, allowOnlineRegistration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#18392B]"></div>
                </label>
              </div>

              {/* Allow Adding & Dropping */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Adding & Dropping of Subjects</span>
                  <span className="text-slate-500 text-[11px]">
                    Permits students to file add/drop course modification requests online.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowAddingDropping}
                    onChange={(e) => setFormData({ ...formData, allowAddingDropping: e.target.value === 'on' ? e.target.checked : false })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#18392B]"></div>
                </label>
              </div>

              {/* Finance Clearance Prerequisite */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Require Finance Clearance Before Approval
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Restricts enrollment approval until prior account balance is zero or downpayment recorded.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requireFinanceClearance}
                    onChange={(e) => setFormData({ ...formData, requireFinanceClearance: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {/* Auto Assessment Recalculation */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Automatic Fee Recalculation on Course Changes
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Automatically recalculates tuition and total balance when subjects are approved in Add/Drop.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoCalculateFees}
                    onChange={(e) => setFormData({ ...formData, autoCalculateFees: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Institutional Banner Notice */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Student Portal Institutional Announcement Banner</span>
            </h4>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 font-semibold">
                Announcement Message (Displayed prominently in Student Enrollment Section)
              </label>
              <textarea
                rows={3}
                value={formData.announcementBanner || ''}
                onChange={(e) => setFormData({ ...formData, announcementBanner: e.target.value })}
                placeholder="e.g. Regular Enrollment for 1st Semester AY 2026-2027 is currently open. Please settle tuition downpayment to finalize your Certificate of Registration."
                className="w-full p-3 border rounded-lg focus:ring-1 focus:ring-[#18392B] text-xs text-slate-800"
              />
              <span className="text-[11px] text-slate-400 block">
                Leave empty to hide the announcement banner from the student portal.
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Safety */}
        <div className="space-y-6">
          {/* Emergency Enrollment Lock */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-serif font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Enrollment Suspension Lock</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Toggling this switch immediately suspends student enrollment submissions across the entire portal for maintenance, grade encoding, or term cutoff.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-900">
                Lock All Submissions
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emergencyLockActive || false}
                  onChange={(e) => setFormData({ ...formData, emergencyLockActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          </div>

          {/* Database Synchronization Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Firestore Sync Status</span>
            </h4>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Collections Active:</span>
                <span className="font-semibold text-slate-900">7 collections</span>
              </div>
              <div className="flex justify-between">
                <span>Real-Time Listeners:</span>
                <span className="text-emerald-700 font-semibold">Active (onSnapshot)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Enrolled Records:</span>
                <span className="font-mono font-bold text-slate-900">{enrollments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Pre-Enlistments:</span>
                <span className="font-mono font-bold text-slate-900">{preEnlistments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
