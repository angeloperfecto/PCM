'use client';

// Official Admission Directory (Admissions page → Directory), managed in Admin → Admission
// Directory. Stored in the `admissionContacts` collection: public read, admin write.

import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface AdmissionContact {
  id: string;
  name: string;
  role: string;
  department: string;
  scope: string;
  email: string;
  phone: string;
  office: string;
  hours: string;
  order: number;
  visible: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const EMPTY_CONTACT: Omit<AdmissionContact, 'id' | 'order'> = {
  name: '',
  role: '',
  department: '',
  scope: '',
  email: '',
  phone: '',
  office: '',
  hours: '',
  visible: true,
};

// The directory that was built into the Admissions page before it became editable. Admins can
// import it once (Admin → Admission Directory) and then edit or delete each contact.
export const STARTER_CONTACTS: Omit<AdmissionContact, 'id' | 'order' | 'visible'>[] = [
  {
    name: 'Rev. Nathan Valdez, M.Div.',
    role: 'Director of Admissions & Church Relations',
    department: 'Office of Admissions & Student Recruitment',
    scope: 'Inquiries, student recruitment, provincial church endorsements, and admissions counseling.',
    email: 'admissions@pcm.ph',
    phone: '+63 917 582 1992',
    office: 'Room 102, Administration Building, Lamtang Campus',
    hours: 'Mon – Fri: 8:00 AM – 5:00 PM PHT',
  },
  {
    name: 'Sis. Grace Morales',
    role: 'Admissions Registrar & Document Evaluator',
    department: 'Office of the College Registrar',
    scope: 'Transcript evaluations, Form 138 verification, honorable dismissal, and enrollment clearance.',
    email: 'registrar@pcm.ph',
    phone: '+63 74 422 2577 ext. 103',
    office: 'Room 101, Records & Registration Hall, Lamtang Campus',
    hours: 'Mon – Fri: 8:00 AM – 4:30 PM PHT',
  },
  {
    name: 'Rev. Dr. Emmanuel Santos',
    role: 'Admissions Committee Chair & Academic Dean',
    department: 'Office of the Academic Dean',
    scope: 'Formal ministerial calling interviews, academic assessment results, and admission approvals.',
    email: 'dean@pcm.edu.ph',
    phone: '+63 74 422 2577 ext. 102',
    office: "Dean's Office, 2nd Floor, Academic Wing",
    hours: 'Tue & Thu: 1:30 PM – 4:30 PM (By appointment)',
  },
  {
    name: 'Ptr. Joshua Dela Cruz, B.Th.',
    role: 'Financial Aid & Scholarship Coordinator',
    department: 'Student Financial Aid Desk',
    scope: 'Ministerial scholarship grants, work-study assistantships, and local church matching funds.',
    email: 'scholarships@pcm.ph',
    phone: '+63 920 945 8812',
    office: 'Financial Aid Office, Administration Wing',
    hours: 'Mon – Fri: 9:00 AM – 4:00 PM PHT',
  },
  {
    name: 'Sis. Loida Batnag',
    role: 'Lamtang Campus Admissions Receptionist',
    department: 'Information & Visitor Center',
    scope: 'Campus visit check-in, brochure pickup, in-person test scheduling, and general directions.',
    email: 'info@pcm.ph',
    phone: '+63 74 422 2577',
    office: 'Main Reception Lobby, Lamtang Campus, La Trinidad, Benguet',
    hours: 'Mon – Sat: 8:00 AM – 12:00 PM & 1:00 PM – 5:00 PM PHT',
  },
];

const COLLECTION = 'admissionContacts';

const normalize = (id: string, d: any): AdmissionContact => ({
  id,
  name: String(d.name || ''),
  role: String(d.role || ''),
  department: String(d.department || ''),
  scope: String(d.scope || ''),
  email: String(d.email || ''),
  phone: String(d.phone || d.landline || ''),
  office: String(d.office || ''),
  hours: String(d.hours || ''),
  order: Number(d.order) || 0,
  visible: d.visible !== false,
  updatedAt: d.updatedAt,
  updatedBy: d.updatedBy,
});

// Live directory, in display order. `loaded` is false until the first snapshot arrives.
export function useAdmissionContacts(): { contacts: AdmissionContact[]; loaded: boolean; error: string } {
  const [contacts, setContacts] = useState<AdmissionContact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(
    () =>
      onSnapshot(
        collection(db, COLLECTION),
        (snap) => {
          const list = snap.docs.map((d) => normalize(d.id, d.data()));
          list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
          setContacts(list);
          setLoaded(true);
          setError('');
        },
        (err) => {
          console.warn('admissionContacts', err);
          setError('The admission directory could not be loaded.');
          setLoaded(true);
        }
      ),
    []
  );
  return { contacts, loaded, error };
}

// Returns an error message, or '' when the contact can be saved.
export function validateContact(c: Partial<AdmissionContact>): string {
  if (!String(c.name || '').trim()) return 'Name is required.';
  if (!String(c.role || '').trim()) return 'Position / role is required.';
  const email = String(c.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  if (!email && !String(c.phone || '').trim()) return 'Enter an email address or a phone number.';
  return '';
}

export async function saveAdmissionContact(c: AdmissionContact, actor: string): Promise<void> {
  const clean: AdmissionContact = {
    ...normalize(c.id, c),
    name: c.name.trim(),
    role: c.role.trim(),
    department: c.department.trim(),
    scope: c.scope.trim(),
    email: c.email.trim(),
    phone: c.phone.trim(),
    office: c.office.trim(),
    hours: c.hours.trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  await setDoc(doc(db, COLLECTION, c.id), clean);
}

export async function deleteAdmissionContact(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Saves a new display order (only the `order` field of each contact).
export async function reorderAdmissionContacts(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id, i) => batch.set(doc(db, COLLECTION, id), { order: i + 1 }, { merge: true }));
  await batch.commit();
}

// One-time import of the starter directory. Adds new documents only; never overwrites.
export async function importStarterContacts(existing: AdmissionContact[], actor: string): Promise<number> {
  const names = new Set(existing.map((c) => c.name.trim().toLowerCase()));
  const start = existing.reduce((m, c) => Math.max(m, c.order), 0);
  const batch = writeBatch(db);
  let added = 0;
  STARTER_CONTACTS.forEach((c) => {
    if (names.has(c.name.toLowerCase())) return;
    added += 1;
    const id = `contact-${Date.now().toString(36)}-${added}`;
    batch.set(doc(db, COLLECTION, id), {
      ...c,
      id,
      order: start + added,
      visible: true,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    });
  });
  if (added) await batch.commit();
  return added;
}

export const newContactId = () => `contact-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
