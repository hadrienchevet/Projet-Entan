'use client';

/**
 * Widget « Résolutions de problèmes ».
 *
 * Remplace les 5 widgets rdp-* d'avant fix-32, qui décrivaient LA démarche du
 * projet (sujet retenu, phase, indicateurs…). Un projet pouvant désormais en
 * contenir plusieurs, ces vues détaillées appartiennent à l'intérieur d'un RDP :
 * le dashboard du projet se contente d'en donner l'état d'ensemble.
 */

import Link from 'next/link';
import { useProjectRdps } from '@/lib/store';
import { RDP_PHASES, rdpPhaseHref } from '@/lib/rdp';
import type { WidgetProps } from './index';

export function RdpWidget({ project }: WidgetProps) {
  const rdps = useProjectRdps(project.id);
  const open = rdps.filter((r) => r.status === 'en_cours').length;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Résolutions de problèmes</h2>
          <span className={`badge ${open > 0 ? 'in_progress' : 'crit-low'}`}>{open} en cours</span>
        </div>
        <Link className="link" href="/rdp">
          Voir tout
        </Link>
      </div>

      {rdps.length === 0 ? (
        <div className="empty">
          <p>Aucune résolution de problème sur ce projet.</p>
        </div>
      ) : (
        rdps.slice(0, 5).map((r) => {
          const phase = RDP_PHASES.find((p) => p.num === r.currentPhase) ?? RDP_PHASES[0];
          return (
            <Link key={r.id} href={rdpPhaseHref(r.id, phase.slug)} className="list-row">
              <div className="row-main">
                <div className="row-title">{r.title}</div>
                <div className="row-sub">
                  Phase {r.currentPhase}/6 — {phase.label}
                </div>
              </div>
              <span className={`badge ${r.status === 'cloturee' ? 'done' : 'todo'}`}>
                {r.status === 'cloturee' ? 'Clôturée' : `${r.currentPhase}/6`}
              </span>
            </Link>
          );
        })
      )}
    </div>
  );
}
