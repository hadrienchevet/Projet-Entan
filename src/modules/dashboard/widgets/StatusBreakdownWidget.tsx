'use client';

import Link from 'next/link';
import { useProjectActions } from '@/lib/store';
import { STATUS_LABELS, type ActionStatus } from '@/lib/types';
import type { WidgetProps } from './index';

const ORDER: ActionStatus[] = ['todo', 'in_progress', 'done'];
const BAR_CLASS: Record<ActionStatus, string> = {
  todo: 'crit-medium',
  in_progress: 'in_progress',
  done: 'done',
};

export function StatusBreakdownWidget({ project }: WidgetProps) {
  const actions = useProjectActions(project.id);
  const total = actions.length;
  const counts = ORDER.map((s) => ({ status: s, n: actions.filter((a) => a.status === s).length }));

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Répartition par statut</h2>
          <span className="badge in_progress">{total}</span>
        </div>
        <Link className="link" href="/actions">Actions</Link>
      </div>
      {total === 0 ? (
        <div className="empty"><p>Aucune action pour le moment.</p></div>
      ) : (
        counts.map(({ status, n }) => {
          const pct = Math.round((n / total) * 100);
          return (
            <div key={status} className="breakdown-row">
              <span className="breakdown-label">{STATUS_LABELS[status]}</span>
              <span className="breakdown-track">
                <span className={`breakdown-fill ${BAR_CLASS[status]}`} style={{ width: `${pct}%` }} />
              </span>
              <span className="breakdown-val">{n}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
