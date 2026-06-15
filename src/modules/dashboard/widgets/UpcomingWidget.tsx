'use client';

import Link from 'next/link';
import { memberName, useProjectActions } from '@/lib/store';
import type { Action } from '@/lib/types';
import { addDaysISO, formatDayMonth, todayISO } from '@/lib/date';
import { StatusBadge } from '@/components/Badges';
import { widgetSetting } from '@/lib/widgets';
import { dayLabel } from './_util';
import type { WidgetProps } from './index';

/**
 * À venir (planning) : actions à TERMINER et actions à DÉMARRER dans les N
 * prochains jours. N réglable (settings.horizonDays).
 */
export function UpcomingWidget({ project, instance }: WidgetProps) {
  const actions = useProjectActions(project.id);
  const horizon = widgetSetting(instance, 'horizonDays', 14);
  const today = todayISO();
  const until = addDaysISO(today, horizon);
  const byDue = (a: Action, b: Action) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
  const byStart = (a: Action, b: Action) => (a.startDate ?? '').localeCompare(b.startDate ?? '');

  const open = actions.filter((a) => a.status !== 'done');
  // À terminer : échéance entre aujourd'hui et l'horizon (les retards sont dans le widget dédié).
  const toFinish = open
    .filter((a) => a.dueDate && a.dueDate >= today && a.dueDate <= until)
    .sort(byDue);
  // À démarrer : début planifié entre aujourd'hui et l'horizon, pas encore commencée.
  const toStart = open
    .filter((a) => a.status === 'todo' && a.startDate && a.startDate >= today && a.startDate <= until)
    .sort(byStart);

  const total = toFinish.length + toStart.length;

  const Row = ({ a, date }: { a: Action; date: string }) => (
    <div key={a.id + date} className="list-row">
      <span className="date-chip">{dayLabel(date, today)}</span>
      <div className="row-main">
        <div className="row-title">{a.title}</div>
        <div className="row-sub">{memberName(project, a.responsibleId)} · {formatDayMonth(date)}</div>
      </div>
      <StatusBadge status={a.status} dueDate={a.dueDate} />
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>À venir — {horizon} jours</h2>
          <span className="badge in_progress">{total}</span>
        </div>
        <Link className="link" href="/planning">Planning</Link>
      </div>
      {total === 0 ? (
        <div className="empty"><p>Rien à démarrer ni à terminer sous {horizon} jours.</p></div>
      ) : (
        <>
          {toFinish.length > 0 && (
            <>
              <div className="widget-subhead">À terminer</div>
              {toFinish.map((a) => <Row key={`f${a.id}`} a={a} date={a.dueDate!} />)}
            </>
          )}
          {toStart.length > 0 && (
            <>
              <div className="widget-subhead">À démarrer</div>
              {toStart.map((a) => <Row key={`s${a.id}`} a={a} date={a.startDate!} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}
