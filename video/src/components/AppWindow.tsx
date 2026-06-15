import React from 'react';
import { useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { SANS, SERIF } from '../fonts';
import { ease } from '../easing';
import { NAV, navIndexAt, cameraAt, MORPH_END, WINDOW_OUT, TOTAL } from '../timeline';

/* Géométrie de la fenêtre (1920×1080). */
const WIN = { left: 150, top: 110, width: 1620, height: 860, radius: 22 };
const SIDEBAR = 280;
const SIDE_PAD = 18;
const NAV_TOP = 104; // y du 1er item depuis le haut de la fenêtre
const NAV_STEP = 56;
const NAV_ITEM_H = 48;

/** Pastille « live » qui bat (motif récurrent du temps réel). */
export const Pulse: React.FC<{ size?: number; boost?: number }> = ({ size = 10, boost = 0 }) => {
  const frame = useCurrentFrame();
  const beat = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 7));
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: theme.green, opacity: beat }} />
      <span style={{ position: 'absolute', inset: -size * (0.4 + boost), borderRadius: 99, background: theme.green, opacity: 0.18 * beat }} />
    </span>
  );
};

/**
 * Fenêtre persistante = scène continue. Applique la caméra (push lent) + le
 * morph d'entrée/sortie (logo ↔ fenêtre), rend la sidebar avec surlignage
 * glissant, et un slot de contenu (children = les modules empilés en fondu).
 */
export const AppWindow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();

  // Entrée (la fenêtre se construit après le logo) / sortie (pull-back final).
  const enterO = ease(frame, [330, 405], [0, 1]);
  const exitO = ease(frame, [WINDOW_OUT, 2820], [1, 0]);
  const opacity = Math.min(enterO, exitO);
  const enterS = ease(frame, [330, 405], [0.93, 1]);
  const exitS = ease(frame, [WINDOW_OUT, 2820], [1, 0.93]);
  const cam = cameraAt(frame).scale;
  const scale = cam * enterS * exitS;

  // Surlignage actif : position interpolée -> il glisse d'un module à l'autre.
  const navIdx = navIndexAt(frame);
  const highlightTop = NAV_TOP + navIdx * NAV_STEP;

  // Apparition en cascade des items de nav pendant le morph.
  const navReveal = (i: number) => ease(frame, [MORPH_END - 80 + i * 8, MORPH_END - 40 + i * 8], [0, 1]);

  if (frame > TOTAL) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, opacity, transform: `scale(${scale})`, transformOrigin: '50% 46%' }}>
      <div
        style={{
          position: 'absolute',
          left: WIN.left,
          top: WIN.top,
          width: WIN.width,
          height: WIN.height,
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: WIN.radius,
          overflow: 'hidden',
          boxShadow: '0 60px 160px rgba(0,0,0,0.6)',
        }}
      >
        {/* Sidebar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR, background: '#171614', borderRight: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '28px 0 0 24px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: theme.accent, color: '#fff', fontFamily: SANS, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PE</div>
            <span style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: theme.text }}>Projet Entan</span>
          </div>
          {/* Surlignage glissant */}
          <div style={{ position: 'absolute', left: SIDE_PAD, top: highlightTop, width: SIDEBAR - SIDE_PAD * 2, height: NAV_ITEM_H, borderRadius: 10, background: theme.accentSoft }} />
          {NAV.map((item, i) => {
            const on = Math.abs(navIdx - i) < 0.5;
            return (
              <div
                key={item}
                style={{
                  position: 'absolute',
                  left: SIDE_PAD,
                  top: NAV_TOP + i * NAV_STEP,
                  width: SIDEBAR - SIDE_PAD * 2,
                  height: NAV_ITEM_H,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 16,
                  fontFamily: SANS,
                  fontSize: 18,
                  fontWeight: on ? 600 : 500,
                  color: on ? theme.accentText : theme.muted,
                  opacity: navReveal(i),
                }}
              >
                {item}
              </div>
            );
          })}
        </div>

        {/* Zone de contenu (les modules s'y fondent) */}
        <div style={{ position: 'absolute', left: SIDEBAR, top: 0, right: 0, bottom: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/** En-tête de module (titre + zone droite), réutilisé par chaque module. */
export const ModuleHeader: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '34px 44px 0' }}>
    <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: theme.text }}>{title}</span>
    {right}
  </div>
);

export const LiveTag: React.FC = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 18, fontWeight: 600, color: theme.green, background: theme.greenSoft, padding: '8px 18px', borderRadius: 99 }}>
    <Pulse /> Temps réel
  </span>
);

export { WIN };
