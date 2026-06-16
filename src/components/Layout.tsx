'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentProject, useWorkspace } from '@/lib/store';
import { ProjectFormModal } from './ProjectFormModal';
import { ThemeToggle } from './ThemeToggle';
import {
  IconActions,
  IconAmdec,
  IconBulb,
  IconCapa,
  IconCost,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconIshikawa,
  IconLayers,
  IconLogout,
  IconPlanning,
  IconPlus,
  IconRaci,
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
  liens: <IconTree />,
  couts: <IconCost />,
};

/** Nav gestion = Dashboard + outils activés + Outils + Accès. */
function navGestion(tools: ToolId[] | null | undefined) {
  return [
    { to: '/', label: 'Dashboard', icon: <IconDashboard /> },
    ...enabledTools(tools).map((id) => ({ to: TOOLS[id].href, label: TOOLS[id].label, icon: TOOL_ICON[id] })),
    { to: '/outils', label: 'Outils', icon: <IconTools /> },
    { to: '/access', label: 'Accès', icon: <IconUsers /> },
  ];
}

const NAV_RDP = [
  { to: '/', label: 'Tableau de bord', icon: <IconDashboard /> },
  { to: '/sujet', label: '0 · Sujet', icon: <IconStar /> },
  { to: '/probleme', label: '1 · Problème', icon: <IconTarget /> },
  { to: '/ishikawa', label: '2 · Causes', icon: <IconIshikawa /> },
  { to: '/solutions', label: '3-4 · Solutions', icon: <IconBulb /> },
  { to: '/capa', label: '5 · Mise en œuvre', icon: <IconCapa /> },
  { to: '/standardisation', label: '6 · Standardiser', icon: <IconLayers /> },
  { to: '/liens', label: 'Liens', icon: <IconTree /> },
  { to: '/access', label: 'Accès', icon: <IconUsers /> },
];

export function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { projects, currentProjectId, setCurrentProject, userEmail } = useWorkspace();
  const currentProject = useCurrentProject();
  const [creating, setCreating] = useState(false);
  const nav = currentProject?.projectType === 'rdp' ? NAV_RDP : navGestion(currentProject?.tools);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">PE</span>
          Projet Entan
        </div>

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

        <div className="sidebar-footer">
          <div className="sidebar-user" title={userEmail ?? undefined}>
            {userEmail ?? '...'}
          </div>
          <div className="sidebar-footer-row" style={{ alignItems: 'center' }}>
            <form action="/auth/signout" method="post" style={{ flex: 1 }}>
              <button type="submit" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                <IconLogout /> Déconnexion
              </button>
            </form>
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

      <main className="main">{children}</main>

      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}



