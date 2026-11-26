'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useCurrentProject, useProjectActions, useProjectAmdecs, useWorkspace } from '@/lib/store';
import type { AmdecEntry, AmdecInput } from '@/lib/types';
import { AMDEC_SCALE_MAX, criticality, residualCriticality } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { CriticalityBadge } from '@/components/Badges';
import { IconEdit, IconLayers, IconPlus, IconTrash } from '@/components/icons';
import { ActionFormModal } from '@/modules/actions/ActionFormModal';
import { RiskMatrixView } from './RiskMatrixView';

/** Criticité qui fait foi : la réévaluée si elle existe, sinon l'initiale. */
function finalCriticality(e: AmdecEntry): number {
  return residualCriticality(e) ?? criticality(e);
}

/**
 * Anime le reclassement des lignes (technique FLIP).
 *
 * Le saut d'une ligne qui change de rang est désorientant quand il est
 * instantané — mais c'est justement le moment le plus parlant de la méthode :
 * on vient de saisir une cotation après action, et le risque descend sous le
 * seuil. Animé, le déplacement explique la cause au lieu de la masquer.
 *
 * On mesure la position avant peinture, on remet la ligne à son ancienne
 * place, puis on la laisse rejoindre la nouvelle.
 */
function useFlipRows(signature: string) {
  const rows = useRef(new Map<string, HTMLTableRowElement>());
  const previous = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const current = new Map<string, number>();
    rows.current.forEach((el, id) => current.set(id, el.getBoundingClientRect().top));

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) {
      current.forEach((top, id) => {
        const before = previous.current.get(id);
        const el = rows.current.get(id);
        if (before === undefined || !el) return;
        const delta = before - top;
        if (Math.abs(delta) < 2) return;
        el.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: 'none' }],
          { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
      });
    }
    previous.current = current;
  }, [signature]);

  return rows;
}

