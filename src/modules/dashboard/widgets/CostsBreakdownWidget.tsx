'use client';

import Link from 'next/link';
import { useProjectCostItems } from '@/lib/store';
import { costActualTotal, costPlannedTotal, type CostItem } from '@/lib/types';
import type { WidgetProps } from './index';

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

/** Nombre de postes détaillés avant regroupement dans « Autres ». */
const TOP_N = 5;

export function CostsBreakdownWidget({ project }: WidgetProps) {
  const items = useProjectCostItems(project.id);

  // On répartit sur le réel ; tant qu'aucun réel n'est saisi, on montre le prévu.
  const actualTotal = items.reduce((s, c) => s + costActualTotal(c), 0);
  const basis: 'actual' | 'planned' = actualTotal > 0 ? 'actual' : 'planned';
  const value = (c: CostItem) => (basis === 'actual' ? costActualTotal(c) : costPlannedTotal(c));

  const ranked = items
    .map((c) => ({ id: c.id, label: c.label, amount: value(c) }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = ranked.reduce((s, r) => s + r.amount, 0);

  // Top N détaillés, le reste cumulé dans « Autres ».
  const top = ranked.slice(0, TOP_N);
  const rest = ranked.slice(TOP_N);
  const rows = rest.length
    ? [...top, { id: '__other', label: `Autres (${rest.length})`, amount: rest.reduce((s, r) => s + r.amount, 0) }]
    : top;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Répartition des coûts</h2>
          <span className="badge in_progress">{ranked.length}</span>
        </div>
        <Link className="link" href="/couts">Coûts</Link>
      </div>
      {total === 0 ? (
        <div className="empty"><p>Aucune dépense à répartir pour le moment.</p></div>
      ) : (
        <div className="cost-split">
          {rows.map((r) => {
            const pct = Math.round((r.amount / total) * 100);
            const other = r.id === '__other';
            return (
              <div key={r.id} className="cost-split-item">
                <div className="cost-split-head">
                  <span className="cost-split-name">{r.label}</span>
                  <span className="cost-split-amt">{eur(r.amount)}<span className="pct">{pct} %</span></span>
                </div>
                <span className="breakdown-track">
                  <span
                    className="breakdown-fill"
                    style={{ width: `${pct}%`, background: other ? 'var(--border-strong)' : 'var(--accent)' }}
                  />
                </span>
              </div>
            );
          })}
          <div className="cost-bar-meta">
            <span>{basis === 'actual' ? 'Réparti sur le réel' : 'Réparti sur le prévu'}</span>
            <span>{eur(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
