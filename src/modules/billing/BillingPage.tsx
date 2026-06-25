'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/store';

const css = `
.pay { max-width: 760px; margin: 0 auto; padding: 8px 16px 48px; }
.pay-hero { text-align: center; padding: 28px 0 4px; }
.pay-logo { width: 54px; height: 54px; border-radius: 15px; background: linear-gradient(135deg, var(--accent), var(--accent-hover)); color: #fff; display: inline-grid; place-items: center; font-weight: 800; font-size: 20px; box-shadow: var(--shadow); }
.pay-hero h1 { font-size: 27px; letter-spacing: -0.02em; margin: 16px 0 6px; }
.pay-hero p { color: var(--text-secondary); font-size: 15px; max-width: 460px; margin: 0 auto; line-height: 1.6; }
.pay-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: var(--shadow); display: flex; flex-direction: column; }
.pay-card.featured { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 10px 34px rgb(0 0 0 / 0.07); }
.pay-card h2 { font-size: 17px; margin: 6px 0 0; }
.pay-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); }
.pay-muted { color: var(--text-muted); font-size: 13px; margin: 8px 0 0; line-height: 1.5; }
.pay-key { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.pay-key input { width: 100%; }
.pay-keymsg { font-size: 13px; }
.pay-comp { text-align: center; align-items: center; margin: 26px auto 0; max-width: 460px; background: var(--accent-soft); border-color: var(--accent-faint); }
.pay-badge { display: inline-block; background: var(--accent); color: #fff; border-radius: 999px; padding: 5px 14px; font-weight: 700; font-size: 13px; margin-bottom: 10px; }
.pay-legal { text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 26px; }
.pay-legal a { color: var(--accent); }
`;

/**
 * Siège personnel : 1 clé = 1 siège. Sans siège → saisie de la clé. Avec siège
 * → statut. (Le paiement Stripe sera réintégré ici plus tard.)
 */
export function BillingPage() {
  const { hasSeat, company, redeemAccessKey } = useWorkspace();
  const [keyCode, setKeyCode] = useState('');
  const [keyMsg, setKeyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const redeem = async () => {
    setKeyMsg(null);
    setPending(true);
    const r = await redeemAccessKey(keyCode);
    setPending(false);
    if (r.ok) {
      setKeyMsg({ ok: true, text: 'Clé valide — siège activé ✨' });
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
    <div className="pay">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="pay-hero">
        <span className="pay-logo">PE</span>
        <h1>{hasSeat ? 'Votre siège' : 'Activez votre siège'}</h1>
        <p>
          {hasSeat
            ? 'Votre accès est actif.'
            : 'Pour accéder à Projet Entan, activez votre siège avec votre clé d’accès (1 clé = 1 siège).'}
        </p>
      </div>

      {hasSeat ? (
        <div className="pay-card pay-comp">
          <span className="pay-badge">✓ Siège actif</span>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
            Votre siège est actif{company ? ` dans « ${company.name} »` : ''}.{' '}
            {company ? 'Invitez votre équipe via la clé de l’entreprise (page Équipe).' : ''}
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 460, margin: '26px auto 0' }}>
          <div className="pay-card featured">
            <div className="pay-eyebrow">Clé d’accès</div>
            <h2>Entrez votre clé</h2>
            <p className="pay-muted">
              Une clé d’accès débloque <strong>votre siège</strong>. Saisissez la vôtre pour activer
              votre accès.
            </p>
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
                {pending ? '…' : 'Activer mon siège'}
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
          </div>
        </div>
      )}

      <p className="pay-legal">
        En utilisant le service, vous acceptez les <a href="/cgv">CGV</a> et la{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </div>
  );
}
