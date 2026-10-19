// The New Student Registration Form's answers (saved on the admission application as
// `registrationDetails`, plus a few top-level fields) mapped to the student record's fields — the
// same field names the Profile Dossier, the student's "Edit my information" form and the Admin
// dossier use. Only answers that were actually given are returned (no defaults). Applications without
// registrationDetails (older or short forms) fall back to the top-level fields saved by submitApplication.

type Details = Record<string, unknown>;

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

type Mapped = Record<string, string | boolean>;

function mapApplication(app: Details | null | undefined): { out: Mapped; groups: string[][] } {
  const groups: string[][] = [];
  if (!app) return { out: {}, groups };
  const d = (app.registrationDetails || {}) as Details;
  const pick = (...vals: unknown[]) => vals.map(text).find((v) => v) || '';
  const out: Mapped = {};
  const put = (keys: string[], value: string) => {
    if (!value) return;
    keys.forEach((k) => (out[k] = value));
    groups.push(keys);
  };

  const current = pick(d.currentAddress, app.address);
  const permanent = d.sameAsCurrentAddress === true ? current : pick(d.permanentAddress);

  // Personal
  put(['firstName'], pick(d.firstName, app.firstName));
  put(['middleName'], pick(d.middleName, app.middleName));
  put(['lastName'], pick(d.lastName, app.lastName));
  put(['suffix'], pick(d.suffix, app.suffix));
  put(['preferredName'], pick(d.preferredName));
  put(['dateOfBirth', 'birthDate'], pick(d.dateOfBirth, app.dateOfBirth, app.birthDate));
  put(['placeOfBirth'], pick(d.placeOfBirth));
  put(['sex', 'gender'], pick(d.sex, app.gender, app.sex));
  put(['civilStatus'], pick(d.civilStatus, app.civilStatus));
  put(['nationality'], pick(d.nationality));
  put(['religion'], pick(d.religion));
  // Contact
  put(['mobileNumber', 'phone', 'contactNumber'], pick(d.mobileNumber, app.phone));
  put(['facebookAccount'], pick(d.facebookAccount));
  put(['currentAddress', 'address'], current);
  put(['permanentAddress'], permanent);
  put(['city'], pick(d.city));
  put(['province'], pick(d.province));
  put(['zipCode'], pick(d.zipCode));
  // Family & emergency
  put(['fatherName'], pick(d.fatherName));
  put(['motherName'], pick(d.motherName));
  put(['guardianName'], pick(d.guardianName));
  put(['guardianRelationship'], pick(d.guardianName) ? pick(d.guardianRelationship) : '');
  put(['guardianContactNumber', 'guardianPhone'], pick(d.guardianContactNumber));
  put(['guardianEmail'], pick(d.guardianEmail));
  put(['guardianAddress'], pick(d.guardianAddress));
  put(['emergencyContactPerson', 'emergencyContactName'], pick(d.emergencyContactPerson));
  put(['emergencyContactNumber', 'emergencyContactPhone'], pick(d.emergencyContactNumber));
  put(['emergencyContactRelationship', 'emergencyContactRelation'], pick(d.emergencyContactPerson) ? pick(d.emergencyContactRelationship) : '');
  // Education
  put(['lastSchoolAttended'], pick(d.lastSchoolAttended, app.previousSchool, app.highSchoolOrCollege));
  put(['schoolAddress'], pick(d.schoolAddress));
  put(['highestEducationalAttainment'], pick(d.highestEducationalAttainment, app.highestEducation, app.previousEducation));
  put(['previousCourse'], pick(d.previousCourse));
  put(['yearGraduated'], pick(d.yearGraduated, app.yearGraduated));
  put(['graduationDate'], pick(d.graduationDate));
  put(['previousSchoolId'], pick(d.previousSchoolId));
  put(['honorsAwards'], pick(d.honorsAwards));
  // Church & ministry
  put(['homeChurch', 'churchName'], pick(d.churchName, app.churchName, app.churchAffiliation));
  put(['churchAddress'], pick(d.churchAddress));
  put(['churchContactNumber'], pick(d.churchContactNumber));
  put(['pastorName'], pick(d.pastorName, app.pastorName));
  put(['pastorContactNumber', 'pastorPhone'], pick(d.pastorContactNumber, app.pastorContact, app.pastorPhone));
  put(['ministryDepartment'], pick(d.ministryDepartment));
  put(['ministryRole'], pick(d.ministryRole));
  put(['yearsInMinistry'], pick(d.yearsInMinistry));
  put(['dateStartedInMinistry'], pick(d.dateStartedInMinistry));
  put(['ministryExperience'], pick(d.ministryExperience));
  put(['callingTestimony'], pick(d.callingTestimony, app.christianTestimony, app.callingStatement, app.testimony));
  // Program
  put(['major', 'specialization'], pick(d.major));
  put(['applicantType'], pick(app.applicantType, d.applicantType));
  return { out, groups };
}

export function profileDetailsFromApplication(app: Details | null | undefined): Mapped {
  return mapApplication(app).out;
}

/**
 * Only the answers for details still empty on the student record (never overwrites). A detail kept
 * under several field names (e.g. mobileNumber / phone) counts as filled when any of them has a value.
 */
export function missingDetails(student: Details, app: Details | null | undefined): Mapped {
  return missingDetailsWithCount(student, app).fill;
}

/** missingDetails plus how many distinct answers that is (a detail under several field names counts once). */
export function missingDetailsWithCount(student: Details, app: Details | null | undefined): { fill: Mapped; count: number } {
  const { out, groups } = mapApplication(app);
  const fill: Mapped = {};
  let count = 0;
  for (const keys of groups) {
    if (keys.some((k) => text(student[k]))) continue;
    keys.forEach((k) => (fill[k] = out[k]));
    count += 1;
  }
  return { fill, count };
}
