'use client';

import { useState } from 'react';
import {
  useCurrentProject,
  useProjectIshikawa,
  useProjectSolutions,
  useWorkspace,
} from '@/lib/store';
import type { Id, IshikawaCause, RdpSolution, RdpSolutionInput } from '@/lib/types';
import { solutionScore } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';

/**
 * Phases 3-4 — Rechercher des solutions, puis choisir avec la matrice de
 * décision : trois critères notés 1–4 (efficacité, facilité, coût),
 * score = somme (3 à 12). « Il vaut mieux un imparfait immédiat qu'un
 * parfait à venir. »
 */

const SCALE = [1, 2, 3, 4];

function scoreLevel(score: number): string {
  if (score >= 10) return 'crit-low'; // vert : bonne candidate
  if (score >= 7) return 'crit-medium';
  return 'crit-high';
}

export function SolutionsPage() {
  const project = useCurrentProject();
  const solutions = useProjectSolutions(project?.id);
  const ishikawaList = useProjectIshikawa(project?.id);
  const { updateRdpSolution, deleteRdpSolution, setSolutionRetained } = useWorkspace();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RdpSolution | null>(null);

  if (!project) return null;

  const allCauses: IshikawaCause[] = ishikawaList.flatMap((a) => a.causes);
  const causeLabel = (causeId?: Id) =>
    causeId ? allCauses.find((c) => c.id === causeId)?.causeText : undefined;

  const sorted = [...solutions].sort((a, b) => solutionScore(b) - solutionScore(a));
  const retainedCount = solutions.filter((s) => s.retained).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Phases 3-4 — Solutions</h1>
          <p className="subtitle">
            Recherchez des solutions pour chaque cause, puis choisissez avec la matrice de
            décision. « Il vaut mieux un imparfait immédiat qu&apos;un parfait à venir. »
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Nouvelle solution
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Matrice de décision ({solutions.length})</h2>
          <span className="muted" style={{ fontSize: 12.5 }}>
            Score = efficacité + facilité + coût (4 = peu coûteux) ·{' '}
            {retainedCount} retenue{retainedCount > 1 ? 's' : ''}
          </span>
        </div>

        {solutions.length === 0 ? (
          <div className="empty">
            <p>
              Aucune solution pour le moment. Brainstormez des solutions pour chaque cause
              identifiée en phase 2, puis évaluez-les.
            </p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus /> Ajouter la première solution
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Solution</th>
                  <th>Cause traitée</th>
                  <th title="Efficacité attendue (1–4)">Efficacité</th>
                  <th title="Facilité de mise en œuvre (1–4)">Facilité</th>
                  <th title="Coût : 4 = très peu coûteux">Coût</th>
                  <th>Score</th>
                  <th>Retenue</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-title">{s.title}</div>
                      {s.description && <div className="cell-sub">{s.description}</div>}
                    </td>
                    <td>
                      {causeLabel(s.causeId) ?? <span className="muted">—</span>}
                    </td>
                    {(['effectiveness', 'ease', 'cost'] as const).map((crit) => (
                      <td key={crit}>
                        <select
                          className="raci-select"
                          value={s[crit]}
                          onChange={(e) =>
                            void updateRdpSolution(s.id, { [crit]: Number(e.target.value) })
                          }
                          aria-label={`${crit} de ${s.title}`}
                        >
                          {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                    ))}
                    <td>
                      <span className={`badge ${scoreLevel(solutionScore(s))}`}>
                        {solutionScore(s)}
                      </span>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={s.retained}
                        onChange={(e) => void setSolutionRetained(s.id, e.target.checked)}
                        aria-label={`Retenir ${s.title}`}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn" onClick={() => setEditing(s)} aria-label="Modifier">
                        <IconEdit />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          if (window.confirm(`Supprimer la solution « ${s.title} » ?`)) {
                            void deleteRdpSolution(s.id);
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
      </div>

      {creating && (
        <SolutionFormModal projectId={project.id} causes={allCauses} onClose={() => setCreating(false)} />
      )}
      {editing && (
        <SolutionFormModal
          projectId={project.id}
          solution={editing}
          causes={allCauses}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function SolutionFormModal({
  projectId,
  solution,
  causes,
  onClose,
}: {
  projectId: Id;
  solution?: RdpSolution;
  causes: IshikawaCause[];
  onClose: () => void;
}) {
  const { addRdpSolution, updateRdpSolution } = useWorkspace();
  const [title, setTitle] = useState(solution?.title ?? '');
  const [description, setDescription] = useState(solution?.description ?? '');
  const [causeId, setCauseId] = useState<Id | ''>(solution?.causeId ?? '');
  const [effectiveness, setEffectiveness] = useState(solution?.effectiveness ?? 2);
  const [ease, setEase] = useState(solution?.ease ?? 2);
  const [cost, setCost] = useState(solution?.cost ?? 2);
  const [error, setError] = useState('');

  const submit = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const input: RdpSolutionInput = {
      title: title.trim(),
      description: description.trim(),
      causeId: causeId || undefined,
      effectiveness, ease, cost,
    };
    if (solution) {
      void updateRdpSolution(solution.id, input);
    } else {
      void addRdpSolution(projectId, input);
    }
    onClose();
  };

  return (
    <Modal
      title={solution ? 'Modifier la solution' : 'Nouvelle solution'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit}>
            {solution ? 'Enregistrer' : 'Créer'}
          </button>
        </>
      }
    >
      <div className="field">
        <label>Solution <span className="req">*</span></label>
        <input
          type="text" value={title} autoFocus
          placeholder="Ex. Plan de graissage hebdomadaire des roulements"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          value={description}
          placeholder="Détail de la solution proposée…"
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Cause traitée (Ishikawa)</label>
        <select value={causeId} onChange={(e) => setCauseId(e.target.value)}>
          <option value="">— Aucune —</option>
          {causes.map((c) => (
            <option key={c.id} value={c.id}>
              [{c.category}] {c.causeText}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Efficacité (1–4)</label>
          <select value={effectiveness} onChange={(e) => setEffectiveness(Number(e.target.value))}>
            {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Facilité (1–4)</label>
          <select value={ease} onChange={(e) => setEase(Number(e.target.value))}>
            {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Coût (4 = faible)</label>
          <select value={cost} onChange={(e) => setCost(Number(e.target.value))}>
            {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
