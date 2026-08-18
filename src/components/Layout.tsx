'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCurrentProject, useWorkspace } from '@/lib/store';
import { ProjectFormModal } from './ProjectFormModal';
import { UpgradePrompt } from './UpgradePrompt';
import { NotificationsBell } from './NotificationsPanel';
import { SidebarUserMenu } from './SidebarUserMenu';
import {
  IconA3,
  IconActions,
  IconAmdec,
  IconCost,
  IconSwot,
  IconDashboard,
  IconFolder,
  IconIshikawa,
  IconMenu,
  IconMyActions,
  IconPlanning,
  IconPlus,
  IconRaci,
  IconRevue,
  IconStar,
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
  rdp: <IconIshikawa />,
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

export function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { projects, currentProjectId, setCurrentProject, userEmail, company, trialEndsAt, isFounder } =
    useWorkspace();
  const currentProject = useCurrentProject();
  const [creating, setCreating] = useState(false);
  // Mobile : la sidebar sort du flux et devient un tiroir. Sur un écran de
  // 375 px elle laissait 145 px au contenu, ce qui rend l'app illisible.
  const [navOpen, setNavOpen] = useState(false);
  const nav = navGestion(currentProject?.tools);

  // Refermer le tiroir dès qu'on navigue : sinon on arrive sur la nouvelle page
  // avec le tiroir encore ouvert par-dessus. Ajusté pendant le rendu plutôt que
  // dans un effet — ça capte toute navigation, y compris le bouton retour, sans
  // afficher un état intermédiaire.
  const [pathAtRender, setPathAtRender] = useState(pathname);
  if (pathAtRender !== pathname) {
    setPathAtRender(pathname);
    setNavOpen(false);
  }

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  // Aucun projet courant → on masque la nav d'outils (elle mène à des pages
  // vides) et on met en avant la création de projet. Les pages hors-projet
  // (mes projets, compte, organisation, abonnement, aide) restent accessibles.
  const hasProject = !!currentProject;
  const PROJECT_OPTIONAL_ROUTES = ['/projets', '/compte', '/equipe', '/abonnement', '/help', '/mes-actions'];
  const showEmptyState = !hasProject && !PROJECT_OPTIONAL_ROUTES.includes(pathname);

  // Essai gratuit en cours → bandeau « J-X » (null si accès par clé/entreprise).
  const trialDaysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / 86_400_000)
    : null;

  return (
    <div className="app">
      {/* Barre mobile : masquée en CSS au-dessus du point de rupture. */}
      <header className="topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setNavOpen(true)}
          aria-label="Ouvrir la navigation"
          aria-expanded={navOpen}
        >
          <IconMenu />
        </button>
        <span className="topbar-title">{currentProject?.name ?? 'ENTAN'}</span>
        <NotificationsBell />
      </header>

      {navOpen && (
        <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />
      )}

      <aside className={`sidebar${navOpen ? ' nav-open' : ''}`}>
        <div className="sidebar-brand">
          <Image src="/entan-logo-t.png" alt="" width={24} height={24} />
          ENTAN
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
          <Link href="/mes-actions" className={`nav-link${pathname === '/mes-actions' ? ' active' : ''}`}>
            <IconMyActions />
            Mes actions
          </Link>
          {/* Compte, organisation, abonnement, aide, thème et déconnexion sont
              regroupés dans le menu utilisateur : la sidebar ne montre en
              permanence que la navigation.
              Les notifications restent en dehors — leur pastille doit se voir
              sans ouvrir quoi que ce soit. Le composant se masque de lui-même
              hors projet, et le déclencheur occupe alors toute la ligne. */}
          <div className="user-menu-row">
            <SidebarUserMenu
              userEmail={userEmail}
              subscriptionNote={company?.isComp ? 'Offert' : undefined}
            />
            <NotificationsBell />
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



