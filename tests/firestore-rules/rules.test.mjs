// Firestore rules tests for the PCM website. Runs against the local emulator only.
// Run with `npm test` in this folder (needs Java 11+).
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, collection, query, where } from 'firebase/firestore';

const rulesPath = process.env.RULES_PATH || new URL('../../firestore.rules', import.meta.url);
const env = await initializeTestEnvironment({
  projectId: 'demo-pcm-rules',
  firestore: { rules: readFileSync(rulesPath, 'utf8'), host: '127.0.0.1', port: 8085 },
});

// Seed data with rules disabled.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const seed = (path, data) => setDoc(doc(db, path), data);
  await seed('siteConfig/global', { title: 'PCM' });
  await seed('news/n1', { title: 'News' });
  await seed('applications/a1', { status: 'Submitted' });
  await seed('activityLogs/l1', { action: 'LOGIN' });
  await seed('studentProfiles/sp1', { fullName: 'Student' });
  await seed('uploadedMedia/m1', { url: '/uploads/x.jpg' });

  // Regular accounts
  await seed('users/s1', { role: 'Student/User', status: 'Active' });
  await seed('users/dis', { role: 'Student/User', status: 'Disabled' });
  await seed('users/other', { role: 'Student/User', status: 'Active' });

  // Pending admin registrations
  await seed('users/pend1', { role: 'Pending User', status: 'Pending', verificationStatus: 'Pending', requestedRole: 'Admin' });
  await seed('users/pend2', { role: 'Pending User', status: 'Pending', verificationStatus: 'Pending', requestedRole: 'Admin' });
  await seed('users/pend3', { role: 'Pending User', status: 'Pending', verificationStatus: 'Pending', requestedRole: 'Super Admin' });

  // Rejected registration that still has a stale admin directory entry
  await seed('users/rej1', { role: 'Pending User', status: 'Rejected', verificationStatus: 'Rejected' });
  await seed('adminEmails/rej@pcm.edu.ph', { email: 'rej@pcm.edu.ph', role: 'Editor', active: true });

  // Approved admins, as the site stores them
  await seed('users/super2', { role: 'Super Admin', adminRole: 'Super Admin', status: 'Active' });
  await seed('users/sa2', { role: 'Admin', adminRole: 'Super Admin', status: 'Active' });
  await seed('users/u9', { role: 'Admin', status: 'Active' });
  await seed('users/u9p', { role: 'Admin', status: 'Pending' });
  await seed('users/admEd', { role: 'Admin', adminRole: 'Editor', status: 'Active' });
  await seed('users/pres', { role: 'Super Admin', status: 'Disabled' });
  await seed('adminUsers/u10', { role: 'Content Admin', status: 'Active', email: 'u10@pcm.edu.ph' });
  await seed('adminUsers/adm-5', { role: 'Editor', status: 'Active', email: 'editor@pcm.edu.ph', avatarUrl: '' });
  await seed('adminUsers/adm-6', { role: 'Registrar', status: 'Active', email: 'reg@pcm.edu.ph', avatarUrl: '' });
  await seed('adminUsers/adm-super', { role: 'Super Admin', status: 'Active', email: 'boss@pcm.edu.ph' });
  await seed('adminEmails/editor@pcm.edu.ph', { email: 'editor@pcm.edu.ph', role: 'Editor', active: true, adminId: 'adm-5' });
  await seed('adminEmails/old@pcm.edu.ph', { email: 'old@pcm.edu.ph', role: 'Admin', active: false });
  await seed('adminEmails/boss@pcm.edu.ph', { email: 'boss@pcm.edu.ph', role: 'Super Admin', active: true });

  // Enrollment workflow
  await seed('users/reg1', { role: 'Admin', adminRole: 'Registrar', status: 'Active' });
  await seed('users/fin1', { role: 'Admin', adminRole: 'Finance', status: 'Active' });
  await seed('applications/legacy1', { referenceNumber: 'PCM-2026-1111', status: 'Submitted', email: 'legacy@gmail.com', fullName: 'Legacy Applicant' });
  await seed('applications/other1', { referenceNumber: 'PCM-2026-2222', status: 'Submitted', applicantUid: 'someoneElse', email: 'else@gmail.com' });
  await seed('studentProfiles/std-linked', { studentId: '2026-PCM-0001', authUid: 'stu1', email: 'stu1@gmail.com', fullName: 'Linked Student', enrollmentStatus: 'Enrolled', phone: '1' });
  await seed('studentProfiles/std-legacy', { studentId: '2024-PCM-0418', email: 'legacy@gmail.com', fullName: 'Legacy Student', enrollmentStatus: 'Enrolled' });
  await seed('studentProfiles/std-taken', { studentId: '2025-PCM-0002', authUid: 'someoneElse', email: 'else@gmail.com' });
  await seed('enrollments/enr-stu1', { studentUid: 'stu1', studentId: '2026-PCM-0001', status: 'Submitted' });
  await seed('studentNotifications/n-stu1', { recipientUid: 'stu1', title: 'Hello', read: false });
  await seed('studentNotifications/n-other', { recipientUid: 'someoneElse', title: 'Private', read: false });
  await seed('uploadedDocuments/u1', { url: 'data:...' });
});

const anon = env.unauthenticatedContext().firestore();
const as = (uid, email, verified = true) =>
  env.authenticatedContext(uid, { email, email_verified: verified }).firestore();

const student = as('s1', 'student@gmail.com');
const disabled = as('dis', 'dis@gmail.com');
const fakeSuper = as('fs', 'angeloperfecto.epc@gmail.com', false);
const superAdmin = as('angelo', 'AngeloPerfecto.EPC@gmail.com');
const president = as('pres', 'president@pcm.edu.ph');
const super2 = as('sa2', 'sa2@gmail.com');
const editor = as('ed1', 'editor@pcm.edu.ph');
const editorUnverified = as('ed2', 'editor@pcm.edu.ph', false);
const oldAdmin = as('old1', 'old@pcm.edu.ph');
const admin = as('u9', 'u9@gmail.com');
const pendingAdminRole = as('u9p', 'u9p@gmail.com');
const approvedEditor = as('admEd', 'admed@gmail.com');
const uidAdmin = as('u10', 'u10@pcm.edu.ph');
const pending1 = as('pend1', 'pend1@gmail.com');
const rejected = as('rej1', 'rej@pcm.edu.ph');

const results = [];
async function check(name, expectAllowed, fn) {
  try {
    await (expectAllowed ? assertSucceeds(fn()) : assertFails(fn()));
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name + ' -> ' + (e?.message || e).toString().split('\n')[0]]);
  }
}
const section = (title) => results.push(['----', title]);

const approval = (role) => ({
  role: 'Admin',
  adminRole: role,
  status: 'Active',
  verificationStatus: 'Approved',
  approvedBy: 'tester',
});

section('Anonymous visitors');
await check('read site config', true, () => getDoc(doc(anon, 'siteConfig/global')));
await check('cannot edit site config', false, () => setDoc(doc(anon, 'siteConfig/global'), { title: 'hacked' }));
await check('cannot add programs', false, () => setDoc(doc(anon, 'programs/p9'), { name: 'x' }));
await check('cannot delete news', false, () => deleteDoc(doc(anon, 'news/n1')));
await check('cannot submit application without signing in', false, () => setDoc(doc(anon, 'applications/a2'), { status: 'Submitted' }));
await check('cannot read applications', false, () => getDoc(doc(anon, 'applications/a1')));
await check('cannot change application', false, () => updateDoc(doc(anon, 'applications/a1'), { status: 'Accepted' }));
await check('cannot delete application', false, () => deleteDoc(doc(anon, 'applications/a1')));
await check('submit inquiry', true, () => setDoc(doc(anon, 'inquiries/i1'), { message: 'hi' }));
await check('write activity log', true, () => setDoc(doc(anon, 'activityLogs/l2'), { action: 'LOGIN' }));
await check('cannot alter activity log', false, () => updateDoc(doc(anon, 'activityLogs/l1'), { action: 'X' }));
await check('cannot read student records', false, () => getDoc(doc(anon, 'studentProfiles/sp1')));
await check('cannot edit student records', false, () => setDoc(doc(anon, 'studentProfiles/sp1'), { phone: '1' }, { merge: true }));
await check('cannot delete student profile', false, () => deleteDoc(doc(anon, 'studentProfiles/sp1')));
await check('server route creates upload record', true, () => setDoc(doc(anon, 'uploadedMedia/m2'), { url: '/uploads/y.jpg' }));
await check('cannot overwrite upload record', false, () => setDoc(doc(anon, 'uploadedMedia/m1'), { url: 'evil' }));
await check('cannot create user', false, () => setDoc(doc(anon, 'users/zz'), { role: 'Student/User' }));
await check('cannot write adminUsers', false, () => setDoc(doc(anon, 'adminUsers/x'), { role: 'Super Admin' }));
await check('cannot read admin email index', false, () => getDoc(doc(anon, 'adminEmails/editor@pcm.edu.ph')));
await check('cannot write unknown collection', false, () => setDoc(doc(anon, 'mystery/x'), { a: 1 }));
await check('unlisted collections are denied', false, () => getDoc(doc(anon, 'mystery/x')));

