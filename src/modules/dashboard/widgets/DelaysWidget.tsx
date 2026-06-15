'use client';

import Link from 'next/link';
import { memberName, useProjectActions } from '@/lib/store';
import type { Action } from '@/lib/types';
import { addDaysISO, formatDayMonth, todayISO } from '@/lib/date';
import { StatusBadge } from '@/components/Badges';
import { widgetSetting } from '@/lib/widgets';
import { dayLabel } from './_util';
import type { WidgetProps } from './index';

export function DelaysWidget({ project, instance }: WidgetProps) {
  const actions = useProjectActions(project.id);
  const urgentDays = widgetSetting(instance, 'urgentDays', 3);
  const today = todayISO();
  const byDue = (a: Action, b: Action) => a.dueDate!.localeCompare(b.dueDate!);

  const open = actions.filter((a) => a.status !== 'done');
  const limit = addDaysISO(today, urgentDays);
  const overdue = open.filter((a) => a.dueDate && a.dueDate < today).sort(byDue);
  const urgent = open
    .filter((a) => a.dueDate && a.dueDate >= today && a.dueDate <= limit)
    .sort(byDue);
  const critical = [...overdue, ...urgent];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Retards &amp; urgences</h2>
          <span className={`badge ${overdue.length > 0 ? 'overdue' : critical.length > 0 ? 'crit-medium' : 'done'}`}>
            {critical.length}
          </span>
        </div>
        <Link className="link" href="/actions">Actions</Link>
      </div>
      {critical.length === 0 ? (
        <div className="empty"><p>Aucun retard, aucune urgence sous {urgentDays} jours. 👌</p></div>
      ) : (
        critical.map((a) => {
          const late = a.dueDate! < today;
          return (
            <div key={a.id} className="list-row">
              <span className={`date-chip ${late ? 'danger' : 'warning'}`}>{dayLabel(a.dueDate!, today)}</span>
              <div className="row-main">
                <div className="row-title">{a.title}</div>
                <div className="row-sub">{memberName(project, a.responsibleId)} · {formatDayMonth(a.dueDate!)}</div>
              </div>
              <StatusBadge status={a.status} dueDate={a.dueDate} />
            </div>
          );
        })
      )}
    </div>
  );
}
