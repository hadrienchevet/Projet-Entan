'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Acceptation d'une invitation entreprise (rejoindre = occuper un siège). */
export default function JoinCompanyPage() {
  const params = useParams();
  const token = String(params.token ?? '');
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.assign(`/login?next=/rejoindre/${token}`);
        return;
      }
      const { error } = await supabase.rpc('accept_company_invitation', { p_token: token });
      if (error) {
        setState('error');
        setMsg(
          error.message.includes('seat_limit_reached')
            ? 'L’entreprise n’a plus de siège disponible. Demandez à un administrateur d’en ajouter un.'
            : error.message.includes('invitation_invalid')
              ? 'Invitation invalide ou expirée.'
              : error.message,
        );
      } else {
        setState('ok');
      }
    })();
  }, [token]);

  return (
    <main className="auth-main">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        {state === 'loading' && <p>Validation de l’invitation…</p>}
        {state === 'ok' && (
          <>
            <h1 style={{ fontSize: 20 }}>Bienvenue dans l’équipe 🎉</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '8px 0 16px' }}>
              Vous avez rejoint l’entreprise.
            </p>
            <a className="btn btn-primary" href="/" style={{ justifyContent: 'center' }}>
              Accéder à l’application
            </a>
          </>
        )}
        {state === 'error' && (
          <>
            <div className="form-error">{msg}</div>
            <a className="btn" href="/" style={{ justifyContent: 'center', marginTop: 12 }}>
              Retour
            </a>
          </>
        )}
      </div>
    </main>
  );
}
