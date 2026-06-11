'use client';

import { useCurrentProject, useWorkspace } from '@/lib/store';
import { IconTrash } from '@/components/icons';

export default function AccessPage() {
  const project = useCurrentProject();
  const { removeProjectMember } = useWorkspace();

  if (!project) return null;

  const onRemoveMember = (userId: string, name: string) => {
    if (userId === project.ownerId) return;
    if (!window.confirm(`Retirer l'accès de ${name} au projet ?`)) return;
    void removeProjectMember(project.id, userId);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Accès au projet</h1>
          <p className="subtitle">
            Liste des utilisateurs ayant un compte et pouvant consulter ce projet.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Utilisateurs connectés ({project.project_members?.length || 0})</h2>
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
