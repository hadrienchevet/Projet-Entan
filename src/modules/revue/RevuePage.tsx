'use client';

import { useState } from 'react';
import {
  memberName,
  useCurrentProject,
  useProjectActions,
  useProjectAmdecs,
  useProjectRevues,
  useRevueDecisions,
  useWorkspace,
} from '@/lib/store';
import type { Action, AmdecEntry, ActionStatus, Id, Revue, RevueSnapshot } from '@/lib/types';
import { STATUS_LABELS, criticality, criticalityLevel } from '@/lib/types';
import { Modal } from '@/components/Modal';
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
            Anime ta réunion d’avancement depuis l’outil : actions, risques et décisions se mettent à jour en direct,
            et le compte-rendu est généré à la clôture.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={launch}>
            <IconPlus /> Lancer la revue
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <strong>Depuis la dernière revue</strong>
          <span className="row-sub">{last ? frDate(last.closedAt) : 'Première revue — rien à comparer'}</span>
        </div>
        <div className="card-body">
          <DeltaChips delta={delta} hasPrevious={!!last} />
          <p className="form-hint" style={{ marginTop: 12 }}>
            Tout est prêt : lance la revue pour dérouler ces points en réunion, sans rien préparer.
          </p>
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
  const sortedRisks = [...amdecs].sort((a, b) => criticality(b) - criticality(a)).slice(0, 8);
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

      {/* Risques */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <strong>Risques</strong>
          <span className="row-sub">criticité décroissante</span>
        </div>
        {sortedRisks.length === 0 ? (
          <div className="empty">
            <p>Aucun risque AMDEC saisi.</p>
          </div>
        ) : (
          sortedRisks.map((r) => {
            const score = criticality(r);
            const lvl = criticalityLevel(score);
            const isNew = cutoff ? r.createdAt > cutoff : false;
            return (
              <div key={r.id} className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="row-main" style={{ flex: 1 }}>
                  <div className="row-title" style={{ whiteSpace: 'normal' }}>
                    {r.element} — {r.failureMode}
                  </div>
                  <div className="row-sub">{r.cause}</div>
                </div>
                {isNew && <span className="badge source">Nouveau</span>}
                <span className={`badge crit-${lvl}`}>Criticité {score}</span>
              </div>
            );
          })
        )}
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
