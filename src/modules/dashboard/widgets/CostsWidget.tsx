'use client';

import Link from 'next/link';
import { useProjectCostItems } from '@/lib/store';
import type { WidgetProps } from './index';

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function CostsWidget({ project }: WidgetProps) {
  const items = useProjectCostItems(project.id);
  const planned = items.reduce((s, c) => s + c.planned, 0);
  const actual = items.reduce((s, c) => s + c.actual, 0);
  const variance = actual - planned;
  const consumption = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Suivi des coûts</h2>
          <span className={`badge ${consumption > 100 ? 'crit-high' : consumption >= 90 ? 'crit-medium' : 'crit-low'}`}>
            {consumption} %
          </span>
        </div>
        <Link className="link" href="/couts">Coûts</Link>
      </div>
      {items.length === 0 ? (
        <div className="empty"><p>Aucun poste de coût. Renseignez votre budget.</p></div>
      ) : (
        <>
          <div className="cost-bar">
            <span className={`cost-bar-fill${consumption > 100 ? ' over' : ''}`} style={{ width: `${Math.min(consumption, 100)}%` }} />
          </div>
          <div className="cost-summary">
            <div><span className="cost-summary-label">Réel</span><span className="cost-summary-val">{eur(actual)}</span></div>
            <div><span className="cost-summary-label">Budget</span><span className="cost-summary-val">{eur(planned)}</span></div>
            <div>
              <span className="cost-summary-label">Écart</span>
              <span className="cost-summary-val" style={{ color: variance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {variance > 0 ? '+' : ''}{eur(variance)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
