'use client';

import { useState } from 'react';
import Link from 'next/link';
import { memberName, useCurrentProject, useRdpActions, useRdpSolutions, useWorkspace } from '@/lib/store';
import type { Action, CapaType } from '@/lib/types';
import { CAPA_TYPE_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { StatusBadge } from '@/components/Badges';
import { ActionFormModal } from '@/modules/actions/ActionFormModal';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';

type Filter = 'all' | CapaType;

/**
 * Plan d'action PDCA — phase 5 (mise en œuvre) ou phase 6 (standardisation).
 *
 * Depuis fix-33 ces actions ne vivent plus dans `capa_actions` : ce sont de
 * VRAIES actions du projet, marquées `rdpId`/`rdpPhase`. Elles apparaissent
 * donc d'elles-mêmes dans le Gantt, le dashboard, la revue, « Mes actions » et
 * le compte-rendu — sans ressaisie. Le formulaire est celui du module Actions,
 * enrichi des deux champs propres à la méthode CAPA.
 */
export function CapaPage({ rdpId, phase = 5 }: { rdpId: string; phase?: 5 | 6 }) {
  const project = useCurrentProject();
  const actions = useRdpActions(rdpId, phase);
  const solutions = useRdpSolutions(rdpId);
  const { addAction, deleteAction } = useWorkspace();

  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Action | null>(null);

  if (!project) return null;

  const visible = filter === 'all' ? actions : actions.filter((a) => (a.capaType ?? 'corrective') === filter);
  const rank = (a: Action) => (a.status === 'todo' ? 0 : a.status === 'in_progress' ? 1 : a.capaVerified ? 3 : 2);
  const sorted = [...visible].sort(
    (a, b) => rank(a) - rank(b) || (a.dueDate ?? '').localeCompare(b.dueDate ?? ''),
  );

  /* Solutions retenues qui n'ont pas encore d'action : la re-saisie évitée. */
  const linked = new Set(actions.map((a) => a.title));
  const pending = solutions.filter((s) => s.retained && !linked.has(s.title));

  /* Une action doit avoir un responsable (règle RACI) : on en pose un par
     défaut, mais jamais en silence — assigner du travail à quelqu'un sans le
     dire serait pire que la re-saisie qu'on cherche à éviter. */
  const createFromSolutions = () => {
    const fallback = project.members[0];
    if (!fallback) return;
    const ok = window.confirm(
      `Créer ${pending.length} action(s) depuis les solutions retenues ?

` +
        `Elles seront assignées à ${fallback.name} par défaut — à réattribuer ensuite.`,
    );
    if (!ok) return;
    const responsibleId = fallback.id;
    for (const s of pending) {
      void addAction(project.id, {
        title: s.title,
        description: s.description,
        responsibleId,
        consultedIds: [],
        informedIds: [],
        status: 'todo',
        rdpId,
        rdpPhase: phase,
        capaType: 'corrective',
      });
    }
  };

  return (
    <>
      <div className="header-actions" style={{ justifyContent: 'flex-end', marginBottom: 14 }}>
        {phase === 5 && pending.length > 0 && project.members.length > 0 && (
          <button className="btn" onClick={createFromSolutions}>
            <IconPlus /> Créer depuis les {pending.length} solution(s) retenue(s)
          </button>
        )}
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Nouvelle action
        </button>
      </div>

      <p className="form-hint" style={{ marginBottom: 12 }}>
        Ces actions sont celles du projet : elles apparaissent aussi dans le{' '}
        <Link className="link" href="/planning">
          planning
        </Link>{' '}
        et dans{' '}
        <Link className="link" href="/actions">
          le plan d’action
        </Link>
        , et reviennent en revue.
      </p>

      <div className="filters">
        {(['all', 'corrective', 'preventive'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Toutes' : CAPA_TYPE_LABELS[f]}
            <span className="filter-count">
              {f === 'all'
                ? actions.length
                : actions.filter((a) => (a.capaType ?? 'corrective') === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        {sorted.length === 0 ? (
          <div className="empty">
            <p>Aucune action{filter !== 'all' ? ' pour ce filtre' : ''}.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus /> Créer la première action
            </button>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Nature</th>
                <th>Responsable</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id}>
                  <td className="cell-title">{a.title}</td>
                  <td>
                    <span className="badge source">{CAPA_TYPE_LABELS[a.capaType ?? 'corrective']}</span>
                  </td>
                  <td>{memberName(project, a.responsibleId)}</td>
                  <td>
                    <StatusBadge status={a.status} />
                    {a.capaVerified && (
                      <span className="badge done" style={{ marginLeft: 6 }}>
                        Vérifiée
                      </span>
                    )}
                  </td>
                  <td>{a.dueDate ? formatDate(a.dueDate) : <span className="muted">—</span>}</td>
                  <td className="actions-cell">
                    <button className="icon-btn" onClick={() => setEditing(a)} aria-label="Modifier">
                      <IconEdit />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => {
                        if (window.confirm(`Supprimer l'action "${a.title}" ?`)) void deleteAction(a.id);
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

      {project.members.length === 0 && (
        <p className="form-hint" style={{ marginTop: 12 }}>
          Ajoutez d’abord des membres à l’équipe (RACI ou Accès) : une action doit avoir un
          responsable.
        </p>
      )}

      {creating && (
        <ActionFormModal
          project={project}
          rdpId={rdpId}
          rdpPhase={phase}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <ActionFormModal project={project} action={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
