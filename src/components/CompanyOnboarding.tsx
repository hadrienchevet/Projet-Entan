'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/store';

/**
 * Première étape pour un compte sans entreprise : créer son entreprise, ou
 * rejoindre celle de son équipe via sa clé entreprise.
 */
export function CompanyOnboarding() {
  const { createCompany, joinCompany } = useWorkspace();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPending(true);
    const r = mode === 'create' ? await createCompany(name.trim()) : await joinCompany(code.trim());
    setPending(false);
    if (!r.ok) setError(r.error);
  };

  return (
    <div style={{ maxWidth: 460, margin: '8vh auto 0', padding: '0 20px' }}>
      <div className="card">
        <div className="card-body">
          <h1 style={{ fontSize: 22 }}>Bienvenue 👋</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 16px', lineHeight: 1.6 }}>
            Créez votre entreprise, ou rejoignez celle de votre équipe avec sa clé.
          </p>

          <div className="segmented" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={mode === 'create' ? 'active' : ''}
              onClick={() => {
                setMode('create');
                setError('');
              }}
            >
              Créer une entreprise
            </button>
            <button
              type="button"
              className={mode === 'join' ? 'active' : ''}
              onClick={() => {
                setMode('join');
                setError('');
              }}
            >
              Rejoindre
            </button>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'create' ? (
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
            ) : (
              <div className="field">
                <label htmlFor="join-code">
                  Clé de l’entreprise <span className="req">*</span>
                </label>
                <input
                  id="join-code"
                  type="text"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ENT-XXXXXXXX"
                />
              </div>
            )}
            {error && <div className="form-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending || (mode === 'create' ? !name.trim() : !code.trim())}
              style={{ justifyContent: 'center' }}
            >
              {pending ? '…' : mode === 'create' ? 'Créer mon entreprise' : 'Rejoindre l’entreprise'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
