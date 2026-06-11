import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ProjectFormModal } from '../../components/ProjectFormModal';

/** Écran d'accueil affiché tant qu'aucun projet n'existe. */
export function Onboarding() {
  const seedDemoProject = useStore((s) => s.seedDemoProject);
  const [creating, setCreating] = useState(false);

  return (
    <div className="onboarding">
      <span className="logo-lg">PO</span>
      <h1>Bienvenue dans Project Ops Hub</h1>
      <p>
        Pilotez vos projets industriels de bout en bout : responsabilités (RACI), risques (AMDEC),
        actions et planning — quatre modules connectés autour des mêmes données.
      </p>
      <div className="onboarding-actions">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          Créer mon premier projet
        </button>
        <button className="btn" onClick={seedDemoProject}>
          Explorer avec un projet de démo
        </button>
      </div>
      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}
