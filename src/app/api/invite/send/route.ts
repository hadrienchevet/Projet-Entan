import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Envoi de l'email d'invitation à rejoindre une organisation.
 * Le client passe seulement le `token` (jamais l'email : anti-abus). On charge
 * l'invitation, on vérifie que l'appelant est admin/owner de l'organisation,
 * puis on envoie via Resend (même infra que le cron notify-action-start).
 */

function renderHtml(
  orgName: string,
  inviterName: string,
  roleLabel: string,
  joinUrl: string,
  siteUrl: string,
): string {
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
    <p style="font-size:15px;line-height:1.6;color:#5d5c56;">Bonjour,</p>
    <p style="font-size:15px;line-height:1.6;color:#5d5c56;">
      <strong>${inviterName}</strong> vous invite à rejoindre l'organisation
      « ${orgName} » sur Projet Entan, en tant que <strong>${roleLabel}</strong>.
    </p>
    <p style="margin:24px 0;">
      <a href="${joinUrl}" style="display:inline-block;background:#c15f3c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Rejoindre l'organisation</a>
    </p>
    <p style="font-size:12.5px;color:#9d9a8f;line-height:1.6;margin-top:24px;">
      Ou copiez ce lien : <br /><span style="color:#5d5c56;">${joinUrl}</span>
    </p>
    <p style="font-size:12.5px;color:#9d9a8f;margin-top:16px;">Vous recevez cet email car quelqu'un vous a invité·e sur Projet Entan. Si vous ne vous attendiez pas à cette invitation, ignorez ce message.</p>
  </div>
</body></html>`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let token: string | undefined;
  try {
    ({ token } = (await request.json()) as { token?: string });
  } catch {
    /* corps invalide */
  }
  if (!token) return NextResponse.json({ error: 'token_manquant' }, { status: 400 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'resend_non_configure' }, { status: 500 });
  const from = process.env.RESEND_FROM ?? 'Projet Entan <onboarding@resend.dev>';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://projetentan.fr').replace(/\/$/, '');

  const admin = createAdminClient();

  const { data: inv } = await admin
    .from('company_invitations')
    .select('company_id, email, role, status, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (!inv || inv.status !== 'pending' || new Date(inv.expires_at as string) < new Date()) {
    return NextResponse.json({ error: 'invitation_invalide' }, { status: 404 });
  }

  // L'appelant doit être admin/owner de l'organisation qui a émis l'invitation.
  const { data: mem } = await admin
    .from('company_members')
    .select('role')
    .eq('company_id', inv.company_id as string)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (!mem || (mem.role !== 'owner' && mem.role !== 'admin')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data: company } = await admin
    .from('companies')
    .select('name')
    .eq('id', inv.company_id as string)
    .maybeSingle();
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const inviterName = profile?.display_name || profile?.email || 'Un administrateur';
  const orgName = company?.name || 'une organisation';
  const roleLabel = inv.role === 'admin' ? 'administrateur' : 'membre';
  const joinUrl = `${siteUrl}/rejoindre/${token}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [inv.email as string],
      subject: `${inviterName} vous invite dans « ${orgName} » sur Projet Entan`,
      html: renderHtml(orgName, inviterName, roleLabel, joinUrl, siteUrl),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return NextResponse.json({ error: 'resend_failed', detail }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
