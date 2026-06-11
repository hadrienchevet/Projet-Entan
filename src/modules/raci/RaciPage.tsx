'use client';

import { useState } from 'react';
import { memberName, useCurrentProject, useProjectActions, useWorkspace } from '@/lib/store';
import type { Action, Id, Member, RaciRole } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';

/** Rôle RACI du membre sur une action (vue dérivée de l'action). */
function roleOf(action: Action, memberId: Id): RaciRole | '' {
  if (action.responsibleId === memberId) return 'R';
  if (action.accountableId === memberId) return 'A';
  if (action.consultedIds.includes(memberId)) return 'C';
  if (action.informedIds.includes(memberId)) return 'I';
  return '';
}

export function RaciPage() {
  const project = useCurrentProject();
  const actions = useProjectActions(project?.id);
  const { setRaciRole, removeMember, invitations, createInvitation, revokeInvitation } =
    useWorkspace();

  const [memberModal, setMemberModal] = useState<{ member?: Member } | null>(null);
  const [copiedId, setCopiedId] = useState<Id | null>(null);

  if (!project) return null;

  const onCellChange = (actionId: Id, memberId: Id, value: string) => {
    const result = setRaciRole(actionId, memberId, (value || null) as RaciRole | null);
    if (!result.ok) window.alert(result.error);
  };

  const onRemoveMember = (member: Member) => {
    const extra = member.userId
      ? ' Son compte perdra aussi l’accès au projet.'
      : '';
    if (!window.confirm(`Retirer ${member.name} de l'équipe ?${extra}`)) return;
    const result = removeMember(project.id, member.id);
    if (!result.ok) window.alert(result.error);
  };

  const responsibleCount = (memberId: Id) =>
    actions.filter((a) => a.responsibleId === memberId).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>RACI</h1>
          <p className="subtitle">
            Équipe du projet et matrice des responsabilités sur les actions.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setMemberModal({})}>
          <IconPlus /> Ajouter un membre
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Équipe ({project.members.length})</h2>
        </div>
        {project.members.length === 0 ? (
          <div className="empty">
            <p>
              Aucun membre pour le moment. L&apos;équipe est la source unique des responsables
              d&apos;actions.
            </p>
            <button className="btn btn-primary" onClick={() => setMemberModal({})}>
              <IconPlus /> Ajouter le premier membre
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Fonction</th>
                  <th>Compte</th>
                  <th>Actions en responsabilité</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {project.members.map((m) => (
                  <tr key={m.id}>
                    <td className="cell-title">{m.name}</td>
                    <td>{m.role || <span className="muted">—</span>}</td>
                    <td>
                      {m.userId ? (
                        <span className="badge source" title="Ce membre a un compte et collabore en ligne">
                          connecté
                        </span>
                      ) : (
                        <span className="muted" title="Membre ajouté à la main, sans compte">
                          —
                        </span>
                      )}
                    </td>
                    <td>{responsibleCount(m.id)}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn"
                        onClick={() => setMemberModal({ member: m })}
                        aria-label="Modifier"
                      >
                        <IconEdit />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => onRemoveMember(m)}
                        aria-label="Retirer"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Matrice RACI</h2>
          <div className="legend">
            <span>
              <b>R</b> Responsible (réalise — obligatoire, unique)
            </span>
            <span>
              <b>A</b> Accountable (rend des comptes)
            </span>
            <span>
              <b>C</b> Consulted
            </span>
            <span>
              <b>I</b> Informed
            </span>
          </div>
        </div>
        {actions.length === 0 || project.members.length === 0 ? (
          <div className="empty">
            <p>
              La matrice croise les actions et les membres : créez des membres et des actions pour
              la remplir.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Action</th>
                  {project.members.map((m) => (
                    <th key={m.id} title={m.role}>
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="cell-title">{a.title}</div>
                      <div className="cell-sub">R : {memberName(project, a.responsibleId)}</div>
                    </td>
                    {project.members.map((m) => {
                      const role = roleOf(a, m.id);
                      return (
                        <td key={m.id}>
                          <select
                            className={`raci-select ${role.toLowerCase()}`}
                            value={role}
                            onChange={(e) => onCellChange(a.id, m.id, e.target.value)}
                            aria-label={`Rôle de ${m.name} sur ${a.title}`}
                          >
                            <option value="">—</option>
                            <option value="R">R</option>
                            <option value="A">A</option>
                            <option value="C">C</option>
                            <option value="I">I</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {memberModal && (
        <MemberFormModal
          projectId={project.id}
          member={memberModal.member}
          onClose={() => setMemberModal(null)}
        />
      )}
    </div>
  );
}

function MemberFormModal({
  projectId,
  member,
  onClose,
}: {
  projectId: Id;
  member?: Member;
  onClose: () => void;
}) {
  const project = useCurrentProject();
  const { addMember, updateMember } = useWorkspace();
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState(member?.role ?? '');
  const [userId, setUserId] = useState(member?.userId ?? '');
  const [error, setError] = useState('');

  // Liste des utilisateurs du projet qui n'ont pas encore de membre RACI lié
  // (sauf celui qu'on est en train d'éditer).
  const availableUsers =
    project?.project_members?.filter(
      (pm) => !project.members.some((m) => m.userId === pm.userId) || pm.userId === member?.userId,
    ) || [];

  const onUserChange = (id: string) => {
    setUserId(id);
    if (id) {
      const pm = availableUsers.find((u) => u.userId === id);
      if (pm && !name) setName(pm.profile?.displayName || pm.profile?.email || '');
    }
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    const input = {
      name: name.trim(),
      role: role.trim(),
      userId: userId || undefined,
    };
    if (member) {
      void updateMember(projectId, member.id, input);
    } else {
      void addMember(projectId, input);
    }
    onClose();
  };

  return (
    <Modal
      title={member ? 'Modifier le membre' : 'Ajouter un membre'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {member ? 'Enregistrer' : 'Ajouter'}
          </button>
        </>
      }
    >
      <div className="field">
        <label>Lier à un compte utilisateur (optionnel)</label>
        <select value={userId} onChange={(e) => onUserChange(e.target.value)}>
          <option value="">— Membre sans compte (ex. prestataire, atelier) —</option>
          {availableUsers.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.profile?.displayName || u.profile?.email} ({u.profile?.email})
            </option>
          ))}
        </select>
        <p className="form-hint">
          Lier un compte permet à l&apos;utilisateur de recevoir des notifications (à venir).
        </p>
      </div>
      <div className="field">
        <label>
          Nom affiché dans le RACI <span className="req">*</span>
        </label>
        <input
          type="text"
          value={name}
          autoFocus
          placeholder="Ex. Claire Dubois"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="field">
        <label>Fonction</label>
        <input
          type="text"
          value={role}
          placeholder="Ex. Chef de projet, Qualité…"
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
