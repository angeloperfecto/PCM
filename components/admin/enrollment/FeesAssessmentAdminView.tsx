'use client';

import React, { useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { EnrollmentSystemConfig } from '@/lib/types';
import {
  DollarSign,
  Save,
  CheckCircle2,
  Percent,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Receipt,
  Users,
} from 'lucide-react';

export const FeesAssessmentAdminView: React.FC = () => {
  const {
    enrollmentConfig,
    updateEnrollmentConfig,
    canPerformEnrollmentAction,
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
      addToast('success', 'Fee Schedule Saved', 'Tuition rates and fee structure updated in Firestore database.');
    } catch (err) {
      addToast('error', 'Save Failed', 'Could not update fee configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNumericChange = (field: keyof EnrollmentSystemConfig, value: string) => {
    setFormData({
      ...formData,
      [field]: Number(value) || 0,
    });
  };

  // Sample simulation
  const sampleUnits = 18;
  const sampleTuition = sampleUnits * (formData.tuitionPerUnit || 450);
  const sampleMisc =
    (formData.registrationFee || 0) +
    (formData.libraryFee || 0) +
    (formData.labFee || 0) +
    (formData.medicalFee || 0) +
    (formData.studentActivityFee || 0);
  const sampleTotal = sampleTuition + sampleMisc;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-700" />
            <span>Tuition Rates, Fee Schedules & Payment Policies</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional per-unit credit rates, mandatory miscellaneous fees, installment plans, and discount schemas.
          </p>
        </div>

        {canPerformEnrollmentAction('manage_fees') && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Fee Schedule'}</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tuition & Core Credit Rates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#18392B]" />
              <span>Tuition & Core Per-Unit Rates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tuition Rate per Unit (PHP ₱) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono font-bold">₱</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.tuitionPerUnit}
                    onChange={(e) => handleNumericChange('tuitionPerUnit', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg font-mono font-bold text-sm text-slate-900 focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Multiplied by total course credit units enrolled.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Late Enrollment Surcharge (PHP ₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono font-bold">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.lateEnrollmentFee}
                    onChange={(e) => handleNumericChange('lateEnrollmentFee', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Automatically applied past formal enrollment deadline.
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Miscellaneous Fees */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#18392B]" />
              <span>Mandatory Institutional Miscellaneous Fees</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Registration Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.registrationFee}
                    onChange={(e) => handleNumericChange('registrationFee', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg font-mono text-slate-900 focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Library & Digital Resources</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.libraryFee}
                    onChange={(e) => handleNumericChange('libraryFee', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg font-mono text-slate-900 focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Laboratory & IT Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.labFee}
                    onChange={(e) => handleNumericChange('labFee', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg font-mono text-slate-900 focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Medical & Dental</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.medicalFee}
                    onChange={(e) => handleNumericChange('medicalFee', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg font-mono text-slate-900 focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Student Activity / Guild</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.studentActivityFee}
                    onChange={(e) => handleNumericChange('studentActivityFee', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg font-mono text-slate-900 focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Total Misc Subtotal</label>
                <div className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800">
                  ₱{sampleMisc.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Unit Limits */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-sm">
              Academic Unit Load Limits & Overload Policy
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Minimum Units / Term</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={formData.minUnitsPerStudent}
                  onChange={(e) => handleNumericChange('minUnitsPerStudent', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Standard Max Units</label>
                <input
                  type="number"
                  min={12}
                  max={28}
                  value={formData.maxUnitsPerStudent}
                  onChange={(e) => handleNumericChange('maxUnitsPerStudent', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Graduating Overload Max</label>
                <input
                  type="number"
                  min={20}
                  max={32}
                  value={formData.graduatingOverloadLimit}
                  onChange={(e) => handleNumericChange('graduatingOverloadLimit', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Calculation Simulation Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-serif font-bold text-sm text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Standard Assessment Simulation</span>
              </h4>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                18 Units Demo
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Tuition (18 units &times; ₱{formData.tuitionPerUnit})</span>
                <span className="font-mono font-semibold text-white">₱{sampleTuition.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Registration Fee</span>
                <span className="font-mono text-white">₱{(formData.registrationFee || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Library & Digital Resources</span>
                <span className="font-mono text-white">₱{(formData.libraryFee || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Laboratory & IT Services</span>
                <span className="font-mono text-white">₱{(formData.labFee || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Medical & Dental</span>
                <span className="font-mono text-white">₱{(formData.medicalFee || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Student Council / Guild</span>
                <span className="font-mono text-white">₱{(formData.studentActivityFee || 0).toLocaleString()}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-200">Total Semester Assessment:</span>
                <span className="font-mono font-bold text-lg text-emerald-400">
                  ₱{sampleTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/80 text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-white block">Installment Breakup (4 payments):</span>
              <div className="flex justify-between">
                <span>Upon Enrollment (Downpayment):</span>
                <span className="font-mono text-white">₱{Math.round(sampleTotal * 0.25).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Prelim Exam:</span>
                <span className="font-mono text-white">₱{Math.round(sampleTotal * 0.25).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Midterm Exam:</span>
                <span className="font-mono text-white">₱{Math.round(sampleTotal * 0.25).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Final Exam:</span>
                <span className="font-mono text-white">₱{Math.round(sampleTotal * 0.25).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>Real-Time Propagation Notice</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When tuition fees are saved here, they immediately apply to student pre-enlistment cost estimations, online enrollment assessments, and add/drop adjustment recalculations throughout the PCM platform.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
