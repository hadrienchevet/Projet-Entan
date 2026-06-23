'use client';

import { useEffect, useState } from 'react';
import { useWorkspace, FREE_PROJECTS_PER_TYPE } from '@/lib/store';

/**
 * Page Abonnement : compare Gratuit / Pro et lance Checkout (ou le portail
 * Stripe). Au retour de paiement (?success=1), rafraîchit le plan le temps que
 * le webhook arrive.
 */
export function BillingPage() {
  const { isPro, refreshPlan } = useWorkspace();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setNotice('Paiement confirmé — activation de ton abonnement en cours…');
      let tries = 0;
      const t = setInterval(() => {
        tries += 1;
        void refreshPlan();
        if (tries >= 6) clearInterval(t);
      }, 1500);
      return () => clearInterval(t);
    }
    if (params.get('canceled')) setNotice('Paiement annulé — aucun changement.');
  }, [refreshPlan]);

  const grid = {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  } as const;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Abonnement</h1>
          <p className="subtitle">
            Plan actuel : <strong>{isPro ? 'Pro' : 'Gratuit'}</strong>
          </p>
        </div>
      </header>

      {notice && (
        <div className="card">
          <div className="card-body">{notice}</div>
        </div>
      )}

      <div style={grid}>
        <div className="card">
          <div className="card-body">
            <h2>Gratuit</h2>
            <p style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 12px' }}>
              0 € <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/ mois</span>
            </p>
            <ul style={{ paddingLeft: 18, lineHeight: 1.8, margin: 0 }}>
              <li>{FREE_PROJECTS_PER_TYPE} projets de gestion</li>
              <li>{FREE_PROJECTS_PER_TYPE} projets de résolution de problèmes</li>
              <li>Tous les outils (RACI, AMDEC, Actions, Planning, Coûts, A3, SWOT…)</li>
              <li>Membres illimités par projet</li>
            </ul>
            {!isPro && (
              <p style={{ marginTop: 12 }}>
                <span className="badge">Plan actuel</span>
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2>Pro</h2>
            <p style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 12px' }}>
              24 € <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/ mois</span>
            </p>
            <ul style={{ paddingLeft: 18, lineHeight: 1.8, margin: 0 }}>
              <li>
                <strong>Projets illimités</strong> (gestion et RDP)
              </li>
              <li>Tous les outils</li>
              <li>Membres illimités</li>
              <li>Support prioritaire</li>
            </ul>
            <div style={{ marginTop: 16 }}>
              {isPro ? (
                <form action="/api/stripe/portal" method="post">
                  <button type="submit" className="btn">
                    Gérer mon abonnement
                  </button>
                </form>
              ) : (
                <form action="/api/stripe/checkout" method="post">
                  <button type="submit" className="btn btn-primary">
                    Passer à Pro
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="form-hint" style={{ marginTop: 4 }}>
        En souscrivant, vous acceptez les <a href="/cgv">CGV</a> et la{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </div>
  );
}
