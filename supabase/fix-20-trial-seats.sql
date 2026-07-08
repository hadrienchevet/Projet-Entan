-- fix-20 : SIÈGE D'ESSAI gratuit de 14 jours.
--
-- Problème : un nouveau compte n'a ni clé ni entreprise → `user_has_seat` = faux
-- → la policy `projects_insert` (fix-15) bloque toute création de projet, et
-- l'utilisateur est coincé sur l'écran d'accueil avec une erreur RLS brute.
--
-- Solution : tout compte peut utiliser l'app pendant 14 jours à partir de la
-- création de son profil (`profiles.created_at`, posé à l'inscription). Passé ce
-- délai, il doit activer un siège (clé d'accès aujourd'hui, abonnement Stripe
-- demain).
--
-- On étend simplement `user_has_seat()` : la frontière de sécurité de fix-15
-- reste inchangée — l'essai EST un siège, juste temporaire. Tout ce qui repose
-- sur `user_has_seat` (RLS insert projet, triggers d'accès, create_company,
-- join_company, redeem_access_key) honore donc l'essai automatiquement.
--
-- Idempotent (create or replace). N'enlève aucun accès existant.

-- 1. L'utilisateur a-t-il un siège ? clé, entreprise offerte, OU essai en cours.
create or replace function public.user_has_seat(p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (select 1 from public.access_keys where redeemed_by_user = p_user)
    or exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = p_user and m.status = 'active' and c.is_comp
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = p_user
        and pr.created_at > now() - interval '14 days'
    );
$$;

-- 2. Fin d'essai du compte courant — UNIQUEMENT si l'accès repose sur l'essai
--    (ni clé ni entreprise offerte). Sinon null. Sert au bandeau « J-X » côté UI.
create or replace function public.trial_ends_at()
returns timestamptz language sql security definer stable set search_path = public as $$
  select case
    when exists (select 1 from public.access_keys where redeemed_by_user = auth.uid()) then null
    when exists (
      select 1 from public.company_members m
      join public.companies c on c.id = m.company_id
      where m.user_id = auth.uid() and m.status = 'active' and c.is_comp
    ) then null
    else (
      select pr.created_at + interval '14 days'
        from public.profiles pr
       where pr.id = auth.uid()
    )
  end;
$$;

grant execute on function public.trial_ends_at() to authenticated;
notify pgrst, 'reload schema';
