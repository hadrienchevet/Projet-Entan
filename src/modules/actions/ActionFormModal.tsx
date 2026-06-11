'use client';

import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useProjectAmdecs, useWorkspace } from '@/lib/store';
import type { Action, ActionInput, ActionStatus, Id, Project } from '@/lib/types';
import { STATUS_LABELS, criticality } from '@/lib/types';

interface Props {
  project: Project;
  /** Action à modifier ; absente = création. */
  action?: Action;
  /** Pré-remplissage (ex. création depuis une analyse AMDEC). */
  defaults?: Partial<ActionInput>;
  onClose: () => void;
}

export function ActionFormModal({ project, action, defaults, onClose }: Props) {
  const { addAction, updateAction } = useWorkspace();
  const amdecs = useProjectAmdecs(project.id);

  const init = { ...defaults, ...action };
  const [title, setTitle] = useState(init.title ?? '');
  const [description, setDescription] = useState(init.description ?? '');
  const [responsibleId, setResponsibleId] = useState<Id>(init.responsibleId ?? '');
  const [accountableId, setAccountableId] = useState<Id>(init.accountableId ?? '');
  const [consultedIds, setConsultedIds] = useState<Id[]>(init.consultedIds ?? []);
  const [informedIds, setInformedIds] = useState<Id[]>(init.informedIds ?? []);
  const [status, setStatus] = useState<ActionStatus>(init.status ?? 'todo');
  const [startDate, setStartDate] = useState(init.startDate ?? '');
  const [dueDate, setDueDate] = useState(init.dueDate ?? '');
  const [amdecId, setAmdecId] = useState<Id>(init.amdecId ?? '');
  const [error, setError] = useState('');

  const toggle = (list: Id[], setList: (v: Id[]) => void, id: Id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const submit = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    if (!responsibleId) {
      setError('Chaque action doit avoir un Responsible (règle RACI).');
      return;
    }
    // Cohérence RACI : un membre n'a qu'un rôle par action.
    // R prime sur tout, A prime sur C/I, C prime sur I.
    const cleanAccountable = accountableId && accountableId !== responsibleId ? accountableId : undefined;
    const cleanConsulted = consultedIds.filter((id) => id !== responsibleId && id !== cleanAccountable);
    const cleanInformed = informedIds.filter(
      (id) => id !== responsibleId && id !== cleanAccountable && !cleanConsulted.includes(id),
    );

    const input: ActionInput = {
      title: title.trim(),
      description: description.trim(),
      responsibleId,
      accountableId: cleanAccountable,
      consultedIds: cleanConsulted,
      informedIds: cleanInformed,
      status,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      amdecId: amdecId || undefined,
    };

    if (action) {
      void updateAction(action.id, input);
    } else {
      void addAction(project.id, input);
    }
    onClose();
  };

  if (project.members.length === 0) {
    return (
      <Modal title="Nouvelle action" onClose={onClose}>
        <p className="muted">
          Ajoutez d&apos;abord des membres à l&apos;équipe (module RACI) : une action doit
          obligatoirement être assignée à un Responsible issu du projet.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title={action ? "Modifier l'action" : 'Nouvelle action'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {action ? 'Enregistrer' : "Créer l'action"}
          </button>
        </>
      }
    >
      <div className="field">
        <label>
          Titre <span className="req">*</span>
        </label>
        <input
          type="text"
          value={title}
          autoFocus
          placeholder="Ex. Plan de maintenance préventive"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label>
            Responsible (R) <span className="req">*</span>
          </label>
          <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)}>
            <option value="">— Choisir un membre —</option>
            {project.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Accountable (A)</label>
          <select value={accountableId} onChange={(e) => setAccountableId(e.target.value)}>
            <option value="">— Aucun —</option>
            {project.members
              .filter((m) => m.id !== responsibleId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>

        <div className="field span-2">
          <label>Consulted (C)</label>
          <div className="checkbox-list">
            {project.members.map((m) => (
              <label key={m.id} className={`chip${consultedIds.includes(m.id) ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={consultedIds.includes(m.id)}
                  onChange={() => toggle(consultedIds, setConsultedIds, m.id)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        <div className="field span-2">
          <label>Informed (I)</label>
          <div className="checkbox-list">
            {project.members.map((m) => (
              <label key={m.id} className={`chip${informedIds.includes(m.id) ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={informedIds.includes(m.id)}
                  onChange={() => toggle(informedIds, setInformedIds, m.id)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ActionStatus)}>
            {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Source AMDEC</label>
          <select value={amdecId} onChange={(e) => setAmdecId(e.target.value)}>
            <option value="">Autre (hors AMDEC)</option>
            {amdecs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.element} — {a.failureMode} (C={criticality(a)})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Date de début</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="field">
          <label>Échéance</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          {!dueDate && (
            <span className="form-warning">
              Fortement recommandée : sans échéance, l&apos;action n&apos;apparaît pas dans le
              calendrier.
            </span>
          )}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
