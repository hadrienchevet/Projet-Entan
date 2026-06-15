'use client';

import { useState } from 'react';
import { useCurrentProject, useDashboardLayout, useWorkspace } from '@/lib/store';
import {
  WIDGETS,
  defaultLayout,
  widgetSetting,
  widgetsForScope,
  type WidgetId,
  type WidgetInstance,
  type WidgetScope,
} from '@/lib/widgets';
import { IconPlus } from '@/components/icons';
import { ActionFormModal } from '@/modules/actions/ActionFormModal';
import { WIDGET_COMPONENTS } from './widgets';

/** Réglages éditables par widget (id → liste de contrôles). */
const SETTINGS_UI: Partial<Record<WidgetId, { key: string; label: string; options: number[]; suffix?: string }[]>> = {
  delays: [{ key: 'urgentDays', label: 'Urgence sous', options: [1, 2, 3, 5, 7], suffix: 'j' }],
  upcoming: [{ key: 'horizonDays', label: 'Horizon', options: [7, 14, 30, 60], suffix: 'j' }],
};

export function DashboardGrid() {
  const project = useCurrentProject();
  const stored = useDashboardLayout();
  const { setDashboardWidgets } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [creatingAction, setCreatingAction] = useState(false);

  if (!project) return null;
  const scope: WidgetScope = project.projectType === 'rdp' ? 'rdp' : 'gestion';

  // Layout effectif : config stockée (filtrée au scope/ids valides) ou défaut.
  const valid = stored.filter((w) => WIDGETS[w.id] && WIDGETS[w.id].scope === scope);
  const layout: WidgetInstance[] = valid.length ? valid : defaultLayout(scope);

  const save = (next: WidgetInstance[]) => void setDashboardWidgets(project.id, next);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= layout.length) return;
    const next = [...layout];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };
  const remove = (i: number) => save(layout.filter((_, k) => k !== i));
  const add = (id: WidgetId) => { save([...layout, { id }]); setAdding(false); };
  const setSetting = (i: number, key: string, val: number) =>
    save(layout.map((w, k) => (k === i ? { ...w, settings: { ...w.settings, [key]: val } } : w)));
  const reset = () => save(defaultLayout(scope));

  const available = widgetsForScope(scope).filter((id) => !layout.some((w) => w.id === id));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p className="subtitle">{project.description ?? 'Tableau de bord — composez vos widgets.'}</p>
        </div>
        <div className="header-actions">
          <button className={`btn btn-sm${editing ? ' btn-primary' : ''}`} onClick={() => { setEditing((e) => !e); setAdding(false); }}>
            {editing ? 'Terminé' : 'Personnaliser'}
          </button>
          {!editing && scope === 'gestion' && (
            <button className="btn btn-primary" onClick={() => setCreatingAction(true)}>
              <IconPlus /> Nouvelle action
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="dash-editbar">
          <span className="muted" style={{ fontSize: 13 }}>
            Mode édition — réorganisez, retirez ou ajoutez des widgets. La disposition est personnelle et synchronisée.
          </span>
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => setAdding((a) => !a)}>
              <IconPlus /> Ajouter un widget
            </button>
            <button className="btn btn-ghost btn-sm" onClick={reset}>Réinitialiser</button>
          </span>
        </div>
      )}

      {editing && adding && (
        <div className="card widget-picker">
          {available.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Tous les widgets disponibles sont déjà affichés.</p>
          ) : (
            available.map((id) => (
              <button key={id} className="widget-picker-item" onClick={() => add(id)}>
                <span className="widget-picker-title">{WIDGETS[id].title}</span>
                <span className="widget-picker-desc">{WIDGETS[id].description}</span>
                <span className="widget-picker-add"><IconPlus /></span>
              </button>
            ))
          )}
        </div>
      )}

      <div className="dash-grid">
        {layout.map((instance, i) => {
          const def = WIDGETS[instance.id];
          const Comp = WIDGET_COMPONENTS[instance.id];
          if (!Comp) return null;
          const controls = SETTINGS_UI[instance.id];
          return (
            <div key={`${instance.id}-${i}`} className={`widget-wrap${def.span === 2 ? ' span-2' : ''}${editing ? ' editing' : ''}`}>
              {editing && (
                <div className="widget-toolbar">
                  <span className="widget-toolbar-name">{def.title}</span>
                  {controls?.map((c) => (
                    <label key={c.key} className="widget-setting">
                      {c.label}
                      <select
                        value={widgetSetting(instance, c.key, c.options[0])}
                        onChange={(e) => setSetting(i, c.key, Number(e.target.value))}
                      >
                        {c.options.map((o) => <option key={o} value={o}>{o}{c.suffix ?? ''}</option>)}
                      </select>
                    </label>
                  ))}
                  <span className="widget-toolbar-actions">
                    <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Monter">▲</button>
                    <button className="icon-btn" disabled={i === layout.length - 1} onClick={() => move(i, 1)} aria-label="Descendre">▼</button>
                    <button className="icon-btn danger" onClick={() => remove(i)} aria-label="Retirer">✕</button>
                  </span>
                </div>
              )}
              <div className={editing ? 'widget-dim' : undefined}>
                <Comp project={project} instance={instance} />
              </div>
            </div>
          );
        })}
      </div>

      {creatingAction && <ActionFormModal project={project} onClose={() => setCreatingAction(false)} />}
    </div>
  );
}
