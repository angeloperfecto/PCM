'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { isValidImageSrc, getSafeImageSrc, normalizeImageSrc } from '@/lib/utils';
import { LifeAtPCMConfig, LifeAtPCMItem } from '@/lib/types';
import { INITIAL_LIFE_AT_PCM_CONFIG } from '@/lib/initialData';
import { compressImageFile, uploadFileToFirebaseStorage } from '@/lib/firebase';
import {
  Flame,
  BookOpen,
  Users,
  Compass,
  Globe,
  Award,
  HeartHandshake,
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Upload,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Sparkles,
  Church,
  Cross,
  Music,
  Shield,
  Heart,
  Sun,
  MapPin,
  Coffee,
  Bookmark,
  Activity,
  Calendar,
  Layers,
  Star,
  Check,
  X,
  AlertTriangle,
  ImageIcon,
  LayoutGrid,
} from 'lucide-react';

// Preset photos for quick selection by admin
const PRESET_PHOTOS = [
  {
    name: 'Worship / Chapel',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Bible & Study',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Fellowship / Friends',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Pulpit / Preaching',
    url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Missions / Tribal',
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Student Life / Campus',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Community / Relief',
    url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Leadership / Mentorship',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Mountain Trails',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Library & Theology',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Classroom Discipleship',
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Graduation & Ministry',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop',
  },
];

// Available icons for selection
const AVAILABLE_ICONS = [
  { name: 'Flame', label: 'Chapel / Worship', icon: Flame },
  { name: 'BookOpen', label: 'Bible / Study', icon: BookOpen },
  { name: 'Users', label: 'Fellowship', icon: Users },
  { name: 'Compass', label: 'Practicum / Path', icon: Compass },
  { name: 'Globe', label: 'Missions / World', icon: Globe },
  { name: 'Award', label: 'Council / Guild', icon: Award },
  { name: 'HeartHandshake', label: 'Outreach / Relief', icon: HeartHandshake },
  { name: 'GraduationCap', label: 'Leadership', icon: GraduationCap },
  { name: 'Church', label: 'Church / Ministry', icon: Church },
  { name: 'Cross', label: 'Sacred / Faith', icon: Cross },
  { name: 'Music', label: 'Music Guild', icon: Music },
  { name: 'Shield', label: 'Governance', icon: Shield },
  { name: 'Sparkles', label: 'Inspiration', icon: Sparkles },
  { name: 'Heart', label: 'Care & Compassion', icon: Heart },
  { name: 'Sun', label: 'Spiritual Light', icon: Sun },
  { name: 'MapPin', label: 'Campus / Benguet', icon: MapPin },
  { name: 'Coffee', label: 'Casual Fellowship', icon: Coffee },
  { name: 'Bookmark', label: 'Scripture Memory', icon: Bookmark },
  { name: 'Activity', label: 'Sports & Wellness', icon: Activity },
  { name: 'Calendar', label: 'Retreats & Events', icon: Calendar },
  { name: 'Layers', label: 'Curriculum', icon: Layers },
  { name: 'Star', label: 'Excellence', icon: Star },
];

function getIconComponent(iconName?: string) {
  const found = AVAILABLE_ICONS.find(
    (item) => item.name.toLowerCase() === (iconName || '').toLowerCase()
  );
  return found ? found.icon : Sparkles;
}

