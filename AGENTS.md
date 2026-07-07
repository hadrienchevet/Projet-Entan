<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Projet Entan — guide projet

Lis ce fichier en priorité : il évite de ré-explorer le code. Détail des
migrations dans [supabase/MIGRATIONS.md](supabase/MIGRATIONS.md).

## Quoi / où
- SaaS de **gestion de projet industriel** + **résolution de problèmes (RDP)**, multi-utilisateurs, temps réel.
- Code dans **ce dossier** (`pilotix`). ⚠️ Le dossier voisin `Gestion de projet` est l'ancienne **V1 Vite**, un projet **séparé** — ne pas y toucher.
- Repo : `github.com/hadrienchevet/Projet-Entan`. **Vercel déploie `main`** → simple `git push origin main`. (`master` est une branche morte, ne plus y pousser.)
- Prod : `https://pilotix-hadrien-chevets-projects.vercel.app` (toujours l'URL **sans hash** ; une URL `…-<hash>-…vercel.app` est un déploiement figé).
- Stack : Next.js 16 (App Router, React 19), Supabase (Auth + Postgres + RLS + Realtime), TypeScript strict. CSS = tokens dans `src/app/globals.css`, 2 thèmes (clair/sombre).

## Architecture
- Tout est **client-side**. Store central `src/lib/store.tsx` (`WorkspaceProvider`) : état chargé par projet, **écritures optimistes** + refetch Realtime. Les pages (`src/modules/*`) lisent via des hooks (`useCurrentProject`, `useProjectActions`, `useProjectCostItems`, …) et **ne connaissent pas** Supabase.
- `src/lib/types.ts` : pour chaque entité → `Type`, `Input`, `Row` (snake_case), `fromRow`, `inputToRow`. Conversion camelCase ↔ snake_case ici uniquement.
- Routes : `src/app/(workspace)/<x>/page.tsx` = wrapper trivial qui rend `src/modules/<x>/<X>Page.tsx`. Auth dans `src/middleware.ts` (exclut `_next`, images, `.html`, `.mp4`).
- Deux types de projet : `gestion` / `rdp` (`projects.project_type`). La sidebar (`src/components/Layout.tsx`) s'adapte ; en gestion elle est **modulable** (voir Outils).

## Conventions (à respecter)
- **Écritures store = optimistes + TOLÉRANTES** : on met l'état à jour d'abord, puis Supabase ; en cas d'erreur → `console.warn` (jamais d'`alert`/crash), pour que l'app marche même si une migration n'est pas encore passée.
- **CSS** : `.card` n'a **aucun padding**. Le contenu doit être dans `.card-header` / `.card-body` / `.list-row`, **ou** avoir son propre padding 16px — sinon le texte colle aux bords (bug récurrent). Toujours `var(--token)`, jamais de couleur en dur (sauf `#fff` sur accent).
- Textes UI en **français**.
- Après une modif observable : vérifier en **preview** (`preview_start "projet-entan"`, login démo) avant de pousser. Note : le `blur` synthétique ne déclenche pas `onBlur` React (il écoute `focusout`) — pour tester l'auto-save, dispatcher `focusout`.

## Recette : ajouter un OUTIL de gestion modulable (cf. coûts, A3, SWOT)
1. `src/lib/tools.ts` : id dans `ToolId`, `TOOL_ORDER`, `TOOLS` (label/href/description). Laisser **off** par défaut (hors `DEFAULT_TOOLS_GESTION`).
2. Migration `supabase/fix-NN-*.sql` : table(s) + RLS `is_project_member(project_id)` + realtime (modèle idempotent dans MIGRATIONS.md).
3. `src/lib/types.ts` : `Type` + `Row` + mappers.
4. `src/lib/store.tsx` : state + chargement **tolérant** dans `fetchProjectData` + reset dans `setCurrentProject` + table dans la liste Realtime + CRUD tolérant + hook + exposer dans `value`.
5. `src/modules/<x>/<X>Page.tsx` + route `src/app/(workspace)/<x>/page.tsx`.
6. `src/components/icons.tsx` : icône + l'ajouter à `TOOL_ICON` dans `Layout.tsx`.

## Recette : ajouter un WIDGET de tableau de bord
- `src/lib/widgets.ts` : id dans `WidgetId` + entrée `WIDGETS` (scope `gestion`/`rdp`, span 1|2).
- `src/modules/dashboard/widgets/<X>Widget.tsx` + l'enregistrer dans `widgets/index.ts` (`WIDGET_COMPONENTS`).
- Widget lié à un outil → le filtrer dans `DashboardGrid` (cf. `costs` + `coutsOn`).
- Layouts perso par membre dans `dashboard_layouts` (fix-07).

## Supabase — pièges (déjà rencontrés)
- Migrations **idempotentes** : `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS` avant `CREATE POLICY`, realtime via `DO $$ IF NOT EXISTS (pg_publication_tables) …`.
- Après `ADD COLUMN`, l'API REST garde un **cache** → `notify pgrst, 'reload schema';` sinon l'écriture sur la colonne est rejetée silencieusement.
- **Mots réservés** en nom de colonne (ex. `analyse`) → guillemets `"analyse"`.
- La policy **UPDATE de `projects`** doit inclure le propriétaire : `USING/WITH CHECK (owner_id = auth.uid() OR is_project_member(id))` (fix-10). Sinon outils / statut / phase RDP ne persistent pas (UPDATE 0 ligne, **sans** erreur).
- Lecture des projets via `select('*')` → tolère une colonne pas encore migrée.

## Vidéo de présentation (Remotion)
- Projet **isolé** dans `video/` (son `package.json` ; `node_modules`/`out` gitignorés ; exclu du build Next via `tsconfig` `exclude:["video"]` + `.vercelignore`).
- Rendu : `cd video && npm run render` → `out/projet-entan.mp4`, puis copier dans `public/projet-entan.mp4` (servi sur `/projet-entan.mp4`, lecteur dans la page Aide).

## Démo / test
- Compte e2e : `test.claude.e2e@pilotix-demo.fr` / `test-pilotix-2026!`. Projet Supabase `ztbicozmnurwhmszhkvw`.

## Ne pas faire
- Ne pas toucher/supprimer le dossier `Gestion de projet` (V1 séparée).
- Ne pas committer `video/node_modules` ni `video/out`.
- Pas de couleur en dur, pas de contenu direct dans `.card` sans padding.
