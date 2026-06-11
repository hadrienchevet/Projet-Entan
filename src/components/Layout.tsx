'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/lib/store';
import { ProjectFormModal } from './ProjectFormModal';
import { ThemeToggle } from './ThemeToggle';
import {
  IconActions,
  IconAmdec,
  IconDashboard,
  IconLogout,
  IconPlanning,
  IconPlus,
  IconRaci,
} from './icons';

const NAV = [
  { to: '/', label: 'Dashboard', icon: <IconDashboard /> },
  { to: '/raci', label: 'RACI', icon: <IconRaci /> },
  { to: '/amdec', label: 'AMDEC', icon: <IconAmdec /> },
  { to: '/actions', label: 'Actions', icon: <IconActions /> },
  { to: '/planning', label: 'Planning', icon: <IconPlanning /> },
];

export function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { projects, currentProjectId, setCurrentProject, userEmail } = useWorkspace();
  const [creating, setCreating] = useState(false);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">PX</span>
          Pilotix
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
          {NAV.map((item) => (
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
