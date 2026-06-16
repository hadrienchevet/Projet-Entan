'use client';

import Link from 'next/link';
import { memberName, useCurrentProject, useProjectActions, useProjectAmdecs, useWorkspace } from '@/lib/store';
import type { A3ReportInput } from '@/lib/types';
import { criticality, residualCriticality } from '@/lib/types';
import { formatDayMonth, todayISO } from '@/lib/date';
import { CriticalityBadge, StatusBadge } from '@/components/Badges';

/**
 * Charte A3 — fiche structurée d'une page (sections lean), auto-enregistrée.
 * Deux blocs « indicateurs liés » reprennent automatiquement les données du
 * projet : risques majeurs (AMDEC) et actions clés.
 */
const SECTIONS: { key: keyof A3ReportInput; label: string; hint: string }[] = [
  { key: 'contexte', label: '1 · Contexte', hint: 'Pourquoi ce sujet ? Enjeu, périmètre, déclencheur.' },
  { key: 'situation', label: '2 · Situation actuelle', hint: 'Faits, mesures, ce qu’on observe aujourd’hui.' },
  { key: 'objectifs', label: '3 · Objectifs / cible', hint: 'Résultat visé, mesurable, avec échéance.' },
  { key: 'analyse', label: '4 · Analyse des causes', hint: 'Causes racines (5 Pourquoi, Ishikawa…).' },
  { key: 'plan', label: '5 · Plan d’action', hint: 'Contre-mesures : quoi, qui, quand.' },
  { key: 'suivi', label: '6 · Suivi / résultats', hint: 'Indicateurs, résultats obtenus, standardisation.' },
];

export function A3Page() {
  const project = useCurrentProject();
  const actions = useProjectActions(project?.id);
  const amdecs = useProjectAmdecs(project?.id);
  const { a3Report, saveA3Report } = useWorkspace();

  if (!project) return null;

  const save = (key: keyof A3ReportInput, value: string) => {
    if ((a3Report?.[key] ?? '') === value) return;
    void saveA3Report(project.id, { [key]: value });
  };
  const formKey = `${project.id}-${a3Report ? 'loaded' : 'empty'}`;

  const today = todayISO();
  const effective = (e: (typeof amdecs)[number]) => residualCriticality(e) ?? criticality(e);
  const topRisks = [...amdecs].sort((a, b) => effective(b) - effective(a)).slice(0, 4);
  const keyActions = actions
    .filter((a) => a.status !== 'done' && a.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 4);

  return (
    <div className="page" key={formKey}>
      <div className="page-header">
        <div>
          <h1>Charte A3 — {project.name}</h1>
          <p className="subtitle">Une page pour cadrer le problème, l’analyse et le plan d’action.</p>
        </div>
        <span className="muted" style={{ fontSize: 12.5 }}>Enregistré automatiquement</span>
      </div>

      <div className="card">
        <div className="a3-grid">
          {SECTIONS.map((s) => (
            <div className="field" key={s.key}>
              <label>{s.label}</label>
              <textarea
                defaultValue={(a3Report?.[s.key] as string) ?? ''}
                placeholder={s.hint}
                rows={5}
                onBlur={(e) => save(s.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicateurs liés — repris automatiquement du projet */}
      <div className="a3-linked">
        <div className="card">
          <div className="card-header">
            <div className="card-title-group"><h2>Risques majeurs</h2><span className="muted" style={{ fontSize: 12 }}>liés à l’AMDEC</span></div>
            <Link className="link" href="/amdec">AMDEC</Link>
          </div>
          {topRisks.length === 0 ? (
            <div className="empty"><p>Aucune analyse AMDEC.</p></div>
          ) : (
            topRisks.map((r) => (
              <div key={r.id} className="list-row">
                <div className="row-main">
                  <div className="row-title">{r.element} — {r.failureMode}</div>
                  <div className="row-sub">{residualCriticality(r) !== null ? 'après actions correctives' : `cause : ${r.cause}`}</div>
                </div>
                <CriticalityBadge score={effective(r)} />
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title-group"><h2>Actions clés</h2><span className="muted" style={{ fontSize: 12 }}>échéances proches</span></div>
            <Link className="link" href="/actions">Actions</Link>
          </div>
          {keyActions.length === 0 ? (
            <div className="empty"><p>Aucune action ouverte avec échéance.</p></div>
          ) : (
            keyActions.map((a) => (
              <div key={a.id} className="list-row">
                <div className="row-main">
                  <div className="row-title">{a.title}</div>
                  <div className="row-sub">{memberName(project, a.responsibleId)} · {formatDayMonth(a.dueDate!)}</div>
                </div>
                <StatusBadge status={a.status} dueDate={a.dueDate} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
