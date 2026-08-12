'use client';

/**
 * Compte-rendu d'une revue clôturée — vue document plein écran.
 *
 * Se lit UNIQUEMENT dans `revue.snapshot` (jamais dans les données vivantes) :
 * c'est ce qui rend le CR figé. Rouvert dans six mois, il affiche exactement ce
 * qui a été acté ce jour-là, même si les actions ont depuis été renommées ou
 * supprimées — c'est ce qui lui donne sa valeur de trace d'audit.
 *
 * Les revues clôturées AVANT l'enrichissement du snapshot n'ont que les 4
 * champs d'origine : chaque bloc absent est annoncé, jamais planté.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useRevueDecisions, useWorkspace } from '@/lib/store';
import type { Revue, RevueActionLine } from '@/lib/types';
import { ShareCrModal } from './ShareCrModal';

const frDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const frDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

const frShort = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

function Section({ n, title, sub, children }: { n: number; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="revue-cr-section">
      <div className="revue-cr-section-head">
        <span className="revue-cr-num">{n}</span>
        <h3>{title}</h3>
        {sub && <span className="row-sub">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

/** Liste d'actions figées (titre · responsable · échéance). */
function ActionLines({ lines, empty }: { lines: RevueActionLine[] | undefined; empty: string }) {
  if (!lines || lines.length === 0) return <p className="revue-cr-empty">{empty}</p>;
  return (
    <>
      {lines.map((l, i) => (
        <div key={`${l.title}-${i}`} className="list-row">
          <div className="row-main">
            <div className="row-title" style={{ whiteSpace: 'normal' }}>
              {l.title}
            </div>
            <div className="row-sub">
              {l.responsible}
              {l.dueDate ? ` · échéance ${frShort(l.dueDate)}` : ' · sans échéance'}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function RevueCrView({ revue, projectName, onClose }: { revue: Revue; projectName: string; onClose: () => void }) {
  const { projects, currentProjectId } = useWorkspace();
  const decisions = useRevueDecisions(revue.id);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const snap = revue.snapshot;

  const project = projects.find((p) => p.id === (currentProjectId ?? revue.projectId));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-overlay')) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  /* Présents : les ids de membres sont résolus sur l'équipe actuelle ; un membre
     retiré depuis n'est plus nommable, on le signale plutôt que de l'omettre. */
  const memberNames = (snap?.participantIds ?? []).map(
    (id) => project?.members.find((m) => m.id === id)?.name ?? 'Membre retiré du projet',
  );
  const attendees = [...memberNames, ...(snap?.guests ?? []).map((g) => g.name)];

  const deltaPts = snap?.prevPlanningPct != null ? (snap.planningPct ?? 0) - snap.prevPlanningPct : null;

  const exportPdf = async () => {
    setExporting(true);
    try {
      const { exportRevueCrPdf } = await import('./RevueCrPdf');
      await exportRevueCrPdf(projectName, revue, attendees, decisions);
    } catch (err) {
      console.warn('Export PDF du compte-rendu échoué', err);
    }
    setExporting(false);
  };

  return (
    <div className="revue-presenter">
      <div className="revue-presenter-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <strong style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>Compte-rendu</strong>
          <span className="revue-meta">
            <span>{revue.title}</span>
          </span>
        </div>
        <div className="header-actions">
          <button className="btn btn-sm" onClick={exportPdf} disabled={exporting}>
            {exporting ? 'Génération…' : 'Exporter PDF'}
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setSharing(true)}>
            Partager
          </button>
          <button className="btn btn-sm" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>

      <div className="revue-slide">
        <div className="revue-cr">
          {/* 1 — En-tête */}
          <header className="revue-cr-head">
            <h2>{projectName}</h2>
            <p className="revue-cr-title">{revue.title}</p>
            <div className="revue-cr-meta">
              <span>Clôturée le {frDateTime(revue.closedAt)}</span>
              {snap?.durationMin != null && <span>Durée : {snap.durationMin} min</span>}
              {snap?.closedByName && <span>Animée par {snap.closedByName}</span>}
              <span>
                {snap?.prevRevueAt
                  ? `Période couverte : depuis le ${frDate(snap.prevRevueAt)}`
                  : 'Première revue du projet'}
              </span>
            </div>
          </header>

          {/* 2 — Participants */}
          <Section n={1} title="Participants" sub={attendees.length ? `${attendees.length} présent(s)` : undefined}>
            {attendees.length === 0 ? (
              <p className="revue-cr-empty">Aucun participant n’a été noté pendant cette revue.</p>
            ) : (
              <div className="revue-attendees">
                {memberNames.map((n, i) => (
                  <span key={`m-${i}`} className="revue-attendee on">
                    {n}
                  </span>
                ))}
                {(snap?.guests ?? []).map((g) => (
                  <span key={g.id} className="revue-attendee on guest">
                    {g.name}
                    {g.email ? <em>{g.email}</em> : null}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* 3 — Chiffres */}
          <Section n={2} title="L’essentiel en chiffres" sub="à la clôture">
            <div className="kpi-row kpi-row-4">
              <div className="card stat-card">
                <div className="stat-value">{snap?.planningPct ?? 0} %</div>
                <div className="stat-label">Avancement</div>
                {deltaPts != null && (
                  <div className={`revue-stat-sub ${deltaPts >= 0 ? 'up' : 'down'}`}>
                    {deltaPts >= 0 ? '+' : ''}
                    {deltaPts} pts vs revue précédente
                  </div>
                )}
              </div>
              <div className="card stat-card">
                <div className="stat-value">{snap?.doneSince?.length ?? snap?.doneActionIds.length ?? 0}</div>
                <div className="stat-label">Terminées sur la période</div>
                <div className="revue-stat-sub">sur {snap?.totalActions ?? 0} action(s)</div>
              </div>
              <div className="card stat-card">
                <div
                  className="stat-value"
                  style={snap?.lateActions?.length ? { color: 'var(--danger)' } : undefined}
                >
                  {snap?.lateActions?.length ?? 0}
                </div>
                <div className="stat-label">En retard</div>
                <div className="revue-stat-sub">à la clôture</div>
              </div>
              <div className="card stat-card">
                <div
                  className="stat-value"
                  style={snap?.openRisks?.length ? { color: 'var(--danger)' } : undefined}
                >
                  {snap?.openRisks?.length ?? 0}
                </div>
                <div className="stat-label">Risques critiques</div>
                <div className="revue-stat-sub">sur {snap?.amdecCount ?? 0} risque(s)</div>
              </div>
            </div>
          </Section>

          {/* 4 — Décisions */}
          <Section n={3} title="Décisions prises" sub={decisions.length ? `${decisions.length}` : undefined}>
            {decisions.length === 0 ? (
              <p className="revue-cr-empty">Aucune décision captée pendant cette revue.</p>
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
          </Section>

          {/* 5 — Qui fait quoi pour quand */}
          <Section
            n={4}
            title="Qui fait quoi pour quand"
            sub={snap?.createdActions?.length ? `${snap.createdActions.length} action(s) assignée(s)` : undefined}
          >
            <ActionLines lines={snap?.createdActions} empty="Aucune action n’a été créée pendant cette revue." />
          </Section>

          {/* 6 — Ce qui a avancé */}
          <Section n={5} title="Ce qui a avancé">
            <ActionLines lines={snap?.doneSince} empty="Aucune action terminée sur la période." />
          </Section>

          {/* 7 — Points ouverts */}
          <Section n={6} title="Points ouverts" sub="bascule sur la prochaine revue">
            <h4 className="revue-cr-subhead">Actions en retard</h4>
            <ActionLines lines={snap?.lateActions} empty="Aucun retard à la clôture." />

            <h4 className="revue-cr-subhead">Risques critiques</h4>
            {!snap?.openRisks || snap.openRisks.length === 0 ? (
              <p className="revue-cr-empty">Aucun risque critique restant.</p>
            ) : (
              snap.openRisks.map((r, i) => (
                <div key={`${r.label}-${i}`} className="list-row">
                  <div className="row-main">
                    <div className="row-title" style={{ whiteSpace: 'normal' }}>
                      {r.label}
                    </div>
                    <div className="row-sub">
                      Criticité {r.score} · {r.hasPlan ? 'plan d’action en cours' : 'aucune action corrective'}
                    </div>
                  </div>
                  {!r.hasPlan && <span className="badge overdue">Sans plan</span>}
                </div>
              ))
            )}
          </Section>

          <p className="revue-cr-foot">
            Compte-rendu généré par ENTAN · document figé à la clôture, le {frDateTime(revue.closedAt)}.
          </p>
        </div>
      </div>

      {sharing && <ShareCrModal revue={revue} projectName={projectName} onClose={() => setSharing(false)} />}
    </div>
  );
}
