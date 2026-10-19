'use client';

import React from 'react';
import { BookOpen, Church, GraduationCap, Phone, ShieldCheck, User, Users } from 'lucide-react';
import { calculateStudentAge } from '@/lib/studentDefaults';
import type { StudentProfile } from '@/lib/types';

type Row = { label: string; value: string; wide?: boolean; mono?: boolean };
const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const first = (...vals: unknown[]) => vals.map(text).find((v) => v) || '';
const fmtDate = (d: string) => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return d;
  const t = new Date(`${d.slice(0, 10)}T00:00:00`);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

/** Registration-form fields counted for "profile completeness" (as answered on the form). */
const COMPLETENESS_KEYS = [
  'firstName', 'lastName', 'dateOfBirth', 'placeOfBirth', 'sex', 'civilStatus', 'nationality', 'religion',
  'mobileNumber', 'email', 'currentAddress', 'permanentAddress', 'city', 'province', 'zipCode',
  'emergencyContactPerson', 'emergencyContactNumber', 'emergencyContactRelationship',
  'lastSchoolAttended', 'highestEducationalAttainment', 'yearGraduated',
  'homeChurch', 'pastorName', 'pastorContactNumber',
];

export function profileCompleteness(p: Partial<StudentProfile>): { filled: number; total: number; missing: string[] } {
  const any = p as Record<string, unknown>;
  const alias: Record<string, unknown> = {
    dateOfBirth: first(any.dateOfBirth, any.birthDate),
    sex: first(any.sex, any.gender),
    mobileNumber: first(any.mobileNumber, any.phone),
    currentAddress: first(any.currentAddress, any.address),
    homeChurch: first(any.homeChurch, any.churchName),
    pastorContactNumber: first(any.pastorContactNumber, any.pastorPhone),
    emergencyContactPerson: first(any.emergencyContactPerson, any.emergencyContactName),
    emergencyContactNumber: first(any.emergencyContactNumber, any.emergencyContactPhone),
  };
  const missing = COMPLETENESS_KEYS.filter((k) => !text(k in alias ? alias[k] : any[k]));
  return { filled: COMPLETENESS_KEYS.length - missing.length, total: COMPLETENESS_KEYS.length, missing };
}

