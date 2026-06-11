'use client';

import { useCurrentProject, useProjectCapa, useProjectFiveWhys, useProjectIshikawa } from '@/lib/store';
import { CAPA_STATUS_LABELS, PDCA_LABELS, type PdcaPhase } from '@/lib/types';
import { PdcaBadge, CapaStatusBadge, CapaTypeBadge } from '@/components/Badges';

const PDCA_PHASES: PdcaPhase[] = ['plan', 'do', 'check', 'act'];

export function DashboardRdpPage() {
  const project = useCurrentProject();
  const fiveWhys = useProjectFiveWhys(project?.id);
  const ishikawaList = useProjectIshikawa(project?.id);
  const capaActions = useProjectCapa(project?.id);

  if (!project) return null;

  const openCapa = capaActions.filter((a) => a.status === 'open' || a.status === 'in_progress');
  const closedCapa = capaActions.filter((a) => a.status === 'closed' || a.status === 'verified');

  const activeFiveWhy = fiveWhys[fiveWhys.length - 1];
  const currentPhase: PdcaPhase = activeFiveWhy?.pdcaPhase ?? 'plan';

  const recentCapa = [...capaActions]
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 6);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="subtitle">Résolution de problèmes — PDCA · 5 Pourquoi · Ishikawa · CAPA</p>
        </div>
        <span className="badge rdp-badge">RDP</span>
      </div>

      {/* Contexte du problème */}
      {project.description && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div className="card-header">
            <h2>Problème à résoudre</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text)' }}>{project.description}</p>
        </div>
      )}

      {/* PDCA Progress */}
      <div className="card">
        <div className="card-header">
          <h2>Avancement PDCA</h2>
        </div>
        <div className="pdca-steps">
          {PDCA_PHASES.map((phase) => {
            const phaseOrder: PdcaPhase[] = ['plan', 'do', 'check', 'act', 'closed'];
            const cur = phaseOrder.indexOf(currentPhase);
            const idx = PDCA_PHASES.indexOf(phase);
            const isDone = cur > idx;
            const isActive = currentPhase === phase || (currentPhase === 'closed' && phase === 'act');
            return (
              <div
                key={phase}
                className={`pdca-step${isActive ? ' active' : isDone ? ' done' : ''}`}
              >
                <span className="pdca-step-label">{PDCA_LABELS[phase]}</span>
              </div>
            );
          })}
        </div>
        {currentPhase === 'closed' && (
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Résolution clôturée.
          </p>
        )}
        {fiveWhys.length === 0 && (
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Créez une analyse 5 Pourquoi pour suivre la phase PDCA.
          </p>
        )}
      </div>

      {/* Statistiques */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 0 }}>
        <div className="card stat-card">
          <div className="stat-value">{fiveWhys.length}</div>
          <div className="stat-label">Analyses 5 Pourquoi</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{ishikawaList.length}</div>
          <div className="stat-label">Diagrammes Ishikawa</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">
            <span style={{ color: openCapa.length > 0 ? 'var(--accent)' : 'inherit' }}>{openCapa.length}</span>
            <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/{capaActions.length}</span>
          </div>
          <div className="stat-label">CAPA ouvertes / total</div>
        </div>
      </div>

      {/* CAPA récentes */}
      <div className="card">
        <div className="card-header">
          <h2>Actions CAPA</h2>
          {closedCapa.length > 0 && (
            <span className="badge crit-low">{closedCapa.length} clôturée{closedCapa.length > 1 ? 's' : ''}</span>
          )}
        </div>
        {capaActions.length === 0 ? (
          <div className="empty">
            <p>Aucune action CAPA pour le moment. Créez des actions correctives ou préventives dans l&apos;onglet CAPA.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {recentCapa.map((a) => (
                  <tr key={a.id}>
                    <td className="cell-title">{a.title}</td>
                    <td><CapaTypeBadge type={a.type} /></td>
                    <td><CapaStatusBadge status={a.status} /></td>
                    <td>{a.dueDate ?? <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Résumé 5P */}
      {fiveWhys.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>5 Pourquoi</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Phase PDCA</th>
                  <th>Niveaux</th>
                </tr>
              </thead>
              <tbody>
                {fiveWhys.map((a) => (
                  <tr key={a.id}>
                    <td className="cell-title">{a.title}</td>
                    <td><PdcaBadge phase={a.pdcaPhase} /></td>
                    <td>{a.levels.length} / 5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
