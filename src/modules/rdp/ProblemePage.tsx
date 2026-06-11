'use client';

import { useState } from 'react';
import {
  memberName,
  useCurrentProject,
  useProjectIndicators,
  useWorkspace,
} from '@/lib/store';
import type { Id, RdpIndicator, RdpIndicatorInput, RdpProblemInput } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';

/**
 * Phase 1 — Poser le problème.
 * Règle des 3T : tout VOIR, tout NOTER, tout MESURER.
 * QQOQCP, situation actuelle / souhaitée, écart quantifié, indicateurs.
 */

const QQOQCP_FIELDS: { key: keyof RdpProblemInput; label: string; hint: string }[] = [
  { key: 'quoi', label: 'Quoi ?', hint: 'De quoi s’agit-il ? Quel est le problème ?' },
  { key: 'qui', label: 'Qui ?', hint: 'Qui est concerné, qui détecte, qui subit ?' },
  { key: 'ou', label: 'Où ?', hint: 'Où le problème apparaît-il ?' },
  { key: 'quand', label: 'Quand ?', hint: 'Depuis quand, à quelle fréquence, à quel moment ?' },
  { key: 'comment', label: 'Comment ?', hint: 'Comment le problème se manifeste-t-il ?' },
  { key: 'pourquoi', label: 'Pourquoi ?', hint: 'Pourquoi est-ce un problème ? Enjeux.' },
];

