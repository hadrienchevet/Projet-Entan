import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Lien d'invitation /invite/{token} :
 *  - non connecté → login avec retour automatique ici (géré par le proxy) ;
 *  - connecté → accept_invitation() (RPC SECURITY DEFINER) ajoute l'accès et
 *    rattache le compte à l'équipe, puis redirige vers le projet.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const { data: projectId, error } = await supabase.rpc('accept_invitation', {
    p_token: token,
  });

  if (error || !projectId) {
    return (
      <main className="auth-main">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <h1 className="danger-text">Invitation invalide</h1>
          <p className="muted">
            Ce lien d&apos;invitation est expiré ou n&apos;existe pas. Demandez un nouveau lien à
            un membre du projet.
          </p>
          <Link href="/" className="btn" style={{ alignSelf: 'center' }}>
            ← Mes projets
          </Link>
        </div>
      </main>
    );
  }

  redirect(`/?project=${projectId}`);
}
