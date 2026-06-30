import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';

/**
 * Send Email Hook Supabase : Supabase appelle cette route chaque fois qu'il doit
 * envoyer un email d'authentification (confirmation d'inscription,
 * réinitialisation de mot de passe, lien magique…). On vérifie la signature du
 * webhook puis on envoie l'email via Resend, avec nos propres modèles en
 * français. Route PUBLIQUE (cf. middleware) : Supabase appelle sans session.
 */

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
}

interface HookPayload {
  user: { email: string };
  email_data: EmailData;
}

/** Lien de vérification Supabase (consomme le token puis redirige vers redirect_to). */
function buildVerifyUrl(data: EmailData): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const params = new URLSearchParams({
    token: data.token_hash,
    type: data.email_action_type,
    redirect_to: data.redirect_to,
  });
  return `${base}/auth/v1/verify?${params.toString()}`;
}

function content(actionType: string): { subject: string; intro: string; cta: string } {
  switch (actionType) {
    case 'recovery':
      return {
        subject: 'Réinitialisez votre mot de passe — Projet Entan',
        intro: 'Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau.',
        cta: 'Choisir un nouveau mot de passe',
      };
    case 'magiclink':
      return {
        subject: 'Votre lien de connexion — Projet Entan',
        intro: 'Voici votre lien de connexion à Projet Entan.',
        cta: 'Se connecter',
      };
    case 'email_change':
    case 'email_change_new':
      return {
        subject: 'Confirmez votre nouvelle adresse email — Projet Entan',
        intro: 'Confirmez votre nouvelle adresse email pour la rattacher à votre compte.',
        cta: 'Confirmer mon adresse',
      };
    case 'signup':
    default:
      return {
        subject: 'Confirmez votre adresse email — Projet Entan',
        intro: 'Bienvenue sur Projet Entan ! Confirmez votre adresse email pour activer votre compte.',
        cta: 'Confirmer mon adresse',
      };
  }
}

function renderHtml(intro: string, cta: string, link: string): string {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#faf9f5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f1e1b;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="width:34px;height:34px;border-radius:9px;background:#c15f3c;color:#ffffff;font-weight:700;font-size:14px;line-height:34px;text-align:center;font-family:Arial,Helvetica,sans-serif;">PE</div>
        </td>
        <td style="vertical-align:middle;padding-left:10px;">
          <strong style="font-size:16px;color:#1f1e1b;">Projet Entan</strong>
        </td>
      </tr>
    </table>
    <p style="font-size:15px;line-height:1.6;color:#5d5c56;">${intro}</p>
    <p style="margin:28px 0;">
      <a href="${link}" style="display:inline-block;background:#c15f3c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">${cta}</a>
    </p>
    <p style="font-size:12.5px;color:#9d9a8f;line-height:1.6;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
      <a href="${link}" style="color:#c15f3c;word-break:break-all;">${link}</a>
    </p>
    <p style="font-size:12.5px;color:#9d9a8f;margin-top:24px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
  </div>
</body></html>`;
}

export async function POST(request: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  if (!secret || !resendKey) {
    return NextResponse.json(
      { error: { http_code: 500, message: 'Envoi d’email non configuré.' } },
      { status: 500 },
    );
  }

  const body = await request.text();
  const headers = {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
  };

  let payload: HookPayload;
  try {
    // Le secret Supabase a la forme "v1,whsec_…" ; standardwebhooks attend la
    // partie base64 (il retire le préfixe "whsec_" lui-même).
    const wh = new Webhook(secret.replace(/^v1,/, ''));
    payload = wh.verify(body, headers) as HookPayload;
  } catch {
    return NextResponse.json(
      { error: { http_code: 401, message: 'Signature invalide.' } },
      { status: 401 },
    );
  }

  const link = buildVerifyUrl(payload.email_data);
  const { subject, intro, cta } = content(payload.email_data.email_action_type);
  const from = process.env.RESEND_FROM ?? 'Projet Entan <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.user.email],
      subject,
      html: renderHtml(intro, cta, link),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: { http_code: 502, message: `Resend a refusé l’envoi : ${detail}` } },
      { status: 502 },
    );
  }

  return NextResponse.json({});
}
