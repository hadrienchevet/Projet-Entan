import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ProjectFormModal } from './ProjectFormModal';
import { IconActions, IconAmdec, IconDashboard, IconPlanning, IconPlus, IconRaci } from './icons';

const NAV = [
  { to: '/', label: 'Dashboard', icon: <IconDashboard />, end: true },
  { to: '/raci', label: 'RACI', icon: <IconRaci />, end: false },
  { to: '/amdec', label: 'AMDEC', icon: <IconAmdec />, end: false },
  { to: '/actions', label: 'Actions', icon: <IconActions />, end: false },
  { to: '/planning', label: 'Planning', icon: <IconPlanning />, end: false },
];

export function Layout() {
  const projects = useStore((s) => s.projects);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const [creating, setCreating] = useState(false);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">PO</span>
          Project Ops Hub
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
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">V1 — données locales (navigateur)</div>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      {creating && <ProjectFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}
