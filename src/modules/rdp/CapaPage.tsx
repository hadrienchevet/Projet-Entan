'use client';

import { useState } from 'react';
import { memberName, useCurrentProject, useProjectCapa, useWorkspace } from '@/lib/store';
import type {
  CapaAction,
  CapaActionInput,
  CapaStatus,
  CapaType,
  Id,
} from '@/lib/types';
import {
  CAPA_STATUS_LABELS,
  CAPA_TYPE_LABELS,
} from '@/lib/types';
import { Modal } from '@/components/Modal';
import { CapaStatusBadge, CapaTypeBadge } from '@/components/Badges';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';

type Filter = 'all' | CapaType;

/** Plan d'action PDCA — phase 5 (mise en œuvre) ou phase 6 (standardisation). */
export function CapaPage({ phase = 5 }: { phase?: 5 | 6 }) {
  const project = useCurrentProject();
  const allCapa = useProjectCapa(project?.id);
  const { deleteCapaAction } = useWorkspace();

  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CapaAction | null>(null);

  if (!project) return null;

  const capaActions = allCapa.filter((a) => a.phase === phase);
  const visible = filter === 'all' ? capaActions : capaActions.filter((a) => a.type === filter);
  const sorted = [...visible].sort((a, b) => {
    const s = { open: 0, in_progress: 1, closed: 2, verified: 3 };
    const sd = s[a.status] - s[b.status];
    if (sd !== 0) return sd;
    return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{phase === 5 ? 'Phase 5 — Mettre en œuvre' : 'Phase 6 — Standardiser'}</h1>
          <p className="subtitle">
            {phase === 5
              ? 'Plan d’action lié au PDCA et au QQOQCP — qui fait quoi, où, quand, comment et pourquoi.'
              : 'Étendre la solution aux autres procédés et pérenniser — esprit Kaizen : on peut toujours améliorer.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Nouvelle action
        </button>
      </div>

      {/* Filtres */}
      <div className="filter-row">
        {(['all', 'corrective', 'preventive'] as const).map((f) => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Toutes' : CAPA_TYPE_LABELS[f as CapaType]}
            <span className="filter-count">
              {f === 'all' ? capaActions.length : capaActions.filter((a) => a.type === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        {sorted.length === 0 ? (
          <div className="empty">
            <p>Aucune action CAPA{filter !== 'all' ? ' pour ce filtre' : ''}.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus /> Créer la première action CAPA
            </button>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Responsable</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id}>
                  <td className="cell-title">{a.title}</td>
                  <td><CapaTypeBadge type={a.type} /></td>
                  <td>{a.responsibleId ? memberName(project, a.responsibleId) : <span className="muted">—</span>}</td>
                  <td><CapaStatusBadge status={a.status} /></td>
                  <td>{a.dueDate ?? <span className="muted">—</span>}</td>
                  <td>
                    {a.source ? (
                      <span className="cell-sub" style={{ maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.source}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn" onClick={() => setEditing(a)} aria-label="Modifier">
                      <IconEdit />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => {
                        if (window.confirm(`Supprimer l'action "${a.title}" ?`)) {
                          void deleteCapaAction(a.id);
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
        )}
      </div>

      {creating && (
        <CapaFormModal projectId={project.id} phase={phase} members={project.members} onClose={() => setCreating(false)} />
      )}
      {editing && (
        <CapaFormModal
          projectId={project.id}
          phase={phase}
          action={editing}
          members={project.members}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ── Modal formulaire CAPA ────────────────────────────────────────────────── */

function CapaFormModal({
  projectId,
  phase,
  action,
  members,
  onClose,
}: {
  projectId: Id;
  phase: 5 | 6;
  action?: CapaAction;
  members: { id: Id; name: string }[];
  onClose: () => void;
}) {
  const { addCapaAction, updateCapaAction } = useWorkspace();
  const [type, setType] = useState<CapaType>(action?.type ?? 'corrective');
  const [title, setTitle] = useState(action?.title ?? '');
  const [description, setDescription] = useState(action?.description ?? '');
  const [responsibleId, setResponsibleId] = useState<Id | ''>(action?.responsibleId ?? '');
  const [status, setStatus] = useState<CapaStatus>(action?.status ?? 'open');
  const [dueDate, setDueDate] = useState(action?.dueDate ?? '');
  const [source, setSource] = useState(action?.source ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const input: CapaActionInput = {
      type,
      title: title.trim(),
      description: description.trim(),
      responsibleId: responsibleId || undefined,
      status,
      dueDate: dueDate || undefined,
      source: source.trim() || undefined,
      phase,
    };
    if (action) {
      void updateCapaAction(action.id, input);
    } else {
      void addCapaAction(projectId, input);
    }
    onClose();
  };

  return (
    <Modal
      title={action ? "Modifier l'action CAPA" : 'Nouvelle action CAPA'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit}>
            {action ? 'Enregistrer' : 'Créer'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as CapaType)}>
            {(Object.entries(CAPA_TYPE_LABELS) as [CapaType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as CapaStatus)}>
            {(Object.entries(CAPA_STATUS_LABELS) as [CapaStatus, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Titre <span className="req">*</span></label>
        <input
          type="text" value={title} autoFocus
          placeholder="Ex. Remplacer les roulements du convoyeur C1"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea
          value={description}
          placeholder="Détail de l'action à mener…"
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Responsable</label>
          <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)}>
            <option value="">— Aucun —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Échéance</label>
          <input
            type="date" value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Source (analyse 5P, Ishikawa, autre…)</label>
        <input
          type="text" value={source}
          placeholder="Ex. 5P Analyse #1 — Niveau 3"
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