section('Registration: new admin requests stay Pending');
const newbie = as('new1', 'n@gmail.com');
await check('register as regular user', true, () => setDoc(doc(newbie, 'users/new1'), { role: 'Student/User', status: 'Active' }));
await check('register an admin request (Pending User / Pending)', true, () =>
  setDoc(doc(as('new5', 'n5@gmail.com'), 'users/new5'), { role: 'Pending User', status: 'Pending', verificationStatus: 'Pending', requestedRole: 'Admin' }));
await check('cannot register directly as Super Admin', false, () => setDoc(doc(as('new2', 'n2@gmail.com'), 'users/new2'), { role: 'Super Admin', status: 'Active' }));
await check('cannot register directly as Admin', false, () => setDoc(doc(as('new3', 'n3@gmail.com'), 'users/new3'), { role: 'Admin', status: 'Active' }));
await check('cannot register as pending Admin role', false, () => setDoc(doc(as('new6', 'n6@gmail.com'), 'users/new6'), { role: 'Admin', status: 'Pending' }));
await check('cannot register with an adminRole', false, () => setDoc(doc(as('new4', 'n4@gmail.com'), 'users/new4'), { role: 'Pending User', status: 'Pending', adminRole: 'Admin' }));
await check('unverified Super Admin email cannot self-create Super Admin', false, () => setDoc(doc(fakeSuper, 'users/fs'), { role: 'Super Admin', status: 'Active' }));

section('Pending, rejected, disabled and regular accounts are blocked');
await check('pending user cannot edit content', false, () => setDoc(doc(pending1, 'programs/p1'), { name: 'x' }));
await check('pending user cannot self-approve', false, () => updateDoc(doc(pending1, 'users/pend1'), approval('Admin')));
await check('pending user cannot give self an adminRole', false, () => updateDoc(doc(pending1, 'users/pend1'), { adminRole: 'Admin' }));
await check('pending user cannot write admin directory', false, () => setDoc(doc(pending1, 'adminUsers/pend1'), { role: 'Admin', status: 'Active', email: 'pend1@gmail.com' }));
await check('pending user cannot write email index', false, () => setDoc(doc(pending1, 'adminEmails/pend1@gmail.com'), { role: 'Admin', active: true }));
await check('pending Admin-role profile cannot edit content', false, () => setDoc(doc(pendingAdminRole, 'news/n3'), { title: 'x' }));
await check('rejected user with stale directory entry cannot edit content', false, () => setDoc(doc(rejected, 'news/n5'), { title: 'x' }));
await check('rejected user cannot reactivate self', false, () => updateDoc(doc(rejected, 'users/rej1'), { status: 'Pending' }));
await check('rejected user cannot claim directory role', false, () => updateDoc(doc(rejected, 'users/rej1'), { role: 'Editor', adminRole: 'Editor', status: 'Active' }));
await check('disabled user cannot reactivate self', false, () => updateDoc(doc(disabled, 'users/dis'), { status: 'Active' }));
await check('student cannot promote self to Admin', false, () => updateDoc(doc(student, 'users/s1'), { role: 'Admin' }));
await check('student cannot edit site content', false, () => setDoc(doc(student, 'siteConfig/global'), { title: 'x' }));
await check('student cannot edit another user', false, () => updateDoc(doc(student, 'users/other'), { name: 'x' }));
await check('student updates own lastLogin', true, () => updateDoc(doc(student, 'users/s1'), { lastLogin: 'now' }));
await check('student requests admin access (Pending)', true, () => updateDoc(doc(student, 'users/s1'), { status: 'Pending', verificationStatus: 'Pending', requestedRole: 'Admin' }));
await check('student links Student ID (role Student)', true, () => updateDoc(doc(student, 'users/s1'), { role: 'Student', status: 'Active' }));
await check('unverified Super Admin email cannot edit content', false, () => setDoc(doc(fakeSuper, 'siteConfig/global'), { title: 'x' }));
await check('same directory email but unverified cannot edit', false, () => setDoc(doc(editorUnverified, 'programs/p1'), { name: 'x' }));
await check('inactive directory entry cannot edit', false, () => setDoc(doc(oldAdmin, 'programs/p1'), { name: 'x' }));

section('Only Super Admin and Admin can approve');
await check('Editor (directory) cannot approve a pending user', false, () => updateDoc(doc(editor, 'users/pend1'), approval('Editor')));
await check('Editor (approved profile) cannot approve a pending user', false, () => updateDoc(doc(approvedEditor, 'users/pend1'), approval('Editor')));
await check('Content Admin (adminUsers/uid) cannot approve', false, () => updateDoc(doc(uidAdmin, 'users/pend1'), approval('Editor')));
await check('Editor cannot add admin directory entries', false, () => setDoc(doc(editor, 'adminUsers/adm-x'), { role: 'Editor', status: 'Active', email: 'x@pcm.edu.ph' }));
await check('Editor cannot write email index', false, () => setDoc(doc(editor, 'adminEmails/x@pcm.edu.ph'), { role: 'Editor', active: true }));
await check('Admin cannot approve someone as Super Admin', false, () => updateDoc(doc(admin, 'users/pend2'), approval('Super Admin')));
await check('Admin approves pending user as Editor', true, () => updateDoc(doc(admin, 'users/pend1'), approval('Editor')));
await check('Admin adds approved user to admin directory', true, () => setDoc(doc(admin, 'adminUsers/pend1'), { role: 'Editor', status: 'Active', email: 'pend1@gmail.com' }));
await check('newly approved user can now edit content', true, () => setDoc(doc(pending1, 'programs/p2'), { name: 'Approved edit' }));
await check('newly approved Editor still cannot approve others', false, () => updateDoc(doc(pending1, 'users/pend2'), approval('Editor')));
await check('Admin rejects a pending user', true, () => updateDoc(doc(admin, 'users/pend2'), { status: 'Rejected', verificationStatus: 'Rejected' }));
await check('Admin writes non-Super email index entry', true, () => setDoc(doc(admin, 'adminEmails/new@pcm.edu.ph'), { role: 'Editor', active: true }));
await check('Admin cannot write Super Admin email index entry', false, () => setDoc(doc(admin, 'adminEmails/new2@pcm.edu.ph'), { role: 'Super Admin', active: true }));
await check('Admin cannot change Super Admin index entry', false, () => updateDoc(doc(admin, 'adminEmails/boss@pcm.edu.ph'), { active: false }));
await check('Admin cannot add a Super Admin directory entry', false, () => setDoc(doc(admin, 'adminUsers/adm-y'), { role: 'Super Admin', status: 'Active', email: 'y@pcm.edu.ph' }));
await check('Admin cannot demote a Super Admin', false, () => updateDoc(doc(admin, 'users/super2'), { role: 'Admin' }));
await check('Admin cannot delete a Super Admin account', false, () => deleteDoc(doc(admin, 'users/super2')));
await check('Admin cannot delete a Super Admin directory entry', false, () => deleteDoc(doc(admin, 'adminUsers/adm-super')));
await check('Admin removes a non-Super directory entry', true, () => deleteDoc(doc(admin, 'adminUsers/adm-6')));
await check('Admin deletes a regular account', true, () => deleteDoc(doc(admin, 'users/other')));
await check('Super Admin approves pending user as Super Admin', true, () => updateDoc(doc(superAdmin, 'users/pend3'), approval('Super Admin')));
await check('approved-as-Super-Admin profile (role Admin, adminRole Super Admin) adds Super Admin entry', true, () =>
  setDoc(doc(super2, 'adminUsers/adm-z'), { role: 'Super Admin', status: 'Active', email: 'z@pcm.edu.ph' }));
await check('Super Admin writes Super Admin index entry', true, () => setDoc(doc(superAdmin, 'adminEmails/z@pcm.edu.ph'), { role: 'Super Admin', active: true }));
await check('Super Admin promotes user to Super Admin', true, () => updateDoc(doc(superAdmin, 'users/s1'), { role: 'Super Admin' }));

