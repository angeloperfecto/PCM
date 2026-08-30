'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  X,
  Calculator,
  DollarSign,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const TuitionCalculatorModal: React.FC = () => {
  const { isTuitionCalculatorModalOpen, setTuitionCalculatorModalOpen, navigateTo } = usePCM();

  const [level, setLevel] = useState<'undergraduate' | 'graduate' | 'certificate'>('undergraduate');
  const [units, setUnits] = useState(18);
  const [housing, setHousing] = useState<'none' | 'dormitory' | 'family'>('dormitory');
  const [scholarship, setScholarship] = useState<'none' | 'pastoral' | 'academic' | 'worker'>('pastoral');

  if (!isTuitionCalculatorModalOpen) return null;

  // Rate calculations (PHP)
  const unitRate = level === 'undergraduate' ? 850 : level === 'graduate' ? 1400 : 650;
  const rawTuition = units * unitRate;

  // Misc fees
  const miscAndRegistration = level === 'graduate' ? 4500 : 3500;
  const libraryAndTech = 2200;

  // Housing fees
  const housingFee = housing === 'dormitory' ? 7500 : housing === 'family' ? 12000 : 0;

  // Scholarship Discounts
  let discountPercentage = 0;
  if (scholarship === 'pastoral') discountPercentage = 0.4; // 40% off tuition
  if (scholarship === 'academic') discountPercentage = 0.5; // 50% off tuition
  if (scholarship === 'worker') discountPercentage = 0.25; // 25% off tuition

  const tuitionDiscount = Math.round(rawTuition * discountPercentage);
  const netTuition = rawTuition - tuitionDiscount;

  const totalSemesterEstimated = netTuition + miscAndRegistration + libraryAndTech + housingFee;
  const monthlyInstallment = Math.round(totalSemesterEstimated / 4);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#18392B] text-white p-6 border-b border-[#588B76]/40 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#85AA9B] font-mono uppercase mb-1">
              <Calculator className="w-4 h-4" />
              <span>Affordable Theological Education</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              TUITION & ESTIMATE CALCULATOR
            </h3>
          </div>

          <button
            onClick={() => setTuitionCalculatorModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 text-xs text-slate-700">
          <p className="text-slate-600 leading-relaxed">
            PCM remains steadfast in keeping ministerial training financially accessible for local pastors, church planters, and full-time ministry candidates. Customize your semester options below for an instant breakdown.
          </p>

          {/* Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFFFFF] p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Program Level
              </label>
              <select
                value={level}
                onChange={(e: any) => {
                  setLevel(e.target.value);
                  if (e.target.value === 'graduate') setUnits(12);
                  else setUnits(18);
                }}
                className="w-full p-2 rounded border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#588B76]"
              >
                <option value="undergraduate">Undergraduate (B.Th. / B.C.M.)</option>
                <option value="graduate">Graduate (M.Div. / M.C.L.)</option>
                <option value="certificate">Certificate in Biblical Studies</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Enrolled Units ({units} Units)
              </label>
              <input
                type="range"
                min={3}
                max={level === 'graduate' ? 18 : 24}
                step={3}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full accent-[#588B76] mt-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>3 Units</span>
                <span className="font-bold text-[#18392B]">{units} Units</span>
                <span>{level === 'graduate' ? '18 Units' : '24 Units'}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Campus Housing / Dormitory
              </label>
              <select
                value={housing}
                onChange={(e: any) => setHousing(e.target.value)}
                className="w-full p-2 rounded border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#588B76]"
              >
                <option value="none">Non-Resident / Commuter (₱0)</option>
                <option value="dormitory">Student Residence Hall (₱7,500/sem)</option>
                <option value="family">Married Pastoral Housing (₱12,000/sem)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Scholarship / Financial Grant
              </label>
              <select
                value={scholarship}
                onChange={(e: any) => setScholarship(e.target.value)}
                className="w-full p-2 rounded border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#588B76]"
              >
                <option value="none">Standard Non-Scholarship</option>
                <option value="pastoral">Pastoral Child / Ministry Grant (40% Off)</option>
                <option value="academic">Academic Dean’s Scholar (50% Off)</option>
                <option value="worker">Full-Time Church Worker Aid (25% Off)</option>
              </select>
            </div>
          </div>

          {/* Itemized Calculation Summary */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-[#588B76]/50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-[#85AA9B]">Itemized Breakdown</span>
              <span className="font-mono text-[10px] text-slate-400">1st Semester AY 2026–2027</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Tuition ({units} Units × ₱{unitRate.toLocaleString()}/unit):</span>
                <span className="font-mono">₱{rawTuition.toLocaleString()}</span>
              </div>

              {tuitionDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Scholarship Deduction ({discountPercentage * 100}%):</span>
                  <span className="font-mono">-₱{tuitionDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Registration, ID & Student Council:</span>
                <span className="font-mono">₱{miscAndRegistration.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Theological Library & Digital Resources:</span>
                <span className="font-mono">₱{libraryAndTech.toLocaleString()}</span>
              </div>

              {housingFee > 0 && (
                <div className="flex justify-between">
                  <span>Campus Housing / Residence Hall:</span>
                  <span className="font-mono">₱{housingFee.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">
                  Net Estimated Semester Total
                </span>
                <strong className="font-serif text-2xl font-extrabold text-[#85AA9B]">
                  ₱{totalSemesterEstimated.toLocaleString()}
                </strong>
              </div>

              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase">
                  Flexible Monthly Plan (4 Months)
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  ₱{monthlyInstallment.toLocaleString()} / mo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => setTuitionCalculatorModalOpen(false)}
            className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Close Calculator
          </button>

          <button
            onClick={() => {
              setTuitionCalculatorModalOpen(false);
              navigateTo('apply');
            }}
            className="w-full sm:w-auto bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] text-xs font-bold px-6 py-3 rounded shadow transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <span>Proceed to Online Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
