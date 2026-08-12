import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RevueSnapshot } from '@/lib/types';

/**
 * Envoi du compte-rendu de revue par email.
 *
 * Le client passe `{ revueId, recipientIds }` — **jamais d'adresse email**
 * (anti-abus : sinon la clé anon publique suffirait à faire de l'app un relais
 * d'envoi). Chaque identifiant est résolu côté serveur contre des données déjà
 * stockées : un `user_id` de membre du projet, ou l'`id` d'une personne
 * enregistrée sur la revue (`snapshot.guests` / `snapshot.sharedWith`). Tout
 * identifiant inconnu est ignoré. Même modèle que `/api/invite/send`.
 */

/** Garde-fou : un CR se partage à une équipe, pas à une liste de diffusion. */
const MAX_RECIPIENTS = 30;

interface Line {
  title: string;
  responsible: string;
  dueDate?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dateFr = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

const dateTimeFr = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

function linesHtml(lines: Line[] | undefined, empty: string): string {
  if (!lines || lines.length === 0) {
    return `<p style="font-size:13px;color:#9d9a8f;margin:0 0 4px;">${empty}</p>`;
  }
  return lines
    .map(
      (l) => `<div style="padding:8px 0;border-bottom:1px solid #eceae3;">
        <div style="font-size:14px;color:#1f1e1b;font-weight:600;">${esc(l.title)}</div>
        <div style="font-size:12.5px;color:#5d5c56;margin-top:2px;">${esc(l.responsible)}${
          l.dueDate ? ` · échéance ${dateFr(l.dueDate)}` : ' · sans échéance'
        }</div>
      </div>`,
    )
    .join('');
}

function renderHtml(
  projectName: string,
  revueTitle: string,
  closedAt: string | undefined,
  snap: RevueSnapshot | null,
  decisions: { content: string; author_name: string; created_at: string }[],
  attendees: string[],
  appUrl: string,
  siteUrl: string,
): string {
  const logo = `${siteUrl}/email-logo.png`;
  const deltaPts = snap?.prevPlanningPct != null ? (snap.planningPct ?? 0) - snap.prevPlanningPct : null;
  const stat = (v: string, l: string) =>
    `<td style="padding:10px 8px;border:1px solid #e6e4db;border-radius:6px;text-align:center;">
       <div style="font-size:20px;font-weight:700;color:#1f1e1b;">${esc(v)}</div>
       <div style="font-size:11px;color:#5d5c56;margin-top:2px;">${esc(l)}</div>
     </td>`;
  const h2 = (t: string) =>
    `<h2 style="font-size:14px;color:#c15f3c;margin:22px 0 8px;">${esc(t)}</h2>`;

  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#faf9f5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f1e1b;">
  <div style="max-width:620px;margin:0 auto;padding:32px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td valign="middle"><img src="${logo}" width="36" height="36" alt="Projet Entan" style="display:block;border:0;border-radius:9px;" /></td>
        <td valign="middle" style="padding-left:10px;"><strong style="font-size:16px;">Projet Entan</strong></td>
      </tr>
    </table>

    <h1 style="font-size:20px;margin:0 0 4px;">Compte-rendu — ${esc(revueTitle)}</h1>
    <p style="font-size:13px;color:#5d5c56;margin:0 0 4px;">${esc(projectName)}</p>
    <p style="font-size:12.5px;color:#9d9a8f;margin:0 0 18px;">
      Clôturée le ${dateTimeFr(closedAt)}${snap?.durationMin != null ? ` · ${snap.durationMin} min` : ''}${
        snap?.closedByName ? ` · animée par ${esc(snap.closedByName)}` : ''
      }
    </p>

    <table role="presentation" cellpadding="0" cellspacing="6" border="0" style="width:100%;">
      <tr>
        ${stat(`${snap?.planningPct ?? 0} %`, deltaPts != null ? `Avancement (${deltaPts >= 0 ? '+' : ''}${deltaPts} pts)` : 'Avancement')}
        ${stat(String(snap?.doneSince?.length ?? snap?.doneActionIds?.length ?? 0), 'Terminées')}
        ${stat(String(snap?.lateActions?.length ?? 0), 'En retard')}
        ${stat(String(snap?.openRisks?.length ?? 0), 'Risques critiques')}
      </tr>
    </table>

    ${attendees.length ? `${h2('Participants')}<p style="font-size:13.5px;color:#5d5c56;margin:0;">${esc(attendees.join(' · '))}</p>` : ''}

    ${h2('Décisions prises')}
    ${
      decisions.length === 0
        ? '<p style="font-size:13px;color:#9d9a8f;margin:0;">Aucune décision captée pendant cette revue.</p>'
        : decisions
            .map(
              (d) => `<div style="padding:8px 0;border-bottom:1px solid #eceae3;">
                <div style="font-size:14px;font-weight:600;">${esc(d.content)}</div>
                <div style="font-size:12.5px;color:#9d9a8f;margin-top:2px;">${dateTimeFr(d.created_at)} · ${esc(d.author_name)}</div>
              </div>`,
            )
            .join('')
    }

    ${h2('Qui fait quoi pour quand')}
    ${linesHtml(snap?.createdActions, 'Aucune action créée pendant cette revue.')}

    ${h2('Points ouverts')}
    ${linesHtml(snap?.lateActions, 'Aucun retard à la clôture.')}

    <p style="margin:26px 0 0;">
      <a href="${appUrl}" style="display:inline-block;background:#c15f3c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Ouvrir le projet</a>
    </p>
    <p style="font-size:12px;color:#9d9a8f;margin-top:22px;">
      Vous recevez ce compte-rendu car vous avez participé à cette revue ou y avez été associé·e.
    </p>
  </div>
</body></html>`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let revueId: string | undefined;
  let recipientIds: string[] = [];
  try {
    const body = (await request.json()) as { revueId?: string; recipientIds?: string[] };
    revueId = body.revueId;
    recipientIds = Array.isArray(body.recipientIds) ? body.recipientIds : [];
  } catch {
    /* corps invalide */
  }
  if (!revueId) return NextResponse.json({ error: 'revue_manquante' }, { status: 400 });
  if (recipientIds.length === 0) return NextResponse.json({ error: 'aucun_destinataire' }, { status: 400 });
  if (recipientIds.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: 'trop_de_destinataires' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'resend_non_configure' }, { status: 500 });
  const from = process.env.RESEND_FROM ?? 'ENTAN <onboarding@resend.dev>';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://projetentan.fr').replace(/\/$/, '');

  const admin = createAdminClient();

  const { data: revue } = await admin
    .from('revues')
    .select('id, project_id, title, snapshot, closed_at, status')
    .eq('id', revueId)
    .maybeSingle();
  if (!revue) return NextResponse.json({ error: 'revue_introuvable' }, { status: 404 });

  // L'appelant doit avoir accès au projet de la revue.
  const { data: access } = await admin
    .from('project_members')
    .select('user_id')
    .eq('project_id', revue.project_id as string)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!access) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const snap = (revue.snapshot ?? null) as RevueSnapshot | null;
  const requested = new Set(recipientIds);

  /* Résolution des destinataires — uniquement depuis des données stockées. */
  const emails = new Map<string, string>(); // email -> nom

  // a) Membres du projet ayant un compte.
  const { data: members } = await admin
    .from('members')
    .select('user_id, name')
    .eq('project_id', revue.project_id as string)
    .not('user_id', 'is', null);
  const wantedUserIds = (members ?? []).filter((m) => requested.has(m.user_id as string));
  if (wantedUserIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in(
        'id',
        wantedUserIds.map((m) => m.user_id as string),
      );
    for (const p of profiles ?? []) {
      const name = wantedUserIds.find((m) => m.user_id === p.id)?.name as string | undefined;
      if (p.email) emails.set(p.email as string, name ?? (p.email as string));
    }
  }

  // b) Invités présents et destinataires ajoutés, enregistrés sur la revue.
  for (const person of [...(snap?.guests ?? []), ...(snap?.sharedWith ?? [])]) {
    if (requested.has(person.id) && person.email) emails.set(person.email, person.name);
  }

  if (emails.size === 0) return NextResponse.json({ error: 'aucun_destinataire' }, { status: 400 });

  const { data: project } = await admin
    .from('projects')
    .select('name')
    .eq('id', revue.project_id as string)
    .maybeSingle();
  const projectName = (project?.name as string) ?? 'Projet';

  const { data: decisions } = await admin
    .from('revue_decisions')
    .select('content, author_name, created_at')
    .eq('revue_id', revueId)
    .order('created_at');

  // Noms des présents pour le corps du mail (membres + invités).
  const presentIds = new Set(snap?.participantIds ?? []);
  const { data: allMembers } = await admin
    .from('members')
    .select('id, name')
    .eq('project_id', revue.project_id as string);
  const attendees = [
    ...(allMembers ?? []).filter((m) => presentIds.has(m.id as string)).map((m) => m.name as string),
    ...(snap?.guests ?? []).map((g) => g.name),
  ];

  const html = renderHtml(
    projectName,
    (revue.title as string) ?? 'Revue de projet',
    (revue.closed_at as string) ?? undefined,
    snap,
    decisions ?? [],
    attendees,
    `${siteUrl}/revue`,
    siteUrl,
  );

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [...emails.keys()],
      subject: `Compte-rendu — ${revue.title} (${projectName})`,
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return NextResponse.json({ error: 'resend_failed', detail }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sent: emails.size });
}
