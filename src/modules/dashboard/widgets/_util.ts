import { diffDays } from '@/lib/date';

/** "J−4" (retard), "AUJ.", "DEMAIN", "J+6". */
export function dayLabel(date: string, today: string): string {
  const d = diffDays(today, date);
  if (d < 0) return `J−${-d}`;
  if (d === 0) return 'AUJ.';
  if (d === 1) return 'DEMAIN';
  return `J+${d}`;
}
