'use client';

import { useState } from 'react';
import { useCurrentProject, useWorkspace } from '@/lib/store';
import { IconTrash } from '@/components/icons';

/**
 * Accès au projet = membres de l'ENTREPRISE ayant accès à ce projet.
 * On ajoute des personnes déjà dans l'entreprise (= des sièges). Pour inviter
 * une nouvelle personne, ça se passe dans Équipe.
 */
export default function AccessPage() {
  const project = useCurrentProject();
  const { companyMembers, addProjectMember, removeProjectMember } = useWorkspace();
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (!project) return null;

  const memberIds = new Set((project.project_members ?? []).map((pm) => pm.userId));
  const candidates = companyMembers.filter((m) => m.status === 'active' && !memberIds.has(m.userId));

  const add = async () => {
    if (!selected) return;
    setError('');
    setPending(true);
    const r = await addProjectMember(project.id, selected);
    setPending(false);
    if (!r.ok) {
      setError(
        r.error.includes('user_not_in_company')
          ? 'Cette personne n’est pas (ou plus) dans l’entreprise.'
          : r.error,
      );
    } else {
      setSelected('');
    }
  };

  const onRemove = (userId: string, name: string) => {
    if (userId === project.ownerId) return;
    if (!window.confirm(`Retirer l'accès de ${name} au projet ?`)) return;
    void removeProjectMember(project.id, userId);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Accès au projet</h1>
          <p className="subtitle">Donnez accès à ce projet aux membres de votre entreprise.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2>Ajouter un membre de l’entreprise</h2>
          {candidates.length === 0 ? (
            <p className="muted" style={{ marginTop: 8 }}>
              Tous les membres de l’entreprise ont déjà accès. Pour inviter une nouvelle personne,
              rendez-vous dans <strong>Équipe</strong>.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                style={{ minWidth: 220 }}
              >
                <option value="">Choisir un membre…</option>
                {candidates.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName ? `${m.displayName} — ${m.email}` : m.email}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" disabled={pending || !selected} onClick={add}>
                {pending ? '…' : 'Ajouter au projet'}
              </button>
            </div>
          )}
          {error && (
            <div className="form-error" style={{ marginTop: 8 }}>
              {error}
            </div>
          )}
          <p className="form-hint" style={{ marginTop: 12 }}>
            Pour inviter une nouvelle personne (= occuper un siège), allez dans <strong>Équipe</strong>.
          </p>
        </div>
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
                  <td className="muted">{new Date(pm.joinedAt).toLocaleDateString('fr-FR')}</td>
                  <td style={{ textAlign: 'right' }}>
                    {pm.role !== 'owner' && (
                      <button
                        className="icon-btn danger"
                        onClick={() =>
                          onRemove(pm.userId, pm.profile?.displayName || 'cet utilisateur')
                        }
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
    </div>
  );
}