section('Existing approved admins keep their access');
await check('built-in Super Admin edits site config', true, () => setDoc(doc(superAdmin, 'siteConfig/global'), { title: 'PCM 2' }));
await check('built-in Super Admin keeps access even if profile says Disabled', true, () => setDoc(doc(president, 'news/n6'), { title: 'x' }));
await check('built-in Super Admin creates own profile', true, () => setDoc(doc(superAdmin, 'users/angelo'), { role: 'Super Admin', adminRole: 'Super Admin', status: 'Active' }));
await check('Admin edits news', true, () => setDoc(doc(admin, 'news/n2'), { title: 'x' }));
await check('approved Editor profile edits content', true, () => setDoc(doc(approvedEditor, 'news/n7'), { title: 'x' }));
await check('adminUsers/{uid} Content Admin edits news', true, () => setDoc(doc(uidAdmin, 'news/n4'), { title: 'x' }));
await check('directory Editor edits programs', true, () => setDoc(doc(editor, 'programs/p1'), { name: 'BTh' }));
await check('directory Editor records own Editor role on first sign-in', true, () => setDoc(doc(editor, 'users/ed1'), { role: 'Editor', adminRole: 'Editor', status: 'Active' }));
await check('directory Editor cannot claim a higher role', false, () => setDoc(doc(as('ed3', 'editor@pcm.edu.ph'), 'users/ed3'), { role: 'Admin', status: 'Active' }));
await check('directory Editor updates own avatar', true, () => updateDoc(doc(editor, 'adminUsers/adm-5'), { avatarUrl: 'a.jpg' }));
await check('directory Editor cannot change own role', false, () => updateDoc(doc(editor, 'adminUsers/adm-5'), { role: 'Super Admin' }));
await check('directory Editor cannot change own email', false, () => updateDoc(doc(editor, 'adminUsers/adm-5'), { email: 'x@y.z' }));
await check("directory Editor cannot edit another admin's entry", false, () => updateDoc(doc(editor, 'adminUsers/u10'), { avatarUrl: 'b.jpg' }));
await check('directory Editor reads email index', true, () => getDoc(doc(editor, 'adminEmails/editor@pcm.edu.ph')));
await check('admin updates application status', true, () => updateDoc(doc(admin, 'applications/a1'), { status: 'Under Review' }));
await check('admin cannot set a retired status', false, () => updateDoc(doc(admin, 'applications/a1'), { status: 'Accepted' }));
await check('admin deletes student profile', true, () => deleteDoc(doc(admin, 'studentProfiles/sp1')));

section('Admission workflow: applicants');
const applicant = as('appl1', 'appl1@gmail.com');
const otherApplicant = as('appl2', 'appl2@gmail.com');
const legacyOwner = as('leg1', 'legacy@gmail.com');
const registrar = as('reg1', 'reg1@gmail.com');
const finance = as('fin1', 'fin1@gmail.com');
const studentUser = as('stu1', 'stu1@gmail.com');
const newApp = { applicantUid: 'appl1', status: 'Submitted', fullName: 'Applicant One', email: 'appl1@gmail.com', referenceNumber: 'PCM-2026-AAAAAA' };

await check('applicant submits application with documents in one batch', true, () => {
  const b = writeBatch(applicant);
  b.set(doc(applicant, 'applications/appA'), newApp);
  b.set(doc(applicant, 'applications/appA/requirements/id-photo'), { applicantUid: 'appl1', status: 'Submitted', name: '2x2 ID Photo', required: true, fileDataUrl: 'data:image/jpeg;base64,AAA' });
  b.set(doc(applicant, 'applications/appA/requirements/birth-certificate'), { applicantUid: 'appl1', status: 'Missing', name: 'PSA Birth Certificate', required: true });
  b.set(doc(applicant, 'applications/appA/history/h1'), { status: 'Submitted', actor: 'applicant', byName: 'Applicant One' });
  b.set(doc(applicant, 'studentNotifications/nA'), { recipientUid: 'appl1', title: 'Application received', read: false });
  b.set(doc(applicant, 'staffNotifications/sA'), { id: 'sA', applicationId: 'appA', referenceNumber: 'PCM-2026-AAAAAA', title: 'New', message: 'x', createdByUid: 'appl1', read: false, createdAt: 'now' });
  return b.commit();
});
await check('applicant cannot submit an already-admitted application', false, () => setDoc(doc(applicant, 'applications/appB'), { ...newApp, status: 'Admitted' }));
await check('applicant cannot pre-assign a Student ID', false, () => setDoc(doc(applicant, 'applications/appC'), { ...newApp, studentId: '2026-PCM-9999' }));
await check("applicant cannot submit under another user's account", false, () => setDoc(doc(applicant, 'applications/appD'), { ...newApp, applicantUid: 'appl2' }));
await check('applicant reads own application', true, () => getDoc(doc(applicant, 'applications/appA')));
await check("another applicant cannot read it", false, () => getDoc(doc(otherApplicant, 'applications/appA')));
await check("another applicant cannot read its documents", false, () => getDoc(doc(otherApplicant, 'applications/appA/requirements/id-photo')));
await check('applicant lists own applications by uid', true, () => getDocs(query(collection(applicant, 'applications'), where('applicantUid', '==', 'appl1'))));
await check('applicant cannot list all applications', false, () => getDocs(collection(applicant, 'applications')));
await check('legacy applicant reads application by verified email', true, () => getDoc(doc(legacyOwner, 'applications/legacy1')));
await check('legacy applicant lists applications by email', true, () => getDocs(query(collection(legacyOwner, 'applications'), where('email', '==', 'legacy@gmail.com'))));
await check('applicant uploads a document', true, () => updateDoc(doc(applicant, 'applications/appA/requirements/birth-certificate'), { status: 'Submitted', fileName: 'psa.pdf', fileType: 'application/pdf', fileSize: 1000, fileDataUrl: 'data:application/pdf;base64,AAA', uploadedAt: 'now' }));
await check('applicant cannot mark own document Verified', false, () => updateDoc(doc(applicant, 'applications/appA/requirements/id-photo'), { status: 'Verified' }));
await check('applicant cannot write reviewer remarks', false, () => updateDoc(doc(applicant, 'applications/appA/requirements/id-photo'), { status: 'Submitted', remarks: 'looks fine' }));
await check('applicant cannot admit themselves', false, () => updateDoc(doc(applicant, 'applications/appA'), { status: 'Admitted' }));
await check('applicant cannot move a Submitted application to Under Review', false, () => updateDoc(doc(applicant, 'applications/appA'), { status: 'Under Review' }));
await check('applicant cannot change decision fields', false, () => updateDoc(doc(applicant, 'applications/appA'), { lastDecisionBy: 'me' }));
await check('applicant cannot record a staff history entry', false, () => setDoc(doc(applicant, 'applications/appA/history/h2'), { status: 'Admitted', actor: 'staff', byName: 'x' }));
await check('applicant cannot delete an application', false, () => deleteDoc(doc(applicant, 'applications/appA')));

