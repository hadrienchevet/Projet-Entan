# Projet Entan

Plateforme SaaS de pilotage de projets industriels — multi-utilisateurs,
collaborative, temps réel. Deux modes de travail au choix à la création d'un
projet :

- **Gestion de projet** : RACI (responsabilités), AMDEC (analyse de risques,
  cotation G/O/D 1–4), actions et planning (calendrier + Gantt) — quatre
  modules connectés autour des mêmes données.
- **Résolution de problèmes (RDP)** : démarche guidée en 7 phases —
  choisir un sujet (brainstorming, tableau à double entrée, 5 Pourquoi),
  poser le problème (QQOQCP, écart, indicateurs), rechercher les causes
  (Ishikawa / 5M), rechercher et choisir les solutions (matrice de décision),
  mettre en œuvre (plan d'action PDCA), standardiser.

## Stack et choix techniques

| Brique | Choix | Pourquoi |
|---|---|---|
| Frontend | **Next.js 16** (App Router) | Pages client portées de la V1, auth côté serveur |
| Backend + DB | **Supabase** (Postgres) | Auth, Realtime et RLS intégrés, zéro serveur à gérer |
| Auth | **Supabase Auth** (email + mot de passe) | Sessions par cookies via `@supabase/ssr` |
| Temps réel | **Supabase Realtime** | `postgres_changes` → refetch des données du projet |
| Sécurité | **Row Level Security** | Isolation multi-tenant par projet, appliquée en base |
| Hosting | **Vercel** | Déploiement direct du repo |

Décisions structurantes :

- **L'UX est la copie conforme de la V1** (Project Ops Hub) : mêmes écrans,
  mêmes règles métier. Le store central
  ([src/lib/store.tsx](src/lib/store.tsx), `WorkspaceProvider`) réimplémente
  l'API du store Zustand de la V1 sur Supabase — écritures optimistes,
  refetch en cas d'erreur, synchronisation temps réel entre membres. Les
  pages des modules ([src/modules/](src/modules/)) ne savent pas que
  Supabase existe.
- **L'équipe (`members`) appartient au projet** : on ajoute « Marc,
  responsable maintenance » sans qu'il ait de compte ; s'il rejoint via une
  invitation, son compte s'y rattache. Le RACI vit sur l'action
  (`responsible_id` obligatoire, `accountable_id`, `consulted_ids[]`,
  `informed_ids[]`).
- **Criticité AMDEC calculée en base** (colonne générée `G × O × D`,
  cotation 1–4 ; ≥ 24 critique, ≥ 12 à surveiller).
- **Deux thèmes** (clair ivoire / sombre brun-anthracite, style app Claude) :
  les composants ne consomment que les tokens CSS de
  [globals.css](src/app/globals.css), bascule persistée, préférence système
  par défaut, anti-flash dans le layout racine.
- **Invitations** : token unique consommé par une fonction SQL
  `SECURITY DEFINER` (`accept_invitation`) — l'invité n'étant pas encore
  membre, c'est le seul endroit autorisé à écrire dans `project_members`.

## Démarrage

### 1. Créer le projet Supabase

1. [supabase.com](https://supabase.com) → New project.
2. SQL Editor → exécuter **`supabase/schema.sql`** (installation neuve), puis
   les migrations **`fix-01` → `fix-04`** dans l'ordre (base existante).
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

1. **Inscription / connexion** (`/login`) — un profil public est créé
   automatiquement.
2. **Premier projet** — choix du type (gestion de projet ou RDP) ; le
   créateur devient `owner`. La navigation s'adapte au type du projet.
3. **Invitation** — onglet Accès → « Générer un lien » → partager
   `/invite/{token}` ; l'invité se connecte et rejoint le projet.
4. **Modules gestion** : Dashboard (retards, risques, charge équipe),
   RACI (équipe + matrice), AMDEC (« + action » génère l'action corrective
   liée), Actions, Planning (calendrier, Gantt, liste).
5. **Phases RDP** : tableau de bord d'avancement (phase courante partagée),
   puis une page par phase — Sujet, Problème, Causes, Solutions,
   Mise en œuvre, Standardiser.

Tout changement fait par un membre apparaît chez les autres sans recharger
(Realtime).

## Modèle de données

```
profiles            (miroir public de auth.users, trigger à l'inscription)
projects            (owner_id, project_type gestion|rdp, rdp_current_phase 0-6)
project_members     (project_id, user_id, role owner|member)  ← source des permissions
members             (l'équipe métier : nom + fonction, user_id nullable)
invitations         (token unique, expiration 7 j)

-- Gestion de projet
amdec_items         (G/O/D 1–4, criticality = colonne générée)
actions             (RACI complet, statut, dates, lien amdec_item_id)

-- Résolution de problèmes
rdp_subjects        (phase 0 : brainstorming, fréquence × impact, sujet retenu)
rdp_problem         (phase 1 : QQOQCP, situations, écart, objectifs — 1/projet)
rdp_indicators      (tableau de bord : valeur actuelle vs objectif)
five_why_analyses   (+ five_why_levels : chaîne des 5 Pourquoi)
ishikawa_analyses   (+ ishikawa_causes : causes classées par 5M)
rdp_solutions       (matrice de décision : efficacité + facilité + coût)
capa_actions        (plan d'action PDCA, phase 5 ou 6)
```

Toutes les tables métier portent `project_id` ; les politiques RLS s'appuient
sur `is_project_member()` (SECURITY DEFINER, sans récursion). Voir
[supabase/schema.sql](supabase/schema.sql) et les migrations `fix-*.sql`.
