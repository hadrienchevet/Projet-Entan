import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { AppFrame, LiveBadge } from '../components/ui';

const StatCard: React.FC<{ delay: number; value: string; label: string; color?: string }> = ({ delay, value, label, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, mass: 0.6 } });
  const y = interpolate(s, [0, 1], [26, 0]);
  return (
    <div style={{ flex: 1, background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 16, padding: '26px 30px', opacity: s, transform: `translateY(${y}px)` }}>
      <div style={{ fontFamily: SANS, fontSize: 52, fontWeight: 700, letterSpacing: -1.5, color: color ?? theme.text }}>{value}</div>
      <div style={{ fontFamily: SANS, fontSize: 18, color: theme.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();

  // Compteurs.
  const n1 = Math.round(interpolate(frame, [20, 55], [0, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const n1live = frame > 120 ? 15 : n1; // battement temps réel
  const n2 = Math.round(interpolate(frame, [24, 60], [0, 72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const n3 = Math.round(interpolate(frame, [28, 58], [0, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / 7));

  const bars = [34, 48, 42, 64, 56, 78, 70, 88];
  const hot = new Set([3, 5, 7]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AppFrame active="Dashboard" title="Ligne d'assemblage A3" right={<LiveBadge pulse={pulse} />}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <StatCard delay={16} value={String(n1live)} label="Actions en cours" />
          <StatCard delay={22} value={`${n2} %`} label="Avancement" />
          <StatCard delay={28} value={String(n3)} label="Risques critiques" color={theme.red} />
        </div>
        <div style={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28, height: 360, display: 'flex', alignItems: 'flex-end', gap: 26 }}>
          {bars.map((h, i) => {
            const g = spring({ frame: frame - 38 - i * 4, fps: 30, config: { damping: 15 } });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: '10px 10px 4px 4px',
                  background: hot.has(i) ? theme.accent : theme.accentSoft,
                  transform: `scaleY(${g})`,
                  transformOrigin: 'bottom',
                }}
              />
            );
          })}
        </div>
        {/* Toast temps réel */}
        <Toast />
      </AppFrame>
    </AbsoluteFill>
  );
};

const Toast: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 110, fps, config: { damping: 18 } });
  const x = interpolate(s, [0, 1], [60, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        right: 40,
        bottom: 34,
        background: theme.panel2,
        border: `1px solid ${theme.border}`,
        borderLeft: `4px solid ${theme.green}`,
        borderRadius: 12,
        padding: '16px 22px',
        fontFamily: SANS,
        fontSize: 19,
        color: theme.text2,
        opacity: s,
        transform: `translateX(${x}px)`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      ✓ <span style={{ color: theme.text, fontWeight: 600 }}>Claire</span> vient de terminer « Audit 5S »
    </div>
  );
};
