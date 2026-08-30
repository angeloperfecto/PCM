'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { HeroSlide } from '@/lib/types';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminHeroTab: React.FC = () => {
  const { siteConfig, updateSiteConfig, addToast, canPerformAction } = usePCM();

  const slides: HeroSlide[] = siteConfig.heroSlides || [];

  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formHeadline, setFormHeadline] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formSubtext, setFormSubtext] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formPrimaryText, setFormPrimaryText] = useState('APPLY NOW FOR 2026–2027');
  const [formPrimaryLink, setFormPrimaryLink] = useState('apply');
  const [formSecondaryText, setFormSecondaryText] = useState('EXPLORE PROGRAMS');
  const [formSecondaryLink, setFormSecondaryLink] = useState('academics');
  const [formActive, setFormActive] = useState(true);

  const openNewSlideModal = () => {
    setEditingSlide(null);
    setFormHeadline('');
    setFormTag('Accredited Theological Education');
    setFormSubtext('');
    setFormImage('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop');
    setFormPrimaryText('APPLY NOW FOR 2026–2027');
    setFormPrimaryLink('apply');
    setFormSecondaryText('EXPLORE PROGRAMS');
    setFormSecondaryLink('academics');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditSlideModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormHeadline(slide.headline);
    setFormTag(slide.tag || '');
    setFormSubtext(slide.subtext);
    setFormImage(slide.image);
    setFormPrimaryText(slide.primaryBtnText || 'APPLY NOW FOR 2026–2027');
    setFormPrimaryLink(slide.primaryBtnLink || 'apply');
    setFormSecondaryText(slide.secondaryBtnText || 'EXPLORE PROGRAMS');
    setFormSecondaryLink(slide.secondaryBtnLink || 'academics');
    setFormActive(slide.active !== false);
    setIsModalOpen(true);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need at least Editor role to modify Hero slides.',
        type: 'error',
      });
      return;
    }

    if (!formHeadline.trim() || !formImage.trim()) {
      addToast({
        title: 'Missing Fields',
        message: 'Please provide both a Headline and an Image URL.',
        type: 'error',
      });
      return;
    }

    let updatedSlides: HeroSlide[];

    if (editingSlide) {
      updatedSlides = slides.map((s) =>
        s.id === editingSlide.id
          ? {
              ...s,
              headline: formHeadline.trim(),
              tag: formTag.trim(),
              subtext: formSubtext.trim(),
              image: formImage.trim(),
              primaryBtnText: formPrimaryText.trim(),
              primaryBtnLink: formPrimaryLink.trim(),
              secondaryBtnText: formSecondaryText.trim(),
              secondaryBtnLink: formSecondaryLink.trim(),
              active: formActive,
            }
          : s
      );
    } else {
      const newSlide: HeroSlide = {
        id: `hero-${Date.now()}`,
        headline: formHeadline.trim(),
        tag: formTag.trim(),
        subtext: formSubtext.trim(),
        image: formImage.trim(),
        primaryBtnText: formPrimaryText.trim(),
        primaryBtnLink: formPrimaryLink.trim(),
        secondaryBtnText: formSecondaryText.trim(),
        secondaryBtnLink: formSecondaryLink.trim(),
        active: formActive,
        order: slides.length + 1,
      };
      updatedSlides = [...slides, newSlide];
    }

    updateSiteConfig({ ...siteConfig, heroSlides: updatedSlides });
    setIsModalOpen(false);
    addToast({
      title: 'Hero Slide Saved',
      message: editingSlide ? 'Hero slide updated successfully.' : 'New Hero slide added to homepage.',
      type: 'success',
    });
  };

  const handleDeleteSlide = (id: string) => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Required',
        message: 'You need Content Admin privileges to delete slides.',
        type: 'error',
      });
      return;
    }

    if (slides.length <= 1) {
      addToast({
        title: 'Cannot Delete',
        message: 'At least one slide must remain in the hero carousel.',
        type: 'error',
      });
      return;
    }

    const updatedSlides = slides.filter((s) => s.id !== id);
    updateSiteConfig({ ...siteConfig, heroSlides: updatedSlides });
    addToast({
      title: 'Slide Removed',
      message: 'The hero slide has been removed.',
      type: 'info',
    });
  };

  const handleToggleSlideActive = (id: string) => {
    const updatedSlides = slides.map((s) =>
      s.id === id ? { ...s, active: s.active === false ? true : false } : s
    );
    updateSiteConfig({ ...siteConfig, heroSlides: updatedSlides });
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const reordered = [...slides];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    updateSiteConfig({ ...siteConfig, heroSlides: reordered });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#588B76]" />
            Homepage Hero Slideshow Manager
          </h2>
          <p className="text-xs text-slate-500">
            Control the main interactive banner on the public homepage. Edit headlines, images, and action buttons.
          </p>
        </div>

        <button
          onClick={openNewSlideModal}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Slide</span>
        </button>
      </div>

      {/* Slide Cards List */}
      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              slide.active !== false
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            {/* Slide Preview & Info */}
            <div className="flex items-start gap-4 flex-1">
              <div
                className="w-28 h-20 rounded-lg bg-cover bg-center shrink-0 border border-slate-200 shadow-inner"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                    {slide.tag || 'Slide ' + (idx + 1)}
                  </span>
                  {slide.active === false ? (
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                      Inactive
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                      Active Live
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-sm font-bold text-[#18392B] line-clamp-1">
                  {slide.headline}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">{slide.subtext}</p>
                <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                  <span>Primary: <strong>{slide.primaryBtnText || 'Apply'}</strong></span>
                  <span>•</span>
                  <span>Secondary: <strong>{slide.secondaryBtnText || 'Explore'}</strong></span>
                </div>
              </div>
            </div>

            {/* Slide Action Controls */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {/* Reorder buttons */}
              <button
                disabled={idx === 0}
                onClick={() => handleMoveSlide(idx, 'up')}
                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                title="Move Slide Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={idx === slides.length - 1}
                onClick={() => handleMoveSlide(idx, 'down')}
                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                title="Move Slide Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Active */}
              <button
                onClick={() => handleToggleSlideActive(slide.id)}
                className={`p-1.5 rounded text-xs font-medium cursor-pointer ${
                  slide.active !== false
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Toggle Active/Inactive"
              >
                {slide.active !== false ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              {/* Edit */}
              <button
                onClick={() => openEditSlideModal(slide)}
                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                title="Edit Slide Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDeleteSlide(slide.id)}
                className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                title="Delete Slide"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add/Edit Slide */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
            </h3>

            <form onSubmit={handleSaveSlide} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tag / Category Badge
                </label>
                <input
                  type="text"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  placeholder="e.g. Accredited Theological Education"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Main Headline (Uppercase Recommended)
                </label>
                <input
                  type="text"
                  required
                  value={formHeadline}
                  onChange={(e) => setFormHeadline(e.target.value)}
                  placeholder="e.g. EQUIPPING SERVANTS FOR KINGDOM IMPACT"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Subtext Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formSubtext}
                  onChange={(e) => setFormSubtext(e.target.value)}
                  placeholder="Brief 1-2 sentence description explaining the slide mission..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Background Image URL
                </label>
                <input
                  type="text"
                  required
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={formPrimaryText}
                    onChange={(e) => setFormPrimaryText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Primary Link Target
                  </label>
                  <select
                    value={formPrimaryLink}
                    onChange={(e) => setFormPrimaryLink(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="apply">Online Admissions (Apply)</option>
                    <option value="academics">Academic Programs</option>
                    <option value="about">About PCM</option>
                    <option value="resources">Downloads & Resources</option>
                    <option value="contact">Contact Us</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Secondary Button Text
                  </label>
                  <input
                    type="text"
                    value={formSecondaryText}
                    onChange={(e) => setFormSecondaryText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Secondary Link Target
                  </label>
                  <select
                    value={formSecondaryLink}
                    onChange={(e) => setFormSecondaryLink(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="academics">Academic Programs</option>
                    <option value="apply">Online Admissions</option>
                    <option value="about">About PCM & Faculty</option>
                    <option value="resources">Resources & Sermons</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slide-active-checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded text-[#588B76] focus:ring-[#588B76]"
                />
                <label htmlFor="slide-active-checkbox" className="text-slate-700 font-medium">
                  Active (Display in live public slideshow)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-sm"
                >
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
