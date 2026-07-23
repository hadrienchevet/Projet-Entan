'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
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
  if (/provider is not enabled|unsupported provider/i.test(message))
    return 'La connexion Google n’est pas encore activée. Réessayez bientôt.';
  return message;
}

function isUnconfirmed(error: { code?: string; message: string }): boolean {
  return error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message);
}

/** Logo Google officiel (4 couleurs) pour le bouton de connexion. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') ?? '/projets';
  // Seuls les chemins internes SIMPLES sont autorisés (anti open-redirect) :
  // un `next` comme `//evil.com` ou `/\evil.com` passe un simple startsWith('/')
  // mais est interprété comme une URL absolue par le navigateur → on le refuse.
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/projets';

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

  const signInWithGoogle = async () => {
    setError('');
    setNotice('');
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // Succès → le navigateur est redirigé vers Google (la page se recharge).
    // Erreur (ex. provider non activé) → on l'affiche et on réactive le bouton.
    if (error) {
      setPending(false);
      setError(friendlyError(error.message));
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
          <Image src="/entan-logo-t.png" alt="" width={44} height={44} priority />
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

        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              className="btn btn-google"
              onClick={signInWithGoogle}
              disabled={pending}
              style={{ justifyContent: 'center', width: '100%' }}
            >
              <GoogleG /> Continuer avec Google
            </button>
            <div className="auth-divider">
              <span>ou</span>
            </div>
          </>
        )}

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
