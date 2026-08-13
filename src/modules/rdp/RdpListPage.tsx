'use client';

/**
 * Liste des résolutions de problème d'un projet (fix-32).
 *
 * C'est la page qu'ouvre l'entrée « Résolution de problèmes » de la sidebar.
 * Avant, un projet ENTIER était une RDP ; désormais un projet en contient
 * autant que nécessaire — un problème surgit dans un projet, il n'en est pas un.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentProject, useProjectRdps, useWorkspace } from '@/lib/store';
import { RDP_PHASES, rdpPhaseHref } from '@/lib/rdp';
import { RDP_STATUS_LABELS, type Rdp } from '@/lib/types';
import { IconPlus, IconTrash } from '@/components/icons';

const frDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function RdpListPage() {
  const project = useCurrentProject();
  const rdps = useProjectRdps(project?.id);
  const { addRdp, updateRdp, deleteRdp } = useWorkspace();
  const router = useRouter();
  const [title, setTitle] = useState('');

  if (!project) return null;

  const create = async () => {
    const name = title.trim() || `Résolution #${rdps.length + 1}`;
    const id = await addRdp(project.id, name);
    setTitle('');
    router.push(rdpPhaseHref(id, 'sujet'));
  };

  const remove = (r: Rdp) => {
    if (window.confirm(`Supprimer « ${r.title} » et toute sa démarche (sujets, causes, solutions, plan d’action) ?`))
      void deleteRdp(r.id);
  };

  const open = rdps.filter((r) => r.status === 'en_cours');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Résolutions de problèmes</h1>
          <p className="subtitle">
            La démarche en 7 phases, appliquée aux problèmes rencontrés sur ce projet.
            {rdps.length > 0 && ` ${rdps.length} au total, ${open.length} en cours.`}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <strong>Démarches</strong>
          <span className="row-sub">{rdps.length}</span>
        </div>

        {rdps.length === 0 ? (
          <div className="empty">
            <p>
              Aucune résolution de problème. Créez-en une dès qu’un problème mérite une analyse
              structurée — elle restera rattachée à ce projet.
            </p>
          </div>
        ) : (
          rdps.map((r) => {
            const phase = RDP_PHASES.find((p) => p.num === r.currentPhase) ?? RDP_PHASES[0];
            return (
              <div key={r.id} className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="row-main" style={{ flex: 1 }}>
                  <div className="row-title" style={{ whiteSpace: 'normal' }}>
                    {r.title}
                  </div>
                  <div className="row-sub">
                    Phase {r.currentPhase}/6 — {phase.label} · créée le {frDate(r.createdAt)}
                  </div>
                </div>
                <span className={`badge ${r.status === 'cloturee' ? 'done' : 'in_progress'}`}>
                  {RDP_STATUS_LABELS[r.status]}
                </span>
                <Link className="btn btn-sm" href={rdpPhaseHref(r.id, phase.slug)}>
                  Ouvrir
                </Link>
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    void updateRdp(r.id, { status: r.status === 'cloturee' ? 'en_cours' : 'cloturee' })
                  }
                >
                  {r.status === 'cloturee' ? 'Rouvrir' : 'Clôturer'}
                </button>
                <button className="icon-btn danger" aria-label="Supprimer" onClick={() => remove(r)}>
                  <IconTrash />
                </button>
              </div>
            );
          })
        )}

        <div className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Intitulé du problème à résoudre…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void create()}
            style={{ flex: '1 1 260px', width: 'auto' }}
          />
          <button className="btn btn-sm btn-primary" onClick={() => void create()}>
            <IconPlus /> Nouvelle résolution
          </button>
        </div>
      </div>
    </div>
  );
}
