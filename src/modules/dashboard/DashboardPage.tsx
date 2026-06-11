'use client';

import { useState } from 'react';
import Link from 'next/link';
import { memberName, useCurrentProject, useProjectActions, useProjectAmdecs } from '@/lib/store';
import type { Action } from '@/lib/types';
import { criticality, criticalityLevel } from '@/lib/types';
import { addDaysISO, diffDays, formatDayMonth, todayISO } from '@/lib/date';
import { CriticalityBadge, StatusBadge } from '@/components/Badges';
import { IconPlus } from '@/components/icons';
import { ActionFormModal } from '@/modules/actions/ActionFormModal';

/**
 * Dashboard de pilotage : 4 zones (retards/urgences, risques, charge équipe,
 * échéances à venir), construites avec les composants standards de l'app —
 * mêmes cartes, mêmes badges, mêmes couleurs que les autres modules.
 */

const URGENT_DAYS = 3;
const FLUX_DAYS = 14;
const OVERLOAD_AT = 5; // actions ouvertes à partir desquelles un membre est en surcharge

/** "J−4" (retard), "AUJ.", "DEMAIN", "J+6". */
function dayLabel(due: string, today: string): string {
  const d = diffDays(today, due);
  if (d < 0) return `J−${-d}`;
  if (d === 0) return 'AUJ.';
  if (d === 1) return 'DEMAIN';
  return `J+${d}`;
}

