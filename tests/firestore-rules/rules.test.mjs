// Firestore rules tests for the PCM website. Runs against the local emulator only.
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const rulesPath = process.env.RULES_PATH || new URL('../../firestore.rules', import.meta.url);
const env = await initializeTestEnvironment({
  projectId: 'demo-pcm-rules',
  firestore: { rules: readFileSync(rulesPath, 'utf8'), host: '127.0.0.1', port: 8085 },
});

// Seed data with rules disabled.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'siteConfig/global'), { title: 'PCM' });
  await setDoc(doc(db, 'news/n1'), { title: 'News' });
  await setDoc(doc(db, 'applications/a1'), { status: 'Submitted' });
  await setDoc(doc(db, 'activityLogs/l1'), { action: 'LOGIN' });
  await setDoc(doc(db, 'studentProfiles/sp1'), { fullName: 'Student' });
  await setDoc(doc(db, 'uploadedMedia/m1'), { url: '/uploads/x.jpg' });
  await setDoc(doc(db, 'users/s1'), { role: 'Student/User', status: 'Active' });
  await setDoc(doc(db, 'users/dis'), { role: 'Student/User', status: 'Disabled' });
  await setDoc(doc(db, 'users/other'), { role: 'Student/User', status: 'Active' });
  await setDoc(doc(db, 'users/super2'), { role: 'Super Admin', adminRole: 'Super Admin', status: 'Active' });
  await setDoc(doc(db, 'users/u9'), { role: 'Admin', status: 'Active' });
  await setDoc(doc(db, 'users/u9p'), { role: 'Admin', status: 'Pending' });
  await setDoc(doc(db, 'adminUsers/u10'), { role: 'Content Admin', status: 'Active', email: 'u10@pcm.edu.ph' });
  await setDoc(doc(db, 'adminUsers/adm-5'), { role: 'Editor', status: 'Active', email: 'editor@pcm.edu.ph', avatarUrl: '' });
  await setDoc(doc(db, 'adminEmails/editor@pcm.edu.ph'), { email: 'editor@pcm.edu.ph', role: 'Editor', active: true, adminId: 'adm-5' });
  await setDoc(doc(db, 'adminEmails/old@pcm.edu.ph'), { email: 'old@pcm.edu.ph', role: 'Admin', active: false });
});

const anon = env.unauthenticatedContext().firestore();
const as = (uid, email, verified = true) =>
  env.authenticatedContext(uid, { email, email_verified: verified }).firestore();

const student = as('s1', 'student@gmail.com');
const disabled = as('dis', 'dis@gmail.com');
const fakeSuper = as('fs', 'angeloperfecto.epc@gmail.com', false);
const superAdmin = as('angelo', 'AngeloPerfecto.EPC@gmail.com');
const editor = as('ed1', 'editor@pcm.edu.ph');
const editorUnverified = as('ed2', 'editor@pcm.edu.ph', false);
const oldAdmin = as('old1', 'old@pcm.edu.ph');
const usersDocAdmin = as('u9', 'u9@gmail.com');
const pendingAdmin = as('u9p', 'u9p@gmail.com');
const uidAdmin = as('u10', 'u10@pcm.edu.ph');

const results = [];
async function check(name, expectAllowed, fn) {
  try {
    await (expectAllowed ? assertSucceeds(fn()) : assertFails(fn()));
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name + ' -> ' + (e?.message || e).toString().split('\n')[0]]);
  }
}