export const AdminLifeAtPCMManager: React.FC = () => {
  const {
    siteConfig,
    updateLifeAtPCMConfig,
    saveLifeAtPCMItem,
    deleteLifeAtPCMItem,
    reorderLifeAtPCMItems,
    resetLifeAtPCMToDefault,
    canPerformAction,
    addToast,
  } = usePCM();

  // Load configuration from central store
  const currentConfig: LifeAtPCMConfig = useMemo(() => {
    return (
      siteConfig?.lifeAtPcm ||
      siteConfig?.studentLife?.lifeAtPcm ||
      INITIAL_LIFE_AT_PCM_CONFIG
    );
  }, [siteConfig?.lifeAtPcm, siteConfig?.studentLife?.lifeAtPcm]);

  // Section Header Form State
  const [badge, setBadge] = useState<string>(currentConfig.badge || 'Holistic Formation');
  const [title, setTitle] = useState<string>(currentConfig.title || 'LIFE AT PCM');
  const [subtitle, setSubtitle] = useState<string>(
    currentConfig.subtitle ||
      'Education at Philippine College of Ministry extends far beyond the lecture hall. Experience a vibrant, Christ-centered campus community where minds are sharpened and hearts are ignited for kingdom service.'
  );
  const [ctaText, setCtaText] = useState<string>(
    currentConfig.ctaText || 'Explore Campus Life & Spiritual Formation'
  );
  const [ctaLink, setCtaLink] = useState<string>(currentConfig.ctaLink || 'student-life');
  const [enabled, setEnabled] = useState<boolean>(currentConfig.enabled !== false);
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  // Card Modal State
  const [editingItem, setEditingItem] = useState<LifeAtPCMItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form Fields for Add / Edit Modal
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('Flame');
  const [formImage, setFormImage] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Sync local header inputs when store changes
  React.useEffect(() => {
    setBadge(currentConfig.badge || 'Holistic Formation');
    setTitle(currentConfig.title || 'LIFE AT PCM');
    setSubtitle(
      currentConfig.subtitle ||
        'Education at Philippine College of Ministry extends far beyond the lecture hall. Experience a vibrant, Christ-centered campus community where minds are sharpened and hearts are ignited for kingdom service.'
    );
    setCtaText(currentConfig.ctaText || 'Explore Campus Life & Spiritual Formation');
    setCtaLink(currentConfig.ctaLink || 'student-life');
    setEnabled(currentConfig.enabled !== false);
  }, [
    currentConfig.badge,
    currentConfig.title,
    currentConfig.subtitle,
    currentConfig.ctaText,
    currentConfig.ctaLink,
    currentConfig.enabled,
  ]);

  // Handle Header Save
  const handleSaveHeader = async () => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'Content Administrator privileges are required to update section settings.',
      });
      return;
    }

    setIsSavingHeader(true);
    try {
      await updateLifeAtPCMConfig({
        badge: badge.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        ctaText: ctaText.trim(),
        ctaLink: ctaLink.trim(),
        enabled,
      });
      addToast({
        type: 'success',
        title: 'Section Header Updated',
        message: 'Life at PCM section headline and introduction saved to Firestore.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to update section header.',
      });
    } finally {
      setIsSavingHeader(false);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsNewItem(true);
    setEditingItem(null);
    setFormTitle('');
    setFormDesc('');
    setFormIcon('Flame');
    setFormImage(
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop'
    );
    setFormActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LifeAtPCMItem) => {
    setIsNewItem(false);
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDesc(item.desc);
    setFormIcon(item.iconName || 'Flame');
    setFormImage(item.image);
    setFormActive(item.active !== false);
    setIsModalOpen(true);
  };

  // Handle Image File Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose an image file (JPG, PNG, or WebP).',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Compress to high-efficiency web image under Firestore boundaries
      const compressedBlob = await compressImageFile(file, 1200, 800, 0.82);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const finalUrl = await uploadFileToFirebaseStorage(
        compressedBlob,
        `lifeAtPcm/${Date.now()}_${safeName}`,
        {
          contentType: file.type || 'image/jpeg',
          fileName: safeName,
        }
      );
      if (finalUrl) {
        setFormImage(normalizeImageSrc(finalUrl));
        addToast({
          type: 'success',
          title: 'Image Uploaded',
          message: 'Custom image uploaded and ready to save.',
        });
      }
    } catch (err) {
      console.warn('Image upload error:', err);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to process selected image.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Save Item from Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      addToast({ type: 'warning', title: 'Title Required', message: 'Please enter a title for this card.' });
      return;
    }

    if (!formDesc.trim()) {
      addToast({
        type: 'warning',
        title: 'Description Required',
        message: 'Please provide a brief description.',
      });
      return;
    }

    const itemId = isNewItem || !editingItem ? `life-${Date.now()}` : editingItem.id;
    const itemToSave: LifeAtPCMItem = {
      id: itemId,
      title: formTitle.trim(),
      desc: formDesc.trim(),
      iconName: formIcon,
      image:
        normalizeImageSrc(formImage) ||
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop',
      active: formActive,
      order: editingItem?.order ?? (currentConfig.items?.length || 0) + 1,
    };

    try {
      await saveLifeAtPCMItem(itemToSave);
      setIsModalOpen(false);
      setEditingItem(null);
      addToast({
        type: 'success',
        title: isNewItem ? 'Formation Card Added' : 'Card Updated',
        message: `"${itemToSave.title}" has been saved and published to the public homepage.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Error Saving Card',
        message: 'Failed to commit changes to Firestore.',
      });
    }
  };

  // Reordering handlers
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const items = [...(currentConfig.items || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    await reorderLifeAtPCMItems(items);
  };

  // Toggle Card Visibility
  const handleToggleActive = async (item: LifeAtPCMItem) => {
    const updated = { ...item, active: item.active === false ? true : false };
    await saveLifeAtPCMItem(updated);
    addToast({
      type: 'info',
      title: updated.active ? 'Card Enabled' : 'Card Hidden',
      message: `"${item.title}" is now ${updated.active ? 'visible on' : 'hidden from'} the homepage.`,
    });
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteLifeAtPCMItem(deleteTargetId);
    setDeleteTargetId(null);
  };

  // Confirm and Execute Reset to Defaults
  const handleConfirmReset = async () => {
    await resetLifeAtPCMToDefault();
    setShowResetModal(false);
  };

  const sortedItems = useMemo(() => {
    return [...(currentConfig.items || [])].sort(
      (a, b) => (a.order ?? 99) - (b.order ?? 99)
    );
  }, [currentConfig.items]);

  const PreviewIcon = getIconComponent(formIcon);

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#18392B] text-white flex items-center justify-center shadow-md">
              <LayoutGrid className="w-6 h-6 text-[#588B76]" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#18392B] flex items-center gap-2">
                <span>Life at PCM — Homepage Bento Highlights</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Public Sync
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Customize the 8 formation cards, banner headlines, icons, and photos displayed on the main homepage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Reset all cards to institutional default settings"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          </div>
        </div>

        {/* Section Headline & Intro Settings */}
        <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#588B76]" />
              Homepage Section Header Configuration
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#588B76] focus:ring-[#588B76]"
              />
              <span>Display Section on Public Homepage</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Badge / Tagline
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Holistic Formation"
                className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#588B76]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Main Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. LIFE AT PCM"
                className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-serif font-bold focus:outline-none focus:ring-2 focus:ring-[#588B76]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Section Subtitle / Narrative
            </label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Enter welcoming description of campus life and community..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#588B76]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bottom CTA Button Text
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Explore Campus Life & Spiritual Formation"
                className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#588B76]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                CTA Target Destination
              </label>
              <select
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#588B76]"
              >
                <option value="student-life">Student Life & Formation Page</option>
                <option value="academics">Academic Programs</option>
                <option value="apply">Admissions & Online Application</option>
                <option value="about">About PCM & Heritage</option>
                <option value="sermons">Chapel Sermons & Audio Archive</option>
                <option value="contact">Contact & Visit Campus</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isSavingHeader}
              onClick={handleSaveHeader}
              className="inline-flex items-center gap-2 bg-[#18392B] hover:bg-[#10261D] text-white px-5 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#85AA9B]" />
              <span>{isSavingHeader ? 'Saving Header...' : 'Save Header Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Catalog Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
              <span>Formation Cards Catalog</span>
              <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {sortedItems.length} Cards Total ({sortedItems.filter((i) => i.active !== false).length} Active)
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag or use arrows to adjust sequence. Changes take effect on the live website immediately.
            </p>
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No Life at PCM cards found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your first campus formation highlight or click &quot;Reset Defaults&quot; to restore the canonical 8 items.
            </p>
            <button
              onClick={handleConfirmReset}
              className="mt-4 inline-flex items-center gap-2 bg-[#588B76] text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default 8 Cards</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {sortedItems.map((item, idx) => {
              const Icon = getIconComponent(item.iconName);
              const isActive = item.active !== false;

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white ${
                    isActive
                      ? 'border-slate-200 shadow-xs hover:border-[#588B76] hover:shadow-md'
                      : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  {/* Image & Gradient */}
                  <div className="h-36 relative overflow-hidden bg-slate-100">
                    {(() => {
                      const itemImgSrc = getSafeImageSrc(
                        item.image,
                        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop'
                      );
                      return (
                        <Image
                          src={itemImgSrc}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          unoptimized={Boolean(itemImgSrc.startsWith('data:') || itemImgSrc.startsWith('blob:'))}
                        />
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                    {/* Order & Active Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                      {!isActive && (
                        <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Icon Badge */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#588B76] text-white flex items-center justify-center shadow">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#18392B] line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      {/* Move Up / Down */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Move Left / Earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sortedItems.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Move Right / Later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Visibility & Edit/Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`p-1 rounded cursor-pointer ${
                            isActive
                              ? 'text-slate-400 hover:text-slate-700'
                              : 'text-amber-500 hover:text-amber-700'
                          }`}
                          title={isActive ? 'Hide from homepage' : 'Publish on homepage'}
                        >
                          {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          title="Edit card details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#18392B]">
                  {isNewItem ? 'Add Life at PCM Card' : 'Edit Formation Card'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set headline, pastoral description, thumbnail photography, and icon badge.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} noValidate className="space-y-5">
              {/* Title & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Card Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Chapel & Corporate Worship"
                    className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-serif font-bold focus:outline-none focus:ring-2 focus:ring-[#588B76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Visibility Status
                  </label>
                  <label className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#588B76] focus:ring-[#588B76]"
                    />
                    <span>Active on Public Site</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Card Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Weekly sacred assemblies gathering faculty and students for deep prayer, testimony, and passionate worship."
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#588B76]"
                />
              </div>

              {/* Icon Selector Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Select Icon Badge</span>
                  <span className="text-[11px] text-[#588B76] font-mono lowercase">
                    selected: {formIcon}
                  </span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {AVAILABLE_ICONS.map((item) => {
                    const CurIcon = item.icon;
                    const isSelected = formIcon.toLowerCase() === item.name.toLowerCase();

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormIcon(item.name)}
                        className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#18392B] text-white shadow-sm ring-2 ring-[#588B76]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        title={item.label}
                      >
                        <CurIcon className="w-4 h-4" />
                        <span className="text-[9px] truncate max-w-full font-sans">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photography / Image Source */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Card Thumbnail Photography
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      onBlur={() => {
                        if (formImage.trim()) {
                          setFormImage(normalizeImageSrc(formImage));
                        }
                      }}
                      placeholder="Paste image URL (https://...) or upload path"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#588B76]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Compressing...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                {/* Preset Suggestions */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                    Or choose from curated campus presets:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {PRESET_PHOTOS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setFormImage(preset.url)}
                        className={`flex-shrink-0 px-2.5 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                          formImage === preset.url
                            ? 'bg-[#588B76] text-white border-[#588B76] font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Mockup Preview */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Live Card Preview on Website
                </span>
                <div className="max-w-sm mx-auto bg-[#D0DED8]/20 rounded-xl overflow-hidden border border-[#588B76] shadow-md flex flex-col">
                  <div className="h-36 relative overflow-hidden bg-slate-200">
                    {(() => {
                      const previewSrc = isValidImageSrc(formImage) ? normalizeImageSrc(formImage) : null;
                      if (previewSrc) {
                        return (
                          <Image
                            src={previewSrc}
                            alt="Preview"
                            fill
                            sizes="(max-width: 640px) 100vw, 384px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized={Boolean(previewSrc.startsWith('data:') || previewSrc.startsWith('blob:'))}
                          />
                        );
                      }
                      return (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#18392B]/95 via-[#18392B]/35 to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#588B76] text-white flex items-center justify-center font-bold shadow">
                        <PreviewIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white/70">
                    <h4 className="font-serif text-sm font-bold text-[#18392B] leading-snug">
                      {formTitle || 'Sample Formation Title'}
                    </h4>
                    <p className="text-xs text-[#18392B]/75 mt-1 line-clamp-2 leading-relaxed">
                      {formDesc || 'Sample pastoral activity description will be rendered here on the homepage.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{isNewItem ? 'Save New Card' : 'Update Card'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Delete Formation Card?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this card from the Life at PCM section? This change will be permanently saved to Firestore and removed from the public homepage.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Restore Institutional Defaults?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore all 8 canonical Life at PCM cards (Chapel, Bible Study, Fellowship, Ministry Practicum, Missions, Student Council, Outreach, and Leadership) along with the default titles and photos. Any custom cards you added will be replaced.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold rounded-lg shadow cursor-pointer"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
