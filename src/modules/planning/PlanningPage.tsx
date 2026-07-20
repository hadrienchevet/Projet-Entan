'use client';

import { useMemo, useState } from 'react';
import { memberName, useCurrentProject, useProjectActions, useWorkspace } from '@/lib/store';
import type { Action, ActionInput, ActionStatus, Id } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import { formatDateLong, isOverdue, todayISO, toISO } from '@/lib/date';
import { StatusBadge } from '@/components/Badges';
import { IconPlus } from '@/components/icons';
import { ActionFormModal } from '@/modules/actions/ActionFormModal';
import { GanttView } from './GanttView';

/**
 * Le planning est une VUE des actions : il ne stocke rien, il lit les
 * échéances des actions du module Actions et les projette en calendrier
 * ou en liste chronologique.
 */
export function PlanningPage() {
  const project = useCurrentProject();
  const actions = useProjectActions(project?.id);
  const { updateAction } = useWorkspace();

  const [view, setView] = useState<'calendar' | 'gantt' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('all');
  const [memberFilter, setMemberFilter] = useState<Id | 'all'>('all');
  const [editing, setEditing] = useState<Action | null>(null);
  /** Création d'action : null = fermé ; objet = ouvert avec ces valeurs pré-remplies. */
  const [creating, setCreating] = useState<Partial<ActionInput> | null>(null);

  if (!project) return null;

  const filtered = actions
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter((a) => memberFilter === 'all' || a.responsibleId === memberFilter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Planning</h1>
          <p className="subtitle">
            Vue temporelle des actions du projet, positionnées sur leur échéance.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setCreating({})}>
            <IconPlus /> Nouvelle action
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="segmented" role="tablist">
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
            Calendrier
          </button>
          <button className={view === 'gantt' ? 'active' : ''} onClick={() => setView('gantt')}>
            Gantt
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            Liste
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ActionStatus | 'all')}
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les statuts</option>
          {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          aria-label="Filtrer par membre"
        >
          <option value="all">Tous les membres</option>
          {project.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {view === 'calendar' && (
        <CalendarView
          actions={filtered}
          onSelect={setEditing}
          responsibleName={memberFor}
          onCreate={(iso) => setCreating({ dueDate: iso })}
        />
      )}
      {view === 'gantt' && (
        <GanttView
          actions={filtered}
          onSelect={setEditing}
          responsibleName={memberFor}
          onLink={linkActions}
          onUnlink={unlinkActions}
        />
      )}
      {view === 'list' && (
        <ListView actions={filtered} onSelect={setEditing} responsibleName={memberFor} />
      )}

      {editing && (
        <ActionFormModal project={project} action={editing} onClose={() => setEditing(null)} />
      )}
      {creating && (
        <ActionFormModal project={project} defaults={creating} onClose={() => setCreating(null)} />
      )}
    </div>
  );

  function memberFor(action: Action): string {
    return memberName(project, action.responsibleId);
  }

  /** Dépendance fin → début : le successeur porte la liste de ses prédécesseurs. */
  function linkActions(predecessorId: Id, successorId: Id) {
    const succ = actions.find((a) => a.id === successorId);
    if (!succ) return;
    const deps = succ.dependsOnIds ?? [];
    if (deps.includes(predecessorId)) return;
    void updateAction(successorId, { dependsOnIds: [...deps, predecessorId] });
  }

  function unlinkActions(predecessorId: Id, successorId: Id) {
    const succ = actions.find((a) => a.id === successorId);
    if (!succ) return;
    void updateAction(successorId, {
      dependsOnIds: (succ.dependsOnIds ?? []).filter((id) => id !== predecessorId),
    });
  }
}

/* --- Vue calendrier --------------------------------------------------------- */

const DOW = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MAX_VISIBLE = 2;

