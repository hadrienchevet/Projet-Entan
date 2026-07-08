'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/store';
import type { Project, ProjectMeta } from '@/lib/types';
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '@/lib/types';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import { IconCheck, IconEdit, IconPlus, IconTrash } from '@/components/icons';

/**
 * Mes projets — vue d'ensemble de tous les projets de l'utilisateur :
 * statut (en cours / terminé), bascule de statut, ouverture, édition et
 * suppression (réservée à l'owner, cascade en base).
 */

export function ProjetsPage() {
  const router = useRouter();
  const { metas, currentProjectId, userId, setCurrentProject, updateProject, deleteProject } =
    useWorkspace();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProjectMeta | null>(null);

  const open = (meta: ProjectMeta) => {
    setCurrentProject(meta.id);
    router.push('/dashboard');
  };

  const toggleStatus = (meta: ProjectMeta) => {
    void updateProject(meta.id, {
      status: meta.status === 'completed' ? 'active' : 'completed',
    });
  };

  const remove = (meta: ProjectMeta) => {
    if (
      window.confirm(
        `Supprimer définitivement le projet « ${meta.name} » ?\n` +
          'Toutes ses données (équipe, actions, analyses, phases RDP…) seront supprimées.',
      )
    ) {
      void deleteProject(meta.id);
    }
  };

  const active = metas.filter((m) => m.status !== 'completed');
  const completed = metas.filter((m) => m.status === 'completed');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mes projets</h1>
          <p className="subtitle">
            {metas.length} projet{metas.length > 1 ? 's' : ''} — {active.length} en cours,{' '}
            {completed.length} terminé{completed.length > 1 ? 's' : ''}.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Nouveau projet
        </button>
      </div>

      <div className="projects-grid">
        {metas.map((meta) => {
          const isOwner = meta.ownerId === userId;
          const isCurrent = meta.id === currentProjectId;
          const done = meta.status === 'completed';
          const memberCount = meta.project_members?.length ?? 1;
          return (
            <div key={meta.id} className={`card project-card${done ? ' is-done' : ''}`}>
              <div className="project-card-top">
                <span className="tree-kind">{PROJECT_TYPE_LABELS[meta.projectType]}</span>
                <span className={`badge status-${done ? 'completed' : 'active'}`}>
                  {done && <IconCheck />}
                  {PROJECT_STATUS_LABELS[meta.status]}
                </span>
              </div>

              <button className="project-card-name" onClick={() => open(meta)} title="Ouvrir le projet">
                {meta.name}
              </button>
              {meta.description ? (
                <p className="project-card-desc">{meta.description}</p>
              ) : (
                <p className="project-card-desc muted">Aucune description.</p>
              )}

              <div className="project-card-meta">
                {meta.projectType === 'rdp' && <span>Phase {meta.rdpCurrentPhase}/6</span>}
                <span>
                  {memberCount} compte{memberCount > 1 ? 's' : ''}
                </span>
                <span>créé le {new Date(meta.createdAt).toLocaleDateString('fr-FR')}</span>
                {isCurrent && <span className="badge source">ouvert</span>}
              </div>

              <div className="project-card-actions">
                <button className="btn btn-sm" onClick={() => open(meta)}>
                  Ouvrir
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => toggleStatus(meta)}
                  title={done ? 'Repasser le projet en cours' : 'Marquer le projet comme terminé'}
                >
                  {done ? 'Reprendre' : 'Terminer'}
                </button>
                <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
                  <button className="icon-btn" onClick={() => setEditing(meta)} aria-label="Modifier">
                    <IconEdit />
                  </button>
                  {isOwner && (
                    <button
                      className="icon-btn danger"
                      onClick={() => remove(meta)}
                      aria-label="Supprimer"
                    >
                      <IconTrash />
                    </button>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
      {editing && (
        <ProjectFormModal
          project={{ ...editing, members: [] } satisfies Project}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
