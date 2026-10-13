// Seeds the local Firestore emulator with the accounts used by the end-to-end workflow test.
// Uses the emulator's "owner" token, which bypasses security rules (emulator only).
const PROJECT = process.env.PROJECT || 'demo-pcm';
const DATABASE = 'ai-studio-pcmphilippinesco-1fe1b957-9c70-415b-a11f-b6fce7a98c4f';
const BASE = `http://127.0.0.1:8085/v1/projects/${PROJECT}/databases/${DATABASE}/documents`;

function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
    else fields[k] = { stringValue: String(v) };
  }
  return { fields };
}

async function put(path, data) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify(toFields(data)),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

await put('systemConfig/metadata', { isInitialized: true });
// Registrar recognised through the admin directory (email index), as in production.
await put('adminUsers/adm-registrar', { id: 'adm-registrar', name: 'Test Registrar', email: 'registrar@pcm.test', username: 'registrar', role: 'Registrar', status: 'Active' });
await put('adminEmails/registrar@pcm.test', { email: 'registrar@pcm.test', role: 'Registrar', active: true, adminId: 'adm-registrar' });
// An Editor, who may view admissions but not decide.
await put('adminUsers/adm-editor', { id: 'adm-editor', name: 'Test Editor', email: 'editor@pcm.test', username: 'editor', role: 'Editor', status: 'Active' });
await put('adminEmails/editor@pcm.test', { email: 'editor@pcm.test', role: 'Editor', active: true, adminId: 'adm-editor' });
// An existing student (no Google account linked yet) to test automatic linking.
await put('studentProfiles/std-legacy', {
  id: 'std-legacy',
  studentId: '2024-PCM-0418',
  fullName: 'Legacy Student',
  email: 'legacy.student@pcm.test',
  program: 'Bachelor of Theology',
  degreeProgram: 'Bachelor of Theology',
  yearLevel: '3rd Year',
  enrollmentStatus: 'Enrolled',
  currentSemester: '1st Semester, AY 2026-2027',
  homeChurch: 'Test Church',
  mentorName: 'Test Mentor',
  avatarUrl: '',
});
console.log('Emulator seeded.');
