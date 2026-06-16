-- =============================================================================
-- PROJET ENTAN — Migration fix-10 : réparer la policy UPDATE de projects
-- Symptôme : modifier un projet (outils activés, statut terminé/en cours,
-- phase RDP, renommage) ne persistait pas — l'UPDATE matchait 0 ligne car la
-- policy ne couvrait pas le propriétaire. On l'aligne sur la policy SELECT
-- (propriétaire OU membre), avec WITH CHECK explicite.
-- À exécuter dans le SQL Editor. Ré-exécutable sans erreur.
-- =============================================================================

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects
  FOR UPDATE
  USING (owner_id = auth.uid() OR is_project_member(id))
  WITH CHECK (owner_id = auth.uid() OR is_project_member(id));
