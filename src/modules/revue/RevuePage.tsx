'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  memberName,
  useCurrentProject,
  useProjectActions,
  useProjectAmdecs,
  useProjectRevues,
  useRevueDecisions,
  useWorkspace,
} from '@/lib/store';
import type { Action, AmdecEntry, ActionStatus, Id, Project, Revue, RevueSnapshot } from '@/lib/types';
import { STATUS_LABELS, criticality, criticalityLevel, residualCriticality } from '@/lib/types';
import { todayISO, diffDays, formatDate, isOverdue } from '@/lib/date';
import { Modal } from '@/components/Modal';
import { CriticalityBadge } from '@/components/Badges';
import { IconPlus, IconTrash } from '@/components/icons';

/* --- Dates ------------------------------------------------------------------ */

const frDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const frDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

const todayStr = () => new Date().toISOString().slice(0, 10);

/* --- Calcul du delta depuis la dernière revue ------------------------------- */

interface Delta {
  doneNow: Action[];
  newlyDone: Action[];
  late: Action[];
  newActions: Action[];
  newRisks: AmdecEntry[];
  planningPct: number;
  prevPct: number | null;
}

function lastClosedRevue(revues: Revue[], excludeId?: Id): Revue | null {
  return (
    revues
      .filter((r) => r.status === 'cloturee' && r.id !== excludeId)
      .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))[0] ?? null
  );
}

function computeDelta(actions: Action[], amdecs: AmdecEntry[], last: Revue | null): Delta {
  const today = todayStr();
  const doneNow = actions.filter((a) => a.status === 'done');
  const prevDone = new Set(last?.snapshot?.doneActionIds ?? []);
  const newlyDone = last ? doneNow.filter((a) => !prevDone.has(a.id)) : doneNow;
  const late = actions.filter((a) => a.status !== 'done' && a.dueDate && a.dueDate < today);
  const cutoff = last?.closedAt;
  const newActions = cutoff ? actions.filter((a) => a.createdAt > cutoff) : [];
  const newRisks = cutoff ? amdecs.filter((a) => a.createdAt > cutoff) : [];
  const planningPct = actions.length ? Math.round((doneNow.length / actions.length) * 100) : 0;
  const prevPct = last?.snapshot?.planningPct ?? null;
  return { doneNow, newlyDone, late, newActions, newRisks, planningPct, prevPct };
}

function DeltaChips({ delta, hasPrevious }: { delta: Delta; hasPrevious: boolean }) {
  const diff = delta.prevPct != null ? delta.planningPct - delta.prevPct : null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <span className="badge done">{delta.newlyDone.length} terminée(s)</span>
      <span className="badge overdue">{delta.late.length} en retard</span>
      <span className="badge in_progress">
        Planning {delta.planningPct}%{diff != null ? ` (${diff >= 0 ? '+' : ''}${diff})` : ''}
      </span>
      {hasPrevious && <span className="badge crit-medium">{delta.newRisks.length} nouveau(x) risque(s)</span>}
    </div>
  );
}

/* --- Points d'attention (briefing de pilotage) ------------------------------ */
/**
 * Croise planning + actions + risques pour signaler ce qui mérite l'attention
 * du chef de projet — calculé à partir des données existantes, sans saisie.
 */

type AttentionSeverity = 'high' | 'medium';

interface Attention {
  key: string;
  severity: AttentionSeverity;
  tag: string;
  title: string;
  detail: string;
  href: string;
  sortKey: number;
}

/** Fenêtre (en jours) pour « échéance imminente ». */
const SOON_WINDOW_DAYS = 15;

