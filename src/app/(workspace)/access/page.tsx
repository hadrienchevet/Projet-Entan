'use client';

import { useState } from 'react';
import { useCurrentProject, useWorkspace } from '@/lib/store';
import { IconLink, IconTrash } from '@/components/icons';
import type { Id } from '@/lib/types';

export default function AccessPage() {
  const project = useCurrentProject();
  const { removeProjectMember, invitations, createInvitation, revokeInvitation } = useWorkspace();
  const [copiedId, setCopiedId] = useState<Id | null>(null);

  if (!project) return null;

  const onRemoveMember = (userId: string, name: string) => {
    if (userId === project.ownerId) return;
    if (!window.confirm(`Retirer l'accès de ${name} au projet ?`)) return;
    void removeProjectMember(project.id, userId);
  };

  const copyInvite = async (id: Id, token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Accès au projet</h1>
          <p className="subtitle">
            Gérez les personnes pouvant consulter ce projet et invitez de nouveaux collaborateurs.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>Inviter par lien</h2>
            <span className="muted" style={{ fontSize: 12 }}>
              toute personne ayant le lien peut rejoindre le projet
            </span>
          </div>
          <button className="btn btn-sm" onClick={() => void createInvitation(project.id)}>
            <IconLink /> Générer un lien
          </button>
        </div>
        {invitations.length === 0 ? (
          <div className="empty">
            <p>
              Aucun lien actif. Générez-en un et partagez-le (validité 7 jours).
            </p>
          </div>
        ) : (
          <div className="list">
            {invitations.map((inv) => (
              <div key={inv.id} className="list-row">
                <div className="row-main">
                  <div className="row-title invite-url">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/invite/{inv.token}
                  </div>
                  <div className="row-sub">
                    Expire le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <button className="btn btn-sm" onClick={() => void copyInvite(inv.id, inv.token)}>
                  {copiedId === inv.id ? 'Copié ✓' : 'Copier'}
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => void revokeInvitation(inv.id)}
                  aria-label="Révoquer ce lien"
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2>Utilisateurs ayant accès ({project.project_members?.length || 0})</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Rejoint le</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {project.project_members?.map((pm) => (
                <tr key={pm.userId}>
                  <td>
                    <div className="cell-title">{pm.profile?.displayName || pm.profile?.email}</div>
                    <div className="cell-sub">{pm.profile?.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${pm.role === 'owner' ? 'accent' : ''}`}>
                      {pm.role === 'owner' ? 'Propriétaire' : 'Membre'}
                    </span>
                  </td>
                  <td className="muted">
                    {new Date(pm.joinedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {pm.role !== 'owner' && (
                      <button
                        className="icon-btn danger"
                        onClick={() => onRemoveMember(pm.userId, pm.profile?.displayName || 'cet utilisateur')}
                      >
                        <IconTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2>Note sur le RACI</h2>
        </div>
        <div className="card-body">
          <p className="muted">
            Avoir accès au projet ne signifie pas être dans l&apos;équipe RACI. 
            Pour ajouter une personne à la matrice RACI (responsable d&apos;actions), 
            rendez-vous dans l&apos;onglet <strong>RACI</strong> et ajoutez-la manuellement.
          </p>
        </div>
      </div>
    </div>
  );
}
