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
  ArrowUpDown,
  MoveUp,
  MoveDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  ListOrdered,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  HelpCircle,
  Save,
} from 'lucide-react';

export const AdminFacultyTab: React.FC = () => {
  const {
    faculty,
    addFacultyMember,
    updateFacultyMember,
    deleteFacultyMember,
    reorderFaculty,
    moveFacultyMember,
    setFacultyOrderIndex,
    mediaLibrary,
    addMediaItem,
    uploadMediaFile,
    addToast,
    canPerformAction,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'arrange' | 'table'>('grid');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Drag & drop sorting state
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [dragOverMemberId, setDragOverMemberId] = useState<string | null>(null);

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
  const [formOrder, setFormOrder] = useState<number>(1);

  // Media picker & photo upload state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerSearch, setMediaPickerSearch] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sorted full faculty list by order index
  const sortedFaculty = [...faculty].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

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
    setFormOrder(faculty.length + 1);
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
    setFormOrder(fac.order ?? (sortedFaculty.findIndex((f) => f.id === fac.id) + 1));
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
        order: Number(formOrder) || editingFaculty.order || 1,
      });

      if (formOrder && formOrder !== editingFaculty.order) {
        setFacultyOrderIndex(editingFaculty.id, Number(formOrder));
      }

      addToast({ title: 'Faculty Profile Updated', message: `${formName} updated successfully.`, type: 'success' });
    } else {
      const created = addFacultyMember({
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
        order: Number(formOrder) || faculty.length + 1,
      });

      if (formOrder && formOrder <= faculty.length) {
        setFacultyOrderIndex(created.id, Number(formOrder));
      }

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

  // Drag and drop reordering handlers
  const handleItemDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMemberId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleItemDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedMemberId && draggedMemberId !== id) {
      setDragOverMemberId(id);
    }
  };

  const handleItemDragLeave = () => {
    setDragOverMemberId(null);
  };

  const handleItemDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedMemberId || e.dataTransfer.getData('text/plain');
    setDraggedMemberId(null);
    setDragOverMemberId(null);

    if (!sourceId || sourceId === targetId) return;

    const sourceIdx = sortedFaculty.findIndex((f) => f.id === sourceId);
    const targetIdx = sortedFaculty.findIndex((f) => f.id === targetId);

    if (sourceIdx === -1 || targetIdx === -1) return;

    const reordered = [...sortedFaculty];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    reorderFaculty(reordered);
  };

  const handleItemDragEnd = () => {
    setDraggedMemberId(null);
    setDragOverMemberId(null);
  };

  // Preset Sorting Actions
  const handleSortAlphabetical = () => {
    if (!canPerformAction('Content Admin')) {
      addToast({ title: 'Permission Denied', message: 'Admin access required to rearrange directory.', type: 'error' });
      return;
    }

    let reordered: FacultyMember[] = [];
    if (groupFilter === 'all') {
      reordered = [...sortedFaculty].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const match = sortedFaculty.filter((f) => f.group?.toLowerCase() === groupFilter.toLowerCase());
      const others = sortedFaculty.filter((f) => f.group?.toLowerCase() !== groupFilter.toLowerCase());
      match.sort((a, b) => a.name.localeCompare(b.name));
      reordered = [...match, ...others];
    }

    reorderFaculty(reordered);
    addToast({
      title: 'Alphabetical Sort Applied',
      message: `Directory records sorted from A to Z${groupFilter !== 'all' ? ` for ${groupFilter}` : ''}.`,
      type: 'info',
    });
  };

  const handleSortByInstitutionalHierarchy = () => {
    if (!canPerformAction('Content Admin')) {
      addToast({ title: 'Permission Denied', message: 'Admin access required to rearrange directory.', type: 'error' });
      return;
    }

    const groupWeights: Record<string, number> = {
      'board of trustees': 1,
      'key administrators': 2,
      'administration': 2,
      'resident faculty': 3,
      'faculty': 3,
      'administrative staff': 4,
      'staff': 4,
      'adjunct faculty': 5,
      'emeritus & adjunct': 5,
    };

    const reordered = [...sortedFaculty].sort((a, b) => {
      const weightA = groupWeights[(a.group || '').toLowerCase()] || 99;
      const weightB = groupWeights[(b.group || '').toLowerCase()] || 99;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return (a.order ?? 9999) - (b.order ?? 9999);
    });

    reorderFaculty(reordered);
    addToast({
      title: 'Institutional Precedence Applied',
      message: 'Arranged by: Board of Trustees → Administration → Faculty → Staff → Emeritus.',
      type: 'success',
    });
  };

  const filteredFaculty = sortedFaculty.filter((f) => {
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
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#588B76]" />
            <h2 className="font-serif text-lg font-bold text-[#18392B]">
              Board of Trustees, Faculty & Staff Directory Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manually organize priority order, update academic degrees, bios, portrait photos, and institutional assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#18392B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Standard Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('arrange')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'arrange'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Manual Arrange & Reordering Workspace"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Manual Arrange</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#18392B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Compact Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Personnel</span>
          </button>
        </div>
      </div>

      {/* Reorder Information Banner (when in Arrange mode) */}
      {viewMode === 'arrange' && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#18392B] font-medium">
              <span className="w-6 h-6 rounded-full bg-[#588B76] text-white flex items-center justify-center font-bold text-xs shrink-0">
                ↕
              </span>
              <div>
                <p className="font-bold text-emerald-950">Manual Directory Reordering Active</p>
                <p className="text-[11px] text-emerald-800">
                  Drag cards by the handle <GripVertical className="w-3 h-3 inline mx-0.5" /> or use the Up/Down buttons to position trustees, professors, and staff. Position changes sync immediately to the public directory.
                </p>
              </div>
            </div>

            {/* Quick Preset Sort Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={handleSortByInstitutionalHierarchy}
                className="flex items-center gap-1.5 bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-xs text-xs"
                title="Arrange by Trustees → Administration → Faculty → Staff"
              >
                <Building className="w-3.5 h-3.5 text-[#588B76]" />
                <span>Hierarchy Order</span>
              </button>

              <button
                type="button"
                onClick={handleSortAlphabetical}
                className="flex items-center gap-1.5 bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-xs text-xs"
                title="Sort Alphabetically from A to Z"
              >
                <ListOrdered className="w-3.5 h-3.5 text-[#588B76]" />
                <span>A-Z Names</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* MODE 1: MANUAL ARRANGE WORKSPACE */}
      {viewMode === 'arrange' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
            <span>Showing {filteredFaculty.length} personnel in display order</span>
            <span className="text-[11px] text-slate-400">Drag to reorder or click arrows to move</span>
          </div>

          {filteredFaculty.map((fac, idx) => {
            const actualIndex = sortedFaculty.findIndex((f) => f.id === fac.id);
            const isFirst = actualIndex === 0;
            const isLast = actualIndex === sortedFaculty.length - 1;
            const isDragged = draggedMemberId === fac.id;
            const isDropTarget = dragOverMemberId === fac.id;

            return (
              <div
                key={fac.id}
                draggable
                onDragStart={(e) => handleItemDragStart(e, fac.id)}
                onDragOver={(e) => handleItemDragOver(e, fac.id)}
                onDragLeave={handleItemDragLeave}
                onDrop={(e) => handleItemDrop(e, fac.id)}
                onDragEnd={handleItemDragEnd}
                className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-white ${
                  isDragged
                    ? 'opacity-40 border-dashed border-[#588B76] bg-emerald-50/30'
                    : isDropTarget
                    ? 'border-[#588B76] ring-2 ring-[#588B76]/40 bg-emerald-50/40 shadow-md'
                    : 'border-slate-200 shadow-xs hover:border-[#588B76]/60'
                }`}
              >
                {/* Drag Handle, Rank, and Member Info */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Grip Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 shrink-0"
                    title="Drag to rearrange position"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Rank Badge */}
                  <div className="w-8 h-8 rounded-lg bg-[#18392B] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                    #{fac.order ?? (actualIndex + 1)}
                  </div>

                  {/* Portrait Thumbnail */}
                  <div className="w-10 h-12 rounded-md overflow-hidden shrink-0 border border-slate-200 bg-[#18392B]">
                    <FacultyPortrait
                      name={fac.name}
                      imageSrc={fac.image || fac.imageUrl}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Member Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif text-sm font-bold text-[#18392B] truncate">{fac.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded border border-[#588B76]/20">
                        {fac.group || 'Faculty'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{fac.role || fac.title}</p>
                    {fac.department && (
                      <p className="text-[11px] text-slate-400 truncate">{fac.department}</p>
                    )}
                  </div>
                </div>

                {/* Direct Rank Selection & Step Arrows */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Direct Jump to Position Select */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">Rank:</span>
                    <select
                      value={fac.order ?? (actualIndex + 1)}
                      onChange={(e) => setFacultyOrderIndex(fac.id, Number(e.target.value))}
                      className="bg-transparent font-bold text-[#18392B] text-xs focus:outline-none cursor-pointer"
                      title="Jump directly to rank"
                    >
                      {sortedFaculty.map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          #{i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveFacultyMember(fac.id, 'top')}
                      disabled={isFirst}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Move to Top"
                    >
                      <ChevronsUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveFacultyMember(fac.id, 'up')}
                      disabled={isFirst}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Move Up 1 Position"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveFacultyMember(fac.id, 'down')}
                      disabled={isLast}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Move Down 1 Position"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveFacultyMember(fac.id, 'bottom')}
                      disabled={isLast}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Move to Bottom"
                    >
                      <ChevronsDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(fac)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition ml-1"
                    title="Edit Profile Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: STANDARD GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFaculty.map((fac) => {
            const actualIndex = sortedFaculty.findIndex((f) => f.id === fac.id);
            const isFirst = actualIndex === 0;
            const isLast = actualIndex === sortedFaculty.length - 1;

            return (
              <div
                key={fac.id}
                className="p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76]/60 transition space-y-3 bg-white flex flex-col justify-between relative group"
              >
                <div className="space-y-3">
                  {/* Top Bar with Rank Badge & Quick Nudges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold bg-[#18392B] text-white px-2 py-0.5 rounded shadow-xs">
                        #{fac.order ?? (actualIndex + 1)}
                      </span>
                      <span className="text-[10px] font-mono uppercase font-bold text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                        {fac.group || 'Faculty'}
                      </span>
                    </div>

                    {/* Quick Move Up/Down Arrow buttons right on the card */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => moveFacultyMember(fac.id, 'up')}
                        disabled={isFirst}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                        title="Move Up in Directory Order"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFacultyMember(fac.id, 'down')}
                        disabled={isLast}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                        title="Move Down in Directory Order"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

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
                </div>

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
            );
          })}
        </div>
      )}

      {/* MODE 3: COMPACT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-16">Rank</th>
                <th className="py-3 px-3">Portrait</th>
                <th className="py-3 px-4">Name & Title</th>
                <th className="py-3 px-4">Group / Category</th>
                <th className="py-3 px-4">Role & Department</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Arrange</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFaculty.map((fac) => {
                const actualIndex = sortedFaculty.findIndex((f) => f.id === fac.id);
                const isFirst = actualIndex === 0;
                const isLast = actualIndex === sortedFaculty.length - 1;

                return (
                  <tr key={fac.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                        #{fac.order ?? (actualIndex + 1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-8 h-10 rounded overflow-hidden border border-slate-200 bg-[#18392B]">
                        <FacultyPortrait
                          name={fac.name}
                          imageSrc={fac.image || fac.imageUrl}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#18392B]">
                      {fac.name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-mono font-bold text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                        {fac.group}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      <div>{fac.role}</div>
                      <div className="text-[11px] text-slate-400">{fac.department}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {fac.email || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveFacultyMember(fac.id, 'up')}
                          disabled={isFirst}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-25 cursor-pointer"
                          title="Move Up"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFacultyMember(fac.id, 'down')}
                          disabled={isLast}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-25 cursor-pointer"
                          title="Move Down"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
                  Update directory listing credentials, rank sequence, biographical profile, and portrait photo.
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
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
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <ListOrdered className="w-3.5 h-3.5 text-[#588B76]" />
                    <span>Display Rank / Order</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={faculty.length + 1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    placeholder="1"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Institutional Role
                  </label>
                  <input
                    type="text"
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="e.g. Chairman, Board of Trustees / Professor"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

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