export function AmdecPage() {
  const project = useCurrentProject();
  const amdecs = useProjectAmdecs(project?.id);
  const actions = useProjectActions(project?.id);
  const { addAmdec, updateAmdec, deleteAmdec } = useWorkspace();

  const [editing, setEditing] = useState<AmdecEntry | null>(null);
  const [creating, setCreating] = useState(false);
  /** Analyse pour laquelle on crée une action corrective. */
  const [actionFor, setActionFor] = useState<AmdecEntry | null>(null);
  const [view, setView] = useState<'tableau' | 'matrice'>('tableau');
  const [exportOpen, setExportOpen] = useState(false);
  /* Par défaut, les risques les plus critiques en tête — criticité FINALE,
     donc réévaluée quand elle existe. Le reclassement est animé (FLIP) : une
     ligne qui descend après une action corrective le fait voir. L'ordre de
     saisie reste disponible pour les sessions de remplissage, où un tableau
     stable vaut mieux. */
  const [sortBy, setSortBy] = useState<'finale' | 'saisie'>('finale');

  const sorted =
    sortBy === 'finale'
      ? [...amdecs].sort((a, b) => finalCriticality(b) - finalCriticality(a))
      : amdecs;
  /** L'export et la matrice restent priorisés par criticité, quel que soit l'affichage. */
  const byCriticality = [...amdecs].sort((a, b) => criticality(b) - criticality(a));

  /* Change dès qu'un rang ou une cote bouge : c'est le signal de reclassement. */
  const flipRows = useFlipRows(sorted.map((e) => `${e.id}:${finalCriticality(e)}`).join('|'));

  /* Lignes dont la criticité finale vient de baisser — mises en avant une
     seconde, pour relier le déplacement à sa cause. */
  const [improved, setImproved] = useState<Set<string>>(new Set());
  const lastScores = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const dropped: string[] = [];
    amdecs.forEach((e) => {
      const before = lastScores.current.get(e.id);
      const now = finalCriticality(e);
      if (before !== undefined && now < before) dropped.push(e.id);
      lastScores.current.set(e.id, now);
    });
    if (dropped.length === 0) return;
    setImproved(new Set(dropped));
    const t = window.setTimeout(() => setImproved(new Set()), 1600);
    return () => window.clearTimeout(t);
  }, [amdecs]);

  if (!project) return null;

  const linkedActionsCount = (amdecId: string) =>
    actions.filter((a) => a.amdecId === amdecId).length;

  /** Duplique une ligne : les analyses d'un même élément ne diffèrent souvent
   *  que par le mode de défaillance. */
  const duplicate = (entry: AmdecEntry) =>
    addAmdec(project.id, {
      element: entry.element,
      failureMode: entry.failureMode,
      cause: entry.cause,
      effect: entry.effect,
      severity: entry.severity,
      occurrence: entry.occurrence,
      detection: entry.detection,
    });

  const remove = (entry: AmdecEntry) => {
    const linked = linkedActionsCount(entry.id);
    const msg =
      linked > 0
        ? `Supprimer cette analyse ? Les ${linked} action(s) liée(s) seront conservées mais détachées.`
        : 'Supprimer cette analyse ?';
    if (window.confirm(msg)) void deleteAmdec(entry.id);
  };

  /** Une ligne du tableau. Extrait pour être rendu à plat ou sous un groupe. */
  const renderRow = (entry: AmdecEntry, grouped: boolean) => (
                <tr
                  key={entry.id}
                  ref={(el) => {
                    if (el) flipRows.current.set(entry.id, el);
                    else flipRows.current.delete(entry.id);
                  }}
                  className={improved.has(entry.id) ? 'amdec-improved' : undefined}
                >
                  <td className="cell-title">{grouped ? null : entry.element}</td>
                  <td>
                    <div>{entry.failureMode}</div>
                    {entry.effect && <div className="cell-sub">Effet : {entry.effect}</div>}
                  </td>
                  <td>{entry.cause}</td>
                  <td className="cote-cell">
                    <CoteInput
                      value={entry.severity}
                      onCommit={(v) => v && void updateAmdec(entry.id, { severity: v })}
                      label={`Gravité de ${entry.failureMode}`}
                    />
                  </td>
                  <td className="cote-cell">
                    <CoteInput
                      value={entry.occurrence}
                      onCommit={(v) => v && void updateAmdec(entry.id, { occurrence: v })}
                      label={`Occurrence de ${entry.failureMode}`}
                    />
                  </td>
                  <td className="cote-cell">
                    <CoteInput
                      value={entry.detection}
                      onCommit={(v) => v && void updateAmdec(entry.id, { detection: v })}
                      label={`Détectabilité de ${entry.failureMode}`}
                    />
                  </td>
                  <td>
                    <CriticalityBadge score={criticality(entry)} />
                  </td>
                  <td className="cote-cell">
                    <span className="cote-after">
                      <CoteInput
                        value={entry.severityAfter ?? 0}
                        onCommit={(v) => void updateAmdec(entry.id, { severityAfter: v || undefined })}
                        label={`Gravité après actions de ${entry.failureMode}`}
                        allowEmpty
                      />
                      <CoteInput
                        value={entry.occurrenceAfter ?? 0}
                        onCommit={(v) => void updateAmdec(entry.id, { occurrenceAfter: v || undefined })}
                        label={`Occurrence après actions de ${entry.failureMode}`}
                        allowEmpty
                      />
                      <CoteInput
                        value={entry.detectionAfter ?? 0}
                        onCommit={(v) => void updateAmdec(entry.id, { detectionAfter: v || undefined })}
                        label={`Détectabilité après actions de ${entry.failureMode}`}
                        allowEmpty
                      />
                    </span>
                    {residualCriticality(entry) !== null && (
                      <div className="cote-drop">
                        <CriticalityBadge score={residualCriticality(entry)!} />
                        {residualCriticality(entry)! < criticality(entry) && (
                          <span
                            className="cote-delta"
                            title="Baisse obtenue grâce aux actions correctives"
                          >
                            ↓ {criticality(entry) - residualCriticality(entry)!}
                          </span>
                        )}
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
                      onClick={() => void duplicate(entry)}
                      aria-label="Dupliquer cette ligne"
                      title="Dupliquer — même élément, à réécrire le mode"
                    >
                      <IconLayers />
                    </button>
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
  );

  /** Pire criticité finale d'un groupe — c'est elle qui le classe. */
  const worst = (list: AmdecEntry[]) => Math.max(...list.map(finalCriticality));

  /* Regroupement par élément : une AMDEC s'organise par fonction analysée, pas
     en liste plate. Clé insensible à la casse et aux espaces, pour que
     « Convoyeur » et « convoyeur  » ne fassent pas deux groupes. */
  const groups = (() => {
    const map = new Map<string, { label: string; entries: AmdecEntry[] }>();
    for (const e of sorted) {
      const key = e.element.trim().toLowerCase();
      const g = map.get(key);
      if (g) g.entries.push(e);
      else map.set(key, { label: e.element.trim(), entries: [e] });
    }
    return [...map.values()].sort((a, b) => {
      if (!a.label) return 1; // les lignes sans élément ferment la marche
      if (!b.label) return -1;
      return worst(b.entries) - worst(a.entries);
    });
  })();

  /* En ordre de saisie on reste à plat : le regroupement n'a de sens que pour
     l'analyse, pas pendant le remplissage. */
  const body =
    sortBy === 'saisie'
      ? sorted.map((entry) => renderRow(entry, false))
      : groups.flatMap((g) => [
          <tr key={`groupe:${g.label}`} className="amdec-group">
            <td colSpan={10}>
              <span className="amdec-group-name">{g.label || 'Sans élément'}</span>
              <span className="amdec-group-count">
                {g.entries.length} mode{g.entries.length > 1 ? 's' : ''}
              </span>
              <CriticalityBadge score={worst(g.entries)} />
            </td>
          </tr>,
          ...g.entries.map((entry) => renderRow(entry, true)),
        ]);

  /** Éléments déjà saisis — alimente l'autocomplétion de la ligne de saisie. */
  const knownElements = [...new Set(amdecs.map((e) => e.element.trim()).filter(Boolean))];

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
          <button className="btn" onClick={() => setExportOpen(true)} disabled={sorted.length === 0}>
            Exporter PDF
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <IconPlus /> Nouvelle analyse
          </button>
        </div>
      </div>

      {view === 'matrice' ? (
        <RiskMatrixView entries={byCriticality} />
      ) : (
      <div className="card table-wrap">
        {(
          <table className="data amdec-table">
            <thead>
              <tr>
                <th>Élément / fonction</th>
                <th>Mode de défaillance</th>
                <th>Cause</th>
                <th title="Gravité — 1 à 4">G</th>
                <th title="Occurrence — 1 à 4">O</th>
                <th title="Détectabilité — 1 à 4">D</th>
                <th>
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => setSortBy((v) => (v === 'finale' ? 'saisie' : 'finale'))}
                    title={
                      sortBy === 'finale'
                        ? 'Figer dans l’ordre de saisie (utile pendant le remplissage)'
                        : 'Reclasser par criticité finale décroissante'
                    }
                  >
                    Criticité {sortBy === 'finale' ? '↓' : '·'}
                  </button>
                </th>
                <th title="Cotation réévaluée après actions correctives">Après</th>
                <th>Actions liées</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {body}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="amdec-empty">
                    Aucune analyse pour l’instant — saisissez la première ci-dessous.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <QuickAddRow projectId={project.id} onAdd={addAmdec} elements={knownElements} />
            </tfoot>
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

      {exportOpen && (
        <ExportPdfModal
          projectName={project.name}
          entries={byCriticality}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Cote 1–4 éditable sur place.
 *
 * Un menu déroulant demande clic, déroulement, clic — soixante manipulations
 * pour une AMDEC de vingt lignes. Ici la cellule EST le champ : on clique une
 * fois (le contenu se sélectionne) et on tape le chiffre. Au clavier, en
 * tabulant depuis la cellule précédente, il n'y a aucun clic du tout.
 */
function CoteInput({
  value,
  onCommit,
  label,
  allowEmpty = false,
}: {
  value: number;
  onCommit: (v: number) => void;
  label: string;
  allowEmpty?: boolean;
}) {
  return (
    <input
      className="cote-input"
      type="text"
      inputMode="numeric"
      aria-label={label}
      title={label}
      value={value ? String(value) : ''}
      placeholder={allowEmpty ? '—' : ''}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        // On ne garde que le dernier caractère valide : retaper un chiffre
        // par-dessus remplace la cote au lieu de la concaténer.
        const digit = e.target.value.replace(/[^1-4]/g, '').slice(-1);
        if (digit) onCommit(Number(digit));
        else if (allowEmpty) onCommit(0);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

/**
 * Ligne de saisie permanente, en pied de tableau.
 *
 * Une AMDEC se remplit en session : quinze à trente lignes d'affilée. Une
 * modale par ligne, c'est autant d'allers-retours et, surtout, le tableau
 * masqué au moment où l'on en a le plus besoin — on cote d'autant mieux qu'on
 * voit les lignes déjà saisies.
 *
 * Seul le mode de défaillance est exigé : la méthode liste les modes d'abord,
 * les causes viennent après. Entrée crée la ligne et laisse le curseur prêt
 * pour la suivante.
 */
function QuickAddRow({
  projectId,
  onAdd,
  elements,
}: {
  projectId: string;
  onAdd: (projectId: string, input: AmdecInput) => Promise<void>;
  /** Éléments déjà saisis — autocomplétion : moins de frappe, et des groupes
   *  qui ne se dédoublent pas sur une faute d'orthographe. */
  elements: string[];
}) {
  const [element, setElement] = useState('');
  const [failureMode, setFailureMode] = useState('');
  const [cause, setCause] = useState('');
  const [severity, setSeverity] = useState(2);
  const [occurrence, setOccurrence] = useState(2);
  const [detection, setDetection] = useState(2);
  const first = useRef<HTMLInputElement>(null);

  const ready = failureMode.trim().length > 0;

  const add = () => {
    if (!ready) return;
    void onAdd(projectId, {
      element: element.trim(),
      failureMode: failureMode.trim(),
      cause: cause.trim(),
      severity,
      occurrence,
      detection,
    });
    // On garde l'élément : les lignes suivantes portent souvent sur le même.
    setFailureMode('');
    setCause('');
    first.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <tr className="amdec-quick" onKeyDown={onKey}>
      <td>
        <input
          type="text"
          list="amdec-elements"
          value={element}
          onChange={(e) => setElement(e.target.value)}
          placeholder="Élément"
          aria-label="Élément ou fonction"
        />
        <datalist id="amdec-elements">
          {elements.map((el) => (
            <option key={el} value={el} />
          ))}
        </datalist>
      </td>
      <td>
        <input
          ref={first}
          type="text"
          value={failureMode}
          onChange={(e) => setFailureMode(e.target.value)}
          placeholder="Mode de défaillance…"
          aria-label="Mode de défaillance"
        />
      </td>
      <td>
        <input
          type="text"
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="Cause"
          aria-label="Cause"
        />
      </td>
      <td className="cote-cell">
        <CoteInput value={severity} onCommit={setSeverity} label="Gravité" />
      </td>
      <td className="cote-cell">
        <CoteInput value={occurrence} onCommit={setOccurrence} label="Occurrence" />
      </td>
      <td className="cote-cell">
        <CoteInput value={detection} onCommit={setDetection} label="Détectabilité" />
      </td>
      <td>
        <CriticalityBadge score={severity * occurrence * detection} />
      </td>
      <td colSpan={2} className="amdec-quick-hint">
        {ready ? 'Entrée pour ajouter' : 'Le mode de défaillance suffit'}
      </td>
      <td className="actions-cell">
        <button
          className="icon-btn"
          onClick={add}
          disabled={!ready}
          aria-label="Ajouter cette analyse"
          title="Ajouter (Entrée)"
        >
          <IconPlus />
        </button>
      </td>
    </tr>
  );
}

function ExportPdfModal({
  projectName,
  entries,
  onClose,
}: {
  projectName: string;
  entries: AmdecEntry[];
  onClose: () => void;
}) {
  const [table, setTable] = useState(true);
  const [matrices, setMatrices] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!table && !matrices) return;
    setBusy(true);
    try {
      const { exportAmdecPdf } = await import('./AmdecPdf');
      await exportAmdecPdf(projectName, entries, { table, matrices });
      onClose();
    } catch (err) {
      console.warn('Export PDF AMDEC échoué', err);
      setBusy(false);
    }
  };

  const checkRow = (checked: boolean, set: (v: boolean) => void, label: string, hint: string) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => set(e.target.checked)}
        style={{ width: 'auto', marginTop: 2 }}
      />
      <span>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span className="form-hint" style={{ display: 'block' }}>{hint}</span>
      </span>
    </label>
  );

  return (
    <Modal
      title="Exporter en PDF"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || (!table && !matrices)}>
            {busy ? 'Génération…' : 'Exporter'}
          </button>
        </>
      }
    >
      <p className="form-hint" style={{ marginBottom: 4 }}>
        Sélectionnez les sections à inclure dans le rapport :
      </p>
      {checkRow(table, setTable, 'Tableau AMDEC détaillé', 'Toutes les analyses : cotation G/O/D, criticité avant/après, évolution.')}
      {checkRow(matrices, setMatrices, 'Matrices de risque (avant / après)', 'Les deux matrices Gravité × Occurrence sur une page dédiée, avec légende.')}
    </Modal>
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
