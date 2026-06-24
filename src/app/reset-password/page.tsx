'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Définition d'un nouveau mot de passe après clic sur le lien de
 * réinitialisation. Le lien email passe par /auth/callback qui établit la
 * session « recovery » puis redirige ici ; on appelle alors updateUser().
 */
export default function ResetPasswordPage() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setChecking(false);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  return (
    <main className="auth-main" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <div className="card auth-card">
        <div className="auth-brand">
          <span
            className="logo-lg"
            style={{
              width: 40,
              height: 40,
              fontSize: 16,
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
            }}
          >
            PE
          </span>
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        {checking ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Vérification du lien…</p>
        ) : done ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-success">Votre mot de passe a été mis à jour.</div>
            <a className="btn btn-primary" href="/" style={{ justifyContent: 'center' }}>
              Accéder à l’application
            </a>
          </div>
        ) : !hasSession ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-error">
              Lien invalide ou expiré. Refaites une demande depuis la page de connexion.
            </div>
            <a className="btn" href="/login" style={{ justifyContent: 'center' }}>
              Retour à la connexion
            </a>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label htmlFor="password">
                Nouveau mot de passe <span className="req">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label htmlFor="confirm">
                Confirmer le mot de passe <span className="req">*</span>
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
              style={{ justifyContent: 'center' }}
            >
              {pending ? '…' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
