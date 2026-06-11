'use client';

import { useState } from 'react';
import { useCurrentProject, useProjectIshikawa, useWorkspace } from '@/lib/store';
import type {
  IshikawaAnalysis,
  IshikawaAnalysisInput,
  IshikawaCategory,
  IshikawaCauseInput,
} from '@/lib/types';
import { ISHIKAWA_CATEGORIES } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { IconChevronLeft, IconEdit, IconPlus, IconTrash } from '@/components/icons';

export function IshikawaPage() {
  const project = useCurrentProject();
  const analyses = useProjectIshikawa(project?.id);
  const { deleteIshikawaAnalysis } = useWorkspace();

  const [selected, setSelected] = useState<IshikawaAnalysis | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<IshikawaAnalysis | null>(null);

  if (!project) return null;

  if (selected) {
    const fresh = analyses.find((a) => a.id === selected.id) ?? selected;
    return (
      <IshikawaDetail
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
          <h1>Phase 2 — Rechercher les causes</h1>
          <p className="subtitle">
            Brainstormez toutes les causes possibles, classez-les par nature avec le
            diagramme d&apos;Ishikawa / 5M.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Nouveau diagramme
        </button>
      </div>

      {analyses.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p>Aucun diagramme Ishikawa. Créez-en un pour analyser les causes par catégorie 6M.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus /> Créer le premier diagramme
            </button>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Effet (problème)</th>
                <th>Causes identifiées</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(a)}>
                  <td className="cell-title">{a.title}</td>
                  <td>
                    <span className="cell-sub" style={{ maxWidth: 280, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.effect || <span className="muted">—</span>}
                    </span>
                  </td>
                  <td>{a.causes.length}</td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" onClick={() => setEditing(a)} aria-label="Modifier">
                      <IconEdit />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => {
                        if (window.confirm(`Supprimer le diagramme "${a.title}" et toutes ses causes ?`)) {
                          void deleteIshikawaAnalysis(a.id);
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
        <IshikawaFormModal projectId={project.id} onClose={() => setCreating(false)} />
      )}
      {editing && (
        <IshikawaFormModal
          projectId={project.id}
          analysis={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ── Détail d'un diagramme Ishikawa (grille 6M) ───────────────────────────── */

function IshikawaDetail({
  analysis,
  projectId,
  onBack,
}: {
  analysis: IshikawaAnalysis;
  projectId: string;
  onBack: () => void;
}) {
  const { addIshikawaCause, deleteIshikawaCause } = useWorkspace();
  const [drafts, setDrafts] = useState<Partial<Record<IshikawaCategory, string>>>({});

  const causesByCategory = (cat: IshikawaCategory) =>
    analysis.causes.filter((c) => c.category === cat);

  const addCause = (cat: IshikawaCategory) => {
    const text = (drafts[cat] ?? '').trim();
    if (!text) return;
    void addIshikawaCause(analysis.id, projectId, { category: cat, causeText: text });
    setDrafts((d) => ({ ...d, [cat]: '' }));
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
            <p className="subtitle">
              Effet : <strong>{analysis.effect || '—'}</strong>
            </p>
          </div>
        </div>
        <span className="badge source">{analysis.causes.length} cause{analysis.causes.length > 1 ? 's' : ''}</span>
      </div>

      <div className="m6-grid">
        {ISHIKAWA_CATEGORIES.map((cat) => {
          const causes = causesByCategory(cat);
          return (
            <div key={cat} className="card m6-card">
              <div className="m6-card-header">{cat}</div>
              {causes.length === 0 ? (
                <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Aucune cause</p>
              ) : (
                <ul className="m6-cause-list">
                  {causes.map((c) => (
                    <li key={c.id} className="m6-cause-item">
                      <span style={{ flex: 1 }}>{c.causeText}</span>
                      <button
                        className="icon-btn danger"
                        style={{ width: 20, height: 20 }}
                        onClick={() => void deleteIshikawaCause(c.id, analysis.id)}
                        aria-label="Supprimer"
                      >
                        <IconTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={drafts[cat] ?? ''}
                  placeholder="Ajouter une cause…"
                  style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                  onChange={(e) => setDrafts((d) => ({ ...d, [cat]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addCause(cat)}
                />
                <button
                  className="btn btn-sm"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  onClick={() => addCause(cat)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Modal création / édition ───────────────────────────────────────────── */

function IshikawaFormModal({
  projectId,
  analysis,
  onClose,
}: {
  projectId: string;
  analysis?: IshikawaAnalysis;
  onClose: () => void;
}) {
  const { addIshikawaAnalysis, updateIshikawaAnalysis } = useWorkspace();
  const [title, setTitle] = useState(analysis?.title ?? '');
  const [effect, setEffect] = useState(analysis?.effect ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const input: IshikawaAnalysisInput = { title: title.trim(), effect: effect.trim() };
    if (analysis) {
      void updateIshikawaAnalysis(analysis.id, input);
    } else {
      void addIshikawaAnalysis(projectId, input);
    }
    onClose();
  };

  return (
    <Modal
      title={analysis ? 'Modifier le diagramme' : 'Nouveau diagramme Ishikawa'}
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
          placeholder="Ex. Analyse causes — arrêt convoyeur C1"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="field">
        <label>Effet / problème à analyser</label>
        <input
          type="text" value={effect}
          placeholder="Ex. Arrêt inopiné du convoyeur C1"
          onChange={(e) => setEffect(e.target.value)}
        />
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
