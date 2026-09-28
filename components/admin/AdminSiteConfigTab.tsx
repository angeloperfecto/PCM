'use client';

import React, { useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { SiteConfig } from '@/lib/types';
import {
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Clock,
  Award,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const AdminSiteConfigTab: React.FC = () => {
  const { siteConfig, updateSiteConfig, addToast, canPerformAction } = usePCM();
  const [formData, setFormData] = useState<SiteConfig>(siteConfig);
  const [prevSiteConfig, setPrevSiteConfig] = useState(siteConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    'identity' | 'contact' | 'social' | 'seo' | 'mission' | 'milestones' | 'distinctives'
  >('identity');

  if (siteConfig !== prevSiteConfig) {
    setPrevSiteConfig(siteConfig);
    if (!isDirty && siteConfig) {
      setFormData(siteConfig);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Required',
        message: 'You need Content Admin privileges to update Site Configuration.',
        type: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateSiteConfig(formData);
      setIsDirty(false);
      addToast({
        title: 'Configuration Saved',
        message: 'Global site identity, contact, milestones, distinctives, and SEO settings updated successfully and saved to cloud.',
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Save Failed',
        message: err?.message || 'Could not save configuration to cloud database.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Building className="w-5 h-5 text-[#588B76]" />
            Site Identity, Contact & Global Settings
          </h2>
          <p className="text-xs text-slate-500">
            Manage institutional branding, contact details, social media handles, and SEO metadata.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('identity')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSubTab === 'identity'
              ? 'bg-[#18392B] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Institutional Identity
        </button>
        <button
          onClick={() => setActiveSubTab('contact')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSubTab === 'contact'
              ? 'bg-[#18392B] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Campus Contact & Location
        </button>
        <button
          onClick={() => setActiveSubTab('mission')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSubTab === 'mission'
              ? 'bg-[#18392B] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Mission, Vision & Values
        </button>
        <button
          onClick={() => setActiveSubTab('social')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSubTab === 'social'
              ? 'bg-[#18392B] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Social Media Links
        </button>
        <button
          onClick={() => setActiveSubTab('seo')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSubTab === 'seo'
              ? 'bg-[#18392B] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Search Engine Optimization (SEO)
        </button>
        <button
          onClick={() => setActiveSubTab('milestones')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSubTab === 'milestones'
              ? 'bg-[#18392B] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Historical Milestones
        </button>
        <button
          onClick={() => setActiveSubTab('distinctives')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSubTab === 'distinctives'
              ? 'bg-[#18392B] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Why PCM Distinctives
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Sub-tab 1: Identity */}
        {activeSubTab === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Full Institution Name
              </label>
              <input
                type="text"
                value={formData.siteIdentity?.institutionName || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    siteIdentity: { ...formData.siteIdentity, institutionName: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Acronym
              </label>
              <input
                type="text"
                value={formData.siteIdentity?.acronym || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    siteIdentity: { ...formData.siteIdentity, acronym: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Tagline (Subheading)
              </label>
              <input
                type="text"
                value={formData.siteIdentity?.tagline || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    siteIdentity: { ...formData.siteIdentity, tagline: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Institutional Motto
              </label>
              <input
                type="text"
                value={formData.siteIdentity?.motto || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    siteIdentity: { ...formData.siteIdentity, motto: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Year Founded / Established
              </label>
              <input
                type="text"
                value={formData.siteIdentity?.establishedYear || '1992'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    siteIdentity: {
                      ...formData.siteIdentity,
                      establishedYear: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Heritage / Affiliation
              </label>
              <input
                type="text"
                value={formData.siteIdentity?.affiliation || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    siteIdentity: {
                      ...formData.siteIdentity,
                      affiliation: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Sub-tab 2: Contact */}
        {activeSubTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                Campus Physical Address Line 1
              </label>
              <input
                type="text"
                value={formData.contactInfo?.addressLine1 || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, addressLine1: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Address Line 2 (Province/Postal)
              </label>
              <input
                type="text"
                value={formData.contactInfo?.addressLine2 || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, addressLine2: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Mailing P.O. Box
              </label>
              <input
                type="text"
                value={formData.contactInfo?.poBox || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, poBox: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Primary Landline / Mobile
              </label>
              <input
                type="text"
                value={formData.contactInfo?.phonePrimary || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, phonePrimary: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Secondary Mobile / Hotline
              </label>
              <input
                type="text"
                value={formData.contactInfo?.phoneSecondary || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, phoneSecondary: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                General Inquiries Email
              </label>
              <input
                type="text"
                value={formData.contactInfo?.emailGeneral || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, emailGeneral: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Admissions Office Email
              </label>
              <input
                type="text"
                value={formData.contactInfo?.emailAdmissions || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: {
                      ...formData.contactInfo,
                      emailAdmissions: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                Campus Office Hours
              </label>
              <input
                type="text"
                value={formData.contactInfo?.officeHoursWeekday || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, officeHoursWeekday: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Sub-tab 3: Mission & Vision */}
        {activeSubTab === 'mission' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Mission Statement
              </label>
              <textarea
                rows={3}
                value={formData.missionVisionValues?.missionStatement || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    missionVisionValues: {
                      ...formData.missionVisionValues,
                      missionStatement: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Vision Statement
              </label>
              <textarea
                rows={3}
                value={formData.missionVisionValues?.visionStatement || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    missionVisionValues: {
                      ...formData.missionVisionValues,
                      visionStatement: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Sub-tab 4: Social */}
        {activeSubTab === 'social' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Facebook Page URL
              </label>
              <input
                type="text"
                value={formData.contactInfo?.facebookUrl || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, facebookUrl: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                YouTube Channel URL
              </label>
              <input
                type="text"
                value={formData.contactInfo?.youtubeUrl || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, youtubeUrl: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Instagram URL
              </label>
              <input
                type="text"
                value={formData.contactInfo?.instagramUrl || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, instagramUrl: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Sub-tab 5: SEO */}
        {activeSubTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Global Meta Title
              </label>
              <input
                type="text"
                value={formData.seoSettings?.metaTitle || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seoSettings: { ...formData.seoSettings, metaTitle: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Global Meta Description
              </label>
              <textarea
                rows={2}
                value={formData.seoSettings?.metaDescription || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seoSettings: { ...formData.seoSettings, metaDescription: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Search Engine Keywords (Comma separated)
              </label>
              <input
                type="text"
                value={formData.seoSettings?.keywords || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seoSettings: { ...formData.seoSettings, keywords: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Sub-tab 6: Historical Milestones */}
        {activeSubTab === 'milestones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#588B76]" />
                  Historical Timeline & Milestones
                </h4>
                <p className="text-[11px] text-slate-500">
                  Manage the chronology displayed in the &quot;About PCM&quot; page history timeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = formData.historyMilestones || [];
                  setFormData({
                    ...formData,
                    historyMilestones: [
                      ...current,
                      {
                        year: 'Year / Period',
                        title: 'Milestone Title',
                        desc: 'Description of historical achievement or transition.',
                      },
                    ],
                  });
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#18392B] hover:bg-[#23533e] text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            {(!formData.historyMilestones || formData.historyMilestones.length === 0) ? (
              <p className="text-slate-500 italic py-4 text-center">
                No custom milestones defined. The system will use default institutional milestones.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.historyMilestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:border-[#588B76]/50 transition space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="font-bold text-[#588B76] text-[11px] uppercase tracking-wider">
                        Milestone #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(formData.historyMilestones || [])];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, historyMilestones: updated });
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Remove Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Year / Date Range
                        </label>
                        <input
                          type="text"
                          value={m.year}
                          onChange={(e) => {
                            const updated = [...(formData.historyMilestones || [])];
                            updated[idx] = { ...updated[idx], year: e.target.value };
                            setFormData({ ...formData, historyMilestones: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                          placeholder="e.g., June 12, 1992"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1">
                          Milestone Title
                        </label>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...(formData.historyMilestones || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setFormData({ ...formData, historyMilestones: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                          placeholder="e.g., Founding of PCM in Baguio City"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Detailed Description
                      </label>
                      <textarea
                        rows={2}
                        value={m.desc}
                        onChange={(e) => {
                          const updated = [...(formData.historyMilestones || [])];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setFormData({ ...formData, historyMilestones: updated });
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 7: Why PCM Distinctives */}
        {activeSubTab === 'distinctives' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#588B76]" />
                  Why Choose PCM Distinctives (The PCM Advantage)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Manage the primary institutional strengths and reasons displayed on the &quot;Why Choose PCM&quot; view.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = formData.distinctives || [];
                  const newId = `reason-${Date.now()}`;
                  setFormData({
                    ...formData,
                    distinctives: [
                      ...current,
                      {
                        id: newId,
                        title: 'New Institutional Distinctive',
                        short: 'Short Catchy Tagline',
                        iconName: 'BookOpen',
                        desc: 'Detailed paragraph elaborating on this PCM strength and ministerial advantage.',
                        highlights: [
                          'Key point or institutional metric 1',
                          'Key point or institutional metric 2',
                        ],
                      },
                    ],
                  });
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#18392B] hover:bg-[#23533e] text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Distinctive</span>
              </button>
            </div>

            {(!formData.distinctives || formData.distinctives.length === 0) ? (
              <p className="text-slate-500 italic py-4 text-center">
                No custom distinctives defined. The system will use default institutional advantages.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.distinctives.map((d, idx) => (
                  <div
                    key={d.id || idx}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:border-[#588B76]/50 transition space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="font-bold text-[#588B76] text-[11px] uppercase tracking-wider">
                        Advantage #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(formData.distinctives || [])];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, distinctives: updated });
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Remove Distinctive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1">
                          Distinctive Title
                        </label>
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) => {
                            const updated = [...(formData.distinctives || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setFormData({ ...formData, distinctives: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Icon Symbol
                        </label>
                        <select
                          value={d.iconName || 'BookOpen'}
                          onChange={(e) => {
                            const updated = [...(formData.distinctives || [])];
                            updated[idx] = { ...updated[idx], iconName: e.target.value };
                            setFormData({ ...formData, distinctives: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                        >
                          <option value="BookOpen">Book / Biblical (BookOpen)</option>
                          <option value="Mountain">Mountain / Location (Mountain)</option>
                          <option value="Award">Award / Scholarship (Award)</option>
                          <option value="Briefcase">Ministry / Practicum (Briefcase)</option>
                          <option value="GraduationCap">Academics / Degree (GraduationCap)</option>
                          <option value="Users">Community / Fellowship (Users)</option>
                          <option value="Compass">Mission / Guidance (Compass)</option>
                          <option value="ShieldCheck">Doctrinal Integrity (ShieldCheck)</option>
                          <option value="Clock">Heritage / Time (Clock)</option>
                          <option value="Sparkles">Excellence (Sparkles)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Short Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={d.short}
                        onChange={(e) => {
                          const updated = [...(formData.distinctives || [])];
                          updated[idx] = { ...updated[idx], short: e.target.value };
                          setFormData({ ...formData, distinctives: updated });
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                        placeholder="e.g., Rooted in God’s Inerrant Word"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Detailed Description
                      </label>
                      <textarea
                        rows={2}
                        value={d.desc}
                        onChange={(e) => {
                          const updated = [...(formData.distinctives || [])];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setFormData({ ...formData, distinctives: updated });
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Key Bullet Highlights (One bullet per line)
                      </label>
                      <textarea
                        rows={3}
                        value={d.highlights ? d.highlights.join('\n') : ''}
                        onChange={(e) => {
                          const updated = [...(formData.distinctives || [])];
                          const lines = e.target.value
                            .split('\n')
                            .filter((line) => line.trim().length > 0);
                          updated[idx] = { ...updated[idx], highlights: lines };
                          setFormData({ ...formData, distinctives: updated });
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none font-mono text-[11px]"
                        placeholder="Enter each bullet on a new line..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving to Database...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
