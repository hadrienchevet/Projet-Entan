'use client';

import type { AmdecEntry } from '@/lib/types';
import { criticality, residualCriticality } from '@/lib/types';
import { CriticalityBadge } from '@/components/Badges';

/**
 * Matrice de risque gravité × occurrence, avant et après actions correctives.
 * Chaque analyse est une pastille numérotée placée dans la cellule (G, O) ;
 * la couleur de zone suit le produit G × O (≥ 9 critique, ≥ 4 à surveiller).
 * La comparaison détaillée (criticité G×O×D avant → après) est listée dessous.
 */

/** Zone de la cellule selon le produit gravité × occurrence (1–16). */
function cellZone(g: number, o: number): 'low' | 'med' | 'high' {
  const p = g * o;
  if (p >= 9) return 'high';
  if (p >= 4) return 'med';
  return 'low';
}

interface Plotted {
  entry: AmdecEntry;
  num: number;
}

function Matrix({
  title,
  items,
  position,
  emptyHint,
}: {
  title: string;
  items: Plotted[];
  /** Donne la position (G, O) d'un item dans cette matrice. */
  position: (e: AmdecEntry) => { g: number; o: number };
  emptyHint?: string;
}) {
  const grid: Plotted[][][] = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => []),
  );
  for (const item of items) {
    const { g, o } = position(item.entry);
    grid[g - 1][o - 1].push(item);
  }

  return (
    <div className="risk-matrix-block">
      <h3 className="rm-title">{title}</h3>
      <div className="risk-matrix">
        <div className="rm-axis-y">Gravité</div>
        {/* Lignes : gravité 4 (haut) → 1 (bas). */}
        {[4, 3, 2, 1].map((g) => (
          <div key={g} className="rm-row">
            <div className="rm-head">{g}</div>
            {[1, 2, 3, 4].map((o) => (
              <div key={o} className={`rm-cell rm-${cellZone(g, o)}`}>
                {grid[g - 1][o - 1].map(({ entry, num }) => (
                  <span
                    key={entry.id}
                    className="rm-chip"
                    title={`${entry.element} — ${entry.failureMode}`}
                  >
                    {num}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
        <div className="rm-row">
          <div className="rm-head" />
          {[1, 2, 3, 4].map((o) => (
            <div key={o} className="rm-head">{o}</div>
          ))}
        </div>
        <div className="rm-axis-x">Occurrence</div>
      </div>
      {items.length === 0 && emptyHint && (
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{emptyHint}</p>
      )}
    </div>
  );
}

export function RiskMatrixView({ entries }: { entries: AmdecEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <p>Aucune analyse AMDEC — la matrice de risque se remplit à partir du tableau.</p>
        </div>
      </div>
    );
  }

  // Numérotation stable (l'ordre reçu = tri par criticité décroissante).
  const plotted: Plotted[] = entries.map((entry, i) => ({ entry, num: i + 1 }));
  const reassessed = plotted.filter(({ entry }) => residualCriticality(entry) !== null);

  const totalBefore = entries.reduce((sum, e) => sum + criticality(e), 0);
  // La réduction n'est mesurée que sur les analyses réévaluées.
  const beforeOnReassessed = reassessed.reduce((s, { entry }) => s + criticality(entry), 0);
  const afterOnReassessed = reassessed.reduce(
    (s, { entry }) => s + (residualCriticality(entry) ?? 0),
    0,
  );
  const reduction =
    beforeOnReassessed > 0
      ? Math.round(((beforeOnReassessed - afterOnReassessed) / beforeOnReassessed) * 100)
      : null;

  return (
    <>
      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="card stat-card">
          <div className="stat-value">{totalBefore}</div>
          <div className="stat-label">Criticité cumulée avant actions</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">
            {reassessed.length > 0 ? afterOnReassessed : '—'}
          </div>
          <div className="stat-label">
            Criticité après actions ({reassessed.length}/{entries.length} réévaluées)
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{reduction !== null ? `−${reduction} %` : '—'}</div>
          <div className="stat-label">Réduction du risque (analyses réévaluées)</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="risk-matrices">
          <Matrix
            title="Avant actions correctives"
            items={plotted}
            position={(e) => ({ g: e.severity, o: e.occurrence })}
          />
          <Matrix
            title="Après actions correctives"
            items={reassessed}
            position={(e) => ({ g: e.severityAfter ?? 1, o: e.occurrenceAfter ?? 1 })}
            emptyHint="Aucune analyse réévaluée — renseignez la cotation « après actions » en modifiant une analyse."
          />
        </div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 40 }}>N°</th>
              <th>Élément — mode de défaillance</th>
              <th>Criticité avant</th>
              <th>Criticité après</th>
              <th>Évolution</th>
            </tr>
          </thead>
          <tbody>
            {plotted.map(({ entry, num }) => {
              const before = criticality(entry);
              const after = residualCriticality(entry);
              return (
                <tr key={entry.id}>
                  <td><span className="rm-chip">{num}</span></td>
                  <td className="cell-title">
                    {entry.element}
                    <div className="cell-sub">{entry.failureMode}</div>
                  </td>
                  <td><CriticalityBadge score={before} /></td>
                  <td>
                    {after !== null ? (
                      <CriticalityBadge score={after} />
                    ) : (
                      <span className="muted">non réévaluée</span>
                    )}
                  </td>
                  <td>
                    {after !== null ? (
                      <span className={after < before ? 'rm-delta-down' : after > before ? 'rm-delta-up' : 'muted'}>
                        {after < before ? '▼' : after > before ? '▲' : '='}{' '}
                        {after - before > 0 ? `+${after - before}` : after - before}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
