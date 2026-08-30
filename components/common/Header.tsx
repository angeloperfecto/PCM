'use client';

import React, { useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from './Emblem';
import { NavSection } from '@/lib/types';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Phone,
  Facebook,
  Youtube,
  Instagram,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentSection,
    navigateTo,
    setSearchModalOpen,
    isAdminLoggedIn,
    isStudentLoggedIn,
  } = usePCM();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: {
    id: NavSection;
    label: string;
    dropdown?: { label: string; subSection?: string; action?: () => void }[];
  }[] = [
    {
      id: 'home',
      label: 'HOME',
    },
    {
      id: 'why-choose-pcm',
      label: 'WHY CHOOSE PCM',
    },
    {
      id: 'about',
      label: 'ABOUT PCM',
      dropdown: [
        { label: 'About Us & Heritage', subSection: 'about-us' },
        { label: 'History & Milestones (1992–Present)', subSection: 'history' },
        { label: 'Vision & Mission', subSection: 'vision-mission' },
        { label: 'Core Values & Pillars', subSection: 'values' },
        { label: 'President & Leadership', subSection: 'leadership' },
        { label: 'Faculty & Academic Staff', subSection: 'faculty' },
        { label: 'Statement of Faith (Doctrinal Basis)', subSection: 'faith' },
      ],
    },
    {
      id: 'academics',
      label: 'ACADEMICS',
      dropdown: [
        { label: 'All Academic Programs', subSection: 'all-programs' },
        { label: 'Senior High School (GAS Strand)', subSection: 'shs' },
        { label: 'Associate of Theology (2-Year)', subSection: 'assoc' },
        { label: 'Bachelor of Theology (B.Th. 4-Year)', subSection: 'undergrad' },
        { label: 'BTh Specialized Chaplaincy Ministry', subSection: 'chaplaincy' },
        { label: 'Graduate Programs (M.Div. & M.C.L.)', subSection: 'grad' },
        { label: 'Certificate & Diploma Programs', subSection: 'certs' },
        { label: 'Course Catalog & Syllabi', subSection: 'catalog' },
        { label: 'Academic Calendar (AY 2026–2027)', subSection: 'calendar' },
      ],
    },
    {
      id: 'admissions',
      label: 'ADMISSIONS',
      dropdown: [
        { label: 'Why Study at PCM?', subSection: 'why-pcm' },
        { label: 'Admission Requirements', subSection: 'requirements' },
        { label: '4-Step Application Process', subSection: 'process' },
        { label: 'Senior High DepEd Vouchers', subSection: 'vouchers' },
        { label: 'Tuition & Fee Structure', subSection: 'tuition' },
        { label: 'Scholarships & Ministerial Grants', subSection: 'scholarships' },
        { label: 'Start Online Application', action: () => navigateTo('apply') },
      ],
    },
    {
      id: 'scrapbook',
      label: 'SCRAPBOOK',
    },
    {
      id: 'student-life',
      label: 'STUDENT LIFE',
      dropdown: [
        { label: 'Spiritual Formation & Chapel', subSection: 'chapel' },
        { label: 'Student Organizations & Council', subSection: 'orgs' },
        { label: 'Campus Life & Community', subSection: 'campus' },
        { label: 'Ministry Opportunities', subSection: 'opportunities' },
        { label: 'Student Services & Residence', subSection: 'services' },
      ],
    },
    {
      id: 'ministry',
      label: 'MINISTRY',
      dropdown: [
        { label: 'Ministry Formation & Ethos', subSection: 'formation' },
        { label: 'Church Partnerships (85+ Churches)', subSection: 'partnerships' },
        { label: 'Missions & Cross-Cultural Outreach', subSection: 'missions' },
        { label: 'Community Service & Medical Missions', subSection: 'community' },
        { label: 'Pastoral Practicum & Apprenticeship', subSection: 'practicum' },
      ],
    },
    {
      id: 'news-events',
      label: 'NEWS & EVENTS',
      dropdown: [
        { label: 'Latest College News', subSection: 'news' },
        { label: 'Official Announcements', subSection: 'announcements' },
        { label: 'Upcoming Events & Conferences', subSection: 'events' },
        { label: 'Theology Conference 2026', subSection: 'conference' },
        { label: 'Academic Updates', subSection: 'updates' },
      ],
    },
    {
      id: 'resources',
      label: 'RESOURCES',
      dropdown: [
        { label: 'Theological Library & Archives', subSection: 'library' },
        { label: 'Veritas et Ministerium Journal', subSection: 'publications' },
        { label: 'Sermons & Chapel Audio Archive', subSection: 'sermons' },
        { label: 'Download Center (Prospectus & Forms)', subSection: 'downloads' },
        { label: 'Frequently Asked Questions (FAQs)', subSection: 'faqs' },
      ],
    },
    {
      id: 'contact',
      label: 'CONTACT',
    },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-[#18392B] text-white shadow-xl transition-all duration-300 font-sans border-b border-[#588B76]/30">
      {/* 1. TOP UTILITY BAR (High Density Institutional Standard) */}
      <div className="bg-[#18392B] text-[#D0DED8] text-[11px] px-4 lg:px-8 py-1.5 flex flex-wrap justify-between items-center border-b border-[#588B76]/25 tracking-wider">
        {/* Left Links */}
        <div className="flex items-center gap-3 sm:gap-4 font-medium uppercase text-[11px]">
          <button
            id="btn-top-student-portal"
            onClick={() => navigateTo('portal')}
            className="hover:text-white transition cursor-pointer font-semibold text-[#D0DED8]"
          >
            {isStudentLoggedIn ? 'MyPCM Portal (Active)' : 'Student Portal'}
          </button>
          <span className="text-[#85AA9B]/40">|</span>
          <button
            id="btn-top-faculty-portal"
            onClick={() => navigateTo('about', 'faculty')}
            className="hover:text-white transition cursor-pointer text-[#D0DED8]"
          >
            Faculty
          </button>
          <span className="text-[#85AA9B]/40">|</span>
          <button
            id="nav-utility-alumni"
            onClick={() => navigateTo('about', 'alumni')}
            className="hover:text-white transition cursor-pointer text-[#D0DED8]"
          >
            Alumni
          </button>
          <span className="text-[#85AA9B]/40">|</span>
          <button
            id="nav-utility-library"
            onClick={() => navigateTo('resources', 'library')}
            className="hover:text-white transition cursor-pointer text-[#D0DED8]"
          >
            Library
          </button>
        </div>

        {/* Right Portals & Social */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden md:inline italic text-[#D0DED8]/90 text-[11px]">
            Equipping Servants. Transforming Lives.
          </span>

          {/* Quick Search Button */}
          <button
            id="btn-global-search-trigger"
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#10261D] hover:bg-[#234D3B] text-[#D0DED8] px-2.5 py-0.5 rounded-sm border border-[#588B76]/50 transition cursor-pointer text-[11px]"
            title="Search Website (Cmd+K)"
          >
            <Search className="w-3 h-3 text-[#85AA9B]" />
            <span>Search</span>
            <kbd className="hidden sm:inline bg-[#18392B] px-1 py-0.2 rounded text-[9px] text-[#D0DED8] font-mono border border-[#588B76]/30">
              ⌘K
            </kbd>
          </button>

          <span className="text-[#85AA9B]/40">|</span>

          {/* Admin CMS Trigger */}
          <button
            id="btn-nav-admin-cms"
            onClick={() => navigateTo('admin')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-sm transition font-medium cursor-pointer ${
              currentSection === 'admin'
                ? 'bg-[#588B76] text-white font-bold'
                : 'text-[#D0DED8] hover:text-white'
            }`}
            title="Institutional CMS & Admissions Administration"
          >
            <Lock className="w-3 h-3 text-[#85AA9B]" />
            <span>{isAdminLoggedIn ? 'Admin (In)' : 'Admin'}</span>
          </button>

          <span className="text-[#85AA9B]/40">|</span>

          {/* Migration Audit Trigger */}
          <button
            id="btn-nav-migration-audit"
            onClick={() => navigateTo('migration-report')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-sm transition font-medium cursor-pointer ${
              currentSection === 'migration-report'
                ? 'bg-[#588B76] text-white font-bold'
                : 'text-[#85AA9B] hover:text-white'
            }`}
            title="Source-to-Target Migration Audit & URL Inventory"
          >
            <ShieldCheck className="w-3 h-3 text-[#85AA9B]" />
            <span className="hidden sm:inline">Migration Report</span>
            <span className="sm:hidden">Audit</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN BRANDING HEADER & EMBLEM */}
      <div
        className={`bg-white px-4 lg:px-8 transition-all duration-300 flex items-center justify-between text-[#18392B] border-b border-[#D0DED8] shadow-xs z-10 ${
          isScrolled ? 'py-2.5' : 'py-3.5'
        }`}
      >
        {/* Brand identity */}
        <div
          onClick={() => navigateTo('home')}
          className="flex items-center gap-3 sm:gap-3.5 cursor-pointer group select-none"
          role="button"
          tabIndex={0}
        >
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <Emblem id="header-pcm-logo" size={48} className="w-12 h-12 transition-transform duration-200 group-hover:scale-105" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#18392B] font-serif text-lg sm:text-xl font-bold leading-tight group-hover:text-[#588B76] transition-colors">
              Philippines College of Ministry
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#588B76]">
              Theological Excellence & Pastoral Formation
            </p>
          </div>
        </div>

        {/* Desktop Navigation & Apply CTA */}
        <div className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-[#18392B] uppercase tracking-tight">
          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            const hasDropdown = item.dropdown && item.dropdown.length > 0;

            return (
              <div
                key={item.id}
                className="relative group"
                onMouseEnter={() => hasDropdown && setActiveDropdown(item.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    navigateTo(item.id);
                    setActiveDropdown(null);
                  }}
                  className={`flex items-center gap-1 pb-1 transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-[#588B76] text-[#18392B] font-extrabold'
                      : 'border-b-2 border-transparent text-[#18392B]/90 hover:text-[#588B76] hover:border-[#588B76]/40'
                  }`}
                >
                  <span>{item.label}</span>
                  {hasDropdown && (
                    <ChevronDown className="w-3 h-3 text-[#588B76] group-hover:rotate-180 transition-transform duration-200" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {hasDropdown && activeDropdown === item.id && (
                  <div className="absolute left-0 top-full w-72 bg-white border border-[#D0DED8] shadow-2xl rounded-sm py-2 text-[#18392B] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 mb-1 border-b border-[#D0DED8] text-[10px] text-[#588B76] font-mono tracking-widest uppercase font-bold">
                      {item.label} DIRECTORY
                    </div>
                    {item.dropdown?.map((sub, idx) => (
                      <button
                        key={idx}
                        id={`dropdown-${item.id}-${idx}`}
                        onClick={() => {
                          if (sub.action) {
                            sub.action();
                          } else {
                            navigateTo(item.id, sub.subSection);
                          }
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#D0DED8]/25 hover:text-[#18392B] transition flex items-center justify-between text-[12px] normal-case font-semibold border-l-2 border-transparent hover:border-[#588B76] cursor-pointer"
                      >
                        <span>{sub.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#588B76]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Deep Sage Apply CTA */}
          <button
            id="btn-header-apply-now"
            onClick={() => navigateTo('apply')}
            className="bg-[#588B76] text-white px-4 py-2 rounded-sm shadow-sm hover:bg-[#46705F] transition font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Apply Now
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle Mobile Menu"
          className="lg:hidden p-2 rounded-sm bg-[#18392B] text-white hover:bg-[#10261D] transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 4. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#18392B] border-t border-[#588B76]/30 text-[#D0DED8] px-4 py-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
          <div className="flex flex-col gap-2 pb-4 border-b border-[#588B76]/30">
            <button
              onClick={() => {
                navigateTo('apply');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white font-bold py-3 rounded-sm shadow uppercase text-sm tracking-wider"
            >
              <span>APPLY NOW FOR AY 2026–2027</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                navigateTo('portal');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#10261D] text-[#D0DED8] font-semibold py-2.5 rounded-sm border border-[#588B76]/40 text-xs hover:text-white"
            >
              <User className="w-4 h-4 text-[#85AA9B]" />
              <span>Student Portal Access</span>
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              const hasDropdown = item.dropdown && item.dropdown.length > 0;

              return (
                <div key={item.id} className="border-b border-[#588B76]/20 pb-1">
                  <div className="flex items-center justify-between py-2">
                    <button
                      onClick={() => {
                        navigateTo(item.id);
                        if (!hasDropdown) setMobileMenuOpen(false);
                      }}
                      className={`text-left font-serif text-sm font-semibold tracking-wide ${
                        isActive ? 'text-white font-bold' : 'text-[#D0DED8]'
                      }`}
                    >
                      {item.label}
                    </button>
                  </div>

                  {hasDropdown && (
                    <div className="pl-3 space-y-1 py-1 bg-[#10261D]/60 rounded-sm">
                      {item.dropdown?.map((sub, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (sub.action) {
                              sub.action();
                            } else {
                              navigateTo(item.id, sub.subSection);
                            }
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left py-1.5 text-xs text-[#D0DED8] hover:text-white flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#85AA9B]" />
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#588B76]/30 text-xs text-[#D0DED8]/80 space-y-2">
            <p className="font-semibold text-white">Philippines College of Ministry</p>
            <p>Lamtang, Puguis, La Trinidad, Benguet (P.O. Box 298, Baguio City)</p>
            <p>Tel: +63 74 422 2577 | info@pcm.ph</p>
          </div>
        </div>
      )}
    </header>
  );
};
