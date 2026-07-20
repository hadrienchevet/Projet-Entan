'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Action } from '@/lib/types';
import { addDaysISO, diffDays, formatDate, isOverdue, isoToDate, todayISO } from '@/lib/date';
import { StatusBadge } from '@/components/Badges';
import { IconCollapse, IconExpand, IconZoomIn, IconZoomOut } from '@/components/icons';

/**
 * Diagramme de Gantt simple : une barre par action, de la date de début
 * (ou de l'échéance si pas de début) jusqu'à l'échéance. Comme le calendrier,
 * c'est une pure vue des actions — aucune donnée propre, pas de dépendances.
 */

/** Largeurs de jour (px) : dézoomer = plus de jours visibles d'un coup. */
const ZOOM_LEVELS = [10, 14, 18, 26, 36, 48];
const DEFAULT_ZOOM = 3;

interface Props {
  actions: Action[];
  onSelect: (a: Action) => void;
  responsibleName: (a: Action) => string;
}

/** Début de barre : date de début si cohérente, sinon l'échéance (barre d'un jour). */
function barStart(a: Action): string {
  return a.startDate && a.startDate <= a.dueDate! ? a.startDate : a.dueDate!;
}

export function GanttView({ actions, onSelect, responsibleName }: Props) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [fullscreen, setFullscreen] = useState(false);
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

  const today = todayISO();
  const todayIdx = diffDays(start, today);
  const todayVisible = todayIdx >= 0 && todayIdx < days;
  const timelineWidth = days * dayW;

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

      <div className="gantt-scroll" style={{ '--day-w': `${dayW}px` } as CSSProperties}>
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

        {dated.map((a) => {
          const s = barStart(a);
          const startIdx = diffDays(start, s);
          const span = diffDays(s, a.dueDate!) + 1;
          const state =
            a.status === 'done' ? 'done' : isOverdue(a.dueDate, a.status) ? 'overdue' : a.status;
          return (
            <div key={a.id} className="gantt-row">
              <div className="gantt-label">
                <div className="row-title">{a.title}</div>
                <div className="row-sub">{responsibleName(a)}</div>
              </div>
              <div className="gantt-timeline" style={{ width: timelineWidth }}>
                {todayVisible && (
                  <div className="gantt-today" style={{ left: todayIdx * dayW }} />
                )}
                <button
                  className={`gantt-bar ${state}`}
                  style={{ left: startIdx * dayW + 2, width: span * dayW - 4 }}
                  title={`${a.title} — ${
                    a.startDate ? `${formatDate(s)} → ` : ''
                  }${formatDate(a.dueDate)} (${responsibleName(a)})`}
                  onClick={() => onSelect(a)}
                  aria-label={`Ouvrir ${a.title}`}
                />
              </div>
            </div>
          );
        })}
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
