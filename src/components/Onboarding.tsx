'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/store';
import { ProjectFormModal } from './ProjectFormModal';

/** Écran d'accueil affiché tant qu'aucun projet n'existe. */
export function Onboarding() {
  const { seedDemoProject, userEmail } = useWorkspace();
  const [creating, setCreating] = useState(false);

  return (
    <div className="onboarding">
      <span className="logo-lg">PE</span>
      <h1>Bienvenue dans Projet Entan</h1>
      <p>
        Pilotez vos projets industriels de bout en bout — gestion de projet (RACI, AMDEC, actions,
        planning) ou résolution de problèmes en 7 phases — en équipe et en temps réel.
      </p>
      <div className="onboarding-actions">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          Créer mon premier projet
        </button>
        <button className="btn" onClick={() => void seedDemoProject()}>
          Explorer avec un projet de démo
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Connecté en tant que {userEmail}. Pour rejoindre un projet existant, ouvrez le lien
        d&apos;invitation qu&apos;on vous a partagé.
      </p>
      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}
