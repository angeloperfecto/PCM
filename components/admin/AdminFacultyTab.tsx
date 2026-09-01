'use client';

import React, { useState, useRef } from 'react';
import { usePCM } from '@/lib/store';
import { FacultyMember, MediaItem } from '@/lib/types';
import { FacultyPortrait } from '@/components/common/FacultyPortrait';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Mail,
  GraduationCap,
  Shield,
  Building,
  Image as ImageIcon,
  Upload,
  Camera,
  FolderOpen,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Eye,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const AdminFacultyTab: React.FC = () => {
  const {
    faculty,
    addFacultyMember,
    updateFacultyMember,
    deleteFacultyMember,
    mediaLibrary,
    addMediaItem,
    uploadMediaFile,
    addToast,
    canPerformAction,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Modal Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDept, setFormDept] = useState('Theology & Pastoral Studies');
  const [formGroup, setFormGroup] = useState<'Board of Trustees' | 'Key Administrators' | 'Resident Faculty' | 'Adjunct Faculty' | 'Administrative Staff'>('Resident Faculty');
  const [formDegrees, setFormDegrees] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formImage, setFormImage] = useState('');

  // Media picker & photo upload state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerSearch, setMediaPickerSearch] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openNewModal = () => {
    setEditingFaculty(null);
    setFormName('');
    setFormRole('');
    setFormDept('Theology & Pastoral Studies');
    setFormGroup('Resident Faculty');
    setFormDegrees('B.Th., M.Div.');
    setFormBio('');
    setFormEmail('');
    setFormPhone('');
    setFormImage('');
    setShowMediaPicker(false);
    setIsModalOpen(true);
  };

  const openEditModal = (fac: FacultyMember) => {
    setEditingFaculty(fac);
    setFormName(fac.name);
    setFormRole(fac.role || fac.title || '');
    setFormDept(fac.department || 'Theology & Pastoral Studies');
    setFormGroup((fac.group as any) || 'Resident Faculty');
    setFormDegrees((fac.degrees || []).join(', '));
    setFormBio(fac.bio || '');
    setFormEmail(fac.email || '');
    setFormPhone(fac.phone || '');
    setFormImage(fac.image || fac.imageUrl || '');
    setShowMediaPicker(false);
    setIsModalOpen(true);
  };

  // Photo upload handling
  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'Invalid File Type',
        message: 'Please upload an image file (.jpg, .png, .webp, .svg).',
        type: 'error',
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const assetTitle = `${formName || 'Faculty'} Portrait`;
      const downloadUrl = await uploadMediaFile(file, 'Faculty', assetTitle);
      setFormImage(downloadUrl);
      addToast({
        title: 'Photo Uploaded',
        message: 'Portrait image uploaded and synced with PCM Media Library.',
        type: 'success',
      });
    } catch (uploadError) {
      console.warn('Direct upload fallback to data URL:', uploadError);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          const dataUrl = event.target.result;
          setFormImage(dataUrl);

          const assetTitle = `${formName || 'Faculty'} Portrait`;
          addMediaItem({
            title: assetTitle,
            url: dataUrl,
            category: 'Faculty',
            altText: `Portrait of ${formName || 'Faculty Member'}`,
            fileSize: `${Math.round(file.size / 1024)} KB`,
            dimensions: 'Portrait',
          });

          addToast({
            title: 'Photo Loaded',
            message: 'Portrait image updated.',
            type: 'success',
          });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
    // reset input value so user can re-upload same file if desired
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to modify the faculty directory.',
        type: 'error',
      });
      return;
    }

    if (!formName.trim() || !formRole.trim()) {
      addToast({ title: 'Missing Information', message: 'Name and Role are required.', type: 'error' });
      return;
    }

    const degreesArray = formDegrees
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const trimmedImg = formImage.trim();

    if (editingFaculty) {
      updateFacultyMember(editingFaculty.id, {
        name: formName.trim(),
        role: formRole.trim(),
        department: formDept.trim(),
        group: formGroup,
        degrees: degreesArray,
        bio: formBio.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        image: trimmedImg,
        imageUrl: trimmedImg,
      });
      addToast({ title: 'Faculty Profile Updated', message: `${formName} updated successfully.`, type: 'success' });
    } else {
      addFacultyMember({
        name: formName.trim(),
        role: formRole.trim(),
        department: formDept.trim(),
        group: formGroup,
        degrees: degreesArray,
        bio: formBio.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        image: trimmedImg,
        imageUrl: trimmedImg,
      });
      addToast({ title: 'Faculty Profile Added', message: `${formName} added to the PCM directory.`, type: 'success' });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to remove directory profiles.',
        type: 'error',
      });
      return;
    }

    setDeleteTarget({ id, name });
  };

  const confirmDeleteFaculty = () => {
    if (!deleteTarget) return;
    deleteFacultyMember(deleteTarget.id);
    addToast({ title: 'Profile Removed', message: `${deleteTarget.name} has been removed.`, type: 'info' });
    setDeleteTarget(null);
  };

  const filteredFaculty = faculty.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.role && f.role.toLowerCase().includes(q)) ||
      (f.title && f.title.toLowerCase().includes(q)) ||
      (f.department && f.department.toLowerCase().includes(q));

    const matchesGroup =
      groupFilter === 'all' || f.group?.toLowerCase() === groupFilter.toLowerCase();

    return matchesSearch && matchesGroup;
  });

  // Filter media items for the in-modal media picker
  const filteredMediaItems = mediaLibrary.filter((m) => {
    if (!mediaPickerSearch.trim()) return true;
    const q = mediaPickerSearch.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.altText.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#588B76]" />
            Board of Trustees, Faculty & Staff Directory Manager
          </h2>
          <p className="text-xs text-slate-500">
            Manage academic profiles, degrees, photos, and leadership assignments across the institution.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty / Staff</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search faculty by name, role, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['all', 'Board of Trustees', 'Key Administrators', 'Resident Faculty', 'Adjunct Faculty', 'Administrative Staff'].map((grp) => (
            <button
              key={grp}
              onClick={() => setGroupFilter(grp)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                groupFilter === grp
                  ? 'bg-[#18392B] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {grp === 'all' ? 'All Groups' : grp}
            </button>
          ))}
        </div>
      </div>

      {/* Faculty Profiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map((fac) => (
          <div
            key={fac.id}
            className="p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76]/60 transition space-y-3 bg-white flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5">
              {/* Portrait */}
              <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs bg-[#18392B] relative">
                <FacultyPortrait
                  name={fac.name}
                  imageSrc={fac.image || fac.imageUrl}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase font-bold text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                  {fac.group || 'Faculty'}
                </span>
                <h4 className="font-serif text-sm font-bold text-[#18392B] truncate">{fac.name}</h4>
                <p className="text-xs text-slate-600 font-medium line-clamp-1">{fac.role}</p>
                <p className="text-[11px] text-slate-400 truncate">{fac.department}</p>
              </div>
            </div>

            {fac.degrees && fac.degrees.length > 0 && (
              <div className="text-[11px] text-[#588B76] font-medium truncate pt-1 border-t border-slate-100">
                {fac.degrees.join(', ')}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {fac.email || 'No email registered'}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEditModal(fac)}
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition"
                  title="Edit Profile"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(fac.id, fac.name)}
                  className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition"
                  title="Delete Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#588B76]" />
                  {editingFaculty ? 'Edit Directory Profile' : 'Add New Faculty / Staff Member'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update directory listing credentials, biographical profile, and portrait photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Full Name (with Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Atty. Joseph Michael Laruta"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Institutional Role
                  </label>
                  <input
                    type="text"
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="e.g. Board of Trustees / Professor"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Governance / Faculty Group
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Board of Trustees">Board of Trustees</option>
                    <option value="Key Administrators">Key Administrators</option>
                    <option value="Resident Faculty">Resident Faculty</option>
                    <option value="Adjunct Faculty">Adjunct Faculty</option>
                    <option value="Administrative Staff">Administrative Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Academic Department
                  </label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="e.g. Theology & Pastoral Studies"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Earned Degrees & Credentials (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formDegrees}
                  onChange={(e) => setFormDegrees(e.target.value)}
                  placeholder="e.g. Bachelor of Arts in Classical Philosophy, Master of Arts"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              {/* ENHANCED PHOTO UPLOAD & MANAGEMENT SECTION */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#588B76]" />
                    <span>Faculty Portrait & Photo</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(!showMediaPicker)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
                        showMediaPicker
                          ? 'bg-[#18392B] text-white border-[#18392B]'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{showMediaPicker ? 'Hide Media Library' : 'Choose from Media Library'}</span>
                    </button>

                    {formImage && (
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        title="Revert to official PCM stylized vector portrait"
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Use Default Portrait</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo Preview & Dropzone */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Portrait Live Preview Box */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-[#588B76]/30 shadow-xs bg-[#18392B] relative">
                      <FacultyPortrait
                        name={formName || 'Faculty Member'}
                        imageSrc={formImage}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-medium mt-1.5 text-center text-slate-500">
                      {formImage ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3 h-3" />
                          Custom Photo Set
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1 justify-center">
                          <Sparkles className="w-3 h-3 text-[#588B76]" />
                          PCM Stylized Portrait
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Dropzone & Upload Button */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`sm:col-span-8 p-3 rounded-lg border-2 border-dashed transition flex flex-col items-center justify-center text-center space-y-1.5 bg-white ${
                      isDraggingOver
                        ? 'border-[#588B76] bg-emerald-50/50'
                        : 'border-slate-300 hover:border-[#588B76]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      className="hidden"
                    />

                    <div className="w-8 h-8 rounded-full bg-[#588B76]/10 flex items-center justify-center text-[#588B76]">
                      <Upload className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-700 text-xs">
                        Drag & drop a new photo here, or
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 bg-[#588B76] hover:bg-[#46705F] text-white px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Browse / Upload Photo</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Supports JPG, PNG, WebP, SVG (Max 5MB)
                    </p>
                  </div>
                </div>

                {/* Direct URL / Path field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-slate-400" />
                      <span>Custom Portrait Image URL / Path (Optional)</span>
                    </label>
                    {formImage && (
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="text-[10px] text-slate-400 hover:text-red-600 transition cursor-pointer"
                      >
                        Clear field
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="e.g. /images/faculty/atty-laruta.svg, data:image/..., or https://..."
                    className="w-full p-2 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave empty to automatically use the official stylistically-consistent PCM faculty portrait.
                  </p>
                </div>

                {/* Media Library Picker Drawer */}
                {showMediaPicker && (
                  <div className="pt-3 border-t border-slate-200 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-[#588B76]" />
                        <span>Select Existing Photo from PCM Media Library</span>
                      </span>
                      <input
                        type="text"
                        placeholder="Search media..."
                        value={mediaPickerSearch}
                        onChange={(e) => setMediaPickerSearch(e.target.value)}
                        className="p-1 px-2.5 rounded border border-slate-200 text-[11px] focus:outline-none focus:border-[#588B76] w-40"
                      />
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                      {filteredMediaItems.length > 0 ? (
                        filteredMediaItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setFormImage(item.url);
                              setShowMediaPicker(false);
                              addToast({
                                title: 'Photo Selected',
                                message: `Selected "${item.title}" from media library.`,
                                type: 'success',
                              });
                            }}
                            className={`group relative rounded-lg border p-1 cursor-pointer transition hover:border-[#588B76] hover:shadow-xs flex flex-col items-center text-center ${
                              formImage === item.url
                                ? 'border-[#588B76] bg-emerald-50/40 ring-2 ring-[#588B76]/30'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="w-full h-12 rounded overflow-hidden relative bg-slate-200 mb-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.url}
                                alt={item.altText || item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              />
                            </div>
                            <span className="text-[10px] font-medium text-slate-700 truncate w-full line-clamp-1">
                              {item.title}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono">
                              {item.category}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-4 text-center text-slate-400 text-xs">
                          No matching media assets found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="laruta.trustee@pcm.ph"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Direct Phone / Extension
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+63 74 422 2577"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Biographical Summary & Pastoral Background
                </label>
                <textarea
                  rows={3}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Chairman, Board of Trustees. Practicing Lawyer in Zambales."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-sm transition text-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Directory Profile"
        itemName={deleteTarget?.name}
        message="Are you sure you want to remove this faculty or staff member from the institutional directory?"
        confirmLabel="Remove Profile"
        onConfirm={confirmDeleteFaculty}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
