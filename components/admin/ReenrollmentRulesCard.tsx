'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { reenrollmentRules } from '@/lib/reenrollment';
import type { ReenrollmentRequirementTemplate } from '@/lib/types';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

interface Draft {
  passingGrade: string;
  progressionMinPercent: string;
  requireAcademicClearance: boolean;
  requireFinancialClearance: boolean;
  documents: ReenrollmentRequirementTemplate[];
}

// PCM's rules for closing terms and re-enrolling returning students. Nothing here has a built-in
// academic policy: the passing grade must be set before a term can be closed.
export const ReenrollmentRulesCard: React.FC = () => {
  const { enrollmentSystemConfig, updateEnrollmentSystemConfig, canManageTerms } = usePCM();
  const rules = reenrollmentRules(enrollmentSystemConfig);
  const fromConfig = (): Draft => ({
    passingGrade: rules.passingGrade == null ? '' : rules.passingGrade.toFixed(2),
    progressionMinPercent: String(rules.progressionMinPercent),
    requireAcademicClearance: rules.requireAcademicClearance,
    requireFinancialClearance: rules.requireFinancialClearance,
    documents: rules.documents,
  });
  const key = JSON.stringify(fromConfig());
  const [draft, setDraft] = useState<Draft>(fromConfig);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(key));
  }, [key, dirty]);

  const patch = (p: Partial<Draft>) => {
    setDirty(true);
    setDraft((d) => ({ ...d, ...p }));
  };
  const setDoc = (i: number, p: Partial<ReenrollmentRequirementTemplate>) =>
    patch({ documents: draft.documents.map((d, j) => (j === i ? { ...d, ...p } : d)) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.documents.length) return;
    const next = [...draft.documents];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ documents: next });
  };

  const save = async () => {
    const pg = Number(draft.passingGrade);
    if (draft.passingGrade.trim() && !(pg >= 1 && pg <= 5)) return setError('The passing grade must be between 1.00 and 5.00.');
    const pct = Number(draft.progressionMinPercent);
    if (!(pct >= 1 && pct <= 100)) return setError('The progression rule must be between 1% and 100%.');
    const docs = draft.documents.map((d) => ({ ...d, name: d.name.trim(), description: (d.description || '').trim() })).filter((d) => d.name);
    const names = docs.map((d) => d.name.toLowerCase());
    if (new Set(names).size !== names.length) return setError('Each document needs a different name.');
    setError('');
    setSaving(true);
    try {
      const used = new Set<string>();
      const list = docs.map((d) => {
        let id = d.id || `reenroll-${slug(d.name)}`;
        while (used.has(id)) id = `${id}-2`;
        used.add(id);
        return { id, name: d.name, description: d.description, required: d.required };
      });
      const ok = await updateEnrollmentSystemConfig({
        ...(draft.passingGrade.trim() ? { passingGrade: Math.round(pg * 100) / 100 } : {}),
        progressionMinPercent: Math.round(pct),
        reenrollment: {
          requireAcademicClearance: draft.requireAcademicClearance,
          requireFinancialClearance: draft.requireFinancialClearance,
          documents: list,
        },
      });
      if (ok !== false) setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 p-2 text-xs disabled:bg-slate-50';
  const ro = !canManageTerms;
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5" data-testid="reenrollment-rules">
      <div>
        <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
          <RefreshCcw className="w-5 h-5 text-[#588B76]" /> Re-enrollment &amp; Term Closing
        </h4>
        <p className="text-xs text-slate-500">
          Rules for closing a term and for returning students enrolling in the next term. Students see these requirements in the Student Portal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-slate-700">Highest passing final grade (1.00–5.00 scale)</span>
          <input
            type="number"
            min={1}
            max={5}
            step={0.25}
            value={draft.passingGrade}
            disabled={ro}
            onChange={(e) => patch({ passingGrade: e.target.value })}
            placeholder="e.g. 3.00"
            className={input}
          />
          <span className="block text-[11px] text-slate-500">
            When a term is closed, a final grade at or below this is recorded as Passed, above it as Failed. A term cannot be closed until this is set.
          </span>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-slate-700">Year-level progression: units of the year level that must be passed (%)</span>
          <input
            type="number"
            min={1}
            max={100}
            value={draft.progressionMinPercent}
            disabled={ro}
            onChange={(e) => patch({ progressionMinPercent: e.target.value })}
            className={input}
          />
          <span className="block text-[11px] text-slate-500">
            Used to suggest a student&apos;s next year level at the start of an academic year (from Subjects per Year Level). The Registrar confirms
            the year level when approving.
          </span>
        </label>
      </div>

      <fieldset className="space-y-2 rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-bold text-[#18392B]">Clearances verified by staff each term</legend>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={draft.requireAcademicClearance} disabled={ro} onChange={(e) => patch({ requireAcademicClearance: e.target.checked })} />
          Academic clearance (Registrar)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={draft.requireFinancialClearance} disabled={ro} onChange={(e) => patch({ requireFinancialClearance: e.target.checked })} />
          Financial clearance (Finance / Registrar)
        </label>
      </fieldset>

      <div className="space-y-2">
        <p className="text-xs font-bold text-[#18392B]">Documents returning students upload each term</p>
        {draft.documents.length === 0 && <p className="text-[11px] text-slate-500">No documents are required. Add one if PCM asks returning students for a document.</p>}
        <ol className="space-y-2">
          {draft.documents.map((d, i) => (
            <li key={d.id || i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.2fr_1.6fr_auto_auto] sm:items-center">
              <input aria-label="Document name" value={d.name} disabled={ro} onChange={(e) => setDoc(i, { name: e.target.value })} placeholder="Document name" className={input} />
              <input aria-label="Description" value={d.description || ''} disabled={ro} onChange={(e) => setDoc(i, { description: e.target.value })} placeholder="Short note for students (optional)" className={input} />
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={d.required} disabled={ro} onChange={(e) => setDoc(i, { required: e.target.checked })} /> Required
              </label>
              {!ro && (
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label={`Remove ${d.name || 'document'}`} onClick={() => patch({ documents: draft.documents.filter((_, j) => j !== i) })} className="rounded p-1.5 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {ro ? (
        <p className="text-[11px] text-slate-500">Only the Registrar or an Admin can change these rules.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => patch({ documents: [...draft.documents, { id: '', name: '', description: '', required: true }] })}
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
            {saving ? 'Saving…' : 'Save rules'}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </p>
      )}
    </div>
  );
};
