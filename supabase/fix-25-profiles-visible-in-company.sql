-- ===========================================================================
-- fix-25 — Profils visibles entre membres de la MÊME ORGANISATION (pas
-- seulement entre membres d'un même projet).
--
-- Bug corrigé : la policy `profiles_select` (schema.sql) n'autorisait à lire
-- le nom/email d'un autre utilisateur que si on partage un PROJET avec lui
-- (`shares_project_with`). Or le roster « Organisation » (page Équipe,
-- SeatsPanel) affiche les membres d'une ORGANISATION, indépendamment des
-- projets partagés (l'accès aux projets est accordé séparément, page Accès).
-- Résultat : tout membre non-owner voyait les AUTRES membres de son
-- organisation affichés en UUID brut au lieu de leur nom/email (leur propre
-- ligne s'affichait correctement, RLS `id = auth.uid()`). Confirmé le
-- 2026-07-17 (compte hadrienchevet@gmail.com voyant les 2 autres membres en
-- UUID brut).
--
-- Idempotent. À exécuter après fix-24.
-- ===========================================================================

create or replace function public.shares_company_with(p_user uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1
    from public.company_members a
    join public.company_members b on b.company_id = a.company_id
    where a.user_id = auth.uid() and a.status = 'active'
      and b.user_id = p_user and b.status = 'active'
  );
$$;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.shares_project_with(id) or public.shares_company_with(id));

notify pgrst, 'reload schema';
