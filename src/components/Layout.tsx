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
  IconDashboard,
  IconIshikawa,
  IconLayers,
  IconLogout,
  IconPlanning,
  IconPlus,
  IconRaci,
  IconStar,
  IconTarget,
  IconTree,
  IconUsers,
} from './icons';

const NAV_GESTION = [
  { to: '/', label: 'Dashboard', icon: <IconDashboard /> },
  { to: '/raci', label: 'RACI', icon: <IconRaci /> },
  { to: '/amdec', label: 'AMDEC', icon: <IconAmdec /> },
  { to: '/actions', label: 'Actions', icon: <IconActions /> },
  { to: '/planning', label: 'Planning', icon: <IconPlanning /> },
  { to: '/liens', label: 'Liens', icon: <IconTree /> },
  { to: '/access', label: 'Accès', icon: <IconUsers /> },
];

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
  const nav = currentProject?.projectType === 'rdp' ? NAV_RDP : NAV_GESTION;

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
            {userEmail ?? '…'}
          </div>
          <div className="sidebar-footer-row">
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btn-ghost btn-sm">
                <IconLogout /> Déconnexion
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="main">{children}</main>

      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}
