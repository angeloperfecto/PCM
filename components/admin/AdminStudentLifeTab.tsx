'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  StudentLifeConfig,
  SpiritualPillar,
  StudentOrganization,
  DailyScheduleItem,
  MinistryOpportunityItem,
  StudentLeaderOfficer,
  CampusGuidelineItem,
  StudentLifePhoto,
} from '@/lib/types';
import { INITIAL_STUDENT_LIFE_CONFIG } from '@/lib/initialData';
import {
  Flame,
  Users,
  Home,
  Clock,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  BookOpen,
  Music,
  Compass,
  Heart,
  Award,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  MapPin,
  Camera,
  HelpCircle,
  Calendar,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'Flame', label: 'Flame / Holy Spirit', icon: Flame },
  { name: 'Users', label: 'Users / Fellowship', icon: Users },
  { name: 'BookOpen', label: 'Book / Scripture', icon: BookOpen },
  { name: 'Music', label: 'Music / Worship', icon: Music },
  { name: 'Compass', label: 'Compass / Ministry', icon: Compass },
  { name: 'Heart', label: 'Heart / Pastoral Care', icon: Heart },
  { name: 'Award', label: 'Award / Excellence', icon: Award },
  { name: 'GraduationCap', label: 'Cap / Academics', icon: GraduationCap },
  { name: 'ShieldCheck', label: 'Shield / Leadership', icon: ShieldCheck },
  { name: 'Sparkles', label: 'Sparkles / Inspiration', icon: Sparkles },
  { name: 'Home', label: 'Home / Residence', icon: Home },
  { name: 'Clock', label: 'Clock / Schedule', icon: Clock },
];

