'use client';

import { useEffect, useState } from 'react';
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
import type {
  Action,
  AmdecEntry,
  ActionStatus,
  Id,
  Project,
  Revue,
  RevueActionLine,
  RevueSnapshot,
} from '@/lib/types';
import { STATUS_LABELS, criticality, criticalityLevel, residualCriticality } from '@/lib/types';
import { todayISO, diffDays, formatDate, isOverdue } from '@/lib/date';
import { CriticalityBadge } from '@/components/Badges';
import { IconPlus, IconTrash } from '@/components/icons';
import { dayLabel } from '@/modules/dashboard/widgets/_util';
import { RevueCrView } from './RevueCrView';

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

      {crRevue && (
        <RevueCrView revue={crRevue} projectName={project.name} onClose={() => setCrRevueId(null)} />
      )}
    </div>
  );
}

/* --- Mode animation (revue en cours) ---------------------------------------- */

const STATUS_ORDER: ActionStatus[] = ['todo', 'in_progress', 'done'];

/** Sommaire du mode présentateur : une section = un sujet déroulé en réunion. */
const SECTIONS = [
  { key: 'synthese', label: 'Synthèse' },
  { key: 'actions', label: 'Actions' },
  { key: 'risques', label: 'Risques' },
  { key: 'decisions', label: 'Décisions' },
] as const;

