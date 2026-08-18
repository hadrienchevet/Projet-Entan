<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Projet Entan — guide projet

Lis ce fichier en priorité : il évite de ré-explorer le code. Détail des
migrations dans [supabase/MIGRATIONS.md](supabase/MIGRATIONS.md). **Modèle cible
Organisation / sièges / accès / profil (validé, à suivre) :
[MODELE-ORGANISATION.md](MODELE-ORGANISATION.md).**

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

## Contexte IA (résumé Markdown du projet)
- `src/lib/projectContext.ts` → `buildProjectContextMd()` : fonction **pure** (`today` injecté, aucun accès store/Supabase), donc testable en `npx tsx`.
- C'est une **sélection éditoriale, pas un dump** : chiffres pré-calculés (l'IA ne doit rien compter), barèmes expliqués (criticité G×O×D, score matrice /12), coupes annoncées (« n non listées »), aucun id technique ni email.
- Règles issues d'une relecture par IA sur un vrai projet (2026-08-18), à ne pas casser :
  - **jamais de marqueur cryptique** (un `(+1)` nu est lu comme une donnée du projet) ni de « autres » quand rien n'a été listé au-dessus (le lecteur additionne les deux nombres) ;
  - **jamais d'« écart » quand le réel n'est pas saisi** : 0 € réel n'est pas une économie de −100 %, c'est un budget non consommé — cf. `budgetTracked` ;
  - les **dépendances sont nommées** (« bloque : Mise en production »), sinon la chronologie est invérifiable ;
  - `clip()` convertit les retours à la ligne en « ; » : aplatis en espace, deux idées se recollent en une phrase que le lecteur prend pour une seule affirmation ;
  - **une donnée = une ligne** : ne jamais joindre plusieurs items par un séparateur (`·`). Le séparateur disparaît dès que le document est recopié ou cité, et deux items valides se lisent alors comme une seule phrase corrompue (faux diagnostic constaté 2 fois sur le SWOT) ;
  - **filtrer les items vides** avant de compter : un total annoncé « (4) » avec 2 lignes visibles fait douter de toutes les autres données du document ;
  - **définir les termes qui ont plusieurs sens** — « en retard » = échéance dépassée ET non terminée. Sans la définition, le lecteur passe un paragraphe à en douter au lieu d'analyser.
- UI : `src/components/ProjectContextModal.tsx` (copie presse-papier en action principale, `.md` en secondaire, option d'anonymisation des noms) ; bouton « Contexte IA » dans l'en-tête du dashboard.
- ⚠️ Les sections suivent `enabledTools(project.tools)` : **un nouvel outil doit ajouter sa section ici**, sinon il reste invisible pour l'IA.

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
