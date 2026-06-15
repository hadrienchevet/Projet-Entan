import { useCurrentFrame } from 'remotion';
import { MODULES, type ModuleId } from '../timeline';
import { fadeWindow } from '../easing';

/** Frame locale (0 = début du module) + opacité de fondu d'entrée/sortie. */
export function useModule(id: ModuleId) {
  const frame = useCurrentFrame();
  const m = MODULES.find((x) => x.id === id)!;
  const opacity = fadeWindow(frame, m.start, m.end);
  return { frame, local: frame - m.start, opacity, start: m.start, end: m.end };
}
