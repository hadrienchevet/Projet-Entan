import React from 'react';
import { spring, interpolate } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { FPS } from '../timeline';
import { ModuleHeader } from '../components/AppWindow';
import { Avatar } from '../components/ui';
import { useModule } from './_shared';

const ROLE: Record<string, [string, string, string]> = {
  R: ['Responsible', theme.accentSoft, theme.accentText],
  A: ['Accountable', theme.amberSoft, theme.amber],
  C: ['Consulted', theme.grey, theme.text2],
  I: ['Informed', '#2d3540', '#9fc0d6'],
};

const people = [
  { init: 'CD', name: 'Claire', bg: theme.accentSoft, fg: theme.accentText },
  { init: 'ML', name: 'Marc', bg: '#3a4a3e', fg: '#a9cdb2' },
  { init: 'SB', name: 'Sonia', bg: '#46414f', fg: '#beb3d4' },
];
const actions = ['Plan de maintenance', 'Étalonnage des visseuses', 'Audit 5S bord de ligne'];
const matrix = [
  ['A', 'R', 'I'],
  ['I', 'C', 'R'],
  ['R', 'I', 'C'],
];

const Chip: React.FC<{ role: string; idx: number; local: number }> = ({ role, idx, local }) => {
  const s = spring({ frame: local - 46 - idx * 7, fps: FPS, config: { damping: 13 } });
  const [, bg, fg] = ROLE[role];
  return (
    <span style={{ justifySelf: 'center', width: 46, height: 46, borderRadius: 12, background: bg, color: fg, fontFamily: SANS, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})` }}>
      {role}
    </span>
  );
};

export const Raci: React.FC = () => {
  const { local, opacity } = useModule('raci');
  if (opacity <= 0) return null;

  const grid = '1.5fr 1fr 1fr 1fr';
  const legendO = interpolate(local, [120, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <ModuleHeader title="RACI — responsabilités" />
      <div style={{ padding: '34px 44px 0' }}>
        {/* En-tête : avatars de l'équipe */}
        <div style={{ display: 'grid', gridTemplateColumns: grid, alignItems: 'center', paddingBottom: 22, borderBottom: `1px solid ${theme.border}` }}>
          <span />
          {people.map((p, i) => {
            const s = spring({ frame: local - 16 - i * 8, fps: FPS, config: { damping: 14 } });
            return (
              <span key={p.init} style={{ justifySelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: `scale(${s})` }}>
                <Avatar initials={p.init} bg={p.bg} fg={p.fg} />
                <span style={{ fontFamily: SANS, fontSize: 16, color: theme.text2 }}>{p.name}</span>
              </span>
            );
          })}
        </div>
        {/* Lignes d'actions */}
        {actions.map((a, r) => (
          <div key={a} style={{ display: 'grid', gridTemplateColumns: grid, alignItems: 'center', padding: '26px 0', borderBottom: '1px solid #2c2b28' }}>
            <span style={{ fontFamily: SANS, fontSize: 22, color: theme.text, fontWeight: 500 }}>{a}</span>
            {matrix[r].map((role, c) => (
              <Chip key={c} role={role} idx={r * 3 + c} local={local} />
            ))}
          </div>
        ))}
        {/* Légende */}
        <div style={{ display: 'flex', gap: 26, marginTop: 30, opacity: legendO }}>
          {Object.entries(ROLE).map(([k, [label, bg, fg]]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 16, color: theme.muted }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: bg, color: fg, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
