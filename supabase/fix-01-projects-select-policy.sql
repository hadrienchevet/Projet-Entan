-- Correctif : la création de projet échouait avec
--   « new row violates row-level security policy for table "projects" ».
-- Cause : INSERT ... RETURNING vérifie la policy SELECT sur la ligne créée,
-- or le trigger qui ajoute l'owner dans project_members ne s'est pas encore
-- exécuté à ce moment-là. La policy doit accepter l'owner directement.
--
-- À exécuter dans le SQL Editor (déjà intégré à schema.sql pour les
-- installations neuves).

drop policy "projects_select" on public.projects;

create policy "projects_select" on public.projects for select
  using (owner_id = auth.uid() or public.is_project_member(id));
