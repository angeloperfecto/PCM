'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { DonationPaymentMethod, DonationRecord, DonationSettings, PaymentMethodType, FeaturedCause } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  Heart,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  QrCode,
  Building2,
  CreditCard,
  Eye,
  FileText,
  Sliders,
  DollarSign,
  AlertCircle,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  ListOrdered,
  AlignLeft,
  Sparkles,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Smartphone,
  Globe,
} from 'lucide-react';
import { normalizeInstructions, instructionsToText } from '@/lib/utils';

export const AdminDonationsTab: React.FC = () => {
  const {
    donationMethods,
    addDonationMethod,
    updateDonationMethod,
    deleteDonationMethod,
    donations,
    updateDonationRecord,
    deleteDonationRecord,
    donationSettings,
    updateDonationSettings,
    addToast,
  } = usePCM();

  const [activeSubTab, setActiveSubTab] = useState<'records' | 'channels' | 'settings'>('records');
  const [deleteTargetRecord, setDeleteTargetRecord] = useState<DonationRecord | null>(null);
  const [deleteTargetMethod, setDeleteTargetMethod] = useState<DonationPaymentMethod | null>(null);

  // Search & Filter for Donation Records
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<DonationRecord | null>(null);
  const [editingMethod, setEditingMethod] = useState<DonationPaymentMethod | null>(null);
  const [isCreatingMethod, setIsCreatingMethod] = useState(false);

  // Method Form State
  const [methodForm, setMethodForm] = useState<Partial<DonationPaymentMethod>>({
    name: '',
    type: 'gcash',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    gcashNumber: '',
    qrCodeUrl: '',
    instructions: [''],
    active: true,
    order: 1,
    notes: '',
  });

  // Enhanced Instructions State
  const [instructionsInputText, setInstructionsInputText] = useState<string>('');
  const [instructionMode, setInstructionMode] = useState<'text' | 'steps'>('text');
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<DonationSettings>(donationSettings);

  // Filtered Donations
  const filteredDonations = (donations || []).filter((d) => {
    if (!d) return false;
    const q = (searchTerm || '').toLowerCase().trim();
    const donorName = (d.donorName || '').toLowerCase();
    const donorEmail = (d.donorEmail || '').toLowerCase();
    const trackingCode = (d.trackingCode || '').toLowerCase();
    const transactionRef = (d.transactionRef || '').toLowerCase();
    const purpose = (d.purpose || '').toLowerCase();
    const paymentMethodName = (d.paymentMethodName || '').toLowerCase();

    const matchesSearch =
      !q ||
      donorName.includes(q) ||
      donorEmail.includes(q) ||
      trackingCode.includes(q) ||
      transactionRef.includes(q) ||
      purpose.includes(q) ||
      paymentMethodName.includes(q);

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || d.paymentMethodId === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Stats Calculations
  const totalAmountPhp = (donations || []).reduce(
    (sum, d) => sum + (Number(d?.amount) || 0) * (d?.currency === 'USD' ? 56 : 1),
    0
  );
  const pendingCount = (donations || []).filter((d) => d?.status === 'Pending Verification').length;
  const verifiedCount = (donations || []).filter((d) => d?.status === 'Verified & Acknowledged').length;

  const handleOpenEditMethod = (method: DonationPaymentMethod) => {
    setEditingMethod(method);
    const cleaned = normalizeInstructions(method.instructions);
    setMethodForm({
      ...method,
      instructions: cleaned.length > 0 ? cleaned : [''],
    });
    setInstructionsInputText(cleaned.join('\n'));
    setInstructionMode('text');
  };

  const handleOpenCreateMethod = () => {
    setIsCreatingMethod(true);
    setEditingMethod(null);
    const defaultSteps = [
      'Open your mobile banking or GCash app.',
      'Enter the account details or scan the QR code above.',
      'Take a screenshot of the transaction confirmation receipt.',
      'Submit the donation verification notice on this website to receive your official acknowledgment.',
    ];
    setMethodForm({
      name: '',
      type: 'gcash',
      accountName: 'Philippine College of Ministry, Inc.',
      accountNumber: '',
      bankName: '',
      branch: 'La Trinidad / Baguio Branch',
      gcashNumber: '',
      qrCodeUrl: '',
      instructions: defaultSteps,
      active: true,
      order: donationMethods.length + 1,
      notes: '',
    });
    setInstructionsInputText(defaultSteps.join('\n'));
    setInstructionMode('text');
  };

  const handleInstructionsTextChange = (text: string) => {
    setInstructionsInputText(text);
    const lines = text
      .split('\n')
      .map((l) => l.replace(/^(\d+[\.\)]|\-|\*)\s*/, '').trim())
      .filter((l) => l.length > 0);
    setMethodForm((prev) => ({
      ...prev,
      instructions: lines,
    }));
  };

  const applyInstructionsPreset = (presetType: 'gcash' | 'bank' | 'wire') => {
    let presetSteps: string[] = [];
    if (presetType === 'gcash') {
      presetSteps = [
        'Open your GCash App and log in.',
        'Tap "Scan QR" to scan the official PCM QR code (or use Express Send to our mobile number).',
        'Enter the giving amount and input your Full Name in the optional message box.',
        'Save or screenshot the transaction confirmation receipt.',
        'Submit your donation notice via the online form below or email finance@pcm.ph.',
      ];
    } else if (presetType === 'bank') {
      presetSteps = [
        'Log in to your online banking app (BDO, BPI, Metrobank) or visit a branch nationwide.',
        'Select Fund Transfer via InstaPay (instant) or PESONet to the PCM account details above.',
        'Include your donor name and designated ministry fund in the transfer remarks.',
        'Save your validation slip or screenshot the transaction reference number.',
        'Complete the donation verification form on the PCM website.',
      ];
    } else if (presetType === 'wire') {
      presetSteps = [
        'Request an international wire transfer from your financial institution using the SWIFT code.',
        'Designate "Philippine College of Ministry Inc." as the beneficiary account.',
        'Indicate whether funds are in USD or PHP and note your church / donor designation.',
        'Send your remittance confirmation advice to info@pcm.ph or pcmpresident1992@gmail.com.',
      ];
    }
    setInstructionsInputText(presetSteps.join('\n'));
    setMethodForm((prev) => ({
      ...prev,
      instructions: presetSteps,
    }));
  };

  const handleCopyAccount = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccountId(id);
    addToast('success', 'Copied to Clipboard', `Copied: ${text}`);
    setTimeout(() => {
      setCopiedAccountId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleAddInstructionStep = () => {
    const currentSteps = Array.isArray(methodForm.instructions)
      ? [...methodForm.instructions]
      : [];
    const updated = [...currentSteps, ''];
    setMethodForm((prev) => ({ ...prev, instructions: updated }));
    setInstructionsInputText(updated.join('\n'));
  };

  const handleUpdateInstructionStep = (index: number, val: string) => {
    const currentSteps = Array.isArray(methodForm.instructions)
      ? [...methodForm.instructions]
      : [];
    currentSteps[index] = val;
    setMethodForm((prev) => ({ ...prev, instructions: currentSteps }));
    setInstructionsInputText(currentSteps.join('\n'));
  };

  const handleRemoveInstructionStep = (index: number) => {
    const currentSteps = Array.isArray(methodForm.instructions)
      ? [...methodForm.instructions]
      : [];
    const updated = currentSteps.filter((_, i) => i !== index);
    setMethodForm((prev) => ({ ...prev, instructions: updated }));
    setInstructionsInputText(updated.join('\n'));
  };

  const handleMoveInstructionStep = (index: number, direction: 'up' | 'down') => {
    const currentSteps = Array.isArray(methodForm.instructions)
      ? [...methodForm.instructions]
      : [];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentSteps.length) return;
    const temp = currentSteps[index];
    currentSteps[index] = currentSteps[targetIdx];
    currentSteps[targetIdx] = temp;
    setMethodForm((prev) => ({ ...prev, instructions: currentSteps }));
    setInstructionsInputText(currentSteps.join('\n'));
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.name || !methodForm.type) {
      addToast('error', 'Missing Fields', 'Method name and type are required.');
      return;
    }

    let cleanedInstructions: string[] = [];
    if (instructionMode === 'text') {
      cleanedInstructions = instructionsInputText
        .split('\n')
        .map((l) => l.replace(/^(\d+[\.\)]|\-|\*)\s*/, '').trim())
        .filter((l) => l.length > 0);
    } else {
      cleanedInstructions = normalizeInstructions(methodForm.instructions);
    }

    if (editingMethod) {
      await updateDonationMethod(editingMethod.id, {
        ...methodForm,
        instructions: cleanedInstructions,
      });
      setEditingMethod(null);
    } else {
      await addDonationMethod({
        name: methodForm.name || 'New Payment Channel',
        type: methodForm.type || 'gcash',
        accountName: methodForm.accountName || '',
        accountNumber: methodForm.accountNumber || '',
        bankName: methodForm.bankName,
        branch: methodForm.branch,
        gcashNumber: methodForm.gcashNumber,
        qrCodeUrl: methodForm.qrCodeUrl,
        instructions: cleanedInstructions,
        active: methodForm.active ?? true,
        order: methodForm.order || donationMethods.length + 1,
        notes: methodForm.notes,
      });
      setIsCreatingMethod(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDonationSettings(settingsForm);
  };

  const handleExportCsv = () => {
    const headers = ['Tracking Code', 'Date', 'Donor Name', 'Email', 'Phone', 'Amount', 'Currency', 'Method', 'Purpose', 'Ref Number', 'Status', 'Receipt Requested'];
    const rows = (donations || []).map((d) => [
      `"${d?.trackingCode || ''}"`,
      `"${d?.createdAt || ''}"`,
      `"${d?.donorName || 'Anonymous'}"`,
      `"${d?.donorEmail || ''}"`,
      `"${d?.donorPhone || ''}"`,
      Number(d?.amount) || 0,
      `"${d?.currency || 'PHP'}"`,
      `"${d?.paymentMethodName || ''}"`,
      `"${d?.purpose || ''}"`,
      `"${d?.transactionRef || ''}"`,
      `"${d?.status || ''}"`,
      (d?.receiptRequested || (d as any)?.requestOfficialReceipt) ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCM_Donations_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'CSV Exported', 'Downloaded donation ledger CSV.');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Giving Volume</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#18392B]">₱{(Number(totalAmountPhp) || 0).toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-medium">PHP Eqv.</span>
          </div>
          <p className="text-[11px] text-slate-400">{(donations || []).length} total pledge records</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Verification</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Awaiting check</span>
          </div>
          <p className="text-[11px] text-slate-400">Needs bank/GCash matching</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified & Acknowledged</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-emerald-700">{verifiedCount}</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Completed</span>
          </div>
          <p className="text-[11px] text-slate-400">Receipts dispatched</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Channels</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#18392B]">
              {donationMethods.filter((m) => m.active).length} / {donationMethods.length}
            </span>
            <span className="text-xs text-[#588B76] font-semibold">Payment Methods</span>
          </div>
          <p className="text-[11px] text-slate-400">Live on public website</p>
        </div>
      </div>

      {/* 2. SUB-TAB NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('records')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'records'
                ? 'bg-[#18392B] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Donation Records ({donations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('channels')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'channels'
                ? 'bg-[#18392B] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Channels ({donationMethods.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'settings'
                ? 'bg-[#18392B] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Page Settings & Scripture</span>
          </button>
        </div>

        {activeSubTab === 'records' && (
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}

        {activeSubTab === 'channels' && (
          <button
            onClick={handleOpenCreateMethod}
            className="px-4 py-2 text-xs font-bold text-white bg-[#588B76] hover:bg-[#46705F] rounded-md transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
          </button>
        )}
      </div>

      {/* 3. SUB-TAB 1: DONATION RECORDS TABLE */}
      {activeSubTab === 'records' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search donor name, email, tracking code, reference no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#588B76]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-[#588B76]"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Verified & Acknowledged">Verified & Acknowledged</option>
                  <option value="Receipt Issued">Receipt Issued</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Method:</span>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-[#588B76]"
                >
                  <option value="all">All Methods</option>
                  {donationMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tracking Code & Date</th>
                    <th className="py-3 px-4">Donor Name & Contact</th>
                    <th className="py-3 px-4">Amount & Purpose</th>
                    <th className="py-3 px-4">Payment Method & Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No donation records match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 space-y-0.5">
                          <span className="font-mono font-bold text-[#18392B] block">{d.trackingCode || '—'}</span>
                          <span className="text-[11px] text-slate-400">{d.createdAt || '—'}</span>
                        </td>

                        <td className="py-3 px-4 space-y-0.5">
                          <span className="font-bold text-slate-800 block">
                            {d.donorName || 'Anonymous Donor'}
                            {d.isAnonymous && (
                              <span className="ml-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                Anon
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 block">{d.donorEmail || '—'}</span>
                          {d.donorPhone && <span className="text-[10px] text-slate-400">{d.donorPhone}</span>}
                        </td>

                        <td className="py-3 px-4 space-y-0.5">
                          <span className="font-bold text-emerald-700 text-sm block">
                            {d.currency === 'PHP' ? '₱' : '$'}{(Number(d.amount) || 0).toLocaleString()} {d.currency || 'PHP'}
                          </span>
                          <span className="text-[11px] text-slate-600 block">{d.purpose || 'General Offering'}</span>
                        </td>

                        <td className="py-3 px-4 space-y-0.5">
                          <span className="font-medium text-slate-800 block">{d.paymentMethodName}</span>
                          {d.transactionRef ? (
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              Ref: {d.transactionRef}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Ref provided</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'Verified & Acknowledged' || d.status === 'Receipt Issued'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'Pending Verification'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {d.status}
                          </span>
                          {d.requestOfficialReceipt && (
                            <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                              🧾 Receipt Requested
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedRecord(d)}
                            className="p-1.5 text-[#588B76] hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title="View Full Details & Manage Status"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetRecord(d)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB 2: PAYMENT CHANNELS MANAGER */}
      {activeSubTab === 'channels' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#588B76]" />
                <span>Giving Channels & Bank Accounts</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage bank accounts, mobile wallets (GCash), and international giving channels. Instructions set here guide donors step-by-step.
              </p>
            </div>
            <button
              onClick={handleOpenCreateMethod}
              className="px-4 py-2 text-xs font-bold text-white bg-[#588B76] hover:bg-[#46705F] rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Channel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationMethods.map((m) => {
              const steps = normalizeInstructions(m.instructions);
              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs space-y-4 flex flex-col justify-between transition hover:shadow-md ${
                    m.active ? 'border-slate-200' : 'border-slate-200 opacity-75 bg-slate-50/70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#18392B] flex items-center justify-center shrink-0 border border-emerald-100">
                          {m.type === 'gcash' ? (
                            <QrCode className="w-5 h-5 text-[#588B76]" />
                          ) : m.type === 'bank' || (m.type as any) === 'bank_transfer' ? (
                            <Building2 className="w-5 h-5 text-[#18392B]" />
                          ) : m.type === 'remittance' || (m.type as any) === 'wire' ? (
                            <Globe className="w-5 h-5 text-blue-700" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-indigo-700" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#18392B] truncate">{m.name}</h4>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                            {m.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          m.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {m.active ? 'Active on Website' : 'Hidden / Inactive'}
                      </span>
                    </div>

                    {/* Account Details Box */}
                    <div className="bg-slate-50 p-3.5 rounded-lg text-xs space-y-1.5 border border-slate-100">
                      {m.accountName && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-slate-400 text-[11px]">Account Name:</span>
                          <span className="font-medium text-slate-800 truncate text-right">{m.accountName}</span>
                        </div>
                      )}
                      {m.accountNumber && (
                        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-200/60">
                          <span className="text-slate-400 text-[11px]">Number:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#18392B]">{m.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyAccount(m.id, m.accountNumber || '')}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy account number"
                            >
                              {copiedAccountId === m.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {m.bankName && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-slate-400 text-[11px]">Bank:</span>
                          <span className="text-slate-700 truncate">{m.bankName}</span>
                        </div>
                      )}
                      {m.branch && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-slate-400 text-[11px]">Branch / SWIFT:</span>
                          <span className="text-slate-600 truncate text-right text-[11px]">{m.branch}</span>
                        </div>
                      )}
                      {m.gcashNumber && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 text-[11px]">GCash:</span>
                          <span className="font-mono font-bold text-blue-900">{m.gcashNumber}</span>
                        </div>
                      )}
                      {m.notes && (
                        <div className="pt-1 text-[11px] text-amber-800 bg-amber-50/70 p-1.5 rounded border border-amber-100">
                          {m.notes}
                        </div>
                      )}
                    </div>

                    {/* Instructions Summary */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100/60 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[#18392B] flex items-center gap-1">
                          <ListOrdered className="w-3.5 h-3.5 text-[#588B76]" />
                          <span>Instructions:</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#588B76] bg-white px-2 py-0.5 rounded-full border border-emerald-100">
                          {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
                        </span>
                      </div>
                      {steps[0] ? (
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                          &ldquo;{steps[0]}&rdquo;
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No instructions configured</p>
                      )}
                    </div>

                    {m.qrCodeUrl && (
                      <div className="flex items-center gap-2 text-xs text-[#588B76] font-medium bg-slate-50 p-2 rounded-md">
                        <QrCode className="w-4 h-4" />
                        <span>Official QR Code Configured</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={m.active}
                        onChange={(e) => updateDonationMethod(m.id, { active: e.target.checked })}
                        className="rounded text-[#588B76] focus:ring-[#588B76]"
                      />
                      <span className="font-medium text-[11px]">Active</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditMethod(m)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#18392B] bg-slate-100 hover:bg-[#18392B] hover:text-white rounded-md transition cursor-pointer flex items-center gap-1"
                        title="Edit Channel Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTargetMethod(m)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                        title="Delete Channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 3: GLOBAL DONATION PAGE SETTINGS */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-serif text-lg font-bold text-[#18392B]">Donation Page Content & Scripture Customizer</h3>
            <p className="text-xs text-slate-500">
              Customize the institutional mission scriptures, banner messaging, and stewardship contact text.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Hero Main Title</label>
              <input
                type="text"
                value={settingsForm.title}
                onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Hero Subtitle / Description</label>
              <textarea
                rows={2}
                value={settingsForm.subtitle}
                onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-slate-700">Featured Stewardship Scripture Verse</label>
                <textarea
                  rows={2}
                  value={settingsForm.scriptureVerse}
                  onChange={(e) => setSettingsForm({ ...settingsForm, scriptureVerse: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-slate-700">Scripture Reference & Translation</label>
                <input
                  type="text"
                  value={settingsForm.scriptureReference}
                  onChange={(e) => setSettingsForm({ ...settingsForm, scriptureReference: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Stewardship Email</label>
                <input
                  type="email"
                  value={settingsForm.stewardshipEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, stewardshipEmail: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Stewardship Phone / Landline</label>
                <input
                  type="text"
                  value={settingsForm.stewardshipPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, stewardshipPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#588B76] hover:bg-[#46705F] text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-xs transition cursor-pointer"
            >
              Save Global Donation Settings
            </button>
          </div>
        </form>
      )}

      {/* 6. MODAL: VIEW / VERIFY DONATION RECORD */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase font-mono tracking-widest text-[#588B76]">
                  Donation Record
                </span>
                <h3 className="font-serif text-lg font-bold text-[#18392B]">{selectedRecord.trackingCode}</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Donor Name</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRecord.donorName || 'Anonymous Donor'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Gift Amount</span>
                  <span className="font-bold text-emerald-700 text-base">
                    {selectedRecord.currency === 'PHP' ? '₱' : '$'}{(Number(selectedRecord.amount) || 0).toLocaleString()} {selectedRecord.currency || 'PHP'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Email</span>
                  <span className="font-medium text-slate-700">{selectedRecord.donorEmail || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Phone</span>
                  <span className="font-medium text-slate-700">{selectedRecord.donorPhone || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Designation</span>
                  <span className="font-medium text-slate-700">{selectedRecord.purpose}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Payment Channel</span>
                  <span className="font-medium text-slate-700">{selectedRecord.paymentMethodName}</span>
                </div>
              </div>

              {selectedRecord.transactionRef && (
                <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                    Bank / GCash Reference Number:
                  </span>
                  <span className="font-mono font-bold text-sm text-[#18392B] select-all">
                    {selectedRecord.transactionRef}
                  </span>
                </div>
              )}

              {selectedRecord.prayerRequest && (
                <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/60 space-y-1">
                  <span className="text-[10px] text-amber-900 uppercase font-bold block">
                    🙏 Donor&apos;s Prayer Request / Blessing Note:
                  </span>
                  <p className="text-slate-700 italic">&ldquo;{selectedRecord.prayerRequest}&rdquo;</p>
                </div>
              )}

              {/* Status Updater */}
              <div className="space-y-1 pt-2">
                <label className="block font-bold text-slate-700 text-xs">Update Record Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateDonationRecord(selectedRecord.id, { status: 'Verified & Acknowledged' });
                      setSelectedRecord((prev) => (prev ? { ...prev, status: 'Verified & Acknowledged' } : null));
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedRecord.status === 'Verified & Acknowledged'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified & Acknowledged</span>
                  </button>

                  <button
                    onClick={() => {
                      updateDonationRecord(selectedRecord.id, { status: 'Receipt Issued' });
                      setSelectedRecord((prev) => (prev ? { ...prev, status: 'Receipt Issued' } : null));
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedRecord.status === 'Receipt Issued'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-800 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official Receipt Issued</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: ADD / EDIT PAYMENT METHOD */}
      {(editingMethod || isCreatingMethod) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#588B76]" />
                  <span>{editingMethod ? `Edit ${editingMethod.name}` : 'Add New Giving Channel'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure account details, payment instructions, and official QR code displayed to donors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMethod(null);
                  setIsCreatingMethod(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveMethod} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* SECTION 1: Channel Account Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-[#588B76]" />
                  <span>Channel & Account Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-700">Channel Display Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GCash (Official QR), Metrobank Savings, or BDO Account"
                      value={methodForm.name}
                      onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Channel Type *</label>
                    <select
                      value={methodForm.type}
                      onChange={(e) => setMethodForm({ ...methodForm, type: e.target.value as PaymentMethodType })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition cursor-pointer"
                    >
                      <option value="gcash">GCash (Mobile Wallet / QR)</option>
                      <option value="bank">Bank Transfer (BDO, Metrobank, BPI, PESONet)</option>
                      <option value="paypal">PayPal</option>
                      <option value="credit-card">Credit / Debit Card</option>
                      <option value="remittance">International Wire / Remittance</option>
                      <option value="other">Other / Cheque / Direct Giving</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Display Order</label>
                    <input
                      type="number"
                      value={methodForm.order}
                      onChange={(e) => setMethodForm({ ...methodForm, order: parseInt(e.target.value) || 1 })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-700">Official Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Philippine College of Ministry, Inc."
                      value={methodForm.accountName}
                      onChange={(e) => setMethodForm({ ...methodForm, accountName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Account / Card / Reference Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0542-9182-3810"
                      value={methodForm.accountNumber}
                      onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">GCash Mobile Number (if applicable)</label>
                    <input
                      type="text"
                      placeholder="e.g. +63 917 582 1992"
                      value={methodForm.gcashNumber}
                      onChange={(e) => setMethodForm({ ...methodForm, gcashNumber: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Bank Name (if applicable)</label>
                    <input
                      type="text"
                      placeholder="e.g. Metropolitan Bank and Trust Company (Metrobank)"
                      value={methodForm.bankName}
                      onChange={(e) => setMethodForm({ ...methodForm, bankName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Branch Location / SWIFT Code</label>
                    <input
                      type="text"
                      placeholder="e.g. Session Road, Baguio City / MBTCPHMM"
                      value={methodForm.branch}
                      onChange={(e) => setMethodForm({ ...methodForm, branch: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-700">Fee / Advisory Note for Donors</label>
                    <input
                      type="text"
                      placeholder="e.g. Free transfer via InstaPay / PESONet; receipts issued within 24-48 hours"
                      value={methodForm.notes}
                      onChange={(e) => setMethodForm({ ...methodForm, notes: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-700">QR Code Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://... or /images/donation-gcash-qr.png"
                        value={methodForm.qrCodeUrl}
                        onChange={(e) => setMethodForm({ ...methodForm, qrCodeUrl: e.target.value })}
                        className="flex-1 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white transition"
                      />
                      {methodForm.qrCodeUrl && (
                        <div className="w-10 h-10 border border-slate-200 rounded-lg p-0.5 bg-white shrink-0 flex items-center justify-center overflow-hidden relative">
                          <Image
                            src={methodForm.qrCodeUrl}
                            alt="QR"
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Step-by-Step Giving Instructions (Enhanced Design) */}
              <div className="space-y-4 bg-slate-50/80 border border-slate-200 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-[#588B76]" />
                      <h4 className="font-bold text-slate-800 text-sm">Step-by-Step Giving Instructions</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Provide clear, numbered instructions for donors when giving through this channel.
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setInstructionMode('text')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                        instructionMode === 'text'
                          ? 'bg-[#18392B] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span>Text Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstructionMode('steps')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                        instructionMode === 'steps'
                          ? 'bg-[#18392B] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ListOrdered className="w-3 h-3" />
                      <span>Step Cards</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets Toolbar */}
                <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Apply Quick Template:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => applyInstructionsPreset('gcash')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#18392B] border border-slate-200 hover:border-emerald-200 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <Smartphone className="w-3 h-3 text-[#588B76]" />
                    <span>GCash Steps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyInstructionsPreset('bank')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#18392B] border border-slate-200 hover:border-emerald-200 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3 text-[#18392B]" />
                    <span>Bank Transfer Steps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyInstructionsPreset('wire')}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-200 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3 text-blue-600" />
                    <span>International Wire Steps</span>
                  </button>
                </div>

                {/* Editor Body */}
                {instructionMode === 'text' ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={instructionsInputText}
                      onChange={(e) => handleInstructionsTextChange(e.target.value)}
                      placeholder="Step 1: Open your mobile banking app...&#10;Step 2: Enter the account details or scan the QR code...&#10;Step 3: Save a screenshot of the confirmation receipt...&#10;Step 4: Submit your donation confirmation notice."
                      className="w-full p-3 bg-white rounded-lg border border-slate-300 text-xs font-sans leading-relaxed focus:outline-hidden focus:border-[#588B76] focus:ring-1 focus:ring-[#588B76] transition"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-[#588B76] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {
                          instructionsInputText
                            .split('\n')
                            .filter((l) => l.trim().length > 0).length
                        }{' '}
                        Steps Detected
                      </span>
                      <span>Press <strong>Enter</strong> to create a new step. Leading numbers or dashes will be formatted automatically.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(Array.isArray(methodForm.instructions) ? methodForm.instructions : []).map((inst, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                        <span className="w-6 h-6 rounded-full bg-[#18392B] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={inst}
                          onChange={(e) => handleUpdateInstructionStep(i, e.target.value)}
                          placeholder={`Step ${i + 1} description...`}
                          className="flex-1 p-1.5 bg-slate-50 rounded border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleMoveInstructionStep(i, 'up')}
                          disabled={i === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move step up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveInstructionStep(i, 'down')}
                          disabled={i === (methodForm.instructions?.length || 0) - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move step down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveInstructionStep(i)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddInstructionStep}
                      className="text-xs text-[#588B76] hover:text-[#18392B] font-semibold flex items-center gap-1.5 pt-1 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Step</span>
                    </button>
                  </div>
                )}

                {/* LIVE DONOR WEBSITE PREVIEW */}
                <div className="bg-white rounded-xl border border-emerald-100 p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
                    <span className="font-serif font-bold text-xs text-[#18392B] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#588B76]" />
                      <span>Live Website Donor Preview</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                      As Donors See It
                    </span>
                  </div>

                  {(() => {
                    const currentSteps =
                      instructionMode === 'text'
                        ? instructionsInputText
                            .split('\n')
                            .map((l) => l.replace(/^(\d+[\.\)]|\-|\*)\s*/, '').trim())
                            .filter((l) => l.length > 0)
                        : normalizeInstructions(methodForm.instructions);

                    if (currentSteps.length === 0) {
                      return (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          No instructions entered yet. Type above or click a template to preview.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-2 pt-1">
                        {currentSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/30 border border-emerald-100/50"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#18392B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-slate-700 leading-relaxed">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* SECTION 3: Publication Status Toggle */}
              <div
                onClick={() => setMethodForm({ ...methodForm, active: !methodForm.active })}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  methodForm.active
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center transition ${
                      methodForm.active ? 'bg-[#588B76] text-white' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {methodForm.active && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800">
                      {methodForm.active ? 'Active & Published on Website' : 'Hidden (Draft Mode)'}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {methodForm.active
                        ? 'Donors can select this payment channel on the live giving portal.'
                        : 'Channel is saved in your admin dashboard but hidden from public visitors.'}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    methodForm.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {methodForm.active ? 'Active' : 'Disabled'}
                </span>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMethod(null);
                    setIsCreatingMethod(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Payment Channel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Donation Records */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetRecord}
        title="Delete Donation Record"
        itemName={deleteTargetRecord ? `${deleteTargetRecord.trackingCode || 'Record'} - ₱${(Number(deleteTargetRecord.amount) || 0).toLocaleString()} (${deleteTargetRecord.donorName || 'Donor'})` : undefined}
        message="Are you sure you want to permanently delete this donation ledger record?"
        confirmLabel="Delete Record"
        onConfirm={() => {
          if (deleteTargetRecord) {
            deleteDonationRecord(deleteTargetRecord.id);
            addToast({ title: 'Record Deleted', message: `Donation ${deleteTargetRecord.trackingCode} removed.`, type: 'info' });
            setDeleteTargetRecord(null);
          }
        }}
        onCancel={() => setDeleteTargetRecord(null)}
      />

      {/* Confirmation Modal for Payment Channels */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetMethod}
        title="Delete Payment Channel"
        itemName={deleteTargetMethod?.name}
        message="Are you sure you want to permanently delete this payment channel from the giving portal?"
        confirmLabel="Delete Channel"
        onConfirm={() => {
          if (deleteTargetMethod) {
            deleteDonationMethod(deleteTargetMethod.id);
            addToast({ title: 'Channel Deleted', message: `Payment channel "${deleteTargetMethod.name}" removed.`, type: 'info' });
            setDeleteTargetMethod(null);
          }
        }}
        onCancel={() => setDeleteTargetMethod(null)}
      />
    </div>
  );
};
