-- ===========================================================================
-- fix-14 — Entreprise OPTIONNELLE.
-- Seule la clé (siège) bloque l'accès. Ne pas avoir d'entreprise n'empêche pas
-- d'utiliser l'app : on autorise les projets « solo » (company_id null).
-- Idempotent.
-- ===========================================================================

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert
  with check (
    owner_id = auth.uid()
    and (company_id is null or company_id = public.current_company_id())
  );

notify pgrst, 'reload schema';