export function ProblemePage() {
  const project = useCurrentProject();
  const indicators = useProjectIndicators(project?.id);
  const { rdpProblem, saveRdpProblem, deleteRdpIndicator } = useWorkspace();

  const [indicatorModal, setIndicatorModal] = useState<{ indicator?: RdpIndicator } | null>(null);

  if (!project) return null;

  const save = (key: keyof RdpProblemInput, value: string) => {
    if ((rdpProblem?.[key] ?? '') === value) return;
    void saveRdpProblem(project.id, { [key]: value });
  };

  // Les champs sont non contrôlés (defaultValue + onBlur) : la clé force le
  // remontage quand les données du projet changent.
  const formKey = `${project.id}-${rdpProblem ? 'loaded' : 'empty'}`;

  return (
    <div className="page" key={formKey}>
      <div className="page-header">
        <div>
          <h1>Phase 1 — Poser le problème</h1>
          <p className="subtitle">
            Règle des 3T : tout <strong>voir</strong>, tout <strong>noter</strong>, tout{' '}
            <strong>mesurer</strong>.
          </p>
        </div>
        <span className="badge rdp-badge">Phase 1</span>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>QQOQCP</h2>
          <span className="muted" style={{ fontSize: 12.5 }}>Enregistré automatiquement</span>
        </div>
        <div className="qqoqcp-grid">
          {QQOQCP_FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              <textarea
                defaultValue={(rdpProblem?.[f.key] as string) ?? ''}
                placeholder={f.hint}
                rows={2}
                onBlur={(e) => save(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Écart à réduire</h2>
        </div>
        <div className="qqoqcp-grid">
          <div className="field">
            <label>Situation actuelle (constatée, mesurée)</label>
            <textarea
              defaultValue={rdpProblem?.situationActuelle ?? ''}
              placeholder="État des lieux : photos, mots, chiffres…"
              rows={3}
              onBlur={(e) => save('situationActuelle', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Situation souhaitée</label>
            <textarea
              defaultValue={rdpProblem?.situationSouhaitee ?? ''}
              placeholder="Où veut-on arriver ?"
              rows={3}
              onBlur={(e) => save('situationSouhaitee', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Écart quantifié</label>
            <textarea
              defaultValue={rdpProblem?.ecart ?? ''}
              placeholder="Ex. 12 arrêts/semaine constatés contre 2 visés."
              rows={3}
              onBlur={(e) => save('ecart', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Objectifs — toujours mesurables</label>
            <textarea
              defaultValue={rdpProblem?.objectifs ?? ''}
              placeholder="Coûts, cadence, qualité… avec valeurs cibles et délais."
              rows={3}
              onBlur={(e) => save('objectifs', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Tableau de bord — indicateurs ({indicators.length})</h2>
          <button className="btn btn-sm" onClick={() => setIndicatorModal({})}>
            <IconPlus /> Ajouter un indicateur
          </button>
        </div>
        {indicators.length === 0 ? (
          <div className="empty">
            <p>
              Créez les indicateurs qui mesureront l&apos;évolution des écarts (feuilles de
              relevés), avec un responsable de mise à jour et une fréquence.
            </p>
            <button className="btn btn-primary" onClick={() => setIndicatorModal({})}>
              <IconPlus /> Créer le premier indicateur
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th>Valeur actuelle</th>
                  <th>Objectif</th>
                  <th>Fréquence de relevé</th>
                  <th>Responsable</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {indicators.map((i) => (
                  <tr key={i.id}>
                    <td className="cell-title">{i.name}</td>
                    <td>
                      {i.currentValue || <span className="muted">—</span>}
                      {i.unit && i.currentValue ? ` ${i.unit}` : ''}
                    </td>
                    <td>
                      {i.targetValue || <span className="muted">—</span>}
                      {i.unit && i.targetValue ? ` ${i.unit}` : ''}
                    </td>
                    <td>{i.frequency || <span className="muted">—</span>}</td>
                    <td>{i.responsibleId ? memberName(project, i.responsibleId) : <span className="muted">—</span>}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn"
                        onClick={() => setIndicatorModal({ indicator: i })}
                        aria-label="Modifier"
                      >
                        <IconEdit />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          if (window.confirm(`Supprimer l'indicateur « ${i.name} » ?`)) {
                            void deleteRdpIndicator(i.id);
                          }
                        }}
                        aria-label="Supprimer"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {indicatorModal && (
        <IndicatorFormModal
          projectId={project.id}
          indicator={indicatorModal.indicator}
          members={project.members}
          onClose={() => setIndicatorModal(null)}
        />
      )}
    </div>
  );
}

function IndicatorFormModal({
  projectId,
  indicator,
  members,
  onClose,
}: {
  projectId: Id;
  indicator?: RdpIndicator;
  members: { id: Id; name: string }[];
  onClose: () => void;
}) {
  const { addRdpIndicator, updateRdpIndicator } = useWorkspace();
  const [name, setName] = useState(indicator?.name ?? '');
  const [unit, setUnit] = useState(indicator?.unit ?? '');
  const [currentValue, setCurrentValue] = useState(indicator?.currentValue ?? '');
  const [targetValue, setTargetValue] = useState(indicator?.targetValue ?? '');
  const [frequency, setFrequency] = useState(indicator?.frequency ?? '');
  const [responsibleId, setResponsibleId] = useState<Id | ''>(indicator?.responsibleId ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setError("Le nom de l'indicateur est obligatoire.");
      return;
    }
    const input: RdpIndicatorInput = {
      name: name.trim(),
      unit: unit.trim(),
      currentValue: currentValue.trim(),
      targetValue: targetValue.trim(),
      frequency: frequency.trim(),
      responsibleId: responsibleId || undefined,
    };
    if (indicator) {
      void updateRdpIndicator(indicator.id, input);
    } else {
      void addRdpIndicator(projectId, input);
    }
    onClose();
  };

  return (
    <Modal
      title={indicator ? "Modifier l'indicateur" : 'Nouvel indicateur'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit}>
            {indicator ? 'Enregistrer' : 'Créer'}
          </button>
        </>
      }
    >
      <div className="field">
        <label>Nom <span className="req">*</span></label>
        <input
          type="text" value={name} autoFocus
          placeholder="Ex. Nombre d'arrêts ligne / semaine"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Valeur actuelle</label>
          <input type="text" value={currentValue} placeholder="Ex. 12"
            onChange={(e) => setCurrentValue(e.target.value)} />
        </div>
        <div className="field">
          <label>Objectif</label>
          <input type="text" value={targetValue} placeholder="Ex. 2"
            onChange={(e) => setTargetValue(e.target.value)} />
        </div>
        <div className="field">
          <label>Unité</label>
          <input type="text" value={unit} placeholder="Ex. arrêts/sem."
            onChange={(e) => setUnit(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Fréquence de relevé</label>
          <input type="text" value={frequency} placeholder="Ex. hebdomadaire"
            onChange={(e) => setFrequency(e.target.value)} />
        </div>
        <div className="field">
          <label>Responsable de la mise à jour</label>
          <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)}>
            <option value="">— Aucun —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
