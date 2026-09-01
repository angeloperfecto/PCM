'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { DonationRecord, DonationPaymentMethod, PaymentMethodType } from '@/lib/types';
import {
  Heart,
  QrCode,
  CreditCard,
  Building2,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  BookOpen,
  Church,
  Globe2,
  HelpCircle,
  Download,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  DollarSign,
  FileCheck,
  ArrowRight,
  MessageSquare,
  Lock,
} from 'lucide-react';

export const DonationView: React.FC = () => {
  const { donationMethods, donations, donationSettings, submitDonation, addToast, navigateTo } = usePCM();

  // Active channel selected in public view
  const activeMethods = donationMethods.filter((m) => m.active);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeMethods[0]?.id || donationMethods[0]?.id || ''
  );

  const selectedMethod = donationMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  // Donation Form States
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState<number | ''>(1000);
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP');
  const [customAmount, setCustomAmount] = useState('');
  const [purpose, setPurpose] = useState('Student Scholarship & Tuition Aid');
  const [transactionRef, setTransactionRef] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requestReceipt, setRequestReceipt] = useState(true);
  const [billingAddress, setBillingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState<DonationRecord | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('info', 'Copied to Clipboard', `"${text}" copied successfully.`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    } else {
      setAmount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName && !isAnonymous) {
      addToast('error', 'Missing Information', 'Please provide your full name or select anonymous giving.');
      return;
    }
    if (!donorEmail) {
      addToast('error', 'Missing Information', 'Please provide an email address for acknowledgment and tracking.');
      return;
    }
    const finalAmount = typeof amount === 'number' ? amount : parseFloat(customAmount);
    if (!finalAmount || finalAmount <= 0) {
      addToast('error', 'Invalid Amount', 'Please specify a valid giving amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await submitDonation({
        donorName: isAnonymous ? 'Anonymous Kingdom Partner' : donorName,
        donorEmail,
        donorPhone,
        amount: finalAmount,
        currency,
        purpose,
        paymentMethodId: selectedMethod?.id || 'manual',
        paymentMethodName: selectedMethod?.name || 'Bank Transfer / GCash',
        transactionRef,
        notes: prayerRequest,
        prayerRequest,
        isAnonymous,
        requestOfficialReceipt: requestReceipt,
        billingAddress,
      });
      setSubmittedDonation(record);
      // Reset form
      setDonorName('');
      setDonorEmail('');
      setDonorPhone('');
      setTransactionRef('');
      setPrayerRequest('');
      setBillingAddress('');
    } catch (err) {
      addToast('error', 'Submission Error', 'Failed to record donation notice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposeOptions = [
    'Student Scholarship & Tuition Aid',
    'General Ministry & Operating Fund',
    'Library Resources & Theological Archives',
    'Campus Facilities & Infrastructure Upgrades',
    'Cordillera & Tribal Church Planting Missions',
    'Faculty Development & Living Endowment',
    'Special Benevolence & Student Emergency Relief',
  ];

  return (
    <div className="w-full bg-[#FAFCFB] text-[#1e293b]">
      {/* 1. HERO BANNER */}
      <section className="relative bg-gradient-to-b from-[#10261D] via-[#18392B] to-[#1F4A38] text-white py-16 lg:py-20 px-4 lg:px-8 border-b border-[#588B76]/30 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span>PCM Institutional Stewardship & Kingdom Partnership</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            {donationSettings?.title || 'Partner in Equipping Servants for God’s Harvest'}
          </h1>

          <p className="text-base sm:text-lg text-[#D0DED8] max-w-3xl mx-auto font-sans leading-relaxed">
            {donationSettings?.subtitle ||
              'Your generous gifts provide life-changing theological scholarships, empower dedicated servant-leaders, and expand Christ-centered pastoral training across the Philippines and beyond.'}
          </p>

          {/* Scripture Card */}
          <div className="max-w-2xl mx-auto bg-black/25 border border-[#588B76]/40 rounded-lg p-5 backdrop-blur-xs text-center shadow-lg">
            <p className="font-serif italic text-sm sm:text-base text-amber-200 leading-relaxed">
              &ldquo;{donationSettings?.scriptureVerse ||
                'Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.'}&rdquo;
            </p>
            <span className="block mt-2 text-xs font-bold uppercase tracking-widest text-[#85AA9B]">
              — {donationSettings?.scriptureReference || '2 Corinthians 9:7 (NIV)'}
            </span>
          </div>

          {/* Jump to Giving Channels */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-4">
            <a
              href="#giving-channels"
              className="inline-flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-6 py-3 rounded-md font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>View Giving Channels</span>
            </a>
            <a
              href="#donation-form"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-md font-semibold text-sm transition cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-300" />
              <span>Record a Gift / Pledge</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. WHY YOUR GIVING MATTERS (4 Core Impact Pillars) */}
      <section className="py-14 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold font-mono tracking-widest text-[#588B76] uppercase">
            Transforming Generations
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
            How Your Generosity Multiplies Ministry Impact
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Since 1992, PCM has depended upon God through the faithful partnership of churches, alumni, and friends
            to educate pastoral pioneers who minister in tribal highlands, urban centers, and mission fields.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#18392B]">
              <GraduationCap className="w-6 h-6 text-[#588B76]" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#18392B]">1. Student Scholarships</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Over 75% of PCM students come from humble provincial families and rural churches. Your support subsidizes
              tuition, dormitory fees, and textbooks so promising candidates can finish their ministry degrees debt-free.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800">
              <Church className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#18392B]">2. Church Planting Practicum</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Funds enable practical weekend ministry apprenticeships, evangelistic medical outreaches, and vacation Bible
              schools across 85+ partner congregations throughout Northern Luzon.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <BookOpen className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#18392B]">3. Theological Library & Tech</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Expands our 10,000+ theological book collection, digital research databases, audio sermon repository, and
              multimedia classroom tools for high-caliber biblical study.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-800">
              <Building2 className="w-6 h-6 text-purple-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#18392B]">4. Campus Infrastructure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintains our Lamtang, La Trinidad campus, student housing, dining facilities, chapel sanctuary, and faculty
              residences to provide a safe, formative spiritual environment.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED CAUSES / MINISTRY GOALS */}
      {donationSettings?.featuredCauses && donationSettings.featuredCauses.length > 0 && (
        <section className="py-10 px-4 lg:px-8 bg-emerald-950/5 border-y border-emerald-900/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold font-mono tracking-widest text-[#588B76] uppercase">
                  Current Needs & Projects
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#18392B]">Active Ministry Funds & Campaigns</h2>
              </div>
              <p className="text-xs text-slate-600 max-w-md">
                You can designate your gift to any of these priority institutional funds when completing your donation form below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {donationSettings.featuredCauses.map((cause) => {
                const percent = Math.min(100, Math.round(((cause.raisedAmount || 0) / (cause.targetAmount || 1)) * 100));
                return (
                  <div
                    key={cause.id}
                    className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Target AY 2026–2027
                        </span>
                        <span className="text-xs font-bold text-[#588B76]">{percent}% Funded</span>
                      </div>
                      <h3 className="font-serif font-bold text-base text-[#18392B]">{cause.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-3">{cause.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#588B76] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Raised: {cause.raisedEst || `₱${(cause.raisedAmount || 0).toLocaleString()}`}</span>
                        <span>Goal: {cause.targetEst || `₱${(cause.targetAmount || 0).toLocaleString()}`}</span>
                      </div>
                      <button
                        onClick={() => {
                          setPurpose(cause.title);
                          const el = document.getElementById('donation-form');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full mt-2 py-1.5 text-xs font-bold text-[#18392B] bg-emerald-50 hover:bg-emerald-100 rounded-md transition cursor-pointer flex items-center justify-center gap-1 border border-emerald-200"
                      >
                        <span>Designate to this Project</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. OFFICIAL GIVING CHANNELS (Tabs + Detailed Payment Info + QR Codes) */}
      <section id="giving-channels" className="py-14 px-4 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold font-mono tracking-widest text-[#588B76] uppercase">
            Official Accounts & Payment Options
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
            Choose Your Preferred Donation Method
          </h2>
          <p className="text-sm text-slate-600">
            PCM maintains verified institutional accounts for secure domestic and international giving.
            All account details are maintained directly by the college administration.
          </p>
        </div>

        {activeMethods.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-3">
            <Info className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-amber-900">Payment Channels Under Administrative Setup</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Official institutional bank and GCash accounts are currently being configured by the PCM Finance Office.
              Please contact our admissions or finance team directly at{' '}
              <span className="font-bold">info@pcm.ph</span> or <span className="font-bold">+63 74 422 2577</span> for direct giving arrangements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Channel Selector Tabs */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Select Giving Channel ({activeMethods.length})
              </h3>
              <div className="space-y-2">
                {activeMethods.map((m) => {
                  const isSelected = selectedMethod?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#18392B] text-white border-[#18392B] shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/15 text-white' : 'bg-slate-100 text-[#588B76]'
                          }`}
                        >
                          {m.type === 'gcash' ? (
                            <QrCode className="w-5 h-5" />
                          ) : m.type === 'bank' ? (
                            <Building2 className="w-5 h-5" />
                          ) : (
                            <CreditCard className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm leading-snug">{m.name}</h4>
                          <p className={`text-xs ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                            {m.type.toUpperCase()} • {m.accountName || 'Official Channel'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Safety & Compliance Badge */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-xs text-emerald-950 space-y-2 mt-4">
                <div className="flex items-center gap-2 font-bold text-[#18392B]">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Institutional Verification</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  All accounts listed are registered under the legal name of <strong>Philippine College of Ministry, Inc.</strong> No personal staff accounts are used for general institutional gifts.
                </p>
              </div>
            </div>

            {/* Right Column: Selected Channel Card with QR & Details */}
            {selectedMethod && (
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-[#588B76] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {selectedMethod.type.toUpperCase()} Giving Channel
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#18392B]">
                      {selectedMethod.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      const el = document.getElementById('donation-form');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#588B76] hover:bg-[#46705F] text-white px-3.5 py-2 rounded-md transition shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Notify Us of Gift</span>
                  </button>
                </div>

                {/* Account Details Display Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Account Metadata */}
                  <div className="space-y-4">
                    {selectedMethod.accountName && (
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                          Account Name
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-sm text-[#18392B] font-mono select-all">
                            {selectedMethod.accountName}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedMethod.accountName, 'acc-name')}
                            className="p-1 text-slate-400 hover:text-[#588B76] transition cursor-pointer"
                            title="Copy Account Name"
                          >
                            {copiedKey === 'acc-name' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedMethod.accountNumber && (
                      <div className="bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 font-semibold block uppercase tracking-wider">
                          Account / Card Number
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-base text-[#18392B] font-mono tracking-wider select-all">
                            {selectedMethod.accountNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedMethod.accountNumber, 'acc-num')}
                            className="p-1 text-emerald-700 hover:text-emerald-900 transition cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedKey === 'acc-num' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedMethod.bankName && (
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                          Bank & Branch
                        </span>
                        <p className="font-bold text-sm text-[#18392B] mt-1">
                          {selectedMethod.bankName} {selectedMethod.branch && `— ${selectedMethod.branch}`}
                        </p>
                      </div>
                    )}

                    {selectedMethod.gcashNumber && (
                      <div className="bg-blue-50/50 p-3.5 rounded-lg border border-blue-200">
                        <span className="text-[11px] text-blue-800 font-semibold block uppercase tracking-wider">
                          Registered GCash Mobile Number
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-base text-blue-950 font-mono tracking-wider select-all">
                            {selectedMethod.gcashNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedMethod.gcashNumber || '', 'gcash-num')}
                            className="p-1 text-blue-700 hover:text-blue-900 transition cursor-pointer"
                            title="Copy GCash Number"
                          >
                            {copiedKey === 'gcash-num' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedMethod.notes && (
                      <p className="text-xs text-slate-500 italic bg-amber-50/40 p-3 rounded-lg border border-amber-200/50">
                        📌 {selectedMethod.notes}
                      </p>
                    )}
                  </div>

                  {/* QR Code / Visual Graphic Display */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                    {selectedMethod.qrCodeUrl ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 inline-block">
                          <img
                            src={selectedMethod.qrCodeUrl}
                            alt={`${selectedMethod.name} QR Code`}
                            className="w-48 h-48 object-contain rounded-lg mx-auto"
                          />
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          Scan with your {selectedMethod.name} App to transfer instantly
                        </p>
                        <a
                          href={selectedMethod.qrCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`${selectedMethod.name}_QR.png`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#588B76] hover:text-[#18392B] font-semibold transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download QR Code Image</span>
                        </a>
                      </div>
                    ) : (
                      <div className="py-8 px-4 space-y-2 text-slate-400">
                        <Building2 className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">Manual Transfer / Direct Deposit</p>
                        <p className="text-[11px] text-slate-500 max-w-xs">
                          Please use the account details on the left for over-the-counter deposit or online bank fund transfer.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step by Step Instructions */}
                {selectedMethod.instructions && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h4 className="font-serif font-bold text-sm text-[#18392B] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#588B76]" />
                      <span>Step-by-Step Giving Instructions:</span>
                    </h4>
                    <ol className="space-y-1.5 text-xs text-slate-600 pl-5 list-decimal leading-relaxed">
                      {(Array.isArray(selectedMethod.instructions)
                        ? selectedMethod.instructions
                        : typeof selectedMethod.instructions === 'string'
                        ? selectedMethod.instructions.split('\n')
                        : []
                      ).map((inst, idx) => (
                        <li key={idx} className="pl-1">
                          {inst}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. DONATION SUBMISSION / NOTIFICATION FORM */}
      <section id="donation-form" className="py-14 px-4 lg:px-8 bg-slate-50 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-2 mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Donation Acknowledgment & Receipt Notification</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
              Notify PCM of Your Gift or Kingdom Pledge
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
              Please complete this brief confirmation so our finance office can verify your transfer, issue your official
              acknowledgment receipt, and pray over your prayer requests.
            </p>
          </div>

          {/* Submission Success View */}
          {submittedDonation ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-500/40 shadow-xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#18392B]">
                  Thank You for Your Generous Gift!
                </h3>
                <p className="text-sm text-slate-600 max-w-xl mx-auto">
                  Your donation pledge has been recorded in the PCM Stewardship system. May the Lord abundantly bless you for
                  investing in the training of servant-leaders!
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="max-w-md mx-auto bg-slate-50 p-5 rounded-xl border border-slate-200 text-left space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Tracking Code:</span>
                  <span className="font-mono font-bold text-[#18392B]">{submittedDonation.trackingCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Donor Name:</span>
                  <span className="font-semibold text-slate-800">{submittedDonation.donorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount / Currency:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {submittedDonation.currency === 'PHP' ? '₱' : '$'}
                    {submittedDonation.amount.toLocaleString()} {submittedDonation.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Designation:</span>
                  <span className="font-medium text-slate-800">{submittedDonation.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="text-slate-800">{submittedDonation.paymentMethodName}</span>
                </div>
                {submittedDonation.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference No.:</span>
                    <span className="font-mono text-slate-800">{submittedDonation.transactionRef}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {submittedDonation.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
                <button
                  onClick={() => setSubmittedDonation(null)}
                  className="bg-[#588B76] hover:bg-[#46705F] text-white px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Submit Another Donation
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print / Save Receipt</span>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 space-y-6"
            >
              {/* 1. AMOUNT SELECTION */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Select or Enter Giving Amount ({currency}) <span className="text-red-500">*</span>
                </label>

                {/* Preset Amount Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {presetAmounts.map((p) => {
                    const isSelected = amount === p && !customAmount;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handleAmountSelect(p)}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#18392B] text-white border-[#18392B] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        {currency === 'PHP' ? '₱' : '$'}{p.toLocaleString()}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount and Currency Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                      {currency === 'PHP' ? '₱' : '$'}
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Or enter custom amount..."
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      className="w-full pl-8 pr-4 py-2.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76] focus:ring-1 focus:ring-[#588B76]"
                    />
                  </div>

                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'PHP' | 'USD')}
                    aria-label="Currency"
                    className="w-full py-2.5 px-3 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76]"
                  >
                    <option value="PHP">Philippine Peso (₱ PHP)</option>
                    <option value="USD">US Dollar ($ USD)</option>
                  </select>
                </div>
              </div>

              {/* 2. DESIGNATION / PURPOSE */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Designate Giving Purpose <span className="text-red-500">*</span>
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  aria-label="Designate Giving Purpose"
                  className="w-full py-2.5 px-3 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76]"
                >
                  {purposeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. DONOR INFORMATION */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Donor & Contact Information
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded text-[#588B76] focus:ring-[#588B76]"
                    />
                    <span>Give Anonymously</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!isAnonymous && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Full Name / Church or Org Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={!isAnonymous}
                        placeholder="e.g. Bro. Juan Dela Cruz / Faith Christian Church"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full p-2.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76]"
                      />
                    </div>
                  )}

                  <div className={`space-y-1 ${isAnonymous ? 'sm:col-span-2' : ''}`}>
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Email Address (for acknowledgment & receipt) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="donor@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full p-2.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Mobile / WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+63 917 XXX XXXX"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full p-2.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Bank / GCash Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 104928472910"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full p-2.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. PRAYER REQUEST / NOTES */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Prayer Request / Ministry Blessing Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="How may our faculty and student body pray for you and your family/ministry?"
                  value={prayerRequest}
                  onChange={(e) => setPrayerRequest(e.target.value)}
                  className="w-full p-2.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#588B76]"
                />
              </div>

              {/* 5. RECEIPT PREFERENCES */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestReceipt}
                    onChange={(e) => setRequestReceipt(e.target.checked)}
                    className="rounded text-[#588B76] focus:ring-[#588B76]"
                  />
                  <span className="font-semibold">
                    I would like an Official Institutional Donation Certificate & Acknowledgment Letter sent to my email.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#588B76] hover:bg-[#46705F] active:scale-[0.99] text-white font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Submitting Giving Notification...</span>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                      <span>Complete & Record Donation Notice</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  🔒 Your information is confidential and will never be shared with third parties.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 6. TRANSPARENCY & FINANCIAL ACCOUNTABILITY */}
      <section className="py-12 px-4 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-[#10261D] text-white rounded-2xl p-8 sm:p-10 border border-[#588B76]/30 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#588B76]/30">
            <div className="space-y-1">
              <span className="text-xs font-bold font-mono tracking-widest text-[#85AA9B] uppercase">
                Stewardship & Governance
              </span>
              <h3 className="font-serif text-2xl font-bold text-white">Financial Integrity & Accountability</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-[#18392B] border border-[#588B76]/50 text-xs text-emerald-300 px-3 py-1.5 rounded-md font-semibold">
                SEC Reg. No. 1992-0418
              </span>
              <span className="bg-[#18392B] border border-[#588B76]/50 text-xs text-emerald-300 px-3 py-1.5 rounded-md font-semibold">
                PCEC Member Institution
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#D0DED8]">
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#85AA9B]" />
                Independent Board Oversight
              </h4>
              <p className="leading-relaxed">
                PCM operates under an independent Board of Trustees comprised of respected pastors, alumni leaders, and
                civic professionals who ensure strict adherence to biblical stewardship principles.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#85AA9B]" />
                Annual Independent Audits
              </h4>
              <p className="leading-relaxed">
                Our institutional finances and scholarship disbursements undergo annual external CPA audits and are submitted
                promptly to the Philippine Securities and Exchange Commission (SEC).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#85AA9B]" />
                Designation Guarantee
              </h4>
              <p className="leading-relaxed">
                100% of donor-restricted gifts (such as named scholarships or campus building funds) are channeled directly to
                the designated ministry project without administrative dilution.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#588B76]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#85AA9B]">
            <span>Need assistance or wire transfer routing advice? Contact our Finance Office:</span>
            <span className="font-bold text-white">finance@pcm.ph | pcmpresident1992@gmail.com</span>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-12 px-4 lg:px-8 max-w-4xl mx-auto">
        <h3 className="font-serif text-2xl font-bold text-[#18392B] text-center mb-8">
          Giving Frequently Asked Questions
        </h3>

        <div className="space-y-4 text-xs">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-sm text-[#18392B]">Can I sponsor a specific theology student?</h4>
            <p className="text-slate-600 leading-relaxed">
              Yes! You can designate your support to our &ldquo;Adopt-a-Minister&rdquo; student scholarship program. Please contact our
              Admissions &amp; Dean&apos;s Office at admissions@pcm.ph to be paired with a student profile for prayer updates and academic letters.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-sm text-[#18392B]">How do I receive an official tax acknowledgment receipt?</h4>
            <p className="text-slate-600 leading-relaxed">
              When you submit the donation notice form above or email a copy of your bank deposit slip / GCash transaction screenshot to
              finance@pcm.ph, our cashier issues an official numbered acknowledgment receipt.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-sm text-[#18392B]">Can international donors give via US Dollars or Wire Transfer?</h4>
            <p className="text-slate-600 leading-relaxed">
              Yes. We accept wire transfers via SWIFT/BIC code as well as remittance channels (Western Union, Remitly, WorldRemit, GCash Remit).
              Contact us for international intermediary bank routing instructions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
