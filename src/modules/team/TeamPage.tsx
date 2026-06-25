'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/store';
import { CompanyOnboarding } from '@/components/CompanyOnboarding';

/** Gestion de l'équipe = des sièges : membres, invitations, rôles. */
export function TeamPage() {
  const {
    company,
    companyMembers,
    seatsActive,
    isCompanyAdmin,
    inviteCompanyMember,
    removeCompanyMember,
    userId,
  } = useWorkspace();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [pending, setPending] = useState(false);

  // Pas d'entreprise → on propose de créer / rejoindre (sans bloquer l'app).
  if (!company) {
    return <CompanyOnboarding />;
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLink('');
    if (!email.trim()) {
      setError('Email requis.');
      return;
    }
    setPending(true);
    const r = await inviteCompanyMember(email.trim(), role);
    setPending(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setLink(`${window.location.origin}/rejoindre/${r.token}`);
    setEmail('');
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Équipe</h1>
          <p className="subtitle">{seatsActive} membre(s) dans l’entreprise</p>
        </div>
      </header>

      <div className="card">
        <div className="card-body">
          <h2>Clé de l’entreprise</h2>
          <p className="form-hint" style={{ marginTop: 6 }}>
            Partagez cette clé : en la saisissant, vos collègues rejoignent le réseau de l’entreprise
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

      <div className="card">
        <div className="card-header">
          <h2>Membres</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rôle</th>
                <th>Statut</th>
                {isCompanyAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {companyMembers.map((m) => (
                <tr key={m.userId}>
                  <td>
                    <div className="cell-title">
                      {m.displayName || m.email || m.userId}
                      {m.userId === userId ? ' (vous)' : ''}
                    </div>
                    {m.email && <div className="cell-sub">{m.email}</div>}
                  </td>
                  <td>{m.role}</td>
                  <td>{m.status}</td>
                  {isCompanyAdmin && (
                    <td className="actions-cell">
                      {m.role !== 'owner' && m.userId !== userId && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeCompanyMember(m.userId)}
                        >
                          Retirer
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
