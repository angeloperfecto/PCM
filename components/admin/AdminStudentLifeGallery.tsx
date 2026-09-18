'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { StudentLifeAlbum, StudentLifePhotoItem } from '@/lib/types';
import { compressImageFile, uploadFileToFirebaseStorage } from '@/lib/firebase';
import {
  Camera,
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Move,
  Calendar,
  MapPin,
  Sparkles,
  Layers,
  Search,
  ExternalLink,
  RotateCw,
  FolderOpen,
  Image as ImageIcon,
} from 'lucide-react';

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  uploadedUrl?: string;
}

export const AdminStudentLifeGallery: React.FC = () => {
  const {
    studentLifeAlbums,
    createStudentLifeAlbum,
    updateStudentLifeAlbum,
    deleteStudentLifeAlbum,
    addPhotosToStudentLifeAlbum,
    updateStudentLifePhoto,
    deleteStudentLifePhoto,
    reorderStudentLifePhotos,
    setStudentLifeAlbumCover,
    toggleStudentLifeAlbumPublish,
    moveStudentLifePhoto,
    addToast,
    canPerformAction,
  } = usePCM();

  // Active view: 'albums' list or 'album-detail'
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const selectedAlbum = studentLifeAlbums.find((a) => a.id === selectedAlbumId) || null;

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  // Album creation / edit modal
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbumData, setEditingAlbumData] = useState<{
    id?: string;
    title: string;
    description: string;
    eventName: string;
    eventDate: string;
    location: string;
    status: 'published' | 'unpublished';
    coverPhotoUrl: string;
  }>({
    title: '',
    description: '',
    eventName: '',
    eventDate: '',
    location: '',
    status: 'published',
    coverPhotoUrl: '',
  });

  // Photo editing modal
  const [editingPhoto, setEditingPhoto] = useState<StudentLifePhotoItem | null>(null);

  // Multi-image upload drawer & queue
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [uploadTargetAlbumId, setUploadTargetAlbumId] = useState<string>('');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Move photo dialog state
  const [movingPhoto, setMovingPhoto] = useState<StudentLifePhotoItem | null>(null);
  const [targetMoveAlbumId, setTargetMoveAlbumId] = useState<string>('');

  // Lightbox preview for admin
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Filtered albums
  const filteredAlbums = studentLifeAlbums.filter((alb) => {
    const matchesSearch =
      alb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alb.eventName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alb.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open album modal for creating
  const handleOpenCreateAlbum = () => {
    setEditingAlbumData({
      title: '',
      description: '',
      eventName: '',
      eventDate: new Date().getFullYear().toString(),
      location: 'PCM Campus, Lamtang, Benguet',
      status: 'published',
      coverPhotoUrl: '',
    });
    setIsAlbumModalOpen(true);
  };

  // Open album modal for editing
  const handleOpenEditAlbum = (alb: StudentLifeAlbum) => {
    setEditingAlbumData({
      id: alb.id,
      title: alb.title,
      description: alb.description || '',
      eventName: alb.eventName || '',
      eventDate: alb.eventDate || '',
      location: alb.location || '',
      status: alb.status,
      coverPhotoUrl: alb.coverPhotoUrl || '',
    });
    setIsAlbumModalOpen(true);
  };

  // Save album (create or edit)
  const handleSaveAlbum = async () => {
    if (!editingAlbumData.title.trim()) {
      addToast('error', 'Title Required', 'Please enter a title for the photo album.');
      return;
    }

    if (editingAlbumData.id) {
      await updateStudentLifeAlbum(editingAlbumData.id, {
        title: editingAlbumData.title.trim(),
        description: editingAlbumData.description.trim(),
        eventName: editingAlbumData.eventName.trim(),
        eventDate: editingAlbumData.eventDate.trim(),
        location: editingAlbumData.location.trim(),
        status: editingAlbumData.status,
        coverPhotoUrl: editingAlbumData.coverPhotoUrl,
      });
    } else {
      const newAlbum = await createStudentLifeAlbum({
        title: editingAlbumData.title.trim(),
        description: editingAlbumData.description.trim(),
        eventName: editingAlbumData.eventName.trim(),
        eventDate: editingAlbumData.eventDate.trim(),
        location: editingAlbumData.location.trim(),
        status: editingAlbumData.status,
        coverPhotoUrl: editingAlbumData.coverPhotoUrl,
        photos: [] as StudentLifePhotoItem[],
      });
      // Optionally open upload modal directly for new album
      setUploadTargetAlbumId(newAlbum.id);
      setSelectedAlbumId(newAlbum.id);
    }

    setIsAlbumModalOpen(false);
  };

  // Delete Album confirmation
  const handleDeleteAlbum = async (id: string, title: string) => {
    if (!canPerformAction('Content Admin')) {
      addToast('error', 'Access Denied', 'Content Admin privileges required.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the album "${title}" and all its photos? This action cannot be undone.`)) {
      if (selectedAlbumId === id) {
        setSelectedAlbumId(null);
      }
      await deleteStudentLifeAlbum(id);
    }
  };

  // File selection & validation
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
    const newQueueItems: UploadQueueItem[] = [];

    Array.from(files).forEach((file) => {
      // Validate type
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        addToast('error', 'Invalid File Format', `${file.name} is not a supported format (JPG, PNG, WEBP).`);
        return;
      }
      // Validate size
      if (file.size > maxSizeBytes) {
        addToast('error', 'File Too Large', `${file.name} exceeds the 15MB limit.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newQueueItems.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        caption: '',
        progress: 0,
        status: 'pending',
      });
    });

    if (newQueueItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...newQueueItems]);
      setIsUploadDrawerOpen(true);
      if (selectedAlbumId && !uploadTargetAlbumId) {
        setUploadTargetAlbumId(selectedAlbumId);
      } else if (!uploadTargetAlbumId && studentLifeAlbums.length > 0) {
        setUploadTargetAlbumId(studentLifeAlbums[0].id);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Process and upload queue
  const handleStartUpload = async () => {
    if (!uploadTargetAlbumId) {
      addToast('error', 'Target Album Required', 'Please select an album to upload these photos into.');
      return;
    }
    const targetAlbum = studentLifeAlbums.find((a) => a.id === uploadTargetAlbumId);
    if (!targetAlbum) return;

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    const completedPhotos: StudentLifePhotoItem[] = [];

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status === 'completed') continue;

      // Update item to uploading
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 20 } : q))
      );

      try {
        // Step 1: Compress image
        const compressedBlob = await compressImageFile(item.file, 1600, 1600, 0.82);
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: 50 } : q))
        );

        // Step 2: Upload to Firebase Storage or API
        const safeFileName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `studentLife/${uploadTargetAlbumId}/${Date.now()}_${safeFileName}`;
        const downloadUrl = await uploadFileToFirebaseStorage(compressedBlob, storagePath, {
          contentType: item.file.type || 'image/jpeg',
        });

        const newPhotoItem: StudentLifePhotoItem = {
          id: `slp-${Date.now()}-${i}`,
          albumId: uploadTargetAlbumId,
          imageUrl: downloadUrl,
          thumbnailUrl: downloadUrl,
          fileName: item.file.name,
          caption: item.caption.trim() || '',
          sortOrder: (targetAlbum.photos?.length || 0) + completedPhotos.length + 1,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'PCM Admin',
        };

        completedPhotos.push(newPhotoItem);

        // Mark completed
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'completed', progress: 100, uploadedUrl: downloadUrl }
              : q
          )
        );
      } catch (err: any) {
        console.error(`Upload error for ${item.file.name}:`, err);
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMessage: err?.message || 'Failed to upload photo.' }
              : q
          )
        );
      }
    }

    setIsUploading(false);

    if (completedPhotos.length > 0) {
      await addPhotosToStudentLifeAlbum(uploadTargetAlbumId, completedPhotos);
      // Clean up completed queue after 1.5s
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((q) => q.status !== 'completed'));
        if (uploadQueue.filter((q) => q.status === 'error').length === 0) {
          setIsUploadDrawerOpen(false);
        }
      }, 1200);
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    addToast('info', 'Upload Cancelled', 'File upload stopped.');
  };

  const handleRemoveQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((q) => q.id !== id);
    });
  };

  // Reorder photos
  const handleMovePhoto = (albumId: string, index: number, direction: 'up' | 'down') => {
    if (!selectedAlbum) return;
    const photos = [...selectedAlbum.photos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const temp = photos[index];
    photos[index] = photos[newIndex];
    photos[newIndex] = temp;

    reorderStudentLifePhotos(albumId, photos);
  };

  // Execute moving photo to another album
  const handleExecuteMovePhoto = async () => {
    if (!movingPhoto || !selectedAlbumId || !targetMoveAlbumId) return;
    await moveStudentLifePhoto(selectedAlbumId, targetMoveAlbumId, movingPhoto.id);
    setMovingPhoto(null);
    setTargetMoveAlbumId('');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-sm bg-[#18392B]/10 text-[#18392B]">
                <Camera className="w-4 h-4" />
              </span>
              <h3 className="font-serif font-bold text-lg text-[#18392B]">
                Student Life in Pictures — Facebook-Style Multi-Image Gallery
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Organize campus memories into rich albums with multi-image drag-and-drop uploads, cover photo selection, custom captions, reordering, and real-time public synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedAlbum ? (
              <button
                type="button"
                onClick={() => setSelectedAlbumId(null)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 rounded-sm hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Albums</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleOpenCreateAlbum}
              className="px-3.5 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create New Album</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (studentLifeAlbums.length === 0) {
                  addToast('info', 'Create Album First', 'Please create an album before uploading photos.');
                  handleOpenCreateAlbum();
                  return;
                }
                setUploadTargetAlbumId(selectedAlbumId || studentLifeAlbums[0]?.id || '');
                setIsUploadDrawerOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#588B76] hover:bg-[#46705f] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar (Only shown on Albums view) */}
        {!selectedAlbum && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search albums, events, locations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[11px] font-semibold text-slate-500">Status:</span>
              <div className="inline-flex rounded-sm border border-slate-200 p-0.5 bg-slate-50 text-xs">
                {(['all', 'published', 'unpublished'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 rounded-xs capitalize text-xs font-medium transition cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-white text-[#18392B] font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 ml-2">
                {filteredAlbums.length} {filteredAlbums.length === 1 ? 'album' : 'albums'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: ALBUM LIST VIEW */}
      {!selectedAlbum && (
        <div>
          {filteredAlbums.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-sm p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <FolderOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-serif font-bold text-base text-[#18392B]">No Photo Albums Found</h4>
                <p className="text-xs text-slate-500">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No photo albums match your active search filter.'
                    : 'Start building your Facebook-style Student Life gallery by creating your first photo album.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateAlbum}
                className="px-4 py-2 bg-[#18392B] text-white text-xs font-bold rounded-sm hover:bg-[#10261D] cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Album</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlbums.map((album) => {
                const isPub = album.status === 'published';
                const count = album.photos?.length || album.photoCount || 0;
                const coverImg = album.coverPhotoUrl || album.photos?.[0]?.imageUrl || '';

                return (
                  <div
                    key={album.id}
                    className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-2xs hover:border-[#588B76] hover:shadow-xs transition group flex flex-col"
                  >
                    {/* Album Cover & Preview Collage */}
                    <div
                      onClick={() => setSelectedAlbumId(album.id)}
                      className="h-48 w-full relative bg-slate-100 cursor-pointer overflow-hidden"
                    >
                      {coverImg ? (
                        <Image
                          src={coverImg}
                          alt={album.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                          <ImageIcon className="w-8 h-8 stroke-1" />
                          <span className="text-[11px]">No Photos Uploaded</span>
                        </div>
                      )}

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      {/* Photo count badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="bg-black/75 text-white backdrop-blur-xs text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          <span>{count} {count === 1 ? 'Photo' : 'Photos'}</span>
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-2xs ${
                            isPub
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isPub ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span className="capitalize">{album.status}</span>
                        </span>
                      </div>

                      {/* Bottom title in cover */}
                      <div className="absolute bottom-2.5 left-3 right-3 text-white pointer-events-none">
                        <h4 className="font-serif font-bold text-sm line-clamp-1 drop-shadow-sm">
                          {album.title}
                        </h4>
                        {album.eventName && (
                          <p className="text-[11px] text-slate-200 drop-shadow-sm truncate">
                            {album.eventName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Album Info & Controls */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        {album.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {album.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
                          {album.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{album.eventDate}</span>
                            </span>
                          )}
                          {album.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{album.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedAlbumId(album.id)}
                          className="px-2.5 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white font-bold rounded-xs flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Manage Photos</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStudentLifeAlbumPublish(album.id)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xs transition cursor-pointer"
                            title={isPub ? 'Unpublish album' : 'Publish album'}
                          >
                            {isPub ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditAlbum(album)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xs transition cursor-pointer"
                            title="Edit album details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAlbum(album.id, album.title)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xs transition cursor-pointer"
                            title="Delete album"
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
      )}

      {/* VIEW 2: SINGLE ALBUM DETAIL & PHOTOS MANAGER */}
      {selectedAlbum && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-6">
          {/* Header of selected album */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlbumId(null)}
                  className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-serif font-bold text-xl text-[#18392B]">
                  {selectedAlbum.title}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-xs capitalize ${
                    selectedAlbum.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedAlbum.status}
                </span>
              </div>

              {selectedAlbum.description && (
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  {selectedAlbum.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {selectedAlbum.eventName && (
                  <span className="font-medium text-slate-700">
                    Event: <span className="font-normal text-slate-600">{selectedAlbum.eventName}</span>
                  </span>
                )}
                {selectedAlbum.eventDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedAlbum.eventDate}</span>
                  </span>
                )}
                {selectedAlbum.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedAlbum.location}</span>
                  </span>
                )}
                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-xs">
                  {selectedAlbum.photos?.length || 0} Photos Total
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditAlbum(selectedAlbum)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 rounded-sm hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Album Details</span>
              </button>

              <button
                type="button"
                onClick={() => toggleStudentLifeAlbumPublish(selectedAlbum.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm flex items-center gap-1.5 cursor-pointer transition ${
                  selectedAlbum.status === 'published'
                    ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {selectedAlbum.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{selectedAlbum.status === 'published' ? 'Unpublish Album' : 'Publish Album'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUploadTargetAlbumId(selectedAlbum.id);
                  setIsUploadDrawerOpen(true);
                }}
                className="px-4 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Photos to Album</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Quick Dropzone banner inside album */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              setUploadTargetAlbumId(selectedAlbum.id);
              fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-sm p-6 text-center transition cursor-pointer ${
              isDragOver
                ? 'border-[#588B76] bg-[#588B76]/10'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300'
            }`}
          >
            <UploadCloud className="w-7 h-7 mx-auto text-[#588B76] mb-2" />
            <p className="text-xs font-bold text-slate-800">
              Drag and drop multiple photos here, or click to browse
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports high-resolution JPG, PNG, WEBP (up to 15MB each). Images are automatically optimized before storage.
            </p>
          </div>

          {/* Photos Grid */}
          {selectedAlbum.photos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Camera className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-xs font-medium text-slate-600">No photos in this album yet.</p>
              <p className="text-[11px] text-slate-400">
                Click the upload box above or &quot;Add Photos to Album&quot; to begin adding memories.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {selectedAlbum.photos.length} photos in album order. Drag or click arrows to reorder.
                </span>
                <span className="font-semibold text-slate-700">
                  Cover Photo:{' '}
                  <span className="text-[#588B76]">
                    {selectedAlbum.photos.findIndex((p) => p.imageUrl === selectedAlbum.coverPhotoUrl) !== -1
                      ? `Photo #${selectedAlbum.photos.findIndex((p) => p.imageUrl === selectedAlbum.coverPhotoUrl) + 1}`
                      : 'First Photo'}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedAlbum.photos.map((photo, index) => {
                  const isCover =
                    photo.imageUrl === selectedAlbum.coverPhotoUrl ||
                    (!selectedAlbum.coverPhotoUrl && index === 0);

                  return (
                    <div
                      key={photo.id}
                      className={`relative bg-white border rounded-sm overflow-hidden group shadow-2xs transition ${
                        isCover ? 'border-2 border-[#18392B] ring-2 ring-[#18392B]/10' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => setPreviewPhotoUrl(photo.imageUrl)}
                        className="h-36 w-full relative bg-slate-100 cursor-pointer"
                      >
                        <Image
                          src={photo.imageUrl}
                          alt={photo.caption || photo.fileName || 'PCM Student Life Photo'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />

                        {/* Badges */}
                        {isCover && (
                          <span className="absolute top-1.5 left-1.5 bg-[#18392B] text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs shadow-xs">
                            Cover
                          </span>
                        )}

                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-mono px-1 py-0.2 rounded-xs">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Photo Details & Controls */}
                      <div className="p-2 space-y-1.5 bg-white">
                        <p className="text-[11px] text-slate-700 line-clamp-1 font-medium" title={photo.caption || photo.fileName}>
                          {photo.caption || photo.fileName || 'Untitled snapshot'}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          {/* Reorder arrows */}
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMovePhoto(selectedAlbum.id, index, 'up')}
                              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-slate-100 cursor-pointer"
                              title="Move left/earlier"
                            >
                              <ChevronUp className="w-3.5 h-3.5 rotate-270" />
                            </button>
                            <button
                              type="button"
                              disabled={index === selectedAlbum.photos.length - 1}
                              onClick={() => handleMovePhoto(selectedAlbum.id, index, 'down')}
                              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-slate-100 cursor-pointer"
                              title="Move right/later"
                            >
                              <ChevronDown className="w-3.5 h-3.5 rotate-270" />
                            </button>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setStudentLifeAlbumCover(selectedAlbum.id, photo.imageUrl)}
                                className="text-[10px] text-[#18392B] hover:underline font-semibold cursor-pointer"
                                title="Set as album cover photo"
                              >
                                Set Cover
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingPhoto(photo)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xs cursor-pointer"
                              title="Edit caption"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {studentLifeAlbums.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMovingPhoto(photo);
                                  const otherAlbums = studentLifeAlbums.filter((a) => a.id !== selectedAlbum.id);
                                  setTargetMoveAlbumId(otherAlbums[0]?.id || '');
                                }}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xs cursor-pointer"
                                title="Move to another album"
                              >
                                <Move className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Delete this photo from the album?')) {
                                  deleteStudentLifePhoto(selectedAlbum.id, photo.id);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xs cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MULTI-IMAGE UPLOAD DRAWER / MODAL */}
      {isUploadDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-sm max-w-2xl w-full p-6 space-y-4 shadow-xl my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-sm bg-[#588B76]/10 text-[#588B76]">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#18392B]">
                    Multi-Image Photo Upload
                  </h4>
                  <p className="text-xs text-slate-500">
                    Upload multiple images at once to PCM Student Life photo albums.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isUploading) {
                    if (window.confirm('An upload is in progress. Are you sure you want to exit?')) {
                      handleCancelUpload();
                      setIsUploadDrawerOpen(false);
                    }
                  } else {
                    setIsUploadDrawerOpen(false);
                  }
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Album Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Target Album</label>
              <select
                value={uploadTargetAlbumId}
                onChange={(e) => setUploadTargetAlbumId(e.target.value)}
                disabled={isUploading}
                className="w-full text-xs p-2 border border-slate-200 rounded-sm bg-white"
              >
                {studentLifeAlbums.map((alb) => (
                  <option key={alb.id} value={alb.id}>
                    {alb.title} ({alb.photos?.length || 0} photos)
                  </option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition ${
                isDragOver
                  ? 'border-[#588B76] bg-[#588B76]/10'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <UploadCloud className="w-8 h-8 text-[#588B76] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Click or drag & drop images to add to the queue
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Select multiple JPG, PNG, or WEBP photos. Max 15MB each.
              </p>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[260px]">
              {uploadQueue.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 py-8">
                  No images selected yet. Choose files to preview before uploading.
                </div>
              ) : (
                uploadQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 border border-slate-200 rounded-sm bg-slate-50/50"
                  >
                    <div className="relative w-12 h-12 bg-slate-200 rounded-xs overflow-hidden shrink-0">
                      <Image
                        src={item.previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[200px]" title={item.file.name}>
                          {item.file.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>

                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUploadQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, caption: val } : q))
                          );
                        }}
                        disabled={isUploading}
                        placeholder="Optional caption for this photo..."
                        className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded-xs bg-white"
                      />

                      {/* Status indicator / progress bar */}
                      {item.status === 'uploading' && (
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-[#588B76] h-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded successfully
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {item.errorMessage || 'Upload failed'}
                        </span>
                      )}
                    </div>

                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQueueItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                {uploadQueue.length} {uploadQueue.length === 1 ? 'file' : 'files'} in queue
              </span>

              <div className="flex items-center gap-2">
                {isUploading ? (
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-sm hover:bg-red-100 cursor-pointer"
                  >
                    Cancel Upload
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsUploadDrawerOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 font-semibold rounded-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStartUpload}
                  disabled={uploadQueue.length === 0 || isUploading}
                  className="px-4 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white font-bold rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Photos...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Publish {uploadQueue.length} Photos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ALBUM MODAL */}
      {isAlbumModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-serif font-bold text-base text-[#18392B]">
                {editingAlbumData.id ? 'Edit Photo Album' : 'Create New Photo Album'}
              </h4>
              <button
                type="button"
                onClick={() => setIsAlbumModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Album Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingAlbumData.title}
                  onChange={(e) => setEditingAlbumData({ ...editingAlbumData, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-sm font-serif text-sm"
                  placeholder="e.g. PCM Student Fellowship 2026"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingAlbumData.description}
                  onChange={(e) => setEditingAlbumData({ ...editingAlbumData, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-sm leading-relaxed"
                  placeholder="Describe the occasion, highlights, and spiritual experiences..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event / Ministry Name</label>
                  <input
                    type="text"
                    value={editingAlbumData.eventName}
                    onChange={(e) => setEditingAlbumData({ ...editingAlbumData, eventName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-sm"
                    placeholder="e.g. Annual Mountain Practicum"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Date</label>
                  <input
                    type="text"
                    value={editingAlbumData.eventDate}
                    onChange={(e) => setEditingAlbumData({ ...editingAlbumData, eventDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-sm font-mono"
                    placeholder="e.g. September 2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editingAlbumData.location}
                    onChange={(e) => setEditingAlbumData({ ...editingAlbumData, location: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-sm"
                    placeholder="e.g. Lamtang, Benguet"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publish Status</label>
                  <select
                    value={editingAlbumData.status}
                    onChange={(e) =>
                      setEditingAlbumData({ ...editingAlbumData, status: e.target.value as any })
                    }
                    className="w-full p-2 border border-slate-200 rounded-sm bg-white"
                  >
                    <option value="published">Published (Visible to Public)</option>
                    <option value="unpublished">Unpublished (Draft / Hidden)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAlbumModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAlbum}
                className="px-4 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-sm cursor-pointer shadow-xs"
              >
                {editingAlbumData.id ? 'Save Changes' : 'Create Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PHOTO CAPTION MODAL */}
      {editingPhoto && selectedAlbum && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="font-serif font-bold text-base text-[#18392B]">
              Edit Photo Details
            </h4>

            <div className="space-y-3 text-xs">
              <div className="h-40 w-full relative bg-slate-100 rounded-xs overflow-hidden border border-slate-200">
                <Image
                  src={editingPhoto.imageUrl}
                  alt="Edit photo"
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Caption</label>
                <textarea
                  rows={3}
                  value={editingPhoto.caption || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-sm leading-relaxed"
                  placeholder="Add a detailed caption describing this campus moment..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  value={editingPhoto.fileName || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, fileName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-sm font-mono text-slate-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateStudentLifePhoto(selectedAlbum.id, editingPhoto.id, {
                    caption: editingPhoto.caption,
                    fileName: editingPhoto.fileName,
                  });
                  setEditingPhoto(null);
                  addToast('success', 'Caption Updated', 'Photo caption saved.');
                }}
                className="px-4 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-sm cursor-pointer shadow-xs"
              >
                Save Caption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE PHOTO MODAL */}
      {movingPhoto && selectedAlbum && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="font-serif font-bold text-base text-[#18392B]">
              Move Photo to Another Album
            </h4>

            <p className="text-xs text-slate-600">
              Select destination album to transfer this image from &quot;{selectedAlbum.title}&quot;.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Destination Album</label>
              <select
                value={targetMoveAlbumId}
                onChange={(e) => setTargetMoveAlbumId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-sm bg-white"
              >
                {studentLifeAlbums
                  .filter((a) => a.id !== selectedAlbum.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.photos?.length || 0} photos)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMovingPhoto(null)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMovePhoto}
                className="px-4 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-sm cursor-pointer shadow-xs"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL FOR ADMIN */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <button
            type="button"
            onClick={() => setPreviewPhotoUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <Image
              src={previewPhotoUrl}
              alt="Preview"
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
