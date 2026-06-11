'use client';

import { useState } from 'react';
import {
  memberName,
  useCurrentProject,
  useProjectFiveWhys,
  useWorkspace,
} from '@/lib/store';
import type { FiveWhyAnalysis, FiveWhyAnalysisInput, FiveWhyLevelInput, PdcaPhase } from '@/lib/types';
import { PDCA_LABELS } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { PdcaBadge } from '@/components/Badges';
import {
  IconChevronLeft,
  IconEdit,
  IconPlus,
  IconTrash,
} from '@/components/icons';

const PDCA_PHASES: PdcaPhase[] = ['plan', 'do', 'check', 'act', 'closed'];

export function CinqPourquoiPage() {
  const project = useCurrentProject();
  const analyses = useProjectFiveWhys(project?.id);
  const { deleteFiveWhyAnalysis } = useWorkspace();

  const [selected, setSelected] = useState<FiveWhyAnalysis | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FiveWhyAnalysis | null>(null);

  if (!project) return null;

  if (selected) {
    const fresh = analyses.find((a) => a.id === selected.id) ?? selected;
    return (
      <FiveWhyDetail
        analysis={fresh}
        projectId={project.id}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>5 Pourquoi</h1>
          <p className="subtitle">
            Remontez la chaîne des causes jusqu'à la cause racine du problème.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Nouvelle analyse
        </button>
      </div>

      {analyses.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p>Aucune analyse 5 Pourquoi. Créez-en une pour commencer l&apos;investigation.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus /> Créer la première analyse
            </button>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Problème</th>
                <th>Phase PDCA</th>
                <th>Niveaux</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(a)}>
                  <td className="cell-title">{a.title}</td>
                  <td>
                    <span className="cell-sub" style={{ maxWidth: 280, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.problemStatement || <span className="muted">—</span>}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <PdcaBadge phase={a.pdcaPhase} />
                  </td>
                  <td>{a.levels.length} / 5</td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" onClick={() => setEditing(a)} aria-label="Modifier">
                      <IconEdit />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => {
                        if (window.confirm(`Supprimer l'analyse "${a.title}" ?`)) {
                          void deleteFiveWhyAnalysis(a.id);
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

      {creating && (
        <FiveWhyFormModal projectId={project.id} onClose={() => setCreating(false)} />
      )}
      {editing && (
        <FiveWhyFormModal
          projectId={project.id}
          analysis={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ── Détail d'une analyse (vue complète de la chaîne) ─────────────────────── */

function FiveWhyDetail({
  analysis,
  projectId,
  onBack,
}: {
  analysis: FiveWhyAnalysis;
  projectId: string;
  onBack: () => void;
}) {
  const { addFiveWhyLevel, updateFiveWhyLevel, deleteFiveWhyLevel, updateFiveWhyAnalysis } =
    useWorkspace();

  const canAddLevel = analysis.levels.length < 5;

  const handleLevelBlur = (
    levelId: string,
    field: keyof FiveWhyLevelInput,
    value: string | boolean,
  ) => {
    void updateFiveWhyLevel(levelId, analysis.id, { [field]: value });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="icon-btn" onClick={onBack} aria-label="Retour">
            <IconChevronLeft />
          </button>
          <div>
            <h1>{analysis.title}</h1>
            <p className="subtitle">{analysis.problemStatement || 'Aucun énoncé du problème.'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 13 }}>Phase PDCA :</span>
          <select
            value={analysis.pdcaPhase}
            onChange={(e) =>
              void updateFiveWhyAnalysis(analysis.id, {
                pdcaPhase: e.target.value as PdcaPhase,
              })
            }
            style={{ fontSize: 13 }}
          >
            {PDCA_PHASES.map((p) => (
              <option key={p} value={p}>{PDCA_LABELS[p]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Énoncé du problème */}
      <div className="card">
        <div className="card-header">
          <h2>Problème</h2>
        </div>
        <textarea
          className="why-problem-input"
          defaultValue={analysis.problemStatement}
          placeholder="Décrivez le problème observé (quoi, où, quand, combien)…"
          onBlur={(e) =>
            void updateFiveWhyAnalysis(analysis.id, { problemStatement: e.target.value })
          }
          rows={3}
        />
      </div>

      {/* Chaîne des Pourquoi */}
      <div className="card">
        <div className="card-header">
          <h2>Chaîne des causes</h2>
          <span className="muted" style={{ fontSize: 13 }}>
            {analysis.levels.length} niveau{analysis.levels.length > 1 ? 'x' : ''} sur 5
          </span>
        </div>

        {analysis.levels.length === 0 && (
          <div className="empty">
            <p>Ajoutez le premier niveau pour démarrer l&apos;investigation.</p>
          </div>
        )}

        <div className="why-chain">
          {analysis.levels.map((level, idx) => (
            <div key={level.id}>
              <div className="why-level">
                <div className="why-level-num">{level.levelNum}</div>
                <div className="why-fields">
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Pourquoi ?</label>
                    <textarea
                      defaultValue={level.whyQuestion}
                      placeholder="Posez la question Pourquoi…"
                      rows={2}
                      onBlur={(e) => handleLevelBlur(level.id, 'whyQuestion', e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Parce que…</label>
                    <textarea
                      defaultValue={level.becauseAnswer}
                      placeholder="La réponse / cause identifiée…"
                      rows={2}
                      onBlur={(e) => handleLevelBlur(level.id, 'becauseAnswer', e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={level.isRootCause}
                        onChange={(e) => handleLevelBlur(level.id, 'isRootCause', e.target.checked)}
                      />
                      <span>Cause racine identifiée</span>
                    </label>
                    {idx === analysis.levels.length - 1 && (
                      <button
                        className="icon-btn danger"
                        onClick={() => void deleteFiveWhyLevel(level.id, analysis.id, projectId)}
                        aria-label="Supprimer ce niveau"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {idx < analysis.levels.length - 1 && <div className="why-connector" />}
            </div>
          ))}
        </div>

        {canAddLevel && (
          <div style={{ paddingTop: analysis.levels.length > 0 ? 12 : 0 }}>
            <button
              className="btn"
              onClick={() => void addFiveWhyLevel(analysis.id, projectId)}
            >
              <IconPlus /> Ajouter le niveau {analysis.levels.length + 1}
            </button>
          </div>
        )}
        {analysis.levels.length === 5 && (
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            Niveau maximum atteint (5 niveaux).
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Modal création / édition d'une analyse ──────────────────────────────── */

function FiveWhyFormModal({
  projectId,
  analysis,
  onClose,
}: {
  projectId: string;
  analysis?: FiveWhyAnalysis;
  onClose: () => void;
}) {
  const { addFiveWhyAnalysis, updateFiveWhyAnalysis } = useWorkspace();
  const [title, setTitle] = useState(analysis?.title ?? '');
  const [problemStatement, setProblemStatement] = useState(analysis?.problemStatement ?? '');
  const [pdcaPhase, setPdcaPhase] = useState<PdcaPhase>(analysis?.pdcaPhase ?? 'plan');
  const [error, setError] = useState('');

  const submit = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const input: FiveWhyAnalysisInput = {
      title: title.trim(),
      problemStatement: problemStatement.trim(),
      pdcaPhase,
    };
    if (analysis) {
      void updateFiveWhyAnalysis(analysis.id, input);
    } else {
      void addFiveWhyAnalysis(projectId, input);
    }
    onClose();
  };

  return (
    <Modal
      title={analysis ? "Modifier l'analyse" : 'Nouvelle analyse 5 Pourquoi'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit}>
            {analysis ? 'Enregistrer' : 'Créer'}
          </button>
        </>
      }
    >
      <div className="field">
        <label>Titre <span className="req">*</span></label>
        <input
          type="text" value={title} autoFocus
          placeholder="Ex. Arrêt convoyeur C1 — 2026-06"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="field">
        <label>Énoncé du problème</label>
        <textarea
          value={problemStatement}
          placeholder="Quoi, où, quand, combien — description factuelle du problème observé."
          rows={3}
          onChange={(e) => setProblemStatement(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Phase PDCA initiale</label>
        <select value={pdcaPhase} onChange={(e) => setPdcaPhase(e.target.value as PdcaPhase)}>
          {PDCA_PHASES.map((p) => (
            <option key={p} value={p}>{PDCA_LABELS[p]}</option>
          ))}
        </select>
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
