'use client';

import { useState } from 'react';
import { useCurrentProject, useProjectCostItems, useWorkspace } from '@/lib/store';
import type { CostItem, CostItemInput } from '@/lib/types';
import { costVariance, costPlannedTotal, costActualTotal } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { IconEdit, IconPlus, IconTrash } from '@/components/icons';

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function CostsPage() {
  const project = useCurrentProject();
  const items = useProjectCostItems(project?.id);
  const { deleteCostItem, updateCostItem } = useWorkspace();
  const [editing, setEditing] = useState<CostItem | null>(null);
  const [creating, setCreating] = useState(false);

  if (!project) return null;

  const planned = items.reduce((s, c) => s + costPlannedTotal(c), 0);
  const actual = items.reduce((s, c) => s + costActualTotal(c), 0);
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
              <tr><th>Poste</th><th>Qté</th><th>Prévu</th><th>Réel</th><th>Écart</th><th /></tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const v = costVariance(c);
                return (
                  <tr key={c.id}>
                    <td className="cell-title">
                      {c.label}
                      {c.isSubscription && (
                        <span className="badge" style={{ marginLeft: 8 }}>Abonnement · {c.months} mois</span>
                      )}
                    </td>
                    <td>{c.quantity}</td>
                    <td>{eur(costPlannedTotal(c))}</td>
                    <td>{eur(costActualTotal(c))}</td>
                    <td style={{ color: v > 0 ? 'var(--danger)' : v < 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {v > 0 ? '+' : ''}{eur(v)}
                    </td>
                    <td className="actions-cell">
                      {c.isSubscription && (
                        <button
                          className="btn btn-sm"
                          onClick={() => void updateCostItem(c.id, { months: c.months + 1 })}
                          title="Ajouter un mois facturé"
                        >+1</button>
                      )}
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
  const [quantity, setQuantity] = useState(String(item?.quantity ?? '1'));
  const [isSubscription, setIsSubscription] = useState(item?.isSubscription ?? false);
  const [months, setMonths] = useState(String(item?.months ?? '1'));
  const [error, setError] = useState('');

  const qNum = Math.max(Number(quantity) || 1, 0);
  const mNum = isSubscription ? Math.max(Number(months) || 1, 1) : 1;
  const factor = qNum * mNum;
  const totalPlanned = (Number(planned) || 0) * factor;
  const totalActual = (Number(actual) || 0) * factor;

  const submit = () => {
    if (!label.trim()) { setError('Le libellé du poste est obligatoire.'); return; }
    const input: CostItemInput = {
      label: label.trim(),
      planned: Number(planned) || 0,
      actual: Number(actual) || 0,
      quantity: qNum,
      isSubscription,
      months: mNum,
    };
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
          <label>Prévu (€ {isSubscription ? '/ mois' : ''}{qNum !== 1 ? ' / unité' : ''})</label>
          <input type="number" inputMode="numeric" value={planned} placeholder="0" onChange={(e) => setPlanned(e.target.value)} />
        </div>
        <div className="field">
          <label>Réel (€ {isSubscription ? '/ mois' : ''}{qNum !== 1 ? ' / unité' : ''})</label>
          <input type="number" inputMode="numeric" value={actual} placeholder="0" onChange={(e) => setActual(e.target.value)} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Quantité</label>
          <input type="number" inputMode="numeric" min="0" value={quantity} placeholder="1" onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="field">
          <label>Type</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400, minHeight: 38 }}>
            <input type="checkbox" checked={isSubscription} onChange={(e) => setIsSubscription(e.target.checked)} style={{ width: 'auto' }} />
            Abonnement (coût mensuel)
          </label>
        </div>
      </div>
      {isSubscription && (
        <div className="field">
          <label>Nombre de mois facturés</label>
          <input type="number" inputMode="numeric" min="1" value={months} placeholder="1" onChange={(e) => setMonths(e.target.value)} />
          <span className="form-hint">Tu pourras faire « +1 mois » depuis la liste à chaque échéance.</span>
        </div>
      )}
      <div className="form-hint" style={{ marginTop: 8 }}>
        Total : <strong>{eur(totalPlanned)}</strong> prévu · <strong>{eur(totalActual)}</strong> réel
        {factor !== 1 && ` (montant × ${qNum}${isSubscription ? ` × ${mNum} mois` : ''})`}
      </div>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
