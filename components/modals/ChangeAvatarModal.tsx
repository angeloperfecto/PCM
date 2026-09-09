'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Link2,
  Camera,
  Check,
  RotateCcw,
  Loader2,
  Sparkles,
  Shield,
  GraduationCap,
  Image as ImageIcon,
} from 'lucide-react';
import { compressImageFile } from '@/lib/firebase';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  userName: string;
  userRole?: 'Student' | 'Admin' | 'Faculty' | string;
  onSave: (newAvatarUrl: string) => Promise<boolean | void> | boolean | void;
}

const PRESET_AVATARS = [
  {
    id: 'preset-1',
    label: 'Young Male Scholar',
    category: 'Student',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'preset-2',
    label: 'Young Female Scholar',
    category: 'Student',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'preset-3',
    label: 'Young Ministry Student',
    category: 'Student',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'preset-4',
    label: 'Seminarist Male',
    category: 'Student',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'preset-5',
    label: 'Academic Female Leader',
    category: 'Admin',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'preset-6',
    label: 'Clergy / Faculty Male',
    category: 'Admin',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'preset-7',
    label: 'Senior Administrator',
    category: 'Admin',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'preset-8',
    label: 'Theology Professor',
    category: 'Admin',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
  },
];

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl = '',
  userName,
  userRole = 'Student',
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [selectedUrl, setSelectedUrl] = useState<string>(currentAvatarUrl || '');
  const [customUrlInput, setCustomUrlInput] = useState<string>(currentAvatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Compute initials monogram (like "EM" or "AD")
  const monogram = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : userRole === 'Admin'
    ? 'AD'
    : 'ST';

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload avatar directly to persistent storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'images');
      formData.append('mediaId', `avatar-${Date.now()}`);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Avatar upload to storage failed');
      }

      const uploadData = await res.json();
      const finalUrl = uploadData.downloadURL || uploadData.url;
      setSelectedUrl(finalUrl);
      setCustomUrlInput(finalUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setUploadError(err.message || 'Failed to process avatar file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setUploadError('Please enter a valid image URL.');
      return;
    }
    setUploadError(null);
    setSelectedUrl(trimmed);
  };

  const handleResetToMonogram = () => {
    setSelectedUrl('');
    setCustomUrlInput('');
    setUploadError(null);
  };

  const handleSaveSubmit = async () => {
    setIsUploading(true);
    try {
      await onSave(selectedUrl);
      onClose();
    } catch (err) {
      console.error('Error saving avatar:', err);
      setUploadError('Failed to save profile image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="change-avatar-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="change-avatar-modal-card"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#18392B] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white">
                  Change Profile Image
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    userRole === 'Admin'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {userRole === 'Admin' ? (
                    <Shield className="w-2.5 h-2.5" />
                  ) : (
                    <GraduationCap className="w-2.5 h-2.5" />
                  )}
                  {userRole} Account
                </span>
              </div>
              <p className="text-xs text-[#D0DED8]">
                Update institutional portrait for <strong>{userName}</strong>
              </p>
            </div>
          </div>
          <button
            id="btn-close-avatar-modal"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Live Preview Cards */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Live Preview Appearance
            </span>
            <div className="flex flex-wrap items-center justify-around gap-6">
              {/* ID Badge Preview (Squircle Frame - matches user image) */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  {selectedUrl ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md ring-4 ring-purple-100 border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#18392B] to-[#588B76] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md ring-4 ring-purple-100">
                      {monogram}
                    </div>
                  )}
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                    ID Card
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Institutional Card</span>
              </div>

              {/* Circular Badge Preview (Navbar & Lists) */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  {selectedUrl ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-md ring-2 ring-emerald-500/40 border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedUrl}
                        alt="Circular Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#18392B] text-[#97D4B6] font-serif font-black text-xl flex items-center justify-center shadow-md ring-2 ring-emerald-500/40">
                      {monogram.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 bg-[#18392B] text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                    Header
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Navbar & Menu</span>
              </div>
            </div>
          </div>

          {/* Selection Method Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              id="tab-avatar-upload"
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2 px-4 font-semibold text-xs transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-[#18392B] text-[#18392B]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image File
            </button>
            <button
              id="tab-avatar-presets"
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`pb-2 px-4 font-semibold text-xs transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'presets'
                  ? 'border-[#18392B] text-[#18392B]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Seminary Presets
            </button>
            <button
              id="tab-avatar-url"
              type="button"
              onClick={() => setActiveTab('url')}
              className={`pb-2 px-4 font-semibold text-xs transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'url'
                  ? 'border-[#18392B] text-[#18392B]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Image Web URL
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div
                id="avatar-dropzone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center ${
                  dragActive
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-[#588B76] hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop an image
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PNG, JPG, WebP up to 10MB. Images are automatically optimized.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-1 px-4 py-1.5 bg-[#18392B] hover:bg-[#234E3D] text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  Select File from Device
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Curated Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Select one of the official institutional profile portraits:
              </p>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = selectedUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedUrl(preset.url);
                        setCustomUrlInput(preset.url);
                        setUploadError(null);
                      }}
                      className={`group relative rounded-xl overflow-hidden border-2 transition aspect-square flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                          : 'border-slate-200 hover:border-[#588B76]'
                      }`}
                      title={preset.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-semibold py-0.5 px-1 truncate text-center">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Direct URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Direct Image URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-avatar-url"
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#18392B] focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
                <button
                  id="btn-apply-avatar-url"
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer"
                >
                  Preview
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                You can paste image links from Unsplash, Google Photos, Cloudinary, or any HTTPS source.
              </p>
            </div>
          )}

          {/* Error notice if any */}
          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {uploadError}
            </div>
          )}

          {/* Action to reset back to monogram */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              id="btn-reset-avatar-monogram"
              type="button"
              onClick={handleResetToMonogram}
              className="text-xs font-medium text-slate-600 hover:text-[#18392B] flex items-center gap-1.5 cursor-pointer py-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Official Monogram ({monogram})</span>
            </button>

            {selectedUrl && (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Custom Image Selected
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            id="btn-cancel-avatar"
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-save-avatar"
            type="button"
            onClick={handleSaveSubmit}
            disabled={isUploading}
            className="px-5 py-2 rounded-xl bg-[#18392B] hover:bg-[#234E3D] text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Image...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Profile Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