function computeAttentions(
  actions: Action[],
  amdecs: AmdecEntry[],
  project: Project,
  lastClosed: Revue | null,
): Attention[] {
  const today = todayISO();
  const items: Attention[] = [];

  for (const a of actions) {
    // Retards : échéance passée, pas terminée.
    if (isOverdue(a.dueDate, a.status)) {
      const lateDays = -diffDays(today, a.dueDate!);
      items.push({
        key: `late-${a.id}`,
        severity: 'high',
        tag: 'Retard',
        title: a.title,
        detail: `${memberName(project, a.responsibleId)} · en retard de ${lateDays} j (échéance ${formatDate(a.dueDate)})`,
        href: '/actions',
        sortKey: 1000 + lateDays,
      });
      continue;
    }
    // Échéances imminentes : dans la fenêtre, pas terminée.
    if (a.status !== 'done' && a.dueDate) {
      const d = diffDays(today, a.dueDate);
      if (d >= 0 && d <= SOON_WINDOW_DAYS) {
        const when = d === 0 ? "aujourd'hui" : d === 1 ? 'demain' : `dans ${d} j`;
        items.push({
          key: `soon-${a.id}`,
          severity: d <= 3 ? 'high' : 'medium',
          tag: 'Échéance',
          title: a.title,
          detail: `${memberName(project, a.responsibleId)} · ${when} (${formatDate(a.dueDate)})`,
          href: '/actions',
          sortKey: 200 - d,
        });
      }
    }
  }

  // Risques critiques (criticité ≥ seuil « élevé ») sans plan d'action, ou à re-coter.
  for (const r of amdecs) {
    const score = criticality(r);
    if (criticalityLevel(score) !== 'high') continue;
    const linked = actions.filter((a) => a.amdecId === r.id);
    if (linked.length === 0) {
      items.push({
        key: `risk-noplan-${r.id}`,
        severity: 'high',
        tag: 'Risque',
        title: `${r.element} — ${r.failureMode}`,
        detail: `Criticité ${score} · aucune action corrective`,
        href: '/amdec',
        sortKey: 500 + score,
      });
    } else if (linked.every((a) => a.status === 'done') && residualCriticality(r) === null) {
      items.push({
        key: `risk-recote-${r.id}`,
        severity: 'medium',
        tag: 'Risque',
        title: `${r.element} — ${r.failureMode}`,
        detail: `Criticité ${score} · actions terminées, criticité résiduelle à réévaluer`,
        href: '/amdec',
        sortKey: 300 + score,
      });
    }
  }

  // Jalons menacés : un jalon non terminé dont des prérequis (dépendances) sont
  // en retard, ou planifiés après lui.
  for (const m of actions) {
    if (!m.milestone || m.status === 'done') continue;
    const prereqIds = m.dependsOnIds ?? [];
    if (prereqIds.length === 0) continue;
    const openPrereqs = actions.filter((a) => prereqIds.includes(a.id) && a.status !== 'done');
    const blocking = openPrereqs.filter(
      (p) => isOverdue(p.dueDate, p.status) || (!!m.dueDate && !!p.dueDate && p.dueDate > m.dueDate),
    );
    if (blocking.length === 0) continue;
    const soon = m.dueDate ? diffDays(today, m.dueDate) : null;
    const urgent = blocking.some((p) => isOverdue(p.dueDate, p.status)) || (soon !== null && soon <= SOON_WINDOW_DAYS);
    items.push({
      key: `milestone-${m.id}`,
      severity: urgent ? 'high' : 'medium',
      tag: 'Jalon',
      title: m.title,
      detail: `${blocking.length} action(s) prérequise(s) en retard ou non terminée(s)${m.dueDate ? ` · jalon le ${formatDate(m.dueDate)}` : ''}`,
      href: '/planning',
      sortKey: 700 + (soon !== null ? Math.max(0, 60 - soon) : 0),
    });
  }

  // Surcharge : un responsable avec beaucoup d'actions à traiter sous 7 jours
  // (retards inclus).
  const load = new Map<Id, number>();
  for (const a of actions) {
    if (a.status === 'done' || !a.dueDate) continue;
    if (diffDays(today, a.dueDate) <= 7) load.set(a.responsibleId, (load.get(a.responsibleId) ?? 0) + 1);
  }
  for (const [memberId, count] of load) {
    if (count < 4) continue;
    items.push({
      key: `overload-${memberId}`,
      severity: count >= 6 ? 'high' : 'medium',
      tag: 'Surcharge',
      title: memberName(project, memberId),
      detail: `${count} actions à traiter cette semaine (retards inclus)`,
      href: '/actions',
      sortKey: 400 + count,
    });
  }

  // Vitesse : avancement au point mort depuis la dernière revue (≥ 7 j d'écart).
  if (lastClosed?.snapshot && lastClosed.closedAt) {
    const prevPct = lastClosed.snapshot.planningPct ?? 0;
    const doneNow = actions.filter((a) => a.status === 'done').length;
    const nowPct = actions.length ? Math.round((doneNow / actions.length) * 100) : 0;
    const daysSince = diffDays(lastClosed.closedAt.slice(0, 10), today);
    const stalled = nowPct - prevPct <= 0 && nowPct < 100 && actions.some((a) => a.status !== 'done');
    if (stalled && daysSince >= 7) {
      const deltaPct = nowPct - prevPct;
      items.push({
        key: 'velocity-stalled',
        severity: daysSince >= 14 ? 'high' : 'medium',
        tag: 'Avancement',
        title: 'Avancement au point mort',
        detail: `${deltaPct === 0 ? '+0' : deltaPct} pt depuis la dernière revue (il y a ${daysSince} j)`,
        href: '/dashboard',
        sortKey: 350,
      });
    }
  }

  const rank = (s: AttentionSeverity) => (s === 'high' ? 0 : 1);
  return items.sort((a, b) => rank(a.severity) - rank(b.severity) || b.sortKey - a.sortKey);
}

