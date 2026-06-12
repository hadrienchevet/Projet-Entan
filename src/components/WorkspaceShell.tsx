'use client';

import type { ReactNode } from 'react';
import { WorkspaceProvider, useWorkspace } from '@/lib/store';
import { Layout } from './Layout';
import { Onboarding } from './Onboarding';

/**
 * Coquille de l'espace de travail :
 * chargement -> onboarding si aucun projet -> sinon layout + module courant.
 */
function Shell({ children }: { children: ReactNode }) {
  const { loading, projects } = useWorkspace();

  if (loading && projects.length === 0) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Chargement de vos projets...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="app">
        <main className="main">
          <Onboarding />
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
