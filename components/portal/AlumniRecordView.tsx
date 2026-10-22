'use client';

import React from 'react';
import { Award, BookOpen, GraduationCap, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { StudentAvatar } from '@/components/common/StudentAvatar';
import { subjectsByTerm } from '@/lib/alumni';
import { academicStanding } from '@/lib/studentDefaults';

const fmtDate = (d?: string) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '');

// Student Portal for a graduate: their own PCM record (read-only) — graduation, academic record by term and
// personal details. The record is kept by the Registrar; changes made there show here right away.
export const AlumniRecordView: React.FC = () => {
  const { studentProfile: p, firebaseAuthUser, studentLogout } = usePCM();
  const a: any = (p as any).alumni || {};
  const standing = academicStanding(p);
  const terms = subjectsByTerm(p.subjectHistory || []);
  const name = p.fullName || p.name || 'Graduate';

  return (
    <div className="min-h-[85vh] w-full bg-slate-50 px-4 py-8 font-sans print:bg-white" data-testid="alumni-portal">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#18392B] p-5 text-white sm:flex-row sm:items-center sm:justify-between print:bg-white print:text-black">
          <div className="flex items-center gap-4">
            <StudentAvatar photo={p.avatarUrl} altPhoto={p.profilePhoto} name={name} className="h-16 w-16 rounded-2xl" />
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 print:text-black">
                <GraduationCap className="h-4 w-4" /> PCM Alumni{a.graduationYear ? ` · Class of ${a.graduationYear}` : ''}
              </p>
              <h1 className="font-serif text-2xl font-bold">{name}</h1>
              <p className="text-xs text-emerald-100 print:text-black">
                Student ID <span className="font-mono font-bold">{p.studentId}</span> · {a.degreeConferred || p.degreeProgram || p.program}
              </p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={studentLogout} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Graduated', a.graduationDate ? fmtDate(a.graduationDate) : a.graduationYear ? String(a.graduationYear) : '—'],
            ['Honors', a.honors || '—'],
            ['General weighted average', standing.gpa ? standing.gpa.toFixed(2) : '—'],
            ['Units earned', String(standing.unitsEarned)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="font-serif text-lg font-bold text-[#18392B]">{value}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
            <BookOpen className="h-5 w-5 text-[#588B76]" /> Academic record
          </h2>
          {terms.length === 0 ? (
            <p className="text-sm text-slate-500">Your subjects have not been entered yet. The Registrar’s Office is adding records from before the online system.</p>
          ) : (
            terms.map((t) => (
              <div key={t.term} className="overflow-x-auto rounded-xl border border-slate-200">
                <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-[#18392B]">
                  {t.term} <span className="font-normal text-slate-500">· {t.subjects.reduce((n, s) => n + (Number(s.units) || 0), 0)} units</span>
                </p>
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Subject</th>
                      <th className="p-2">Units</th>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {t.subjects.map((s, i) => (
                      <tr key={s.id || `${s.code}-${i}`}>
                        <td className="p-2 font-mono font-bold text-[#18392B]">{s.code}</td>
                        <td className="p-2">{s.title}</td>
                        <td className="p-2 font-mono">{s.units}</td>
                        <td className="p-2 font-mono">{String(s.finalGrade ?? s.grade ?? '') || '—'}</td>
                        <td className="p-2">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-700">
            <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#18392B]">
              <Award className="h-4 w-4 text-[#588B76]" /> Graduation
            </h2>
            <p><strong>Program:</strong> {p.degreeProgram || p.program || '—'}</p>
            <p><strong>Degree conferred:</strong> {a.degreeConferred || '—'}</p>
            {a.yearEntered && <p><strong>Entered PCM:</strong> {a.yearEntered}</p>}
            <p><strong>Graduated:</strong> {a.graduationDate ? fmtDate(a.graduationDate) : a.graduationYear || '—'}</p>
            {a.honors && <p><strong>Honors:</strong> {a.honors}</p>}
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-700">
            <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#18392B]">
              <Mail className="h-4 w-4 text-[#588B76]" /> Personal information
            </h2>
            <p><strong>Name:</strong> {name}</p>
            {p.dateOfBirth && <p><strong>Date of birth:</strong> {fmtDate(p.dateOfBirth)}</p>}
            <p><strong>Gmail:</strong> {p.email || firebaseAuthUser?.email || '—'}</p>
            {(p.mobileNumber || p.phone) && <p><strong>Mobile:</strong> {p.mobileNumber || p.phone}</p>}
            {(p.currentAddress || p.address) && <p><strong>Address:</strong> {p.currentAddress || p.address}</p>}
          </div>
        </section>

        <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-950 print:hidden">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          This is your official PCM record, kept by the Registrar’s Office and visible only to you when you sign in with this Gmail account. To correct anything,
          contact the Registrar’s Office.
        </p>
      </div>
    </div>
  );
};