function AttentionsPanel({ items }: { items: Attention[] }) {
  const high = items.filter((i) => i.severity === 'high').length;
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <strong>Points d’attention</strong>
        <span className="row-sub">
          {items.length === 0
            ? 'rien à signaler'
            : `${items.length} point${items.length > 1 ? 's' : ''}${high ? ` · ${high} urgent${high > 1 ? 's' : ''}` : ''}`}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <p>Rien à signaler — pas de retard, d’échéance imminente ni de risque critique non traité.</p>
        </div>
      ) : (
        items.map((i) => (
          <div key={i.key} className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`badge ${i.severity === 'high' ? 'overdue' : 'crit-medium'}`} style={{ flexShrink: 0 }}>
              {i.tag}
            </span>
            <div className="row-main" style={{ flex: 1 }}>
              <div className="row-title" style={{ whiteSpace: 'normal' }}>
                {i.title}
              </div>
              <div className="row-sub">{i.detail}</div>
            </div>
            <Link href={i.href} className="btn btn-sm" style={{ flexShrink: 0 }}>
              Voir
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

/* --- Arbre risques → actions correctives (réduction de la criticité) -------- */

/** Met en avant la criticité avant → après réduction + barre de progression. */
function RiskReduction({
  initial,
  residual,
  hasActions,
}: {
  initial: number;
  residual: number | null;
  hasActions: boolean;
}) {
  const reduction = residual != null ? Math.round((1 - residual / initial) * 100) : 0;
  return (
    <div style={{ marginTop: 6, width: '100%' }}>
      <div className="tree-badges" style={{ flexWrap: 'wrap' }}>
        <CriticalityBadge score={initial} />
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }} aria-hidden="true">
          →
        </span>
        {residual != null ? (
          <>
            <CriticalityBadge score={residual} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: reduction > 0 ? 'var(--success)' : 'var(--text-muted)',
              }}
            >
              {reduction > 0 ? `−${reduction} %` : '±0 %'}
            </span>
          </>
        ) : (
          <span className="badge" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
            après : {hasActions ? 'à évaluer' : 'à traiter'}
          </span>
        )}
      </div>
      <div className="cost-bar" style={{ marginTop: 6 }} title={`Réduction de la criticité : ${reduction} %`}>
        <span
          className="cost-bar-fill"
          style={{ width: `${Math.max(0, Math.min(reduction, 100))}%`, background: 'var(--success)' }}
        />
      </div>
    </div>
  );
}

