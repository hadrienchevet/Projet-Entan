'use client';

import { useEffect, useState } from 'react';
import { useWorkspace } from '@/lib/store';

/** Prix mensuel par siège (affichage). Le montant réel vient du prix Stripe. */
const PRICE_PER_SEAT = 9;

const css = `
.pay { max-width: 760px; margin: 0 auto; padding: 8px 16px 48px; }
.pay-hero { text-align: center; padding: 28px 0 4px; }
.pay-logo { width: 54px; height: 54px; border-radius: 15px; background: linear-gradient(135deg, var(--accent), var(--accent-hover)); color: #fff; display: inline-grid; place-items: center; font-weight: 800; font-size: 20px; box-shadow: var(--shadow); }
.pay-hero h1 { font-size: 27px; letter-spacing: -0.02em; margin: 16px 0 6px; }
.pay-hero p { color: var(--text-secondary); font-size: 15px; max-width: 460px; margin: 0 auto; line-height: 1.6; }
.pay-notice { background: var(--accent-soft); color: var(--accent-text); border: 1px solid var(--accent-faint); border-radius: 10px; padding: 12px 14px; font-size: 13.5px; margin-top: 20px; text-align: center; }
.pay-summary { text-align: center; color: var(--text-secondary); font-size: 14px; margin-top: 18px; }
.pay-summary strong { color: var(--text); }
.pay-grid { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; margin-top: 26px; }
.pay-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: var(--shadow); display: flex; flex-direction: column; }
.pay-card.featured { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 10px 34px rgb(0 0 0 / 0.07); }
.pay-card h2 { font-size: 17px; margin: 6px 0 0; }
.pay-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); }
.pay-price { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin: 12px 0 4px; }
.pay-price span { font-size: 14px; font-weight: 500; color: var(--text-muted); }
.pay-list { list-style: none; padding: 0; margin: 14px 0 22px; display: flex; flex-direction: column; gap: 9px; }
.pay-list li { display: flex; gap: 9px; align-items: flex-start; font-size: 13.5px; color: var(--text-secondary); }
.pay-list li::before { content: '✓'; color: var(--accent); font-weight: 800; }
.pay-muted { color: var(--text-muted); font-size: 13px; margin: 8px 0 0; line-height: 1.5; }
.pay-key { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
.pay-key input { width: 100%; }
.pay-keymsg { font-size: 13px; }
.pay-cta { margin-top: auto; }
.pay-cta .btn { width: 100%; justify-content: center; }
.pay-seats { display: flex; gap: 32px; margin: 18px 0; }
.pay-seats > div { display: flex; flex-direction: column; }
.pay-seats strong { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
.pay-seats span { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.pay-comp { text-align: center; align-items: center; margin-top: 26px; background: var(--accent-soft); border-color: var(--accent-faint); }
.pay-badge { display: inline-block; background: var(--accent); color: #fff; border-radius: 999px; padding: 5px 14px; font-weight: 700; font-size: 13px; margin-bottom: 10px; }
.pay-legal { text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 26px; }
.pay-legal a { color: var(--accent); }
@media (max-width: 640px) { .pay-grid { grid-template-columns: 1fr; } }
`;

/**
 * Abonnement / paywall — facturation par siège. Trois états : accès offert
 * (clé), paywall (s'abonner ou saisir une clé), gestion des sièges (payé).
 */
export function BillingPage() {
  const { company, seatsActive, isCompanyAdmin, companyActivated, redeemAccessKey, refreshCompany } =
    useWorkspace();
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
  const compSeats = company?.compSeats ?? 0;
  const totalSeats = paidSeats + compSeats;
  const seatsDetail = (() => {
    const parts: string[] = [];
    if (compSeats > 0) parts.push(`${compSeats} via clé${compSeats > 1 ? 's' : ''}`);
    if (paidSeats > 0) parts.push(`${paidSeats} payé${paidSeats > 1 ? 's' : ''}`);
    return parts.length ? ` (${parts.join(', ')})` : '';
  })();
  const isComp = company?.isComp ?? false;

  const redeem = async () => {
    setKeyMsg(null);
    setPending(true);
    const r = await redeemAccessKey(keyCode);
    setPending(false);
    if (r.ok) {
      setKeyMsg({ ok: true, text: 'Clé valide — 1 siège ajouté ✨' });
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

  const title = isComp ? 'Accès offert' : !companyActivated ? 'Activez Projet Entan' : 'Abonnement';
  const subtitle = isComp
    ? 'Votre entreprise bénéficie d’un accès complet, offert.'
    : !companyActivated
      ? 'Pour continuer, abonnez-vous par siège ou utilisez une clé d’accès.'
      : `Facturation par siège — ${PRICE_PER_SEAT} € / siège / mois.`;

  const keyCard = (
    <div className="pay-card">
      <div className="pay-eyebrow">Clé d’accès</div>
      <h2>J’ai une clé</h2>
      <p className="pay-muted">Chaque clé d’accès ajoute <strong>1 siège</strong> à votre entreprise.</p>
      {isCompanyAdmin ? (
        <div className="pay-key">
          <input
            type="text"
            value={keyCode}
            onChange={(e) => setKeyCode(e.target.value)}
            placeholder="ENTAN-XXXX-XXXX-XXXX-XXXX"
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || !keyCode.trim()}
            onClick={redeem}
            style={{ justifyContent: 'center' }}
          >
            {pending ? '…' : 'Valider la clé'}
          </button>
          {keyMsg && (
            <p
              className="pay-keymsg"
              style={{ color: keyMsg.ok ? 'var(--success)' : 'var(--danger)' }}
            >
              {keyMsg.text}
            </p>
          )}
        </div>
      ) : (
        <p className="pay-muted">Réservé à un administrateur de l’entreprise.</p>
      )}
    </div>
  );

  return (
    <div className="pay">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="pay-hero">
        <span className="pay-logo">PE</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {notice && <div className="pay-notice">{notice}</div>}

      {isComp ? (
        <div className="pay-card pay-comp">
          <span className="pay-badge">✨ Accès offert</span>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
            Sièges illimités et toutes les fonctionnalités, sans paiement.
          </p>
        </div>
      ) : (
        <>
          <p className="pay-summary">
            <strong>{seatsActive}</strong> membre(s) actif(s) · <strong>{totalSeats}</strong> siège(s)
            {seatsDetail}
          </p>
          <div className="pay-grid">
            <div className="pay-card featured">
              <div className="pay-eyebrow">Abonnement par siège</div>
              <h2>Payer un siège</h2>
              <div className="pay-price">
                {PRICE_PER_SEAT} € <span>/ siège / mois</span>
              </div>
              <ul className="pay-list">
                <li>Projets illimités</li>
                <li>Collaboration en temps réel</li>
                <li>Tous les modules (RACI, AMDEC, Planning, RDP…)</li>
                <li>Ajoutez ou retirez des sièges à tout moment</li>
              </ul>
              {isCompanyAdmin ? (
                <form
                  action={paidSeats > 0 ? '/api/stripe/portal' : '/api/stripe/checkout'}
                  method="post"
                  className="pay-cta"
                >
                  <button type="submit" className="btn btn-primary">
                    {paidSeats > 0 ? 'Gérer les sièges' : 'S’abonner'}
                  </button>
                </form>
              ) : (
                <p className="pay-muted">Réservé à un administrateur de l’entreprise.</p>
              )}
            </div>
            {keyCard}
          </div>
        </>
      )}

      <p className="pay-legal">
        En souscrivant, vous acceptez les <a href="/cgv">CGV</a> et la{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </div>
  );
}
