-- ===========================================================================
-- fix-15 — Le SIÈGE devient la frontière de sécurité (et non l'UI).
-- Idempotent. À exécuter après fix-14.
--
-- PROBLÈME CORRIGÉ
--   Avant fix-15, le paywall « il faut un siège pour utiliser l'app » n'existait
--   QU'AU NIVEAU CLIENT (composant WorkspaceShell). Côté base, ni la création
--   d'un projet ni l'octroi d'accès ne vérifiaient le moindre siège.
--   → un compte gratuit pouvait appeler l'API Supabase directement (la clé anon
--     est publique par design) et créer un projet solo (company_id null) puis
--     utiliser TOUTE l'application sans jamais détenir de siège.
--
-- fix-15 impose public.user_has_seat(auth.uid()) au niveau RLS + trigger :
--   1. INSERT projet         → l'auteur doit avoir un siège.
--   2. INSERT accès projet   → le bénéficiaire doit avoir un siège (couvre
--                              aussi les projets solo, hors périmètre entreprise).
--
-- COMPATIBILITÉ
--   user_has_seat (fix-13) renvoie vrai pour une clé consommée OU une entreprise
--   legacy is_comp → les comptes « grandfather » ne sont pas cassés.
--   Les deux gardes sont des contrôles à l'INSERT : les accès DÉJÀ existants
--   ne sont jamais révoqués.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Création de projet : siège obligatoire.
--    (Reprend fix-14 — projet solo toléré — en ajoutant le contrôle de siège.)
-- ---------------------------------------------------------------------------
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert
  with check (
    owner_id = auth.uid()
    and public.user_has_seat(auth.uid())
    and (company_id is null or company_id = public.current_company_id())
  );

-- ---------------------------------------------------------------------------
-- 2. Octroi d'accès à un projet : le bénéficiaire doit avoir un siège.
--    Étend enforce_project_member_company (fix-12) : la contrainte d'entreprise
--    ne couvrait PAS les projets solo (company_id null), qui devenaient une
--    porte dérobée (un compte sans siège ajouté à un projet solo gardait l'accès).
--    Conséquence voulue : inviter / ajouter un collègue exige qu'il ait son
--    propre siège (cohérent avec « 1 clé = 1 siège par utilisateur », fix-13).
-- ---------------------------------------------------------------------------
create or replace function public.enforce_project_member_company()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  -- Tout détenteur d'accès consomme un siège (modèle par siège).
  if not public.user_has_seat(new.user_id) then
    raise exception 'seat_required';
  end if;
  -- Si le projet appartient à une entreprise, le bénéficiaire doit en être membre actif.
  select company_id into v_company from public.projects where id = new.project_id;
  if v_company is not null and not exists (
    select 1 from public.company_members
     where company_id = v_company and user_id = new.user_id and status = 'active'
  ) then
    raise exception 'user_not_in_company';
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