section('Admission workflow: staff decisions');
await check('Editor can view applications', true, () => getDoc(doc(approvedEditor, 'applications/appA')));
await check('Editor cannot make admission decisions', false, () => updateDoc(doc(approvedEditor, 'applications/appA'), { status: 'Under Review' }));
await check('Finance cannot make admission decisions', false, () => updateDoc(doc(finance, 'applications/appA'), { status: 'Admitted' }));
await check('Editor cannot verify documents', false, () => updateDoc(doc(approvedEditor, 'applications/appA/requirements/id-photo'), { status: 'Verified' }));
await check('Registrar requests missing documents', true, () => {
  const b = writeBatch(registrar);
  b.update(doc(registrar, 'applications/appA'), { status: 'Requirements Incomplete', applicantMessage: 'Need PSA', lastDecisionBy: 'Registrar' });
  b.update(doc(registrar, 'applications/appA/requirements/birth-certificate'), { status: 'Rejected', remarks: 'Blurry scan' });
  b.set(doc(registrar, 'applications/appA/history/h3'), { status: 'Requirements Incomplete', actor: 'staff', byName: 'Registrar' });
  b.set(doc(registrar, 'studentNotifications/nB'), { recipientUid: 'appl1', title: 'Action needed', read: false });
  return b.commit();
});
await check('applicant re-uploads and returns application to review', true, () => {
  const b = writeBatch(applicant);
  b.update(doc(applicant, 'applications/appA/requirements/birth-certificate'), { status: 'Submitted', fileName: 'psa2.pdf', fileType: 'application/pdf', fileSize: 900, fileDataUrl: 'data:application/pdf;base64,BBB', uploadedAt: 'now' });
  b.update(doc(applicant, 'applications/appA'), { status: 'Under Review', updatedAt: 'now' });
  b.set(doc(applicant, 'applications/appA/history/h4'), { status: 'Under Review', actor: 'applicant', byName: 'Applicant One' });
  return b.commit();
});
await check('Registrar verifies a document', true, () => updateDoc(doc(registrar, 'applications/appA/requirements/id-photo'), { status: 'Verified', reviewedBy: 'Registrar', remarks: '' }));
await check('applicant cannot replace a verified document', false, () => updateDoc(doc(applicant, 'applications/appA/requirements/id-photo'), { status: 'Submitted', fileName: 'other.jpg' }));
await check('Registrar cannot skip from Under Review straight to Admitted', false, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'Admitted' }));
await check('Registrar sends the application for admission approval', true, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'For Admission Approval' }));
await check('Registrar admits the applicant', true, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'Admitted' }));
await check('Registrar cannot enroll straight from Admitted', false, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'Enrolled', paymentStatus: 'Verified', assessment: { total: 1 } }));
await check('Registrar cannot skip registration and go straight to assessment', false, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'For Assessment' }));
await check('Registrar opens the student registration', true, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'For Registration' }));
await check('Registrar cannot start the assessment before a registration exists', false, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'For Assessment' }));
await check('applicant cannot submit a registration without subjects', false, () => updateDoc(doc(applicant, 'applications/appA'), { registration: { subjects: [], totalUnits: 0 }, status: 'For Assessment', updatedAt: 'now' }));
await check('applicant cannot change other fields while registering', false, () => updateDoc(doc(applicant, 'applications/appA'), { registration: { subjects: [{ code: 'BIB-101', units: 3 }], totalUnits: 3 }, status: 'For Assessment', fullName: 'Changed', updatedAt: 'now' }));
await check('applicant cannot skip to payment while registering', false, () => updateDoc(doc(applicant, 'applications/appA'), { registration: { subjects: [{ code: 'BIB-101', units: 3 }], totalUnits: 3 }, status: 'For Payment', updatedAt: 'now' }));
await check('applicant submits the registration (moves to assessment)', true, () => {
  const b = writeBatch(applicant);
  b.update(doc(applicant, 'applications/appA'), {
    registration: { programName: 'B.Th.', yearLevel: '1st Year', academicYear: '2026–2027', semester: '1st Semester', subjects: [{ subjectId: 's1', code: 'BIB-101', title: 'OT Survey', units: 3 }], totalUnits: 3, submittedAt: 'now', submittedBy: 'Applicant' },
    status: 'For Assessment',
    updatedAt: 'now',
  });
  b.set(doc(applicant, 'applications/appA/history/hReg'), { status: 'For Assessment', actor: 'applicant', byName: 'Applicant' });
  return b.commit();
});
await check('applicant cannot change the registration after submitting', false, () => updateDoc(doc(applicant, 'applications/appA'), { registration: { subjects: [{ code: 'X', units: 30 }], totalUnits: 30 }, updatedAt: 'now' }));
await check('cannot request payment without an assessment', false, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'For Payment' }));
await check('cannot mark For Enrollment before payment is verified', false, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'For Enrollment' }));
await check('Finance cannot save assessments', false, () => updateDoc(doc(finance, 'applications/appA'), { status: 'For Payment', assessment: { total: 20000, minimumPayment: 5000 }, paymentStatus: 'Awaiting Payment' }));
await check('Registrar saves the assessment and requests payment', true, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'For Payment', assessment: { total: 20000, minimumPayment: 5000 }, paymentStatus: 'Awaiting Payment' }));
await check('applicant cannot change the assessment', false, () => updateDoc(doc(applicant, 'applications/appA'), { assessment: { total: 1, minimumPayment: 1 } }));
await check('applicant cannot mark own payment verified', false, () => updateDoc(doc(applicant, 'applications/appA'), { paymentStatus: 'Verified' }));
await check('applicant reports a payment', true, () => {
  const b = writeBatch(applicant);
  b.set(doc(applicant, 'applications/appA/payments/p1'), { applicantUid: 'appl1', amount: 5000, method: 'GCash', referenceNo: 'GC123456', paidOn: '2026-10-01', status: 'Submitted', submittedAt: 'now' });
  b.update(doc(applicant, 'applications/appA'), { paymentStatus: 'Submitted', updatedAt: 'now' });
  return b.commit();
});
await check('applicant cannot report a payment as already verified', false, () => setDoc(doc(applicant, 'applications/appA/payments/p2'), { applicantUid: 'appl1', amount: 5000, status: 'Verified' }));
await check('applicant cannot report a zero payment', false, () => setDoc(doc(applicant, 'applications/appA/payments/p3'), { applicantUid: 'appl1', amount: 0, status: 'Submitted' }));
await check('applicant cannot verify own payment', false, () => updateDoc(doc(applicant, 'applications/appA/payments/p1'), { status: 'Verified' }));
await check('another applicant cannot see the payment', false, () => getDoc(doc(otherApplicant, 'applications/appA/payments/p1')));
await check('Editor cannot verify payments', false, () => updateDoc(doc(approvedEditor, 'applications/appA/payments/p1'), { status: 'Verified', reviewedBy: 'Editor' }));
await check('Finance cannot change other application fields', false, () => updateDoc(doc(finance, 'applications/appA'), { fullName: 'Changed' }));
await check('Finance records a payment made at the cashier (saved as verified)', true, () => {
  const b = writeBatch(finance);
  b.set(doc(finance, 'applications/appA/payments/pCash'), { applicantUid: 'appl1', amount: 1000, method: 'Over-the-Counter Cashier', referenceNo: 'OR-1', paidOn: '2026-10-01', status: 'Verified', submittedAt: 'now', reviewedBy: 'Finance', reviewedAt: 'now', remarks: 'Paid in person' });
  b.update(doc(finance, 'applications/appA'), { paymentStatus: 'Submitted', amountPaidVerified: 1000, updatedAt: 'now' });
  b.set(doc(finance, 'applications/appA/history/hCash'), { status: 'For Payment', actor: 'staff', byName: 'Finance' });
  return b.commit();
});
await check('staff cannot record an unverified payment for the applicant', false, () => setDoc(doc(finance, 'applications/appA/payments/pX'), { applicantUid: 'appl1', amount: 1000, status: 'Submitted' }));
await check('staff cannot record a zero payment', false, () => setDoc(doc(finance, 'applications/appA/payments/pZ'), { applicantUid: 'appl1', amount: 0, status: 'Verified' }));
await check('Editor cannot record payments', false, () => setDoc(doc(approvedEditor, 'applications/appA/payments/pE'), { applicantUid: 'appl1', amount: 1000, status: 'Verified' }));
await check('Finance verifies the payment and clears the applicant for enrollment', true, () => {
  const b = writeBatch(finance);
  b.update(doc(finance, 'applications/appA/payments/p1'), { status: 'Verified', reviewedBy: 'Finance', reviewedAt: 'now', remarks: '' });
  b.update(doc(finance, 'applications/appA'), { status: 'For Enrollment', paymentStatus: 'Verified', amountPaidVerified: 5000, paymentVerifiedBy: 'Finance', paymentVerifiedAt: 'now', updatedAt: 'now' });
  b.set(doc(finance, 'applications/appA/history/hPay'), { status: 'For Enrollment', actor: 'staff', byName: 'Finance' });
  return b.commit();
});
await check('Finance cannot confirm enrollment', false, () => updateDoc(doc(finance, 'applications/appA'), { status: 'Enrolled' }));
await check('staff cannot record a payment once the applicant is past Pending Payment', false, () => setDoc(doc(finance, 'applications/appA/payments/pLate'), { applicantUid: 'appl1', amount: 500, status: 'Verified' }));
await check('a reviewed payment cannot be changed again', false, () => updateDoc(doc(finance, 'applications/appA/payments/p1'), { status: 'Rejected', remarks: 'oops' }));
await check('Registrar allocates the next Student ID', true, () => setDoc(doc(registrar, 'systemConfig/studentIdCounter'), { '2026': 1 }, { merge: true }));
await check('Registrar creates the official student record', true, () => setDoc(doc(registrar, 'studentProfiles/std-2026-PCM-0002'), { studentId: '2026-PCM-0002', authUid: 'appl1', email: 'appl1@gmail.com', enrollmentStatus: 'Enrolled', portalAccess: true }));
await check('Editor cannot create official student records', false, () => setDoc(doc(approvedEditor, 'studentProfiles/std-x'), { studentId: 'X' }));
await check('applicant cannot create their own student record', false, () => setDoc(doc(applicant, 'studentProfiles/std-y'), { studentId: 'Y', authUid: 'appl1' }));
await check('Registrar marks the application Enrolled', true, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'Enrolled', studentId: '2026-PCM-0002', studentRecordId: 'std-2026-PCM-0002' }));
await check('an enrolled application cannot be moved back', false, () => updateDoc(doc(registrar, 'applications/appA'), { status: 'Under Review' }));
await check('applicant sees their new student record', true, () => getDoc(doc(applicant, 'studentProfiles/std-2026-PCM-0002')));
await check('staff can waive payment with an assessment on file', true, async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'applications/appW'), { applicantUid: 'appl2', status: 'For Assessment', email: 'appl2@gmail.com' }));
  return updateDoc(doc(registrar, 'applications/appW'), { status: 'For Enrollment', paymentStatus: 'Waived', assessment: { total: 0, minimumPayment: 0 }, paymentWaivedReason: 'Full scholarship' });
});

