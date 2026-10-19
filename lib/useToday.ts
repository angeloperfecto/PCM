'use client';

import { useEffect, useState } from 'react';
import { todayPH } from './reenrollment';

/**
 * Today's date in the Philippines (YYYY-MM-DD), updated when the day changes while the page is open,
 * so enrollment, pre-enlistment and adding & dropping windows open and close on their dates
 * without a reload. Term settings themselves arrive live from Firestore.
 */
export function useToday(): string {
  const [day, setDay] = useState(() => todayPH());
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = todayPH();
      setDay((d) => (d === now ? d : now));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return day;
}
