'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  fetchMyAcademyProgress,
  pushAcademyProgress,
  upsertAcademyBadge,
} from './academyRemote';

/**
 * Progression de l'Académie. Source synchrone = localStorage (lecture instantanée
 * sans écart d'hydratation SSR, sync automatique entre onglets via `storage`).
 *
 * Depuis fix-21, la progression est AUSSI persistée dans Supabase par utilisateur :
 * - au 1er montage connecté, on fusionne le distant avec le local puis on pousse
 *   le résultat (migration one-shot de l'ancien localStorage) ;
 * - chaque partie (`record`) est upsertée côté serveur, de façon tolérante.
 * Ainsi un manager peut consulter la progression d'un membre (voir `academyRemote`).
 */

export interface BadgeState {
  /** Meilleur score obtenu. */
  best: number;
  /** Nombre total de questions du jeu. */
  total: number;
  /** Badge décroché au moins une fois. */
  passed: boolean;
}

export type AcademyProgress = Record<string, BadgeState>;

const KEY = 'pilotix.academy.v1';
const EMPTY: AcademyProgress = {};

const listeners = new Set<() => void>();
let cache: AcademyProgress = EMPTY;
let cacheRaw: string | null = null;

/** Snapshot stable : on ne re-parse que si le contenu brut a changé. */
function read(): AcademyProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      cache = raw ? (JSON.parse(raw) as AcademyProgress) : EMPTY;
    }
  } catch {
    /* stockage indisponible : on garde le dernier cache connu */
  }
  return cache;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

/** Écrit la progression en local (localStorage + cache) et notifie les abonnés. */
function writeLocal(next: AcademyProgress): void {
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(KEY, raw);
    cacheRaw = raw;
  } catch {
    /* écriture impossible : mise à jour en mémoire uniquement */
  }
  cache = next;
  listeners.forEach((l) => l());
}

/** Fusion local + distant : meilleur score, total connu, badge décroché si l'un des deux. */
function merge(local: AcademyProgress, remote: AcademyProgress): AcademyProgress {
  const out: AcademyProgress = { ...local };
  for (const [setId, r] of Object.entries(remote)) {
    const l = out[setId];
    out[setId] = l
      ? { best: Math.max(l.best, r.best), total: r.total || l.total, passed: l.passed || r.passed }
      : r;
  }
  return out;
}

// Sync distant tenté une seule fois par session (re-tenté tant que non connecté).
let remoteSynced = false;

async function syncRemote(): Promise<void> {
  if (remoteSynced) return;
  const res = await fetchMyAcademyProgress();
  if (!res) return; // non connecté : on retentera au prochain montage
  remoteSynced = true;
  const merged = merge(read(), res.progress);
  writeLocal(merged);
  // Pousse le résultat fusionné : migre l'ancien localStorage vers Supabase.
  void pushAcademyProgress(merged);
}

export function useAcademyProgress() {
  const progress = useSyncExternalStore(subscribe, read, () => EMPTY);

  useEffect(() => {
    void syncRemote();
  }, []);

  const record = useCallback((setId: string, score: number, total: number, passed: boolean) => {
    const cur = read();
    const prev = cur[setId];
    const state: BadgeState = {
      best: prev ? Math.max(prev.best, score) : score,
      total,
      passed: (prev?.passed ?? false) || passed,
    };
    writeLocal({ ...cur, [setId]: state });
    // Persistance serveur tolérante (ne bloque jamais l'UI).
    void upsertAcademyBadge(setId, state);
  }, []);

  return { progress, record };
}
