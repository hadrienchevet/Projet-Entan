'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { useWorkspace } from '@/lib/store';
import type { Project, ProjectType } from '@/lib/types';

interface Props {
  project?: Project;
  onClose: () => void;
}

export function ProjectFormModal({ project, onClose }: Props) {
  const { createProject, updateProject } = useWorkspace();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [projectType, setProjectType] = useState<ProjectType>(project?.projectType ?? 'gestion');
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
      void createProject(name.trim(), description.trim() || undefined, projectType);
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
        <div className="field">
          <label>Type de projet</label>
          <div className="project-type-selector">
            {([
              { value: 'gestion' as ProjectType, title: 'Gestion de projet', desc: 'RACI, AMDEC, actions et planning' },
              { value: 'rdp' as ProjectType, title: 'Résolution de problèmes', desc: '5 Pourquoi, Ishikawa 6M, CAPA' },
            ] as const).map(({ value, title, desc }) => (
              <label key={value} className={`type-option${projectType === value ? ' selected' : ''}`}>
                <input type="radio" name="project-type" value={value}
                  checked={projectType === value} onChange={() => setProjectType(value)} />
                <div className="type-option-body">
                  <span className="type-option-title">{title}</span>
                  <span className="type-option-desc">{desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>Nom du projet <span className="req">*</span></label>
        <input
          type="text" value={name} autoFocus
          placeholder={projectType === 'rdp' ? "Ex. Arrêt ligne A3 — juin 2026" : "Ex. Ligne d'assemblage A3"}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          value={description}
          placeholder={projectType === 'rdp' ? 'Énoncé du problème à résoudre…' : 'Objectif, périmètre…'}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