function CalendarView({
  actions,
  onSelect,
  responsibleName,
  onCreate,
}: {
  actions: Action[];
  onSelect: (a: Action) => void;
  responsibleName: (a: Action) => string;
  onCreate: (iso: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dayView, setDayView] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthCells(month), [month]);
  const today = todayISO();

  const byDate = useMemo(() => {
    const map = new Map<string, Action[]>();
    for (const a of actions) {
      if (!a.dueDate) continue;
      const list = map.get(a.dueDate) ?? [];
      list.push(a);
      map.set(a.dueDate, list);
    }
    return map;
  }, [actions]);

  const shift = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  const dayActions = dayView ? (byDate.get(dayView) ?? []) : [];

  return (
    <>
      <div className="card">
        <div className="cal-header">
          <button className="btn btn-sm" onClick={() => shift(-1)} aria-label="Mois précédent">
            ←
          </button>
          <span className="cal-title">
            {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-sm" onClick={() => shift(1)} aria-label="Mois suivant">
            →
          </button>
        </div>
        <div className="cal-grid">
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {cells.map(({ iso, inMonth, day }) => {
            const dayList = byDate.get(iso) ?? [];
            const visible = dayList.slice(0, MAX_VISIBLE);
            const overflow = dayList.length - MAX_VISIBLE;
            return (
              <div
                key={iso}
                className={`cal-cell${inMonth ? '' : ' out'}${iso === today ? ' today' : ''}`}
              >
                <span
                  className="day-num clickable"
                  onClick={() => (dayList.length > 0 ? setDayView(iso) : onCreate(iso))}
                  title={dayList.length > 0 ? `${dayList.length} action(s)` : 'Ajouter une action ce jour'}
                >
                  {day}
                </span>
                {visible.map((a) => (
                  <button
                    key={a.id}
                    className={`cal-event${a.status === 'done' ? ' done' : ''}${
                      isOverdue(a.dueDate, a.status) ? ' overdue' : ''
                    }`}
                    title={a.title}
                    onClick={(e) => { e.stopPropagation(); onSelect(a); }}
                  >
                    {a.title}
                  </button>
                ))}
                {overflow > 0 && (
                  <button className="cal-overflow" onClick={() => setDayView(iso)}>
                    +{overflow} autre{overflow > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {dayView && (
        <div className="modal-overlay" onClick={() => setDayView(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formatDateLong(dayView)}</h2>
              <button className="icon-btn" onClick={() => setDayView(null)} aria-label="Fermer">
                ✕
              </button>
            </div>
            {dayActions.map((a) => (
              <div key={a.id} className="list-row">
                <div className="row-main">
                  <div className="row-title">{a.title}</div>
                  <div className="row-sub">{responsibleName(a)}</div>
                </div>
                <StatusBadge status={a.status} dueDate={a.dueDate} />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setDayView(null); onSelect(a); }}
                >
                  Ouvrir
                </button>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-sm"
                onClick={() => { const d = dayView; setDayView(null); onCreate(d); }}
              >
                <IconPlus /> Ajouter une action ce jour
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Grille de 6 semaines, lundi en premier (usage français). */
function buildMonthCells(month: Date): { iso: string; inMonth: boolean; day: number }[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // getDay() : 0 = dimanche → on ramène lundi à l'indice 0.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: toISO(d), inMonth: d.getMonth() === month.getMonth(), day: d.getDate() };
  });
}

/* --- Vue liste chronologique -------------------------------------------------- */

function ListView({
  actions,
  onSelect,
  responsibleName,
}: {
  actions: Action[];
  onSelect: (a: Action) => void;
  responsibleName: (a: Action) => string;
}) {
  const dated = actions
    .filter((a) => a.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const undated = actions.filter((a) => !a.dueDate);

  const groups = new Map<string, Action[]>();
  for (const a of dated) {
    const list = groups.get(a.dueDate!) ?? [];
    list.push(a);
    groups.set(a.dueDate!, list);
  }

  if (actions.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <p>Aucune action ne correspond aux filtres.</p>
        </div>
      </div>
    );
  }

  const today = todayISO();

  return (
    <div className="card">
      {[...groups.entries()].map(([date, list]) => (
        <div key={date}>
          <div className={`day-group-title${date < today ? ' overdue' : ''}`}>
            {formatDateLong(date)}
            {date < today && ' — passé'}
          </div>
          {list.map((a) => (
            <div key={a.id} className="list-row">
              <div className="row-main">
                <div className="row-title">{a.title}</div>
                <div className="row-sub">{responsibleName(a)}</div>
              </div>
              <StatusBadge status={a.status} dueDate={a.dueDate} />
              <button className="btn btn-ghost btn-sm" onClick={() => onSelect(a)}>
                Ouvrir
              </button>
            </div>
          ))}
        </div>
      ))}
      {undated.length > 0 && (
        <div>
          <div className="day-group-title">Sans échéance</div>
          {undated.map((a) => (
            <div key={a.id} className="list-row">
              <div className="row-main">
                <div className="row-title">{a.title}</div>
                <div className="row-sub">{responsibleName(a)}</div>
              </div>
              <StatusBadge status={a.status} dueDate={a.dueDate} />
              <button className="btn btn-ghost btn-sm" onClick={() => onSelect(a)}>
                Ouvrir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
