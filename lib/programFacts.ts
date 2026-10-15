// Program facts as the public site shows them, read from what admins set:
// - units, duration, study mode and description: Academic Programs (the program record)
// - tuition rate: Enrollment & Records → Tuition & Fee Policy, the rate students are actually charged
//   (the same Tuition item the assessment uses), else the default tuition per unit in the
//   enrollment settings.

import type { AcademicProgram, EnrollmentSystemConfig, FeeStructureItem } from './types';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH')}`;

// Academic Programs saves totalUnits; older records only have credits/units.
export function programUnits(p: Partial<AcademicProgram>): number {
  return Number(p.totalUnits) || Number(p.credits) || Number(p.units) || 0;
}

export function programDescription(p: Partial<AcademicProgram>): string {
  return p.description || p.fullDescription || p.shortDescription || '';
}

export function programOutcomes(p: Partial<AcademicProgram>): string[] {
  const list = (p as any).careerOutcomes?.length ? (p as any).careerOutcomes : p.careerOpportunities;
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

export function tuitionRateLabel(feeStructure: FeeStructureItem[], config?: Partial<EnrollmentSystemConfig> | null): string | null {
  const tuition = (feeStructure || []).find((f) => f.category === 'Tuition' && f.required !== false) || (feeStructure || []).find((f) => f.category === 'Tuition');
  if (tuition && Number(tuition.amount) > 0) return `${peso(tuition.amount)}${tuition.isPerUnit === false ? ' / term' : '/unit'}`;
  const perUnit = Number((config as any)?.defaultTuitionPerUnit) || 0;
  return perUnit > 0 ? `${peso(perUnit)}/unit` : null;
}
