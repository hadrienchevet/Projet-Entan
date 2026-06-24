'use client';

import { useEffect, useState } from 'react';
import { useWorkspace, FREE_SEATS } from '@/lib/store';

/** Prix mensuel par siège (affichage). Le montant réel vient du prix Stripe. */
const PRICE_PER_SEAT = 9;

/**
 * Page Abonnement — facturation par siège. Affiche les sièges actifs/payés,
 * lance Checkout/Portal, ou active un accès offert via clé.
 */
export function BillingPage() {
  const { company, seatsActive, isCompanyAdmin, redeemAccessKey, refreshCompany } = useWorkspace();
  const [notice, setNotice] = useState<string | null>(null);
  const [keyCode, setKeyCode] = useState('');
  const [keyMsg, setKeyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('success')) {
      setNotice('Paiement confirmé — mise à jour des sièges…');
      let n = 0;
      const t = setInterval(() => {
        n += 1;
        void refreshCompany();
        if (n >= 6) clearInterval(t);
      }, 1500);
      return () => clearInterval(t);
    }
    if (p.get('canceled')) setNotice('Paiement annulé — aucun changement.');
  }, [refreshCompany]);

  const paidSeats = company?.seats ?? 0;
  const isComp = company?.isComp ?? false;
  const available = Math.max(FREE_SEATS, paidSeats);

  const redeem = async () => {
    setKeyMsg(null);
    setPending(true);
    const r = await redeemAccessKey(keyCode);
    setPending(false);
    if (r.ok) {
      setKeyMsg({ ok: true, text: 'Clé valide — accès offert activé.' });
      setKeyCode('');
    } else {
      setKeyMsg({
        ok: false,
        text: r.error.includes('invalid_or_used_key')
          ? 'Clé invalide ou déjà utilisée.'
          : 'Échec : ' + r.error,
      });
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Abonnement</h1>
          <p className="subtitle">Facturation par siège — {PRICE_PER_SEAT} € / siège / mois.</p>
        </div>
      </header>

      {notice && (
        <div className="card">
          <div className="card-body">{notice}</div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {isComp ? (
            <>
              <h2>Accès offert ✨</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                Votre entreprise bénéficie d’un accès gratuit illimité (sièges illimités). Aucun
                paiement requis.
              </p>
            </>
          ) : (
            <>
              <h2>Sièges</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                <strong>{seatsActive}</strong> membre(s) actif(s) · <strong>{available}</strong>{' '}
                siège(s) disponible(s){' '}
                {paidSeats > 0 ? `(${paidSeats} payé(s))` : `(dont ${FREE_SEATS} gratuits)`}.
              </p>
              {isCompanyAdmin ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {paidSeats > 0 ? (
                    <form action="/api/stripe/portal" method="post">
                      <button type="submit" className="btn">
                        Gérer les sièges &amp; la facturation
                      </button>
                    </form>
                  ) : (
                    <form action="/api/stripe/checkout" method="post">
                      <button type="submit" className="btn btn-primary">
                        Activer la facturation (ajouter des sièges)
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="form-hint" style={{ marginTop: 12 }}>
                  Seul un administrateur peut gérer l’abonnement.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {!isComp && isCompanyAdmin && (
        <div className="card">
          <div className="card-body">
            <h2>Utiliser ma clé</h2>
            <p className="form-hint" style={{ marginTop: 6 }}>
              Vous avez une clé d’accès ? Saisissez-la pour activer un accès offert.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={keyCode}
                onChange={(e) => setKeyCode(e.target.value)}
                placeholder="ENTAN-XXXX-XXXX-XXXX-XXXX"
                style={{ maxWidth: 300 }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending || !keyCode.trim()}
                onClick={redeem}
              >
                {pending ? '…' : 'Valider la clé'}
              </button>
            </div>
            {keyMsg && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: keyMsg.ok ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {keyMsg.text}
              </p>
            )}
          </div>
        </div>
      )}

      <p className="form-hint" style={{ marginTop: 4 }}>
        En souscrivant, vous acceptez les <a href="/cgv">CGV</a> et la{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </div>
  );
}
