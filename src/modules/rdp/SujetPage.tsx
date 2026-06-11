'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useCurrentProject,
  useProjectFiveWhys,
  useProjectSubjects,
  useWorkspace,
} from '@/lib/store';
import { subjectScore } from '@/lib/types';
import { IconPlus, IconTrash } from '@/components/icons';

/**
 * Phase 0 — Choisir un sujet.
 * Brainstorming des problèmes, priorisation par tableau à double entrée
 * (fréquence × impact), choix du sujet retenu, validation par 5 Pourquoi.
 */

const SCALE = [1, 2, 3, 4];

function scoreLevel(score: number): string {
  if (score >= 9) return 'crit-high';
  if (score >= 6) return 'crit-medium';
  return 'crit-low';
}

export function SujetPage() {
  const project = useCurrentProject();
  const subjects = useProjectSubjects(project?.id);
  const fiveWhys = useProjectFiveWhys(project?.id);
  const { addRdpSubject, updateRdpSubject, deleteRdpSubject, setRetainedSubject } = useWorkspace();

  const [draft, setDraft] = useState('');

  if (!project) return null;

  const sorted = [...subjects].sort((a, b) => subjectScore(b) - subjectScore(a));
  const retained = subjects.find((s) => s.retained);

  const addSubject = () => {
    const label = draft.trim();
    if (!label) return;
    void addRdpSubject(project.id, { label, frequency: 1, impact: 1 });
    setDraft('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Phase 0 — Choisir un sujet</h1>
          <p className="subtitle">
            Brainstormez les problèmes rencontrés, priorisez-les (tableau à double entrée),
            puis choisissez le sujet à traiter.
          </p>
        </div>
        <span className="badge rdp-badge">Phase 0</span>
      </div>

      {retained && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px' }}>
          <span className="muted" style={{ fontSize: 12 }}>Sujet retenu</span>
          <p style={{ fontWeight: 600, marginTop: 2 }}>{retained.label}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Sujets ({subjects.length})</h2>
          <span className="muted" style={{ fontSize: 12.5 }}>
            Score = fréquence × impact — le plus fort en premier
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="empty">
            <p>
              Aucun sujet pour le moment. Posez une seule question au groupe — par exemple :
              « Quels sont les problèmes que vous rencontrez quotidiennement dans votre travail ? »
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Problème</th>
                  <th title="Fréquence d'apparition (1–4)">Fréquence</th>
                  <th title="Impact (1–4)">Impact</th>
                  <th>Score</th>
                  <th>Retenu</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.id}>
                    <td className="cell-title">{s.label}</td>
                    <td>
                      <select
                        className="raci-select"
                        value={s.frequency}
                        onChange={(e) => void updateRdpSubject(s.id, { frequency: Number(e.target.value) })}
                        aria-label={`Fréquence de ${s.label}`}
                      >
                        {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="raci-select"
                        value={s.impact}
                        onChange={(e) => void updateRdpSubject(s.id, { impact: Number(e.target.value) })}
                        aria-label={`Impact de ${s.label}`}
                      >
                        {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${scoreLevel(subjectScore(s))}`}>{subjectScore(s)}</span>
                    </td>
                    <td>
                      <input
                        type="radio"
                        name="retained-subject"
                        checked={s.retained}
                        onChange={() => void setRetainedSubject(project.id, s.id)}
                        aria-label={`Retenir ${s.label}`}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                    </td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          if (window.confirm(`Supprimer le sujet « ${s.label} » ?`)) {
                            void deleteRdpSubject(s.id);
                          }
                        }}
                        aria-label="Supprimer"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: subjects.length > 0 ? '1px solid var(--border)' : 'none' }}>
          <input
            type="text"
            value={draft}
            placeholder="Ajouter un problème issu du brainstorming…"
            style={{ flex: 1 }}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          />
          <button className="btn btn-primary" onClick={addSubject}>
            <IconPlus /> Ajouter
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Validation — 5 Pourquoi</h2>
          <Link href="/cinq-pourquoi" className="btn btn-sm">
            Ouvrir les analyses
          </Link>
        </div>
        {fiveWhys.length === 0 ? (
          <div className="empty">
            <p>
              Validez que les causes du sujet retenu sont réelles et sérieuses avec une analyse
              5 Pourquoi avant de présenter le choix à la hiérarchie.
            </p>
            <Link href="/cinq-pourquoi" className="btn btn-primary">
              <IconPlus /> Créer une analyse 5 Pourquoi
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Analyse</th>
                  <th>Niveaux</th>
                  <th>Cause racine</th>
                </tr>
              </thead>
              <tbody>
                {fiveWhys.map((a) => (
                  <tr key={a.id}>
                    <td className="cell-title">{a.title}</td>
                    <td>{a.levels.length} / 5</td>
                    <td>
                      {a.levels.some((l) => l.isRootCause) ? (
                        <span className="badge crit-low">identifiée</span>
                      ) : (
                        <span className="muted">en cours</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
