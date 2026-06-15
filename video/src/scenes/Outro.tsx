import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { SANS, SERIF } from '../fonts';

/** Outro — logo qui flotte, signature « In real time. » */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mark = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const word = spring({ frame: frame - 12, fps, config: { damping: 18 } });
  const tag = interpolate(frame, [34, 54], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const float = Math.sin(frame / 26) * 6;
  const haloScale = 1 + Math.sin(frame / 24) * 0.06;
  const shine = interpolate(frame, [30, 52], [-120, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(217,119,87,0.18), transparent 70%)', transform: `scale(${haloScale})`, filter: 'blur(40px)' }} />
      <div style={{ textAlign: 'center', transform: `translateY(${float}px)` }}>
        <div
          style={{
            width: 150, height: 150, borderRadius: 36, background: theme.accent, color: '#fff',
            fontFamily: SANS, fontSize: 64, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 38px', position: 'relative', overflow: 'hidden',
            transform: `scale(${interpolate(mark, [0, 1], [0.7, 1])})`,
            boxShadow: '0 40px 120px rgba(217,119,87,0.32)',
          }}
        >
          PE
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 90, left: shine, background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)', transform: 'skewX(-18deg)' }} />
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 600, color: theme.text, letterSpacing: -2, opacity: word, transform: `translateY(${interpolate(word, [0, 1], [30, 0])}px)` }}>
          Projet Entan
        </div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 30, fontWeight: 500, color: theme.accent, opacity: tag }}>
          In real time.
        </div>
      </div>
    </AbsoluteFill>
  );
};
