'use client';

import Link from 'next/link';
import { useProjectActions } from '@/lib/store';
import { todayISO } from '@/lib/date';
import type { WidgetProps } from './index';

const OVERLOAD_AT = 5;

export function TeamLoadWidget({ project }: WidgetProps) {
  const actions = useProjectActions(project.id);
  const today = todayISO();
  const open = actions.filter((a) => a.status !== 'done');

  const loads = project.members.map((m) => ({
    member: m,
    load: open.filter((a) => a.responsibleId === m.id).length,
    late: open.filter((a) => a.responsibleId === m.id && a.dueDate && a.dueDate < today).length,
  }));
  const overloaded = loads.filter((l) => l.load >= OVERLOAD_AT).length;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Charge équipe</h2>
          <span className={`badge ${overloaded > 0 ? 'crit-high' : 'crit-low'}`}>
            {overloaded} surcharge{overloaded > 1 ? 's' : ''}
          </span>
        </div>
        <Link className="link" href="/raci">RACI</Link>
      </div>
      {loads.length === 0 ? (
        <div className="empty"><p>Aucun membre — ajoutez l&apos;équipe dans le module RACI.</p></div>
      ) : (
        loads.map(({ member, load, late }) => {
          const lvl = load >= OVERLOAD_AT ? 'over' : load >= 3 ? 'warn' : 'ok';
          const badgeCls = load >= OVERLOAD_AT ? 'crit-high' : load >= 3 ? 'crit-medium' : 'crit-low';
          return (
            <div key={member.id} className="list-row">
              <div className="row-main">
                <div className="row-title">{member.name}</div>
                <div className="row-sub">{member.role || '—'}</div>
              </div>
              {late > 0 && <span className="badge overdue">{late} en retard</span>}
              <span className="battery" title={`${load} action(s) ouverte(s)`}>
                {Array.from({ length: OVERLOAD_AT }, (_, i) => (
                  <i key={i} className={i < Math.min(load, OVERLOAD_AT) ? lvl : ''} />
                ))}
              </span>
              <span className={`badge ${badgeCls}`}>{load}{load >= OVERLOAD_AT ? ' · surcharge' : ''}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
