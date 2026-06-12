'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/store';
import { ProjectFormModal } from './ProjectFormModal';
import { IconRaci, IconAmdec, IconActions, IconPlanning } from './icons';

/** Ã‰cran d'accueil affichÃ© tant qu'aucun projet n'existe. */
export function Onboarding() {
  const { seedDemoProject, userEmail } = useWorkspace();
  const [creating, setCreating] = useState(false);

  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <span className="logo-lg">PE</span>
        <h1>Bienvenue dans Projet Entan</h1>
        <p>
          L'outil tout-en-un pour le pilotage technique de vos projets industriels.
          Centralisez vos donnÃ©es pour une vision claire et une exÃ©cution sans faille.
        </p>
      </div>

      <div className="onboarding-features">
        <div className="feature-card">
          <div className="feature-icon"><IconRaci /></div>
          <h3>RACI</h3>
          <p>GÃ©rez votre Ã©quipe et les responsabilitÃ©s.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><IconAmdec /></div>
          <h3>AMDEC</h3>
          <p>Anticipez et rÃ©duisez les risques techniques.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><IconActions /></div>
          <h3>Actions</h3>
          <p>Pilotez le plan d'action en temps rÃ©el.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><IconPlanning /></div>
          <h3>Planning</h3>
          <p>Visualisez l'avancement (Gantt, Calendrier).</p>
        </div>
      </div>

      <div className="onboarding-actions">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          CrÃ©er mon premier projet
        </button>
        <button className="btn" onClick={() => void seedDemoProject()}>
          Explorer avec un projet de dÃ©mo
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <p className="muted" style={{ fontSize: 12 }}>
          ConnectÃ© en tant que {userEmail}.
        </p>
        <p className="muted" style={{ fontSize: 11, maxWidth: 380 }}>
          Pour rejoindre un projet existant, ouvrez le lien d&apos;invitation qu&apos;on vous a partagÃ©.
        </p>
      </div>

      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}
