'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/store';

/** Première étape pour un compte sans entreprise : créer son entreprise. */
export function CompanyOnboarding() {
  const { createCompany } = useWorkspace();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Le nom de l’entreprise est obligatoire.');
      return;
    }
    setPending(true);
    const r = await createCompany(name.trim());
    setPending(false);
    if (!r.ok) setError(r.error);
  };

  return (
    <div style={{ maxWidth: 460, margin: '8vh auto 0', padding: '0 20px' }}>
      <div className="card">
        <div className="card-body">
          <h1 style={{ fontSize: 22 }}>Bienvenue 👋</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 20px', lineHeight: 1.6 }}>
            Créez votre entreprise pour commencer. Vous pourrez ensuite inviter votre équipe (chaque
            membre = un siège) et créer vos projets.
          </p>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label htmlFor="company-name">
                Nom de l’entreprise <span className="req">*</span>
              </label>
              <input
                id="company-name"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Mon entreprise"
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
              style={{ justifyContent: 'center' }}
            >
              {pending ? '…' : 'Créer mon entreprise'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
