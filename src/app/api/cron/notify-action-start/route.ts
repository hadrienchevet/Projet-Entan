import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Cron quotidien : envoie un rappel email au RESPONSABLE des actions qui
 * démarrent aujourd'hui et dont l'option « Signaler par email » est cochée.
 * - Ciblé responsable uniquement, seulement s'il a un compte (email connu).
 * - Journal `notification_log` (action × 'start') → chaque email n'est envoyé
 *   qu'UNE seule fois, jamais de répétition.
 * - Protégé par CRON_SECRET (Vercel Cron envoie « Authorization: Bearer … »).
 * Route publique (cf. middleware) : appelée serveur-à-serveur par Vercel.
 */

function renderHtml(name: string, actionTitle: string, projectName: string, siteUrl: string): string {
  const logo = `${siteUrl}/email-logo.png`;
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#faf9f5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f1e1b;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td valign="middle"><img src="${logo}" width="36" height="36" alt="Projet Entan" style="display:block;border:0;border-radius:9px;" /></td>
        <td valign="middle" style="padding-left:10px;"><strong style="font-size:16px;color:#1f1e1b;">Projet Entan</strong></td>
      </tr>
    </table>
    <p style="font-size:15px;line-height:1.6;color:#5d5c56;">Bonjour ${name},</p>
    <p style="font-size:15px;line-height:1.6;color:#5d5c56;">
      Une action dont vous êtes responsable <strong>démarre aujourd'hui</strong> dans le projet
      « ${projectName} » :
    </p>
    <p style="font-size:16px;font-weight:600;margin:16px 0;padding:12px 16px;background:#f5e9e2;border-radius:8px;">
      ${actionTitle}
    </p>
    <p style="margin:24px 0;">
      <a href="${siteUrl}/actions" style="display:inline-block;background:#c15f3c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Voir l'action</a>
    </p>
    <p style="font-size:12.5px;color:#9d9a8f;margin-top:24px;">Vous recevez cet email car cette action a été configurée pour vous prévenir à son démarrage.</p>
  </div>
</body></html>`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY manquant.' }, { status: 500 });
  const from = process.env.RESEND_FROM ?? 'Projet Entan <onboarding@resend.dev>';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://projetentan.fr').replace(/\/$/, '');

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: actions, error } = await admin
    .from('actions')
    .select('id, title, responsible_id, projects(name)')
    .eq('notify_email', true)
    .eq('start_date', today)
    .neq('status', 'done');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const a of actions ?? []) {
    // Déjà notifié ? (garde-fou anti-doublon)
    const { data: log } = await admin
      .from('notification_log')
      .select('id')
      .eq('action_id', a.id)
      .eq('kind', 'start')
      .maybeSingle();
    if (log) continue;

    // Email du responsable via member → profile (uniquement s'il a un compte).
    const { data: member } = await admin
      .from('members')
      .select('user_id, name')
      .eq('id', a.responsible_id)
      .maybeSingle();
    if (!member?.user_id) continue;
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', member.user_id)
      .maybeSingle();
    if (!profile?.email) continue;

    const projectName = (a.projects as { name?: string } | null)?.name ?? 'votre projet';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [profile.email],
        subject: `Une action démarre aujourd'hui — ${projectName}`,
        html: renderHtml(member.name || 'bonjour', a.title, projectName, siteUrl),
      }),
    });
    if (res.ok) {
      await admin.from('notification_log').insert({ action_id: a.id, kind: 'start' });
      sent++;
    }
  }

  return NextResponse.json({ checked: actions?.length ?? 0, sent });
}
