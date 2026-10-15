'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  AdmissionContact,
  EMPTY_CONTACT,
  STARTER_CONTACTS,
  deleteAdmissionContact,
  importStarterContacts,
  newContactId,
  reorderAdmissionContacts,
  saveAdmissionContact,
  useAdmissionContacts,
  validateContact,
} from '@/lib/admissionContacts';
import { ArrowDown, ArrowUp, Clock, Contact, Edit2, Eye, EyeOff, Mail, MapPin, Phone, Plus, Trash2 } from 'lucide-react';

// Admin → Admission Directory: the contacts shown in the Official Admission Directory on the
// Admissions page. Changes are live on the public site.
export const AdminAdmissionDirectoryTab: React.FC = () => {
  const { addToast, canPerformAction, currentAdminUser } = usePCM();
  const { contacts, loaded, error } = useAdmissionContacts();
  const canEdit = canPerformAction('Content Admin') || canPerformAction('Registrar');
  const actor = currentAdminUser?.name || currentAdminUser?.email || 'Admin';

  const [editing, setEditing] = useState<AdmissionContact | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdmissionContact | null>(null);

  const fail = (title: string, e: any) => {
    console.warn(title, e);
    addToast('error', title, e?.code === 'permission-denied' ? 'You do not have permission to change the admission directory.' : 'Please try again.');
  };
  const guard = () => {
    if (canEdit) return true;
    addToast('error', 'Permission denied', 'Only Content Admins, Registrars and Administrators can change the admission directory.');
    return false;
  };

  const openNew = () => {
    if (!guard()) return;
    setIsNew(true);
    setFormError('');
    setEditing({ ...EMPTY_CONTACT, id: newContactId(), order: contacts.reduce((m, c) => Math.max(m, c.order), 0) + 1 });
  };
  const openEdit = (c: AdmissionContact) => {
    if (!guard()) return;
    setIsNew(false);
    setFormError('');
    setEditing({ ...c });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !guard()) return;
    const problem = validateContact(editing);
    if (problem) {
      setFormError(problem);
      return;
    }
    setBusy(true);
    try {
      await saveAdmissionContact(editing, actor);
      addToast('success', isNew ? 'Contact added' : 'Contact updated', `${editing.name.trim()} is ${editing.visible ? 'shown' : 'hidden'} in the Admission Directory.`);
      setEditing(null);
    } catch (err) {
      fail('Could not save the contact', err);
    } finally {
      setBusy(false);
    }
  };

  const toggleVisible = async (c: AdmissionContact) => {
    if (!guard()) return;
    try {
      await saveAdmissionContact({ ...c, visible: !c.visible }, actor);
    } catch (err) {
      fail('Could not update the contact', err);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!guard()) return;
    const ids = contacts.map((c) => c.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    try {
      await reorderAdmissionContacts(ids);
    } catch (err) {
      fail('Could not change the order', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    setDeleteTarget(null);
    try {
      await deleteAdmissionContact(deleteTarget.id);
      addToast('info', 'Contact deleted', `${name} was removed from the Admission Directory.`);
    } catch (err) {
      fail('Could not delete the contact', err);
    }
  };

  const importStarter = async () => {
    if (!guard()) return;
    setBusy(true);
    try {
      const added = await importStarterContacts(contacts, actor);
      addToast('success', 'Directory imported', added ? `${added} contact${added === 1 ? '' : 's'} added. Review and edit them below.` : 'All contacts were already in the directory.');
    } catch (err) {
      fail('Could not import the directory', err);
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof AdmissionContact, label: string, opts: { placeholder?: string; required?: boolean; textarea?: boolean; type?: string } = {}) => (
    <label className="block">
      <span className="block text-slate-700 font-bold mb-1">
        {label}
        {opts.required && <span className="text-rose-600"> *</span>}
      </span>
      {opts.textarea ? (
        <textarea
          rows={2}
          value={String(editing?.[key] ?? '')}
          onChange={(e) => setEditing((p) => (p ? { ...p, [key]: e.target.value } : p))}
          placeholder={opts.placeholder}
          className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
        />
      ) : (
        <input
          type={opts.type || 'text'}
          value={String(editing?.[key] ?? '')}
          onChange={(e) => setEditing((p) => (p ? { ...p, [key]: e.target.value } : p))}
          placeholder={opts.placeholder}
          className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
        />
      )}
    </label>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Contact className="w-5 h-5 text-[#588B76]" />
            Official Admission Directory
          </h2>
          <p className="text-xs text-slate-500">
            Admissions officers and offices listed on the Admissions page (Admissions → Directory). Changes appear on the website right away.
          </p>
        </div>
        <button
          onClick={openNew}
          disabled={!canEdit}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {!canEdit && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          You can view the directory. Only Content Admins, Registrars and Administrators can change it.
        </p>
      )}
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}

      {!loaded ? (
        <p className="py-10 text-center text-xs text-slate-500">Loading the directory…</p>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[#18392B]">The Admission Directory is empty.</p>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            The Admissions page shows no contacts until you add them. You can start from the {STARTER_CONTACTS.length} contacts that were built into
            the page before, then edit or delete each one.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={importStarter}
              disabled={!canEdit || busy}
              className="bg-[#18392B] hover:bg-[#12291F] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              Import the {STARTER_CONTACTS.length} previous contacts
            </button>
            <button onClick={openNew} disabled={!canEdit} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer">
              Add a contact
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {contacts.map((c, i) => (
            <li key={c.id} className={`rounded-xl border p-4 flex flex-col lg:flex-row lg:items-center gap-4 ${c.visible ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50'}`}>
              <div className="flex lg:flex-col gap-1 shrink-0">
                <button onClick={() => move(i, -1)} disabled={!canEdit || i === 0} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 cursor-pointer" title="Move up" aria-label={`Move ${c.name} up`}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={!canEdit || i === contacts.length - 1} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 cursor-pointer" title="Move down" aria-label={`Move ${c.name} down`}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {c.department && <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#588B76]">{c.department}</span>}
                  {!c.visible && <span className="text-[10px] font-bold uppercase rounded bg-slate-200 text-slate-600 px-1.5 py-0.5">Hidden</span>}
                </div>
                <h3 className="font-serif text-base font-bold text-[#18392B]">{c.name}</h3>
                <p className="text-xs text-slate-600 font-medium">{c.role}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-600">
                  {c.email && <span className="flex items-center gap-1.5 min-w-0"><Mail className="w-3 h-3 text-[#588B76] shrink-0" /><span className="truncate font-mono">{c.email}</span></span>}
                  {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#588B76] shrink-0" /><span className="font-mono">{c.phone}</span></span>}
                  {c.office && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#588B76] shrink-0" />{c.office}</span>}
                  {c.hours && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#588B76] shrink-0" />{c.hours}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleVisible(c)} disabled={!canEdit} className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer" title={c.visible ? 'Hide from the website' : 'Show on the website'} aria-label={c.visible ? `Hide ${c.name}` : `Show ${c.name}`}>
                  {c.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(c)} disabled={!canEdit} className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer" title="Edit contact" aria-label={`Edit ${c.name}`}>
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => guard() && setDeleteTarget(c)} disabled={!canEdit} className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-40 cursor-pointer" title="Delete contact" aria-label={`Delete ${c.name}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={isNew ? 'Add contact' : 'Edit contact'}>
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-base font-bold text-[#18392B]">{isNew ? 'Add Directory Contact' : 'Edit Directory Contact'}</h3>
            <form onSubmit={save} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {field('name', 'Name', { required: true, placeholder: 'e.g. Rev. Juan Dela Cruz, M.Div.' })}
                {field('role', 'Position / role', { required: true, placeholder: 'e.g. Director of Admissions' })}
              </div>
              {field('department', 'Office / department', { placeholder: 'e.g. Office of Admissions & Student Recruitment' })}
              {field('scope', 'What they help with', { textarea: true, placeholder: 'e.g. Inquiries, admissions counseling, church endorsements' })}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {field('email', 'Email', { type: 'email', placeholder: 'e.g. admissions@pcm.ph' })}
                {field('phone', 'Phone', { placeholder: 'e.g. +63 917 000 0000' })}
              </div>
              {field('office', 'Office location', { placeholder: 'e.g. Room 102, Administration Building' })}
              {field('hours', 'Office hours', { placeholder: 'e.g. Mon – Fri: 8:00 AM – 5:00 PM PHT' })}
              <label className="flex items-center gap-2 pt-1">
                <input type="checkbox" checked={editing.visible} onChange={(e) => setEditing((p) => (p ? { ...p, visible: e.target.checked } : p))} className="rounded text-[#588B76]" />
                <span className="text-slate-700 font-medium">Show on the Admissions page</span>
              </label>
              {formError && <p className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-rose-800">{formError}</p>}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] disabled:opacity-50 text-white font-bold cursor-pointer shadow-sm">
                  {busy ? 'Saving…' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete directory contact"
        itemName={deleteTarget?.name}
        message="This removes the contact from the Official Admission Directory on the Admissions page."
        confirmLabel="Delete Contact"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
