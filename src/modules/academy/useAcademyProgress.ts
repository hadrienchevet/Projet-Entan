'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Progression de l'Académie, stockée localement (par navigateur) pour la V1.
 * Aucune migration Supabase : on persistera par utilisateur plus tard.
 *
 * Implémenté via `useSyncExternalStore` : lecture de localStorage sans écart
 * d'hydratation SSR, et synchronisation automatique entre onglets.
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

export function useAcademyProgress() {
  const progress = useSyncExternalStore(subscribe, read, () => EMPTY);

  const record = useCallback((setId: string, score: number, total: number, passed: boolean) => {
    const cur = read();
    const prev = cur[setId];
    const next: AcademyProgress = {
      ...cur,
      [setId]: {
        best: prev ? Math.max(prev.best, score) : score,
        total,
        passed: (prev?.passed ?? false) || passed,
      },
    };
    try {
      const raw = JSON.stringify(next);
      localStorage.setItem(KEY, raw);
      cacheRaw = raw;
    } catch {
      /* écriture impossible : mise à jour en mémoire uniquement */
    }
    cache = next;
    listeners.forEach((l) => l());
  }, []);

  return { progress, record };
}
