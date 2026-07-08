'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Connexion / inscription par email + mot de passe (Supabase Auth).
 * Le paramètre ?next= permet le retour vers la page demandée — notamment
 * les liens d'invitation /invite/{token}.
 */

/** Traduit les erreurs Supabase Auth les plus courantes. */
function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email ou mot de passe incorrect.';
  if (/already registered/i.test(message)) return 'Un compte existe déjà avec cet email.';
  if (/rate limit|too many|security purposes/i.test(message))
    return 'Trop de tentatives — patientez quelques minutes puis réessayez.';
  if (/password should be/i.test(message)) return 'Mot de passe trop court (6 caractères minimum).';
  return message;
}

function isUnconfirmed(error: { code?: string; message: string }): boolean {
  return error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message);
}

function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') ?? '/';
  // Seuls les chemins internes SIMPLES sont autorisés (anti open-redirect) :
  // un `next` comme `//evil.com` ou `/\evil.com` passe un simple startsWith('/')
  // mais est interprété comme une URL absolue par le navigateur → on le refuse.
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/';

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  /** Email d'un compte créé mais pas encore confirmé → propose le renvoi. */
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');

  // Base canonique des liens email : l'URL stable (NEXT_PUBLIC_SITE_URL) si elle
  // est définie, sinon l'origine courante. Évite de générer des liens vers un
  // déploiement figé (…-<hash>-….vercel.app) lorsqu'on agit depuis une preview.
  const siteOrigin = () =>
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || window.location.origin;

  const emailRedirectTo = () =>
    `${siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setUnconfirmedEmail('');
    setPending(true);
    const supabase = createClient();

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteOrigin()}/auth/callback?next=/reset-password`,
      });
      setPending(false);
      if (error) {
        setError(friendlyError(error.message));
      } else {
        setNotice(
          'Si un compte existe pour cet email, un lien de réinitialisation vient d’être envoyé. Pensez à vérifier vos spams.',
        );
      }
      return;
    }

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setPending(false);
        if (isUnconfirmed(error)) {
          setUnconfirmedEmail(email);
          setError('Votre adresse email n’est pas encore confirmée.');
        } else {
          setError(friendlyError(error.message));
        }
        return;
      }
      // Navigation complète : le serveur relit les cookies de session.
      window.location.assign(next);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() || email.split('@')[0] },
          emailRedirectTo: emailRedirectTo(),
        },
      });
      setPending(false);
      if (error) {
        setError(friendlyError(error.message));
        return;
      }
      if (data.session) {
        window.location.assign(next);
      } else {
        setUnconfirmedEmail(email);
        setNotice(
          'Compte créé. Un email de confirmation vous a été envoyé — pensez à vérifier vos spams.',
        );
      }
    }
  };

  const resendConfirmation = async () => {
    setError('');
    setNotice('');
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: unconfirmedEmail,
      options: { emailRedirectTo: emailRedirectTo() },
    });
    setPending(false);
    if (error) {
      setError(friendlyError(error.message));
    } else {
      setNotice(`Email de confirmation renvoyé à ${unconfirmedEmail} — vérifiez aussi vos spams.`);
    }
  };

  return (
    <main className="auth-main" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <div className="card auth-card">
        <div className="auth-brand">
          <span className="logo-lg" style={{ width: 40, height: 40, fontSize: 16, borderRadius: 10, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
            PE
          </span>
          <h1>Projet Entan</h1>
          <p>
            Pilotez vos projets industriels : gestion de projet ou résolution de problèmes — en
            équipe et en temps réel.
          </p>
        </div>

        <div className="auth-tabs">
          {mode === 'forgot' ? (
            <p style={{ textAlign: 'center', fontWeight: 600, margin: 0 }}>
              Réinitialiser le mot de passe
            </p>
          ) : (
            <div className="segmented">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={mode === m ? 'active' : ''}
                  onClick={() => setMode(m)}
                >
                  {m === 'signin' ? 'Connexion' : 'Créer un compte'}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="displayName">Nom affiché</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex. Claire Dubois"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">
              Email <span className="req">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
            />
          </div>
          {mode !== 'forgot' && (
            <div className="field">
              <label htmlFor="password">
                Mot de passe <span className="req">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
          {notice && <div className="form-success">{notice}</div>}

          {unconfirmedEmail && (
            <div className="field">
              <span className="form-hint">
                Pas d&apos;email reçu ? Le serveur mail par défaut de Supabase est limité et finit
                parfois en spam.
              </span>
              <button type="button" className="btn" onClick={resendConfirmation} disabled={pending}>
                Renvoyer l&apos;email de confirmation
              </button>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={pending} style={{ justifyContent: 'center' }}>
            {pending
              ? '…'
              : mode === 'forgot'
                ? 'Envoyer le lien'
                : mode === 'signin'
                  ? 'Se connecter'
                  : 'Créer mon compte'}
          </button>

          {mode === 'signin' && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ justifyContent: 'center' }}
              onClick={() => {
                setMode('forgot');
                setError('');
                setNotice('');
                setUnconfirmedEmail('');
              }}
            >
              Mot de passe oublié ?
            </button>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ justifyContent: 'center' }}
              onClick={() => {
                setMode('signin');
                setError('');
                setNotice('');
              }}
            >
              ← Retour à la connexion
            </button>
          )}
        </form>

        <p style={{ marginTop: 16, fontSize: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
          En créant un compte, vous acceptez les <a href="/cgv">CGV</a> et la{' '}
          <a href="/confidentialite">politique de confidentialité</a>.{' '}
          <a href="/mentions-legales">Mentions légales</a>.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
