-- ===========================================================================
-- fix-24 — current_company_id() : la plus RÉCEMMENT rejointe fait foi
-- (au lieu de la plus ancienne).
--
-- Bug corrigé : depuis fix-3 (Phase 3, auto-création d'une organisation
-- personnelle quand un compte a un siège sans organisation), un compte peut se
-- retrouver membre de DEUX organisations : sa personnelle (auto-créée, plus
-- ancienne) PUIS celle qu'il rejoint ensuite via invitation (plus récente).
-- `current_company_id()` prenait la plus ANCIENNE (order by created_at asc) ->
-- l'utilisateur voyait sa vieille organisation perso au lieu de celle qu'il
-- venait de rejoindre. Confirmé le 2026-07-17 (compte invité hadrienchevet@
-- gmail.com : invitation bien acceptée, mais organisation affichée = la sienne).
--
-- Idempotent (create or replace function). À exécuter après fix-23.
-- Le client (src/lib/store.tsx, fetchCompany) utilise la même règle
-- (order by created_at DESC) pour rester cohérent avec cette fonction —
-- notamment pour la policy RLS projects_insert qui compare company_id à
-- current_company_id().
-- ===========================================================================

create or replace function public.current_company_id()
returns uuid language sql security definer stable set search_path = public as $$
  select company_id from public.company_members
   where user_id = auth.uid() and status = 'active'
   order by created_at desc
   limit 1;
$$;

notify pgrst, 'reload schema';
