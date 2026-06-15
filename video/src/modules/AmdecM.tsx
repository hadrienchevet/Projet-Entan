import React from 'react';
import { interpolate, spring } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { FPS } from '../timeline';
import { ModuleHeader, LiveTag } from '../components/AppWindow';
import { Badge } from '../components/ui';
import { useModule } from './_shared';

const GRID = '1.3fr 1.3fr 1.5fr 0.9fr';

const Row: React.FC<{ delay: number; local: number; cells: React.ReactNode[]; highlight?: number }> = ({ delay, local, cells, highlight = 0 }) => {
  const s = spring({ frame: local - delay, fps: FPS, config: { damping: 18, mass: 0.7 } });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '26px 14px', borderBottom: '1px solid #2c2b28', fontFamily: SANS, fontSize: 22, color: theme.text2, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`, background: highlight ? `rgba(217,119,87,${0.08 * highlight})` : 'transparent', borderRadius: highlight ? 12 : 0 }}>
      {cells}
    </div>
  );
};

export const AmdecM: React.FC = () => {
  const { local, opacity } = useModule('amdec');
  if (opacity <= 0) return null;

  const chip = spring({ frame: local - 90, fps: FPS, config: { damping: 18 } });
  const flip = spring({ frame: local - 130, fps: FPS, config: { damping: 20, mass: 0.8 } });
  const beforeO = interpolate(flip, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' });
  const afterO = interpolate(flip, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' });
  const afterScale = interpolate(flip, [0.5, 0.8, 1], [0.7, 1.12, 1], { extrapolateLeft: 'clamp' });
  const glow = flip;

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <ModuleHeader title="Analyse des risques" right={<LiveTag />} />
      <div style={{ padding: '30px 44px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '0 14px 14px', borderBottom: `1px solid ${theme.border}`, fontFamily: SANS, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.muted }}>
          <span>Élément</span><span>Mode de défaillance</span><span>Action corrective</span><span>Criticité</span>
        </div>
        <Row delay={16} local={local} highlight={glow} cells={[
          <span key="a" style={{ color: theme.text, fontWeight: 500 }}>Convoyeur principal</span>,
          <span key="b">Arrêt inopiné</span>,
          <span key="c"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, borderRadius: 99, padding: '8px 16px', opacity: chip, transform: `scale(${interpolate(chip, [0, 1], [0.9, 1])})` }}>+ Plan de maintenance préventive</span></span>,
          <span key="d" style={{ position: 'relative', display: 'inline-block', height: 44 }}>
            <span style={{ position: 'absolute', opacity: beforeO }}><Badge tone="red">36 · Critique</Badge></span>
            <span style={{ position: 'absolute', opacity: afterO, transform: `scale(${afterScale})` }}><Badge tone="amber">12 · Maîtrisé</Badge></span>
          </span>,
        ]} />
        <Row delay={26} local={local} cells={[
          <span key="a" style={{ color: theme.text, fontWeight: 500 }}>Poste de vissage</span>,
          <span key="b">Couple hors tolérance</span>,
          <span key="c" style={{ color: theme.muted }}>—</span>,
          <span key="d"><Badge tone="red">24 · Critique</Badge></span>,
        ]} />
        <Row delay={36} local={local} cells={[
          <span key="a" style={{ color: theme.text, fontWeight: 500 }}>Bord de ligne</span>,
          <span key="b">Rupture de composants</span>,
          <span key="c" style={{ color: theme.muted }}>—</span>,
          <span key="d"><Badge tone="amber">12 · À surveiller</Badge></span>,
        ]} />
      </div>
    </div>
  );
};
