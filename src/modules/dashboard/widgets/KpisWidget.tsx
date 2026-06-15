'use client';

import { useProjectActions, useProjectAmdecs } from '@/lib/store';
import { criticality, criticalityLevel, residualCriticality } from '@/lib/types';
import type { WidgetProps } from './index';

export function KpisWidget({ project }: WidgetProps) {
  const actions = useProjectActions(project.id);
  const amdecs = useProjectAmdecs(project.id);

  const open = actions.filter((a) => a.status !== 'done').length;
  const done = actions.filter((a) => a.status === 'done').length;
  const progress = actions.length ? Math.round((done / actions.length) * 100) : 0;
  // Risques critiques évalués sur la criticité résiduelle (après actions).
  const critical = amdecs.filter(
    (a) => criticalityLevel(residualCriticality(a) ?? criticality(a)) === 'high',
  ).length;

  const cards = [
    { v: String(open), l: 'Actions en cours' },
    { v: `${progress} %`, l: 'Avancement' },
    { v: String(critical), l: 'Risques critiques', danger: critical > 0 },
  ];

  return (
    <div className="kpi-row">
      {cards.map((c) => (
        <div key={c.l} className="card stat-card">
          <div className="stat-value" style={c.danger ? { color: 'var(--danger)' } : undefined}>{c.v}</div>
          <div className="stat-label">{c.l}</div>
        </div>
      ))}
    </div>
  );
}