section('Corrections, withdrawal and drafts');
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'applications/appC'), { applicantUid: 'appl2', status: 'Under Review', email: 'appl2@gmail.com', fullName: 'Wrong Name', referenceNumber: 'PCM-2026-CCCC' });
  await setDoc(doc(db, 'applications/appE'), { applicantUid: 'appl2', status: 'Enrolled', email: 'appl2@gmail.com' });
});
await check('Registrar returns the application for correction', true, () => updateDoc(doc(registrar, 'applications/appC'), { status: 'For Correction', applicantMessage: 'Please use your full legal name.' }));
await check('applicant cannot change their program while correcting', false, () => updateDoc(doc(otherApplicant, 'applications/appC'), { programName: 'MDiv', status: 'Under Review', updatedAt: 'now' }));
await check('applicant cannot admit themselves while correcting', false, () => updateDoc(doc(otherApplicant, 'applications/appC'), { fullName: 'Right Name', status: 'Admitted', updatedAt: 'now' }));
await check('applicant sends corrected details back for review', true, () => {
  const b = writeBatch(otherApplicant);
  b.update(doc(otherApplicant, 'applications/appC'), { fullName: 'Right Name', status: 'Under Review', correctedAt: 'now', updatedAt: 'now' });
  b.set(doc(otherApplicant, 'applications/appC/history/hCor'), { status: 'Under Review', actor: 'applicant', byName: 'Right Name' });
  return b.commit();
});
await check('applicant cannot edit details outside a correction request', false, () => updateDoc(doc(otherApplicant, 'applications/appC'), { fullName: 'Again', updatedAt: 'now' }));
await check('applicant withdraws an open application', true, () => {
  const b = writeBatch(otherApplicant);
  b.update(doc(otherApplicant, 'applications/appC'), { status: 'Withdrawn', withdrawnAt: 'now', withdrawalReason: 'Studying elsewhere', updatedAt: 'now' });
  b.set(doc(otherApplicant, 'applications/appC/history/hWd'), { status: 'Withdrawn', actor: 'applicant', byName: 'Right Name' });
  return b.commit();
});
await check('a withdrawn application cannot be reopened', false, () => updateDoc(doc(registrar, 'applications/appC'), { status: 'Under Review' }));
await check('an enrolled application cannot be withdrawn', false, () => updateDoc(doc(otherApplicant, 'applications/appE'), { status: 'Withdrawn', withdrawalReason: 'x', updatedAt: 'now' }));
await check("applicant cannot withdraw someone else's application", false, () => updateDoc(doc(applicant, 'applications/other1'), { status: 'Withdrawn', withdrawalReason: 'x', updatedAt: 'now' }));
await check('applicant saves an application draft', true, () => setDoc(doc(applicant, 'applicationDrafts/appl1'), { uid: 'appl1', step: 3, data: { firstName: 'Ana' }, updatedAt: 'now' }));
await check('applicant reads own draft', true, () => getDoc(doc(applicant, 'applicationDrafts/appl1')));
await check("applicant cannot read another applicant's draft", false, () => getDoc(doc(otherApplicant, 'applicationDrafts/appl1')));
await check("applicant cannot write another applicant's draft", false, () => setDoc(doc(otherApplicant, 'applicationDrafts/appl1'), { uid: 'appl1', step: 1, data: {}, updatedAt: 'now' }));
await check('applicant deletes own draft after submitting', true, () => deleteDoc(doc(applicant, 'applicationDrafts/appl1')));

section('Deleting applications');
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'applications/appDel'), { applicantUid: 'appl2', status: 'Rejected', email: 'appl2@gmail.com' });
  await setDoc(doc(db, 'applications/appDel/requirements/r1'), { applicantUid: 'appl2', status: 'Submitted', fileDataUrl: 'data:x' });
  await setDoc(doc(db, 'applications/appDel/payments/p1'), { applicantUid: 'appl2', status: 'Submitted', amount: 10 });
  await setDoc(doc(db, 'applications/appDel/history/h1'), { status: 'Rejected', actor: 'staff' });
});
await check('applicant cannot delete own application history', false, () => deleteDoc(doc(otherApplicant, 'applications/appDel/history/h1')));
await check('applicant cannot delete own application', false, () => deleteDoc(doc(otherApplicant, 'applications/appDel')));
await check('Editor cannot delete an application', false, () => deleteDoc(doc(approvedEditor, 'applications/appDel')));
await check('Finance cannot delete an application', false, () => deleteDoc(doc(finance, 'applications/appDel')));
await check('Registrar deletes an application with its documents, payments and history', true, () => {
  const b = writeBatch(registrar);
  b.delete(doc(registrar, 'applications/appDel/requirements/r1'));
  b.delete(doc(registrar, 'applications/appDel/payments/p1'));
  b.delete(doc(registrar, 'applications/appDel/history/h1'));
  b.delete(doc(registrar, 'applications/appDel'));
  b.set(doc(registrar, 'activityLogs/logDel'), { action: 'DELETE', entityType: 'Admission Application', entityId: 'appDel' });
  return b.commit();
});

section('Students see and change only their own records');
await check('student reads own record', true, () => getDoc(doc(studentUser, 'studentProfiles/std-linked')));
await check('student lists own record by uid', true, () => getDocs(query(collection(studentUser, 'studentProfiles'), where('authUid', '==', 'stu1'))));
await check("student cannot read another student's record", false, () => getDoc(doc(studentUser, 'studentProfiles/std-taken')));
await check('student cannot list all student records', false, () => getDocs(collection(studentUser, 'studentProfiles')));
await check('student updates own phone number', true, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { phone: '0917' }));
await check('student cannot change own Student ID', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { studentId: '9999' }));
await check('student cannot change own program', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { program: 'MDiv' }));
await check('student cannot mark self Enrolled', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { enrollmentStatus: 'Approved' }));
await check('student cannot change own term assessment', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { termAssessment: 0 }));
await check('student cannot change own previous balance', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { previousBalance: 0 }));
await check('student cannot change own assessment lines', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { termAssessmentLines: [] }));
await check('student submits a term enrollment with only status fields', true, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { enrollmentStatus: 'Submitted', currentSemester: '2nd Semester, AY 2026-2027', updatedAt: 'now' }));
await check('student submits a semester enrollment (status Submitted)', true, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { enrollmentStatus: 'Submitted', currentSemester: '2nd Semester, AY 2026-2027' }));
await check('legacy student links record by verified email', true, () => updateDoc(doc(legacyOwner, 'studentProfiles/std-legacy'), { authUid: 'leg1', linkedAt: 'now' }));
await check('cannot link a record with a different email', false, () => updateDoc(doc(applicant, 'studentProfiles/std-taken'), { authUid: 'appl1' }));
await check("cannot take over an already-linked record", false, () => updateDoc(doc(as('x9', 'stu1@gmail.com'), 'studentProfiles/std-linked'), { authUid: 'x9' }));
await check('student reads own enrollment request', true, () => getDoc(doc(studentUser, 'enrollments/enr-stu1')));
await check('student submits a semester enrollment request', true, () => setDoc(doc(studentUser, 'enrollments/enr-new'), { studentUid: 'stu1', status: 'Submitted' }));
await check('student cannot self-approve an enrollment', false, () => updateDoc(doc(studentUser, 'enrollments/enr-stu1'), { status: 'Approved' }));
await check("student cannot file a request for someone else", false, () => setDoc(doc(studentUser, 'enrollments/enr-x'), { studentUid: 'someoneElse', status: 'Submitted' }));
await check('Editor cannot approve enrollments', false, () => updateDoc(doc(approvedEditor, 'enrollments/enr-stu1'), { status: 'Approved' }));
await check('Registrar approves enrollments', true, () => updateDoc(doc(registrar, 'enrollments/enr-stu1'), { status: 'Approved' }));
await check('student reads own notification', true, () => getDoc(doc(studentUser, 'studentNotifications/n-stu1')));
await check('student marks notification read', true, () => updateDoc(doc(studentUser, 'studentNotifications/n-stu1'), { read: true }));
await check('student cannot edit notification text', false, () => updateDoc(doc(studentUser, 'studentNotifications/n-stu1'), { title: 'Changed' }));
await check("student cannot read someone else's notification", false, () => getDoc(doc(studentUser, 'studentNotifications/n-other')));
await check('student cannot send notifications to others', false, () => setDoc(doc(studentUser, 'studentNotifications/n-x'), { recipientUid: 'someoneElse', title: 'spam' }));
await check('applicant cannot read staff notifications', false, () => getDocs(collection(applicant, 'staffNotifications')));
await check('staff read staff notifications', true, () => getDocs(collection(approvedEditor, 'staffNotifications')));
await check('anonymous cannot read uploaded document log', false, () => getDoc(doc(anon, 'uploadedDocuments/u1')));

