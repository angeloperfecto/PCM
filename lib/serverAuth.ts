import type { NextRequest } from 'next/server';
import { firebaseConfig } from './firebaseConfig';

// Server-side admin check for API routes. Verifies the caller's Firebase ID token and
// resolves their admin level with the same logic as adminLevel() in firestore.rules:
//   3 = Super Admin, 2 = Admin, 1 = other approved admin roles, 0 = not an admin.
// Role documents are read through the Firestore REST API *as the caller*, so the
// database rules still apply to these reads.

const SUPER_ADMIN_EMAILS = ['angeloperfecto.epc@gmail.com', 'president@pcm.edu.ph'];
const ADMIN_ROLES = ['Super Admin', 'Admin', 'Staff/Editor', 'Editor', 'Content Admin', 'Academic Admin', 'Registrar', 'Finance'];
const BLOCKED_STATUSES = ['Rejected', 'Disabled', 'Inactive'];

type Fields = Record<string, unknown>;

export type AdminCheck =
  | { ok: true; uid: string; email: string; level: number }
  | { ok: false; status: number; error: string };

const isActive = (s: unknown) => s === 'Active' || s === 'Approved';
const str = (v: unknown) => (typeof v === 'string' ? v : '');

const levelOfRole = (role: string) =>
  role === 'Super Admin' ? 3 : role === 'Admin' ? 2 : ADMIN_ROLES.includes(role) ? 1 : 0;

// Exported for tests; mirrors levelFrom() in firestore.rules.
export function resolveAdminLevel(email: string, user: Fields | null, adminDoc: Fields | null, emailIndex: Fields | null): number {
  if (email && SUPER_ADMIN_EMAILS.includes(email)) return 3;
  if (user && BLOCKED_STATUSES.includes(str(user.status))) return 0;

  const role = str(user?.role);
  const adminRole = str(user?.adminRole);
  const effectiveRole = ADMIN_ROLES.includes(adminRole) ? adminRole : role;
  const profileRole = user && ADMIN_ROLES.includes(role) && isActive(user.status) ? effectiveRole : '';

  let directoryRole = '';
  if (emailIndex?.active === true) {
    directoryRole = str(emailIndex.role);
  } else if (adminDoc && isActive(adminDoc.status ?? 'Active') && ADMIN_ROLES.includes(str(adminDoc.role))) {
    directoryRole = str(adminDoc.role);
  }

  return Math.max(levelOfRole(profileRole), levelOfRole(directoryRole));
}

function decodeFields(fields: Record<string, any> | undefined): Fields {
  const out: Fields = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value && typeof value === 'object') {
      if ('stringValue' in value) out[key] = value.stringValue;
      else if ('booleanValue' in value) out[key] = value.booleanValue;
      else if ('nullValue' in value) out[key] = null;
    }
  }
  return out;
}

async function readDocAsUser(path: string, idToken: string): Promise<Fields | null> {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` }, cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Role lookup failed (${res.status})`);
  const body = await res.json();
  return decodeFields(body.fields);
}

export async function requireAdmin(req: NextRequest, minLevel = 1): Promise<AdminCheck> {
  const header = req.headers.get('authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!idToken) return { ok: false, status: 401, error: 'Sign in as an administrator to perform this action.' };

  try {
    // Verify the ID token with Firebase Auth.
    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }), cache: 'no-store' }
    );
    if (!lookup.ok) return { ok: false, status: 401, error: 'Your session has expired. Please sign in again.' };
    const account = (await lookup.json())?.users?.[0];
    if (!account?.localId || account.disabled) return { ok: false, status: 401, error: 'Invalid session.' };

    const uid: string = account.localId;
    const email = account.emailVerified === true ? str(account.email).toLowerCase() : '';

    const [user, adminDoc, emailIndex] = await Promise.all([
      readDocAsUser(`users/${encodeURIComponent(uid)}`, idToken),
      readDocAsUser(`adminUsers/${encodeURIComponent(uid)}`, idToken),
      email ? readDocAsUser(`adminEmails/${encodeURIComponent(email)}`, idToken) : Promise.resolve(null),
    ]);

    const level = resolveAdminLevel(email, user, adminDoc, emailIndex);
    if (level < minLevel) {
      return { ok: false, status: 403, error: 'Your account is not an approved administrator.' };
    }
    return { ok: true, uid, email, level };
  } catch (e: any) {
    console.warn('Admin verification notice:', e?.message || e);
    return { ok: false, status: 503, error: 'Could not verify administrator access. Please try again.' };
  }
}
