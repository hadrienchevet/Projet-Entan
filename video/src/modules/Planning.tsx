import React from 'react';
import { spring, interpolate } from 'remotion';
import { theme } from '../theme';
import { SANS } from '../fonts';
import { ease } from '../easing';
import { FPS } from '../timeline';
import { ModuleHeader, LiveTag } from '../components/AppWindow';
import { useModule } from './_shared';

const LABEL_W = 360;
const CHART_W = 892;
const COLS = 8;
const COL_W = CHART_W / COLS;
const ROW_H = 74;
const HEAD_H = 46;

const tasks = [
  { name: 'Étude & cadrage', start: 0, span: 2, done: true },
  { name: 'Plan de maintenance', start: 1, span: 2, done: true },
  { name: 'Étalonnage des visseuses', start: 2, span: 2, done: false },
  { name: 'Audit 5S bord de ligne', start: 3, span: 2, done: false },
  { name: 'Mise en service A3', start: 5, span: 2, milestone: true },
];
const dateLabels = ['16 juin', '30 juin', '14 juil', '28 juil'];

export const Planning: React.FC = () => {
  const { local, opacity } = useModule('planning');
  if (opacity <= 0) return null;

  const todayX = 3.4 * COL_W;
  const todayReveal = ease(local, [40, 80], [0, 1]);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <ModuleHeader title="Planning" right={<LiveTag />} />
      <div style={{ padding: '34px 44px 0', position: 'relative' }}>
        <div style={{ position: 'relative', height: HEAD_H + tasks.length * ROW_H }}>
          {/* Lignes de grille verticales */}
          {Array.from({ length: COLS + 1 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: LABEL_W + i * COL_W, top: HEAD_H, width: 1, height: tasks.length * ROW_H, background: '#262421' }} />
          ))}
          {/* Dates */}
          {dateLabels.map((d, i) => (
            <div key={d} style={{ position: 'absolute', left: LABEL_W + i * 2 * COL_W + 6, top: 8, fontFamily: SANS, fontSize: 16, color: theme.muted }}>{d}</div>
          ))}
          {/* Ligne "aujourd'hui" */}
          <div style={{ position: 'absolute', left: LABEL_W + todayX, top: HEAD_H - 6, width: 2, height: tasks.length * ROW_H + 6, background: theme.accent, opacity: todayReveal * 0.9 }} />
          <div style={{ position: 'absolute', left: LABEL_W + todayX - 36, top: HEAD_H - 30, fontFamily: SANS, fontSize: 14, fontWeight: 600, color: theme.accentText, opacity: todayReveal }}>aujourd'hui</div>

          {/* Lignes de tâches */}
          {tasks.map((t, r) => {
            const rowY = HEAD_H + r * ROW_H;
            const barLeft = LABEL_W + t.start * COL_W;
            const barW = t.span * COL_W - 14;
            const grow = spring({ frame: local - 30 - r * 12, fps: FPS, config: { damping: 18, mass: 0.7 } });
            const labelO = ease(local, [18 + r * 10, 48 + r * 10], [0, 1]);
            return (
              <div key={t.name}>
                <div style={{ position: 'absolute', left: 0, top: rowY + ROW_H / 2 - 14, width: LABEL_W - 20, fontFamily: SANS, fontSize: 20, color: theme.text, opacity: labelO, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                {t.milestone ? (
                  <div style={{ position: 'absolute', left: barLeft + 8, top: rowY + ROW_H / 2 - 16, width: 32, height: 32, background: theme.accent, transform: `rotate(45deg) scale(${grow})`, borderRadius: 6, boxShadow: '0 0 24px rgba(217,119,87,0.5)' }} />
                ) : (
                  <div style={{ position: 'absolute', left: barLeft, top: rowY + ROW_H / 2 - 17, width: barW, height: 34, borderRadius: 10, background: t.done ? theme.greenSoft : theme.accentSoft, border: `1px solid ${t.done ? theme.green : theme.accent}`, transform: `scaleX(${grow})`, transformOrigin: 'left', display: 'flex', alignItems: 'center', paddingLeft: 14 }}>
                    <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: t.done ? theme.green : theme.accentText, opacity: interpolate(grow, [0.6, 1], [0, 1], { extrapolateLeft: 'clamp' }) }}>{t.done ? '✓' : ''}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
