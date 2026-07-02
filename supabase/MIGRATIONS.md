# Migrations Supabase — ordre & état

À exécuter dans le **SQL Editor** du dashboard Supabase, **dans l'ordre**.
Toutes sont **idempotentes** (ré-exécutables sans erreur).

| Fichier | Rôle |
|---|---|
| `schema.sql` | Schéma de base (install neuve) : profiles, projects, project_members, members, invitations, amdec_items, actions + RLS + `is_project_member()`. |
| `fix-01` | Policy SELECT de `projects` (owner accepté avant le trigger d'ajout du membre). |
| `fix-02` | Modèle V1 : table `members`, RACI sur `actions`, `is_project_member()`. |
| `fix-03` | Tables RDP : five_why_*, ishikawa_*, capa_actions. |
| `fix-04` | Méthodologie RDP 7 phases : `rdp_current_phase`, rdp_subjects/problem/indicators/solutions. |
| `fix-05` | Cotation AMDEC résiduelle (`severity_after` / `occurrence_after` / `detection_after`). |
| `fix-06` | `projects.status` (en cours/terminé) + policy DELETE `projects`. |
| `fix-07` | `dashboard_layouts` (tableau de bord modulable, perso par membre). |
| `fix-08` | `projects.tools` (outils modulables) + table `cost_items` (suivi des coûts). |
| `fix-09` | Charte A3 (`a3_reports`, colonne réservée `"analyse"`) + SWOT (`swot_items`). |
| `fix-10` | **Répare la policy UPDATE de `projects`** : `owner_id = auth.uid() OR is_project_member(id)`. Sans ça, outils/statut/phase RDP ne persistent pas. |
| `fix-11` | **Facturation/plans** : table `subscriptions` (écrite par le webhook Stripe en service-role), `user_plan()`, trigger `enforce_project_limit` (Free = 3 projets/type). *(superseded par fix-12)* |
| `fix-12` | **Multi-tenant B2B + sièges** : `companies`, `company_members` (= sièges), `company_invitations`, `access_keys` (clés d'accès offert), `projects.company_id` ; `current_company_id()`, `enforce_seat_limit`, RPC `create_company`/`accept_company_invitation`/`redeem_access_key` ; backfill ; retire `enforce_project_limit`. Facturation par siège (Stripe quantity). |
| `fix-13` | **Sièges personnels** : 1 clé = 1 siège rattaché à l'utilisateur (`access_keys.redeemed_by_user`) ; `has_seat()` ; membre actif requiert un siège ; `create_company` (nom unique, refus doublon) / `join_company_by_code`. |
| `fix-14` | **Entreprise optionnelle** : projets « solo » (`company_id` null) autorisés ; seule la clé (siège) conditionne l'accès. |
| `fix-15` | **Siège = frontière de sécurité** : impose `user_has_seat()` au niveau RLS (INSERT projet) ET trigger (INSERT accès projet, y c. projets solo). Avant fix-15 le paywall n'était QUE côté client → contournable par appel API direct (clé anon publique). Ne révoque aucun accès existant. |
| `fix-16` | **Verrouille `companies` en lecture seule** (anon/authenticated) : supprime la policy `companies_update` qui laissait un admin écrire `is_comp`/`seats` → s'auto-octroyer des sièges illimités. Écritures réservées au webhook (service-role) et aux RPC `SECURITY DEFINER`. |
| `fix-17` | **Coûts : quantité + abonnement** : ajoute `quantity`, `is_subscription`, `months` à `cost_items`. Total d'une ligne = montant × quantité × (abonnement ? mois : 1). Bouton « +1 mois » côté app. Lignes existantes inchangées (défauts 1/false/1). |
| `fix-18` | **Journal d'activité (notifications in-app)** : table `activity_events` (RLS `is_project_member` + realtime). Alimentée par le store (écriture tolérante) pour le fil d'activité. Les alertes (retards/échéances/risques sans plan) restent calculées côté client. |
| `fix-19` | **Rappel email au démarrage d'action** : `actions.notify_email` (opt-in) + table `notification_log` (RLS sans policy → cron/service-role only, anti-doublon `unique(action_id, kind)`). Le cron `/api/cron/notify-action-start` envoie au responsable (s'il a un compte) le jour de la date de début. Nécessite `CRON_SECRET` dans Vercel + le cron déclaré dans `vercel.json`. |

## Après une migration qui AJOUTE une colonne
Recharger le cache de l'API REST, sinon l'écriture sur la nouvelle colonne est rejetée en silence :
```sql
notify pgrst, 'reload schema';
```

## Modèle idempotent pour une nouvelle table (à copier)
```sql
CREATE TABLE IF NOT EXISTS ma_table (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- … colonnes … (quoter les mots réservés, ex. "analyse")
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ma_table_all" ON ma_table;
CREATE POLICY "ma_table_all" ON ma_table
  FOR ALL USING (is_project_member(project_id)) WITH CHECK (is_project_member(project_id));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='ma_table') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ma_table;
  END IF;
END $$;
```

## Pièges (vécus)
- `CREATE POLICY` / `ALTER PUBLICATION ADD TABLE` plantent si l'objet existe → toujours `DROP POLICY IF EXISTS` + garde `DO $$ IF NOT EXISTS`.
- Mot réservé en colonne (`analyse`) → guillemets `"analyse"`.
- Disposition perso (`dashboard_layouts`) : RLS `user_id = auth.uid() AND is_project_member`.
- Une écriture qui « réussit » mais ne persiste pas (0 ligne, sans erreur) = policy RLS trop restrictive (cf. fix-10) **ou** cache d'API non rechargé.