section('Balance payments are verified by payment staff');
const report = (over = {}) => ({ id: 'x', studentRecordId: 'std-linked', studentId: '2026-PCM-0001', studentUid: 'stu1', studentName: 'Linked Student', amount: 1000, method: 'GCash', referenceNo: 'REF12345', paidOn: '2026-10-01', status: 'Submitted', submittedAt: 'now', ...over });
await check('student reports a balance payment for own record', true, () => setDoc(doc(studentUser, 'studentPayments/sp-1'), report({ id: 'sp-1' })));
await check('student reports a payment and notifies staff in one batch', true, () => {
  const b = writeBatch(studentUser);
  b.set(doc(studentUser, 'studentPayments/sp-2'), report({ id: 'sp-2', amount: 500 }));
  b.set(doc(studentUser, 'staffNotifications/sp-2n'), { id: 'sp-2n', applicationId: 'std-linked', referenceNumber: '2026-PCM-0001', title: 'Balance payment submitted', message: 'x', createdByUid: 'stu1', read: false, createdAt: 'now' });
  return b.commit();
});
await check('student reads own payment reports', true, () => getDocs(query(collection(studentUser, 'studentPayments'), where('studentUid', '==', 'stu1'))));
await check('student cannot report a payment as Verified', false, () => setDoc(doc(studentUser, 'studentPayments/sp-v'), report({ id: 'sp-v', status: 'Verified' })));
await check('student cannot report a payment with reviewer fields', false, () => setDoc(doc(studentUser, 'studentPayments/sp-r'), report({ id: 'sp-r', reviewedBy: 'me' })));
await check('student cannot report a zero amount', false, () => setDoc(doc(studentUser, 'studentPayments/sp-0'), report({ id: 'sp-0', amount: 0 })));
await check("student cannot report against someone else's record", false, () => setDoc(doc(studentUser, 'studentPayments/sp-o'), report({ id: 'sp-o', studentRecordId: 'std-taken' })));
await check('student cannot report in another uid', false, () => setDoc(doc(studentUser, 'studentPayments/sp-u'), report({ id: 'sp-u', studentUid: 'someoneElse' })));
await check('student cannot verify own payment', false, () => updateDoc(doc(studentUser, 'studentPayments/sp-1'), { status: 'Verified', reviewedBy: 'me', reviewedAt: 'now', remarks: '' }));
await check("other student cannot read someone's payment", false, () => getDoc(doc(as('other', 'other@gmail.com'), 'studentPayments/sp-1')));
await check('Editor cannot verify payments', false, () => updateDoc(doc(approvedEditor, 'studentPayments/sp-1'), { status: 'Verified', reviewedBy: 'ed', reviewedAt: 'now', remarks: '' }));
await check('payment staff cannot change the amount when verifying', false, () => updateDoc(doc(finance, 'studentPayments/sp-1'), { status: 'Verified', amount: 5, reviewedBy: 'fin', reviewedAt: 'now', remarks: '' }));
await check('Registrar renames the term on a payment', true, () => updateDoc(doc(registrar, 'studentPayments/sp-1'), { term: '1st Semester, AY 2027–2028', updatedAt: 'now' }));
await check('renaming cannot change a payment amount', false, () => updateDoc(doc(registrar, 'studentPayments/sp-1'), { term: 'x', amount: 1, updatedAt: 'now' }));
await check('Finance cannot rename the term on a payment', false, () => updateDoc(doc(finance, 'studentPayments/sp-1'), { term: 'x', updatedAt: 'now' }));
await check('Finance verifies a payment and posts it to the student record', true, () => {
  const b = writeBatch(finance);
  b.update(doc(finance, 'studentPayments/sp-1'), { status: 'Verified', reviewedBy: 'Finance', reviewedAt: 'now', remarks: '' });
  b.update(doc(finance, 'studentProfiles/std-linked'), { tuitionPaid: 1000, tuitionBalance: 9000, paymentStatus: 'Partially Paid', updatedAt: 'now' });
  b.set(doc(finance, 'studentNotifications/sp-1n'), { id: 'sp-1n', recipientUid: 'stu1', title: 'Payment verified', read: false });
  return b.commit();
});
await check('a reviewed payment cannot be reviewed again', false, () => updateDoc(doc(finance, 'studentPayments/sp-1'), { status: 'Rejected', reviewedBy: 'Finance', reviewedAt: 'now', remarks: 'x' }));
await check('Registrar rejects a payment with remarks', true, () => updateDoc(doc(registrar, 'studentPayments/sp-2'), { status: 'Rejected', reviewedBy: 'Registrar', reviewedAt: 'now', remarks: 'Reference not found' }));
await check('Finance lists all payment reports', true, () => getDocs(collection(finance, 'studentPayments')));

section('Subjects per year level (curriculum)');
const curSubj = (over = {}) => ({ id: 'cur-1', programId: 'prog-bth', programName: 'Bachelor of Theology', yearLevel: '1st Year', semester: '1st Semester', code: 'BIB-101', title: 'Old Testament Survey', units: 3, status: 'Active', ...over });
await check('Registrar adds a curriculum subject', true, () => setDoc(doc(registrar, 'curriculumSubjects/cur-1'), curSubj()));
await check('Registrar cannot save a subject without a code', false, () => setDoc(doc(registrar, 'curriculumSubjects/cur-bad'), curSubj({ id: 'cur-bad', code: '' })));
await check('Registrar cannot save negative units', false, () => setDoc(doc(registrar, 'curriculumSubjects/cur-bad2'), curSubj({ id: 'cur-bad2', units: -1 })));
await check('student reads the curriculum', true, () => getDoc(doc(studentUser, 'curriculumSubjects/cur-1')));
await check('anyone can read the curriculum (public program pages)', true, () => getDoc(doc(anon, 'curriculumSubjects/cur-1')));
await check('anonymous cannot add a subject', false, () => setDoc(doc(anon, 'curriculumSubjects/cur-anon'), curSubj({ id: 'cur-anon' })));
await check('student cannot add a subject', false, () => setDoc(doc(studentUser, 'curriculumSubjects/cur-x'), curSubj({ id: 'cur-x' })));
await check('student cannot edit a subject', false, () => updateDoc(doc(studentUser, 'curriculumSubjects/cur-1'), { units: 6 }));
await check('student cannot delete a subject', false, () => deleteDoc(doc(studentUser, 'curriculumSubjects/cur-1')));
await check('Editor cannot change the curriculum', false, () => updateDoc(doc(approvedEditor, 'curriculumSubjects/cur-1'), { units: 6 }));
await check('Finance cannot change the curriculum', false, () => updateDoc(doc(finance, 'curriculumSubjects/cur-1'), { units: 6 }));
await check('Registrar updates a subject', true, () => updateDoc(doc(registrar, 'curriculumSubjects/cur-1'), { units: 2, title: 'OT Survey' }));
await check('Registrar deletes a subject', true, () => deleteDoc(doc(registrar, 'curriculumSubjects/cur-1')));

section('Official Admission Directory');
const contact = { id: 'contact-1', name: 'Rev. Test Officer', role: 'Director of Admissions', email: 'admissions@pcm.test', order: 1, visible: true };
await check('Admin adds a directory contact', true, () => setDoc(doc(admin, 'admissionContacts/contact-1'), contact));
await check('Registrar edits a directory contact', true, () => updateDoc(doc(registrar, 'admissionContacts/contact-1'), { hours: 'Mon to Fri' }));
await check('anyone can read the directory (public Admissions page)', true, () => getDoc(doc(anon, 'admissionContacts/contact-1')));
await check('anonymous cannot add a contact', false, () => setDoc(doc(anon, 'admissionContacts/contact-x'), { ...contact, id: 'contact-x' }));
await check('student cannot edit a contact', false, () => updateDoc(doc(studentUser, 'admissionContacts/contact-1'), { name: 'Hacked' }));
await check('student cannot delete a contact', false, () => deleteDoc(doc(studentUser, 'admissionContacts/contact-1')));
await check('Admin deletes a directory contact', true, () => deleteDoc(doc(admin, 'admissionContacts/contact-1')));

