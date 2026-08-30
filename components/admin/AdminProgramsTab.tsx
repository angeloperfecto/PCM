'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Program } from '@/lib/types';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Star,
  Search,
  Award,
} from 'lucide-react';

export const AdminProgramsTab: React.FC = () => {
  const {
    programs,
    addProgram,
    updateProgram,
    deleteProgram,
    addToast,
    canPerformAction,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Modal Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDegreeLevel, setFormDegreeLevel] = useState<'SHS' | 'Associate' | 'Undergraduate' | 'Graduate' | 'Certificate'>('Undergraduate');
  const [formDuration, setFormDuration] = useState('4 Years (8 Semesters)');
  const [formUnits, setFormUnits] = useState(132);
  const [formTuition, setFormTuition] = useState('₱14,500 / semester');
  const [formDescription, setFormDescription] = useState('');
  const [formOutcomes, setFormOutcomes] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);

  const openNewModal = () => {
    setEditingProgram(null);
    setFormName('');
    setFormCode('');
    setFormDegreeLevel('Undergraduate');
    setFormDuration('4 Years (8 Semesters)');
    setFormUnits(132);
    setFormTuition('₱14,500 / semester');
    setFormDescription('');
    setFormOutcomes('Senior Pastor\nAssociate Minister\nChurch Planter\nChaplain');
    setFormFeatured(false);
    setIsModalOpen(true);
  };

  const openEditModal = (prog: Program) => {
    setEditingProgram(prog);
    setFormName(prog.name);
    setFormCode(prog.code || '');
    setFormDegreeLevel((prog.degreeLevel as any) || 'Undergraduate');
    setFormDuration(prog.duration);
    setFormUnits(prog.totalUnits || prog.credits || 120);
    setFormTuition(prog.tuitionEst || '₱14,500 / semester');
    setFormDescription(prog.description || prog.shortDescription || prog.fullDescription || '');
    setFormOutcomes((prog.careerOutcomes || prog.careerOpportunities || []).join('\n'));
    setFormFeatured(prog.featured || false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to modify academic curricula.',
        type: 'error',
      });
      return;
    }

    if (!formName.trim()) {
      addToast({ title: 'Missing Title', message: 'Program name is required.', type: 'error' });
      return;
    }

    const outcomesArray = formOutcomes
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProgram) {
      updateProgram(editingProgram.id, {
        name: formName.trim(),
        code: formCode.trim(),
        degreeLevel: formDegreeLevel,
        duration: formDuration.trim(),
        totalUnits: Number(formUnits),
        tuitionEst: formTuition.trim(),
        description: formDescription.trim(),
        careerOutcomes: outcomesArray,
        featured: formFeatured,
      });
      addToast({ title: 'Program Updated', message: `${formName} has been updated.`, type: 'success' });
    } else {
      addProgram({
        name: formName.trim(),
        code: formCode.trim() || 'PCM-PROG',
        degreeLevel: formDegreeLevel,
        duration: formDuration.trim(),
        totalUnits: Number(formUnits),
        tuitionEst: formTuition.trim(),
        description: formDescription.trim(),
        curriculum: [],
        careerOutcomes: outcomesArray,
        admissionReqs: ['Official Form 138/137 or Transcript of Records', 'Pastor Recommendation Letter', 'Personal Christian Testimony Statement'],
        featured: formFeatured,
      });
      addToast({ title: 'Program Created', message: `${formName} added to the catalog.`, type: 'success' });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!canPerformAction('Super Admin')) {
      addToast({
        title: 'Super Admin Required',
        message: 'Only Super Administrators can delete academic programs.',
        type: 'error',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteProgram(id);
      addToast({ title: 'Program Deleted', message: `${name} has been removed.`, type: 'info' });
    }
  };

  const filteredPrograms = programs.filter((p) => {
    const desc = p.description || p.shortDescription || p.fullDescription || '';
    const level = p.degreeLevel || p.level || '';
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase()));

    const matchesLevel =
      levelFilter === 'all' || level.toLowerCase() === levelFilter.toLowerCase();

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#588B76]" />
            Academic Programs & Degree Catalog Manager
          </h2>
          <p className="text-xs text-slate-500">
            Add, update, or edit academic curricula, durations, unit requirements, and career outcomes.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Academic Program</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search programs by name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {['all', 'Undergraduate', 'Graduate', 'Associate', 'SHS', 'Certificate'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-[#18392B] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrograms.map((prog) => (
          <div
            key={prog.id}
            className="p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76]/60 transition space-y-3 bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                    {prog.degreeLevel || 'Program'}
                  </span>
                  {prog.code && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {prog.code}
                    </span>
                  )}
                  {prog.featured && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base font-bold text-[#18392B]">{prog.name}</h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEditModal(prog)}
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Edit Program"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(prog.id, prog.name)}
                  className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                  title="Delete Program"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {prog.description || prog.shortDescription || prog.fullDescription}
            </p>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div>
                Duration: <strong className="text-slate-800">{prog.duration}</strong>
              </div>
              <div>
                Total Units: <strong className="text-slate-800">{prog.totalUnits || 'N/A'}</strong>
              </div>
              <div className="col-span-2">
                Tuition Est:{' '}
                <strong className="text-slate-800">{prog.tuitionEst || 'Standard Rates'}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Program Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              {editingProgram ? 'Edit Academic Program' : 'Add New Academic Program'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    Degree / Program Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Bachelor of Theology (B.Th.)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Program Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. BTH-4YR"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Degree Level
                  </label>
                  <select
                    value={formDegreeLevel}
                    onChange={(e) => setFormDegreeLevel(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Associate">Associate (2-Year)</option>
                    <option value="SHS">Senior High School (GAS)</option>
                    <option value="Certificate">Certificate / Diploma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 4 Years (8 Semesters)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Total Academic Units
                  </label>
                  <input
                    type="number"
                    value={formUnits}
                    onChange={(e) => setFormUnits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tuition Estimate (Public Display)
                </label>
                <input
                  type="text"
                  value={formTuition}
                  onChange={(e) => setFormTuition(e.target.value)}
                  placeholder="e.g. ₱14,500 / semester"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Program Overview & Mission Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Career / Ministry Outcomes (One per line)
                </label>
                <textarea
                  rows={3}
                  value={formOutcomes}
                  onChange={(e) => setFormOutcomes(e.target.value)}
                  placeholder="Pastoral Ministry&#10;Church Planting&#10;Military Chaplaincy"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="program-featured-checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="rounded text-[#588B76] focus:ring-[#588B76]"
                />
                <label htmlFor="program-featured-checkbox" className="text-slate-700 font-medium">
                  Feature prominently on Homepage & Quick Navigation
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
                  Save Academic Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