// Every detail from the New Student Registration Form as it is on the student record, grouped like the
// form. Missing answers show "—" (nothing is filled in). Used in the Student Portal and Admin dossier.
export const ProfileDossier: React.FC<{ student: StudentProfile; staff?: boolean }> = ({ student: p, staff }) => {
  const any = p as unknown as Record<string, unknown>;
  const dob = first(p.dateOfBirth, p.birthDate);
  const age = first(p.age, dob ? calculateStudentAge(dob) : '');
  const baptized = p.isBaptized === true || (any.waterBaptized as boolean) === true ? 'Water baptized' : p.isBaptized === false || any.waterBaptized === false ? 'Not yet baptized' : '';
  const completeness = profileCompleteness(p);
  const hold = p.enrollmentHold?.active ? `Hold: ${p.enrollmentHold.reason}` : 'No enrollment hold';

  const sections: { title: string; icon: React.ReactNode; rows: Row[] }[] = [
    {
      title: 'A. Personal Information',
      icon: <User className="h-4 w-4" />,
      rows: [
        { label: 'Student ID', value: p.studentId, mono: true },
        { label: 'Application number', value: first(p.applicationNumber, any.referenceNumber), mono: true },
        { label: 'Student type', value: first(p.applicantType) },
        { label: 'Full name', value: first([p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(' '), p.fullName, p.name) },
        { label: 'Preferred name', value: first(p.preferredName) },
        { label: 'Date of birth', value: dob ? `${fmtDate(dob)}${age ? ` (${age} years old)` : ''}` : '' },
        { label: 'Place of birth', value: first(p.placeOfBirth) },
        { label: 'Sex', value: first(p.sex, p.gender) },
        { label: 'Civil status', value: first(p.civilStatus) },
        { label: 'Nationality', value: first(p.nationality) },
        { label: 'Religion / denomination', value: first(p.religion) },
      ],
    },
    {
      title: 'B. Contact Information',
      icon: <Phone className="h-4 w-4" />,
      rows: [
        { label: 'Mobile number', value: first(p.mobileNumber, p.phone, any.contactNumber), mono: true },
        { label: 'Email', value: first(p.email), mono: true },
        { label: 'Facebook account', value: first(p.facebookAccount) },
        { label: 'Current address', value: first(p.currentAddress, p.address), wide: true },
        { label: 'Permanent address', value: first(p.permanentAddress), wide: true },
        { label: 'City / municipality', value: first(p.city) },
        { label: 'Province', value: first(p.province) },
        { label: 'ZIP code', value: first(p.zipCode), mono: true },
      ],
    },
    {
      title: 'C. Family & Emergency Contact',
      icon: <Users className="h-4 w-4" />,
      rows: [
        { label: "Father's name", value: first(p.fatherName) },
        { label: "Mother's name", value: first(p.motherName) },
        { label: 'Guardian', value: first(p.guardianName) },
        { label: 'Guardian relationship', value: first(p.guardianRelationship) },
        { label: 'Guardian contact number', value: first(p.guardianContactNumber, p.guardianPhone), mono: true },
        { label: 'Guardian email', value: first(p.guardianEmail) },
        { label: 'Guardian address', value: first(p.guardianAddress), wide: true },
        { label: 'Emergency contact', value: first(p.emergencyContactPerson, any.emergencyContactName) },
        { label: 'Emergency contact number', value: first(p.emergencyContactNumber, any.emergencyContactPhone), mono: true },
        { label: 'Emergency contact relationship', value: first(p.emergencyContactRelationship, any.emergencyContactRelation) },
      ],
    },
    {
      title: 'D. Educational Background',
      icon: <GraduationCap className="h-4 w-4" />,
      rows: [
        { label: 'Last school attended', value: first(p.lastSchoolAttended) },
        { label: 'School address', value: first(p.schoolAddress), wide: true },
        { label: 'Highest educational attainment', value: first(p.highestEducationalAttainment) },
        { label: 'Previous course / strand', value: first(p.previousCourse) },
        { label: 'Year graduated', value: first(p.yearGraduated), mono: true },
        { label: 'Graduation date', value: first(p.graduationDate) ? fmtDate(first(p.graduationDate)) : '' },
        { label: 'Previous school ID', value: first(p.previousSchoolId), mono: true },
        { label: 'General average', value: first(p.generalAverage) },
        { label: 'Honors / awards', value: first(p.honorsAwards), wide: true },
      ],
    },
    {
      title: 'E. Church & Ministry',
      icon: <Church className="h-4 w-4" />,
      rows: [
        { label: 'Home church', value: first(p.homeChurch, p.churchName) },
        { label: 'Church address', value: first(p.churchAddress), wide: true },
        { label: 'Church contact number', value: first(p.churchContactNumber), mono: true },
        { label: 'Senior pastor', value: first(p.pastorName) },
        { label: "Pastor's contact number", value: first(p.pastorContactNumber, p.pastorPhone), mono: true },
        { label: 'Ministry department', value: first(p.ministryDepartment) },
        { label: 'Ministry role', value: first(p.ministryRole) },
        { label: 'Years in ministry', value: first(p.yearsInMinistry) },
        { label: 'Started in ministry', value: first(p.dateStartedInMinistry) ? fmtDate(first(p.dateStartedInMinistry)) : '' },
        { label: 'Water baptism', value: baptized ? `${baptized}${p.baptismDate ? ` (${fmtDate(p.baptismDate)})` : ''}` : '' },
        { label: 'Ministry experience', value: first(p.ministryExperience), wide: true },
        { label: 'Testimony & calling', value: first(p.callingTestimony), wide: true },
      ],
    },
    {
      title: 'F. Program & Standing',
      icon: <BookOpen className="h-4 w-4" />,
      rows: [
        { label: 'Degree program', value: first(p.degreeProgram, p.program) },
        { label: 'Major / track', value: first(p.major, p.specialization) },
        { label: 'Year level', value: first(p.yearLevel) },
        { label: 'Section', value: first(p.section) },
        { label: 'Academic status', value: first(p.academicStatus) },
        { label: 'Enrollment status', value: first(p.enrollmentStatus) },
        { label: 'Current / last term', value: first(p.currentSemester, p.lastEnrolledTerm) },
        { label: 'Academic adviser', value: first(p.assignedAdviser) },
        { label: 'Spiritual mentor', value: first(p.mentorName) },
        { label: 'Admission documents', value: p.admissionRequirementsVerified ? 'Verified by the Registrar' : 'Not yet verified' },
        { label: 'Enrollment hold', value: hold },
        { label: 'Profile completeness', value: `${completeness.filled} of ${completeness.total} key details${completeness.missing.length ? '' : ' (complete)'}` },
      ],
    },
  ];

  return (
    <div className="space-y-4" data-testid="profile-dossier">
      {completeness.missing.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          {completeness.missing.length} key detail{completeness.missing.length === 1 ? ' is' : 's are'} missing. Use {staff ? '“Edit Profile Data”' : '“Edit my information”'} to add
          {completeness.missing.length === 1 ? ' it' : ' them'}.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <section key={s.title} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 font-serif text-sm font-bold uppercase tracking-wider text-[#18392B]">
              <span className="text-[#588B76]">{s.icon}</span> {s.title}
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-2">
              {s.rows.map((r) => (
                <div key={r.label} className={r.wide ? 'sm:col-span-2' : ''}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{r.label}</dt>
                  <dd className={`break-words text-slate-900 ${r.mono ? 'font-mono' : 'font-semibold'} ${r.wide ? 'whitespace-pre-wrap font-normal' : ''} ${r.value ? '' : 'text-slate-400'}`}>
                    {r.value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" /> {staff ? 'From the registration form and updates saved since.' : 'These details come from your registration form and any updates saved since.'} Missing answers show “—”.
      </p>
    </div>
  );
};
