'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { StudentLifeConfig, SpiritualPillar, StudentOrganization, DailyScheduleItem } from '@/lib/types';
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
  Check,
  ExternalLink,
  BookOpen,
  Music,
  Compass,
  Heart,
  Award,
  GraduationCap,
  ShieldCheck,
  Sparkles,
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

  const [activeSubTab, setActiveSubTab] = useState<'banner' | 'pillars' | 'orgs' | 'schedule' | 'dormitory'>('banner');
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
            Customize spiritual formation pillars, student organizations, campus daily routines, and residence details.
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
        {[
          { id: 'banner', label: 'Banner & Headlines', icon: Flame },
          { id: 'pillars', label: 'Spiritual Pillars', icon: BookOpen },
          { id: 'orgs', label: 'Student Organizations', icon: Users },
          { id: 'schedule', label: 'Daily Routine', icon: Clock },
          { id: 'dormitory', label: 'Residence & Dorms', icon: Home },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#588B76] text-[#18392B] bg-[#588B76]/5'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#588B76]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Banner & Headlines */}
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

          <h3 className="font-serif font-bold text-base text-[#18392B] border-t border-slate-100 pt-6">
            Weekly Ministry Section Text
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Ministry Badge</label>
              <input
                type="text"
                value={config.ministryBadge || ''}
                onChange={(e) => setConfig({ ...config, ministryBadge: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Ministry Section Title</label>
              <input
                type="text"
                value={config.ministryTitle || ''}
                onChange={(e) => setConfig({ ...config, ministryTitle: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden font-serif"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Ministry Narrative Description</label>
              <textarea
                rows={3}
                value={config.ministryDescription || ''}
                onChange={(e) => setConfig({ ...config, ministryDescription: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden leading-relaxed"
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
                Spiritual Formation Pillars
              </h3>
              <p className="text-xs text-slate-500">
                Core components of PCM spiritual discipline (Chapel, Morning Devotions, Prayer Days, etc.)
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
                  actionText: 'Listen to Sermons →',
                  actionUrl: 'sermons',
                });
                setIsAddingPillar(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Add Spiritual Pillar</span>
            </button>
          </div>

          {/* Pillars List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(config.pillars || []).map((pillar) => (
              <div
                key={pillar.id}
                className="border border-slate-200 rounded-sm p-4 bg-slate-50 hover:bg-white hover:border-[#588B76] transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-sm bg-[#18392B] text-[#588B76] flex items-center justify-center font-bold text-xs">
                      <Flame className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPillar(pillar);
                          setIsAddingPillar(false);
                        }}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-xs transition cursor-pointer"
                        title="Edit Pillar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePillar(pillar.id)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded-xs transition cursor-pointer"
                        title="Delete Pillar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#18392B]">{pillar.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                    {pillar.description}
                  </p>
                </div>

                {pillar.actionText && (
                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-[#588B76] font-bold">
                    {pillar.actionText}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pillar Edit/Create Form Modal */}
          {(editingPillar || isAddingPillar) && editingPillar && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
                <h4 className="font-serif font-bold text-base text-[#18392B]">
                  {isAddingPillar ? 'Add Spiritual Pillar' : 'Edit Spiritual Pillar'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editingPillar.title}
                      onChange={(e) => setEditingPillar({ ...editingPillar, title: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="e.g. Daily Morning Devotions"
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
                      placeholder="Explain the biblical purpose and student expectation..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Select Icon</label>
                      <select
                        value={editingPillar.iconName || 'Flame'}
                        onChange={(e) =>
                          setEditingPillar({ ...editingPillar, iconName: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm bg-white"
                      >
                        {AVAILABLE_ICONS.map((i) => (
                          <option key={i.name} value={i.name}>
                            {i.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Button Text (Optional)</label>
                      <input
                        type="text"
                        value={editingPillar.actionText || ''}
                        onChange={(e) =>
                          setEditingPillar({ ...editingPillar, actionText: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-sm"
                        placeholder="e.g. Chapel Audio Archive"
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
                Official student guilds (Student Council, Ministerial Choir, Prayer Band, Missions Society).
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
                  meetingSchedule: 'Wednesdays 4:30 PM',
                  advisor: 'Faculty Advisor',
                });
                setIsAddingOrg(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Add Organization</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(config.organizations || []).map((org) => (
              <div
                key={org.id}
                className="border border-slate-200 rounded-sm p-4 bg-slate-50 hover:bg-white hover:border-[#588B76] transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-sm bg-[#588B76]/15 text-[#18392B] flex items-center justify-center font-bold text-xs">
                      <Users className="w-4 h-4 text-[#588B76]" />
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOrg(org);
                          setIsAddingOrg(false);
                        }}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-xs transition cursor-pointer"
                        title="Edit Organization"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteOrg(org.id)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded-xs transition cursor-pointer"
                        title="Delete Organization"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">{org.name}</h4>
                    <p className="text-[11px] text-[#588B76] font-semibold">{org.role}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {org.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                  {org.meetingSchedule && <div>Schedule: {org.meetingSchedule}</div>}
                  {org.advisor && <div>Advisor: {org.advisor}</div>}
                </div>
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
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="e.g. PCM Student Council"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Tagline</label>
                    <input
                      type="text"
                      value={editingOrg.role}
                      onChange={(e) => setEditingOrg({ ...editingOrg, role: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                      placeholder="e.g. Student Leadership & Campus Voice"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingOrg.description}
                      onChange={(e) => setEditingOrg({ ...editingOrg, description: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Meeting Schedule</label>
                      <input
                        type="text"
                        value={editingOrg.meetingSchedule || ''}
                        onChange={(e) => setEditingOrg({ ...editingOrg, meetingSchedule: e.target.value })}
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
                        placeholder="e.g. Dean of Students"
                      />
                    </div>
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

      {/* Tab 4: Daily Schedule */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white border border-slate-200 rounded-b-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                A Typical Day at PCM (Campus Routine)
              </h3>
              <p className="text-xs text-slate-500">
                Timeline entries reflecting devotions, lectures, communal chores, and study hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSchedule({
                  id: `sched-${Date.now()}`,
                  time: '6:00 AM – 7:00 AM',
                  activity: 'Morning Routine',
                  description: 'Personal devotion and breakfast in the dining hall.',
                });
                setIsAddingSchedule(true);
              }}
              className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Add Schedule Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(config.dailySchedule || []).map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 rounded-sm p-4 bg-slate-50 space-y-2 hover:bg-white hover:border-[#588B76] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#588B76] bg-white px-2 py-0.5 rounded-sm border border-slate-200">
                    {item.time}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSchedule(item);
                        setIsAddingSchedule(false);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded-xs transition cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSchedule(item.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded-xs transition cursor-pointer"
                      title="Delete Item"
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
                      className="text-slate-400 hover:text-red-600 transition cursor-pointer"
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
    </div>
  );
};
