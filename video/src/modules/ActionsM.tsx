import React from 'react';
import { interpolate, spring } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { ease } from '../easing';
import { FPS } from '../timeline';
import { ModuleHeader } from '../components/AppWindow';
import { Avatar, Badge } from '../components/ui';
import { useModule } from './_shared';

const Row: React.FC<{ delay: number; local: number; name: string; who: string; init: string; bg?: string; fg?: string; date: string; status: React.ReactNode }> = ({ delay, local, name, who, init, bg, fg, date, status }) => {
  const s = spring({ frame: local - delay, fps: FPS, config: { damping: 18, mass: 0.7 } });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 0.9fr', alignItems: 'center', padding: '22px 14px', borderBottom: '1px solid #2c2b28', fontFamily: SANS, fontSize: 21, color: theme.text2, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [34, 0])}px)` }}>
      <span style={{ color: theme.text, fontWeight: 500 }}>{name}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><Avatar initials={init} bg={bg} fg={fg} /> {who}</span>
      <span>{date}</span>
      <span>{status}</span>
    </div>
  );
};

export const ActionsM: React.FC = () => {
  const { local, opacity } = useModule('actions');
  if (opacity <= 0) return null;

  const start = 50;
  const dur = 90;
  const pct = Math.round(ease(local, [start, start + dur], [38, 82]));
  const pop = spring({ frame: local - (start + dur), fps: FPS, config: { damping: 12 } });
  const flip = spring({ frame: local - 150, fps: FPS, config: { damping: 20 } });
  const beforeO = interpolate(flip, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' });
  const afterO = interpolate(flip, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <ModuleHeader title="Plan d'action" />
      <div style={{ padding: '30px 44px 0' }}>
        <div style={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 16, padding: '32px 36px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 30 }}>
            <span style={{ fontFamily: SANS, fontSize: 22, color: theme.text2, fontWeight: 500 }}>Avancement global</span>
            <span style={{ fontFamily: SANS, fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.muted }}>Temps réel</span>
          </div>
          <div style={{ position: 'relative', height: 34, background: '#161513', border: '1px solid #34332f', borderRadius: 99 }}>
            <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: `calc(${pct}% - 8px)`, background: `linear-gradient(90deg, #a85a3e, ${theme.accent})`, borderRadius: 99, boxShadow: '0 0 30px rgba(217,119,87,0.45)' }} />
            <div style={{ position: 'absolute', left: `${pct}%`, top: -64, transform: `translateX(-50%) scale(${interpolate(pop, [0, 1], [1, 1.12])})` }}>
              <div style={{ background: theme.accent, color: '#fff', fontFamily: SANS, fontSize: 24, fontWeight: 700, borderRadius: 12, padding: '8px 16px', boxShadow: '0 12px 36px rgba(217,119,87,0.4)' }}>{pct} %</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, fontFamily: SANS, fontSize: 18, color: theme.muted }}>
            <span><b style={{ color: theme.green }}>9</b> actions terminées</span>
            <span>2 en cours · 0 en retard</span>
          </div>
        </div>
        <Row delay={20} local={local} name="Plan de maintenance des roulements" who="Marc" init="ML" bg="#3a4a3e" fg="#a9cdb2" date="18 juin" status={<Badge tone="green">✓ Terminée</Badge>} />
        <Row delay={30} local={local} name="Étalonnage des visseuses" who="Sonia" init="SB" bg="#46414f" fg="#beb3d4" date="21 juin" status={
          <span style={{ position: 'relative', display: 'inline-block', height: 40 }}>
            <span style={{ position: 'absolute', opacity: beforeO }}><Badge tone="grey">À faire</Badge></span>
            <span style={{ position: 'absolute', opacity: afterO }}><Badge tone="amber">En cours</Badge></span>
          </span>
        } />
        <Row delay={40} local={local} name="Audit 5S bord de ligne" who="Claire" init="CD" date="25 juin" status={<Badge tone="green">✓ Terminée</Badge>} />
      </div>
    </div>
  );
};
