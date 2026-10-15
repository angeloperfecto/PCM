'use client';

import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { usePCM } from '@/lib/store';
import type { GradeScaleValue, GradeSpecialCode, GradingScale } from '@/lib/types';

const EMPTY: GradingScale = { values: [], specialCodes: [], allowIncompleteSubmission: false, publishOnFinalize: true };

// PCM's grading scale: the grades professors may enter, their equivalents and remarks, and the
// special codes (e.g. INC). Nothing is built in; until it is set, grade sheets cannot be filled in.
export const GradingScaleCard: React.FC = () => {
  const { enrollmentSystemConfig, updateEnrollmentSystemConfig, canManageCurriculum } = usePCM();
  const saved: GradingScale = { ...EMPTY, ...(enrollmentSystemConfig?.gradingScale || {}) };
  const key = JSON.stringify(saved);
  const [draft, setDraft] = useState<GradingScale>(saved);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gen, setGen] = useState({ from: '', to: '', step: '' });
  const ro = !canManageCurriculum;
  const passing = Number(enrollmentSystemConfig?.passingGrade);

  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(key));
  }, [key, dirty]);

  const patch = (p: Partial<GradingScale>) => {
    setDirty(true);
    setDraft((d) => ({ ...d, ...p }));
  };
  const setValue = (i: number, p: Partial<GradeScaleValue>) => patch({ values: draft.values.map((v, j) => (j === i ? { ...v, ...p } : v)) });
  const setCode = (i: number, p: Partial<GradeSpecialCode>) => patch({ specialCodes: draft.specialCodes.map((v, j) => (j === i ? { ...v, ...p } : v)) });

  // Adds numeric grades from/to/step entered by the Registrar (remarks from the passing grade when set).
  const generate = () => {
    const from = Number(gen.from);
    const to = Number(gen.to);
    const step = Number(gen.step);
    if (!(step > 0) || Number.isNaN(from) || Number.isNaN(to) || to < from) return setError('Enter a valid range and step, e.g. 1.00 to 5.00 by 0.25.');
    const have = new Set(draft.values.map((v) => v.value));
    const added: GradeScaleValue[] = [];
    for (let x = from; x <= to + 1e-9; x += step) {
      const value = x.toFixed(2);
      if (have.has(value)) continue;
      added.push({ value, equivalent: '', description: '', remark: passing >= 1 ? (x <= passing + 1e-9 ? 'Passed' : 'Failed') : '' });
    }
    setError('');
    patch({ values: [...draft.values, ...added] });
  };

  const save = async () => {
    const values = draft.values.map((v) => ({ ...v, value: v.value.trim(), equivalent: (v.equivalent || '').trim(), description: (v.description || '').trim(), remark: v.remark.trim() })).filter((v) => v.value);
    const codes = draft.specialCodes.map((c) => ({ ...c, code: c.code.trim().toUpperCase(), meaning: c.meaning.trim(), remark: c.remark.trim() })).filter((c) => c.code);
    const all = [...values.map((v) => v.value.toUpperCase()), ...codes.map((c) => c.code)];
    if (new Set(all).size !== all.length) return setError('Each grade and code must be different.');
    if (values.some((v) => !v.remark)) return setError('Every grade needs a remark (Passed or Failed).');
    if (codes.some((c) => !c.meaning || !c.remark)) return setError('Every special code needs a meaning and a remark.');
    setError('');
    setSaving(true);
    try {
      const ok = await updateEnrollmentSystemConfig({
        gradingScale: { values, specialCodes: codes, allowIncompleteSubmission: draft.allowIncompleteSubmission, publishOnFinalize: draft.publishOnFinalize },
      });
      if (ok !== false) setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 p-1.5 text-xs disabled:bg-slate-50';
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5" data-testid="grading-scale">
      <div>
        <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#588B76]" /> Grading Scale &amp; Grade Policy
        </h4>
        <p className="text-xs text-slate-500">
          The only grades professors can enter in the Faculty Portal, with their equivalents and remarks. Grade sheets cannot be filled in until
          this is set.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-[#18392B]">Grades</p>
        {draft.values.length === 0 && <p className="text-[11px] text-slate-500">No grades yet. Add them one by one, or generate a numeric range.</p>}
        {draft.values.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead className="text-left text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="p-1">Grade</th>
                  <th className="p-1">Equivalent (e.g. 97–100)</th>
                  <th className="p-1">Description</th>
                  <th className="p-1">Remark</th>
                  <th className="p-1" />
                </tr>
              </thead>
              <tbody>
                {draft.values.map((v, i) => (
                  <tr key={i}>
                    <td className="p-1 w-24"><input aria-label="Grade" value={v.value} disabled={ro} onChange={(e) => setValue(i, { value: e.target.value })} className={input} /></td>
                    <td className="p-1"><input aria-label="Equivalent" value={v.equivalent || ''} disabled={ro} onChange={(e) => setValue(i, { equivalent: e.target.value })} className={input} /></td>
                    <td className="p-1"><input aria-label="Description" value={v.description || ''} disabled={ro} onChange={(e) => setValue(i, { description: e.target.value })} className={input} /></td>
                    <td className="p-1 w-32">
                      <select aria-label="Remark" value={v.remark} disabled={ro} onChange={(e) => setValue(i, { remark: e.target.value })} className={input}>
                        <option value="">Choose…</option>
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                    <td className="p-1 w-8">
                      {!ro && (
                        <button type="button" aria-label={`Remove grade ${v.value}`} onClick={() => patch({ values: draft.values.filter((_, j) => j !== i) })} className="rounded p-1 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!ro && (
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-slate-300 p-2 text-xs">
            <button type="button" onClick={() => patch({ values: [...draft.values, { value: '', equivalent: '', description: '', remark: '' }] })} className="inline-flex items-center gap-1 font-semibold text-[#18392B]">
              <Plus className="h-3.5 w-3.5" /> Add grade
            </button>
            <span className="text-slate-400">or generate:</span>
            {(['from', 'to', 'step'] as const).map((k) => (
              <label key={k} className="flex items-center gap-1">
                {k}
                <input type="number" step="0.01" value={gen[k]} onChange={(e) => setGen((g) => ({ ...g, [k]: e.target.value }))} className="w-20 rounded-lg border border-slate-300 p-1" aria-label={`Generate ${k}`} />
              </label>
            ))}
            <button type="button" onClick={generate} className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold hover:bg-slate-200">Generate</button>
            {passing >= 1 ? (
              <span className="text-[11px] text-slate-500">Remarks follow the passing grade ({passing.toFixed(2)}); check each one.</span>
            ) : (
              <span className="text-[11px] text-slate-500">Set the passing grade (Re-enrollment &amp; Term Closing) to fill in remarks.</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-[#18392B]">Special codes</p>
        {draft.specialCodes.length === 0 && <p className="text-[11px] text-slate-500">None (for example INC for incomplete, DRP for dropped).</p>}
        {draft.specialCodes.map((c, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[6rem_1.5fr_1fr_auto_auto] sm:items-center">
            <input aria-label="Code" value={c.code} disabled={ro} onChange={(e) => setCode(i, { code: e.target.value })} placeholder="INC" className={input} />
            <input aria-label="Meaning" value={c.meaning} disabled={ro} onChange={(e) => setCode(i, { meaning: e.target.value })} placeholder="Incomplete requirements" className={input} />
            <input aria-label="Code remark" value={c.remark} disabled={ro} onChange={(e) => setCode(i, { remark: e.target.value })} placeholder="Incomplete" className={input} />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={c.incomplete} disabled={ro} onChange={(e) => setCode(i, { incomplete: e.target.checked })} /> Not yet complete</label>
            {!ro && (
              <button type="button" aria-label={`Remove code ${c.code}`} onClick={() => patch({ specialCodes: draft.specialCodes.filter((_, j) => j !== i) })} className="rounded p-1 text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {!ro && (
          <button type="button" onClick={() => patch({ specialCodes: [...draft.specialCodes, { code: '', meaning: '', remark: '', incomplete: true }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-[#18392B]">
            <Plus className="h-3.5 w-3.5" /> Add special code
          </button>
        )}
      </div>

      <fieldset className="space-y-2 rounded-xl border border-slate-200 p-3 text-xs">
        <legend className="px-1 font-bold text-[#18392B]">Policy</legend>
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-0.5" checked={draft.allowIncompleteSubmission} disabled={ro} onChange={(e) => patch({ allowIncompleteSubmission: e.target.checked })} />
          Professors may submit a grade sheet with blank grades (each blank needs a note). When off, every student needs a grade or special code.
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-0.5" checked={draft.publishOnFinalize} disabled={ro} onChange={(e) => patch({ publishOnFinalize: e.target.checked })} />
          Publish grades to students when a grade sheet is finalized. When off, the Registrar publishes each finalized sheet separately.
        </label>
      </fieldset>

      {ro ? (
        <p className="text-[11px] text-slate-500">Only the Registrar, Academic Admin or an Admin can change the grading scale.</p>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          {dirty && (
            <button type="button" onClick={() => setDirty(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Discard changes</button>
          )}
          <button type="button" disabled={saving || !dirty} onClick={save} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save grading scale'}
          </button>
        </div>
      )}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{error}</p>}
    </div>
  );
};
