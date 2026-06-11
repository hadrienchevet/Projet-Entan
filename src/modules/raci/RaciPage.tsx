import { useState } from 'react';
import { memberName, useCurrentProject, useProjectActions, useStore } from '../../store/useStore';
import type { Action, Id, Member, RaciRole } from '../../types';
import { Modal } from '../../components/Modal';
import { IconEdit, IconPlus, IconTrash } from '../../components/icons';

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
  const setRaciRole = useStore((s) => s.setRaciRole);
  const removeMember = useStore((s) => s.removeMember);

  const [memberModal, setMemberModal] = useState<{ member?: Member } | null>(null);

  if (!project) return null;

  const onCellChange = (actionId: Id, memberId: Id, value: string) => {
    const result = setRaciRole(actionId, memberId, (value || null) as RaciRole | null);
    if (!result.ok) window.alert(result.error);
  };

  const onRemoveMember = (member: Member) => {
    if (!window.confirm(`Retirer ${member.name} de l'équipe ?`)) return;
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
              Aucun membre pour le moment. L'équipe est la source unique des responsables
              d'actions.
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
                  <th>Actions en responsabilité</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {project.members.map((m) => (
                  <tr key={m.id}>
                    <td className="cell-title">{m.name}</td>
                    <td>{m.role || <span className="muted">—</span>}</td>
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
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState(member?.role ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    if (member) {
      updateMember(projectId, member.id, { name: name.trim(), role: role.trim() });
    } else {
      addMember(projectId, { name: name.trim(), role: role.trim() });
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
        <label>
          Nom <span className="req">*</span>
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
