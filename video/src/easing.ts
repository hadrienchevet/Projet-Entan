import { Easing, interpolate } from 'remotion';

/** Courbes « Apple » : sorties douces et in-out maîtrisés. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_OUT_SOFT = Easing.bezier(0.22, 0.61, 0.36, 1);

/** Interpolation bornée avec easing Apple par défaut. */
export const ease = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing = EASE_OUT,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/**
 * Fondu d'apparition/disparition d'un module. L'entrée se fait sur
 * [start-fade, start] pour RECOUVRIR la sortie du module précédent (qui finit
 * à start) → vrai fondu enchaîné, jamais de cadre vide.
 */
export const fadeWindow = (
  frame: number,
  start: number,
  end: number,
  fade = 26,
) => {
  const inO = ease(frame, [start - fade, start], [0, 1]);
  const outO = ease(frame, [end - fade, end], [1, 0]);
  return Math.min(inO, outO);
};
