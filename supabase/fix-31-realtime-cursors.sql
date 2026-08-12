-- fix-31 : Realtime Authorization pour les canaux de présence (curseurs collaboratifs)
--
-- Aucune table métier créée : Presence/Broadcast sont éphémères (jamais écrits
-- dans une table applicative). Ce fix gate uniquement l'accès aux CANAUX
-- Realtime "privés" via RLS sur la table système `realtime.messages`.
--
-- Topic attendu : `project:<project_id>:presence:<scope>` (scope = vue
-- concernée, ex. 'gantt'). Le pattern est générique : couvre tout `scope`
-- présent et futur sans retoucher cette migration.
--
-- `realtime.messages` a RLS activé par défaut côté Supabase (pas besoin
-- d'ALTER TABLE ... ENABLE ROW LEVEL SECURITY).
--
-- ⚠️ Étape manuelle complémentaire, hors SQL : dans le dashboard Supabase,
-- Project Settings → Realtime → désactiver "Allow public access" — sinon
-- ces policies sont contournées et les canaux restent publics.
--
-- Idempotent (ré-exécutable sans erreur).

DROP POLICY IF EXISTS "project members receive presence/cursor messages" ON realtime.messages;
CREATE POLICY "project members receive presence/cursor messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension IN ('broadcast', 'presence')
  AND realtime.topic() LIKE 'project:%:presence:%'
  AND is_project_member(split_part(realtime.topic(), ':', 2)::uuid)
);

DROP POLICY IF EXISTS "project members send presence/cursor messages" ON realtime.messages;
CREATE POLICY "project members send presence/cursor messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  extension IN ('broadcast', 'presence')
  AND realtime.topic() LIKE 'project:%:presence:%'
  AND is_project_member(split_part(realtime.topic(), ':', 2)::uuid)
);
