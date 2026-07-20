'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { Action, Id } from '@/lib/types';
import { addDaysISO, diffDays, formatDate, isOverdue, isoToDate, todayISO } from '@/lib/date';
import { StatusBadge } from '@/components/Badges';
import { IconCollapse, IconExpand, IconZoomIn, IconZoomOut } from '@/components/icons';

/**
 * Diagramme de Gantt : une barre par action, de la date de début (ou de
 * l'échéance si pas de début) jusqu'à l'échéance. Les dépendances fin → début
 * (dependsOnIds) se créent au glisser depuis la poignée d'une barre et
 * s'affichent en flèches ; le Gantt reste une vue des actions, sans données propres.
 */

/** Largeurs de jour (px) : dézoomer = plus de jours visibles d'un coup. */
const ZOOM_LEVELS = [5, 8, 10, 14, 18, 26, 36, 48];
const DEFAULT_ZOOM = 5;
/** Largeur de la colonne des libellés — doit suivre `.gantt-label` (CSS). */
const LABEL_W = 230;
/** Hauteur fixe des lignes du corps : indispensable pour tracer les flèches. */
const ROW_H = 52;

interface Props {
  actions: Action[];
  onSelect: (a: Action) => void;
  responsibleName: (a: Action) => string;
  /** Crée une dépendance : `successorId` ne démarre qu'après la fin de `predecessorId`. */
  onLink: (predecessorId: Id, successorId: Id) => void;
  onUnlink: (predecessorId: Id, successorId: Id) => void;
}

/** Début de barre : date de début si cohérente, sinon l'échéance (barre d'un jour).
 *  Un jalon est ponctuel : toujours positionné sur son échéance. */
function barStart(a: Action): string {
  if (a.milestone) return a.dueDate!;
  return a.startDate && a.startDate <= a.dueDate! ? a.startDate : a.dueDate!;
}

