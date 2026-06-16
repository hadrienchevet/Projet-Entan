'use client';

import { useCurrentProject, useWorkspace } from '@/lib/store';
import { TOOLS, TOOL_ORDER, enabledTools, type ToolId } from '@/lib/tools';

/**
 * Outils du projet — active/désactive les modules de gestion affichés dans la
 * sidebar. La sélection est au niveau du projet (partagée par l'équipe) et
 * synchronisée. Désactiver un outil le retire du menu sans effacer ses données.
 */
export function OutilsPage() {
  const project = useCurrentProject();
  const { setProjectTools } = useWorkspace();

  if (!project) return null;

  const active = enabledTools(project.tools);
  const isOn = (id: ToolId) => active.includes(id);

  const toggle = (id: ToolId) => {
    const next = isOn(id)
      ? active.filter((t) => t !== id)
      : TOOL_ORDER.filter((t) => active.includes(t) || t === id);
    void setProjectTools(project.id, next);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Outils du projet</h1>
          <p className="subtitle">
            Choisissez les outils affichés pour ce projet. Désactiver un outil le retire du menu —
            ses données sont conservées et réapparaissent si vous le réactivez.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="tool-list">
          {TOOL_ORDER.map((id) => {
            const t = TOOLS[id];
            const on = isOn(id);
            return (
              <label key={id} className="tool-row">
                <div className="tool-row-main">
                  <div className="tool-row-title">{t.label}</div>
                  <div className="tool-row-desc">{t.description}</div>
                </div>
                <span className={`toggle${on ? ' on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(id)} />
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        Le tableau de bord, la page Accès et cette page sont toujours disponibles.
      </p>
    </div>
  );
}
