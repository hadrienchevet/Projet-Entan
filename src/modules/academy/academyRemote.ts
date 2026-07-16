/**
 * Persistance Supabase de la progression de l'Académie (fix-21).
 *
 * La progression est stockée par utilisateur dans `academy_progress`. RLS :
 * chacun écrit la sienne ; un admin/owner d'entreprise lit celle de ses membres
 * (vue « profil d'un membre »). Écritures TOLÉRANTES (jamais d'exception qui
 * casse l'UI) — comme le reste du store : si la migration n'est pas encore
 * passée, on `console.warn` et on garde le localStorage.
 */

import { createClient } from '@/lib/supabase/client';
import type { AcademyProgress, BadgeState } from './useAcademyProgress';

interface AcademyRow {
  set_id: string;
  best: number;
  total: number;
  passed: boolean;
}

function toProgress(rows: AcademyRow[] | null): AcademyProgress {
  const progress: AcademyProgress = {};
  for (const r of rows ?? []) {
    progress[r.set_id] = { best: r.best, total: r.total, passed: r.passed };
  }
  return progress;
}

/** Progression de l'utilisateur courant (null si non connecté). */
export async function fetchMyAcademyProgress(): Promise<{
  userId: string;
  progress: AcademyProgress;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('academy_progress')
    .select('set_id, best, total, passed')
    .eq('user_id', user.id);
  if (error) {
    console.warn('academy_progress fetch:', error.message);
    return { userId: user.id, progress: {} };
  }
  return { userId: user.id, progress: toProgress(data as AcademyRow[]) };
}

/** Progression d'un membre donné (soumise à la RLS : manager uniquement). */
export async function fetchAcademyProgressFor(userId: string): Promise<AcademyProgress> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('academy_progress')
    .select('set_id, best, total, passed')
    .eq('user_id', userId);
  if (error) {
    console.warn('academy_progress fetch (membre):', error.message);
    return {};
  }
  return toProgress(data as AcademyRow[]);
}

/** Upsert d'un badge de l'utilisateur courant (après une partie). */
export async function upsertAcademyBadge(setId: string, state: BadgeState): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('academy_progress').upsert(
    {
      user_id: user.id,
      set_id: setId,
      best: state.best,
      total: state.total,
      passed: state.passed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,set_id' },
  );
  if (error) console.warn('academy_progress upsert:', error.message);
}

/** Pousse toute la progression locale (migration one-shot du localStorage). */
export async function pushAcademyProgress(progress: AcademyProgress): Promise<void> {
  const entries = Object.entries(progress);
  if (entries.length === 0) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const rows = entries.map(([set_id, s]) => ({
    user_id: user.id,
    set_id,
    best: s.best,
    total: s.total,
    passed: s.passed,
  }));
  const { error } = await supabase
    .from('academy_progress')
    .upsert(rows, { onConflict: 'user_id,set_id' });
  if (error) console.warn('academy_progress push:', error.message);
}
