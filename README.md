# Pilotix

Plateforme SaaS de pilotage de projets industriels et de management visuel :
**AMDEC** (analyse de risques), **RACI** (responsabilités), **actions correctives**
et **cockpit de suivi** — multi-utilisateurs, collaboratif, temps réel.

## Stack et choix techniques

| Brique | Choix | Pourquoi |
|---|---|---|
| Frontend | **Next.js 16** (App Router, Server Components) | Server Actions = pas de couche API à maintenir |
| Backend + DB | **Supabase** (Postgres) | Auth, Realtime et RLS intégrés, zéro serveur à gérer |
| Auth | **Supabase Auth** (email + mot de passe) | Sessions par cookies via `@supabase/ssr` |
| Temps réel | **Supabase Realtime** | `postgres_changes` + `router.refresh()` : la base reste l'unique source de vérité |
| Sécurité | **Row Level Security** | Isolation multi-tenant par projet, appliquée en base — pas dans le code applicatif |
| Hosting | **Vercel** | Déploiement direct du repo |

Décisions structurantes :

- **Pas de couche API custom** : les écritures passent par des Server Actions
  ([src/lib/actions.ts](src/lib/actions.ts)), les lectures par les Server Components.
  La RLS garantit qu'aucune requête ne sort du périmètre des projets de l'utilisateur,
  même si le code applicatif est bugué.
- **Criticité AMDEC calculée en base** (colonne générée `G × O × D`, cotation 1–4) :
  impossible d'avoir une criticité incohérente.
- **Temps réel sans état client** : un seul composant
  ([realtime-refresher.tsx](src/components/realtime-refresher.tsx)) écoute les
  changements Postgres du projet et re-rend les Server Components.
- **Invitations** : token unique consommé par une fonction SQL `SECURITY DEFINER`
  (`accept_invitation`) — l'invité n'étant pas encore membre, c'est le seul endroit
  autorisé à écrire dans `project_members`.

## Démarrage

### 1. Créer le projet Supabase

1. [supabase.com](https://supabase.com) → New project.
2. SQL Editor → coller et exécuter **`supabase/schema.sql`** (tables, RLS, fonctions, realtime).
3. Authentication → Providers → Email : activé par défaut.
   *Pour tester sans serveur mail : désactiver « Confirm email ».*

### 2. Configurer et lancer

```bash
cp .env.example .env.local   # puis renseigner URL + clé anon (Settings → API)
npm install
npm run dev                  # http://localhost:3000
```

### 3. Déployer sur Vercel

Importer le repo, ajouter les deux variables d'environnement
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), déployer.
Ajouter l'URL Vercel dans Supabase → Authentication → URL Configuration
(Site URL + Redirect URLs `https://votre-app.vercel.app/auth/callback`).

## Parcours utilisateur

1. **Inscription / connexion** (`/login`) — un profil public est créé automatiquement.
2. **Projets** (`/projects`) — création ; le créateur devient `owner` et premier membre.
3. **Invitation** — Équipe → « Générer un lien » → partager `/invite/{token}` ;
   l'invité se connecte (redirection automatique) et rejoint le projet.
4. **Modules** : Cockpit (indicateurs), AMDEC (G/O/D 1–4, criticité ≥ 24 critique,
   ≥ 12 à surveiller, « + Action » génère l'action corrective liée), Actions
   (assignation, statut, échéance), RACI (matrice actions × membres, clic = cycle
   R → A → C → I), Équipe (membres, invitations).

Tout changement fait par un membre apparaît chez les autres sans recharger (Realtime).

## Modèle de données

```
profiles          (miroir public de auth.users, trigger à l'inscription)
projects          (owner_id)
project_members   (project_id, user_id, role owner|member)  ← source des permissions
invitations       (token unique, expiration 7 j)
amdec_items       (G/O/D 1–4, criticality = colonne générée)
actions           (statut todo|in_progress|done, assignee, due_date, lien amdec_item_id)
raci_roles        (action × membre → R|A|C|I, unique par couple)
```

Toutes les tables métier portent `project_id` ; les politiques RLS s'appuient sur
`is_project_member()` (SECURITY DEFINER, sans récursion). Voir
[supabase/schema.sql](supabase/schema.sql) — commenté section par section.
