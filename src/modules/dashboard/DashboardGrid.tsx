'use client';

import { useEffect, useRef, useState } from 'react';
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
import { enabledTools } from '@/lib/tools';
import { IconPlus } from '@/components/icons';
import { ActionFormModal } from '@/modules/actions/ActionFormModal';
import { WIDGET_COMPONENTS } from './widgets';
import type { Project } from '@/lib/types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/** Réglages éditables par widget (id → liste de contrôles). */
const SETTINGS_UI: Partial<Record<WidgetId, { key: string; label: string; options: number[]; suffix?: string }[]>> = {
  delays: [{ key: 'urgentDays', label: 'Urgence sous', options: [1, 2, 3, 5, 7], suffix: 'j' }],
  upcoming: [{ key: 'horizonDays', label: 'Horizon', options: [7, 14, 30, 60], suffix: 'j' }],
};

const IconGrip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" />
    <circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" />
    <circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" />
  </svg>
);
const IconWidth = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="8 7 4 12 8 17" /><polyline points="16 7 20 12 16 17" /><line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function DashboardGrid() {
  const project = useCurrentProject();
  const stored = useDashboardLayout();
  const { setDashboardWidgets } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [creatingAction, setCreatingAction] = useState(false);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const [overId, setOverId] = useState<WidgetId | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!project) return null;
  const scope: WidgetScope = project.projectType === 'rdp' ? 'rdp' : 'gestion';

  // Layout effectif : config stockée (filtrée au scope/ids valides) ou défaut.
  const valid = stored.filter((w) => WIDGETS[w.id] && WIDGETS[w.id].scope === scope);
  const layout: WidgetInstance[] = valid.length ? valid : defaultLayout(scope);

  const save = (next: WidgetInstance[]) => void setDashboardWidgets(project.id, next);
  const remove = (i: number) => save(layout.filter((_, k) => k !== i));
  const add = (id: WidgetId) => { save([...layout, { id }]); setAdding(false); };
  const setSetting = (i: number, key: string, val: number) =>
    save(layout.map((w, k) => (k === i ? { ...w, settings: { ...w.settings, [key]: val } } : w)));
  const toggleWidth = (i: number) =>
    save(layout.map((w, k) => (k === i ? { ...w, span: ((w.span ?? WIDGETS[w.id].span) === 2 ? 1 : 2) } : w)));
  const reset = () => save(defaultLayout(scope));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = layout.findIndex((w) => w.id === active.id);
    const newI = layout.findIndex((w) => w.id === over.id);
    if (oldI < 0 || newI < 0) return;
    save(arrayMove(layout, oldI, newI));
  };

  // Les widgets de coûts ne sont proposés que si l'outil Suivi des coûts est activé.
  const coutsOn = enabledTools(project.tools).includes('couts');
  const needsCouts = (id: WidgetId) => id === 'costs' || id === 'costs-breakdown';
  const available = widgetsForScope(scope).filter(
    (id) => !layout.some((w) => w.id === id) && (!needsCouts(id) || coutsOn),
  );
  const ids = layout.map((w) => w.id);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p className="subtitle">{project.description ?? 'Tableau de bord — composez vos widgets.'}</p>
        </div>
        <div className="header-actions">
          <button className={`btn btn-sm${editing ? ' btn-primary' : ''}`} onClick={() => { setEditing((v) => !v); setAdding(false); }}>
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
            Glissez la poignée <span style={{ verticalAlign: 'middle', display: 'inline-flex' }}><IconGrip /></span> pour réorganiser · <IconWidth /> change la largeur · <IconClose /> retire. Disposition personnelle et synchronisée.
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as WidgetId)}
        onDragOver={(e) => setOverId((e.over?.id as WidgetId) ?? null)}
        onDragEnd={(e) => { setActiveId(null); setOverId(null); onDragEnd(e); }}
        onDragCancel={() => { setActiveId(null); setOverId(null); }}
      >
        {/* strategy () => null : les autres widgets ne bougent pas pendant le drag ;
            un indicateur de dépôt (case illuminée) montre où le widget atterrira. */}
        <SortableContext items={ids} strategy={() => null}>
          <div className="dash-grid">
            {layout.map((instance, i) => (
              <SortableWidget
                key={instance.id}
                instance={instance}
                project={project}
                editing={editing}
                isOver={editing && overId === instance.id && activeId !== null && activeId !== instance.id}
                controls={SETTINGS_UI[instance.id]}
                onSetting={(key, val) => setSetting(i, key, val)}
                onToggleWidth={() => toggleWidth(i)}
                onRemove={() => remove(i)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? <WidgetOverlay instance={layout.find((w) => w.id === activeId) ?? { id: activeId }} project={project} /> : null}
        </DragOverlay>
      </DndContext>

      {creatingAction && <ActionFormModal project={project} onClose={() => setCreatingAction(false)} />}
    </div>
  );
}

function SortableWidget({
  instance,
  project,
  editing,
  isOver,
  controls,
  onSetting,
  onToggleWidth,
  onRemove,
}: {
  instance: WidgetInstance;
  project: Project;
  editing: boolean;
  isOver: boolean;
  controls?: { key: string; label: string; options: number[]; suffix?: string }[];
  onSetting: (key: string, val: number) => void;
  onToggleWidth: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: instance.id,
    disabled: !editing,
  });
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const prevSpan = useRef<number | null>(null);
  const def = WIDGETS[instance.id];
  const Comp = WIDGET_COMPONENTS[instance.id];
  const span = instance.span ?? (def?.span ?? 1);

  // Petite animation quand la largeur (span) change.
  useEffect(() => {
    if (prevSpan.current !== null && prevSpan.current !== span && wrapRef.current) {
      wrapRef.current.animate(
        [
          { transform: 'scale(0.97)', opacity: 0.7 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    }
    prevSpan.current = span;
  }, [span]);

  if (!def || !Comp) return null;

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    wrapRef.current = el;
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Emplacement fantôme atténué : le widget « soulevé » est rendu par le DragOverlay.
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={`widget-wrap${span === 2 ? ' span-2' : ''}${editing ? ' editing' : ''}${isDragging ? ' dragging' : ''}${isOver ? ' drop-target' : ''}`}
    >
      {editing && (
        <div className="widget-edit-overlay">
          <button className="widget-grip" {...attributes} {...listeners} aria-label={`Déplacer ${def.title}`} title="Glisser pour déplacer">
            <IconGrip />
          </button>
          <span className="widget-edit-name">{def.title}</span>
          {controls?.map((c) => (
            <label key={c.key} className="widget-setting">
              {c.label}
              <select value={widgetSetting(instance, c.key, c.options[0])} onChange={(e) => onSetting(c.key, Number(e.target.value))}>
                {c.options.map((o) => <option key={o} value={o}>{o}{c.suffix ?? ''}</option>)}
              </select>
            </label>
          ))}
          <span className="widget-edit-actions">
            <button className="icon-btn" onClick={onToggleWidth} title={span === 2 ? 'Passer en demi-largeur' : 'Passer en pleine largeur'} aria-label="Changer la largeur">
              <IconWidth />
            </button>
            <button className="icon-btn danger" onClick={onRemove} title="Retirer ce widget" aria-label="Retirer">
              <IconClose />
            </button>
          </span>
        </div>
      )}
      <div className={editing ? 'widget-dim' : undefined}>
        <Comp project={project} instance={instance} />
      </div>
    </div>
  );
}

/** Calque flottant rendu pendant le glisser (suit le curseur, net et élevé). */
function WidgetOverlay({ instance, project }: { instance: WidgetInstance; project: Project }) {
  const def = WIDGETS[instance.id];
  const Comp = WIDGET_COMPONENTS[instance.id];
  if (!def || !Comp) return null;
  return (
    <div className="widget-wrap widget-overlay-floating" style={{ cursor: 'grabbing' }}>
      <Comp project={project} instance={instance} />
    </div>
  );
}
