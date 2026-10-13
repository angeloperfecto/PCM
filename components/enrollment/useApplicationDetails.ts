'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ApplicationHistoryEntry, ApplicationRequirement } from '@/lib/enrollmentWorkflow';

// Live document checklist and status history for one application. Firestore rules limit
// these to the applicant who owns the application and to admins.
export function useApplicationDetails(applicationId?: string | null) {
  const [requirements, setRequirements] = useState<ApplicationRequirement[]>([]);
  const [history, setHistory] = useState<ApplicationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRequirements([]);
    setHistory([]);
    setError(null);
    if (!applicationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const onError = (e: any) => {
      console.warn('Application details notice:', e);
      setError('Could not load the document checklist. Please refresh the page.');
      setLoading(false);
    };
    const unsubReqs = onSnapshot(
      collection(db, 'applications', applicationId, 'requirements'),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApplicationRequirement);
        rows.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
        setRequirements(rows);
        setLoading(false);
      },
      onError
    );
    const unsubHistory = onSnapshot(
      collection(db, 'applications', applicationId, 'history'),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApplicationHistoryEntry);
        rows.sort((a, b) => (a.at || '').localeCompare(b.at || ''));
        setHistory(rows);
      },
      onError
    );
    return () => {
      unsubReqs();
      unsubHistory();
    };
  }, [applicationId]);

  return { requirements, history, loading, error };
}
