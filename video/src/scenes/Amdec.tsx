import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { AppFrame, Badge, LiveBadge } from '../components/ui';

const Row: React.FC<{ delay: number; children: React.ReactNode; highlight?: number }> = ({ delay, children, highlight = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, mass: 0.6 } });
  const x = interpolate(s, [0, 1], [40, 0]);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1.3fr 1.4fr 0.9fr',
        alignItems: 'center',
        padding: '24px 14px',
        borderBottom: `1px solid #2c2b28`,
        fontFamily: SANS,
        fontSize: 21,
        color: theme.text2,
        opacity: s,
        transform: `translateX(${x}px)`,
        background: highlight ? `rgba(217,119,87,${0.07 * highlight})` : 'transparent',
        borderRadius: highlight ? 10 : 0,
      }}
    >
      {children}
    </div>
  );
};

export const Amdec: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Action ajoutée puis bascule de criticité sur la ligne 1.
  const chip = spring({ frame: frame - 70, fps, config: { damping: 18 } });
  const flip = spring({ frame: frame - 92, fps, config: { damping: 20, mass: 0.8 } });
  const beforeOpacity = interpolate(flip, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' });
  const afterOpacity = interpolate(flip, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' });
  const afterScale = interpolate(flip, [0.5, 0.8, 1], [0.7, 1.12, 1], { extrapolateLeft: 'clamp' });
  const rowGlow = interpolate(flip, [0, 1], [0, 1]);
  const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / 7));

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AppFrame active="AMDEC" title="Analyse des risques" right={<LiveBadge pulse={pulse} />}>
        {/* En-tête de tableau */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.3fr 1.4fr 0.9fr', padding: '0 14px 14px', borderBottom: `1px solid ${theme.border}`, fontFamily: SANS, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.muted }}>
          <span>Élément</span>
          <span>Mode de défaillance</span>
          <span>Action corrective</span>
          <span>Criticité</span>
        </div>

        <Row delay={14} highlight={rowGlow}>
          <span style={{ color: theme.text, fontWeight: 500 }}>Convoyeur principal</span>
          <span>Arrêt inopiné</span>
          <span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, borderRadius: 99, padding: '8px 16px', opacity: chip, transform: `scale(${interpolate(chip, [0, 1], [0.9, 1])})` }}>
              + Plan de maintenance préventive
            </span>
          </span>
          <span style={{ position: 'relative', display: 'inline-block', height: 44 }}>
            <span style={{ position: 'absolute', opacity: beforeOpacity }}><Badge tone="red">36 · Critique</Badge></span>
            <span style={{ position: 'absolute', opacity: afterOpacity, transform: `scale(${afterScale})` }}><Badge tone="amber">12 · Maîtrisé</Badge></span>
          </span>
        </Row>

        <Row delay={22}>
          <span style={{ color: theme.text, fontWeight: 500 }}>Poste de vissage</span>
          <span>Couple hors tolérance</span>
          <span style={{ color: theme.muted }}>—</span>
          <span><Badge tone="red">24 · Critique</Badge></span>
        </Row>

        <Row delay={30}>
          <span style={{ color: theme.text, fontWeight: 500 }}>Bord de ligne</span>
          <span>Rupture de composants</span>
          <span style={{ color: theme.muted }}>—</span>
          <span><Badge tone="amber">12 · À surveiller</Badge></span>
        </Row>
      </AppFrame>
    </AbsoluteFill>
  );
};
