'use client';

import Link from 'next/link';
import { useProjectActions, useProjectAmdecs } from '@/lib/store';
import { criticality, criticalityLevel, residualCriticality } from '@/lib/types';
import { CriticalityBadge } from '@/components/Badges';
import type { WidgetProps } from './index';

/**
 * Risques (AMDEC) — affichés selon la criticité APRÈS actions correctives
 * (résiduelle). Si une analyse n'a pas été réévaluée, on retombe sur la
 * criticité initiale en l'indiquant.
 */
export function RisksWidget({ project }: WidgetProps) {
  const amdecs = useProjectAmdecs(project.id);
  const actions = useProjectActions(project.id);

  const effective = (e: (typeof amdecs)[number]) => residualCriticality(e) ?? criticality(e);
  const sorted = [...amdecs].sort((a, b) => effective(b) - effective(a)).slice(0, 5);
  const criticalCount = amdecs.filter((a) => criticalityLevel(effective(a)) === 'high').length;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Risques</h2>
          <span className={`badge ${criticalCount > 0 ? 'crit-high' : 'crit-low'}`}>
            {criticalCount} critique{criticalCount > 1 ? 's' : ''}
          </span>
        </div>
        <Link className="link" href="/amdec">AMDEC</Link>
      </div>
      {sorted.length === 0 ? (
        <div className="empty"><p>Aucune analyse AMDEC. Identifiez vos premiers risques.</p></div>
      ) : (
        sorted.map((r) => {
          const residual = residualCriticality(r);
          const linked = actions.filter((a) => a.amdecId === r.id).length;
          return (
            <div key={r.id} className="list-row">
              <div className="row-main">
                <div className="row-title">{r.element} — {r.failureMode}</div>
                <div className="row-sub">
                  {residual !== null
                    ? `Après ${linked} action(s) corrective(s)`
                    : `Cause : ${r.cause} · non réévalué`}
                </div>
              </div>
              {residual !== null ? (
                <span className="risk-evo">
                  <span className="risk-before">{criticality(r)}</span>
                  <span className="risk-arrow">→</span>
                  <CriticalityBadge score={residual} />
                </span>
              ) : (
                <CriticalityBadge score={criticality(r)} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
