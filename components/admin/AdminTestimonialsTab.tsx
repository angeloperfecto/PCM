'use client';

import React, { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Edit2, Eye, EyeOff, ImagePlus, Plus, Quote, Search, Trash2, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import type { Testimonial } from '@/lib/types';
import { isValidImageSrc } from '@/lib/utils';
import { blobToDataUrl, compressImageFile } from '@/lib/firebase';
import { isTestimonialPublished, sortTestimonials } from '@/lib/testimonials';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

const CATEGORIES: Testimonial['category'][] = ['Alumni', 'Student', 'Faculty', 'Ministry Leader'];
const QUOTE_MIN = 20;
const QUOTE_MAX = 800;
// Photos are resized to a small square and stored inline, so they never depend on file storage.
const PHOTO_MAX_BYTES = 200 * 1024;

type Draft = Omit<Testimonial, 'id'>;

const emptyDraft = (order: number): Draft => ({
  name: '',
  role: '',
  category: 'Alumni',
  quote: '',
  programOrMinistry: '',
  batchOrYear: '',
  avatarUrl: '',
  status: 'Published',
  order,
});

export const AdminTestimonialsTab: React.FC = () => {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial } = usePCM();
  const sorted = useMemo(() => sortTestimonials(testimonials), [testimonials]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Testimonial['category']>('all');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = sorted.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    const q = search.trim().toLowerCase();
    return !q || [t.name, t.role, t.quote, t.programOrMinistry].some((v) => (v || '').toLowerCase().includes(q));
  });
  const publishedCount = testimonials.filter(isTestimonialPublished).length;

  const openNew = () => {
    setFormError('');
    setEditing({ id: null, draft: emptyDraft(sorted.length + 1) });
  };
  const openEdit = (t: Testimonial) => {
    setFormError('');
    const { id, ...rest } = t;
    setEditing({ id, draft: { ...emptyDraft(t.order ?? sorted.indexOf(t) + 1), ...rest, status: rest.status || 'Published' } });
  };
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, [key]: value } } : e));

  const handlePhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Choose an image file (JPG, PNG or WEBP).');
      return;
    }
    setPhotoBusy(true);
    try {
      const small = await compressImageFile(file, 320, 320, 0.85);
      const dataUrl = await blobToDataUrl(small);
      if (dataUrl.length > PHOTO_MAX_BYTES * 1.37) {
        setFormError('That photo is still too large after resizing. Try a different image.');
        return;
      }
      setField('avatarUrl', dataUrl);
      setFormError('');
    } catch {
      setFormError('The photo could not be read. Try a different image.');
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const validate = (d: Draft): string => {
    if (!d.name.trim()) return 'Enter the person’s name.';
    if (!d.role.trim()) return 'Enter their role or title (e.g. Senior Pastor & Church Planter).';
    const len = d.quote.trim().length;
    if (len < QUOTE_MIN) return `The testimony must be at least ${QUOTE_MIN} characters.`;
    if (len > QUOTE_MAX) return `The testimony must be ${QUOTE_MAX} characters or fewer (currently ${len}).`;
    if (d.avatarUrl && !d.avatarUrl.startsWith('data:image/') && !/^https:\/\//i.test(d.avatarUrl.trim()))
      return 'Photo link must start with https://';
    return '';
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const d = editing.draft;
    const cleaned: Draft = {
      ...d,
      name: d.name.trim(),
      role: d.role.trim(),
      quote: d.quote.trim().replace(/^[“"]+|[”"]+$/g, ''),
      programOrMinistry: d.programOrMinistry.trim(),
      batchOrYear: (d.batchOrYear || '').trim(),
      avatarUrl: (d.avatarUrl || '').trim(),
    };
    const problem = validate(cleaned);
    setFormError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const ok = editing.id ? await updateTestimonial(editing.id, cleaned) : !!(await addTestimonial(cleaned));
      if (ok) setEditing(null);
      else setFormError('The testimonial was not saved. Check your permissions or connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Rewrites order 1..n for the whole list so the sequence stays consistent.
  const move = async (t: Testimonial, dir: -1 | 1) => {
    const idx = sorted.findIndex((x) => x.id === t.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setReordering(true);
    try {
      for (const [i, item] of next.entries()) {
        if (item.order !== i + 1) await updateTestimonial(item.id, { order: i + 1 }, { silent: true });
      }
    } finally {
      setReordering(false);
    }
  };

  const togglePublished = (t: Testimonial) =>
    updateTestimonial(t.id, { status: isTestimonialPublished(t) ? 'Draft' : 'Published' });

  const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#588B76] focus:outline-none';
  const label = 'block text-[11px] font-semibold text-slate-600 mb-1';

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Quote className="w-5 h-5 text-[#588B76]" /> Testimonials — “Hear From Our Community”
          </h3>
          <p className="text-xs text-slate-500">
            Quotes shown on the homepage slider. {publishedCount} published · {testimonials.length - publishedCount} draft
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, quote or program…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(['all', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                categoryFilter === c ? 'bg-[#18392B] text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          {testimonials.length === 0 ? 'No testimonials yet. Add the first one.' : 'No testimonials match your search.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((t) => {
            const pos = sorted.findIndex((x) => x.id === t.id);
            const published = isTestimonialPublished(t);
            return (
              <li
                key={t.id}
                className={`bg-white rounded-2xl border p-4 flex flex-col md:flex-row gap-4 ${published ? 'border-slate-200' : 'border-dashed border-amber-300 bg-amber-50/30'}`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {isValidImageSrc(t.avatarUrl) ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#588B76] shrink-0">
                      <Image src={t.avatarUrl!.trim()} alt={t.name} fill sizes="48px" className="object-cover" unoptimized referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#18392B] text-white flex items-center justify-center font-serif font-bold shrink-0">
                      {t.name.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-400">#{pos + 1}</span>
                      <span className="font-serif font-bold text-sm text-[#18392B]">{t.name}</span>
                      <span className="text-[10px] font-bold uppercase bg-[#18392B] text-[#D0DED8] px-2 py-0.5 rounded-full">{t.category}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                      >
                        {published ? 'Published' : 'Draft (hidden)'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#588B76]">{t.role}</p>
                    {t.programOrMinistry && <p className="text-[11px] text-slate-500">{t.programOrMinistry}</p>}
                    <p className="text-xs text-slate-700 italic line-clamp-2">“{t.quote}”</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 md:self-center shrink-0">
                  <button onClick={() => move(t, -1)} disabled={reordering || pos <= 0} title="Move earlier" aria-label={`Move ${t.name} earlier`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(t, 1)} disabled={reordering || pos >= sorted.length - 1} title="Move later" aria-label={`Move ${t.name} later`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => togglePublished(t)} title={published ? 'Hide from homepage' : 'Publish on homepage'} aria-label={published ? `Hide ${t.name}` : `Publish ${t.name}`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                    {published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-600" />}
                  </button>
                  <button onClick={() => openEdit(t)} title="Edit testimonial" aria-label={`Edit testimonial from ${t.name}`} className="p-2 rounded-lg text-[#588B76] hover:bg-emerald-50 cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPendingDelete(t)} title="Delete testimonial" aria-label={`Delete testimonial from ${t.name}`} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={editing.id ? 'Edit testimonial' : 'Add testimonial'}>
          <form onSubmit={save} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">{editing.id ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {isValidImageSrc(editing.draft.avatarUrl) ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#588B76] shrink-0">
                  <Image src={editing.draft.avatarUrl!.trim()} alt="Photo preview" fill sizes="64px" className="object-cover" unoptimized referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                  <ImagePlus className="w-6 h-6" />
                </div>
              )}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50">
                    {photoBusy ? 'Processing…' : 'Upload photo'}
                  </button>
                  {editing.draft.avatarUrl && (
                    <button type="button" onClick={() => setField('avatarUrl', '')} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50">
                      Remove photo
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                <input
                  value={editing.draft.avatarUrl?.startsWith('data:') ? '' : editing.draft.avatarUrl || ''}
                  onChange={(e) => setField('avatarUrl', e.target.value)}
                  placeholder={editing.draft.avatarUrl?.startsWith('data:') ? 'Uploaded photo in use' : 'or paste a photo link (https://…)'}
                  className={input}
                  aria-label="Photo link"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className={label}>Name *</span>
                <input value={editing.draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="Pastor Joshua Mendoza" className={input} />
              </label>
              <label className="block">
                <span className={label}>Role / title *</span>
                <input value={editing.draft.role} onChange={(e) => setField('role', e.target.value)} placeholder="Senior Pastor & Church Planter" className={input} />
              </label>
              <label className="block">
                <span className={label}>Category (shown as “… Spotlight”)</span>
                <select value={editing.draft.category} onChange={(e) => setField('category', e.target.value as Testimonial['category'])} className={input}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={label}>Status</span>
                <select value={editing.draft.status} onChange={(e) => setField('status', e.target.value as Testimonial['status'])} className={input}>
                  <option value="Published">Published (shown on homepage)</option>
                  <option value="Draft">Draft (hidden)</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className={label}>Program, class or church (line under the role)</span>
                <input value={editing.draft.programOrMinistry} onChange={(e) => setField('programOrMinistry', e.target.value)} placeholder="B.Th. Class of 2018 | Grace Bible Church, Cavite" className={input} />
              </label>
            </div>

            <label className="block">
              <span className={label}>
                Testimony * <span className="font-normal text-slate-400">({editing.draft.quote.trim().length}/{QUOTE_MAX})</span>
              </span>
              <textarea
                value={editing.draft.quote}
                onChange={(e) => setField('quote', e.target.value)}
                rows={6}
                placeholder="Write the testimony without quotation marks; they are added automatically."
                className={input}
              />
            </label>

            {formError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={saving || photoBusy} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
                {saving ? 'Saving…' : editing.id ? 'Save Changes' : 'Add Testimonial'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        title="Delete this testimonial?"
        itemName={pendingDelete ? `${pendingDelete.name} — ${pendingDelete.role}` : undefined}
        message="It is removed from the homepage and the database. To hide it temporarily instead, set it to Draft."
        isLoading={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          try {
            if (await deleteTestimonial(pendingDelete.id)) setPendingDelete(null);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
};
