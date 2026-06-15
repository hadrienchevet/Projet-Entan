import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { AppFrame, Avatar, Badge } from '../components/ui';

const Cursor: React.FC<{ name: string; color: string; path: [number, number][]; delay: number }> = ({ name, color, path, delay }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 90], [0, path.length - 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const i = Math.floor(t);
  const f = t - i;
  const a = path[Math.max(0, Math.min(path.length - 1, i))];
  const b = path[Math.max(0, Math.min(path.length - 1, i + 1))];
  const x = a[0] + (b[0] - a[0]) * f;
  const y = a[1] + (b[1] - a[1]) * f;
  const appear = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: appear, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))', zIndex: 20 }}>
      <svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l16 7.5-7 1.8-3.2 6.7z" fill={color} /></svg>
      <span style={{ position: 'absolute', left: 22, top: 22, whiteSpace: 'nowrap', fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#fff', background: color, padding: '4px 12px', borderRadius: 99 }}>{name}</span>
    </div>
  );
};

const Presence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const avs = [['CD', theme.accentSoft, theme.accentText], ['ML', '#3a4a3e', '#a9cdb2'], ['SB', '#46414f', '#beb3d4']] as const;
  return (
    <div style={{ display: 'flex' }}>
      {avs.map(([init, bg, fg], i) => {
        const s = spring({ frame: frame - 10 - i * 6, fps, config: { damping: 12 } });
        return (
          <div key={init} style={{ marginLeft: i ? -10 : 0, transform: `scale(${s})` }}>
            <Avatar initials={init} bg={bg} fg={fg} />
          </div>
        );
      })}
    </div>
  );
};

export const Collab: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Saisie de la 1re ligne (effet machine à écrire).
  const full = 'Réception fournisseur validée';
  const chars = Math.round(interpolate(frame, [30, 64], [0, full.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const typed = full.slice(0, chars);
  const caretOn = Math.floor(frame / 8) % 2 === 0 && frame > 28 && frame < 70;

  // Statut ligne 2 sync : à faire -> en cours, avec flash.
  const flip = spring({ frame: frame - 96, fps, config: { damping: 20 } });
  const beforeO = interpolate(flip, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' });
  const afterO = interpolate(flip, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' });
  const flash = interpolate(frame, [92, 100, 116], [0, 0.12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AppFrame active="Dashboard" title="Ligne d'assemblage A3" right={<Presence />}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.9fr', padding: '0 14px 14px', borderBottom: `1px solid ${theme.border}`, fontFamily: SANS, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.muted }}>
          <span>Action</span><span>Responsable</span><span>Statut</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.9fr', alignItems: 'center', padding: '24px 14px', borderBottom: '1px solid #2c2b28', fontFamily: SANS, fontSize: 21, color: theme.text }}>
          <span>{typed}<span style={{ opacity: caretOn ? 1 : 0, color: theme.accent }}>|</span></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: theme.text2 }}><Avatar initials="CD" /> Claire</span>
          <span><Badge tone="amber">En cours</Badge></span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.9fr', alignItems: 'center', padding: '24px 14px', borderBottom: '1px solid #2c2b28', fontFamily: SANS, fontSize: 21, color: theme.text2, background: `rgba(217,119,87,${flash})`, borderRadius: 10 }}>
          <span style={{ color: theme.text }}>Étalonnage des visseuses</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><Avatar initials="ML" bg="#3a4a3e" fg="#a9cdb2" /> Marc</span>
          <span style={{ position: 'relative', display: 'inline-block', height: 40 }}>
            <span style={{ position: 'absolute', opacity: beforeO }}><Badge tone="grey">À faire</Badge></span>
            <span style={{ position: 'absolute', opacity: afterO }}><Badge tone="amber">En cours</Badge></span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.9fr', alignItems: 'center', padding: '24px 14px', fontFamily: SANS, fontSize: 21, color: theme.text2 }}>
          <span style={{ color: theme.text }}>Audit 5S bord de ligne</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><Avatar initials="SB" bg="#46414f" fg="#beb3d4" /> Sonia</span>
          <span><Badge tone="green">✓ Terminée</Badge></span>
        </div>
      </AppFrame>

      {/* Curseurs des coéquipiers, en coordonnées plein cadre (1920×1080). */}
      <Cursor name="Claire" color={theme.accent} delay={16} path={[[1300, 760], [1050, 470], [1080, 470], [1320, 360]]} />
      <Cursor name="Marc" color="#85b894" delay={26} path={[[520, 300], [720, 560], [700, 560], [860, 650]]} />
    </AbsoluteFill>
  );
};