function RisksTree({
  amdecs,
  actions,
  project,
  cutoff,
}: {
  amdecs: AmdecEntry[];
  actions: Action[];
  project: Project;
  cutoff?: string;
}) {
  const risks = [...amdecs].sort((a, b) => criticality(b) - criticality(a));
  if (risks.length === 0) {
    return (
      <div className="empty">
        <p>Aucun risque AMDEC saisi.</p>
      </div>
    );
  }
  return (
    <div className="tree-wrap">
      <div className="tree">
        <ul>
          {risks.map((r) => {
            const linked = actions.filter((a) => a.amdecId === r.id);
            const isNew = cutoff ? r.createdAt > cutoff : false;
            return (
              <li key={r.id}>
                <div className="tree-card" data-kind="risk" style={{ width: 340, maxWidth: 340 }}>
                  <span className="tree-kind">Risque AMDEC{isNew ? ' · nouveau' : ''}</span>
                  <span className="tree-label">
                    {r.element} — {r.failureMode}
                  </span>
                  <span className="tree-sub">cause : {r.cause}</span>
                  <RiskReduction
                    initial={criticality(r)}
                    residual={residualCriticality(r)}
                    hasActions={linked.length > 0}
                  />
                </div>
                {linked.length > 0 && (
                  <ul>
                    {linked.map((a) => (
                      <li key={a.id}>
                        <div className="tree-card" data-kind="action">
                          <span className="tree-kind">Action · {STATUS_LABELS[a.status]}</span>
                          <span className="tree-label">{a.title}</span>
                          <span className="tree-sub">{memberName(project, a.responsibleId)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* --- Page (aiguillage landing / animation) ---------------------------------- */

export function RevuePage() {
  const project = useCurrentProject();
  const revues = useProjectRevues(project?.id);
  const actions = useProjectActions(project?.id);
  const amdecs = useProjectAmdecs(project?.id);
  const { startRevue, deleteRevue } = useWorkspace();
  const [crRevueId, setCrRevueId] = useState<Id | null>(null);

  if (!project) return null;

  const openRevue = revues.find((r) => r.status === 'en_cours') ?? null;
  if (openRevue) return <RevueAnimation revue={openRevue} onClosed={(id) => setCrRevueId(id)} />;

  const closed = revues.filter((r) => r.status === 'cloturee');
  const last = lastClosedRevue(revues);
  const delta = computeDelta(actions, amdecs, last);
  const attentions = computeAttentions(actions, amdecs, project, last);
  const crRevue = revues.find((r) => r.id === crRevueId) ?? null;

  const launch = () => {
    void startRevue(project.id, `Revue #${revues.length + 1}`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Revue de projet</h1>
          <p className="subtitle">
            Ton briefing de pilotage : ce qui mérite ton attention maintenant, calculé depuis ton planning, tes
            actions et tes risques. Lance une revue pour le dérouler en réunion.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={launch}>
            <IconPlus /> Lancer la revue
          </button>
        </div>
      </div>

      <AttentionsPanel items={attentions} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <strong>Depuis la dernière revue</strong>
          <span className="row-sub">{last ? frDate(last.closedAt) : 'Première revue — rien à comparer'}</span>
        </div>
        <div className="card-body">
          <DeltaChips delta={delta} hasPrevious={!!last} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <strong>Revues passées</strong>
          <span className="row-sub">{closed.length}</span>
        </div>
        {closed.length === 0 ? (
          <div className="empty">
            <p>Aucune revue clôturée pour l’instant.</p>
          </div>
        ) : (
          closed.map((r) => (
            <div key={r.id} className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="row-main" style={{ flex: 1 }}>
                <div className="row-title">{r.title}</div>
                <div className="row-sub">
                  Clôturée le {frDate(r.closedAt)} · {r.snapshot?.doneActionIds.length ?? 0} action(s) terminée(s) ·
                  planning {r.snapshot?.planningPct ?? 0}%
                </div>
              </div>
              <button className="btn btn-sm" onClick={() => setCrRevueId(r.id)}>
                Voir le compte-rendu
              </button>
              <button
                className="icon-btn danger"
                aria-label="Supprimer la revue"
                onClick={() => {
                  if (window.confirm(`Supprimer la revue « ${r.title} » et son compte-rendu ?`)) void deleteRevue(r.id);
                }}
              >
                <IconTrash />
              </button>
            </div>
          ))
        )}
      </div>

      {crRevue && <CrModal revue={crRevue} onClose={() => setCrRevueId(null)} />}
    </div>
  );
}

/* --- Mode animation (revue en cours) ---------------------------------------- */

const STATUS_ORDER: ActionStatus[] = ['todo', 'in_progress', 'done'];

function actionRank(a: Action, today: string): number {
  if (a.status !== 'done' && a.dueDate && a.dueDate < today) return 0; // en retard d'abord
  if (a.status === 'in_progress') return 1;
  if (a.status === 'todo') return 2;
  return 3; // terminées en dernier
}

function RevueAnimation({ revue, onClosed }: { revue: Revue; onClosed: (id: Id) => void }) {
  const project = useCurrentProject();
  const actions = useProjectActions(project?.id);
  const amdecs = useProjectAmdecs(project?.id);
  const revues = useProjectRevues(project?.id);
  const decisions = useRevueDecisions(revue.id);
  const { setActionStatus, addAction, addRevueDecision, deleteRevueDecision, closeRevue } = useWorkspace();

  const [decisionText, setDecisionText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newResp, setNewResp] = useState('');
  const [newDue, setNewDue] = useState('');

  if (!project) return null;

  const today = todayStr();
  const last = lastClosedRevue(revues, revue.id);
  const delta = computeDelta(actions, amdecs, last);

  const sortedActions = [...actions].sort(
    (a, b) => actionRank(a, today) - actionRank(b, today) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
  );
  const cutoff = last?.closedAt;

  const addQuick = () => {
    if (!newTitle.trim() || !newResp) return;
    void addAction(project.id, {
      title: newTitle.trim(),
      description: '',
      responsibleId: newResp,
      consultedIds: [],
      informedIds: [],
      status: 'todo',
      dueDate: newDue || undefined,
    });
    setNewTitle('');
    setNewDue('');
  };

  const addDecision = () => {
    if (!decisionText.trim()) return;
    void addRevueDecision(revue.id, project.id, decisionText.trim());
    setDecisionText('');
  };

  const close = async () => {
    const snapshot: RevueSnapshot = {
      doneActionIds: delta.doneNow.map((a) => a.id),
      totalActions: actions.length,
      amdecCount: amdecs.length,
      planningPct: delta.planningPct,
    };
    await closeRevue(revue.id, snapshot);
    onClosed(revue.id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{revue.title}</h1>
          <p className="subtitle">Revue en cours — mets à jour en direct, puis clôture pour générer le compte-rendu.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Clôturer la revue et générer le compte-rendu ?')) void close();
            }}
          >
            Clôturer la revue
          </button>
        </div>
      </div>

      <AttentionsPanel items={computeAttentions(actions, amdecs, project, last)} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <strong>Depuis la dernière revue</strong>
          <span className="row-sub">{last ? frDate(last.closedAt) : 'Première revue'}</span>
        </div>
        <div className="card-body">
          <DeltaChips delta={delta} hasPrevious={!!last} />
        </div>
      </div>

      {/* Actions — retards d'abord */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <strong>Actions</strong>
          <span className="row-sub">retards en premier</span>
        </div>
        {sortedActions.length === 0 ? (
          <div className="empty">
            <p>Aucune action pour l’instant. Ajoute-en une ci-dessous.</p>
          </div>
        ) : (
          sortedActions.map((a) => {
            const isLate = a.status !== 'done' && a.dueDate && a.dueDate < today;
            const isNew = cutoff ? a.createdAt > cutoff : false;
            return (
              <div key={a.id} className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="row-main" style={{ flex: 1 }}>
                  <div className="row-title" style={{ whiteSpace: 'normal' }}>
                    {a.title}
                    {isNew && (
                      <span className="badge source" style={{ marginLeft: 8 }}>
                        Nouveau
                      </span>
                    )}
                  </div>
                  <div className="row-sub">
                    {memberName(project, a.responsibleId)}
                    {a.dueDate ? ` · échéance ${frDate(a.dueDate)}` : ''}
                  </div>
                </div>
                {isLate && <span className="date-chip danger">En retard</span>}
                <div className="segmented">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      className={a.status === s ? 'active' : ''}
                      onClick={() => void setActionStatus(a.id, s)}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
        <div className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nouvelle action…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuick()}
            style={{ flex: 1, minWidth: 160 }}
          />
          <select value={newResp} onChange={(e) => setNewResp(e.target.value)} aria-label="Responsable">
            <option value="">Responsable…</option>
            {project.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} aria-label="Échéance" />
          <button className="btn btn-sm btn-primary" onClick={addQuick} disabled={!newTitle.trim() || !newResp}>
            <IconPlus /> Ajouter
          </button>
        </div>
        {project.members.length === 0 && (
          <div className="card-body">
            <p className="form-hint">Ajoute d’abord des membres à l’équipe (menu RACI ou Accès) pour assigner une action.</p>
          </div>
        )}
      </div>

      {/* Risques — arbre risque → actions correctives, réduction de la criticité */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <strong>Risques</strong>
          <span className="row-sub">criticité avant → après réduction</span>
        </div>
        <RisksTree amdecs={amdecs} actions={actions} project={project} cutoff={cutoff} />
      </div>

      {/* Décisions captées */}
      <div className="card">
        <div className="card-header">
          <strong>Décisions captées</strong>
          <span className="row-sub">{decisions.length}</span>
        </div>
        {decisions.map((d) => (
          <div key={d.id} className="list-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div className="row-main" style={{ flex: 1 }}>
              <div className="row-title" style={{ whiteSpace: 'normal' }}>
                {d.content}
              </div>
              <div className="row-sub">
                {frDateTime(d.createdAt)} · {d.authorName}
              </div>
            </div>
            <button
              className="icon-btn danger"
              aria-label="Supprimer la décision"
              onClick={() => void deleteRevueDecision(d.id)}
            >
              <IconTrash />
            </button>
          </div>
        ))}
        <div className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="Noter une décision…"
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDecision()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-sm btn-primary" onClick={addDecision} disabled={!decisionText.trim()}>
            Noter
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Compte-rendu (revue clôturée) ------------------------------------------ */

function CrModal({ revue, onClose }: { revue: Revue; onClose: () => void }) {
  const decisions = useRevueDecisions(revue.id);
  const snap = revue.snapshot;
  return (
    <Modal
      title={`Compte-rendu · ${revue.title}`}
      onClose={onClose}
      footer={
        <button className="btn" onClick={onClose}>
          Fermer
        </button>
      }
    >
      <p className="row-sub">Clôturée le {frDateTime(revue.closedAt)}</p>
      <div className="stat-row" style={{ margin: '12px 0' }}>
        <div className="card stat-card">
          <div className="stat-value">{snap?.doneActionIds.length ?? 0}</div>
          <div className="stat-label">Actions terminées</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{snap?.planningPct ?? 0} %</div>
          <div className="stat-label">Avancement planning</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{snap?.amdecCount ?? 0}</div>
          <div className="stat-label">Risques suivis</div>
        </div>
      </div>
      <h3 style={{ fontSize: 15, margin: '8px 0' }}>Décisions</h3>
      {decisions.length === 0 ? (
        <p className="row-sub">Aucune décision captée pendant cette revue.</p>
      ) : (
        decisions.map((d) => (
          <div key={d.id} className="list-row">
            <div className="row-main">
              <div className="row-title" style={{ whiteSpace: 'normal' }}>
                {d.content}
              </div>
              <div className="row-sub">
                {frDateTime(d.createdAt)} · {d.authorName}
              </div>
            </div>
          </div>
        ))
      )}
    </Modal>
  );
}