section('Term closing and re-enrollment (returning students)');
const reenr = (extra = {}) => ({
  studentUid: 'stu1', studentId: '2026-PCM-0001', studentRecordId: 'std-linked', reenrollment: true,
  termKey: '2027-2028|1st Semester', semester: '1st Semester', schoolYear: '2027–2028',
  status: 'Pending Requirements', selectedSubjects: [], totalUnits: 0, ...extra,
});
await check('student checks whether a request for the term exists', true, () => getDoc(doc(studentUser, 'enrollments/enr-none')));
await check('student files a re-enrollment for own record', true, () => setDoc(doc(studentUser, 'enrollments/enr-r1'), reenr({ id: 'enr-r1' })));
await check("student cannot file for another student's record", false, () => setDoc(doc(studentUser, 'enrollments/enr-r2'), reenr({ id: 'enr-r2', studentRecordId: 'std-taken' })));
await check('student cannot set their own clearance', false, () => setDoc(doc(studentUser, 'enrollments/enr-r3'), reenr({ id: 'enr-r3', clearances: { academic: { status: 'Cleared' } } })));
await check('student cannot confirm their own year level', false, () => setDoc(doc(studentUser, 'enrollments/enr-r5'), reenr({ id: 'enr-r5', approvedYearLevel: '4th Year' })));
await check('student cannot file an approved request', false, () => setDoc(doc(studentUser, 'enrollments/enr-r4'), reenr({ id: 'enr-r4', status: 'Approved' })));
await check('student uploads a required document', true, () => setDoc(doc(studentUser, 'enrollments/enr-r1/requirements/doc-1'), { id: 'doc-1', name: 'Clearance form', required: true, studentUid: 'stu1', status: 'Submitted', fileName: 'a.pdf' }));
await check('student cannot mark own document verified', false, () => updateDoc(doc(studentUser, 'enrollments/enr-r1/requirements/doc-1'), { status: 'Verified' }));
await check('student replaces a document', true, () => updateDoc(doc(studentUser, 'enrollments/enr-r1/requirements/doc-1'), { fileName: 'b.pdf', status: 'Submitted' }));
await check('student cannot move the request to another record', false, () => updateDoc(doc(studentUser, 'enrollments/enr-r1'), { studentRecordId: 'std-taken' }));
await check('student sends the request for verification', true, () => updateDoc(doc(studentUser, 'enrollments/enr-r1'), { status: 'For Verification' }));
await check('student cannot change the request once it is for verification', false, () => updateDoc(doc(studentUser, 'enrollments/enr-r1'), { notes: 'more subjects' }));
await check('student cannot upload after sending for verification', false, () => updateDoc(doc(studentUser, 'enrollments/enr-r1/requirements/doc-1'), { fileName: 'c.pdf', status: 'Submitted' }));
await check('student cannot approve their own request', false, () => updateDoc(doc(studentUser, 'enrollments/enr-r1'), { status: 'Approved' }));
await check('Finance clears the financial clearance', true, () => setDoc(doc(finance, 'enrollments/enr-r1'), { clearances: { financial: { status: 'Cleared', by: 'Fin' } } }, { merge: true }));
await check('Registrar confirms the year level', true, () => setDoc(doc(registrar, 'enrollments/enr-r1'), { approvedYearLevel: '2nd Year' }, { merge: true }));
await check('Registrar verifies the document', true, () => updateDoc(doc(registrar, 'enrollments/enr-r1/requirements/doc-1'), { status: 'Verified', reviewedBy: 'Reg' }));
await check("another signed-in user cannot read the request's documents", false, () => getDoc(doc(as('stranger', 'stranger@gmail.com'), 'enrollments/enr-r1/requirements/doc-1')));
await check('student reads own documents', true, () => getDoc(doc(studentUser, 'enrollments/enr-r1/requirements/doc-1')));
await check('student lists own requests', true, () => getDocs(query(collection(studentUser, 'enrollments'), where('studentUid', '==', 'stu1'))));
await check('student cannot change own term history', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { termHistory: [] }));
await check('student cannot lift own enrollment hold', false, () => updateDoc(doc(studentUser, 'studentProfiles/std-linked'), { enrollmentHold: { active: false, reason: '' } }));
await check('Registrar records closed-term history', true, () => setDoc(doc(registrar, 'studentProfiles/std-linked'), { termHistory: [{ term: '1st Semester, AY 2026–2027' }], lastEnrolledTerm: '1st Semester, AY 2026–2027', enrollmentStatus: 'Not Enrolled' }, { merge: true }));
await check('Registrar places an enrollment hold', true, () => setDoc(doc(registrar, 'studentProfiles/std-linked'), { enrollmentHold: { active: true, reason: 'On leave' } }, { merge: true }));
await check('Registrar archives the closed term', true, () => setDoc(doc(registrar, 'academicPeriods/p-closed'), { status: 'Archived', closedAt: '2026-10-15' }, { merge: true }));
await check('student cannot close a term', false, () => setDoc(doc(studentUser, 'academicPeriods/p-closed'), { status: 'Active' }, { merge: true }));

