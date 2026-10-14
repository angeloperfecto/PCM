'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, FileCheck, Plus, Trash2 } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { admissionRequirementTemplates, type RequirementTemplate } from '@/lib/enrollmentWorkflow';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// The one list of admission documents. It is shown on the public Admissions page, asked for in the
// application form, used for each application's checklist (Admissions Review) and for students'
// requirement checklists (Enrollment & Records and the Student Portal).
export const AdmissionRequirementsCard: React.FC = () => {
  const { enrollmentSystemConfig, updateEnrollmentSystemConfig, canDecideAdmissions } = usePCM();
  const current = admissionRequirementTemplates(enrollmentSystemConfig);
  const currentKey = JSON.stringify(current);
  const [rows, setRows] = useState<RequirementTemplate[]>(current);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Follow the saved list until the admin starts editing.
  useEffect(() => {
    if (!dirty) setRows(JSON.parse(currentKey));
  }, [currentKey, dirty]);

  const update = (i: number, patch: Partial<RequirementTemplate>) => {
    setDirty(true);
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  };
  const move = (i: number, d: -1 | 1) => {
    setDirty(true);
    setRows((r) => {
      const next = [...r];
      const j = i + d;
      if (j < 0 || j >= next.length) return r;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = async () => {
    const cleaned = rows.map((r) => ({ ...r, name: r.name.trim(), description: (r.description || '').trim() })).filter((r) => r.name);
    if (cleaned.length === 0) return setError('Add at least one document.');
    const names = cleaned.map((r) => r.name.toLowerCase());
    if (new Set(names).size !== names.length) return setError('Each document needs a different name.');
    setError('');
    setSaving(true);
    try {
      // Existing documents keep their id, so checklists already created still match them.
      const used = new Set<string>();
      const list = cleaned.map((r) => {
        let id = r.id || `req-${slug(r.name)}`;
        while (used.has(id)) id = `${id}-2`;
        used.add(id);
        return { id, name: r.name, description: r.description, required: r.required };
      });
      const ok = await updateEnrollmentSystemConfig({ admissionRequirements: list, requiredDocumentsList: list.map((r) => r.name) });
      if (ok !== false) setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 p-2 text-xs';
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4" data-testid="admission-requirements-settings">
      <div>
        <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#588B76]" /> Admission document requirements
        </h4>
        <p className="text-xs text-slate-500">
          One list for the public Admissions page, the application form, each application&apos;s checklist and students&apos; requirement
          checklists. Applications made before a change can get new documents with &quot;Add missing documents&quot; in Admissions Review.
        </p>
      </div>

      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.id || i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.2fr_1.6fr_auto_auto] sm:items-center">
            <input aria-label="Document name" value={r.name} disabled={!canDecideAdmissions} onChange={(e) => update(i, { name: e.target.value })} placeholder="Document name" className={input} />
            <input aria-label="Description" value={r.description || ''} disabled={!canDecideAdmissions} onChange={(e) => update(i, { description: e.target.value })} placeholder="Short note for applicants (optional)" className={input} />
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={r.required} disabled={!canDecideAdmissions} onChange={(e) => update(i, { required: e.target.checked })} /> Required
            </label>
            {canDecideAdmissions && (
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button
                  type="button"
                  aria-label={`Remove ${r.name || 'document'}`}
                  onClick={() => {
                    setDirty(true);
                    setRows((x) => x.filter((_, j) => j !== i));
                  }}
                  className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>

      {canDecideAdmissions ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDirty(true);
              setRows((r) => [...r, { id: '', name: '', description: '', required: true }]);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#18392B] hover:text-[#588B76]"
          >
            <Plus className="h-3.5 w-3.5" /> Add document
          </button>
          <span className="flex-1" />
          {dirty && (
            <button type="button" onClick={() => setDirty(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Discard changes
            </button>
          )}
          <button type="button" disabled={saving || !dirty} onClick={save} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save requirements'}
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">Only the Registrar or an Admin can change this list.</p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </p>
      )}
    </div>
  );
};
