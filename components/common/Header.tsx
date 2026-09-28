'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePCM } from '@/lib/store';
import { Emblem } from './Emblem';
import { NavSection } from '@/lib/types';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Calendar,
  FileText,
  HelpCircle,
  Flame,
  Users,
  Compass,
  Heart,
  DollarSign,
  Award,
  Image as ImageIcon,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentSection,
    navigateTo,
    programs,
    setSelectedProgram,
    setSearchModalOpen,
    isAdminLoggedIn,
    isStudentLoggedIn,
    setIsAdminLoggedIn,
    setIsStudentLoggedIn,
    setStatementOfFaithModalOpen,
    setTuitionCalculatorModalOpen,
    siteConfig,
    currentUserAccount,
    firebaseAuthUser,
    currentAdminUser,
    studentProfile,
    setUserAccountModalOpen,
  } = usePCM();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems: {
    id: NavSection;
    label: string;
    badge?: string;
    dropdown?: { label: string; subSection?: string; action?: () => void; icon?: any }[];
  }[] = [
    {
      id: 'home',
      label: 'HOME',
    },
    {
      id: 'about',
      label: 'ABOUT',
      dropdown: [
        {
          label: 'Why Choose PCM (10 Distinctives)',
          action: () => navigateTo('why-choose-pcm'),
          icon: Award,
        },
        { label: 'About Us & Heritage', subSection: 'about-us' },
        { label: 'History & Milestones (1992–Present)', subSection: 'history' },
        { label: 'Vision & Mission', subSection: 'vision-mission' },
        { label: 'Core Values & Pillars', subSection: 'values' },
        { label: 'Faculty & Academic Staff', subSection: 'faculty', icon: Users },
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
      dropdown: (programs && programs.length > 0 ? programs : [
        {
          id: 'prog-bth',
          name: 'Bachelor of Arts in Theology',
          code: 'BTH-401',
          duration: '4 Years (8 Semesters)',
        } as any,
      ]).map((prog) => {
        const hasTheology = prog.name.toLowerCase().includes('theology');
        const has4Years = prog.name.includes('4-Year') || (prog.duration && prog.duration.includes('4'));
        const label = hasTheology && !has4Years
          ? `${prog.name} (B.Th. 4-Year)`
          : prog.name;

        return {
          label,
          action: () => {
            setSelectedProgram(prog);
            navigateTo('academics', prog.id);
          },
          icon: GraduationCap,
        };
      }),
    },
    {
      id: 'admissions',
      label: 'ADMISSIONS',
      dropdown: [
        {
          label: 'Why Study at PCM?',
          action: () => navigateTo('why-choose-pcm'),
          icon: Award,
        },
        { label: 'Admission Requirements', subSection: 'requirements' },
        { label: '4-Step Application Process', subSection: 'process' },
        { label: 'Required Documents & Credentials', subSection: 'requirements' },
        { label: 'Tuition & Fee Structure', subSection: 'tuition' },
        {
          label: 'Tuition Calculator Tool',
          action: () => setTuitionCalculatorModalOpen(true),
          icon: Sparkles,
        },
        { label: 'Scholarships & Ministerial Grants', subSection: 'scholarships' },
        {
          label: 'Admission Office & Staff Directory',
          subSection: 'directory',
          icon: Users,
        },
        {
          label: 'Start Online Application',
          action: () => navigateTo('apply'),
          icon: GraduationCap,
        },
      ],
    },
    {
      id: 'portal',
      label: 'ENROLLMENT',
      badge: 'AY 26–27',
      dropdown: [
        {
          label: 'Student Online Enrollment Hub',
          action: () => {
            setIsStudentLoggedIn(true);
            navigateTo('portal');
          },
          icon: GraduationCap,
        },
        {
          label: 'Registrar Admin Enrollment CMS',
          action: () => {
            setIsAdminLoggedIn(true);
            navigateTo('admin');
          },
          icon: ShieldCheck,
        },
        {
          label: 'Course Pre-Enlistment Module',
          action: () => {
            setIsStudentLoggedIn(true);
            navigateTo('portal');
          },
          icon: FileText,
        },
        {
          label: 'Tuition & Fee Assessment Policy',
          action: () => {
            setIsStudentLoggedIn(true);
            navigateTo('portal');
          },
          icon: DollarSign,
        },
        {
          label: 'Academic Calendar & Registration Deadlines',
          action: () => navigateTo('academics', 'calendar'),
          icon: Calendar,
        },
      ],
    },
    {
      id: 'student-life',
      label: 'STUDENT LIFE',
      dropdown: [
        { label: 'Spiritual Formation & Chapel', subSection: 'chapel', icon: Flame },
        {
          label: 'Campus Photo Scrapbook & Archive',
          action: () => navigateTo('scrapbook'),
          icon: ImageIcon,
        },
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
        {
          label: 'Historical Photo Scrapbook (1992–Present)',
          action: () => navigateTo('scrapbook'),
          icon: ImageIcon,
        },
        { label: 'Veritas et Ministerium Journal', subSection: 'publications' },
        { label: 'Frequently Asked Questions (FAQs)', subSection: 'faqs', icon: HelpCircle },
      ],
    },
    {
      id: 'donation',
      label: 'DONATION',
      dropdown: [
        { label: 'Ministry Giving Overview', subSection: 'overview' },
        { label: 'Official Giving Channels (GCash/Bank)', subSection: 'channels' },
        { label: 'Online Donation Form', subSection: 'form', icon: Heart },
        { label: 'Kingdom Impact & Accountability', subSection: 'impact' },
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
      <div className="bg-[#10261D] text-[#D0DED8] text-[10.5px] sm:text-[11px] px-3 sm:px-4 lg:px-6 xl:px-8 py-1 flex items-center justify-between border-b border-[#588B76]/25 tracking-wider min-h-[30px] w-full overflow-x-auto no-scrollbar">
        {/* Left Institutional Portals & Giving */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 font-medium uppercase text-[10.5px] sm:text-[11px] shrink-0">
          <button
            id="btn-top-student-portal"
            onClick={() => navigateTo('portal')}
            className="group relative flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer font-semibold text-[#85AA9B] hover:underline whitespace-nowrap"
          >
            {isStudentLoggedIn && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-xs shadow-emerald-400/80" />
            )}
            <span>{isStudentLoggedIn ? 'MyPCM Portal (Active)' : 'Student Portal'}</span>
          </button>
          <span className="text-[#588B76]/40 hidden sm:inline select-none">|</span>
          <button
            id="btn-top-faculty-portal"
            onClick={() => navigateTo('about', 'faculty')}
            className="hover:text-white transition-colors cursor-pointer text-[#D0DED8] hidden sm:inline whitespace-nowrap"
          >
            Faculty
          </button>
          <span className="text-[#588B76]/40 hidden sm:inline select-none">|</span>
          <button
            id="nav-utility-alumni"
            onClick={() => navigateTo('about', 'faculty')}
            className="hover:text-white transition-colors cursor-pointer text-[#D0DED8] hidden sm:inline whitespace-nowrap"
          >
            Alumni
          </button>
          <span className="text-[#588B76]/40 hidden md:inline select-none">|</span>
          <button
            id="nav-utility-library"
            onClick={() => navigateTo('resources', 'library')}
            className="hover:text-white transition-colors cursor-pointer text-[#D0DED8] hidden md:inline whitespace-nowrap"
          >
            Library
          </button>
          <span className="text-[#588B76]/40 select-none">|</span>
          <button
            id="nav-utility-give"
            onClick={() => navigateTo('donation')}
            className="group relative hover:text-amber-200 transition-colors cursor-pointer text-amber-300 font-bold flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 rounded-sm hover:bg-amber-400/10"
          >
            <Heart className="w-3 h-3 fill-amber-300/40 text-amber-300 shrink-0 group-hover:scale-125 transition-transform duration-200" />
            <span className="hidden xs:inline">Give to PCM</span>
            <span className="xs:hidden">Give</span>
          </button>
        </div>

        {/* Right Tools, Account & CMS Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-[10.5px] sm:text-[11px] shrink-0 pl-2">
          <span className="hidden 2xl:inline italic text-[#D0DED8]/85 text-[11px] whitespace-nowrap tracking-normal">
            Equipping Servants. Transforming Lives.
          </span>

          {/* Quick Search Button with animated badge */}
          <button
            id="btn-global-search-trigger"
            onClick={() => setSearchModalOpen(true)}
            className="group flex items-center gap-1.5 bg-[#18392B] hover:bg-[#234D3B] active:scale-[0.98] text-[#D0DED8] hover:text-white px-2 sm:px-2.5 py-0.5 rounded-sm border border-[#588B76]/50 hover:border-[#85AA9B] transition-all cursor-pointer text-[10.5px] sm:text-[11px] shrink-0 whitespace-nowrap shadow-xs"
            title="Search Website (Cmd+K)"
          >
            <Search className="w-3 h-3 text-[#85AA9B] group-hover:text-white group-hover:scale-110 transition-transform duration-150 shrink-0" />
            <span className="hidden xs:inline font-medium">Search</span>
            <kbd className="hidden sm:inline-flex items-center bg-[#10261D] group-hover:bg-[#18392B] px-1 py-0.2 rounded text-[9px] text-[#85AA9B] group-hover:text-white font-mono border border-[#588B76]/40 transition-colors">
              ⌘K
            </kbd>
          </button>

          <span className="text-[#588B76]/40 select-none">|</span>

          {/* Google Auth & User Account Trigger */}
          <button
            id="btn-nav-google-account"
            onClick={() => setUserAccountModalOpen(true)}
            className="group flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-emerald-500/30 hover:border-emerald-400/60 text-white transition-all font-medium cursor-pointer text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap shadow-xs"
            title="Google Account & Role Management"
          >
            {currentUserAccount?.photoURL || currentUserAccount?.avatarUrl || firebaseAuthUser?.photoURL || (isAdminLoggedIn ? currentAdminUser?.avatarUrl : studentProfile?.avatarUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUserAccount?.photoURL || currentUserAccount?.avatarUrl || firebaseAuthUser?.photoURL || (isAdminLoggedIn ? currentAdminUser?.avatarUrl : studentProfile?.avatarUrl) || ''}
                alt="Profile"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover shrink-0 ring-1 ring-emerald-400/50 group-hover:ring-emerald-400"
                referrerPolicy="no-referrer"
              />
            ) : (
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
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
            <span className="font-semibold max-w-[70px] xs:max-w-[100px] sm:max-w-none truncate">
              {currentUserAccount
                ? currentUserAccount.name.split(' ')[0]
                : firebaseAuthUser
                ? (firebaseAuthUser.displayName?.split(' ')[0] || 'Account')
                : 'Sign In'}
            </span>
            {currentUserAccount && (
              <span className={`text-[8.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded font-bold shadow-xs ${
                currentUserAccount.role === 'Admin' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
              }`}>
                {currentUserAccount.role}
              </span>
            )}
          </button>

          {currentUserAccount?.role !== 'Student' && (
            <>
              <span className="text-[#588B76]/40 select-none">|</span>

              {/* Admin CMS Trigger */}
              <button
                id="btn-nav-admin-cms"
                onClick={() => navigateTo('admin')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-sm transition-all font-medium cursor-pointer shrink-0 ${
                  currentSection === 'admin'
                    ? 'bg-[#588B76] text-white font-bold shadow-xs'
                    : 'text-[#D0DED8] hover:text-white hover:bg-white/5'
                }`}
                title="Institutional CMS & Admissions Administration"
              >
                <Lock className="w-3 h-3 text-[#85AA9B] shrink-0" />
                <span className="whitespace-nowrap">{isAdminLoggedIn ? 'Admin (In)' : 'Admin'}</span>
              </button>
            </>
          )}

          <span className="text-[#588B76]/40 hidden sm:inline select-none">|</span>

          {/* Migration Audit Trigger */}
          <button
            id="btn-nav-migration-audit"
            onClick={() => navigateTo('migration-report')}
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-sm transition-all font-medium cursor-pointer shrink-0 ${
              currentSection === 'migration-report'
                ? 'bg-[#588B76] text-white font-bold shadow-xs'
                : 'text-[#85AA9B] hover:text-white hover:bg-white/5'
            }`}
            title="Source-to-Target Migration Audit & URL Inventory"
          >
            <ShieldCheck className="w-3 h-3 text-[#85AA9B] shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">Migration Report</span>
            <span className="md:hidden whitespace-nowrap">Audit</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN BRANDING HEADER & EMBLEM */}
      <div
        className={`bg-white/98 backdrop-blur-md px-3 sm:px-4 lg:px-6 xl:px-8 transition-all duration-300 flex items-center justify-between text-[#18392B] border-b border-[#D0DED8] z-10 w-full ${
          isScrolled ? 'h-14 py-1 shadow-md shadow-emerald-950/5' : 'h-15 sm:h-16 py-1.5 shadow-xs'
        }`}
      >
        {/* Brand identity */}
        <div
          id="header-brand-logo"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 sm:gap-2.5 md:gap-3 cursor-pointer group select-none min-w-0 pr-2 shrink"
          role="button"
          tabIndex={0}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 relative"
          >
            <Emblem
              id="header-pcm-logo"
              size={38}
              className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-105"
            />
          </motion.div>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-[#18392B] font-serif text-[13px] xs:text-[15px] sm:text-base md:text-lg font-bold leading-tight group-hover:text-[#588B76] transition-colors truncate max-w-[170px] xs:max-w-[240px] sm:max-w-[320px] md:max-w-none tracking-tight">
              {siteConfig?.siteIdentity?.name || 'Philippine College of Ministry'}
            </h1>
            <p className="text-[9.5px] sm:text-[10px] uppercase tracking-wider font-semibold text-[#588B76] truncate hidden sm:flex items-center gap-1.5">
              <span>Lamtang, Benguet</span>
              <span className="w-1 h-1 rounded-full bg-[#588B76]/50 inline-block" />
              <span>Founded 1992</span>
            </p>
          </div>
        </div>

        {/* Desktop Navigation & Apply CTA (xl screens and up: 1280px+) */}
        <nav
          aria-label="Main Navigation"
          className="hidden xl:flex items-center gap-0.5 xl:gap-1 2xl:gap-2 text-[10.5px] xl:text-[11px] 2xl:text-[12px] font-bold text-[#18392B] uppercase tracking-tight shrink-0"
        >
          {navItems.map((item, itemIdx) => {
            const isActive =
              currentSection === item.id ||
              (item.id === 'about' && currentSection === 'why-choose-pcm') ||
              (item.id === 'student-life' && currentSection === 'scrapbook');
            const hasDropdown = item.dropdown && item.dropdown.length > 0;
            const isHovered = hoveredNav === item.id;

            return (
              <div
                key={item.id}
                className="relative shrink-0 py-1"
                onMouseEnter={() => {
                  setHoveredNav(item.id);
                  if (hasDropdown) setActiveDropdown(item.id);
                }}
                onMouseLeave={() => {
                  setHoveredNav(null);
                  setActiveDropdown(null);
                }}
              >
                <button
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    navigateTo(item.id);
                    setActiveDropdown(null);
                  }}
                  aria-expanded={activeDropdown === item.id}
                  aria-haspopup={hasDropdown ? 'true' : undefined}
                  className={`relative flex items-center gap-0.5 px-1.5 xl:px-2 py-1.5 rounded-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-[#18392B] font-extrabold'
                      : 'text-[#18392B]/85 hover:text-[#18392B]'
                  }`}
                >
                  {/* Hover background pill */}
                  {isHovered && !isActive && (
                    <motion.span
                      layoutId="navHoverPill"
                      className="absolute inset-0 bg-[#588B76]/10 rounded-sm -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  <span className="whitespace-nowrap relative z-10">{item.label}</span>

                  {item.badge && (
                    <span className="relative z-10 text-[8px] xl:text-[8.5px] bg-amber-400 text-slate-950 font-extrabold px-1 xl:px-1.5 py-0.5 rounded-full uppercase tracking-normal whitespace-nowrap leading-none inline-block shadow-xs">
                      {item.badge}
                    </span>
                  )}

                  {hasDropdown && (
                    <ChevronDown
                      className={`w-3 h-3 text-[#588B76] transition-transform duration-200 shrink-0 ${
                        activeDropdown === item.id ? 'rotate-180 text-[#18392B]' : ''
                      }`}
                    />
                  )}

                  {/* Active Link Sliding Underline */}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavUnderline"
                      className="absolute bottom-0 left-1 right-1 h-[2.5px] bg-[#588B76] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>

                {/* Dropdown Menu with AnimatePresence */}
                <AnimatePresence>
                  {hasDropdown && activeDropdown === item.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className={`absolute ${
                        itemIdx > 5 ? 'right-0' : 'left-0'
                      } top-full mt-0.5 w-76 bg-white/98 backdrop-blur-xl border border-[#D0DED8] rounded-md shadow-2xl shadow-emerald-950/15 py-1.5 text-[#18392B] z-50 ring-1 ring-black/5 overflow-hidden`}
                    >
                      {/* Submenu Institutional Header */}
                      <div className="px-3.5 py-1.5 mb-1 border-b border-[#D0DED8]/70 text-[9.5px] text-[#588B76] font-mono tracking-widest uppercase font-bold flex items-center justify-between bg-[#18392B]/5">
                        <span>
                          {item.id === 'academics'
                            ? 'ACADEMIC DIRECTORY'
                            : item.id === 'admissions'
                            ? 'ADMISSION DIRECTORY'
                            : `${item.label} DIRECTORY`}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#588B76]" />
                      </div>

                      {/* Submenu Item Links */}
                      <div className="max-h-[70vh] overflow-y-auto py-0.5">
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
                              className="group w-full text-left px-3.5 py-2 hover:bg-[#588B76]/10 hover:text-[#18392B] transition-all flex items-center justify-between text-[11.5px] normal-case font-semibold border-l-2 border-transparent hover:border-[#588B76] cursor-pointer"
                            >
                              <span className="flex items-center gap-2 min-w-0 pr-2">
                                {Icon ? (
                                  <div className="w-5 h-5 rounded-sm bg-[#588B76]/10 text-[#588B76] group-hover:bg-[#588B76] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                    <Icon className="w-3 h-3" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#588B76]/40 group-hover:bg-[#588B76] transition-colors" />
                                  </div>
                                )}
                                <span className="truncate">{sub.label}</span>
                              </span>
                              <ArrowRight className="w-3 h-3 text-[#588B76]/40 group-hover:text-[#588B76] group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Primary Apply CTA Button */}
          <motion.button
            id="btn-header-apply-now"
            onClick={() => navigateTo('apply')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#588B76] to-[#426c5b] hover:from-[#4b7765] hover:to-[#375a4c] text-white px-3 py-1.5 rounded-sm shadow-sm hover:shadow-md hover:shadow-[#588B76]/30 transition-all duration-200 font-bold text-[11px] xl:text-xs uppercase tracking-wider cursor-pointer border border-[#588B76]/60 whitespace-nowrap shrink-0 ml-1 overflow-hidden"
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <GraduationCap className="w-3.5 h-3.5 text-white group-hover:rotate-12 transition-transform duration-200 shrink-0" />
            <span className="whitespace-nowrap relative z-10">APPLY NOW</span>
          </motion.button>
        </nav>

        {/* Mobile & Tablet Navigation Toggle & Apply Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 xl:hidden shrink-0">
          <motion.button
            id="btn-mobile-header-apply"
            onClick={() => navigateTo('apply')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="bg-[#588B76] hover:bg-[#46705F] text-white text-[10.5px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1.5 rounded-sm uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-xs whitespace-nowrap shrink-0"
          >
            <GraduationCap className="w-3.5 h-3.5 hidden xs:inline" />
            <span>Apply</span>
            <ArrowRight className="w-3 h-3 hidden sm:inline" />
          </motion.button>

          <motion.button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            whileTap={{ scale: 0.94 }}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            className="p-1.5 sm:p-2 rounded-sm bg-[#18392B] text-white hover:bg-[#10261D] transition cursor-pointer shrink-0 flex items-center justify-center relative overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* 3. MOBILE & TABLET NAVIGATION DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="xl:hidden bg-[#18392B] border-t border-[#588B76]/30 text-[#D0DED8] px-4 py-5 max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain space-y-4 shadow-2xl"
          >
            {/* Mobile Top Action CTAs */}
            <div className="flex flex-col gap-2 pb-4 border-b border-[#588B76]/30">
              <motion.button
                id="mobile-menu-btn-apply"
                onClick={() => {
                  navigateTo('apply');
                  setMobileMenuOpen(false);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#588B76] to-[#426c5b] hover:from-[#4b7765] hover:to-[#375a4c] text-white font-bold py-3 rounded-sm shadow-md uppercase text-xs tracking-wider transition cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>APPLY ONLINE FOR AY 2026–2027</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  id="mobile-menu-btn-portal"
                  onClick={() => {
                    navigateTo('portal');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1 bg-[#10261D] text-[#D0DED8] font-semibold py-2 rounded-sm border border-[#588B76]/40 text-[11px] hover:text-white hover:bg-[#18392B] transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#85AA9B]" />
                  <span>Portal</span>
                </button>

                <button
                  id="mobile-menu-btn-give"
                  onClick={() => {
                    navigateTo('donation');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1 bg-amber-500/15 text-amber-300 font-bold py-2 rounded-sm border border-amber-500/50 text-[11px] hover:bg-amber-500/25 transition cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-amber-300/40 text-amber-300" />
                  <span>Donate</span>
                </button>

                <button
                  id="mobile-menu-btn-search"
                  onClick={() => {
                    setSearchModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1 bg-[#10261D] text-[#D0DED8] font-semibold py-2 rounded-sm border border-[#588B76]/40 text-[11px] hover:text-white hover:bg-[#18392B] transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-[#85AA9B]" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Navigation Accordion Items */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  currentSection === item.id ||
                  (item.id === 'about' && currentSection === 'why-choose-pcm') ||
                  (item.id === 'student-life' && currentSection === 'scrapbook');
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
                        className={`text-left font-serif text-sm font-semibold tracking-wide flex-1 cursor-pointer flex items-center gap-2 ${
                          isActive ? 'text-white font-bold' : 'text-[#D0DED8]'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[8.5px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-normal leading-none">
                            {item.badge}
                          </span>
                        )}
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

                    <AnimatePresence>
                      {hasDropdown && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pl-3 space-y-1 py-1.5 bg-[#10261D]/80 rounded-sm border-l-2 border-[#588B76] overflow-hidden"
                        >
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
                                className="w-full text-left py-1.5 text-xs text-[#D0DED8] hover:text-white flex items-center justify-between cursor-pointer group"
                              >
                                <span className="flex items-center gap-2">
                                  {Icon ? <Icon className="w-3 h-3 text-[#85AA9B] group-hover:text-white transition-colors" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#85AA9B]" />}
                                  <span>{sub.label}</span>
                                </span>
                                <ArrowRight className="w-3 h-3 text-[#588B76] group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                  <span>Tuition & Fee Calculator</span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

