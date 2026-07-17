-- ===========================================================================
-- fix-23 — Acceptation d'invitation entreprise IDEMPOTENTE + nettoyage des
-- doublons pour le même email.
--
-- Bug corrigé : un second clic sur un lien d'invitation déjà accepté (double
-- clic, ou scanner de sécurité e-mail qui « clique » le lien avant l'humain
-- pour le scanner) faisait échouer accept_company_invitation avec
-- 'invitation_invalid', alors que la personne avait DÉJÀ rejoint l'organisation
-- avec succès au premier clic. Confirmé le 2026-07-17 : une invitation à
-- hadrienchevet@gmail.com était bien status='accepted', pendant que d'anciennes
-- invitations PENDING pour le même email restaient affichées « Invité » dans
-- le roster — source de confusion (la personne avait rejoint, l'UI semblait
-- dire le contraire).
--
-- Idempotent. À exécuter après fix-22.
-- ===========================================================================

create or replace function public.accept_company_invitation(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_company uuid;
  v_role text;
  v_status text;
  v_expires timestamptz;
  v_email text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select company_id, role, status, expires_at, email
    into v_company, v_role, v_status, v_expires, v_email
    from public.company_invitations
   where token = p_token;

  if v_company is null then
    raise exception 'invitation_invalid';
  end if;

  -- Idempotence : déjà membre actif de cette organisation (invitation déjà
  -- consommée par un clic précédent, ou par un scanner de sécurité e-mail) ->
  -- on traite comme un succès plutôt qu'une erreur.
  if exists (
    select 1 from public.company_members
     where company_id = v_company and user_id = auth.uid() and status = 'active'
  ) then
    return v_company;
  end if;

  if v_status <> 'pending' or v_expires <= now() then
    raise exception 'invitation_invalid';
  end if;

  insert into public.company_members (company_id, user_id, role, status)
    values (v_company, auth.uid(), v_role, 'active')
    on conflict (company_id, user_id) do update set status = 'active';

  -- Marque cette invitation ET toute autre invitation PENDING pour le même
  -- e-mail dans la même organisation comme acceptées (évite les doublons
  -- « Invité » qui traînent après un ré-envoi d'invitation à la même personne).
  update public.company_invitations
     set status = 'accepted'
   where company_id = v_company
     and lower(email) = lower(v_email)
     and status = 'pending';

  return v_company;
end;
$$;

notify pgrst, 'reload schema';
