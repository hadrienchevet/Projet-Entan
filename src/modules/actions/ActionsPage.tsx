'use client';

import { useState } from 'react';
import { memberName, useCurrentProject, useProjectActions, useProjectAmdecs, useWorkspace } from '@/lib/store';
import type { Action, ActionStatus, Id } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import { formatDate, isOverdue } from '@/lib/date';
import { SourceBadge } from '@/components/Badges';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';
import { ActionFormModal } from './ActionFormModal';

export function ActionsPage() {
  const project = useCurrentProject();
  const actions = useProjectActions(project?.id);
  const amdecs = useProjectAmdecs(project?.id);
  const { setActionStatus, deleteAction } = useWorkspace();

  const [editing, setEditing] = useState<Action | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('all');
  const [memberFilter, setMemberFilter] = useState<Id | 'all'>('all');
  const [exporting, setExporting] = useState(false);

  if (!project) return null;

  const filtered = actions
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter((a) => memberFilter === 'all' || a.responsibleId === memberFilter)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));

  const amdecLabel = (id: Id | undefined) => {
    const a = amdecs.find((x) => x.id === id);
    return a ? `${a.element} — ${a.failureMode}` : undefined;
  };

  const remove = (action: Action) => {
    if (window.confirm(`Supprimer l'action « ${action.title} » ?`)) {
      void deleteAction(action.id);
    }
  };

  const exportPdf = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      const { exportActionsPdf } = await import('./ActionsPdf');
      await exportActionsPdf(project.name, filtered, project.members);
    } catch (err) {
      console.warn('Export PDF actions échoué', err);
    }
    setExporting(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Actions</h1>
          <p className="subtitle">
            Toutes les actions du projet, centralisées — issues des analyses AMDEC ou créées
            directement.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn" onClick={exportPdf} disabled={exporting || filtered.length === 0}>
            {exporting ? 'Génération…' : 'Exporter PDF'}
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <IconPlus /> Nouvelle action
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ActionStatus | 'all')}
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les statuts</option>
          {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          aria-label="Filtrer par responsable"
        >
          <option value="all">Tous les responsables</option>
          {project.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span className="muted">
          {filtered.length} action{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="card table-wrap">
        {filtered.length === 0 ? (
          <div className="empty">
            <p>Aucune action pour le moment.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus /> Créer la première action
            </button>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Action</th>
                <th>Responsable</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="cell-title">{a.title}</div>
                    {a.description && <div className="cell-sub">{a.description}</div>}
                  </td>
                  <td>{memberName(project, a.responsibleId)}</td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => void setActionStatus(a.id, e.target.value as ActionStatus)}
                      style={{ width: 'auto' }}
                      aria-label={`Statut de ${a.title}`}
                    >
                      {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {isOverdue(a.dueDate, a.status) ? (
                      <span className="danger-text">{formatDate(a.dueDate)}</span>
                    ) : (
                      formatDate(a.dueDate)
                    )}
                  </td>
                  <td>
                    {a.amdecId ? (
                      <span title={amdecLabel(a.amdecId)}>
                        <SourceBadge amdec />
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
                      onClick={() => remove(a)}
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

      {creating && <ActionFormModal project={project} onClose={() => setCreating(false)} />}
      {editing && (
        <ActionFormModal project={project} action={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
