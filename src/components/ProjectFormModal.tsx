import { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../store/useStore';
import type { Project } from '../types';

interface Props {
  /** Projet à modifier ; absent = création. */
  project?: Project;
  onClose: () => void;
}

export function ProjectFormModal({ project, onClose }: Props) {
  const createProject = useStore((s) => s.createProject);
  const updateProject = useStore((s) => s.updateProject);
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setError('Le nom du projet est obligatoire.');
      return;
    }
    if (project) {
      updateProject(project.id, { name: name.trim(), description: description.trim() || undefined });
    } else {
      createProject(name.trim(), description.trim() || undefined);
    }
    onClose();
  };

  return (
    <Modal
      title={project ? 'Modifier le projet' : 'Nouveau projet'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {project ? 'Enregistrer' : 'Créer le projet'}
          </button>
        </>
      }
    >
      <div className="field">
        <label>
          Nom du projet <span className="req">*</span>
        </label>
        <input
          type="text"
          value={name}
          autoFocus
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
