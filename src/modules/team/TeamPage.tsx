'use client';

import { useState } from 'react';
import { useWorkspace, FREE_SEATS } from '@/lib/store';

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

  if (!company) {
    return (
      <div className="page">
        <div className="card">
          <div className="card-body">Aucune entreprise active.</div>
        </div>
      </div>
    );
  }

  const allowed = company.isComp ? '∞' : Math.max(FREE_SEATS, company.seats);

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
          <p className="subtitle">
            {seatsActive} membre(s) actif(s) · {allowed} siège(s){' '}
            {company.isComp ? '(accès offert)' : ''}
          </p>
        </div>
      </header>

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
