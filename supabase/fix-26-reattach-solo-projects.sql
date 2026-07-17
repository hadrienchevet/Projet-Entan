-- ===========================================================================
-- fix-26 — Rattache automatiquement les projets d'une organisation PERSO
-- SOLO (auto-créée, Phase 3) vers l'organisation qu'on rejoint ensuite —
-- MÊME si ces projets ont été créés AVANT de rejoindre.
--
-- Bug corrigé : un compte qui crée/ouvre un projet AVANT de rejoindre une
-- organisation (ex. « TEST », créé juste pour ouvrir l'app) se retrouve avec
-- ce projet rattaché à sa minuscule organisation personnelle auto-créée (où
-- il est seul) plutôt qu'à l'organisation qu'il rejoint ensuite -> « tous les
-- membres ont déjà accès » (faux : il n'y a que lui dans cette
-- organisation-là). Confirmé le 2026-07-17 (projet « TEST » de
-- hadrienchevet@gmail.com). Demande explicite du user : que ça fonctionne
-- pour TOUS ses projets, même créés avant de rejoindre.
--
-- Fix : à l'acceptation d'une invitation (accept_company_invitation) OU au
-- rejoint par clé entreprise (join_company_by_code), on réattache
-- automatiquement les projets appartenant à une organisation où l'utilisateur
-- est le SEUL membre actif (signe fiable d'une organisation perso jetable,
-- pas une vraie organisation distincte intentionnelle) vers l'organisation
-- qu'il vient de rejoindre. + backfill unique pour les cas déjà existants
-- dans la base.
--
-- Idempotent. À exécuter après fix-25. Reprend le corps exact de
-- accept_company_invitation issu de fix-23 (idempotence + nettoyage des
-- invitations en double), en y ajoutant le rattachement.
-- ===========================================================================

create or replace function public.reattach_solo_projects(p_user uuid, p_new_company uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.projects p
     set company_id = p_new_company
   where p.owner_id = p_user
     and p.company_id is not null
     and p.company_id <> p_new_company
     and exists (
       select 1 from public.company_members cm
        where cm.company_id = p.company_id and cm.user_id = p_user and cm.status = 'active'
     )
     and (
       select count(*) from public.company_members cm
        where cm.company_id = p.company_id and cm.status = 'active'
     ) = 1;
end;
$$;

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

  -- Idempotence (fix-23) : déjà membre actif -> succès, et on réattache quand
  -- même (au cas où un projet solo aurait été créé après le 1er clic).
  if exists (
    select 1 from public.company_members
     where company_id = v_company and user_id = auth.uid() and status = 'active'
  ) then
    perform public.reattach_solo_projects(auth.uid(), v_company);
    return v_company;
  end if;

  if v_status <> 'pending' or v_expires <= now() then
    raise exception 'invitation_invalid';
  end if;

  insert into public.company_members (company_id, user_id, role, status)
    values (v_company, auth.uid(), v_role, 'active')
    on conflict (company_id, user_id) do update set status = 'active';

  -- Marque cette invitation ET toute autre invitation PENDING pour le même
  -- e-mail dans la même organisation comme acceptées (fix-23).
  update public.company_invitations
     set status = 'accepted'
   where company_id = v_company
     and lower(email) = lower(v_email)
     and status = 'pending';

  perform public.reattach_solo_projects(auth.uid(), v_company);

  return v_company;
end;
$$;

create or replace function public.join_company_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into v_company from public.companies where upper(join_code) = upper(trim(p_code));
  if v_company is null then raise exception 'company_not_found'; end if;
  insert into public.company_members (company_id, user_id, role, status)
    values (v_company, auth.uid(), 'member', 'active')
    on conflict (company_id, user_id) do update set status = 'active';
  perform public.reattach_solo_projects(auth.uid(), v_company);
  return v_company;
end;
$$;

-- ---------------------------------------------------------------------------
-- Backfill unique : corrige les cas déjà existants dans la base. Idempotent
-- (une 2e exécution ne trouve plus rien à réattacher).
-- ---------------------------------------------------------------------------
do $$
declare r record; v_target uuid;
begin
  for r in
    select cm.user_id, cm.company_id as solo_company
      from public.company_members cm
     where cm.status = 'active'
       and (select count(*) from public.company_members x
             where x.company_id = cm.company_id and x.status = 'active') = 1
  loop
    -- Autre organisation NON solo (>1 membre actif) dont ce même user est
    -- membre actif, la plus récemment rejointe.
    select cm2.company_id into v_target
      from public.company_members cm2
     where cm2.user_id = r.user_id
       and cm2.status = 'active'
       and cm2.company_id <> r.solo_company
       and (select count(*) from public.company_members y
             where y.company_id = cm2.company_id and y.status = 'active') > 1
     order by cm2.created_at desc
     limit 1;

    if v_target is not null then
      update public.projects
         set company_id = v_target
       where owner_id = r.user_id
         and company_id = r.solo_company;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
