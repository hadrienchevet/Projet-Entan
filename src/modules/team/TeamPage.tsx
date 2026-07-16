'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/store';
import { CompanyOnboarding } from '@/components/CompanyOnboarding';
import { SeatsPanel } from './SeatsPanel';

/** Gestion de l'équipe = des sièges : membres, invitations, rôles. */
export function TeamPage() {
  const { company, isCompanyAdmin, inviteCompanyMember } = useWorkspace();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [sent, setSent] = useState('');
  const [pending, setPending] = useState(false);

  // Pas d'entreprise → on propose de créer / rejoindre (sans bloquer l'app).
  if (!company) {
    return <CompanyOnboarding />;
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLink('');
    setSent('');
    const target = email.trim();
    if (!target) {
      setError('Email requis.');
      return;
    }
    setPending(true);
    const r = await inviteCompanyMember(target, role);
    if (!r.ok) {
      setPending(false);
      setError(
        r.error === 'seat_limit_reached'
          ? 'Tous les sièges sont occupés. Ajoutez un siège avant d’inviter un nouveau membre.'
          : r.error,
      );
      return;
    }
    setLink(`${window.location.origin}/rejoindre/${r.token}`);
    setEmail('');
    // Envoi de l'email d'invitation. Le lien reste affiché en secours si l'envoi échoue.
    try {
      const resp = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: r.token }),
      });
      setSent(
        resp.ok
          ? `Email d’invitation envoyé à ${target}.`
          : 'Invitation créée, mais l’email n’a pas pu être envoyé — partagez le lien ci-dessous.',
      );
    } catch {
      setSent('Invitation créée, mais l’email n’a pas pu être envoyé — partagez le lien ci-dessous.');
    }
    setPending(false);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Organisation</h1>
          <p className="subtitle">Gérez les sièges, les membres et leurs accès.</p>
        </div>
      </header>

      <SeatsPanel />

      <div className="card">
        <div className="card-body">
          <h2>Clé de l’organisation</h2>
          <p className="form-hint" style={{ marginTop: 6 }}>
            Partagez cette clé : en la saisissant, vos collègues rejoignent votre organisation
            (sans accès automatique à vos projets — ils devront être ajoutés projet par projet).
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <input
              readOnly
              value={company.joinCode}
              onFocus={(e) => e.currentTarget.select()}
              style={{ maxWidth: 240, fontWeight: 600 }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => void navigator.clipboard.writeText(company.joinCode)}
            >
              Copier
            </button>
          </div>
        </div>
      </div>

      {isCompanyAdmin && (
        <div className="card">
          <div className="card-body">
            <h2>Inviter un membre</h2>
            <form
              onSubmit={invite}
              style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}
            >
              <div className="field" style={{ flex: 1, minWidth: 200 }}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collegue@entreprise.com"
                />
              </div>
              <div className="field">
                <label>Rôle</label>
                <select value={role} onChange={(e) => setRole(e.target.value as 'member' | 'admin')}>
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? '…' : 'Inviter'}
              </button>
            </form>
            {error && (
              <div className="form-error" style={{ marginTop: 8 }}>
                {error}
              </div>
            )}
            {sent && (
              <div className="form-hint" style={{ marginTop: 8, color: 'var(--success)' }}>
                {sent}
              </div>
            )}
            {link && (
              <div style={{ marginTop: 12 }}>
                <p className="form-hint">Partagez ce lien d’invitation avec la personne :</p>
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  style={{ width: '100%', marginTop: 6 }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
