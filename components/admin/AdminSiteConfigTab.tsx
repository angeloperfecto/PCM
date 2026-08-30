'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export const AdminSiteConfigTab: React.FC = () => {
  const { siteConfig, updateSiteConfig, addToast, canPerformAction } = usePCM();
  const [formData, setFormData] = useState<SiteConfig>(siteConfig);
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'contact' | 'social' | 'seo' | 'mission'>('identity');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Required',
        message: 'You need Content Admin privileges to update Site Configuration.',
        type: 'error',
      });
      return;
    }

    updateSiteConfig(formData);
    addToast({
      title: 'Configuration Saved',
      message: 'Global site identity, contact, and SEO settings updated successfully.',
      type: 'success',
    });
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

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
