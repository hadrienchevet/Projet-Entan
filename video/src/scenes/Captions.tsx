import React from 'react';
import { useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { SERIF } from '../fonts';
import { ease } from '../easing';
import { MODULES, type ModuleId } from '../timeline';

const TEXTS: Record<ModuleId, string> = {
  dashboard: 'Tout votre projet, en un coup d’œil.',
  raci: 'Qui fait quoi, sans ambiguïté.',
  amdec: 'Anticipez les risques.',
  actions: 'Des décisions aux actions.',
  planning: 'Un planning qui suit le rythme.',
  collab: 'Toute l’équipe, en temps réel.',
};

/** Bandeau bas de cadre, un texte par module, en fondu + légère montée. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {MODULES.map((m) => {
        const inO = ease(frame, [m.start + 30, m.start + 60], [0, 1]);
        const outO = ease(frame, [m.end - 40, m.end - 12], [1, 0]);
        const o = Math.min(inO, outO);
        if (o <= 0) return null;
        const y = ease(frame, [m.start + 30, m.start + 60], [18, 0]);
        return (
          <div
            key={m.id}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 64,
              textAlign: 'center',
              fontFamily: SERIF,
              fontSize: 46,
              fontWeight: 600,
              color: theme.text,
              opacity: o,
              transform: `translateY(${y}px)`,
              textShadow: '0 2px 30px rgba(0,0,0,0.7)',
            }}
          >
            {TEXTS[m.id]}
          </div>
        );
      })}
    </>
  );
};
