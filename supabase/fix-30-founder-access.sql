-- fix-30 : ACCÈS FONDATEUR (phase early access).
--
-- Pendant la phase fondateur, TOUT compte a un accès offert permanent : pas
-- d'essai 14 j qui expire, pas de mur de paiement, pas de compte à rebours.
--
-- Un seul curseur : la date-seuil `founder_cutoff()`. Un compte créé AVANT le
-- seuil est fondateur (siège permanent offert). Aujourd'hui le seuil est loin
-- dans le futur → tout le monde est fondateur.
--
-- POUR CLÔTURER la phase fondateur : régler `founder_cutoff()` sur la date du
-- jour (create or replace ... select '<date>'). Les comptes créés AVANT gardent
-- leur accès à vie ; les comptes créés APRÈS repassent au modèle essai 14 j puis
-- siège/abonnement.
--
-- Idempotent (create or replace). N'enlève aucun accès existant.

-- Date-seuil fondateur (unique curseur). '2999-01-01' = phase ouverte.
create or replace function public.founder_cutoff()
returns timestamptz language sql stable set search_path = public as $$
  select '2999-01-01'::timestamptz;
$$;

-- user_has_seat : + clause fondateur (compte créé avant le seuil = siège permanent).
create or replace function public.user_has_seat(p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (select 1 from public.access_keys where redeemed_by_user = p_user)
    or exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = p_user and m.status = 'active' and c.is_comp
    )
    -- Fondateur : accès offert permanent.
    or exists (
      select 1 from public.profiles pr
      where pr.id = p_user and pr.created_at < public.founder_cutoff()
    )
    -- Essai 14 j (comptes créés après la clôture de la phase fondateur).
    or exists (
      select 1 from public.profiles pr
      where pr.id = p_user and pr.created_at > now() - interval '14 days'
    );
$$;

-- trial_ends_at : null pour un fondateur (pas de compte à rebours dans l'UI).
create or replace function public.trial_ends_at()
returns timestamptz language sql security definer stable set search_path = public as $$
  select case
    when exists (select 1 from public.access_keys where redeemed_by_user = auth.uid()) then null
    when exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = auth.uid() and m.status = 'active' and c.is_comp
    ) then null
    when exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.created_at < public.founder_cutoff()
    ) then null
    else (
      select pr.created_at + interval '14 days'
        from public.profiles pr
       where pr.id = auth.uid()
    )
  end;
$$;

-- is_founder : le compte courant bénéficie-t-il de l'accès fondateur ?
create or replace function public.is_founder()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles pr
    where pr.id = auth.uid() and pr.created_at < public.founder_cutoff()
  );
$$;

grant execute on function public.is_founder() to authenticated;

notify pgrst, 'reload schema';
