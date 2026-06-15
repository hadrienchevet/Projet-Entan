import React from 'react';
import { interpolate, spring } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { ease } from '../easing';
import { FPS } from '../timeline';
import { ModuleHeader } from '../components/AppWindow';
import { Avatar, Badge } from '../components/ui';
import { useModule } from './_shared';

const GRID = '2fr 1.2fr 0.9fr';

const Cursor: React.FC<{ name: string; color: string; path: [number, number][]; delay: number; local: number }> = ({ name, color, path, delay, local }) => {
  const t = ease(local - delay, [0, 170], [0, path.length - 1]);
  const i = Math.max(0, Math.min(path.length - 2, Math.floor(t)));
  const f = t - i;
  const x = path[i][0] + (path[i + 1][0] - path[i][0]) * f;
  const y = path[i][1] + (path[i + 1][1] - path[i][1]) * f;
  const appear = ease(local - delay, [0, 14], [0, 1]);
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: appear, zIndex: 20, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))' }}>
      <svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l16 7.5-7 1.8-3.2 6.7z" fill={color} /></svg>
      <span style={{ position: 'absolute', left: 24, top: 24, whiteSpace: 'nowrap', fontFamily: SANS, fontSize: 16, fontWeight: 600, color: '#fff', background: color, padding: '4px 12px', borderRadius: 99 }}>{name}</span>
    </div>
  );
};

const Presence: React.FC<{ local: number }> = ({ local }) => {
  const avs = [['CD', theme.accentSoft, theme.accentText], ['ML', '#3a4a3e', '#a9cdb2'], ['SB', '#46414f', '#beb3d4']] as const;
  return (
    <div style={{ display: 'flex' }}>
      {avs.map(([init, bg, fg], i) => {
        const s = spring({ frame: local - 16 - i * 8, fps: FPS, config: { damping: 13 } });
        return <div key={init} style={{ marginLeft: i ? -10 : 0, transform: `scale(${s})` }}><Avatar initials={init} bg={bg} fg={fg} /></div>;
      })}
    </div>
  );
};

export const CollabM: React.FC = () => {
  const { local, opacity } = useModule('collab');
  if (opacity <= 0) return null;

  const full = 'Réception fournisseur validée';
  const chars = Math.round(ease(local, [50, 110], [0, full.length]));
  const caret = Math.floor(local / 16) % 2 === 0 && local > 46 && local < 120;
  const flip = spring({ frame: local - 150, fps: FPS, config: { damping: 20 } });
  const beforeO = interpolate(flip, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' });
  const afterO = interpolate(flip, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' });
  const flash = interpolate(local, [146, 162, 190], [0, 0.14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <ModuleHeader title="Ligne d'assemblage A3" right={<Presence local={local} />} />
      <div style={{ padding: '30px 44px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '0 14px 14px', borderBottom: `1px solid ${theme.border}`, fontFamily: SANS, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.muted }}>
          <span>Action</span><span>Responsable</span><span>Statut</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '26px 14px', borderBottom: '1px solid #2c2b28', fontFamily: SANS, fontSize: 22, color: theme.text }}>
          <span>{full.slice(0, chars)}<span style={{ opacity: caret ? 1 : 0, color: theme.accent }}>|</span></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: theme.text2 }}><Avatar initials="CD" /> Claire</span>
          <span><Badge tone="amber">En cours</Badge></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '26px 14px', borderBottom: '1px solid #2c2b28', fontFamily: SANS, fontSize: 22, color: theme.text2, background: `rgba(217,119,87,${flash})`, borderRadius: 12 }}>
          <span style={{ color: theme.text }}>Étalonnage des visseuses</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><Avatar initials="ML" bg="#3a4a3e" fg="#a9cdb2" /> Marc</span>
          <span style={{ position: 'relative', display: 'inline-block', height: 40 }}>
            <span style={{ position: 'absolute', opacity: beforeO }}><Badge tone="grey">À faire</Badge></span>
            <span style={{ position: 'absolute', opacity: afterO }}><Badge tone="amber">En cours</Badge></span>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '26px 14px', fontFamily: SANS, fontSize: 22, color: theme.text2 }}>
          <span style={{ color: theme.text }}>Audit 5S bord de ligne</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><Avatar initials="SB" bg="#46414f" fg="#beb3d4" /> Sonia</span>
          <span><Badge tone="green">✓ Terminée</Badge></span>
        </div>
      </div>
      <Cursor name="Claire" color={theme.accent} delay={20} local={local} path={[[1050, 560], [760, 250], [780, 250], [1080, 150]]} />
      <Cursor name="Marc" color="#85b894" delay={34} local={local} path={[[260, 120], [470, 360], [455, 360], [620, 440]]} />
    </div>
  );
};