export function GanttView({ actions, onSelect, responsibleName, onLink, onUnlink }: Props) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [fullscreen, setFullscreen] = useState(false);
  /** Glisser de liaison en cours : point courant en coordonnées de la timeline. */
  const [drag, setDrag] = useState<{ fromId: Id; x: number; y: number; targetId: Id | null } | null>(
    null,
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayW = ZOOM_LEVELS[zoom];
  /* En dézoom fort les numéros ne tiennent plus : on ne garde que les lundis. */
  const showAllDays = dayW >= 18;

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      // Une modale ouverte (fiche action) garde la priorité sur Échap.
      if (e.key === 'Escape' && !document.querySelector('.modal-overlay')) setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const dated = useMemo(
    () =>
      actions
        .filter((a) => a.dueDate)
        .sort(
          (a, b) =>
            barStart(a).localeCompare(barStart(b)) || a.dueDate!.localeCompare(b.dueDate!),
        ),
    [actions],
  );
  const undated = actions.filter((a) => !a.dueDate);

  const { start, days } = useMemo(() => computeRange(dated), [dated]);
  const months = useMemo(() => monthSegments(start, days), [start, days]);

  /* Zoom initial auto : la plus grande largeur de jour qui fait tenir tout le
     projet dans la largeur visible (sur grand écran : vue d'ensemble d'emblée).
     Une seule fois, dès que les données sont là — le zoom manuel reprend ensuite la main. */
  const fitted = useRef(false);
  useLayoutEffect(() => {
    if (fitted.current || dated.length === 0 || !scrollRef.current) return;
    fitted.current = true;
    const avail = scrollRef.current.clientWidth - LABEL_W;
    let idx = 0;
    for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
      if (days * ZOOM_LEVELS[i] <= avail) {
        idx = i;
        break;
      }
    }
    setZoom(idx);
  }, [dated.length, days]);

  const today = todayISO();
  const todayIdx = diffDays(start, today);
  const todayVisible = todayIdx >= 0 && todayIdx < days;
  const timelineWidth = days * dayW;

  /* Géométrie de chaque barre (coordonnées de la timeline) pour les flèches. */
  const geo = useMemo(() => {
    const m = new Map<Id, { startX: number; endX: number; y: number }>();
    dated.forEach((a, i) => {
      const startIdx = diffDays(start, barStart(a));
      const span = diffDays(barStart(a), a.dueDate!) + 1;
      const y = i * ROW_H + ROW_H / 2;
      if (a.milestone) {
        const c = startIdx * dayW + dayW / 2;
        m.set(a.id, { startX: c - 9, endX: c + 9, y });
      } else {
        m.set(a.id, { startX: startIdx * dayW + 2, endX: startIdx * dayW + 2 + span * dayW - 4, y });
      }
    });
    return m;
  }, [dated, start, dayW]);

  /* Liens affichables : prédécesseur et successeur tous deux positionnés. */
  const links = useMemo(() => {
    const byId = new Map(dated.map((a) => [a.id, a]));
    const out: { pred: Action; succ: Action }[] = [];
    for (const succ of dated) {
      for (const pid of succ.dependsOnIds ?? []) {
        const pred = byId.get(pid);
        if (pred) out.push({ pred, succ });
      }
    }
    return out;
  }, [dated]);

  /** La dépendance pred → succ créerait-elle un cycle ? (succ déjà en amont de pred) */
  const wouldCycle = (predId: Id, succId: Id): boolean => {
    const byId = new Map(dated.map((a) => [a.id, a]));
    const seen = new Set<Id>();
    const stack = [predId];
    while (stack.length) {
      const id = stack.pop()!;
      if (id === succId) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const p of byId.get(id)?.dependsOnIds ?? []) stack.push(p);
    }
    return false;
  };

  /** Démarre le glisser de liaison depuis la poignée d'une barre. */
  const startLink = (e: ReactMouseEvent, from: Action) => {
    e.preventDefault();
    e.stopPropagation();
    const body = bodyRef.current;
    if (!body) return;
    const toLocal = (clientX: number, clientY: number) => {
      const r = body.getBoundingClientRect();
      return { x: clientX - r.left - LABEL_W, y: clientY - r.top };
    };
    setDrag({ fromId: from.id, ...toLocal(e.clientX, e.clientY), targetId: null });

    const barUnder = (ev: Event) =>
      ((ev.target as Element | null)?.closest?.('.gantt-bar') as HTMLElement | null)?.dataset
        .actionId ?? null;
    const move = (ev: globalThis.MouseEvent) => {
      const tid = barUnder(ev);
      setDrag((d) =>
        d && { ...d, ...toLocal(ev.clientX, ev.clientY), targetId: tid !== from.id ? tid : null },
      );
    };
    const stop = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('keydown', esc);
      setDrag(null);
    };
    const up = (ev: globalThis.MouseEvent) => {
      const tid = barUnder(ev);
      stop();
      if (!tid || tid === from.id) return;
      const succ = dated.find((a) => a.id === tid);
      if (!succ) return;
      if ((succ.dependsOnIds ?? []).includes(from.id)) return; // déjà lié
      if (wouldCycle(from.id, succ.id)) return; // refuse les boucles
      onLink(from.id, succ.id);
    };
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') stop();
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', esc);
  };

  const dragGeo = drag ? geo.get(drag.fromId) : undefined;

  if (dated.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <p>
            Aucune action avec échéance ne correspond aux filtres : le Gantt positionne les
            actions sur leurs dates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card gantt-card${fullscreen ? ' gantt-fullscreen' : ''}`}>
      <div className="card-header">
        <h2>Gantt</h2>
        <div className="gantt-header-tools">
          <div className="legend">
            <span>
              <i className="dot" style={{ background: 'var(--accent-faint)' }} /> À faire
            </span>
            <span>
              <i className="dot" style={{ background: 'var(--accent)' }} /> En cours
            </span>
            <span>
              <i className="dot" style={{ background: 'var(--success)' }} /> Terminée
            </span>
            <span>
              <i className="dot" style={{ background: 'var(--danger)' }} /> En retard
            </span>
            <span>
              <i className="dot diamond" style={{ background: 'var(--accent)' }} /> Jalon
            </span>
          </div>
          <div className="gantt-controls">
            <button
              className="icon-btn"
              onClick={() => setZoom((z) => Math.max(0, z - 1))}
              disabled={zoom === 0}
              title="Dézoomer — voir plus de jours"
              aria-label="Dézoomer"
            >
              <IconZoomOut />
            </button>
            <button
              className="icon-btn"
              onClick={() => setZoom((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
              disabled={zoom === ZOOM_LEVELS.length - 1}
              title="Zoomer — voir moins de jours"
              aria-label="Zoomer"
            >
              <IconZoomIn />
            </button>
            <button
              className="icon-btn"
              onClick={() => setFullscreen((f) => !f)}
              title={fullscreen ? 'Quitter le plein écran (Échap)' : 'Plein écran'}
              aria-label={fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {fullscreen ? <IconCollapse /> : <IconExpand />}
            </button>
          </div>
        </div>
      </div>

      <div
        className="gantt-scroll"
        ref={scrollRef}
        style={{ '--day-w': `${dayW}px` } as CSSProperties}
      >
        <div className="gantt-row gantt-head">
          <div className="gantt-label corner">Action</div>
          <div className="gantt-timeline months" style={{ width: timelineWidth }}>
            {months.map((m) => (
              <div
                key={m.label}
                className="gantt-month"
                style={{ left: m.startIdx * dayW, width: m.span * dayW }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <div className="gantt-row gantt-head">
          <div className="gantt-label corner" />
          <div className="gantt-timeline days" style={{ width: timelineWidth }}>
            {Array.from({ length: days }, (_, i) => {
              const iso = addDaysISO(start, i);
              const dow = isoToDate(iso).getDay();
              const isToday = iso === today;
              return (
                <span
                  key={iso}
                  className={`gantt-day${dow === 0 || dow === 6 ? ' weekend' : ''}${
                    isToday ? ' today' : ''
                  }`}
                >
                  {showAllDays || dow === 1 || isToday ? iso.slice(8) : ''}
                </span>
              );
            })}
          </div>
        </div>

        <div className={`gantt-body${drag ? ' linking' : ''}`} ref={bodyRef}>
          {dated.map((a) => {
            const s = barStart(a);
            const startIdx = diffDays(start, s);
            const span = diffDays(s, a.dueDate!) + 1;
            const state =
              a.status === 'done' ? 'done' : isOverdue(a.dueDate, a.status) ? 'overdue' : a.status;
            const target = drag?.targetId === a.id ? ' link-target' : '';
            const handleLeft = geo.get(a.id)!.endX + 4;
            return (
              <div key={a.id} className="gantt-row" style={{ height: ROW_H }}>
                <div className="gantt-label">
                  <div className="row-title">
                    {a.milestone && <span className="milestone-mark">◆ </span>}
                    {a.title}
                  </div>
                  <div className="row-sub">{responsibleName(a)}</div>
                </div>
                <div className="gantt-timeline" style={{ width: timelineWidth }}>
                  {todayVisible && (
                    <div className="gantt-today" style={{ left: todayIdx * dayW }} />
                  )}
                  {a.milestone ? (
                    <button
                      className={`gantt-bar milestone ${state}${target}`}
                      style={{ left: startIdx * dayW + dayW / 2 }}
                      data-action-id={a.id}
                      title={`${a.title} — jalon : ${formatDate(a.dueDate)} (${responsibleName(a)})`}
                      onClick={() => onSelect(a)}
                      aria-label={`Ouvrir ${a.title}`}
                    />
                  ) : (
                    <button
                      className={`gantt-bar ${state}${target}`}
                      style={{ left: startIdx * dayW + 2, width: span * dayW - 4 }}
                      data-action-id={a.id}
                      title={`${a.title} — ${
                        a.startDate ? `${formatDate(s)} → ` : ''
                      }${formatDate(a.dueDate)} (${responsibleName(a)})`}
                      onClick={() => onSelect(a)}
                      aria-label={`Ouvrir ${a.title}`}
                    />
                  )}
                  <span
                    className="gantt-link-handle"
                    style={{ left: handleLeft }}
                    onMouseDown={(e) => startLink(e, a)}
                    title="Lier : glisser jusqu'à l'action qui doit suivre"
                  />
                </div>
              </div>
            );
          })}

          {/* Flèches de dépendance, par-dessus les lignes (sous les libellés sticky). */}
          <svg
            className="gantt-links"
            style={{ left: LABEL_W, width: timelineWidth, height: dated.length * ROW_H }}
          >
            <defs>
              <marker
                id="gantt-arrow"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M0 0 8 4 0 8Z" fill="var(--text-muted)" />
              </marker>
              <marker
                id="gantt-arrow-danger"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M0 0 8 4 0 8Z" fill="var(--danger)" />
              </marker>
            </defs>
            {links.map(({ pred, succ }) => {
              const g1 = geo.get(pred.id);
              const g2 = geo.get(succ.id);
              if (!g1 || !g2) return null;
              const violated = barStart(succ) < pred.dueDate!;
              const d = linkPath({ x: g1.endX + 1, y: g1.y }, { x: g2.startX - 2, y: g2.y });
              return (
                <g key={`${pred.id}-${succ.id}`} className="gantt-link-g">
                  <title>
                    {`${pred.title} → ${succ.title}${
                      violated ? ' — CONFLIT : le successeur démarre avant la fin' : ''
                    } (cliquer pour supprimer le lien)`}
                  </title>
                  <path
                    className={`gantt-link${violated ? ' violated' : ''}`}
                    d={d}
                    markerEnd={violated ? 'url(#gantt-arrow-danger)' : 'url(#gantt-arrow)'}
                  />
                  <path
                    className="gantt-link-hit"
                    d={d}
                    onClick={() => {
                      if (window.confirm(`Supprimer le lien « ${pred.title} → ${succ.title} » ?`))
                        onUnlink(pred.id, succ.id);
                    }}
                  />
                </g>
              );
            })}
            {drag && dragGeo && (
              <path
                className="gantt-link-temp"
                d={`M ${dragGeo.endX + 1} ${dragGeo.y} L ${drag.x} ${drag.y}`}
              />
            )}
          </svg>
        </div>
      </div>

      {undated.length > 0 && (
        <div className="gantt-undated">
          <div className="day-group-title">Sans échéance — non positionnables sur le Gantt</div>
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

/**
 * Chemin en coude d'une flèche de dépendance : sortie horizontale du
 * prédécesseur, descente/montée, entrée horizontale dans le successeur.
 * Si le successeur commence à gauche de la sortie, le trait revient en
 * arrière en passant entre les deux lignes.
 */
function linkPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const stub = 8;
  if (to.x >= from.x + stub * 2) {
    return `M ${from.x} ${from.y} H ${from.x + stub} V ${to.y} H ${to.x}`;
  }
  const midY = from.y < to.y ? from.y + ROW_H / 2 : from.y - ROW_H / 2;
  return `M ${from.x} ${from.y} H ${from.x + stub} V ${midY} H ${to.x - stub} V ${to.y} H ${to.x}`;
}

/**
 * Fenêtre temporelle : des actions les plus anciennes aux plus tardives,
 * étendue à aujourd'hui s'il est proche, calée sur un lundi et complétée
 * en semaines entières (les week-ends du fond restent alignés).
 */
function computeRange(dated: Action[]): { start: string; days: number } {
  const today = todayISO();
  if (dated.length === 0) return { start: addDaysISO(today, -7), days: 28 };

  let min = dated.reduce((m, a) => (barStart(a) < m ? barStart(a) : m), barStart(dated[0]));
  let max = dated.reduce((m, a) => (a.dueDate! > m ? a.dueDate! : m), dated[0].dueDate!);
  if (today < min && diffDays(today, min) <= 14) min = today;
  if (today > max && diffDays(max, today) <= 14) max = today;

  let start = addDaysISO(min, -3);
  start = addDaysISO(start, -((isoToDate(start).getDay() + 6) % 7));

  let days = diffDays(start, max) + 4;
  days = Math.ceil(days / 7) * 7;
  return { start, days: Math.min(days, 420) };
}

function monthSegments(
  start: string,
  days: number,
): { label: string; startIdx: number; span: number }[] {
  const segments: { label: string; startIdx: number; span: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = isoToDate(addDaysISO(start, i));
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const last = segments[segments.length - 1];
    if (last && last.label === label) {
      last.span++;
    } else {
      segments.push({ label, startIdx: i, span: 1 });
    }
  }
  return segments;
}
