'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePCM } from '@/lib/store';
import { HeroSlide } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  subscribeToSlideshow,
  saveSlideshowToFirestore,
  uploadSlideshowImage,
  DEFAULT_HERO_SLIDES,
} from '@/lib/slideshowService';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';

export const AdminHeroTab: React.FC = () => {
  const { siteConfig, addToast, canPerformAction, currentAdminUser, currentUserAccount } = usePCM();

  // Firestore-synced slides (source of truth)
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    return siteConfig.heroSlides && siteConfig.heroSlides.length > 0
      ? siteConfig.heroSlides
      : DEFAULT_HERO_SLIDES;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);

  // Modal states
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetSlide, setDeleteTargetSlide] = useState<HeroSlide | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);

  // Modal Form States
  const [formHeadline, setFormHeadline] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formSubtext, setFormSubtext] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formPrimaryText, setFormPrimaryText] = useState('APPLY NOW FOR 2026–2027');
  const [formPrimaryLink, setFormPrimaryLink] = useState('apply');
  const [formSecondaryText, setFormSecondaryText] = useState('EXPLORE PROGRAMS');
  const [formSecondaryLink, setFormSecondaryLink] = useState('academics');
  const [formActive, setFormActive] = useState(true);

  // Image Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickReplaceInputRef = useRef<HTMLInputElement | null>(null);
  const [quickReplaceSlideId, setQuickReplaceSlideId] = useState<string | null>(null);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToSlideshow(
      (updatedSlides) => {
        if (updatedSlides && updatedSlides.length > 0) {
          setSlides(updatedSlides);
          setLastSavedTime(new Date().toLocaleTimeString());
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('Real-time slideshow sync warning:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute active slides for preview
  const activeSlides = slides.filter((s) => s.active !== false);

  // Helper to persist slides to Firebase Firestore
  const persistSlides = async (
    newSlidesList: HeroSlide[],
    actionDescription: string = 'Slideshow updated'
  ): Promise<boolean> => {
    setIsSaving(true);
    const userIdentifier =
      currentUserAccount?.email || currentAdminUser?.name || currentAdminUser?.email || 'Admin User';

    const result = await saveSlideshowToFirestore(newSlidesList, userIdentifier);
    setIsSaving(false);

    if (result.success) {
      setSlides(newSlidesList);
      setLastSavedTime(new Date().toLocaleTimeString());
      setLastUpdatedBy(userIdentifier);
      addToast({
        title: 'Slideshow updated successfully.',
        message: `${actionDescription} and permanently saved to Firebase.`,
        type: 'success',
      });
      return true;
    } else {
      addToast({
        title: 'Slideshow update failed.',
        message: `Your previous slideshow configuration has been preserved. (${result.error})`,
        type: 'error',
      });
      return false;
    }
  };

  // Open Modal to Add New Slide
  const openNewSlideModal = () => {
    const generatedId = `hero-${Date.now()}`;
    setEditingSlide({ id: generatedId } as HeroSlide);
    setFormHeadline('');
    setFormTag('Accredited Theological Education');
    setFormSubtext(
      'Philippine College of Ministry exists to equip men and women with biblical knowledge, spiritual maturity, and practical ministry skills for faithful service.'
    );
    setFormImage(
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop'
    );
    setFormPrimaryText('APPLY NOW FOR 2026–2027');
    setFormPrimaryLink('apply');
    setFormSecondaryText('EXPLORE PROGRAMS');
    setFormSecondaryLink('academics');
    setFormActive(true);
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Slide
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
    setUploadError(null);
    setIsModalOpen(true);
  };

  // File Upload Handler (for Add/Edit Modal)
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size must be less than 15MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const uploadRes = await uploadSlideshowImage(file, editingSlide?.id);
    setIsUploading(false);

    if (uploadRes.success && (uploadRes.dataUrl || uploadRes.url)) {
      setFormImage(uploadRes.dataUrl || uploadRes.url || '');
      addToast({
        title: 'Image Uploaded',
        message: 'Image uploaded and synchronized across all users.',
        type: 'success',
      });
    } else {
      setUploadError(uploadRes.error || 'Failed to upload image. Please try again or paste a direct image URL.');
      addToast({
        title: 'Upload Failed',
        message: uploadRes.error || 'Could not upload image.',
        type: 'error',
      });
    }
  };

  // Quick Replace Image on Slide Card
  const handleQuickReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quickReplaceSlideId) return;

    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Editor privileges to replace slide images.',
        type: 'error',
      });
      return;
    }

    addToast({
      title: 'Uploading Replacement Image',
      message: 'Uploading and synchronizing image to Firebase...',
      type: 'info',
    });

    const uploadRes = await uploadSlideshowImage(file, quickReplaceSlideId);
    if (uploadRes.success && (uploadRes.dataUrl || uploadRes.url)) {
      const uploadedUrl: string = uploadRes.dataUrl || uploadRes.url!;
      const updated: HeroSlide[] = slides.map((s) =>
        s.id === quickReplaceSlideId ? { ...s, image: uploadedUrl, updatedAt: new Date().toISOString() } : s
      );
      await persistSlides(updated, 'Slide image replaced');
    } else {
      addToast({
        title: 'Image Replacement Failed',
        message: uploadRes.error || 'Could not upload replacement image.',
        type: 'error',
      });
    }

    // Reset input
    if (quickReplaceInputRef.current) {
      quickReplaceInputRef.current.value = '';
    }
    setQuickReplaceSlideId(null);
  };

  // Save Slide (Add or Update)
  const handleSaveSlide = async (e: React.FormEvent) => {
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
        message: 'Please provide both a headline and an image URL.',
        type: 'error',
      });
      return;
    }

    let updatedSlides: HeroSlide[];
    const isExisting = editingSlide && slides.some((s) => s.id === editingSlide.id);

    if (isExisting && editingSlide) {
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
              updatedAt: new Date().toISOString(),
            }
          : s
      );
    } else {
      const newSlide: HeroSlide = {
        id: editingSlide?.id || `hero-${Date.now()}`,
        headline: formHeadline.trim(),
        tag: formTag.trim(),
        subtext: formSubtext.trim(),
        image: formImage.trim(),
        primaryBtnText: formPrimaryText.trim(),
        primaryBtnLink: formPrimaryLink.trim(),
        secondaryBtnText: formSecondaryText.trim(),
        secondaryBtnLink: formSecondaryLink.trim(),
        active: formActive,
        order: slides.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentAdminUser?.name || 'Admin',
      };
      updatedSlides = [...slides, newSlide];
    }

    const ok = await persistSlides(
      updatedSlides,
      editingSlide ? 'Slide updated' : 'New slide added'
    );
    if (ok) {
      setIsModalOpen(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleSlideActive = async (id: string) => {
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Editor privileges to toggle slide visibility.',
        type: 'error',
      });
      return;
    }

    const updatedSlides = slides.map((s) =>
      s.id === id ? { ...s, active: s.active === false ? true : false } : s
    );

    await persistSlides(updatedSlides, 'Slide status toggled');
  };

  // Reorder Slide (Move Up / Down)
  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Editor privileges to reorder slides.',
        type: 'error',
      });
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const reordered = [...slides];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Re-index order property
    const indexedSlides = reordered.map((s, idx) => ({ ...s, order: idx }));

    await persistSlides(indexedSlides, `Slide moved ${direction}`);
  };

  // Request Slide Deletion
  const handleDeleteSlideRequest = (slide: HeroSlide) => {
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
        message: 'At least one slide must remain in the slideshow.',
        type: 'error',
      });
      return;
    }

    setDeleteTargetSlide(slide);
  };

  // Confirm Slide Deletion
  const confirmDeleteSlide = async () => {
    if (!deleteTargetSlide) return;
    const updatedSlides = slides
      .filter((s) => s.id !== deleteTargetSlide.id)
      .map((s, idx) => ({ ...s, order: idx }));

    setDeleteTargetSlide(null);
    await persistSlides(updatedSlides, 'Slide removed');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Hidden file input for quick image replacement */}
      <input
        type="file"
        ref={quickReplaceInputRef}
        onChange={handleQuickReplaceImage}
        accept="image/*"
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#588B76]/15 flex items-center justify-center text-[#18392B]">
              <Sparkles className="w-5 h-5 text-[#588B76]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
                Homepage Hero Slideshow Manager
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">
                  Firebase Live
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative Firestore & Storage slideshow control. Upload images, reorder banners, and preview changes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Preview Button */}
          <button
            onClick={() => {
              setPreviewActiveIndex(0);
              setIsPreviewOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200 shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Preview Slideshow</span>
          </button>

          {/* Add Slide Button */}
          <button
            onClick={openNewSlideModal}
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hero Slide</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          {isSaving ? (
            <RefreshCw className="w-4 h-4 text-[#588B76] animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>
            {isSaving
              ? 'Saving to Firebase Firestore...'
              : `Single Source of Truth: Firestore (siteContent/slideshow)`}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          {lastSavedTime ? `Last Synced: ${lastSavedTime}` : 'Real-time sync active'}
          {lastUpdatedBy ? ` by ${lastUpdatedBy}` : ''}
        </div>
      </div>

      {/* Slides list */}
      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              slide.active !== false
                ? 'bg-white border-slate-200 shadow-xs hover:border-[#588B76]/50'
                : 'bg-slate-50 border-slate-200 opacity-65'
            }`}
          >
            {/* Slide Preview & Details */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Order Number badge & Thumbnail */}
              <div className="relative group shrink-0">
                <div
                  className="w-32 h-22 rounded-lg bg-cover bg-center border border-slate-200 shadow-inner overflow-hidden"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      onClick={() => {
                        setQuickReplaceSlideId(slide.id);
                        quickReplaceInputRef.current?.click();
                      }}
                      className="text-[10px] bg-white text-slate-900 font-bold px-2 py-1 rounded shadow cursor-pointer flex items-center gap-1"
                      title="Replace this image"
                    >
                      <Upload className="w-3 h-3" />
                      Replace
                    </button>
                  </div>
                </div>
                <div className="absolute top-1 left-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </div>
              </div>

              {/* Text metadata */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                    {slide.tag || 'Slide ' + (idx + 1)}
                  </span>
                  {slide.active !== false ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Live
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                      Inactive (Hidden)
                    </span>
                  )}
                </div>

                <h4 className="font-serif text-sm font-bold text-[#18392B] truncate">
                  {slide.headline}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2">{slide.subtext}</p>

                <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5 flex-wrap">
                  <span className="truncate max-w-[200px]">
                    Primary:{' '}
                    <strong className="text-slate-600">
                      {slide.primaryBtnText || 'APPLY'}
                    </strong>{' '}
                    <span className="text-slate-400">({slide.primaryBtnLink || 'apply'})</span>
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-[200px]">
                    Secondary:{' '}
                    <strong className="text-slate-600">
                      {slide.secondaryBtnText || 'EXPLORE'}
                    </strong>{' '}
                    <span className="text-slate-400">({slide.secondaryBtnLink || 'academics'})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
              {/* Replace Image Button */}
              <button
                onClick={() => {
                  setQuickReplaceSlideId(slide.id);
                  quickReplaceInputRef.current?.click();
                }}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer flex items-center gap-1 text-xs font-medium"
                title="Replace image file"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xl:inline text-[11px]">Replace Img</span>
              </button>

              {/* Move Up */}
              <button
                disabled={idx === 0}
                onClick={() => handleMoveSlide(idx, 'up')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                title="Move Slide Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              {/* Move Down */}
              <button
                disabled={idx === slides.length - 1}
                onClick={() => handleMoveSlide(idx, 'down')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                title="Move Slide Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Active */}
              <button
                onClick={() => handleToggleSlideActive(slide.id)}
                className={`p-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                  slide.active !== false
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={slide.active !== false ? 'Deactivate Slide' : 'Activate Slide'}
              >
                {slide.active !== false ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              {/* Edit Details */}
              <button
                onClick={() => openEditSlideModal(slide)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                title="Edit Slide Information"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDeleteSlideRequest(slide)}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                title="Delete Slide"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetSlide}
        title="Delete Homepage Hero Slide"
        itemName={deleteTargetSlide?.headline || deleteTargetSlide?.tag}
        message="Are you sure you want to permanently delete this hero slide from Firebase Firestore? This action will immediately remove it from the public homepage."
        confirmLabel="Delete Slide"
        onConfirm={confirmDeleteSlide}
        onCancel={() => setDeleteTargetSlide(null)}
      />

      {/* Interactive Live Slideshow Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-2xl max-w-5xl w-full p-6 space-y-4 shadow-2xl border border-white/10 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#85AA9B]" />
                <h3 className="font-serif text-base font-bold text-white">
                  Live Homepage Hero Carousel Preview ({activeSlides.length} Active Slides)
                </h3>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-white px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            {/* Preview Banner Viewport */}
            {activeSlides.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                No active slides to preview. Please enable at least one slide.
              </div>
            ) : (
              <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-[#18392B] flex items-center border border-white/20 shadow-2xl">
                {activeSlides.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      idx === previewActiveIndex % activeSlides.length
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                    style={{
                      backgroundImage: `url(${s.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 30%',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#10261D]/95 via-[#18392B]/85 to-[#18392B]/60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10261D] via-transparent to-transparent" />
                  </div>
                ))}

                {/* Content Overlay */}
                {(() => {
                  const s = activeSlides[previewActiveIndex % activeSlides.length];
                  return (
                    <div className="relative z-10 px-8 py-10 max-w-2xl space-y-3">
                      <div className="w-10 h-1 bg-[#588B76]" />
                      <div className="inline-flex items-center gap-2 bg-[#18392B]/90 border border-[#588B76]/60 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest text-[#D0DED8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#85AA9B] animate-pulse" />
                        <span>{s?.tag}</span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                        {s?.headline}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#D0DED8] leading-relaxed border-l-2 border-[#588B76] pl-4 line-clamp-3">
                        {s?.subtext}
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <div className="bg-[#588B76] text-white text-[11px] font-bold px-4 py-2 rounded uppercase tracking-wider flex items-center gap-1.5 shadow">
                          <span>{s?.primaryBtnText || 'APPLY NOW'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <div className="border border-[#D0DED8] text-white text-[11px] font-bold px-4 py-2 rounded uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#85AA9B]" />
                          <span>{s?.secondaryBtnText || 'EXPLORE'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Navigation Arrows */}
                <button
                  onClick={() =>
                    setPreviewActiveIndex((prev) =>
                      prev === 0 ? activeSlides.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setPreviewActiveIndex((prev) => (prev + 1) % activeSlides.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
                  {activeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewActiveIndex(idx)}
                      className={`h-1.5 rounded-sm transition-all duration-300 ${
                        idx === previewActiveIndex % activeSlides.length
                          ? 'w-6 bg-[#588B76]'
                          : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-base font-bold text-[#18392B]">
                {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4 text-xs">
              {/* Category Tag */}
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

              {/* Main Headline */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Main Headline (Title) *
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

              {/* Subtext Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Subtext Description (Caption) *
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

              {/* Image Upload & URL Section */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">
                  Background Image (File Upload or Direct URL) *
                </label>

                {/* Drag and Drop / File Picker Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${
                    dragOver
                      ? 'border-[#588B76] bg-[#588B76]/5'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center gap-1.5">
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-6 h-6 text-[#588B76] animate-spin" />
                        <p className="font-bold text-slate-700">Uploading to Firebase Storage...</p>
                        <p className="text-[11px] text-slate-400">Generating permanent download URL</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#588B76]" />
                        <p className="font-bold text-slate-700">
                          Click to upload or drag & drop image
                        </p>
                        <p className="text-[11px] text-slate-400">
                          PNG, JPG, WEBP up to 15MB. Stored permanently in Firebase Storage.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-xs bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Direct Image URL fallback */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Or enter direct image URL:</span>
                  <input
                    type="text"
                    required
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                {/* Live Image Preview inside modal */}
                {formImage && (
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Image Preview:</span>
                    <div
                      className="mt-1 w-full h-32 rounded-lg bg-cover bg-center border border-slate-200 shadow-inner"
                      style={{ backgroundImage: `url(${formImage})` }}
                    />
                  </div>
                )}
              </div>

              {/* Primary Button */}
              <div className="grid grid-cols-2 gap-3 pt-2">
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
                    <option value="portal">Student Portal</option>
                  </select>
                </div>
              </div>

              {/* Secondary Button */}
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
                    <option value="contact">Contact Us</option>
                  </select>
                </div>
              </div>

              {/* Active Slide Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slide-active-checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#588B76] focus:ring-[#588B76] cursor-pointer"
                />
                <label
                  htmlFor="slide-active-checkbox"
                  className="text-slate-700 font-medium cursor-pointer"
                >
                  Active (Display in live public slideshow on the homepage)
                </label>
              </div>

              {/* Form Actions */}
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
                  disabled={isSaving || isUploading}
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Slide & Publish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
