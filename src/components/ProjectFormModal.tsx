'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { useWorkspace } from '@/lib/store';
import type { Project } from '@/lib/types';

interface Props {
  project?: Project;
  onClose: () => void;
}

export function ProjectFormModal({ project, onClose }: Props) {
  const { createProject, updateProject } = useWorkspace();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [error, setError] = useState('');

  const isNew = !project;

  const submit = () => {
    if (!name.trim()) {
      setError('Le nom du projet est obligatoire.');
      return;
    }
    if (project) {
      void updateProject(project.id, { name: name.trim(), description: description.trim() || undefined });
    } else {
      void createProject(name.trim(), description.trim() || undefined);
    }
    onClose();
  };

  return (
    <Modal
      title={project ? 'Modifier le projet' : 'Nouveau projet'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit}>
            {project ? 'Enregistrer' : 'Créer le projet'}
          </button>
        </>
      }
    >
      {isNew && (
        <p className="form-hint" style={{ marginBottom: 14 }}>
          Vous choisirez ensuite les outils du projet (RACI, AMDEC, planning, résolution de
          problèmes…) depuis la page Outils — rien n’est figé à la création.
        </p>
      )}

      <div className="field">
        <label>Nom du projet <span className="req">*</span></label>
        <input
          type="text" value={name} autoFocus
          placeholder="Ex. Ligne d'assemblage A3"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          value={description}
          placeholder="Objectif, périmètre…"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
