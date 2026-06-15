import React from 'react';
import { interpolate, spring } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { ease } from '../easing';
import { FPS } from '../timeline';
import { ModuleHeader, LiveTag } from '../components/AppWindow';
import { useModule } from './_shared';

const Card: React.FC<{ delay: number; local: number; value: string; label: string; color?: string }> = ({ delay, local, value, label, color }) => {
  const s = spring({ frame: local - delay, fps: FPS, config: { damping: 18, mass: 0.7 } });
  return (
    <div style={{ flex: 1, background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 16, padding: '26px 30px', opacity: s, transform: `translateY(${interpolate(s, [0, 1], [28, 0])}px)` }}>
      <div style={{ fontFamily: SANS, fontSize: 54, fontWeight: 700, letterSpacing: -1.5, color: color ?? theme.text }}>{value}</div>
      <div style={{ fontFamily: SANS, fontSize: 18, color: theme.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
};

export const DashboardM: React.FC = () => {
  const { local, opacity } = useModule('dashboard');
  if (opacity <= 0) return null;

  const n1 = local > 300 ? 15 : Math.round(ease(local, [40, 110], [0, 14]));
  const n2 = Math.round(ease(local, [48, 120], [0, 72]));
  const n3 = Math.round(ease(local, [56, 116], [0, 3]));
  const bars = [34, 48, 42, 64, 56, 78, 70, 88];
  const hot = new Set([3, 5, 7]);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <ModuleHeader title="Ligne d'assemblage A3" right={<LiveTag />} />
      <div style={{ padding: '28px 44px 0' }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <Card delay={20} local={local} value={String(n1)} label="Actions en cours" />
          <Card delay={30} local={local} value={`${n2} %`} label="Avancement" />
          <Card delay={40} local={local} value={String(n3)} label="Risques critiques" color={theme.red} />
        </div>
        <div style={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28, height: 330, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          {bars.map((h, i) => {
            const g = spring({ frame: local - 60 - i * 6, fps: FPS, config: { damping: 16 } });
            return <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '10px 10px 4px 4px', background: hot.has(i) ? theme.accent : theme.accentSoft, transform: `scaleY(${g})`, transformOrigin: 'bottom' }} />;
          })}
        </div>
      </div>
      <Toast local={local} />
    </div>
  );
};

const Toast: React.FC<{ local: number }> = ({ local }) => {
  const s = spring({ frame: local - 210, fps: FPS, config: { damping: 18 } });
  if (s <= 0.01) return null;
  return (
    <div style={{ position: 'absolute', right: 44, bottom: 40, background: theme.panel2, border: `1px solid ${theme.border}`, borderLeft: `4px solid ${theme.green}`, borderRadius: 12, padding: '16px 22px', fontFamily: SANS, fontSize: 19, color: theme.text2, opacity: s, transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      ✓ <span style={{ color: theme.text, fontWeight: 600 }}>Claire</span> vient de terminer « Audit 5S »
    </div>
  );
};
