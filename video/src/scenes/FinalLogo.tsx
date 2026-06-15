import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';
import { theme } from '../theme';
import { SANS, SERIF } from '../fonts';
import { ease } from '../easing';
import { FPS, WINDOW_OUT } from '../timeline';

/** Logo final (bookend) : la fenêtre s'est résorbée, le logo réapparaît. */
export const FinalLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const startAt = WINDOW_OUT + 40; // 2740
  if (frame < startAt) return null;
  const local = frame - startAt;

  const mark = spring({ frame: local, fps: FPS, config: { damping: 16, mass: 0.8 } });
  const wordO = ease(local, [16, 50], [0, 1]);
  const tagO = ease(local, [44, 80], [0, 1]);
  const float = Math.sin(local / 26) * 5;
  const beat = 0.5 + 0.5 * Math.sin(local / 6);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', width: 820, height: 820, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(217,119,87,0.16), transparent 70%)', opacity: 0.55 + beat * 0.25 }} />
      <div style={{ textAlign: 'center', transform: `translateY(${float}px)` }}>
        <div style={{ width: 150, height: 150, margin: '0 auto 38px', borderRadius: 36, background: theme.accent, color: '#fff', fontFamily: SANS, fontSize: 64, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.7 + mark * 0.3})`, boxShadow: '0 40px 120px rgba(217,119,87,0.32)' }}>PE</div>
        <div style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 600, color: theme.text, letterSpacing: -2, opacity: wordO }}>Projet Entan</div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 30, fontWeight: 500, color: theme.accent, opacity: tagO }}>In real time.</div>
      </div>
    </AbsoluteFill>
  );
};
