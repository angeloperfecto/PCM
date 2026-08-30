'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { FacultyMember } from '@/lib/types';
import { FacultyPortrait } from '@/components/common/FacultyPortrait';
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
} from 'lucide-react';

export const AdminFacultyTab: React.FC = () => {
  const {
    faculty,
    addFacultyMember,
    updateFacultyMember,
    deleteFacultyMember,
    addToast,
    canPerformAction,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);

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
    setIsModalOpen(true);
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
        image: formImage.trim(),
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
        image: formImage.trim(),
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

    if (confirm(`Are you sure you want to remove ${name} from the directory?`)) {
      deleteFacultyMember(id);
      addToast({ title: 'Profile Removed', message: `${name} has been removed.`, type: 'info' });
    }
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
              <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                <FacultyPortrait
                  name={fac.name}
                  imageSrc={fac.image}
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
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(fac.id, fac.name)}
                  className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              {editingFaculty ? 'Edit Directory Profile' : 'Add New Faculty / Staff Member'}
            </h3>

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
                    placeholder="e.g. Dr. Teodoro B. Balasong"
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
                    placeholder="e.g. President / Professor of Theology"
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
                    placeholder="e.g. Biblical Studies & Hermeneutics"
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
                  placeholder="e.g. B.Th., M.Div., D.Min."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Custom Portrait Image URL / Path (Optional)
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="e.g. /images/faculty/atty-laruta.svg or https://..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave empty to automatically use the official stylistically-consistent PCM faculty portrait.
                </p>
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
                    placeholder="name@pcm.ph"
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
                  placeholder="Summary of ministry experience, publications, and teaching subjects..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
