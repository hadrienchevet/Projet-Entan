'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCurrentProject, useWorkspace } from '@/lib/store';
import { ProjectFormModal } from './ProjectFormModal';
import { UpgradePrompt } from './UpgradePrompt';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsPanel';
import {
  IconA3,
  IconActions,
  IconAmdec,
  IconBulb,
  IconCapa,
  IconCost,
  IconSwot,
  IconDashboard,
  IconFolder,
  IconIshikawa,
  IconLayers,
  IconLogout,
  IconPlanning,
  IconPlus,
  IconRaci,
  IconRevue,
  IconStar,
  IconTarget,
  IconTools,
  IconTree,
  IconUsers,
} from './icons';
import { enabledTools, TOOLS, type ToolId } from '@/lib/tools';
import type { ReactElement } from 'react';

/** Icône par outil de gestion (le catalogue tools.ts ne porte pas de JSX). */
const TOOL_ICON: Record<ToolId, ReactElement> = {
  raci: <IconRaci />,
  amdec: <IconAmdec />,
  actions: <IconActions />,
  planning: <IconPlanning />,
  revue: <IconRevue />,
  liens: <IconTree />,
  couts: <IconCost />,
  a3: <IconA3 />,
  swot: <IconSwot />,
};

/** Nav gestion = Dashboard + outils activés + Outils. (Accès = réglage du projet, hors nav.) */
function navGestion(tools: ToolId[] | null | undefined) {
  return [
    { to: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    ...enabledTools(tools).map((id) => ({ to: TOOLS[id].href, label: TOOLS[id].label, icon: TOOL_ICON[id] })),
    { to: '/outils', label: 'Outils', icon: <IconTools /> },
  ];
}

const NAV_RDP = [
  { to: '/dashboard', label: 'Tableau de bord', icon: <IconDashboard /> },
  { to: '/sujet', label: '0 · Sujet', icon: <IconStar /> },
  { to: '/probleme', label: '1 · Problème', icon: <IconTarget /> },
  { to: '/ishikawa', label: '2 · Causes', icon: <IconIshikawa /> },
  { to: '/solutions', label: '3-4 · Solutions', icon: <IconBulb /> },
  { to: '/capa', label: '5 · Mise en œuvre', icon: <IconCapa /> },
  { to: '/standardisation', label: '6 · Standardiser', icon: <IconLayers /> },
  { to: '/liens', label: 'Liens', icon: <IconTree /> },
];

export function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { projects, currentProjectId, setCurrentProject, userEmail, company, trialEndsAt, isFounder } =
    useWorkspace();
  const currentProject = useCurrentProject();
  const [creating, setCreating] = useState(false);
  const nav = currentProject?.projectType === 'rdp' ? NAV_RDP : navGestion(currentProject?.tools);

  // Aucun projet courant → on masque la nav d'outils (elle mène à des pages
  // vides) et on met en avant la création de projet. Les pages hors-projet
  // (mes projets, compte, organisation, abonnement, aide) restent accessibles.
  const hasProject = !!currentProject;
  const PROJECT_OPTIONAL_ROUTES = ['/projets', '/compte', '/equipe', '/abonnement', '/help'];
  const showEmptyState = !hasProject && !PROJECT_OPTIONAL_ROUTES.includes(pathname);

  // Essai gratuit en cours → bandeau « J-X » (null si accès par clé/entreprise).
  const trialDaysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / 86_400_000)
    : null;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Image src="/entan-logo-t.png" alt="" width={24} height={24} />
          Projet Entan
        </div>

        {hasProject ? (
          <>
            <div className="project-switcher">
              <label>Projet</label>
              <select
                value={currentProjectId ?? ''}
                onChange={(e) => setCurrentProject(e.target.value)}
                aria-label="Changer de projet"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>
                <IconPlus /> Nouveau projet
              </button>
              <Link
                href="/projets"
                className={`btn btn-ghost btn-sm${pathname === '/projets' ? ' active' : ''}`}
              >
                <IconFolder /> Tous les projets
              </Link>
              <Link
                href="/access"
                className={`btn btn-ghost btn-sm${pathname === '/access' ? ' active' : ''}`}
              >
                <IconUsers /> Accès au projet
              </Link>
            </div>

            <nav className="nav">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`nav-link${pathname === item.to ? ' active' : ''}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </>
        ) : (
          <div className="project-switcher">
            <button
              className="btn btn-primary"
              onClick={() => setCreating(true)}
              style={{ justifyContent: 'center' }}
            >
              <IconPlus /> Nouveau projet
            </button>
            <Link
              href="/projets"
              className={`btn btn-ghost btn-sm${pathname === '/projets' ? ' active' : ''}`}
            >
              <IconFolder /> Tous les projets
            </Link>
          </div>
        )}

        <div className="sidebar-footer">
          <Link href="/equipe" className={`nav-link${pathname === '/equipe' ? ' active' : ''}`}>
            <IconUsers />
            Organisation
          </Link>
          <Link
            href="/abonnement"
            className={`nav-link${pathname === '/abonnement' ? ' active' : ''}`}
            style={{ marginBottom: 6 }}
          >
            <IconStar />
            Abonnement{company?.isComp ? ' · Offert' : ''}
          </Link>
          <Link
            href="/compte"
            className={`sidebar-user${pathname === '/compte' ? ' active' : ''}`}
            title={userEmail ?? undefined}
          >
            {userEmail ?? '...'}
          </Link>
          <div className="sidebar-footer-row" style={{ alignItems: 'center' }}>
            <form action="/auth/signout" method="post" style={{ flex: 1 }}>
              <button type="submit" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                <IconLogout /> Déconnexion
              </button>
            </form>
            <NotificationsBell />
            <ThemeToggle />
            <Link 
              href="/help" 
              className={`icon-btn${pathname === '/help' ? ' active' : ''}`}
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'grid',
                placeItems: 'center',
                textDecoration: 'none',
                marginLeft: '4px'
              }}
              title="Aide & Tutoriel"
            >
              <span style={{ fontWeight: '700', fontSize: '14px' }}>?</span>
            </Link>
          </div>
        </div>
      </aside>

      <main className="main">
        {isFounder ? (
          <div className="trial-banner founder">
            <span>
              <IconStar />
              Accès fondateur · offert — merci de faire partie des premiers.
            </span>
          </div>
        ) : (
          trialDaysLeft !== null &&
          trialDaysLeft >= 0 && (
            <div className="trial-banner">
              <span>
                <IconStar />
                Essai gratuit —{' '}
                {trialDaysLeft <= 0
                  ? 'dernier jour'
                  : `${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}`}
              </span>
              <Link href="/abonnement" className="btn btn-sm">Activer mon siège</Link>
            </div>
          )
        )}
        {showEmptyState ? (
          <NoProjectEmptyState hasProjects={projects.length > 0} onCreate={() => setCreating(true)} />
        ) : (
          children
        )}
      </main>

      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
      <UpgradePrompt />
    </div>
  );
}

/** Écran d'accueil quand aucun projet n'est ouvert : met en avant la création. */
function NoProjectEmptyState({ hasProjects, onCreate }: { hasProjects: boolean; onCreate: () => void }) {
  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <div className="feature-icon" aria-hidden="true">
          <IconFolder />
        </div>
        <h1>{hasProjects ? 'Aucun projet sélectionné' : 'Créez votre premier projet'}</h1>
        <p>
          {hasProjects
            ? 'Choisissez un projet pour retrouver son planning, ses actions, ses risques et ses revues.'
            : 'Un projet réunit votre planning, vos actions, vos risques et vos revues — tout au même endroit.'}
        </p>
      </div>
      <div className="onboarding-actions">
        <button className="btn btn-primary" onClick={onCreate}>
          <IconPlus /> Nouveau projet
        </button>
        {hasProjects && (
          <Link href="/projets" className="btn">
            Voir mes projets
          </Link>
        )}
      </div>
    </div>
  );
}



