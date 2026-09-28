'use client';

import React, { useState, useMemo } from 'react';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Copy,
  Building2,
  Smartphone,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle,
  X,
  FileCheck,
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { StudentPaymentRecord } from '@/lib/types';

export const AmountDueModule: React.FC = () => {
  const {
    studentProfile,
    calculateStudentAssessment,
    recordStudentPayment,
    addToast,
  } = usePCM();

  const assessment = useMemo(() => {
    return calculateStudentAssessment(studentProfile.studentId);
  }, [calculateStudentAssessment, studentProfile.studentId]);

  // Payment records for this student
  const paymentHistory = studentProfile.paymentHistory || studentProfile.paymentRecords || [];

  const totalPaid = paymentHistory
    .filter((p) => p.status === 'Verified' || !p.status)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const outstandingBalance = Math.max(0, assessment.totalAssessment - totalPaid);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Form State
  const [amount, setAmount] = useState<number>(Math.min(outstandingBalance, 4162.5));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Bank Transfer - BDO' | 'Bank Transfer - Metrobank' | 'Cashier Over-the-Counter'>('GCash');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    addToast('info', 'Copied to Clipboard', `${label} (${text}) copied.`);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a valid remittance amount.');
      return;
    }
    if (!referenceNumber.trim()) {
      addToast('warning', 'Reference Number Required', 'Please provide the transaction reference number from your bank or GCash.');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentData: Omit<StudentPaymentRecord, 'id'> = {
        date: transactionDate,
        amount: Number(amount),
        referenceNumber: referenceNumber.trim(),
        term: '1st Semester, AY 2026–2027',
        status: 'Pending Verification',
        paymentMethod,
        receiptUrl: '',
        notes: notes.trim() || undefined,
      };

      await recordStudentPayment(studentProfile.studentId, paymentData);
      setIsModalOpen(false);
      setReferenceNumber('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Term Installment Milestones
  const installments = [
    {
      name: 'Matriculation Downpayment',
      due: 'Upon Enrollment (Aug 10, 2026)',
      amount: 5000,
      status: 'Paid',
    },
    {
      name: 'Midterm Examination Clearance',
      due: 'October 15, 2026',
      amount: Math.round((assessment.totalAssessment - 5000) / 2),
      status: outstandingBalance <= Math.round((assessment.totalAssessment - 5000) / 2) ? 'Paid' : 'Due Soon',
    },
    {
      name: 'Final Examination Clearance',
      due: 'December 10, 2026',
      amount: Math.max(0, assessment.totalAssessment - 5000 - Math.round((assessment.totalAssessment - 5000) / 2)),
      status: outstandingBalance <= 0 ? 'Paid' : 'Pending Term End',
    },
  ];

  return (
    <div id="pcm-amount-due-module" className="space-y-6">
      {/* Overview Balance Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-purple-200">
                Official Statement of Account
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">
                AY 2026–2027 (1st Sem)
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#18392B] mt-1">
              Outstanding Tuition & Amount Due
            </h3>
            <p className="text-xs text-slate-500">
              Review current billing balances, scheduled examination payment deadlines, and submit payment proofs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#6D28D9] hover:bg-purple-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Payment Proof / Remit</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Total Assessed Tuition & Fees
            </span>
            <strong className="font-mono text-2xl font-bold text-[#18392B]">
              ₱{assessment.totalAssessment.toLocaleString()}.00
            </strong>
            <span className="text-[11px] text-slate-500 block">Includes merit discount deductions</span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-1">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold">
              Total Verified Payments Made
            </span>
            <strong className="font-mono text-2xl font-bold text-emerald-800">
              ₱{totalPaid.toLocaleString()}.00
            </strong>
            <span className="text-[11px] text-emerald-600 block">
              {paymentHistory.length} Recorded Transactions
            </span>
          </div>

          <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-1">
            <span className="text-purple-700 block text-[10px] uppercase font-bold">
              Current Outstanding Balance Due
            </span>
            <strong className="font-mono text-2xl font-extrabold text-purple-950">
              ₱{outstandingBalance.toLocaleString()}.00
            </strong>
            <span className="text-[11px] font-mono font-semibold block text-purple-800">
              {outstandingBalance <= 0 ? 'Account Fully Cleared' : 'Due for Midterm Clearance'}
            </span>
          </div>
        </div>
      </div>

      {/* Term Examination Payment Schedule Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-700" />
              Semester Examination Payment Schedule
            </h4>
            <p className="text-xs text-slate-500">Official installment milestones set by the PCM Accounting Office</p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
            3-Tier Installment Plan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {installments.map((inst, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                inst.status === 'Paid'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                  Tier 0{i + 1}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    inst.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inst.status}
                </span>
              </div>
              <strong className="font-serif text-sm block font-bold text-slate-900">
                {inst.name}
              </strong>
              <div className="font-mono text-base font-bold text-purple-950">
                ₱{inst.amount.toLocaleString()}.00
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                <Clock className="w-3.5 h-3.5" />
                <span>Deadline: {inst.due}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Payment Channels */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Official Institutional Payment Channels
            </h4>
            <p className="text-xs text-slate-500">Send tuition remittances through verified accounts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* GCash */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                GCash Official Merchant
              </span>
              <span className="bg-blue-100 text-blue-800 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                Instant
              </span>
            </div>
            <div className="space-y-0.5 font-sans">
              <span className="text-slate-500 text-[11px]">Account Name:</span>
              <strong className="block text-slate-900 font-semibold">Phil. College of Ministry</strong>
            </div>
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-200">
              <span className="font-mono font-bold text-blue-950">0917-842-1904</span>
              <button
                onClick={() => handleCopy('0917-842-1904', 'GCash Number')}
                className="text-blue-700 hover:text-blue-900 p-1 cursor-pointer"
              >
                {copiedAccount === 'GCash Number' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* BDO Unibank */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                BDO Unibank (Checking)
              </span>
              <span className="bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                Bank Transfer
              </span>
            </div>
            <div className="space-y-0.5 font-sans">
              <span className="text-slate-500 text-[11px]">Account Name:</span>
              <strong className="block text-slate-900 font-semibold">Philippine College of Ministry, Inc.</strong>
            </div>
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-200">
              <span className="font-mono font-bold text-indigo-950">0048-0284-9182</span>
              <button
                onClick={() => handleCopy('0048-0284-9182', 'BDO Account')}
                className="text-indigo-700 hover:text-indigo-900 p-1 cursor-pointer"
              >
                {copiedAccount === 'BDO Account' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Metrobank */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                Metrobank (Current)
              </span>
              <span className="bg-purple-100 text-purple-800 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                Bank Transfer
              </span>
            </div>
            <div className="space-y-0.5 font-sans">
              <span className="text-slate-500 text-[11px]">Account Name:</span>
              <strong className="block text-slate-900 font-semibold">Philippine College of Ministry, Inc.</strong>
            </div>
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-purple-200">
              <span className="font-mono font-bold text-purple-950">228-3-228-51829-0</span>
              <button
                onClick={() => handleCopy('228-3-228-51829-0', 'Metrobank Account')}
                className="text-purple-700 hover:text-purple-900 p-1 cursor-pointer"
              >
                {copiedAccount === 'Metrobank Account' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History & Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-700" />
            Official Tuition Payment Ledger & Receipts
          </h4>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {paymentHistory.length} Transactions Recorded
          </span>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payments recorded yet. Click &quot;Submit Payment Proof&quot; above to submit your receipt.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[#18392B] text-white">
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold">Reference Number</th>
                    <th className="p-3 font-bold">Payment Channel</th>
                    <th className="p-3 font-bold">Term</th>
                    <th className="p-3 font-bold">Amount Paid</th>
                    <th className="p-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {paymentHistory.map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono">{p.date}</td>
                      <td className="p-3 font-mono font-bold text-purple-900">{p.referenceNumber}</td>
                      <td className="p-3">{p.paymentMethod || 'Bank Deposit'}</td>
                      <td className="p-3 text-slate-500">{p.term || '1st Sem, AY 26–27'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        ₱{p.amount.toLocaleString()}.00
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.status === 'Verified' || !p.status
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
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
      </div>

      {/* Upload Proof / Remit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Submit Remittance & Payment Proof
                  </h3>
                  <span className="text-xs text-slate-500">Official PCM Cashier Verification</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remittance Amount (PHP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method / Channel <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="GCash">GCash (0917-842-1904)</option>
                  <option value="Bank Transfer - BDO">Bank Transfer - BDO (0048-0284-9182)</option>
                  <option value="Bank Transfer - Metrobank">Bank Transfer - Metrobank (228-3-228-51829-0)</option>
                  <option value="Cashier Over-the-Counter">Over-the-Counter Cashier (Lamtang Campus)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction / Bank Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="e.g., GCash Ref #1002948194"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes / Sponsoring Church (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="e.g., Sponsoring Church Monthly Support"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <span>
                  The accounting office will verify your reference number and issue an Official Receipt within 24 hours.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2 rounded-xl transition shadow-sm"
                >
                  {isSubmitting ? 'Recording...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
