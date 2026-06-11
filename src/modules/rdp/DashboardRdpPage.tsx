'use client';

import Link from 'next/link';
import {
  useCurrentProject,
  useProjectCapa,
  useProjectIndicators,
  useProjectIshikawa,
  useProjectSolutions,
  useProjectSubjects,
  useWorkspace,
} from '@/lib/store';
import { RDP_PHASES } from '@/lib/rdp';

/**
 * Tableau de bord RDP — avancement dans la démarche en 7 phases (0 → 6),
 * indicateurs de performance et état des actions.
 */
export function DashboardRdpPage() {
  const project = useCurrentProject();
  const subjects = useProjectSubjects(project?.id);
  const ishikawaList = useProjectIshikawa(project?.id);
  const solutions = useProjectSolutions(project?.id);
  const indicators = useProjectIndicators(project?.id);
  const capaActions = useProjectCapa(project?.id);
  const { setRdpPhase } = useWorkspace();

  if (!project) return null;

  const currentPhase = project.rdpCurrentPhase ?? 0;
  const phaseMeta = RDP_PHASES[currentPhase] ?? RDP_PHASES[0];

  const retainedSubject = subjects.find((s) => s.retained);
  const causesCount = ishikawaList.reduce((n, a) => n + a.causes.length, 0);
  const retainedSolutions = solutions.filter((s) => s.retained);
  const phase5 = capaActions.filter((a) => a.phase === 5);
  const phase5Open = phase5.filter((a) => a.status === 'open' || a.status === 'in_progress');
  const phase6 = capaActions.filter((a) => a.phase === 6);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="subtitle">
            Résolution de problèmes — démarche en 7 phases, simple, efficace, adaptable à tout le monde.
          </p>
        </div>
        <span className="badge rdp-badge">RDP</span>
      </div>

      {/* Sujet retenu */}
      {retainedSubject && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px' }}>
          <span className="muted" style={{ fontSize: 12 }}>Sujet traité</span>
          <p style={{ fontWeight: 600, marginTop: 2 }}>{retainedSubject.label}</p>
        </div>
      )}

      {/* Avancement de la démarche */}
      <div className="card">
        <div className="card-header">
          <h2>Démarche — phase {currentPhase} sur 6</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-sm"
              disabled={currentPhase === 0}
              onClick={() => void setRdpPhase(project.id, currentPhase - 1)}
            >
              ← Phase précédente
            </button>
            <button
              className="btn btn-sm btn-primary"
              disabled={currentPhase === 6}
              onClick={() => void setRdpPhase(project.id, currentPhase + 1)}
            >
              Phase suivante →
            </button>
          </div>
        </div>

        <div className="pdca-steps phase-steps">
          {RDP_PHASES.map((p) => (
            <button
              key={p.num}
              type="button"
              className={`pdca-step${p.num === currentPhase ? ' active' : p.num < currentPhase ? ' done' : ''}`}
              onClick={() => void setRdpPhase(project.id, p.num)}
              title={p.description}
            >
              <span className="phase-step-num">{p.num}</span>
              <span className="pdca-step-label">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="phase-current">
          <div>
            <p style={{ fontWeight: 600 }}>
              Phase {phaseMeta.num} — {phaseMeta.label}
            </p>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{phaseMeta.description}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {phaseMeta.tools.map((t) => (
                <span key={t} className="badge source">{t}</span>
              ))}
            </div>
          </div>
          <Link href={phaseMeta.href} className="btn btn-primary" style={{ flexShrink: 0 }}>
            Ouvrir la phase →
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="card stat-card">
          <div className="stat-value">{subjects.length}</div>
          <div className="stat-label">Sujets identifiés</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{causesCount}</div>
          <div className="stat-label">Causes (Ishikawa)</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">
            {retainedSolutions.length}
            <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/{solutions.length}</span>
          </div>
          <div className="stat-label">Solutions retenues</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">
            <span style={{ color: phase5Open.length > 0 ? 'var(--accent)' : 'inherit' }}>
              {phase5Open.length}
            </span>
            <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/{phase5.length}</span>
          </div>
          <div className="stat-label">Actions ouvertes</div>
        </div>
      </div>

      {/* Tableau de bord — indicateurs */}
      <div className="card">
        <div className="card-header">
          <h2>Indicateurs de performance</h2>
          <Link href="/probleme" className="btn btn-sm">Gérer les indicateurs</Link>
        </div>
        {indicators.length === 0 ? (
          <div className="empty">
            <p>
              Aucun indicateur. Définissez-les en phase 1 pour mesurer l&apos;évolution des
              écarts entre situation actuelle et situation souhaitée.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th>Valeur actuelle</th>
                  <th>Objectif</th>
                  <th>Fréquence</th>
                </tr>
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

      {/* Standardisation */}
      {currentPhase >= 6 && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <span className="muted" style={{ fontSize: 12 }}>Standardisation</span>
          <p style={{ marginTop: 2 }}>
            {phase6.length === 0
              ? 'Aucune action de standardisation pour le moment.'
              : `${phase6.length} action(s) de standardisation planifiée(s).`}{' '}
            <Link href="/standardisation" className="link">Ouvrir la phase 6</Link>
          </p>
        </div>
      )}

      <p className="muted" style={{ fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>
        « Ce n&apos;est pas avec ceux qui ont créé les problèmes qu&apos;il faut espérer les
        résoudre. » — Shigeo Shingo
      </p>
    </div>
  );
}
