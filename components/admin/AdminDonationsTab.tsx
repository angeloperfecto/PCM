'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { DonationPaymentMethod, DonationRecord, DonationSettings, PaymentMethodType, FeaturedCause } from '@/lib/types';
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
} from 'lucide-react';

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

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<DonationSettings>(donationSettings);

  // Filtered Donations
  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.transactionRef && d.transactionRef.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || d.paymentMethodId === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Stats Calculations
  const totalAmountPhp = donations.reduce((sum, d) => sum + (d.currency === 'PHP' ? d.amount : d.amount * 56), 0);
  const pendingCount = donations.filter((d) => d.status === 'Pending Verification').length;
  const verifiedCount = donations.filter((d) => d.status === 'Verified & Acknowledged').length;

  const handleOpenEditMethod = (method: DonationPaymentMethod) => {
    setEditingMethod(method);
    setMethodForm({
      ...method,
      instructions: method.instructions && method.instructions.length > 0 ? [...method.instructions] : [''],
    });
  };

  const handleOpenCreateMethod = () => {
    setIsCreatingMethod(true);
    setEditingMethod(null);
    setMethodForm({
      name: '',
      type: 'gcash',
      accountName: 'Philippine College of Ministry, Inc.',
      accountNumber: '',
      bankName: '',
      branch: 'La Trinidad / Baguio Branch',
      gcashNumber: '',
      qrCodeUrl: '',
      instructions: [
        'Open your mobile banking or GCash app.',
        'Enter the account details or scan the QR code above.',
        'Take a screenshot of the transaction receipt.',
        'Submit the donation notice on our website to receive your acknowledgment.',
      ],
      active: true,
      order: donationMethods.length + 1,
      notes: '',
    });
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.name || !methodForm.type) {
      addToast('error', 'Missing Fields', 'Method name and type are required.');
      return;
    }

    const rawInst = methodForm.instructions;
    const cleanedInstructions = (
      Array.isArray(rawInst)
        ? rawInst
        : typeof rawInst === 'string'
        ? rawInst.split('\n')
        : []
    )
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

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
    const rows = donations.map((d) => [
      `"${d.trackingCode}"`,
      `"${d.createdAt}"`,
      `"${d.donorName}"`,
      `"${d.donorEmail}"`,
      `"${d.donorPhone || ''}"`,
      d.amount,
      `"${d.currency}"`,
      `"${d.paymentMethodName}"`,
      `"${d.purpose}"`,
      `"${d.transactionRef || ''}"`,
      `"${d.status}"`,
      (d.receiptRequested || (d as any).requestOfficialReceipt) ? 'Yes' : 'No',
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
            <span className="font-serif text-2xl font-bold text-[#18392B]">₱{totalAmountPhp.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-medium">PHP Eqv.</span>
          </div>
          <p className="text-[11px] text-slate-400">{donations.length} total pledge records</p>
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
                          <span className="font-mono font-bold text-[#18392B] block">{d.trackingCode}</span>
                          <span className="text-[11px] text-slate-400">{d.createdAt}</span>
                        </td>

                        <td className="py-3 px-4 space-y-0.5">
                          <span className="font-bold text-slate-800 block">
                            {d.donorName}
                            {d.isAnonymous && (
                              <span className="ml-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                Anon
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 block">{d.donorEmail}</span>
                          {d.donorPhone && <span className="text-[10px] text-slate-400">{d.donorPhone}</span>}
                        </td>

                        <td className="py-3 px-4 space-y-0.5">
                          <span className="font-bold text-emerald-700 text-sm block">
                            {d.currency === 'PHP' ? '₱' : '$'}{d.amount.toLocaleString()} {d.currency}
                          </span>
                          <span className="text-[11px] text-slate-600 block">{d.purpose}</span>
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
                            onClick={() => {
                              if (confirm(`Delete donation record ${d.trackingCode}?`)) {
                                deleteDonationRecord(d.id);
                              }
                            }}
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationMethods.map((m) => (
              <div
                key={m.id}
                className={`bg-white rounded-xl border p-5 shadow-xs space-y-4 flex flex-col justify-between transition ${
                  m.active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#18392B] flex items-center justify-center">
                        {m.type === 'gcash' ? (
                          <QrCode className="w-5 h-5" />
                        ) : m.type === 'bank' ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#18392B]">{m.name}</h4>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          {m.type}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {m.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 font-mono">
                    {m.accountName && (
                      <p className="truncate text-slate-700">
                        <span className="text-slate-400 font-sans">Name:</span> {m.accountName}
                      </p>
                    )}
                    {m.accountNumber && (
                      <p className="truncate text-[#18392B] font-bold">
                        <span className="text-slate-400 font-sans">Acct:</span> {m.accountNumber}
                      </p>
                    )}
                    {m.bankName && (
                      <p className="truncate text-slate-700">
                        <span className="text-slate-400 font-sans">Bank:</span> {m.bankName}
                      </p>
                    )}
                    {m.gcashNumber && (
                      <p className="truncate text-blue-900 font-bold">
                        <span className="text-slate-400 font-sans">GCash:</span> {m.gcashNumber}
                      </p>
                    )}
                  </div>

                  {m.qrCodeUrl && (
                    <div className="flex items-center gap-2 text-xs text-[#588B76]">
                      <QrCode className="w-4 h-4" />
                      <span>QR Code Configured</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.active}
                      onChange={(e) => updateDonationMethod(m.id, { active: e.target.checked })}
                      className="rounded text-[#588B76] focus:ring-[#588B76]"
                    />
                    <span>Active</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditMethod(m)}
                      className="p-1.5 text-slate-600 hover:text-[#588B76] hover:bg-slate-100 rounded-md transition cursor-pointer"
                      title="Edit Channel Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove payment channel "${m.name}"?`)) {
                          deleteDonationMethod(m.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                      title="Delete Channel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                  <span className="font-bold text-slate-800 text-sm">{selectedRecord.donorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Gift Amount</span>
                  <span className="font-bold text-emerald-700 text-base">
                    {selectedRecord.currency === 'PHP' ? '₱' : '$'}{selectedRecord.amount.toLocaleString()} {selectedRecord.currency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Email</span>
                  <span className="font-medium text-slate-700">{selectedRecord.donorEmail}</span>
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
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                {editingMethod ? `Edit ${editingMethod.name}` : 'Add New Giving Channel'}
              </h3>
              <button
                onClick={() => {
                  setEditingMethod(null);
                  setIsCreatingMethod(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">Channel Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GCash Official QR or Metrobank Account"
                    value={methodForm.name}
                    onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Method Type *</label>
                  <select
                    value={methodForm.type}
                    onChange={(e) => setMethodForm({ ...methodForm, type: e.target.value as PaymentMethodType })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  >
                    <option value="gcash">GCash</option>
                    <option value="bank">Bank Transfer (BDO, Metrobank, BPI)</option>
                    <option value="paypal">PayPal</option>
                    <option value="credit-card">Credit / Debit Card</option>
                    <option value="remittance">International Remittance / Wire</option>
                    <option value="other">Other / Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Display Order</label>
                  <input
                    type="number"
                    value={methodForm.order}
                    onChange={(e) => setMethodForm({ ...methodForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Philippine College of Ministry, Inc."
                    value={methodForm.accountName}
                    onChange={(e) => setMethodForm({ ...methodForm, accountName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Account / Card Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0542-9182-3810"
                    value={methodForm.accountNumber}
                    onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">GCash Mobile Number (if applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g. +63 917 582 1992"
                    value={methodForm.gcashNumber}
                    onChange={(e) => setMethodForm({ ...methodForm, gcashNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Bank Name (if applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g. Metrobank / BDO"
                    value={methodForm.bankName}
                    onChange={(e) => setMethodForm({ ...methodForm, bankName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Branch Location / SWIFT</label>
                  <input
                    type="text"
                    placeholder="e.g. Baguio City Session Branch"
                    value={methodForm.branch}
                    onChange={(e) => setMethodForm({ ...methodForm, branch: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">QR Code Image URL / Upload Link</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={methodForm.qrCodeUrl}
                    onChange={(e) => setMethodForm({ ...methodForm, qrCodeUrl: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                  {methodForm.qrCodeUrl && (
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg mt-1 inline-block">
                      <img src={methodForm.qrCodeUrl} alt="QR Preview" className="w-24 h-24 object-contain" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">Fee / Advisory Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Free transfer via InstaPay / PESONet"
                    value={methodForm.notes}
                    onChange={(e) => setMethodForm({ ...methodForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="block font-bold text-slate-700">Step-by-Step Giving Instructions</label>
                  {(Array.isArray(methodForm.instructions)
                    ? methodForm.instructions
                    : typeof methodForm.instructions === 'string'
                    ? [methodForm.instructions]
                    : []
                  ).map((inst, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">{i + 1}.</span>
                      <input
                        type="text"
                        value={inst}
                        onChange={(e) => {
                          const currentArr = Array.isArray(methodForm.instructions)
                            ? [...methodForm.instructions]
                            : [methodForm.instructions || ''];
                          currentArr[i] = e.target.value;
                          setMethodForm({ ...methodForm, instructions: currentArr });
                        }}
                        className="flex-1 p-2 bg-slate-50 rounded-md border border-slate-200 text-xs focus:outline-hidden focus:border-[#588B76]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const currentArr = Array.isArray(methodForm.instructions)
                            ? methodForm.instructions
                            : [methodForm.instructions || ''];
                          const updated = currentArr.filter((_, idx) => idx !== i);
                          setMethodForm({ ...methodForm, instructions: updated });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const currentArr = Array.isArray(methodForm.instructions)
                        ? methodForm.instructions
                        : methodForm.instructions
                        ? [methodForm.instructions]
                        : [];
                      setMethodForm({
                        ...methodForm,
                        instructions: [...currentArr, ''],
                      });
                    }}
                    className="text-xs text-[#588B76] font-semibold hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Instruction Step</span>
                  </button>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={methodForm.active}
                      onChange={(e) => setMethodForm({ ...methodForm, active: e.target.checked })}
                      className="rounded text-[#588B76] focus:ring-[#588B76]"
                    />
                    <span>Publish channel as Active on Website</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMethod(null);
                    setIsCreatingMethod(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold uppercase tracking-wider rounded-md transition shadow-xs cursor-pointer"
                >
                  Save Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
