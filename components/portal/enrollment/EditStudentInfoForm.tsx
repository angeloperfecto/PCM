'use client';

import React, { useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Edit3, Lock, Save, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import type { StudentProfile } from '@/lib/types';

type FieldType = 'text' | 'tel' | 'email' | 'date' | 'number' | 'select' | 'textarea' | 'yesno';
interface FieldDef {
  key: keyof StudentProfile & string;
  label: string;
  type?: FieldType;
  options?: string[];
  placeholder?: string;
  wide?: boolean;
  /** Older field names that hold the same value; read as a fallback and kept in sync on save. */
  aliases?: (keyof StudentProfile & string)[];
}

// Everything a student may change about themselves. Official fields (Student ID, email, program,
// year level, section, status, grades, fees) stay with the Registrar; firestore.rules enforces it.
const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Personal information',
    fields: [
      { key: 'preferredName', label: 'Preferred name / nickname' },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date', aliases: ['birthDate'] },
      { key: 'placeOfBirth', label: 'Place of birth' },
      { key: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'], aliases: ['gender'] },
      { key: 'civilStatus', label: 'Civil status', type: 'select', options: ['Single', 'Married', 'Widowed', 'Separated'] },
      { key: 'nationality', label: 'Nationality', placeholder: 'Filipino' },
      { key: 'religion', label: 'Religion / denomination' },
    ],
  },
  {
    title: 'Contact & address',
    fields: [
      { key: 'mobileNumber', label: 'Mobile number', type: 'tel', placeholder: '0917 123 4567', aliases: ['phone', 'contactNumber'] },
      { key: 'facebookAccount', label: 'Facebook account / link', placeholder: 'facebook.com/username' },
      { key: 'currentAddress', label: 'Current address', wide: true, placeholder: 'House no., street, barangay', aliases: ['address'] },
      { key: 'permanentAddress', label: 'Permanent home address', wide: true },
      { key: 'city', label: 'City / municipality' },
      { key: 'province', label: 'Province' },
      { key: 'zipCode', label: 'ZIP code' },
    ],
  },
  {
    title: 'Family & guardian',
    fields: [
      { key: 'fatherName', label: "Father's full name" },
      { key: 'motherName', label: "Mother's maiden name" },
      { key: 'guardianName', label: 'Guardian name (if any)' },
      { key: 'guardianRelationship', label: 'Guardian relationship' },
      { key: 'guardianContactNumber', label: 'Guardian contact number', type: 'tel', aliases: ['guardianPhone'] },
      { key: 'guardianEmail', label: 'Guardian email', type: 'email' },
      { key: 'guardianAddress', label: 'Guardian address', wide: true },
    ],
  },
  {
    title: 'Emergency contact',
    fields: [
      { key: 'emergencyContactPerson', label: 'Contact person', aliases: ['emergencyContactName'] },
      { key: 'emergencyContactRelationship', label: 'Relationship', aliases: ['emergencyContactRelation'] },
      { key: 'emergencyContactNumber', label: 'Contact number', type: 'tel', aliases: ['emergencyContactPhone'] },
    ],
  },
  {
    title: 'Educational background',
    fields: [
      { key: 'lastSchoolAttended', label: 'Last school attended', wide: true },
      { key: 'schoolAddress', label: 'School address', wide: true },
      { key: 'highestEducationalAttainment', label: 'Highest educational attainment' },
      { key: 'previousCourse', label: 'Previous course / strand' },
      { key: 'yearGraduated', label: 'Year graduated', placeholder: 'e.g. 2024' },
      { key: 'generalAverage', label: 'General average / honors' },
      { key: 'honorsAwards', label: 'Honors & awards', type: 'textarea', wide: true },
    ],
  },
  {
    title: 'Church & ministry',
    fields: [
      { key: 'homeChurch', label: 'Home church', aliases: ['churchName'] },
      { key: 'churchAddress', label: 'Church address' },
      { key: 'churchContactNumber', label: 'Church contact number', type: 'tel' },
      { key: 'pastorName', label: 'Senior pastor' },
      { key: 'pastorContactNumber', label: 'Pastor contact number', type: 'tel', aliases: ['pastorPhone'] },
      { key: 'ministryRole', label: 'Ministry role' },
      { key: 'ministryDepartment', label: 'Ministry department' },
      { key: 'yearsInMinistry', label: 'Years in ministry', type: 'number' },
      { key: 'isBaptized', label: 'Water baptized?', type: 'yesno', aliases: ['waterBaptized'] },
      { key: 'baptismDate', label: 'Baptism date', type: 'date' },
      { key: 'ministryExperience', label: 'Ministry experience', type: 'textarea', wide: true },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

function readValue(p: StudentProfile, f: FieldDef): string {
  for (const k of [f.key, ...(f.aliases || [])]) {
    const v = (p as any)[k];
    if (f.type === 'yesno' && typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return '';
}

function ageFrom(dateOfBirth: string): number | undefined {
  const d = new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : undefined;
}

export const EditStudentInfoForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { studentProfile, addToast } = usePCM();
  const initial = useMemo(() => Object.fromEntries(ALL_FIELDS.map((f) => [f.key, readValue(studentProfile, f)])), [studentProfile]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const changed = ALL_FIELDS.filter((f) => (values[f.key] || '').trim() !== (initial[f.key] || '').trim());

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (changed.length === 0) {
      onClose();
      return;
    }
    const dob = values.dateOfBirth;
    if (dob && dob > new Date().toISOString().slice(0, 10)) return setError('Date of birth cannot be in the future.');
    if (values.guardianEmail && !/^\S+@\S+\.\S+$/.test(values.guardianEmail.trim())) return setError('Enter a valid guardian email address.');

    // Write only what changed (plus the older field names that mirror it), so the update never
    // touches Registrar-controlled fields.
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const f of changed) {
      const raw = (values[f.key] || '').trim();
      const value = f.type === 'yesno' ? raw === 'Yes' : f.type === 'number' ? (raw === '' ? '' : Number(raw)) : raw;
      for (const k of [f.key, ...(f.aliases || [])]) updates[k] = value;
      if (f.key === 'dateOfBirth') {
        const age = ageFrom(raw);
        if (age !== undefined) updates.age = age;
      }
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'studentProfiles', studentProfile.id), updates);
      addToast('success', 'Information saved', `${changed.length} detail${changed.length === 1 ? '' : 's'} updated in your student record.`);
      onClose();
    } catch (err: any) {
      setError(
        err?.code === 'permission-denied'
          ? 'Your changes could not be saved because this record is not linked to your account. Please contact the Registrar.'
          : 'Your changes could not be saved. Please check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#588B76]';
  const locked: [string, string | undefined][] = [
    ['Full name', [studentProfile.firstName, studentProfile.middleName, studentProfile.lastName, studentProfile.suffix].filter(Boolean).join(' ') || studentProfile.fullName],
    ['Student ID', studentProfile.studentId],
    ['Email (Google sign-in)', studentProfile.email],
    ['Program', studentProfile.degreeProgram || studentProfile.program],
    ['Year level / section', [studentProfile.yearLevel, studentProfile.section].filter(Boolean).join(' • ')],
    ['Enrollment status', String(studentProfile.enrollmentStatus || '')],
  ];

  return (
    <form onSubmit={save} className="bg-emerald-50/50 rounded-2xl border-2 border-emerald-300 p-4 sm:p-6 space-y-5 shadow-sm" data-testid="edit-student-info">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
        <h3 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[#588B76]" /> Edit my information
        </h3>
        <span className="text-xs text-slate-500">Changes are saved to your official student record.</span>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
        <p className="mb-2 flex items-center gap-1.5 font-bold text-slate-700">
          <Lock className="h-3.5 w-3.5 text-slate-500" /> Managed by the Registrar
        </p>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {locked.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="font-semibold text-slate-800 break-words">{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[11px] text-slate-500">To correct these, contact the Office of the Registrar with a supporting document (e.g. PSA birth certificate).</p>
      </section>

      {SECTIONS.map((section) => (
        <fieldset key={section.title} className="space-y-3">
          <legend className="font-serif text-sm font-bold text-[#18392B]">{section.title}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {section.fields.map((f) => (
              <label key={f.key} className={`block ${f.wide ? 'sm:col-span-2' : ''}`}>
                <span className="block font-bold text-slate-700 mb-1">{f.label}</span>
                {f.type === 'select' || f.type === 'yesno' ? (
                  <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} className={input}>
                    <option value="">—</option>
                    {(f.type === 'yesno' ? ['Yes', 'No'] : f.options || []).map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                    {f.type === 'select' && values[f.key] && !(f.options || []).includes(values[f.key]) && <option>{values[f.key]}</option>}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea rows={2} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} className={input} />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={values[f.key]}
                    min={f.type === 'number' ? 0 : undefined}
                    max={f.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className={`${input} ${f.type === 'tel' ? 'font-mono' : ''}`}
                  />
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-emerald-200">
        <span className="mr-auto text-[11px] text-slate-500">{changed.length ? `${changed.length} unsaved change${changed.length === 1 ? '' : 's'}` : 'No changes yet'}</span>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button type="submit" disabled={saving} className="bg-[#18392B] hover:bg-[#588B76] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save my information'}
        </button>
      </div>
    </form>
  );
};
