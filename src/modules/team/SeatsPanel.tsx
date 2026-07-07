'use client';

import Link from 'next/link';
import { useWorkspace } from '@/lib/store';

/**
 * Résumé des sièges de l'entreprise : combien on en a, combien sont utilisés,
 * combien restent. Purement présentational — lit `seatsAllowed`,
 * `companyMembers` et les statuts déjà fournis par le store.
 *
 * Convention : une invitation en attente (`seatsInvited`) réserve un siège
 * jusqu'à son acceptation ou son expiration. Le store bloque l'invitation en
 * amont quand actifs + invités atteignent la limite.
 */
export function SeatsPanel() {
  const { company, companyMembers, seatsAllowed, seatsInvited, isCompanyAdmin } = useWorkspace();
  if (!company) return null;

  const active = companyMembers.filter((m) => m.status === 'active').length;
  const invited = seatsInvited;
  const unlimited = !Number.isFinite(seatsAllowed);
  const reserved = active + invited;
  const free = unlimited ? Infinity : Math.max(0, seatsAllowed - reserved);
  const full = !unlimited && free === 0;

  // Pastilles individuelles pour les petites équipes ; barre au-delà.
  const showCells = !unlimited && seatsAllowed > 0 && seatsAllowed <= 16;
  const cells = showCells
    ? Array.from({ length: seatsAllowed }, (_, i) =>
        i < active ? 'u' : i < active + invited ? 'i' : 'f',
      )
    : [];

  const pctUsed = unlimited || seatsAllowed === 0 ? 0 : (active / seatsAllowed) * 100;
  const pctInvited = unlimited || seatsAllowed === 0 ? 0 : (invited / seatsAllowed) * 100;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Sièges</h2>
          <span className={`badge ${unlimited ? 'done' : 'in_progress'}`}>
            {unlimited ? 'Accès offert' : 'Plan Équipe'}
          </span>
        </div>
        {isCompanyAdmin && (
          <Link className="link" href="/abonnement">Gérer l’abonnement</Link>
        )}
      </div>

      <div className="card-body">
        {unlimited ? (
          <div className="seats-metric">
            <span className="n">{active}</span>
            <span className="d">membre(s) actif(s) · sièges illimités</span>
          </div>
        ) : (
          <>
            <div className="seats-metric">
              <span className="n">{active}</span>
              <span className="d">/ {seatsAllowed} sièges utilisés</span>
            </div>

            {showCells ? (
              <div className="seats-cells">
                {cells.map((k, i) => (
                  <span key={i} className={`seats-cell ${k}`} />
                ))}
              </div>
            ) : (
              <div className="seats-bar">
                <span className="u" style={{ width: `${pctUsed}%` }} />
                <span className="i" style={{ width: `${pctInvited}%` }} />
              </div>
            )}

            <div className="seats-legend">
              <span><span className="dot u" />{active} actif(s)</span>
              {invited > 0 && <span><span className="dot i" />{invited} invité(s) — siège réservé</span>}
              <span><span className="dot f" />{free} libre(s)</span>
            </div>
          </>
        )}
      </div>

      {!unlimited && isCompanyAdmin && (
        <div className="seats-foot">
          <span className={full ? 'danger-text' : 'muted'}>
            {full
              ? 'Tous les sièges sont occupés.'
              : `${free} siège(s) disponible(s) pour inviter votre équipe.`}
          </span>
          <Link className="btn btn-sm" href="/abonnement">
            {full ? 'Ajouter des sièges' : 'Voir l’abonnement'}
          </Link>
        </div>
      )}
    </div>
  );
}