// Anonymous visitors
await check('anon reads site config', true, () => getDoc(doc(anon, 'siteConfig/global')));
await check('anon cannot edit site config', false, () => setDoc(doc(anon, 'siteConfig/global'), { title: 'hacked' }));
await check('anon cannot add programs', false, () => setDoc(doc(anon, 'programs/p9'), { name: 'x' }));
await check('anon cannot delete news', false, () => deleteDoc(doc(anon, 'news/n1')));
await check('anon submits application', true, () => setDoc(doc(anon, 'applications/a2'), { status: 'Submitted' }));
await check('anon cannot change application', false, () => updateDoc(doc(anon, 'applications/a1'), { status: 'Accepted' }));
await check('anon cannot delete application', false, () => deleteDoc(doc(anon, 'applications/a1')));
await check('anon submits inquiry', true, () => setDoc(doc(anon, 'inquiries/i1'), { message: 'hi' }));
await check('anon writes activity log', true, () => setDoc(doc(anon, 'activityLogs/l2'), { action: 'LOGIN' }));
await check('anon cannot alter activity log', false, () => updateDoc(doc(anon, 'activityLogs/l1'), { action: 'X' }));
await check('anon student portal updates profile', true, () => setDoc(doc(anon, 'studentProfiles/sp1'), { phone: '1' }, { merge: true }));
await check('anon cannot delete student profile', false, () => deleteDoc(doc(anon, 'studentProfiles/sp1')));
await check('server route creates upload record', true, () => setDoc(doc(anon, 'uploadedMedia/m2'), { url: '/uploads/y.jpg' }));
await check('anon cannot overwrite upload record', false, () => setDoc(doc(anon, 'uploadedMedia/m1'), { url: 'evil' }));
await check('anon cannot create user', false, () => setDoc(doc(anon, 'users/zz'), { role: 'Student/User' }));
await check('anon cannot write adminUsers', false, () => setDoc(doc(anon, 'adminUsers/x'), { role: 'Super Admin' }));
await check('anon cannot read admin email index', false, () => getDoc(doc(anon, 'adminEmails/editor@pcm.edu.ph')));
await check('anon cannot write unknown collection', false, () => setDoc(doc(anon, 'mystery/x'), { a: 1 }));
await check('unlisted collections are denied', false, () => getDoc(doc(anon, 'mystery/x')));

// Signed-in student
await check('student creates own profile', true, () => setDoc(doc(as('new1', 'n@gmail.com'), 'users/new1'), { role: 'Student/User', status: 'Active' }));
await check('student cannot self-create as Super Admin', false, () => setDoc(doc(as('new2', 'n2@gmail.com'), 'users/new2'), { role: 'Super Admin', status: 'Active' }));
await check('student cannot self-create as Admin', false, () => setDoc(doc(as('new3', 'n3@gmail.com'), 'users/new3'), { role: 'Admin', status: 'Active' }));
await check('student cannot self-create with adminRole', false, () => setDoc(doc(as('new4', 'n4@gmail.com'), 'users/new4'), { role: 'Student/User', adminRole: 'Super Admin' }));
await check('student cannot promote self to Admin', false, () => updateDoc(doc(student, 'users/s1'), { role: 'Admin' }));
await check('student cannot activate admin role via status', false, () => updateDoc(doc(student, 'users/s1'), { role: 'Super Admin', status: 'Active' }));
await check('student updates own lastLogin', true, () => updateDoc(doc(student, 'users/s1'), { lastLogin: 'now' }));
await check('student requests admin access (Pending)', true, () => updateDoc(doc(student, 'users/s1'), { status: 'Pending', verificationStatus: 'Pending', requestedRole: 'Admin' }));
await check('student links Student ID (role Student)', true, () => updateDoc(doc(student, 'users/s1'), { role: 'Student', status: 'Active' }));
await check('student cannot edit another user', false, () => updateDoc(doc(student, 'users/other'), { name: 'x' }));
await check('student cannot edit site content', false, () => setDoc(doc(student, 'siteConfig/global'), { title: 'x' }));
await check('disabled user cannot reactivate self', false, () => updateDoc(doc(disabled, 'users/dis'), { status: 'Active' }));

// Unverified account using the Super Admin email
await check('unverified super email cannot edit content', false, () => setDoc(doc(fakeSuper, 'siteConfig/global'), { title: 'x' }));
await check('unverified super email cannot self-create Super Admin', false, () => setDoc(doc(fakeSuper, 'users/fs'), { role: 'Super Admin', status: 'Active' }));