export const AdminStudentLifeTab: React.FC = () => {
  const { siteConfig, updateStudentLifeConfig, addToast, navigateTo, canPerformAction } = usePCM();

  // Local draft state initialized with existing config or fallback
  const [config, setConfig] = useState<StudentLifeConfig>(() => {
    return siteConfig?.studentLife || INITIAL_STUDENT_LIFE_CONFIG;
  });

  type SubTabType =
    | 'banner'
    | 'pillars'
    | 'orgs'
    | 'schedule'
    | 'dormitory'
    | 'ministry'
    | 'leaders'
    | 'guidelines'
    | 'gallery';

  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('banner');
  const [isSaving, setIsSaving] = useState(false);

  // Editing modals/states for Pillars
  const [editingPillar, setEditingPillar] = useState<SpiritualPillar | null>(null);
  const [isAddingPillar, setIsAddingPillar] = useState(false);

  // Editing states for Organizations
  const [editingOrg, setEditingOrg] = useState<StudentOrganization | null>(null);
  const [isAddingOrg, setIsAddingOrg] = useState(false);

  // Editing states for Daily Schedule
  const [editingSchedule, setEditingSchedule] = useState<DailyScheduleItem | null>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  // Editing states for Ministry Opportunities
  const [editingMinistry, setEditingMinistry] = useState<MinistryOpportunityItem | null>(null);
  const [isAddingMinistry, setIsAddingMinistry] = useState(false);

  // Editing states for Student Leaders
  const [editingLeader, setEditingLeader] = useState<StudentLeaderOfficer | null>(null);
  const [isAddingLeader, setIsAddingLeader] = useState(false);

  // Editing states for Campus Guidelines
  const [editingGuideline, setEditingGuideline] = useState<CampusGuidelineItem | null>(null);
  const [isAddingGuideline, setIsAddingGuideline] = useState(false);

  // Editing states for Photo Gallery
  const [editingPhoto, setEditingPhoto] = useState<StudentLifePhoto | null>(null);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

  // Amenity input
  const [newAmenity, setNewAmenity] = useState('');

  const handleSave = async () => {
    if (!canPerformAction('Content Admin')) {
      addToast('error', 'Permission Denied', 'You need Content Admin privileges to update Student Life settings.');
      return;
    }

    setIsSaving(true);
    try {
      await updateStudentLifeConfig(config);
      addToast('success', 'Student Life Updated', 'Changes to Student Life have been saved and synchronized with Firestore.');
    } catch (err) {
      console.error('Failed to update Student Life:', err);
      addToast('error', 'Save Failed', 'Could not save Student Life changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all Student Life content to default PCM settings? Any unsaved edits will be lost.')) {
      setConfig(INITIAL_STUDENT_LIFE_CONFIG);
      addToast('info', 'Reset to Defaults', 'Draft reset to institutional defaults. Click "Save Changes" to publish.');
    }
  };

  // Pillar CRUD
  const savePillar = (pillar: SpiritualPillar) => {
    const pillars = config.pillars || [];
    const index = pillars.findIndex((p) => p.id === pillar.id);
    if (index >= 0) {
      const updated = [...pillars];
      updated[index] = pillar;
      setConfig({ ...config, pillars: updated });
    } else {
      setConfig({ ...config, pillars: [...pillars, pillar] });
    }
    setEditingPillar(null);
    setIsAddingPillar(false);
  };

  const deletePillar = (id: string) => {
    const pillars = (config.pillars || []).filter((p) => p.id !== id);
    setConfig({ ...config, pillars });
  };

  // Organization CRUD
  const saveOrg = (org: StudentOrganization) => {
    const orgs = config.organizations || [];
    const index = orgs.findIndex((o) => o.id === org.id);
    if (index >= 0) {
      const updated = [...orgs];
      updated[index] = org;
      setConfig({ ...config, organizations: updated });
    } else {
      setConfig({ ...config, organizations: [...orgs, org] });
    }
    setEditingOrg(null);
    setIsAddingOrg(false);
  };

  const deleteOrg = (id: string) => {
    const orgs = (config.organizations || []).filter((o) => o.id !== id);
    setConfig({ ...config, organizations: orgs });
  };

  // Schedule CRUD
  const saveSchedule = (item: DailyScheduleItem) => {
    const schedule = config.dailySchedule || [];
    const index = schedule.findIndex((s) => s.id === item.id);
    if (index >= 0) {
      const updated = [...schedule];
      updated[index] = item;
      setConfig({ ...config, dailySchedule: updated });
    } else {
      setConfig({ ...config, dailySchedule: [...schedule, item] });
    }
    setEditingSchedule(null);
    setIsAddingSchedule(false);
  };

  const deleteSchedule = (id: string) => {
    const dailySchedule = (config.dailySchedule || []).filter((s) => s.id !== id);
    setConfig({ ...config, dailySchedule });
  };

  // Ministry Opportunities CRUD
  const saveMinistry = (item: MinistryOpportunityItem) => {
    const list = config.ministryOpportunities || [];
    const index = list.findIndex((m) => m.id === item.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = item;
      setConfig({ ...config, ministryOpportunities: updated });
    } else {
      setConfig({ ...config, ministryOpportunities: [...list, item] });
    }
    setEditingMinistry(null);
    setIsAddingMinistry(false);
  };

  const deleteMinistry = (id: string) => {
    const list = (config.ministryOpportunities || []).filter((m) => m.id !== id);
    setConfig({ ...config, ministryOpportunities: list });
  };

  // Student Leader CRUD
  const saveLeader = (leader: StudentLeaderOfficer) => {
    const list = config.studentLeaders || [];
    const index = list.findIndex((l) => l.id === leader.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = leader;
      setConfig({ ...config, studentLeaders: updated });
    } else {
      setConfig({ ...config, studentLeaders: [...list, leader] });
    }
    setEditingLeader(null);
    setIsAddingLeader(false);
  };

  const deleteLeader = (id: string) => {
    const list = (config.studentLeaders || []).filter((l) => l.id !== id);
    setConfig({ ...config, studentLeaders: list });
  };

  // Campus Guideline CRUD
  const saveGuideline = (item: CampusGuidelineItem) => {
    const list = config.campusGuidelines || [];
    const index = list.findIndex((g) => g.id === item.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = item;
      setConfig({ ...config, campusGuidelines: updated });
    } else {
      setConfig({ ...config, campusGuidelines: [...list, item] });
    }
    setEditingGuideline(null);
    setIsAddingGuideline(false);
  };

  const deleteGuideline = (id: string) => {
    const list = (config.campusGuidelines || []).filter((g) => g.id !== id);
    setConfig({ ...config, campusGuidelines: list });
  };

  // Photo Gallery CRUD
  const savePhoto = (photo: StudentLifePhoto) => {
    const list = config.galleryPhotos || [];
    const index = list.findIndex((p) => p.id === photo.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = photo;
      setConfig({ ...config, galleryPhotos: updated });
    } else {
      setConfig({ ...config, galleryPhotos: [...list, photo] });
    }
    setEditingPhoto(null);
    setIsAddingPhoto(false);
  };

  const deletePhoto = (id: string) => {
    const list = (config.galleryPhotos || []).filter((p) => p.id !== id);
    setConfig({ ...config, galleryPhotos: list });
  };

  // Dormitory Amenity Helpers
  const addAmenity = () => {
    if (!newAmenity.trim()) return;
    const amenities = config.dormitoryAmenities || [];
    if (!amenities.includes(newAmenity.trim())) {
      setConfig({ ...config, dormitoryAmenities: [...amenities, newAmenity.trim()] });
    }
    setNewAmenity('');
  };

  const removeAmenity = (indexToRemove: number) => {
    const amenities = (config.dormitoryAmenities || []).filter((_, i) => i !== indexToRemove);
    setConfig({ ...config, dormitoryAmenities: amenities });
  };

  const subTabs = [
    { id: 'banner', label: 'Banner & Hero', icon: Flame, count: undefined },
    { id: 'pillars', label: 'Spiritual Pillars', icon: BookOpen, count: config.pillars?.length },
    { id: 'orgs', label: 'Student Orgs', icon: Users, count: config.organizations?.length },
    { id: 'schedule', label: 'Daily Routine', icon: Clock, count: config.dailySchedule?.length },
    { id: 'dormitory', label: 'Dorm & Residence', icon: Home, count: config.dormitoryAmenities?.length },
    { id: 'ministry', label: 'Ministry & Outreach', icon: Compass, count: config.ministryOpportunities?.length },
    { id: 'leaders', label: 'Student Council', icon: ShieldCheck, count: config.studentLeaders?.length },
    { id: 'guidelines', label: 'Rules & FAQs', icon: HelpCircle, count: config.campusGuidelines?.length },
    { id: 'gallery', label: 'Campus Moments', icon: Camera, count: config.galleryPhotos?.length },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#588B76]" />
            <span>Student Life Content Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Customize spiritual formation pillars, student organizations, daily routines, dormitory living, leadership council, and campus photo gallery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateTo('student-life')}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#588B76]" />
            <span>Preview Public View</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-1.5 text-xs font-bold rounded-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-sm px-2 gap-1 overflow-x-auto">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTabType)}
              className={`px-3 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#588B76] text-[#18392B] bg-[#588B76]/5'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#588B76]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    isActive ? 'bg-[#588B76] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Banner & Hero */}
      {activeSubTab === 'banner' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <h3 className="font-serif font-bold text-base text-[#18392B] border-b border-slate-100 pb-2">
            Hero Banner & Call-to-Action
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Banner Badge</label>
              <input
                type="text"
                value={config.bannerBadge || ''}
                onChange={(e) => setConfig({ ...config, bannerBadge: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                placeholder="e.g., Community & Spiritual Formation"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Banner Title</label>
              <input
                type="text"
                value={config.bannerTitle || ''}
                onChange={(e) => setConfig({ ...config, bannerTitle: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden font-serif"
                placeholder="e.g., LIFE AT PHILIPPINE COLLEGE OF MINISTRY"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Banner Subtitle / Narrative</label>
              <textarea
                rows={3}
                value={config.bannerSubtitle || ''}
                onChange={(e) => setConfig({ ...config, bannerSubtitle: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden leading-relaxed"
                placeholder="Brief narrative introducing campus life, community discipleship, and spiritual fellowship."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Primary Button Label</label>
              <input
                type="text"
                value={config.applyButtonText || ''}
                onChange={(e) => setConfig({ ...config, applyButtonText: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                placeholder="e.g., Apply to Join PCM"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Secondary Button Label</label>
              <input
                type="text"
                value={config.sermonsButtonText || ''}
                onChange={(e) => setConfig({ ...config, sermonsButtonText: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                placeholder="e.g., Chapel Audio Archive"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Spiritual Pillars */}
      {activeSubTab === 'pillars' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                Spiritual Formation & Chapel Pillars
              </h3>
              <p className="text-xs text-slate-500">
                Foundational rhythms of worship, personal discipleship, and communal prayer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPillar({
                  id: `pillar-${Date.now()}`,
                  title: '',
                  description: '',
                  iconName: 'Flame',
                  actionText: '',
                  actionUrl: '',
                });
                setIsAddingPillar(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Spiritual Pillar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Badge</label>
              <input
                type="text"
                value={config.pillarsBadge || ''}
                onChange={(e) => setConfig({ ...config, pillarsBadge: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Spiritual Life"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Title</label>
              <input
                type="text"
                value={config.pillarsTitle || ''}
                onChange={(e) => setConfig({ ...config, pillarsTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm font-serif"
                placeholder="e.g. SPIRITUAL FORMATION & CHAPEL SERVICES"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Subtitle</label>
              <input
                type="text"
                value={config.pillarsSubtitle || ''}
                onChange={(e) => setConfig({ ...config, pillarsSubtitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="Descriptive subtitle..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {(config.pillars || []).map((pillar) => (
              <div
                key={pillar.id}
                className="border border-slate-200 rounded-sm p-4 space-y-3 bg-slate-50/50 hover:border-[#588B76] transition relative group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-[#18392B] text-white rounded-sm">
                    Icon: {pillar.iconName || 'Flame'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPillar(pillar);
                        setIsAddingPillar(false);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded-sm transition cursor-pointer"
                      title="Edit Pillar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePillar(pillar.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded-sm transition cursor-pointer"
                      title="Delete Pillar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif font-bold text-sm text-[#18392B]">{pillar.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {pillar.description}
                </p>

                {pillar.actionText && (
                  <p className="text-[11px] font-semibold text-[#588B76]">
                    Action: {pillar.actionText}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Pillar Modal */}
          {(editingPillar || isAddingPillar) && editingPillar && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingPillar ? 'Add Spiritual Pillar' : 'Edit Spiritual Pillar'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pillar Title</label>
                    <input
                      type="text"
                      value={editingPillar.title}
                      onChange={(e) => setEditingPillar({ ...editingPillar, title: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm font-serif"
                      placeholder="e.g. Corporate Chapel Services"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingPillar.description}
                      onChange={(e) =>
                        setEditingPillar({ ...editingPillar, description: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="Explain the frequency, purpose, and spiritual impact..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Icon</label>
                    <select
                      value={editingPillar.iconName || 'Flame'}
                      onChange={(e) =>
                        setEditingPillar({ ...editingPillar, iconName: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                    >
                      {AVAILABLE_ICONS.map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Action Button Text (Optional)</label>
                      <input
                        type="text"
                        value={editingPillar.actionText || ''}
                        onChange={(e) =>
                          setEditingPillar({ ...editingPillar, actionText: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Listen to Sermons →"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Action Destination (Optional)</label>
                      <input
                        type="text"
                        value={editingPillar.actionUrl || ''}
                        onChange={(e) =>
                          setEditingPillar({ ...editingPillar, actionUrl: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. sermons, apply, ministry"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPillar(null);
                      setIsAddingPillar(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => savePillar(editingPillar)}
                    className="px-4 py-1.5 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer"
                  >
                    Save Pillar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Student Organizations */}
      {activeSubTab === 'orgs' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                Student Organizations & Guilds
              </h3>
              <p className="text-xs text-slate-500">
                Manage student-led societies, ministry choirs, missionary fellowships, and academic guilds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingOrg({
                  id: `org-${Date.now()}`,
                  name: '',
                  role: '',
                  description: '',
                  iconName: 'Users',
                  meetingSchedule: '',
                  advisor: '',
                });
                setIsAddingOrg(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Organization</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Badge</label>
              <input
                type="text"
                value={config.orgsBadge || ''}
                onChange={(e) => setConfig({ ...config, orgsBadge: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Student-Led Initiatives"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Title</label>
              <input
                type="text"
                value={config.orgsTitle || ''}
                onChange={(e) => setConfig({ ...config, orgsTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm font-serif"
                placeholder="e.g. STUDENT ORGANIZATIONS & GUILDS"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {(config.organizations || []).map((org) => (
              <div
                key={org.id}
                className="border border-slate-200 rounded-sm p-4 space-y-2 bg-slate-50/50 hover:border-[#588B76] transition relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">{org.name}</h4>
                    <span className="text-xs text-[#588B76] font-semibold">{org.role}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOrg(org);
                        setIsAddingOrg(false);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded-sm transition cursor-pointer"
                      title="Edit Organization"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOrg(org.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded-sm transition cursor-pointer"
                      title="Delete Organization"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {org.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {org.description}
                  </p>
                )}

                {(org.meetingSchedule || org.advisor) && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                    {org.meetingSchedule && <div>Schedule: {org.meetingSchedule}</div>}
                    {org.advisor && <div>Advisor: {org.advisor}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Org Modal */}
          {(editingOrg || isAddingOrg) && editingOrg && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingOrg ? 'Add Student Organization' : 'Edit Student Organization'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={editingOrg.name}
                      onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm font-serif"
                      placeholder="e.g. PCM Student Council"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Function Tagline</label>
                    <input
                      type="text"
                      value={editingOrg.role}
                      onChange={(e) => setEditingOrg({ ...editingOrg, role: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="e.g. Elected Student Governance"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingOrg.description || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, description: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="Mission, activities, and campus fellowship responsibilities..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Meeting Schedule</label>
                      <input
                        type="text"
                        value={editingOrg.meetingSchedule || ''}
                        onChange={(e) =>
                          setEditingOrg({ ...editingOrg, meetingSchedule: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Tuesdays 5:00 PM"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Faculty Advisor</label>
                      <input
                        type="text"
                        value={editingOrg.advisor || ''}
                        onChange={(e) => setEditingOrg({ ...editingOrg, advisor: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Dean of Student Affairs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Icon Style</label>
                    <select
                      value={editingOrg.iconName || 'Users'}
                      onChange={(e) => setEditingOrg({ ...editingOrg, iconName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                    >
                      {AVAILABLE_ICONS.map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOrg(null);
                      setIsAddingOrg(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveOrg(editingOrg)}
                    className="px-4 py-1.5 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer"
                  >
                    Save Organization
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Daily Routine */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                Daily Schedule & Campus Routine
              </h3>
              <p className="text-xs text-slate-500">
                Hourly rhythm of early morning devotions, chapel, theological study, shared meals, and evening study hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSchedule({
                  id: `sched-${Date.now()}`,
                  time: '',
                  activity: '',
                  description: '',
                });
                setIsAddingSchedule(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Schedule Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(config.dailySchedule || []).map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 rounded-sm p-4 space-y-2 bg-slate-50/50 hover:border-[#588B76] transition relative"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#588B76] bg-white px-2 py-0.5 rounded-sm border border-slate-200">
                    {item.time}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSchedule(item);
                        setIsAddingSchedule(false);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded-sm transition cursor-pointer"
                      title="Edit Schedule Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSchedule(item.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded-sm transition cursor-pointer"
                      title="Delete Schedule Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif font-bold text-sm text-[#18392B]">{item.activity}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Schedule Modal */}
          {(editingSchedule || isAddingSchedule) && editingSchedule && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingSchedule ? 'Add Schedule Timeline' : 'Edit Schedule Timeline'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Time Range</label>
                    <input
                      type="text"
                      value={editingSchedule.time}
                      onChange={(e) =>
                        setEditingSchedule({ ...editingSchedule, time: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm font-mono"
                      placeholder="e.g. 7:30 AM – 8:00 AM"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Activity Title</label>
                    <input
                      type="text"
                      value={editingSchedule.activity}
                      onChange={(e) =>
                        setEditingSchedule({ ...editingSchedule, activity: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="e.g. Corporate Chapel Service"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingSchedule.description}
                      onChange={(e) =>
                        setEditingSchedule({ ...editingSchedule, description: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="Details of the routine..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSchedule(null);
                      setIsAddingSchedule(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSchedule(editingSchedule)}
                    className="px-4 py-1.5 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer"
                  >
                    Save Item
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Residence & Dormitory */}
      {activeSubTab === 'dormitory' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <h3 className="font-serif font-bold text-base text-[#18392B] border-b border-slate-100 pb-2">
            Lamtang Mountain Dormitory Living
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Headline</label>
              <input
                type="text"
                value={config.dormitoryHeadline || ''}
                onChange={(e) => setConfig({ ...config, dormitoryHeadline: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden font-serif"
                placeholder="e.g. LAMTANG MOUNTAIN DORMITORY LIVING"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <textarea
                rows={4}
                value={config.dormitoryDescription || ''}
                onChange={(e) => setConfig({ ...config, dormitoryDescription: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden leading-relaxed"
                placeholder="Overview of the dormitory atmosphere, pine air, communal kitchen, and quiet hours."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Dormitory Guidelines & Covenant</label>
              <textarea
                rows={3}
                value={config.dormitoryGuidelines || ''}
                onChange={(e) => setConfig({ ...config, dormitoryGuidelines: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden leading-relaxed"
                placeholder="Curfew rules, room inspection schedules, and Christian conduct covenant in the residence halls."
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">
                Dormitory Amenities & Living Features
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                  className="flex-1 text-xs p-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                  placeholder="e.g., Mountain-view study lounge"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Feature</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(config.dormitoryAmenities || []).map((amenity, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-sm text-xs font-medium"
                  >
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => removeAmenity(idx)}
                      className="text-slate-400 hover:text-red-600 transition cursor-pointer font-bold"
                      title="Remove feature"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Ministry & Outreach */}
      {activeSubTab === 'ministry' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                Weekly Ministry & Practical Engagement
              </h3>
              <p className="text-xs text-slate-500">
                Configure student weekend practicum, pulpit supply appointments, hospital chaplaincy, and highland mission treks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingMinistry({
                  id: `min-${Date.now()}`,
                  title: '',
                  role: '',
                  location: '',
                  description: '',
                  iconName: 'BookOpen',
                  schedule: '',
                  tags: [],
                });
                setIsAddingMinistry(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ministry Field</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Badge</label>
              <input
                type="text"
                value={config.ministryBadge || ''}
                onChange={(e) => setConfig({ ...config, ministryBadge: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Practical Engagement"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Title</label>
              <input
                type="text"
                value={config.ministryTitle || ''}
                onChange={(e) => setConfig({ ...config, ministryTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm font-serif"
                placeholder="e.g. WEEKLY MINISTRY OPPORTUNITIES"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Description</label>
              <textarea
                rows={3}
                value={config.ministryDescription || ''}
                onChange={(e) => setConfig({ ...config, ministryDescription: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm leading-relaxed"
                placeholder="Explain the 85+ partner church assignments and student practicum requirements..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Primary Button Label</label>
              <input
                type="text"
                value={config.ministryPrimaryButtonText || ''}
                onChange={(e) => setConfig({ ...config, ministryPrimaryButtonText: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Learn About Pastoral Practicum →"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Secondary Button Label</label>
              <input
                type="text"
                value={config.ministrySecondaryButtonText || ''}
                onChange={(e) => setConfig({ ...config, ministrySecondaryButtonText: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Schedule Campus Visit"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {(config.ministryOpportunities || []).map((m) => (
              <div
                key={m.id}
                className="border border-slate-200 rounded-sm p-4 space-y-2 bg-slate-50/50 hover:border-[#588B76] transition relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">{m.title}</h4>
                    <span className="text-xs text-[#588B76] font-semibold">{m.role}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMinistry(m);
                        setIsAddingMinistry(false);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded-sm transition cursor-pointer"
                      title="Edit Ministry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMinistry(m.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded-sm transition cursor-pointer"
                      title="Delete Ministry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                  {m.location && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-3 h-3 text-[#588B76] shrink-0" />
                      <span>{m.location}</span>
                    </div>
                  )}
                  {m.schedule && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3 h-3 text-[#588B76] shrink-0" />
                      <span>{m.schedule}</span>
                    </div>
                  )}
                  {m.tags && m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-slate-200 px-1.5 py-0.2 rounded-xs text-[10px] text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Ministry Modal */}
          {(editingMinistry || isAddingMinistry) && editingMinistry && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingMinistry ? 'Add Ministry Opportunity' : 'Edit Ministry Opportunity'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editingMinistry.title}
                      onChange={(e) => setEditingMinistry({ ...editingMinistry, title: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm font-serif"
                      placeholder="e.g. Pulpit Supply & Expository Preaching"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Student Role</label>
                      <input
                        type="text"
                        value={editingMinistry.role}
                        onChange={(e) => setEditingMinistry({ ...editingMinistry, role: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Student Evangelist"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Schedule</label>
                      <input
                        type="text"
                        value={editingMinistry.schedule || ''}
                        onChange={(e) => setEditingMinistry({ ...editingMinistry, schedule: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Sundays (8:30 AM – 1:00 PM)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ministry Location / Field</label>
                    <input
                      type="text"
                      value={editingMinistry.location}
                      onChange={(e) => setEditingMinistry({ ...editingMinistry, location: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="e.g. Benguet & Mountain Province Partner Churches"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingMinistry.description}
                      onChange={(e) => setEditingMinistry({ ...editingMinistry, description: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="Specific responsibilities and learning objectives..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={(editingMinistry.tags || []).join(', ')}
                      onChange={(e) =>
                        setEditingMinistry({
                          ...editingMinistry,
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="e.g. Homiletics, Preaching, Pastoral"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMinistry(null);
                      setIsAddingMinistry(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveMinistry(editingMinistry)}
                    className="px-4 py-1.5 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer"
                  >
                    Save Ministry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Student Leadership Council */}
      {activeSubTab === 'leaders' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                Student Body Council & Leadership Officers
              </h3>
              <p className="text-xs text-slate-500">
                Manage the elected student leaders who coordinate campus devotions, student care, and campus events.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingLeader({
                  id: `lead-${Date.now()}`,
                  name: '',
                  position: '',
                  program: 'Bachelor of Theology (B.Th.)',
                  yearLevel: '3rd Year Junior',
                  bio: '',
                  photoUrl: '',
                  contactEmail: '',
                });
                setIsAddingLeader(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student Officer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Badge</label>
              <input
                type="text"
                value={config.leadersBadge || ''}
                onChange={(e) => setConfig({ ...config, leadersBadge: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Student Leadership"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Title</label>
              <input
                type="text"
                value={config.leadersTitle || ''}
                onChange={(e) => setConfig({ ...config, leadersTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm font-serif"
                placeholder="e.g. PCM STUDENT BODY COUNCIL"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Subtitle</label>
              <input
                type="text"
                value={config.leadersSubtitle || ''}
                onChange={(e) => setConfig({ ...config, leadersSubtitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="Description of the student council's mission..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            {(config.studentLeaders || []).map((leader) => (
              <div
                key={leader.id}
                className="border border-slate-200 rounded-sm p-4 space-y-3 bg-slate-50/50 hover:border-[#588B76] transition relative text-center"
              >
                <div className="flex justify-end gap-1 absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLeader(leader);
                      setIsAddingLeader(false);
                    }}
                    className="p-1 hover:bg-slate-200 text-slate-600 rounded-sm transition cursor-pointer"
                    title="Edit Leader"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLeader(leader.id)}
                    className="p-1 hover:bg-red-50 text-red-600 rounded-sm transition cursor-pointer"
                    title="Delete Leader"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto bg-slate-200 border-2 border-[#588B76]/40 relative">
                  {leader.photoUrl ? (
                    <Image
                      src={leader.photoUrl}
                      alt={leader.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#18392B] text-white font-bold text-lg">
                      {leader.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-serif font-bold text-sm text-[#18392B]">{leader.name}</h4>
                  <p className="text-xs font-semibold text-[#588B76]">{leader.position}</p>
                  <p className="text-[11px] text-slate-500">
                    {leader.program} • {leader.yearLevel}
                  </p>
                </div>

                {leader.bio && (
                  <p className="text-xs text-slate-600 leading-relaxed text-left line-clamp-3">
                    {leader.bio}
                  </p>
                )}
                {leader.contactEmail && (
                  <p className="text-[11px] text-slate-400 truncate">{leader.contactEmail}</p>
                )}
              </div>
            ))}
          </div>

          {/* Leader Modal */}
          {(editingLeader || isAddingLeader) && editingLeader && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingLeader ? 'Add Student Leader' : 'Edit Student Leader'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editingLeader.name}
                      onChange={(e) => setEditingLeader({ ...editingLeader, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm font-serif"
                      placeholder="e.g. Joshua Alvares"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Council Position</label>
                      <input
                        type="text"
                        value={editingLeader.position}
                        onChange={(e) =>
                          setEditingLeader({ ...editingLeader, position: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Student Council President"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Year Level</label>
                      <input
                        type="text"
                        value={editingLeader.yearLevel}
                        onChange={(e) =>
                          setEditingLeader({ ...editingLeader, yearLevel: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. 4th Year Senior"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Academic Degree</label>
                      <input
                        type="text"
                        value={editingLeader.program}
                        onChange={(e) =>
                          setEditingLeader({ ...editingLeader, program: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Bachelor of Theology (B.Th.)"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Council Email</label>
                      <input
                        type="email"
                        value={editingLeader.contactEmail || ''}
                        onChange={(e) =>
                          setEditingLeader({ ...editingLeader, contactEmail: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. council.president@pcm.ph"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Photo URL</label>
                    <input
                      type="url"
                      value={editingLeader.photoUrl || ''}
                      onChange={(e) =>
                        setEditingLeader({ ...editingLeader, photoUrl: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Short Ministry Bio</label>
                    <textarea
                      rows={3}
                      value={editingLeader.bio || ''}
                      onChange={(e) => setEditingLeader({ ...editingLeader, bio: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="Ministry calling, passion, and leadership background..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLeader(null);
                      setIsAddingLeader(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveLeader(editingLeader)}
                    className="px-4 py-1.5 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer"
                  >
                    Save Leader
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Campus Guidelines & FAQs */}
      {activeSubTab === 'guidelines' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                Campus Life Guidelines & FAQs
              </h3>
              <p className="text-xs text-slate-500">
                Institutional policies on spiritual devotions, chapel dress codes, quiet hours, library access, and dormitory rules.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingGuideline({
                  id: `guide-${Date.now()}`,
                  category: 'Spiritual',
                  title: '',
                  details: '',
                  iconName: 'Flame',
                });
                setIsAddingGuideline(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Guideline / Policy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Badge</label>
              <input
                type="text"
                value={config.guidelinesBadge || ''}
                onChange={(e) => setConfig({ ...config, guidelinesBadge: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Campus Governance"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Section Title</label>
              <input
                type="text"
                value={config.guidelinesTitle || ''}
                onChange={(e) => setConfig({ ...config, guidelinesTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm font-serif"
                placeholder="e.g. CAMPUS GUIDELINES & STUDENT LIFE FAQS"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {(config.campusGuidelines || []).map((guide) => (
              <div
                key={guide.id}
                className="border border-slate-200 rounded-sm p-4 space-y-2 bg-slate-50/50 hover:border-[#588B76] transition relative"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-xs bg-[#18392B]/10 text-[#18392B] font-bold">
                      {guide.category}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">{guide.title}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGuideline(guide);
                        setIsAddingGuideline(false);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded-sm transition cursor-pointer"
                      title="Edit Guideline"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGuideline(guide.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded-sm transition cursor-pointer"
                      title="Delete Guideline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{guide.details}</p>
              </div>
            ))}
          </div>

          {/* Guideline Modal */}
          {(editingGuideline || isAddingGuideline) && editingGuideline && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingGuideline ? 'Add Campus Guideline' : 'Edit Campus Guideline'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={editingGuideline.category}
                      onChange={(e) =>
                        setEditingGuideline({
                          ...editingGuideline,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                    >
                      <option value="Spiritual">Spiritual Formations & Chapel</option>
                      <option value="Academic">Academic Standards & Colloquiums</option>
                      <option value="Dormitory">Dormitory & Residence Hall</option>
                      <option value="General">General Campus Life & Dining</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Guideline Title</label>
                    <input
                      type="text"
                      value={editingGuideline.title}
                      onChange={(e) =>
                        setEditingGuideline({ ...editingGuideline, title: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm font-serif"
                      placeholder="e.g. Chapel & Prayer Band Attendance"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Policy Details & FAQ Answer</label>
                    <textarea
                      rows={4}
                      value={editingGuideline.details}
                      onChange={(e) =>
                        setEditingGuideline({ ...editingGuideline, details: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm leading-relaxed"
                      placeholder="Comprehensive explanation of the policy, expectation, or answer..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGuideline(null);
                      setIsAddingGuideline(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveGuideline(editingGuideline)}
                    className="px-4 py-1.5 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer"
                  >
                    Save Guideline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 9: Campus Life Photo Gallery */}
      {activeSubTab === 'gallery' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                Student Life Photo Gallery
              </h3>
              <p className="text-xs text-slate-500">
                Curate vibrant photos of chapel praise, fellowship dinners, dormitory activities, highland outreach, and campus recreation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPhoto({
                  id: `photo-${Date.now()}`,
                  title: '',
                  category: 'Fellowship',
                  imageUrl: '',
                  caption: '',
                  date: new Date().getFullYear().toString(),
                });
                setIsAddingPhoto(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Gallery Badge</label>
              <input
                type="text"
                value={config.galleryBadge || ''}
                onChange={(e) => setConfig({ ...config, galleryBadge: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="e.g. Campus Moments"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Gallery Title</label>
              <input
                type="text"
                value={config.galleryTitle || ''}
                onChange={(e) => setConfig({ ...config, galleryTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm font-serif"
                placeholder="e.g. STUDENT LIFE IN PICTURES"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Gallery Subtitle</label>
              <input
                type="text"
                value={config.gallerySubtitle || ''}
                onChange={(e) => setConfig({ ...config, gallerySubtitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm"
                placeholder="Description of campus snapshots..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {(config.galleryPhotos || []).map((photo) => (
              <div
                key={photo.id}
                className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-2xs hover:border-[#588B76] transition group"
              >
                <div className="h-44 w-full relative bg-slate-100">
                  {photo.imageUrl ? (
                    <Image
                      src={
                        photo.imageUrl.includes('photo-1517649763962-0c623266ddc0')
                          ? 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop'
                          : photo.imageUrl
                      }
                      alt={photo.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-xs bg-slate-900/80 text-white backdrop-blur-xs">
                    {photo.category}
                  </span>
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPhoto(photo);
                        setIsAddingPhoto(false);
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-xs shadow-xs transition cursor-pointer"
                      title="Edit Photo"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePhoto(photo.id)}
                      className="p-1.5 bg-white/90 hover:bg-red-50 text-red-600 rounded-xs shadow-xs transition cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <h4 className="font-serif font-bold text-xs text-[#18392B] truncate">
                    {photo.title}
                  </h4>
                  {photo.caption && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Photo Modal */}
          {(editingPhoto || isAddingPhoto) && editingPhoto && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingPhoto ? 'Add Campus Photo' : 'Edit Campus Photo'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Photo Title</label>
                    <input
                      type="text"
                      value={editingPhoto.title}
                      onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm font-serif"
                      placeholder="e.g. Chapel Worship Convocation"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Category</label>
                      <select
                        value={editingPhoto.category}
                        onChange={(e) =>
                          setEditingPhoto({
                            ...editingPhoto,
                            category: e.target.value as any,
                          })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                      >
                        <option value="Chapel">Chapel & Worship</option>
                        <option value="Fellowship">Fellowship & Community</option>
                        <option value="Dormitory">Dormitory Living</option>
                        <option value="Ministry">Ministry & Practicum</option>
                        <option value="Sports">Sports & Recreation</option>
                        <option value="Campus">Campus & Mountain Scenery</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Year / Date</label>
                      <input
                        type="text"
                        value={editingPhoto.date || ''}
                        onChange={(e) =>
                          setEditingPhoto({ ...editingPhoto, date: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm font-mono"
                        placeholder="e.g. 2026"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={editingPhoto.imageUrl}
                      onChange={(e) =>
                        setEditingPhoto({ ...editingPhoto, imageUrl: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Caption / Description</label>
                    <textarea
                      rows={3}
                      value={editingPhoto.caption || ''}
                      onChange={(e) =>
                        setEditingPhoto({ ...editingPhoto, caption: e.target.value })
                      }
                      className="w-full p-2 border border-slate-200 rounded-sm leading-relaxed"
                      placeholder="What is happening in this photo..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhoto(null);
                      setIsAddingPhoto(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => savePhoto(editingPhoto)}
                    className="px-4 py-1.5 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer"
                  >
                    Save Photo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
