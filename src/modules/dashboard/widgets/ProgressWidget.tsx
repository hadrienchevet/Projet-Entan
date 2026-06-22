'use client';

import { useProjectActions } from '@/lib/store';
import type { WidgetProps } from './index';

/**
 * Avancement — frise horizontale pleine largeur, fine, colorée : segments
 * Terminée (vert) / En cours (accent) ; le reste de la barre = À faire.
 * Le % affiché est la part d'actions terminées.
 */
export function ProgressWidget({ project }: WidgetProps) {
  const actions = useProjectActions(project.id);
  const total = actions.length;
  const done = actions.filter((a) => a.status === 'done').length;
  const inProgress = actions.filter((a) => a.status === 'in_progress').length;
  const todo = total - done - inProgress;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const w = (n: number) => (total ? `${(n / total) * 100}%` : '0%');

  return (
    <div className="card progress-card">
      <div className="progress-head">
        <span className="progress-title">Avancement</span>
        <span className="progress-pct">{pct}&nbsp;%</span>
      </div>

      {total === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>Aucune action — l’avancement s’affichera ici.</p>
      ) : (
        <>
          <div className="frise" role="img" aria-label={`${pct}% terminé`}>
            <span className="frise-seg done" style={{ width: w(done) }} />
            <span className="frise-seg in_progress" style={{ width: w(inProgress) }} />
          </div>
          <div className="frise-legend">
            <span><i className="dot done" /> Terminée · {done}</span>
            <span><i className="dot in_progress" /> En cours · {inProgress}</span>
            <span><i className="dot todo" /> À faire · {todo}</span>
          </div>
        </>
      )}
    </div>
  );
}