export function DashboardPage() {
  const project = useCurrentProject();
  const actions = useProjectActions(project?.id);
  const amdecs = useProjectAmdecs(project?.id);
  const [creating, setCreating] = useState(false);

  if (!project) return null;

  const today = todayISO();
  const open = actions.filter((a) => a.status !== 'done');
  const byDue = (a: Action, b: Action) => a.dueDate!.localeCompare(b.dueDate!);

  // Zone 1 — retards puis urgences (échéance sous 3 jours).
  const urgentLimit = addDaysISO(today, URGENT_DAYS);
  const overdue = open.filter((a) => a.dueDate && a.dueDate < today).sort(byDue);
  const urgent = open
    .filter((a) => a.dueDate && a.dueDate >= today && a.dueDate <= urgentLimit)
    .sort(byDue);
  const critical = [...overdue, ...urgent];

  // Zone 2 — risques AMDEC, du plus critique au moins critique.
  const risks = [...amdecs].sort((a, b) => criticality(b) - criticality(a)).slice(0, 5);
  const criticalRiskCount = amdecs.filter(
    (a) => criticalityLevel(criticality(a)) === 'high',
  ).length;

  // Zone 3 — charge : actions ouvertes dont chaque membre est Responsible.
  const loads = project.members.map((m) => ({
    member: m,
    load: open.filter((a) => a.responsibleId === m.id).length,
    late: overdue.filter((a) => a.responsibleId === m.id).length,
  }));
  const overloadedCount = loads.filter((l) => l.load >= OVERLOAD_AT).length;

  // Zone 4 — au-delà des urgences (déjà en zone 1), sous 14 jours.
  const flux = open
    .filter(
      (a) => a.dueDate && a.dueDate > urgentLimit && a.dueDate <= addDaysISO(today, FLUX_DAYS),
    )
    .sort(byDue);

  // État global du projet.
  const hasWatchRisk = amdecs.some((a) => criticalityLevel(criticality(a)) === 'medium');
  const overall =
    overdue.length > 0 || criticalRiskCount > 0
      ? { cls: 'crit-high', label: 'Alerte' }
      : urgent.length > 0 || overloadedCount > 0 || hasWatchRisk
        ? { cls: 'crit-medium', label: 'Vigilance' }
        : { cls: 'crit-low', label: 'Sous contrôle' };

  const respName = (a: Action) => memberName(project, a.responsibleId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p className="subtitle">
            {project.description ?? 'Vue d’ensemble — retards, risques, charge et échéances.'}
          </p>
        </div>
        <div className="header-actions">
          <span className={`badge ${overall.cls}`}>{overall.label}</span>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <IconPlus /> Nouvelle action
          </button>
        </div>
      </div>

      <div className="dash-grid">
        {/* ------------------------------------------------ Retards & urgences */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>Retards &amp; urgences</h2>
              <span className={`badge ${overdue.length > 0 ? 'overdue' : critical.length > 0 ? 'crit-medium' : 'done'}`}>
                {critical.length}
              </span>
            </div>
            <Link className="link" href="/actions">
              Actions
            </Link>
          </div>
          {critical.length === 0 ? (
            <div className="empty">
              <p>Aucun retard, aucune urgence sous {URGENT_DAYS} jours. 👌</p>
            </div>
          ) : (
            critical.map((a) => {
              const late = a.dueDate! < today;
              return (
                <div key={a.id} className="list-row">
                  <span className={`date-chip ${late ? 'danger' : 'warning'}`}>
                    {dayLabel(a.dueDate!, today)}
                  </span>
                  <div className="row-main">
                    <div className="row-title">{a.title}</div>
                    <div className="row-sub">
                      {respName(a)} · {formatDayMonth(a.dueDate!)}
                    </div>
                  </div>
                  <StatusBadge status={a.status} dueDate={a.dueDate} />
                </div>
              );
            })
          )}
        </div>

        {/* ------------------------------------------------ Risques AMDEC */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>Risques</h2>
              <span className={`badge ${criticalRiskCount > 0 ? 'crit-high' : 'crit-low'}`}>
                {criticalRiskCount} critique{criticalRiskCount > 1 ? 's' : ''}
              </span>
            </div>
            <Link className="link" href="/amdec">
              AMDEC
            </Link>
          </div>
          {risks.length === 0 ? (
            <div className="empty">
              <p>Aucune analyse AMDEC. Identifiez vos premiers risques.</p>
            </div>
          ) : (
            risks.map((r) => (
              <div key={r.id} className="list-row">
                <div className="row-main">
                  <div className="row-title">
                    {r.element} — {r.failureMode}
                  </div>
                  <div className="row-sub">
                    Cause : {r.cause} · {actions.filter((a) => a.amdecId === r.id).length}{' '}
                    action(s) corrective(s)
                  </div>
                </div>
                <CriticalityBadge score={criticality(r)} />
              </div>
            ))
          )}
        </div>

        {/* ------------------------------------------------ Charge équipe */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>Charge équipe</h2>
              <span className={`badge ${overloadedCount > 0 ? 'crit-high' : 'crit-low'}`}>
                {overloadedCount} surcharge{overloadedCount > 1 ? 's' : ''}
              </span>
            </div>
            <Link className="link" href="/raci">
              RACI
            </Link>
          </div>
          {loads.length === 0 ? (
            <div className="empty">
              <p>Aucun membre — ajoutez l&apos;équipe dans le module RACI.</p>
            </div>
          ) : (
            loads.map(({ member, load, late }) => {
              const lvl = load >= OVERLOAD_AT ? 'over' : load >= 3 ? 'warn' : 'ok';
              const badgeCls =
                load >= OVERLOAD_AT ? 'crit-high' : load >= 3 ? 'crit-medium' : 'crit-low';
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
                  <span className={`badge ${badgeCls}`}>
                    {load}
                    {load >= OVERLOAD_AT ? ' · surcharge' : ''}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* ------------------------------------------------ À venir */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>À venir — {FLUX_DAYS} jours</h2>
              <span className="badge in_progress">{flux.length}</span>
            </div>
            <Link className="link" href="/planning">
              Planning
            </Link>
          </div>
          {flux.length === 0 ? (
            <div className="empty">
              <p>Rien à l&apos;horizon sous {FLUX_DAYS} jours.</p>
            </div>
          ) : (
            flux.map((a) => (
              <div key={a.id} className="list-row">
                <span className="date-chip">{dayLabel(a.dueDate!, today)}</span>
                <div className="row-main">
                  <div className="row-title">{a.title}</div>
                  <div className="row-sub">
                    {respName(a)} · {formatDayMonth(a.dueDate!)}
                  </div>
                </div>
                <StatusBadge status={a.status} dueDate={a.dueDate} />
              </div>
            ))
          )}
        </div>
      </div>

      {creating && <ActionFormModal project={project} onClose={() => setCreating(false)} />}
    </div>
  );
}
