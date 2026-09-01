'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from './Emblem';
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Youtube,
  Instagram,
  Shield,
  ArrowRight,
  ExternalLink,
  Heart,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo, subscribeNewsletter, setStatementOfFaithModalOpen, siteConfig, currentUserAccount } = usePCM();
  const [footerEmail, setFooterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (footerEmail) {
      const res = subscribeNewsletter(footerEmail);
      if (res) {
        setSubscribed(true);
        setFooterEmail('');
      }
    }
  };

  const contact = siteConfig?.contactInfo;
  const siteIdentity = siteConfig?.siteIdentity;
  const footerConf = siteConfig?.footerConfig;

  return (
    <footer className="w-full bg-[#18392B] text-[#D0DED8] font-sans border-t-4 border-[#588B76]">
      {/* 1. TOP INSTITUTIONAL BARRIER */}
      <div className="bg-[#10261D] border-b border-[#588B76]/25 py-6 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <Emblem id="footer-pcm-logo" size={44} className="w-11 h-11" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white tracking-wide uppercase">
                {siteIdentity?.name || 'Philippine College of Ministry'}
              </h3>
              <p className="text-xs text-[#85AA9B] italic font-serif">
                {siteIdentity?.motto || 'Equipping Servants. Transforming Lives. Advancing God\'s Kingdom.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="footer-btn-apply"
              onClick={() => navigateTo('apply')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2 rounded-sm shadow transition uppercase tracking-wider cursor-pointer"
            >
              Online Admissions AY 2026–2027
            </button>
            <button
              id="footer-btn-statement-faith"
              onClick={() => setStatementOfFaithModalOpen(true)}
              className="bg-[#18392B] hover:bg-[#234D3B] text-white text-xs font-semibold px-4 py-2 rounded-sm border border-[#588B76]/60 transition flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#85AA9B]" />
              <span>Statement of Faith</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT COLUMNS */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs">
        {/* Column 1: Contact & Campus Info */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider border-b border-[#588B76]/40 pb-2 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#588B76]" />
            Campus & Administration
          </h4>
          <p className="text-[#D0DED8] leading-relaxed">
            {footerConf?.aboutText ||
              'Philippine College of Ministry (PCM) is a Christ-centered, non-denominational evangelical college affiliated with the Stone-Campbell Restoration Movement, dedicated to academic rigor, spiritual formation, and pastoral equipping in the Cordillera and across the nations.'}
          </p>

          <div className="space-y-2 text-[#D0DED8]">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#85AA9B] shrink-0 mt-0.5" />
              <span>{contact?.address || 'Lamtang, Puguis, La Trinidad, Benguet, Philippines (P.O. Box 298, Baguio City 2600)'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#85AA9B] shrink-0" />
              <span>{contact?.phone || '+63 74 422 2577 / +63 917 582 1992'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#85AA9B] shrink-0" />
              <span>{contact?.email || 'info@pcm.ph | pcmpresident1992@gmail.com | admissions@pcm.ph'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: ABOUT PCM */}
        <div className="space-y-3">
          <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider border-b border-[#588B76]/40 pb-2">
            ABOUT PCM
          </h4>
          <ul className="space-y-2 text-[#D0DED8]">
            <li>
              <button
                onClick={() => navigateTo('why-choose-pcm')}
                className="hover:text-white transition text-left cursor-pointer text-[#85AA9B] font-semibold"
              >
                Why Choose PCM
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('about', 'about-us')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                About Us & Heritage
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('about', 'history')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                History & Milestones (1992)
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('about', 'vision-mission')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Mission & Vision
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('about', 'faculty')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Faculty & Pioneer Leaders
              </button>
            </li>
            <li>
              <button
                onClick={() => setStatementOfFaithModalOpen(true)}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Statement of Faith
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('scrapbook')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                PCM Scrapbook & Gallery
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: ACADEMICS & ADMISSIONS */}
        <div className="space-y-3">
          <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider border-b border-[#588B76]/40 pb-2">
            ACADEMICS
          </h4>
          <ul className="space-y-2 text-[#D0DED8]">
            <li>
              <button
                onClick={() => navigateTo('academics', 'shs')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Senior High School (GAS Strand)
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('academics', 'undergrad')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Bachelor of Theology (B.Th.)
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('academics', 'chaplaincy')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                BTh Specialized Chaplaincy (SCM)
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('academics', 'assoc')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Associate of Theology (2-Year)
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('academics', 'grad')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Master of Divinity (M.Div.)
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('admissions', 'vouchers')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                DepEd Senior High Vouchers
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('admissions', 'scholarships')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Scholarships & Financial Aid
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: MINISTRY & RESOURCES */}
        <div className="space-y-3">
          <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider border-b border-[#588B76]/40 pb-2">
            MINISTRY & PORTALS
          </h4>
          <ul className="space-y-2 text-[#D0DED8]">
            <li>
              <button
                onClick={() => navigateTo('ministry', 'practicum')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Pastoral Practicum
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('ministry', 'partnerships')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                85+ Church Partnerships
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('resources', 'downloads')}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Download Center & Forms
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('portal')}
                className="text-[#85AA9B] font-semibold hover:text-white transition text-left cursor-pointer flex items-center gap-1"
              >
                <span>MyPCM Student Portal</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('migration-report')}
                className="text-[#85AA9B] hover:text-white transition text-left cursor-pointer flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-[#85AA9B]" />
                <span>Source Migration Report</span>
              </button>
            </li>
            {currentUserAccount?.role !== 'Student' && (
              <li>
                <button
                  onClick={() => navigateTo('admin')}
                  className="text-[#D0DED8] hover:text-white transition text-left cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-[#85AA9B]" />
                  <span>Admin CMS Portal</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 3. ACCREDITATIONS & PARTNER LOGOS */}
      <div className="bg-[#10261D] py-6 px-4 lg:px-8 border-t border-[#588B76]/25 text-[11px] text-[#D0DED8]/90 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[#D0DED8]">
            <span className="font-semibold text-white">Accreditations & Affiliations:</span>
            <span className="bg-[#18392B] px-2.5 py-1 rounded-sm border border-[#588B76]/40">
              Commission on Higher Education (CHED)
            </span>
            <span className="bg-[#18392B] px-2.5 py-1 rounded-sm border border-[#588B76]/40">
              Philippine Association of Bible & Theological Schools (PABATS)
            </span>
            <span className="bg-[#18392B] px-2.5 py-1 rounded-sm border border-[#588B76]/40">
              Philippine Council of Evangelical Churches (PCEC)
            </span>
            <span className="bg-[#18392B] px-2.5 py-1 rounded-sm border border-[#588B76]/40">
              Stone-Campbell Restoration Movement
            </span>
          </div>

          <p className="text-[#D0DED8]/80 text-[11px]">
            Founded June 12, 1992 in Baguio City | Lamtang Campus since June 13, 2005.
          </p>
        </div>
      </div>

      {/* 4. COPYRIGHT & LEGAL */}
      <div className="bg-[#0C1E16] py-4 px-4 lg:px-8 text-center text-[#D0DED8]/70 text-[11px]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 PCM — Philippine College of Ministry. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStatementOfFaithModalOpen(true)}
              className="hover:text-white transition"
            >
              Doctrinal Basis
            </button>
            <span>•</span>
            <button
              onClick={() => navigateTo('contact')}
              className="hover:text-white transition"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => navigateTo('contact')}
              className="hover:text-white transition"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
