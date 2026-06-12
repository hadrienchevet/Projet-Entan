-- =============================================================================
-- PROJET ENTAN — Migration fix-06 : statut du projet (en cours / terminé)
-- Pour la page « Mes projets » : indicateur d'avancement par projet.
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- =============================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'completed'));

-- Suppression de projet : la policy manque dans les bases créées avant la
-- version actuelle de schema.sql (DELETE silencieusement bloqué par RLS).
-- Owner uniquement ; les données filles suivent par ON DELETE CASCADE.
DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (owner_id = auth.uid());
