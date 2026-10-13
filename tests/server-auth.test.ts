// Checks that lib/serverAuth.ts resolves admin levels the same way as firestore.rules.
// Run from the project root: npx tsx tests/server-auth.test.ts
import { resolveAdminLevel } from '../lib/serverAuth';

const cases: Array<[string, number, Parameters<typeof resolveAdminLevel>]> = [
  ['anonymous / no records', 0, ['', null, null, null]],
  ['built-in Super Admin email', 3, ['angeloperfecto.epc@gmail.com', null, null, null]],
  ['built-in Super Admin with Disabled profile', 3, ['president@pcm.edu.ph', { role: 'Super Admin', status: 'Disabled' }, null, null]],
  ['regular user', 0, ['s@gmail.com', { role: 'Student/User', status: 'Active' }, null, null]],
  ['pending admin registration', 0, ['p@gmail.com', { role: 'Pending User', status: 'Pending' }, null, null]],
  ['Admin-role profile still pending', 0, ['p@gmail.com', { role: 'Admin', status: 'Pending' }, null, null]],
  ['approved Admin', 2, ['a@gmail.com', { role: 'Admin', status: 'Active' }, null, null]],
  ['approved as Editor (role Admin, adminRole Editor)', 1, ['e@gmail.com', { role: 'Admin', adminRole: 'Editor', status: 'Active' }, null, null]],
  ['approved as Super Admin (role Admin, adminRole Super Admin)', 3, ['s2@gmail.com', { role: 'Admin', adminRole: 'Super Admin', status: 'Active' }, null, null]],
  ['adminUsers/{uid} Content Admin', 1, ['c@pcm.edu.ph', null, { role: 'Content Admin', status: 'Active' }, null]],
  ['adminUsers/{uid} inactive', 0, ['c@pcm.edu.ph', null, { role: 'Content Admin', status: 'Inactive' }, null]],
  ['email index Editor', 1, ['ed@pcm.edu.ph', { role: 'Student/User', status: 'Active' }, null, { role: 'Editor', active: true }]],
  ['email index Admin', 2, ['ad@pcm.edu.ph', null, null, { role: 'Admin', active: true }]],
  ['email index inactive', 0, ['old@pcm.edu.ph', null, null, { role: 'Admin', active: false }]],
  ['rejected profile with stale index entry', 0, ['rej@pcm.edu.ph', { role: 'Pending User', status: 'Rejected' }, null, { role: 'Editor', active: true }]],
  ['disabled Admin profile', 0, ['d@gmail.com', { role: 'Admin', status: 'Disabled' }, null, null]],
  ['unverified email (passed as empty) with index', 0, ['', null, null, null]],
];

let failed = 0;
for (const [name, expected, args] of cases) {
  const got = resolveAdminLevel(...args);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} (expected ${expected}, got ${got})`);
}
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
