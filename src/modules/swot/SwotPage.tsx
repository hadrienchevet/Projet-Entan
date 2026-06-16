'use client';

import { useState } from 'react';
import { useCurrentProject, useProjectSwot, useWorkspace } from '@/lib/store';
import { SWOT_QUADRANTS, type SwotQuadrant } from '@/lib/types';
import { IconTrash } from '@/components/icons';

/**
 * SWOT — matrice 2×2 : Forces, Faiblesses (interne) / Opportunités, Menaces
 * (externe). Ajout/suppression d'éléments par quadrant (façon grille Ishikawa).
 */
export function SwotPage() {
  const project = useCurrentProject();
  const items = useProjectSwot(project?.id);
  const { addSwotItem, deleteSwotItem } = useWorkspace();
  const [drafts, setDrafts] = useState<Partial<Record<SwotQuadrant, string>>>({});

  if (!project) return null;

  const add = (q: SwotQuadrant) => {
    const text = (drafts[q] ?? '').trim();
    if (!text) return;
    void addSwotItem(project.id, q, text);
    setDrafts((d) => ({ ...d, [q]: '' }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>SWOT</h1>
          <p className="subtitle">
            Forces et faiblesses (internes), opportunités et menaces (externes) — vue stratégique du projet.
          </p>
        </div>
      </div>

      <div className="swot-grid">
        {SWOT_QUADRANTS.map((q) => {
          const list = items.filter((i) => i.quadrant === q.id);
          return (
            <div key={q.id} className={`card swot-card swot-${q.tone}`}>
              <div className="swot-card-header">
                <span className="swot-card-title">{q.label}</span>
                <span className="swot-card-hint">{q.hint}</span>
              </div>
              {list.length === 0 ? (
                <p className="muted" style={{ fontSize: 12, margin: '4px 0 8px' }}>Aucun élément</p>
              ) : (
                <ul className="swot-list">
                  {list.map((i) => (
                    <li key={i.id} className="swot-item">
                      <span style={{ flex: 1 }}>{i.text}</span>
                      <button className="icon-btn danger" style={{ width: 22, height: 22 }} onClick={() => void deleteSwotItem(i.id)} aria-label="Supprimer">
                        <IconTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="swot-add">
                <input
                  type="text"
                  value={drafts[q.id] ?? ''}
                  placeholder="Ajouter un élément…"
                  onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && add(q.id)}
                />
                <button className="btn btn-sm" onClick={() => add(q.id)}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