section('Grades: grade sheets and amendments');
await env.withSecurityRulesDisabled(async (ctx) => {
  const sdb = ctx.firestore();
  await setDoc(doc(sdb, 'gradeSheets/gs-1'), { id: 'gs-1', termKey: '2026-2027|1st Semester', subjectCode: 'THE-301', instructorEmail: 'prof1@pcm.edu.ph', status: 'Draft', roster: ['std-linked', 'std-taken'], students: [], grades: {}, version: 0 });
  await setDoc(doc(sdb, 'gradeSheets/gs-other'), { id: 'gs-other', termKey: '2026-2027|1st Semester', subjectCode: 'BIB-301', instructorEmail: 'prof2@pcm.edu.ph', status: 'Finalized', roster: ['std-linked'], students: [], grades: { 'std-linked': { grade: '2.00' } }, version: 3 });
});
const prof = as('prof1uid', 'prof1@pcm.edu.ph');
const profUnverified = as('prof1x', 'prof1@pcm.edu.ph', false);
const save = (extra = {}) => ({ grades: { 'std-linked': { grade: '1.50' } }, status: 'Draft', version: 1, savedAt: 'now', savedBy: 'Prof', savedByUid: 'prof1uid', ...extra });
await check('professor reads own grade sheet', true, () => getDoc(doc(prof, 'gradeSheets/gs-1')));
await check('professor lists own grade sheets', true, () => getDocs(query(collection(prof, 'gradeSheets'), where('instructorEmail', '==', 'prof1@pcm.edu.ph'))));
await check("professor cannot read another professor's sheet", false, () => getDoc(doc(prof, 'gradeSheets/gs-other')));
await check('unverified email cannot read the sheet', false, () => getDoc(doc(profUnverified, 'gradeSheets/gs-1')));
await check('student cannot read a grade sheet', false, () => getDoc(doc(studentUser, 'gradeSheets/gs-1')));
await check('professor cannot create a grade sheet', false, () => setDoc(doc(prof, 'gradeSheets/gs-new'), { instructorEmail: 'prof1@pcm.edu.ph', status: 'Draft', roster: [], grades: {}, version: 0 }));
await check('professor saves a draft', true, () => updateDoc(doc(prof, 'gradeSheets/gs-1'), save()));
await check('stale save is refused (version)', false, () => updateDoc(doc(prof, 'gradeSheets/gs-1'), save({ version: 1 })));
await check('professor cannot grade a student not on the class list', false, () => updateDoc(doc(prof, 'gradeSheets/gs-1'), save({ version: 2, grades: { 'std-x': { grade: '1.00' } } })));
await check('professor cannot change the class list', false, () => updateDoc(doc(prof, 'gradeSheets/gs-1'), { ...save({ version: 2 }), roster: ['std-linked', 'std-taken', 'std-x'] }));
await check('professor cannot approve own sheet', false, () => updateDoc(doc(prof, 'gradeSheets/gs-1'), save({ version: 2, status: 'Approved' })));
await check("professor cannot grade another professor's class", false, () => updateDoc(doc(prof, 'gradeSheets/gs-other'), save({ version: 4 })));
await check('professor submits for review', true, () => updateDoc(doc(prof, 'gradeSheets/gs-1'), save({ version: 2, status: 'Submitted', submittedAt: 'now', submittedBy: 'Prof', submittedByUid: 'prof1uid' })));
await check('professor cannot edit after submitting', false, () => updateDoc(doc(prof, 'gradeSheets/gs-1'), save({ version: 3, status: 'Draft' })));
await check('Editor cannot review grades', false, () => updateDoc(doc(approvedEditor, 'gradeSheets/gs-1'), { status: 'Under Review' }));
await check('Finance cannot approve grades', false, () => updateDoc(doc(finance, 'gradeSheets/gs-1'), { status: 'Approved' }));
await check('Registrar starts the review', true, () => updateDoc(doc(registrar, 'gradeSheets/gs-1'), { status: 'Under Review', reviewedBy: 'Reg' }));
await check('Registrar approves', true, () => updateDoc(doc(registrar, 'gradeSheets/gs-1'), { status: 'Approved', approvedBy: 'Reg' }));
await check('Registrar finalizes', true, () => updateDoc(doc(registrar, 'gradeSheets/gs-1'), { status: 'Finalized', finalizedBy: 'Reg', finalizedAt: 'now' }));
await check('finalized grades cannot be edited directly', false, () => updateDoc(doc(registrar, 'gradeSheets/gs-1'), { grades: { 'std-linked': { grade: '1.00' } } }));
await check('finalized sheet cannot be reopened', false, () => updateDoc(doc(registrar, 'gradeSheets/gs-1'), { status: 'Draft' }));
await check('Registrar publishes the finalized sheet', true, () => updateDoc(doc(registrar, 'gradeSheets/gs-1'), { publishedAt: 'now', publishedBy: 'Reg', updatedAt: 'now' }));
const amend = (id, extra = {}) => ({ id, sheetId: 'gs-1', termKey: '2026-2027|1st Semester', subjectCode: 'THE-301', studentRecordId: 'std-linked', studentId: '2026-PCM-0001', studentName: 'Linked Student', previousGrade: '1.50', newGrade: '1.25', reason: 'Recomputation error on the final exam', status: 'Pending', requestedBy: 'Prof', requestedByUid: 'prof1uid', requestedAt: 'now', ...extra });
await check('student cannot request a grade change', false, () => setDoc(doc(studentUser, 'gradeAmendments/am-0'), amend('am-0', { requestedByUid: 'stu1' })));
await check('professor requests a grade change with a reason', true, () => setDoc(doc(prof, 'gradeAmendments/am-1'), amend('am-1')));
await check('a grade change needs a reason', false, () => setDoc(doc(prof, 'gradeAmendments/am-2'), amend('am-2', { reason: '' })));
await check("professor cannot request changes to another professor's class", false, () => setDoc(doc(prof, 'gradeAmendments/am-3'), amend('am-3', { sheetId: 'gs-other' })));
await check('professor cannot approve own grade change', false, () => updateDoc(doc(prof, 'gradeAmendments/am-1'), { status: 'Approved', decidedBy: 'Prof', decidedByUid: 'prof1uid', decidedAt: 'now' }));
await check('grade change cannot be applied before it is approved', false, () =>
  updateDoc(doc(registrar, 'gradeSheets/gs-1'), { grades: { 'std-linked': { grade: '1.25' } }, amendmentLog: [{ amendmentId: 'am-1', previousGrade: '1.50', newGrade: '1.25' }], updatedAt: 'now' })
);
await check('Registrar approves and applies the grade change (with audit entry)', true, () => {
  const b = writeBatch(registrar);
  b.update(doc(registrar, 'gradeAmendments/am-1'), { status: 'Approved', decidedBy: 'Reg', decidedByUid: 'reg1', decidedAt: 'now', decisionRemarks: '' });
  b.update(doc(registrar, 'gradeSheets/gs-1'), { grades: { 'std-linked': { grade: '1.25' } }, amendmentLog: [{ amendmentId: 'am-1', previousGrade: '1.50', newGrade: '1.25' }], updatedAt: 'now' });
  return b.commit();
});
await check('a decided grade change cannot be changed', false, () => updateDoc(doc(registrar, 'gradeAmendments/am-1'), { status: 'Rejected', decidedBy: 'Reg', decidedByUid: 'reg1', decidedAt: 'later' }));
// Renaming a term (Academic Terms) moves its name onto finalized sheets, decided grade changes and reviewed payments.
await check('Registrar renames the term on a finalized grade sheet', true, () =>
  updateDoc(doc(registrar, 'gradeSheets/gs-other'), { termKey: '2027-2028|1st Semester', academicYear: '2027–2028', semester: '1st Semester', updatedAt: 'now' })
);
await check('renaming cannot change finalized grades', false, () =>
  updateDoc(doc(registrar, 'gradeSheets/gs-other'), { termKey: '2027-2028|1st Semester', grades: { 'std-linked': { grade: '1.00' } }, updatedAt: 'now' })
);
await check('professor cannot rename the term on a sheet', false, () => updateDoc(doc(prof, 'gradeSheets/gs-other'), { termKey: 'x', updatedAt: 'now' }));
await check('Registrar renames the term on a decided grade change', true, () => updateDoc(doc(registrar, 'gradeAmendments/am-1'), { termKey: '2027-2028|1st Semester', updatedAt: 'now' }));
await check('renaming cannot change a grade change decision', false, () => updateDoc(doc(registrar, 'gradeAmendments/am-1'), { termKey: 'y', status: 'Rejected', updatedAt: 'now' }));
await check('grade changes cannot be deleted', false, () => deleteDoc(doc(registrar, 'gradeAmendments/am-1')));
await check('professor reads own grade change requests', true, () => getDocs(query(collection(prof, 'gradeAmendments'), where('requestedByUid', '==', 'prof1uid'))));
await check('Registrar notifies the professor', true, () => setDoc(doc(registrar, 'studentNotifications/n-prof'), { recipientUid: 'prof1uid', title: 'Grades approved', read: false }));
await check('professor reads own notification', true, () => getDoc(doc(prof, 'studentNotifications/n-prof')));

section('Student categories: returnee record link and transfer credits');
const catApp = (extra = {}) => ({ applicantUid: 'appl9', email: 'appl9@gmail.com', fullName: 'Applicant Nine', status: 'Submitted', applicantType: 'Returning Student', ...extra });
const applicant9 = as('appl9', 'appl9@gmail.com');
await check('applicant applies as a returning student', true, () => setDoc(doc(applicant9, 'applications/cat-1'), catApp()));
await check('applicant cannot link themselves to a student record', false, () => setDoc(doc(applicant9, 'applications/cat-2'), catApp({ linkedStudentRecordId: 'std-linked' })));
await check('applicant cannot claim transfer credits', false, () => setDoc(doc(applicant9, 'applications/cat-3'), catApp({ applicantType: 'Transfer Student', creditedSubjects: [{ code: 'BIB-101', units: 3 }] })));
await check('applicant cannot skip the record check', false, () => setDoc(doc(applicant9, 'applications/cat-4'), catApp({ noPriorRecordConfirmed: true })));
await check('applicant cannot add a record link later', false, () => updateDoc(doc(applicant9, 'applications/cat-1'), { linkedStudentRecordId: 'std-linked' }));
await check('Registrar links the returnee to their record', true, () => updateDoc(doc(registrar, 'applications/cat-1'), { linkedStudentRecordId: 'std-legacy', recordLinkedBy: 'Reg', updatedAt: 'now' }));
await check('Registrar records transfer credits', true, () => updateDoc(doc(registrar, 'applications/cat-1'), { creditedSubjects: [{ code: 'BIB-101', title: 'OT Survey', units: 3, sourceSchool: 'Other College' }], creditsEvaluatedBy: 'Reg' }));
await check('Finance cannot link student records', false, () => updateDoc(doc(finance, 'applications/cat-1'), { linkedStudentRecordId: 'std-x' }));

section('Batch writes stay within Firestore limits');
await check('Editor commits a 40-document batch', true, () => {
  const b = writeBatch(editor);
  for (let i = 0; i < 40; i++) b.set(doc(editor, `programs/batch-${i}`), { order: i });
  return b.commit();
});
await check('anonymous batch is rejected', false, () => {
  const b = writeBatch(anon);
  for (let i = 0; i < 5; i++) b.set(doc(anon, `programs/anon-${i}`), { order: i });
  return b.commit();
});

await env.cleanup();
const tests = results.filter((r) => r[0] !== '----');
const failed = tests.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r[0] === '----' ? `\n## ${r[1]}` : `${r[0]} ${r[1]}`);
console.log(`\n${tests.length - failed.length}/${tests.length} passed`);
process.exit(failed.length ? 1 : 0);
