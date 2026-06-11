/** Date du jour au format ISO yyyy-mm-dd (fuseau local). */
export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Décale la date du jour de `days` jours (utile pour les données de démo). */
export function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Décale une date ISO de `days` jours. */
export function addDaysISO(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Nombre de jours entre deux dates ISO (`b - a`, positif si b est après a). */
export function diffDays(a: string, b: string): number {
  return Math.round((isoToDate(b).getTime() - isoToDate(a).getTime()) / 86_400_000);
}

/** "2026-06-10" → "10 juin 2026". */
export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "2026-06-10" → "10 juin" (court, sans année). */
export function formatDayMonth(iso: string): string {
  return isoToDate(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** "2026-06-10" → "mercredi 10 juin". */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Une action est en retard si son échéance est passée et qu'elle n'est pas terminée. */
export function isOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate || status === 'done') return false;
  return dueDate < todayISO();
}
