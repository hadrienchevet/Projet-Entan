import React from 'react';
import { theme } from '../theme';
import { SANS, SERIF } from '../fonts';

/* Briques d'interface réutilisées par les scènes — reproduction fidèle de
   l'UI Projet Entan (sidebar 280px, panneau, badges), calibrée pour 1920×1080. */

const NAV: Record<string, string[]> = {
  default: ['Dashboard', 'RACI', 'AMDEC', 'Actions', 'Planning', 'Liens', 'Accès'],
};

export const AppFrame: React.FC<{
  active: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, title, right, children }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 150,
        top: 110,
        width: 1620,
        height: 860,
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 22,
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 60px 160px rgba(0,0,0,0.6)',
      }}
    >
      {/* Sidebar */}
      <div style={{ width: 280, background: '#171614', borderRight: `1px solid ${theme.border}`, padding: '28px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 34, paddingLeft: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: theme.accent, color: '#fff', fontFamily: SANS, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PE</div>
          <span style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: theme.text }}>Projet Entan</span>
        </div>
        {NAV.default.map((item) => {
          const on = item === active;
          return (
            <div
              key={item}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                fontFamily: SANS,
                fontSize: 18,
                marginBottom: 4,
                color: on ? theme.accentText : theme.muted,
                background: on ? theme.accentSoft : 'transparent',
                fontWeight: on ? 600 : 500,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: '34px 40px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: theme.text }}>{title}</span>
          {right}
        </div>
        {children}
      </div>
    </div>
  );
};

export const LiveBadge: React.FC<{ pulse?: number }> = ({ pulse = 1 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 18, fontWeight: 600, color: theme.green, background: theme.greenSoft, padding: '8px 18px', borderRadius: 99 }}>
    <span style={{ width: 10, height: 10, borderRadius: 99, background: theme.green, opacity: pulse }} />
    Temps réel
  </span>
);

const BADGE_COLORS: Record<string, [string, string]> = {
  red: [theme.redSoft, theme.red],
  amber: [theme.amberSoft, theme.amber],
  green: [theme.greenSoft, theme.green],
  grey: [theme.grey, theme.text2],
};

export const Badge: React.FC<{ tone: keyof typeof BADGE_COLORS; children: React.ReactNode; size?: number }> = ({ tone, children, size = 18 }) => {
  const [bg, fg] = BADGE_COLORS[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: SANS, fontSize: size, fontWeight: 600, color: fg, background: bg, padding: `${size * 0.38}px ${size * 0.85}px`, borderRadius: 99, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
};

export const Avatar: React.FC<{ initials: string; bg?: string; fg?: string }> = ({ initials, bg = theme.accentSoft, fg = theme.accentText }) => (
  <span style={{ width: 38, height: 38, borderRadius: 99, background: bg, color: fg, fontFamily: SANS, fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${theme.panel}` }}>
    {initials}
  </span>
);
