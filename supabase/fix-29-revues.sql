-- fix-29 : Mode revue de projet (outil de gestion modulable)
--
-- Deux tables :
--   * revues           — une réunion d'avancement (préparée, animée, clôturée).
--   * revue_decisions  — décisions captées en direct pendant une revue.
--
-- Le « delta depuis la dernière revue » n'est PAS stocké : il est recalculé
-- côté client à partir du `snapshot` figé à la clôture (jsonb) et des
-- `created_at` des actions / AMDEC. Aucune modification du schéma des actions
-- ou des AMDEC n'est nécessaire.
--
-- Idempotent (ré-exécutable sans erreur).

CREATE TABLE IF NOT EXISTS revues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Revue de projet',
  revue_type  TEXT NOT NULL DEFAULT 'equipe',   -- equipe | copil | jalon
  status      TEXT NOT NULL DEFAULT 'en_cours',  -- en_cours | cloturee
  snapshot    JSONB,                             -- figé à la clôture (base du delta)
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE revues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "revues_all" ON revues;
CREATE POLICY "revues_all" ON revues
  FOR ALL USING (is_project_member(project_id)) WITH CHECK (is_project_member(project_id));

CREATE TABLE IF NOT EXISTS revue_decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revue_id    UUID NOT NULL REFERENCES revues(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content     TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE revue_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "revue_decisions_all" ON revue_decisions;
CREATE POLICY "revue_decisions_all" ON revue_decisions
  FOR ALL USING (is_project_member(project_id)) WITH CHECK (is_project_member(project_id));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='revues') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE revues;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='revue_decisions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE revue_decisions;
  END IF;
END $$;

-- Recharge le cache de l'API REST (sinon écritures sur les nouvelles tables rejetées en silence).
notify pgrst, 'reload schema';
