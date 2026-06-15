'use client';

import Link from 'next/link';
import { useProjectIndicators } from '@/lib/store';
import type { WidgetProps } from './index';

export function RdpIndicatorsWidget({ project }: WidgetProps) {
  const indicators = useProjectIndicators(project.id);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Indicateurs de performance</h2>
        <Link href="/probleme" className="btn btn-sm">Gérer les indicateurs</Link>
      </div>
      {indicators.length === 0 ? (
        <div className="empty">
          <p>Aucun indicateur. Définissez-les en phase 1 pour mesurer l&apos;évolution des écarts.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Indicateur</th><th>Valeur actuelle</th><th>Objectif</th><th>Fréquence</th></tr>
            </thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.id}>
                  <td className="cell-title">{i.name}</td>
                  <td>{i.currentValue || <span className="muted">—</span>}{i.unit && i.currentValue ? ` ${i.unit}` : ''}</td>
                  <td>{i.targetValue || <span className="muted">—</span>}{i.unit && i.targetValue ? ` ${i.unit}` : ''}</td>
                  <td>{i.frequency || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
