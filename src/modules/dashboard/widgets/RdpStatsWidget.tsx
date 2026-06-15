'use client';

import { useProjectCapa, useProjectIshikawa, useProjectSolutions, useProjectSubjects } from '@/lib/store';
import type { WidgetProps } from './index';

export function RdpStatsWidget({ project }: WidgetProps) {
  const subjects = useProjectSubjects(project.id);
  const ishikawa = useProjectIshikawa(project.id);
  const solutions = useProjectSolutions(project.id);
  const capa = useProjectCapa(project.id);

  const causes = ishikawa.reduce((n, a) => n + a.causes.length, 0);
  const retained = solutions.filter((s) => s.retained).length;
  const phase5 = capa.filter((a) => a.phase === 5);
  const phase5Open = phase5.filter((a) => a.status === 'open' || a.status === 'in_progress');

  return (
    <div className="kpi-row kpi-row-4">
      <div className="card stat-card"><div className="stat-value">{subjects.length}</div><div className="stat-label">Sujets identifiés</div></div>
      <div className="card stat-card"><div className="stat-value">{causes}</div><div className="stat-label">Causes (Ishikawa)</div></div>
      <div className="card stat-card">
        <div className="stat-value">{retained}<span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/{solutions.length}</span></div>
        <div className="stat-label">Solutions retenues</div>
      </div>
      <div className="card stat-card">
        <div className="stat-value">
          <span style={{ color: phase5Open.length > 0 ? 'var(--accent)' : 'inherit' }}>{phase5Open.length}</span>
          <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/{phase5.length}</span>
        </div>
        <div className="stat-label">Actions ouvertes</div>
      </div>
    </div>
  );
}