// Verified Super Admin (email match is case-insensitive)
await check('super admin edits site config', true, () => setDoc(doc(superAdmin, 'siteConfig/global'), { title: 'PCM 2' }));
await check('super admin creates own Super Admin profile', true, () => setDoc(doc(superAdmin, 'users/angelo'), { role: 'Super Admin', adminRole: 'Super Admin', status: 'Active' }));
await check('super admin adds admin', true, () => setDoc(doc(superAdmin, 'adminUsers/adm-9'), { role: 'Admin', status: 'Active', email: 'a9@pcm.edu.ph' }));
await check('super admin writes email index', true, () => setDoc(doc(superAdmin, 'adminEmails/a9@pcm.edu.ph'), { role: 'Admin', active: true }));
await check('super admin promotes user to Super Admin', true, () => updateDoc(doc(superAdmin, 'users/other'), { role: 'Super Admin' }));
await check('super admin deletes news', true, () => deleteDoc(doc(superAdmin, 'news/n1')));

// Admin recognised through the email index (verified Google account)
await check('indexed editor edits programs', true, () => setDoc(doc(editor, 'programs/p1'), { name: 'BTh' }));
await check('indexed editor creates own profile with Editor role', true, () => setDoc(doc(editor, 'users/ed1'), { role: 'Editor', adminRole: 'Editor', status: 'Active' }));
await check('indexed editor cannot grant Super Admin', false, () => updateDoc(doc(editor, 'users/s1'), { role: 'Super Admin' }));
await check('indexed editor cannot demote a Super Admin', false, () => updateDoc(doc(editor, 'users/super2'), { role: 'Admin' }));
await check('indexed editor cannot delete a Super Admin', false, () => deleteDoc(doc(editor, 'users/super2')));
await check('indexed editor approves a regular user', true, () => updateDoc(doc(editor, 'users/s1'), { status: 'Active' }));
await check('indexed editor cannot add admins', false, () => setDoc(doc(editor, 'adminUsers/adm-x'), { role: 'Admin', status: 'Active' }));
await check('indexed editor updates own avatar', true, () => updateDoc(doc(editor, 'adminUsers/adm-5'), { avatarUrl: 'a.jpg' }));
await check('indexed editor cannot change own role', false, () => updateDoc(doc(editor, 'adminUsers/adm-5'), { role: 'Super Admin' }));
await check('indexed editor cannot change own email', false, () => updateDoc(doc(editor, 'adminUsers/adm-5'), { email: 'x@y.z' }));
await check('indexed editor cannot write email index', false, () => setDoc(doc(editor, 'adminEmails/me@x.com'), { role: 'Super Admin', active: true }));
await check('indexed editor reads email index', true, () => getDoc(doc(editor, 'adminEmails/editor@pcm.edu.ph')));
await check('same email unverified cannot edit', false, () => setDoc(doc(editorUnverified, 'programs/p1'), { name: 'x' }));
await check('inactive index entry cannot edit', false, () => setDoc(doc(oldAdmin, 'programs/p1'), { name: 'x' }));

// Admins recognised by users/{uid} or adminUsers/{uid}
await check('users-doc admin edits news', true, () => setDoc(doc(usersDocAdmin, 'news/n2'), { title: 'x' }));
await check('pending admin cannot edit news', false, () => setDoc(doc(pendingAdmin, 'news/n3'), { title: 'x' }));
await check('adminUsers/{uid} admin edits news', true, () => setDoc(doc(uidAdmin, 'news/n4'), { title: 'x' }));
await check('admin updates application status', true, () => updateDoc(doc(usersDocAdmin, 'applications/a1'), { status: 'Accepted' }));
await check('admin deletes student profile', true, () => deleteDoc(doc(usersDocAdmin, 'studentProfiles/sp1')));

// The CMS saves collections in batches (syncAllDataToFirestore); role lookups must stay
// within Firestore's per-request document-access limit.
await check('indexed editor commits a 40-document batch', true, () => {
  const b = writeBatch(editor);
  for (let i = 0; i < 40; i++) b.set(doc(editor, `programs/batch-${i}`), { order: i });
  return b.commit();
});
await check('anon batch is rejected', false, () => {
  const b = writeBatch(anon);
  for (let i = 0; i < 5; i++) b.set(doc(anon, `programs/anon-${i}`), { order: i });
  return b.commit();
});

await env.cleanup();
const failed = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r[0], r[1]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
