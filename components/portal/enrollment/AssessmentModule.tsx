'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  HelpCircle,
  Award,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { StudentAssessment, EnrollmentSubmenuTab } from '@/lib/types';

interface AssessmentModuleProps {
  onNavigateToAmountDue: () => void;
}

export const AssessmentModule: React.FC<AssessmentModuleProps> = ({
  onNavigateToAmountDue,
}) => {
  const { studentProfile, calculateStudentAssessment, feeStructure } = usePCM();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Dynamic assessment based on student and fee catalog
  const assessment: StudentAssessment = useMemo(() => {
    return calculateStudentAssessment(studentProfile.studentId);
  }, [calculateStudentAssessment, studentProfile.studentId]);

  return (
    <div id="pcm-assessment-module" className="space-y-6">
      {/* Assessment Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-purple-200">
                AY 2026–2027 • 1st Semester
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Official Matriculation Assessment
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#18392B] mt-1">
              Tuition & Institutional Fee Assessment
            </h3>
            <p className="text-xs text-slate-500">
              Itemized assessment calculated directly from your registered academic load, institutional laboratory fees, and eligible merit scholarships.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-700" />
              <span>Print Official Assessment Slip</span>
            </button>

            <button
              onClick={onNavigateToAmountDue}
              className="bg-[#6D28D9] hover:bg-purple-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Proceed to Amount Due</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Assessment High-Level Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Enrolled Units</span>
            <strong className="font-mono text-lg font-bold text-[#18392B]">
              {assessment.totalUnits} Units
            </strong>
            <span className="text-[10px] text-slate-500 block">@ ₱{assessment.tuitionPerUnit.toLocaleString()} / unit</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Assessment</span>
            <strong className="font-mono text-lg font-bold text-slate-900">
              ₱{(assessment.tuitionTotal + assessment.miscellaneousTotal + assessment.laboratoryTotal + assessment.otherFeesTotal).toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 block">Before scholarships</span>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold">Scholarships / Discounts</span>
            <strong className="font-mono text-lg font-bold text-emerald-800">
              -₱{assessment.discountsTotal.toLocaleString()}
            </strong>
            <span className="text-[10px] text-emerald-600 block">Dean&apos;s Honor List Merit</span>
          </div>

          <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200">
            <span className="text-purple-700 block text-[10px] uppercase font-bold">Net Assessed Amount</span>
            <strong className="font-mono text-lg font-bold text-purple-950">
              ₱{assessment.totalAssessment.toLocaleString()}
            </strong>
            <span className="text-[10px] text-purple-700 block font-medium">AY 2026–2027 1st Sem</span>
          </div>
        </div>
      </div>

      {/* Itemized Assessment Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Tuition & Unit Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-700" />
              1. Tuition Fee Calculation
            </h4>
            <span className="font-mono font-bold text-sm text-[#18392B]">
              ₱{assessment.tuitionTotal.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <div>
                <span className="font-semibold text-slate-900 block">Undergraduate Tuition (B.Th.)</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {assessment.totalUnits} Units × ₱{assessment.tuitionPerUnit.toLocaleString()} / academic unit
                </span>
              </div>
              <strong className="font-mono font-bold text-slate-900">
                ₱{assessment.tuitionTotal.toLocaleString()}
              </strong>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              *Tuition is determined per credit unit enrolled. Lab and practical courses incur supplementary fees listed below.
            </p>
          </div>
        </div>

        {/* Section 2: Miscellaneous Institutional Fees */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              2. Miscellaneous Institutional Fees
            </h4>
            <span className="font-mono font-bold text-sm text-[#18392B]">
              ₱{assessment.miscellaneousTotal.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {assessment.miscBreakdown.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5 px-2 border-b border-slate-100 last:border-b-0"
              >
                <span className="text-slate-700">{item.name}</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₱{item.amount.toLocaleString()}.00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Laboratory & Special Course Fees */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              3. Laboratory & Practical Course Fees
            </h4>
            <span className="font-mono font-bold text-sm text-[#18392B]">
              ₱{(assessment.laboratoryTotal + assessment.otherFeesTotal).toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[...assessment.labBreakdown, ...assessment.otherBreakdown].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200/80"
              >
                <span className="text-slate-700">{item.name}</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₱{item.amount.toLocaleString()}.00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Scholarships & Institutional Waivers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              4. Scholarships & Institutional Waivers
            </h4>
            <span className="font-mono font-bold text-sm text-emerald-700">
              -₱{assessment.discountsTotal.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {assessment.discountsBreakdown.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-emerald-950"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold block">{item.name}</span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    Official Merit Standing: {studentProfile.academicStatus}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-800">
                  -₱{item.amount.toLocaleString()}.00
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grand Net Total Statement */}
      <div className="bg-gradient-to-r from-[#18392B] to-[#25523F] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] uppercase font-mono font-bold text-[#85AA9B] tracking-wider">
            Official Assessment Summary
          </span>
          <h4 className="font-serif text-xl sm:text-2xl font-bold">
            Total Assessed Matriculation Due
          </h4>
          <p className="text-xs text-slate-300">
            For Bachelor of Theology ({assessment.totalUnits} Enrolled Units) • Term 1
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#E5F2EC]">
            ₱{assessment.totalAssessment.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-300 font-mono block mt-1">
            Certified by Office of the Treasurer
          </span>
        </div>
      </div>

      {/* Printable Assessment Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="text-center border-b border-slate-200 pb-4 space-y-1">
              <div className="font-serif text-lg font-bold text-[#18392B] uppercase tracking-wider">
                Philippine College of Ministry
              </div>
              <p className="text-[11px] text-slate-500 font-serif">
                Lamtang, La Trinidad, 2601 Benguet • Accounting & Cashier Office
              </p>
              <h3 className="font-serif text-xl font-bold text-purple-950 pt-2">
                Official Student Assessment Slip
              </h3>
              <p className="text-xs text-slate-600">Academic Year 2026–2027 • 1st Semester</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                <strong className="text-slate-900 font-semibold">{studentProfile.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student ID</span>
                <strong className="font-mono text-purple-900 font-bold">{studentProfile.studentId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Program & Year</span>
                <strong className="text-slate-900">{studentProfile.degreeProgram} ({studentProfile.yearLevel})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Enrolled Units</span>
                <strong className="font-mono text-slate-900">{assessment.totalUnits} Units</strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Tuition ({assessment.totalUnits} units @ ₱{assessment.tuitionPerUnit}/unit):</span>
                <span className="font-mono font-bold">₱{assessment.tuitionTotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Miscellaneous Fees:</span>
                <span className="font-mono font-bold">₱{assessment.miscellaneousTotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Laboratory & Course Specific Fees:</span>
                <span className="font-mono font-bold">₱{(assessment.laboratoryTotal + assessment.otherFeesTotal).toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-800">
                <span>Institutional Merit Scholarship / Discount:</span>
                <span className="font-mono font-bold">-₱{assessment.discountsTotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold">
                <span>TOTAL ASSESSED AMOUNT:</span>
                <span className="font-mono text-purple-950">₱{assessment.totalAssessment.toLocaleString()}.00</span>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-400 w-3/4 mx-auto pb-1 font-semibold text-slate-900">
                  Ruth M. Alabanza
                </div>
                <span className="text-[10px] text-slate-500 block">Assessment Officer / Accountant</span>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-400 w-3/4 mx-auto pb-1 font-semibold text-slate-900">
                  {studentProfile.fullName}
                </div>
                <span className="text-[10px] text-slate-500 block">Student Conforme</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsPrintModalOpen(false);
                }}
                className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Assessment Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
