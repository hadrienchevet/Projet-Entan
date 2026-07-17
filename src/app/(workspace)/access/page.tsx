'use client';

import { useEffect, useState } from 'react';
import { useCurrentProject, useWorkspace } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { IconTrash } from '@/components/icons';

interface Candidate {
  userId: string;
  email?: string;
  displayName?: string;
}

interface CompanyMemberJoinRow {
  user_id: string;
  profiles: { email?: string; display_name?: string } | null;
}

/**
 * Accès au projet = membres de l'ORGANISATION DU PROJET ayant accès à ce projet.
 *
 * Les candidats viennent du roster de l'organisation PROPRIÉTAIRE DU PROJET
 * (project.companyId), pas de l'organisation « courante » du compte — un compte
 * peut appartenir à plusieurs organisations (cf. MODELE-ORGANISATION.md :
 * organisation perso auto-créée + organisation rejointe par invitation).
 * Utiliser l'organisation courante proposerait des personnes qui n'appartiennent
 * pas forcément à CETTE organisation-là, et l'ajout échouerait côté serveur
 * (trigger enforce_project_member_company).
 */
export default function AccessPage() {
  const project = useCurrentProject();
  const { companyMembers, addProjectMember, removeProjectMember } = useWorkspace();
  const [projectCompanyMembers, setProjectCompanyMembers] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const companyId = project?.companyId;

  useEffect(() => {
    setProjectCompanyMembers(null);
    if (!companyId) return;
    let alive = true;
    const supabase = createClient();
    supabase
      .from('company_members')
      .select('user_id, profiles(email, display_name)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .then(({ data }) => {
        if (!alive) return;
        setProjectCompanyMembers(
          ((data ?? []) as unknown as CompanyMemberJoinRow[]).map((m) => ({
            userId: m.user_id,
            email: m.profiles?.email,
            displayName: m.profiles?.display_name,
          })),
        );
      });
    return () => {
      alive = false;
    };
  }, [companyId]);

  if (!project) return null;

  // Roster à utiliser : celui de l'organisation DU PROJET si elle est connue,
  // sinon (projet solo legacy sans organisation) l'organisation courante du
  // compte en secours — le trigger serveur ne restreint rien dans ce cas.
  const roster: Candidate[] = companyId
    ? (projectCompanyMembers ?? [])
    : companyMembers.map((m) => ({ userId: m.userId, email: m.email, displayName: m.displayName }));

  const memberIds = new Set((project.project_members ?? []).map((pm) => pm.userId));
  const candidates = roster.filter((m) => !memberIds.has(m.userId));
  const loadingCandidates = Boolean(companyId) && projectCompanyMembers === null;

  const add = async () => {
    if (!selected) return;
    setError('');
    setPending(true);
    const r = await addProjectMember(project.id, selected);
    setPending(false);
    if (!r.ok) {
      setError(
        r.error.includes('user_not_in_company')
          ? 'Cette personne n’est pas (ou plus) dans l’organisation de ce projet.'
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
          <p className="subtitle">Donnez accès à ce projet aux membres de son organisation.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2>Ajouter un membre de l’organisation</h2>
          {loadingCandidates ? (
            <p className="muted" style={{ marginTop: 8 }}>
              Chargement des membres…
            </p>
          ) : candidates.length === 0 ? (
            <p className="muted" style={{ marginTop: 8 }}>
              Tous les membres de l’organisation ont déjà accès. Pour inviter une nouvelle personne,
              rendez-vous dans <strong>Organisation</strong>.
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
            Pour inviter une nouvelle personne (= occuper un siège), allez dans <strong>Organisation</strong>.
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
