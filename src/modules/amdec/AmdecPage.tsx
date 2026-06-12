'use client';

import { useState } from 'react';
import { useCurrentProject, useProjectActions, useProjectAmdecs, useWorkspace } from '@/lib/store';
import type { AmdecEntry, AmdecInput } from '@/lib/types';
import { AMDEC_SCALE_MAX, criticality, residualCriticality } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { CriticalityBadge } from '@/components/Badges';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';
import { ActionFormModal } from '@/modules/actions/ActionFormModal';
import { RiskMatrixView } from './RiskMatrixView';

export function AmdecPage() {
  const project = useCurrentProject();
  const amdecs = useProjectAmdecs(project?.id);
  const actions = useProjectActions(project?.id);
  const { deleteAmdec } = useWorkspace();

  const [editing, setEditing] = useState<AmdecEntry | null>(null);
  const [creating, setCreating] = useState(false);
  /** Analyse pour laquelle on crée une action corrective. */
  const [actionFor, setActionFor] = useState<AmdecEntry | null>(null);
  const [view, setView] = useState<'tableau' | 'matrice'>('tableau');

  if (!project) return null;

  const sorted = [...amdecs].sort((a, b) => criticality(b) - criticality(a));
  const linkedActionsCount = (amdecId: string) =>
    actions.filter((a) => a.amdecId === amdecId).length;

  const remove = (entry: AmdecEntry) => {
    const linked = linkedActionsCount(entry.id);
    const msg =
      linked > 0
        ? `Supprimer cette analyse ? Les ${linked} action(s) liée(s) seront conservées mais détachées.`
        : 'Supprimer cette analyse ?';
    if (window.confirm(msg)) void deleteAmdec(entry.id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>AMDEC</h1>
          <p className="subtitle">
            Analyse des modes de défaillance — criticité = gravité × occurrence × détectabilité.
            Chaque analyse peut générer des actions correctives.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="segmented">
            {(['tableau', 'matrice'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={view === v ? 'active' : ''}
                onClick={() => setView(v)}
              >
                {v === 'tableau' ? 'Tableau' : 'Matrice de risque'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <IconPlus /> Nouvelle analyse
          </button>
        </div>
      </div>

      {view === 'matrice' ? (
        <RiskMatrixView entries={sorted} />
      ) : (
      <div className="card table-wrap">
        {sorted.length === 0 ? (
          <div className="empty">
            <p>Aucune analyse AMDEC pour le moment.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <IconPlus /> Créer la première analyse
            </button>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Élément / fonction</th>
                <th>Mode de défaillance</th>
                <th>Cause</th>
                <th title="Gravité">G</th>
                <th title="Occurrence">O</th>
                <th title="Détectabilité">D</th>
                <th>Criticité</th>
                <th>Actions liées</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id}>
                  <td className="cell-title">{entry.element}</td>
                  <td>
                    <div>{entry.failureMode}</div>
                    {entry.effect && <div className="cell-sub">Effet : {entry.effect}</div>}
                  </td>
                  <td>{entry.cause}</td>
                  <td>{entry.severity}</td>
                  <td>{entry.occurrence}</td>
                  <td>{entry.detection}</td>
                  <td>
                    <CriticalityBadge score={criticality(entry)} />
                    {residualCriticality(entry) !== null && (
                      <div className="cell-sub" style={{ marginTop: 4 }}>
                        après : <CriticalityBadge score={residualCriticality(entry)!} />
                      </div>
                    )}
                  </td>
                  <td>
                    {linkedActionsCount(entry.id)}{' '}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setActionFor(entry)}
                      title="Créer une action corrective liée à cette analyse"
                    >
                      + action
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="icon-btn"
                      onClick={() => setEditing(entry)}
                      aria-label="Modifier"
                    >
                      <IconEdit />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => remove(entry)}
                      aria-label="Supprimer"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {(creating || editing) && (
        <AmdecFormModal
          projectId={project.id}
          entry={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {actionFor && (
        <ActionFormModal
          project={project}
          defaults={{
            amdecId: actionFor.id,
            title: '',
            description: `Action corrective AMDEC — ${actionFor.element} : ${actionFor.failureMode} (cause : ${actionFor.cause}).`,
          }}
          onClose={() => setActionFor(null)}
        />
      )}
    </div>
  );
}

const SCALE = Array.from({ length: AMDEC_SCALE_MAX }, (_, i) => i + 1);

function AmdecFormModal({
  projectId,
  entry,
  onClose,
}: {
  projectId: string;
  entry?: AmdecEntry;
  onClose: () => void;
}) {
  const { addAmdec, updateAmdec } = useWorkspace();

  const [element, setElement] = useState(entry?.element ?? '');
  const [failureMode, setFailureMode] = useState(entry?.failureMode ?? '');
  const [cause, setCause] = useState(entry?.cause ?? '');
  const [effect, setEffect] = useState(entry?.effect ?? '');
  const [severity, setSeverity] = useState(entry?.severity ?? 2);
  const [occurrence, setOccurrence] = useState(entry?.occurrence ?? 2);
  const [detection, setDetection] = useState(entry?.detection ?? 2);
  // Cotation résiduelle (0 = non cotée) — soit les trois cotes, soit aucune.
  const [severityAfter, setSeverityAfter] = useState(entry?.severityAfter ?? 0);
  const [occurrenceAfter, setOccurrenceAfter] = useState(entry?.occurrenceAfter ?? 0);
  const [detectionAfter, setDetectionAfter] = useState(entry?.detectionAfter ?? 0);
  const [error, setError] = useState('');

  const score = severity * occurrence * detection;
  const afterCount = [severityAfter, occurrenceAfter, detectionAfter].filter(Boolean).length;
  const scoreAfter = afterCount === 3 ? severityAfter * occurrenceAfter * detectionAfter : null;

  const submit = () => {
    if (!element.trim() || !failureMode.trim() || !cause.trim()) {
      setError('Élément, mode de défaillance et cause sont obligatoires.');
      return;
    }
    if (afterCount !== 0 && afterCount !== 3) {
      setError('Cotation après actions : renseignez les trois cotes (G, O, D) ou aucune.');
      return;
    }
    const input: AmdecInput = {
      element: element.trim(),
      failureMode: failureMode.trim(),
      cause: cause.trim(),
      effect: effect.trim() || undefined,
      severity,
      occurrence,
      detection,
      severityAfter: severityAfter || undefined,
      occurrenceAfter: occurrenceAfter || undefined,
      detectionAfter: detectionAfter || undefined,
    };
    if (entry) {
      void updateAmdec(entry.id, input);
    } else {
      void addAmdec(projectId, input);
    }
    onClose();
  };

  const scaleSelect = (
    label: string,
    hint: string,
    value: number,
    setValue: (v: number) => void,
  ) => (
    <div className="field">
      <label>
        {label} <span className="form-hint">({hint})</span>
      </label>
      <select value={value} onChange={(e) => setValue(Number(e.target.value))}>
        {SCALE.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );

  /** Sélecteur de cote résiduelle — 0 = non cotée. */
  const afterScaleSelect = (label: string, value: number, setValue: (v: number) => void) => (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => setValue(Number(e.target.value))}>
        <option value={0}>—</option>
        {SCALE.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Modal
      title={entry ? "Modifier l'analyse AMDEC" : 'Nouvelle analyse AMDEC'}
      onClose={onClose}
      footer={
        <>
          <span style={{ marginRight: 'auto' }}>
            <CriticalityBadge score={score} />
          </span>
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {entry ? 'Enregistrer' : "Créer l'analyse"}
          </button>
        </>
      }
    >
      <div className="field">
        <label>
          Fonction / élément <span className="req">*</span>
        </label>
        <input
          type="text"
          value={element}
          autoFocus
          placeholder="Ex. Convoyeur principal"
          onChange={(e) => setElement(e.target.value)}
        />
      </div>
      <div className="field">
        <label>
          Mode de défaillance <span className="req">*</span>
        </label>
        <input
          type="text"
          value={failureMode}
          placeholder="Ex. Arrêt inopiné"
          onChange={(e) => setFailureMode(e.target.value)}
        />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>
            Cause <span className="req">*</span>
          </label>
          <input
            type="text"
            value={cause}
            placeholder="Ex. Usure des roulements"
            onChange={(e) => setCause(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Effet</label>
          <input
            type="text"
            value={effect}
            placeholder="Ex. Arrêt de la ligne"
            onChange={(e) => setEffect(e.target.value)}
          />
        </div>
        {scaleSelect('Gravité', '1 = mineur · 4 = catastrophique', severity, setSeverity)}
        {scaleSelect('Occurrence', '1 = rare · 4 = fréquent', occurrence, setOccurrence)}
        {scaleSelect('Détectabilité', '1 = toujours détecté · 4 = indétectable', detection, setDetection)}
        <div className="field">
          <label>Criticité (G × O × D)</label>
          <div style={{ paddingTop: 6 }}>
            <CriticalityBadge score={score} />
          </div>
        </div>
      </div>

      <div className="form-section-title">
        Après actions correctives
        <span className="form-hint" style={{ fontWeight: 400 }}>
          {' '}— réévaluation une fois les actions mises en œuvre (optionnel)
        </span>
      </div>
      <div className="form-grid">
        {afterScaleSelect('Gravité', severityAfter, setSeverityAfter)}
        {afterScaleSelect('Occurrence', occurrenceAfter, setOccurrenceAfter)}
        {afterScaleSelect('Détectabilité', detectionAfter, setDetectionAfter)}
        <div className="field">
          <label>Criticité résiduelle</label>
          <div style={{ paddingTop: 6 }}>
            {scoreAfter !== null ? (
              <CriticalityBadge score={scoreAfter} />
            ) : (
              <span className="muted" style={{ fontSize: 12 }}>non réévaluée</span>
            )}
          </div>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
