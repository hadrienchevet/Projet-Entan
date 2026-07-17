'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/store';
import type { Project, ProjectMeta } from '@/lib/types';
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '@/lib/types';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import {
  IconAmdec,
  IconActions,
  IconCheck,
  IconEdit,
  IconPlanning,
  IconPlus,
  IconRaci,
  IconTrash,
} from '@/components/icons';

/**
 * Mes projets — page d'accueil de l'espace de travail (destination par défaut
 * après connexion, cf. /login et /auth/callback) : vue d'ensemble de tous les
 * projets de l'utilisateur (statut, bascule, ouverture, édition, suppression
 * réservée à l'owner), ou accueil de bienvenue tant qu'aucun projet n'existe —
 * sans jamais bloquer l'accès au reste de l'app (sidebar toujours visible).
 */

export function ProjetsPage() {
  const router = useRouter();
  const {
    metas,
    currentProjectId,
    userId,
    userEmail,
    setCurrentProject,
    updateProject,
    deleteProject,
    seedDemoProject,
  } = useWorkspace();
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

  if (metas.length === 0) {
    return (
      <div className="onboarding">
        <div className="onboarding-hero">
          <Image src="/entan-logo-t.png" alt="" width={64} height={64} priority />
          <h1>Bienvenue dans Projet Entan</h1>
          <p>
            L'outil tout-en-un pour le pilotage technique de vos projets industriels.
            Centralisez vos données pour une vision claire et une exécution sans faille.
          </p>
        </div>

        <div className="onboarding-features">
          <div className="feature-card">
            <div className="feature-icon"><IconRaci /></div>
            <h3>RACI</h3>
            <p>Gérez votre équipe et les responsabilités.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><IconAmdec /></div>
            <h3>AMDEC</h3>
            <p>Anticipez et réduisez les risques techniques.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><IconActions /></div>
            <h3>Actions</h3>
            <p>Pilotez le plan d'action en temps réel.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><IconPlanning /></div>
            <h3>Planning</h3>
            <p>Visualisez l'avancement (Gantt, Calendrier).</p>
          </div>
        </div>

        <div className="onboarding-actions">
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <IconPlus /> Créer mon premier projet
          </button>
          <button className="btn" onClick={() => void seedDemoProject()}>
            Explorer avec un projet de démo
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <p className="muted" style={{ fontSize: 12 }}>
            Connecté en tant que {userEmail}.
          </p>
          <p className="muted" style={{ fontSize: 11, maxWidth: 380 }}>
            Pour rejoindre un projet existant, ouvrez le lien d'invitation qu'on vous a partagé.
          </p>
        </div>

        {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
      </div>
    );
  }

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
