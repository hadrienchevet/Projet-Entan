import { interpolate } from 'remotion';
import { EASE_IN_OUT } from './easing';

/** 60 fps pour un mouvement ultra-fluide. */
export const FPS = 60;

/** Bornes (frames) des grandes phases. */
export const LOGO_END = 300; // 0–5 s : cold open + logo
export const MORPH_END = 420; // 5–7 s : logo → fenêtre
export const WINDOW_OUT = 2700; // début du pull-back final
export const TOTAL = 2880; // 48 s

/** Ordre de la nav (mêmes intitulés que l'app). */
export const NAV = ['Dashboard', 'RACI', 'AMDEC', 'Actions', 'Planning', 'Liens', 'Accès'];

export type ModuleId = 'dashboard' | 'raci' | 'amdec' | 'actions' | 'planning' | 'collab';

/** Fenêtre [start, end] de chaque module + index de nav surligné. */
export const MODULES: { id: ModuleId; start: number; end: number; nav: number }[] = [
  { id: 'dashboard', start: 420, end: 800, nav: 0 },
  { id: 'raci', start: 800, end: 1160, nav: 1 },
  { id: 'amdec', start: 1160, end: 1580, nav: 2 },
  { id: 'actions', start: 1580, end: 2000, nav: 3 },
  { id: 'planning', start: 2000, end: 2360, nav: 4 },
  { id: 'collab', start: 2360, end: 2760, nav: 0 },
];

/** Recouvrement du fondu entre deux modules (frames). */
export const FADE = 26;

/** Index de nav surligné (flottant) à une frame donnée — glisse aux changements. */
export function navIndexAt(frame: number): number {
  // Construit des keyframes [frame, index] au point de bascule de chaque module.
  const frames: number[] = [];
  const indices: number[] = [];
  MODULES.forEach((m, i) => {
    const switchAt = i === 0 ? m.start : m.start; // bascule au début du module
    frames.push(switchAt - FADE / 2);
    indices.push(m.nav);
  });
  // Avant le premier : index 0.
  if (frame <= frames[0]) return indices[0];
  for (let i = 0; i < frames.length - 1; i++) {
    if (frame >= frames[i] && frame <= frames[i + 1]) {
      // Glissement sur 18 frames autour de la bascule suivante.
      return interpolate(
        frame,
        [frames[i + 1] - 9, frames[i + 1] + 9],
        [indices[i], indices[i + 1]],
        { easing: EASE_IN_OUT, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    }
  }
  return indices[indices.length - 1];
}

/** Caméra globale (push très lent) appliquée à la fenêtre pendant la section produit. */
export function cameraAt(frame: number): { scale: number } {
  const scale = interpolate(frame, [MORPH_END, WINDOW_OUT], [1, 1.05], {
    easing: EASE_IN_OUT,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return { scale };
}