function RevueAnimation({ revue, onClosed }: { revue: Revue; onClosed: (id: Id) => void }) {
  const project = useCurrentProject();
  const actions = useProjectActions(project?.id);
  const amdecs = useProjectAmdecs(project?.id);
  const revues = useProjectRevues(project?.id);
  const decisions = useRevueDecisions(revue.id);
  const {
    setActionStatus,
    addAction,
    addRevueDecision,
    deleteRevueDecision,
    closeRevue,
    updateRevueSnapshot,
    userId,
    userEmail,
  } = useWorkspace();

  const [decisionText, setDecisionText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newResp, setNewResp] = useState('');
  const [newDue, setNewDue] = useState('');
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  /** Plein écran « présentateur » par défaut : une revue s'ouvre en mode réunion. */
  const [presenterMode, setPresenterMode] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  /** Horloge de réunion : rafraîchie chaque minute pour la durée écoulée. */
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!presenterMode) return;
    const onKey = (e: KeyboardEvent) => {
      // Une modale ouverte (fiche action) garde la priorité sur le clavier.
      if (document.querySelector('.modal-overlay')) return;
      if (e.key === 'Escape') {
        setPresenterMode(false);
        return;
      }
      // Les flèches servent à la saisie quand on écrit une action / une décision.
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') setActiveSection((i) => Math.min(SECTIONS.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setActiveSection((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [presenterMode]);

  if (!project) return null;

  const today = todayStr();
  const last = lastClosedRevue(revues, revue.id);
  const delta = computeDelta(actions, amdecs, last);
  const cutoff = last?.closedAt;

  const elapsedMin = Math.max(0, Math.round((now - new Date(revue.createdAt).getTime()) / 60_000));
  const elapsedLabel =
    elapsedMin < 60 ? `${elapsedMin} min` : `${Math.floor(elapsedMin / 60)} h ${String(elapsedMin % 60).padStart(2, '0')}`;
  const sinceLast = last?.closedAt ? diffDays(last.closedAt.slice(0, 10), today) : null;

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

  /* --- Présents (persistés au fil de la réunion, cf. updateRevueSnapshot) --- */
  const participantIds = revue.snapshot?.participantIds ?? [];
  const guests = revue.snapshot?.guests ?? [];

  const toggleParticipant = (id: Id) => {
    const next = participantIds.includes(id)
      ? participantIds.filter((x) => x !== id)
      : [...participantIds, id];
    void updateRevueSnapshot(revue.id, { participantIds: next });
  };

  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    const email = guestEmail.trim();
    void updateRevueSnapshot(revue.id, {
      guests: [...guests, { id: crypto.randomUUID(), name, email: email || undefined }],
    });
    setGuestName('');
    setGuestEmail('');
    setAddingGuest(false);
  };

  const removeGuest = (id: Id) =>
    void updateRevueSnapshot(revue.id, { guests: guests.filter((g) => g.id !== id) });

  const close = async () => {
    const line = (a: Action): RevueActionLine => ({
      title: a.title,
      responsible: memberName(project, a.responsibleId),
      dueDate: a.dueDate,
    });
    /* Snapshot enrichi : le CR se lira uniquement ici, donc tout ce qu'il doit
       montrer est gelé maintenant (libellés compris). */
    const snapshot: RevueSnapshot = {
      doneActionIds: delta.doneNow.map((a) => a.id),
      totalActions: actions.length,
      amdecCount: amdecs.length,
      planningPct: delta.planningPct,
      // Même règle de nom que les décisions captées (cf. addRevueDecision).
      closedByName: project.members.find((m) => m.userId === userId)?.name || userEmail || undefined,
      durationMin: elapsedMin,
      prevRevueAt: last?.closedAt,
      prevPlanningPct: delta.prevPct ?? undefined,
      createdActions: actions.filter((a) => a.createdAt > revue.createdAt).map(line),
      doneSince: delta.newlyDone.map(line),
      lateActions: lateList.map(line),
      openRisks: criticalRisks.map((r) => ({
        label: `${r.element} — ${r.failureMode}`,
        score: effectiveCrit(r),
        hasPlan: actions.some((a) => a.amdecId === r.id),
      })),
    };
    await closeRevue(revue.id, snapshot);
    onClosed(revue.id);
  };

  const confirmClose = () => {
    if (window.confirm('Clôturer la revue et générer le compte-rendu ?')) void close();
  };

  const attentions = computeAttentions(actions, amdecs, project, last);

  /* --- Statistiques de la revue (toutes dérivées des données déjà chargées) --- */
  const open = actions.filter((a) => a.status !== 'done');
  const doneCount = actions.length - open.length;
  const inProgressCount = actions.filter((a) => a.status === 'in_progress').length;
  const todoCount = actions.length - doneCount - inProgressCount;
  const lateList = open
    .filter((a) => a.dueDate && a.dueDate < today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const weekList = open
    .filter((a) => a.dueDate && a.dueDate >= today && diffDays(today, a.dueDate) <= 7)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const laterList = open
    .filter((a) => a.dueDate && diffDays(today, a.dueDate) > 7)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const undatedList = open.filter((a) => !a.dueDate);
  const avgLateDays = lateList.length
    ? Math.round(lateList.reduce((s, a) => s + -diffDays(today, a.dueDate!), 0) / lateList.length)
    : 0;

  const effectiveCrit = (r: AmdecEntry) => residualCriticality(r) ?? criticality(r);
  const criticalRisks = amdecs.filter((r) => criticalityLevel(effectiveCrit(r)) === 'high');
  const risksNoPlan = amdecs.filter((r) => !actions.some((a) => a.amdecId === r.id));
  const reducedRisks = amdecs.filter((r) => residualCriticality(r) !== null);
  const avgReduction = reducedRisks.length
    ? Math.round(
        (reducedRisks.reduce((s, r) => s + (1 - residualCriticality(r)! / criticality(r)), 0) /
          reducedRisks.length) *
          100,
      )
    : 0;
  const createdDuringRevue = actions.filter((a) => a.createdAt > revue.createdAt).length;

  /* Compteurs du sommaire : ce qui mérite l'attention dans chaque section. */
  const sectionBadges = [
    { value: attentions.filter((i) => i.severity === 'high').length, tone: 'overdue' },
    { value: lateList.length, tone: 'overdue' },
    { value: criticalRisks.length, tone: 'crit-medium' },
    { value: decisions.length, tone: '' },
  ];

  const pct = (n: number) => (actions.length ? `${(n / actions.length) * 100}%` : '0%');

  const attendeeCount = participantIds.length + guests.length;

  const syntheseBlock = (
    <>
      {/* Tour de table d'ouverture — figé dans le compte-rendu. */}
      <div className="card">
        <div className="card-header">
          <strong>Présents</strong>
          <span className="row-sub">
            {attendeeCount === 0 ? 'personne de coché' : `${attendeeCount} personne(s)`}
          </span>
        </div>
        <div className="card-body">
          <div className="revue-attendees">
            {project.members.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`revue-attendee${participantIds.includes(m.id) ? ' on' : ''}`}
                onClick={() => toggleParticipant(m.id)}
                aria-pressed={participantIds.includes(m.id)}
              >
                {m.name}
              </button>
            ))}
            {guests.map((g) => (
              <span key={g.id} className="revue-attendee on guest">
                {g.name}
                {g.email ? <em>{g.email}</em> : null}
                <button
                  type="button"
                  className="revue-attendee-x"
                  onClick={() => removeGuest(g.id)}
                  aria-label={`Retirer ${g.name}`}
                >
                  ✕
                </button>
              </span>
            ))}
            {!addingGuest && (
              <button type="button" className="revue-attendee add" onClick={() => setAddingGuest(true)}>
                <IconPlus /> Invité
              </button>
            )}
          </div>

          {addingGuest && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Nom de l’invité"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                autoFocus
                style={{ flex: '1 1 200px', width: 'auto' }}
              />
              <input
                type="text"
                placeholder="Email (facultatif)"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                style={{ flex: '1 1 220px', width: 'auto' }}
              />
              <button className="btn btn-sm btn-primary" onClick={addGuest} disabled={!guestName.trim()}>
                Ajouter
              </button>
              <button className="btn btn-sm" onClick={() => setAddingGuest(false)}>
                Annuler
              </button>
            </div>
          )}
          {project.members.length === 0 && guests.length === 0 && (
            <p className="form-hint" style={{ marginTop: 10 }}>
              Aucun membre dans l’équipe — ajoutez-en via RACI ou Accès, ou notez un invité.
            </p>
          )}
        </div>
      </div>

      <div className="kpi-row kpi-row-4">
        <div className="card stat-card">
          <div className="stat-value">{delta.planningPct} %</div>
          <div className="stat-label">Avancement</div>
          {delta.prevPct != null ? (
            <div className={`revue-stat-sub ${delta.planningPct >= delta.prevPct ? 'up' : 'down'}`}>
              {delta.planningPct >= delta.prevPct ? '+' : ''}
              {delta.planningPct - delta.prevPct} pts depuis le {frDate(last?.closedAt)}
            </div>
          ) : (
            <div className="revue-stat-sub">première revue</div>
          )}
        </div>
        <div className="card stat-card">
          <div className="stat-value">{delta.newlyDone.length}</div>
          <div className="stat-label">Terminées depuis la dernière revue</div>
          <div className="revue-stat-sub">sur {actions.length} action(s)</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={lateList.length ? { color: 'var(--danger)' } : undefined}>
            {lateList.length}
          </div>
          <div className="stat-label">En retard</div>
          <div className={`revue-stat-sub${lateList.length ? ' down' : ''}`}>
            {lateList.length ? `retard moyen ${avgLateDays} j` : 'aucun retard'}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={criticalRisks.length ? { color: 'var(--danger)' } : undefined}>
            {criticalRisks.length}
          </div>
          <div className="stat-label">Risque(s) critique(s)</div>
          <div className="revue-stat-sub">sur {amdecs.length} risque(s) suivi(s)</div>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="card progress-card">
          <div className="progress-head">
            <span className="progress-title">Avancement du plan d’action</span>
            <span className="progress-pct">{delta.planningPct}&nbsp;%</span>
          </div>
          <div className="frise" role="img" aria-label={`${delta.planningPct}% terminé`}>
            <span className="frise-seg done" style={{ width: pct(doneCount) }} />
            <span className="frise-seg in_progress" style={{ width: pct(inProgressCount) }} />
          </div>
          <div className="frise-legend">
            <span>
              <i className="dot done" /> Terminée · {doneCount}
            </span>
            <span>
              <i className="dot in_progress" /> En cours · {inProgressCount}
            </span>
            <span>
              <i className="dot todo" /> À faire · {todoCount}
            </span>
          </div>
        </div>
      )}

      <AttentionsPanel items={attentions} />
    </>
  );

  /** Une ligne d'action : échéance relative (J−6 / J+2) + statut modifiable en direct. */
  const actionRow = (a: Action) => {
    const isNew = cutoff ? a.createdAt > cutoff : false;
    const late = isOverdue(a.dueDate, a.status);
    const soon = !late && a.dueDate && diffDays(today, a.dueDate) <= 7;
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
        {a.dueDate && a.status !== 'done' && (
          <span className={`date-chip${late ? ' danger' : soon ? ' warning' : ''}`}>
            {dayLabel(a.dueDate, today)}
          </span>
        )}
        <div className="segmented">
          {STATUS_ORDER.map((s) => (
            <button key={s} className={a.status === s ? 'active' : ''} onClick={() => void setActionStatus(a.id, s)}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /** Groupe d'actions : masqué s'il est vide — la revue ne montre que ce qui existe. */
  const actionGroup = (key: string, label: string, list: Action[], urgent = false) =>
    list.length === 0 ? null : (
      <div key={key} className={`revue-group${urgent ? ' urgent' : ''}`}>
        <div className="revue-group-head">
          {label}
          <span className="revue-group-count">{list.length}</span>
        </div>
        {list.map(actionRow)}
      </div>
    );

  const actionsBlock = (
    <>
      <div className="kpi-row kpi-row-4">
        <div className="card stat-card">
          <div className="stat-value" style={lateList.length ? { color: 'var(--danger)' } : undefined}>
            {lateList.length}
          </div>
          <div className="stat-label">En retard</div>
          <div className={`revue-stat-sub${lateList.length ? ' down' : ''}`}>
            {lateList.length ? `retard moyen ${avgLateDays} j` : 'rien à rattraper'}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{weekList.length}</div>
          <div className="stat-label">Cette semaine</div>
          <div className="revue-stat-sub">échéance ≤ 7 j</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{laterList.length}</div>
          <div className="stat-label">Plus tard</div>
          <div className="revue-stat-sub">
            {undatedList.length ? `+ ${undatedList.length} sans échéance` : 'toutes datées'}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={doneCount ? { color: 'var(--success)' } : undefined}>
            {doneCount}
          </div>
          <div className="stat-label">Terminées</div>
          <div className={`revue-stat-sub${delta.newlyDone.length ? ' up' : ''}`}>
            {delta.newlyDone.length ? `+${delta.newlyDone.length} depuis la dernière revue` : 'aucune depuis la dernière revue'}
          </div>
        </div>
      </div>

      {open.length === 0 && doneCount === 0 ? (
        <div className="empty">
          <p>Aucune action pour l’instant. Ajoute-en une ci-dessous.</p>
        </div>
      ) : (
        <>
          {actionGroup('late', 'En retard', lateList, true)}
          {actionGroup('week', 'Cette semaine', weekList)}
          {actionGroup('later', 'Plus tard', laterList)}
          {actionGroup('undated', 'Sans échéance', undatedList)}
        </>
      )}

      <div className="revue-group">
        <div className="revue-group-head">Ajouter une action</div>
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
          <p className="form-hint" style={{ padding: '10px 4px' }}>
            Ajoute d’abord des membres à l’équipe (menu RACI ou Accès) pour assigner une action.
          </p>
        )}
      </div>
    </>
  );

  const risquesBlock = (
    <>
      <div className="kpi-row kpi-row-4">
        <div className="card stat-card">
          <div className="stat-value">{amdecs.length}</div>
          <div className="stat-label">Risques suivis</div>
          <div className="revue-stat-sub">
            {delta.newRisks.length ? `+${delta.newRisks.length} depuis la dernière revue` : 'aucun nouveau'}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={criticalRisks.length ? { color: 'var(--danger)' } : undefined}>
            {criticalRisks.length}
          </div>
          <div className="stat-label">Critiques</div>
          <div className={`revue-stat-sub${criticalRisks.length ? ' down' : ''}`}>criticité après actions</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={risksNoPlan.length ? { color: 'var(--danger)' } : undefined}>
            {risksNoPlan.length}
          </div>
          <div className="stat-label">Sans plan d’action</div>
          <div className="revue-stat-sub">{risksNoPlan.length ? 'à traiter en revue' : 'tous couverts'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={avgReduction > 0 ? { color: 'var(--success)' } : undefined}>
            {avgReduction > 0 ? `−${avgReduction} %` : '—'}
          </div>
          <div className="stat-label">Réduction moyenne</div>
          <div className="revue-stat-sub">
            {reducedRisks.length ? `sur ${reducedRisks.length} risque(s) recoté(s)` : 'aucun risque recoté'}
          </div>
        </div>
      </div>

      {/* Risques — arbre risque → actions correctives, réduction de la criticité */}
      <div className="card">
        <div className="card-header">
          <strong>Risques et actions correctives</strong>
          <span className="row-sub">criticité avant → après réduction</span>
        </div>
        <RisksTree amdecs={amdecs} actions={actions} project={project} cutoff={cutoff} />
      </div>
    </>
  );

  const decisionsBlock = (
    <>
      <div className="kpi-row">
        <div className="card stat-card">
          <div className="stat-value">{decisions.length}</div>
          <div className="stat-label">Décisions captées</div>
          <div className="revue-stat-sub">pendant cette revue</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{createdDuringRevue}</div>
          <div className="stat-label">Actions créées</div>
          <div className="revue-stat-sub">assignées en séance</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{elapsedLabel}</div>
          <div className="stat-label">Durée de la revue</div>
          <div className="revue-stat-sub">depuis {frDateTime(revue.createdAt)}</div>
        </div>
      </div>

      {/* Décisions captées */}
      <div className="card">
        <div className="card-header">
          <strong>Décisions captées</strong>
          <span className="row-sub">horodatées, reprises dans le compte-rendu</span>
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
    </>
  );

  const blocks = [syntheseBlock, actionsBlock, risquesBlock, decisionsBlock];

  /* Accroche de chaque scène : une phrase qui porte le chiffre qui compte. */
  const slideIntros = [
    last?.closedAt
      ? `Où en est le projet, et ce qui a bougé depuis le ${frDate(last.closedAt)}.`
      : 'Où en est le projet — première revue, rien à comparer pour l’instant.',
    `${actions.length} action(s)${lateList.length ? ` · ${lateList.length} en retard à traiter en priorité` : ' · aucun retard'}${weekList.length ? ` · ${weekList.length} arrive(nt) cette semaine` : ''}.`,
    amdecs.length
      ? `${amdecs.length} risque(s) suivi(s)${criticalRisks.length ? ` · ${criticalRisks.length} encore critique(s)` : ' · aucun critique'}${risksNoPlan.length ? ` · ${risksNoPlan.length} sans plan d’action` : ''}.`
      : 'Aucun risque AMDEC saisi pour ce projet.',
    'Ce qui a été tranché aujourd’hui — repris tel quel dans le compte-rendu.',
  ];

  if (presenterMode) {
    return (
      <div className="revue-presenter">
        <div className="revue-presenter-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="revue-live">{revue.title}</span>
            <span className="revue-meta">
              <span className="revue-timer">⏱ {elapsedLabel}</span>
              {last?.closedAt && (
                <>
                  <span>·</span>
                  <span>
                    Dernière revue : {frDate(last.closedAt)}
                    {sinceLast != null ? ` (il y a ${sinceLast} j)` : ''}
                  </span>
                </>
              )}
            </span>
          </div>
          <div className="header-actions">
            <button className="btn btn-sm" onClick={() => setPresenterMode(false)}>
              Quitter la présentation
            </button>
            <button className="btn btn-danger btn-sm" onClick={confirmClose}>
              Clôturer la revue
            </button>
          </div>
        </div>

        <div className="revue-presenter-body">
          <nav className="revue-toc">
            <div className="revue-toc-label">Ordre du jour</div>
            {SECTIONS.map((s, i) => (
              <button
                key={s.key}
                className={`revue-toc-item${i === activeSection ? ' active' : ''}${i < activeSection ? ' done' : ''}`}
                onClick={() => setActiveSection(i)}
              >
                <span className="revue-toc-step">{i + 1}</span>
                <span className="revue-toc-name">{s.label}</span>
                {sectionBadges[i].value > 0 && (
                  <span className={`badge ${sectionBadges[i].tone}`}>{sectionBadges[i].value}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="revue-slide">
            {/* `key` : remonte le contenu à chaque section → l'animation d'entrée rejoue. */}
            <div className="revue-slide-inner" key={activeSection}>
              <div className="revue-slide-head">
                <h2>{SECTIONS[activeSection].label}</h2>
                <p>{slideIntros[activeSection]}</p>
              </div>
              {blocks[activeSection]}
            </div>
          </div>
        </div>

        <div className="revue-presenter-nav">
          <button
            className="btn btn-sm"
            disabled={activeSection === 0}
            onClick={() => setActiveSection((i) => Math.max(0, i - 1))}
          >
            ← Précédent
          </button>
          <span className="revue-presenter-dots" aria-hidden="true">
            {SECTIONS.map((s, i) => (
              <i key={s.key} className={i === activeSection ? 'on' : ''} />
            ))}
          </span>
          <button
            className="btn btn-sm"
            disabled={activeSection === SECTIONS.length - 1}
            onClick={() => setActiveSection((i) => Math.min(SECTIONS.length - 1, i + 1))}
          >
            Suivant →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{revue.title}</h1>
          <p className="subtitle">Revue en cours — mets à jour en direct, puis clôture pour générer le compte-rendu.</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => { setActiveSection(0); setPresenterMode(true); }}>
            Reprendre la présentation
          </button>
          <button className="btn btn-danger" onClick={confirmClose}>
            Clôturer la revue
          </button>
        </div>
      </div>

      {syntheseBlock}
      {actionsBlock}
      {risquesBlock}
      {decisionsBlock}
    </div>
  );
}
