import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { SANS, SERIF } from '../fonts';
import { ease } from '../easing';

/** Cold open : un battement terracotta qui fleurit en logo, puis fond pour
 *  laisser place à la fenêtre de l'app. */
export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > 380) return null;

  // Le point bat puis se transforme en logo.
  const beat = 0.5 + 0.5 * Math.sin(frame / 6);
  const dotScale = ease(frame, [0, 30], [0.4, 1]) * (1 + beat * 0.08);
  const dotToLogo = ease(frame, [44, 92], [0, 1]);
  const logoScale = 0.35 + dotToLogo * 0.65;
  const logoRadius = 99 - dotToLogo * 61; // cercle -> carré arrondi
  const letters = ease(frame, [78, 100], [0, 1]);

  const wordO = ease(frame, [96, 130], [0, 1]);
  const wordY = ease(frame, [96, 140], [26, 0]);
  const tagO = ease(frame, [120, 150], [0, 1]);

  const capO = Math.min(ease(frame, [14, 44], [0, 1]), ease(frame, [78, 104], [1, 0]));

  // Sortie globale (la fenêtre prend le relais).
  const out = ease(frame, [300, 365], [1, 0]);
  const outScale = ease(frame, [300, 365], [1, 1.04]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', opacity: out }}>
      <div style={{ position: 'absolute', width: 820, height: 820, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(217,119,87,0.16), transparent 70%)', opacity: 0.5 + beat * 0.3 }} />
      <div style={{ textAlign: 'center', transform: `scale(${outScale})` }}>
        <div
          style={{
            width: 156, height: 156, margin: '0 auto 40px',
            borderRadius: logoRadius,
            background: theme.accent, color: '#fff',
            fontFamily: SANS, fontSize: 66, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${Math.max(dotScale * (1 - dotToLogo) + logoScale * dotToLogo, logoScale)})`,
            boxShadow: '0 40px 120px rgba(217,119,87,0.32)',
          }}
        >
          <span style={{ opacity: letters }}>PE</span>
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 86, fontWeight: 600, color: theme.text, letterSpacing: -2, opacity: wordO, transform: `translateY(${wordY}px)` }}>Projet Entan</div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 22, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 6, color: theme.accent, opacity: tagO }}>En temps réel</div>
      </div>
      <div style={{ position: 'absolute', bottom: 150, fontFamily: SERIF, fontSize: 40, color: theme.text2, opacity: capO }}>Vos projets ont un rythme.</div>
    </AbsoluteFill>
  );
};
