'use client';

import type { ReactNode } from 'react';
import { WorkspaceProvider, useWorkspace } from '@/lib/store';
import { Layout } from './Layout';
import { BillingPage } from '@/modules/billing/BillingPage';

/**
 * Coquille de l'espace de travail : chargement -> layout + page courante.
 * Aucun projet n'est plus imposé : la destination par défaut après connexion
 * est /projets (« Mes projets »), qui accueille aussi bien un compte tout
 * neuf (état vide + CTA) qu'un compte avec des projets (grille habituelle).
 */
function Shell({ children }: { children: ReactNode }) {
  const { loading, projects, needsSeat } = useWorkspace();

  if (loading && projects.length === 0 && !needsSeat) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Chargement de vos projets...</p>
      </div>
    );
  }

  // Pas de siège (pas de clé) → écran d'activation par clé.
  if (needsSeat) {
    return (
      <div className="app">
        <main className="main">
          <BillingPage />
        </main>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
