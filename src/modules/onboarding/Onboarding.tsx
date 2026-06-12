import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ProjectFormModal } from '../../components/ProjectFormModal';
import { IconRaci, IconAmdec, IconActions, IconPlanning } from '../../components/icons';

/** Écran d'accueil affiché tant qu'aucun projet n'existe. */
export function Onboarding() {
  const seedDemoProject = useStore((s) => s.seedDemoProject);
  const [creating, setCreating] = useState(false);

  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <span className="logo-lg">PO</span>
        <h1>Bienvenue dans Project Ops Hub</h1>
        <p>
          L'outil tout-en-un pour le pilotage technique de vos projets industriels.
          Centralisez vos données pour une vision claire et une exécution sans faille.
        </p>
      </div>

      <div className="onboarding-features">
        <div className="feature-card">
          <div className="feature-icon"><IconRaci /></div>
          <h3>RACI</h3>
          <p>Gérez votre équipe et les responsabilités.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><IconAmdec /></div>
          <h3>AMDEC</h3>
          <p>Anticipez et réduisez les risques techniques.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><IconActions /></div>
          <h3>Actions</h3>
          <p>Pilotez le plan d'action en temps réel.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><IconPlanning /></div>
          <h3>Planning</h3>
          <p>Visualisez l'avancement (Gantt, Calendrier).</p>
        </div>
      </div>

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
