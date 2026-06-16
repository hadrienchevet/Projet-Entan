'use client';

import { useState } from 'react';
import { useCurrentProject, useProjectCostItems, useWorkspace } from '@/lib/store';
import type { CostItem, CostItemInput } from '@/lib/types';
import { costVariance } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function CostsPage() {
  const project = useCurrentProject();
  const items = useProjectCostItems(project?.id);
  const { deleteCostItem } = useWorkspace();
  const [editing, setEditing] = useState<CostItem | null>(null);
  const [creating, setCreating] = useState(false);

  if (!project) return null;

  const planned = items.reduce((s, c) => s + c.planned, 0);
  const actual = items.reduce((s, c) => s + c.actual, 0);
  const variance = actual - planned;
  const consumption = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Suivi des coûts</h1>
          <p className="subtitle">Budget prévu vs coût réel par poste de dépense.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Nouveau poste
        </button>
      </div>

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="card stat-card"><div className="stat-value">{eur(planned)}</div><div className="stat-label">Budget prévu</div></div>
        <div className="card stat-card"><div className="stat-value">{eur(actual)}</div><div className="stat-label">Coût réel</div></div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: variance > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {variance > 0 ? '+' : ''}{eur(variance)}
          </div>
          <div className="stat-label">Écart</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: consumption > 100 ? 'var(--danger)' : 'inherit' }}>{consumption} %</div>
          <div className="stat-label">Consommation du budget</div>
        </div>
      </div>

      {/* Barre de consommation */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="cost-bar">
            <span className={`cost-bar-fill${consumption > 100 ? ' over' : ''}`} style={{ width: `${Math.min(consumption, 100)}%` }} />
          </div>
          <div className="cost-bar-meta">
            <span>{eur(actual)} dépensés</span>
            <span>{eur(planned)} budgétés</span>
          </div>
        </div>
      </div>

      <div className="card table-wrap">
        {items.length === 0 ? (
          <div className="empty">
            <p>Aucun poste de coût. Ajoutez vos lignes de budget.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}><IconPlus /> Ajouter un poste</button>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr><th>Poste</th><th>Prévu</th><th>Réel</th><th>Écart</th><th /></tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const v = costVariance(c);
                return (
                  <tr key={c.id}>
                    <td className="cell-title">{c.label}</td>
                    <td>{eur(c.planned)}</td>
                    <td>{eur(c.actual)}</td>
                    <td style={{ color: v > 0 ? 'var(--danger)' : v < 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {v > 0 ? '+' : ''}{eur(v)}
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn" onClick={() => setEditing(c)} aria-label="Modifier"><IconEdit /></button>
                      <button
                        className="icon-btn danger"
                        onClick={() => { if (window.confirm(`Supprimer le poste « ${c.label} » ?`)) void deleteCostItem(c.id); }}
                        aria-label="Supprimer"
                      ><IconTrash /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(creating || editing) && (
        <CostFormModal projectId={project.id} item={editing ?? undefined} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}

function CostFormModal({ projectId, item, onClose }: { projectId: string; item?: CostItem; onClose: () => void }) {
  const { addCostItem, updateCostItem } = useWorkspace();
  const [label, setLabel] = useState(item?.label ?? '');
  const [planned, setPlanned] = useState(String(item?.planned ?? ''));
  const [actual, setActual] = useState(String(item?.actual ?? ''));
  const [error, setError] = useState('');

  const submit = () => {
    if (!label.trim()) { setError('Le libellé du poste est obligatoire.'); return; }
    const input: CostItemInput = { label: label.trim(), planned: Number(planned) || 0, actual: Number(actual) || 0 };
    if (item) void updateCostItem(item.id, input);
    else void addCostItem(projectId, input);
    onClose();
  };

  return (
    <Modal
      title={item ? 'Modifier le poste' : 'Nouveau poste de coût'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit}>{item ? 'Enregistrer' : 'Ajouter'}</button>
        </>
      }
    >
      <div className="field">
        <label>Poste <span className="req">*</span></label>
        <input type="text" value={label} autoFocus placeholder="Ex. Pièces détachées" onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Budget prévu (€)</label>
          <input type="number" inputMode="numeric" value={planned} placeholder="0" onChange={(e) => setPlanned(e.target.value)} />
        </div>
        <div className="field">
          <label>Coût réel (€)</label>
          <input type="number" inputMode="numeric" value={actual} placeholder="0" onChange={(e) => setActual(e.target.value)} />
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
