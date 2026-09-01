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
  Calendar,
  FileText,
  HelpCircle,
  Clock,
  MapPin,
  Flame,
  Users,
  Compass,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentSection,
    navigateTo,
    setSearchModalOpen,
    isAdminLoggedIn,
    isStudentLoggedIn,
    setStatementOfFaithModalOpen,
    setTuitionCalculatorModalOpen,
    setRequestInfoModalOpen,
    siteConfig,
    currentUserAccount,
    firebaseAuthUser,
    setUserAccountModalOpen,
    signInWithGoogle,
  } = usePCM();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
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
    dropdown?: { label: string; subSection?: string; action?: () => void; icon?: any }[];
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
        { label: 'Faculty & Academic Staff', subSection: 'faculty' },
        {
          label: 'Statement of Faith (Doctrinal Basis)',
          action: () => setStatementOfFaithModalOpen(true),
          icon: ShieldCheck,
        },
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
        { label: 'Academic Calendar (AY 2026–2027)', subSection: 'calendar', icon: Calendar },
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
        {
          label: 'Tuition Calculator Tool',
          action: () => setTuitionCalculatorModalOpen(true),
          icon: Sparkles,
        },
        { label: 'Scholarships & Ministerial Grants', subSection: 'scholarships' },
        {
          label: 'Start Online Application',
          action: () => navigateTo('apply'),
          icon: GraduationCap,
        },
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
        { label: 'Spiritual Formation & Chapel', subSection: 'chapel', icon: Flame },
        { label: 'Student Organizations & Council', subSection: 'orgs', icon: Users },
        { label: 'Campus Life & Community', subSection: 'campus' },
        { label: 'Ministry Opportunities', subSection: 'opportunities', icon: Compass },
        { label: 'Student Services & Residence', subSection: 'services' },
      ],
    },
    {
      id: 'ministry',
      label: 'MINISTRY',
      dropdown: [
        { label: 'Pastoral Practicum & Apprenticeship', subSection: 'practicum' },
        { label: 'Church Partnerships (85+ Churches)', subSection: 'partnerships' },
        { label: 'Missions & Cross-Cultural Outreach', subSection: 'missions' },
        { label: 'Community Service & Medical Missions', subSection: 'community' },
        { label: 'Ministry Formation & Ethos', subSection: 'formation' },
      ],
    },
    {
      id: 'news-events',
      label: 'NEWS & EVENTS',
      dropdown: [
        { label: 'Latest College News', subSection: 'news' },
        { label: 'Official Announcements', subSection: 'announcements' },
        { label: 'Upcoming Events & Conferences', subSection: 'events', icon: Calendar },
        { label: 'Theology Conference 2026', subSection: 'conference' },
      ],
    },
    {
      id: 'resources',
      label: 'RESOURCES',
      dropdown: [
        { label: 'Download Center (Prospectus & Forms)', subSection: 'downloads', icon: FileText },
        { label: 'Sermons & Chapel Audio Archive', subSection: 'sermons' },
        { label: 'Theological Library & Archives', subSection: 'library' },
        { label: 'Veritas et Ministerium Journal', subSection: 'publications' },
        { label: 'Frequently Asked Questions (FAQs)', subSection: 'faqs', icon: HelpCircle },
      ],
    },
    {
      id: 'contact',
      label: 'CONTACT',
    },
  ];

  const handleMobileNavClick = (sectionId: NavSection, subSection?: string, action?: () => void) => {
    if (action) {
      action();
    } else {
      navigateTo(sectionId, subSection);
    }
    setMobileMenuOpen(false);
    setMobileExpandedSection(null);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-[#18392B] text-white shadow-xl transition-all duration-300 font-sans border-b border-[#588B76]/30">
      {/* 1. TOP UTILITY BAR (Institutional Standard) */}
      <div className="bg-[#10261D] text-[#D0DED8] text-[11px] px-4 lg:px-8 py-1.5 flex flex-wrap justify-between items-center border-b border-[#588B76]/25 tracking-wider">
        {/* Left Links */}
        <div className="flex items-center gap-3 sm:gap-4 font-medium uppercase text-[11px]">
          <button
            id="btn-top-student-portal"
            onClick={() => navigateTo('portal')}
            className="hover:text-white transition cursor-pointer font-semibold text-[#85AA9B] hover:underline"
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
            onClick={() => navigateTo('about', 'faculty')}
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

        {/* Right Portals & Actions */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden md:inline italic text-[#D0DED8]/90 text-[11px]">
            Equipping Servants. Transforming Lives.
          </span>

          {/* Quick Search Button */}
          <button
            id="btn-global-search-trigger"
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#18392B] hover:bg-[#234D3B] text-[#D0DED8] px-2.5 py-0.5 rounded-sm border border-[#588B76]/50 transition cursor-pointer text-[11px]"
            title="Search Website (Cmd+K)"
          >
            <Search className="w-3 h-3 text-[#85AA9B]" />
            <span>Search</span>
            <kbd className="hidden sm:inline bg-[#10261D] px-1 py-0.2 rounded text-[9px] text-[#D0DED8] font-mono border border-[#588B76]/30">
              ⌘K
            </kbd>
          </button>

          <span className="text-[#85AA9B]/40">|</span>

          {/* Google Auth & User Account Trigger */}
          <button
            id="btn-nav-google-account"
            onClick={() => setUserAccountModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-emerald-500/30 text-white transition font-medium cursor-pointer text-[11px]"
            title="Google Account & Role Management"
          >
            {currentUserAccount?.photoURL || firebaseAuthUser?.photoURL ? (
              <img
                src={currentUserAccount?.photoURL || firebaseAuthUser?.photoURL || ''}
                alt="Profile"
                className="w-4 h-4 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="font-semibold">
              {currentUserAccount
                ? currentUserAccount.name.split(' ')[0]
                : firebaseAuthUser
                ? (firebaseAuthUser.displayName?.split(' ')[0] || 'Account')
                : 'Sign In (Google)'}
            </span>
            {currentUserAccount && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                currentUserAccount.role === 'Admin' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
              }`}>
                {currentUserAccount.role}
              </span>
            )}
          </button>

          {currentUserAccount?.role !== 'Student' && (
            <>
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
            </>
          )}

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
          id="header-brand-logo"
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
              {siteConfig?.siteIdentity?.name || 'Philippine College of Ministry'}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#588B76]">
              {siteConfig?.siteIdentity?.tagline || 'Theological Excellence & Pastoral Formation'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation & Apply CTA */}
        <div className="hidden lg:flex items-center gap-5 text-[13px] font-bold text-[#18392B] uppercase tracking-tight">
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
                  aria-expanded={activeDropdown === item.id}
                  aria-haspopup={hasDropdown ? 'true' : undefined}
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
                    {item.dropdown?.map((sub, idx) => {
                      const Icon = sub.icon;
                      return (
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
                          <span className="flex items-center gap-2">
                            {Icon && <Icon className="w-3.5 h-3.5 text-[#588B76]" />}
                            <span>{sub.label}</span>
                          </span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#588B76]" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Upgraded Header Primary CTA Button */}
          <button
            id="btn-header-apply-now"
            onClick={() => navigateTo('apply')}
            className="group relative inline-flex items-center justify-center gap-2 bg-[#588B76] hover:bg-[#46705F] active:scale-[0.98] text-white px-4 py-2 rounded-sm shadow-sm hover:shadow-md transition-all duration-200 font-bold text-xs uppercase tracking-wider cursor-pointer border border-[#588B76]/50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#588B76] focus-visible:ring-offset-2"
          >
            <GraduationCap className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-200" />
            <span>APPLY NOW</span>
            <span className="text-[10px] opacity-80 font-normal hidden xl:inline">| AY 2026–2027</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            id="btn-mobile-header-apply"
            onClick={() => navigateTo('apply')}
            className="bg-[#588B76] hover:bg-[#46705F] text-white text-[11px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <span>Apply</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Mobile Menu"
            className="p-2 rounded-sm bg-[#18392B] text-white hover:bg-[#10261D] transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 3. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#18392B] border-t border-[#588B76]/30 text-[#D0DED8] px-4 py-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          {/* Mobile Top Action CTAs */}
          <div className="flex flex-col gap-2 pb-4 border-b border-[#588B76]/30">
            <button
              id="mobile-menu-btn-apply"
              onClick={() => {
                navigateTo('apply');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white font-bold py-3 rounded-sm shadow-md uppercase text-xs tracking-wider transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>APPLY ONLINE FOR AY 2026–2027</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="mobile-menu-btn-portal"
                onClick={() => {
                  navigateTo('portal');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 bg-[#10261D] text-[#D0DED8] font-semibold py-2 rounded-sm border border-[#588B76]/40 text-xs hover:text-white transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#85AA9B]" />
                <span>Student Portal</span>
              </button>

              <button
                id="mobile-menu-btn-search"
                onClick={() => {
                  setSearchModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 bg-[#10261D] text-[#D0DED8] font-semibold py-2 rounded-sm border border-[#588B76]/40 text-xs hover:text-white transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#85AA9B]" />
                <span>Global Search</span>
              </button>
            </div>
          </div>

          {/* Navigation Accordion Items */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              const hasDropdown = item.dropdown && item.dropdown.length > 0;
              const isExpanded = mobileExpandedSection === item.id;

              return (
                <div key={item.id} className="border-b border-[#588B76]/20 pb-1">
                  <div className="flex items-center justify-between py-2">
                    <button
                      onClick={() => {
                        if (hasDropdown) {
                          setMobileExpandedSection(isExpanded ? null : item.id);
                        } else {
                          handleMobileNavClick(item.id);
                        }
                      }}
                      className={`text-left font-serif text-sm font-semibold tracking-wide flex-1 cursor-pointer ${
                        isActive ? 'text-white font-bold' : 'text-[#D0DED8]'
                      }`}
                    >
                      {item.label}
                    </button>

                    {hasDropdown && (
                      <button
                        onClick={() => setMobileExpandedSection(isExpanded ? null : item.id)}
                        className="p-1 text-[#85AA9B] hover:text-white cursor-pointer"
                        aria-label={`Toggle ${item.label} submenu`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {hasDropdown && isExpanded && (
                    <div className="pl-3 space-y-1 py-1.5 bg-[#10261D]/80 rounded-sm border-l-2 border-[#588B76]">
                      {/* Main Section Link */}
                      <button
                        onClick={() => handleMobileNavClick(item.id)}
                        className="w-full text-left py-1.5 text-xs text-[#85AA9B] hover:text-white font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <span>→ Overview: {item.label}</span>
                      </button>

                      {item.dropdown?.map((sub, idx) => {
                        const Icon = sub.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleMobileNavClick(item.id, sub.subSection, sub.action)}
                            className="w-full text-left py-1.5 text-xs text-[#D0DED8] hover:text-white flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              {Icon ? <Icon className="w-3 h-3 text-[#85AA9B]" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#85AA9B]" />}
                              <span>{sub.label}</span>
                            </span>
                            <ArrowRight className="w-3 h-3 text-[#588B76]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Tools & Modals */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setTuitionCalculatorModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 bg-[#10261D] rounded-sm text-xs text-[#D0DED8] hover:text-white flex items-center justify-between border border-[#588B76]/30 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#85AA9B]" />
                <span>Tuition & Voucher Calculator</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#588B76]" />
            </button>

            <button
              onClick={() => {
                setStatementOfFaithModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 bg-[#10261D] rounded-sm text-xs text-[#D0DED8] hover:text-white flex items-center justify-between border border-[#588B76]/30 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#85AA9B]" />
                <span>12-Article Statement of Faith</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#588B76]" />
            </button>
          </div>

          {/* Mobile Footer info */}
          <div className="pt-4 border-t border-[#588B76]/30 text-xs text-[#D0DED8]/80 space-y-1.5">
            <p className="font-semibold text-white">Philippine College of Ministry</p>
            <p className="text-[11px]">Lamtang, Puguis, La Trinidad, Benguet (P.O. Box 298, Baguio City)</p>
            <p className="text-[11px] font-mono text-[#85AA9B]">Tel: +63 74 422 2577 | info@pcm.ph</p>
          </div>
        </div>
      )}
    </header>
  );
};
