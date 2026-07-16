# Modèle cible — Organisation · Sièges · Accès · Profil

> **Statut : modèle validé le 2026-07-16, non encore implémenté.**
> Document de référence. Toute évolution du système entreprise / sièges / accès /
> profil doit s'y conformer. Il fige le vocabulaire et remplace les branches
> accumulées en `fix-11` → `fix-20` (voir « Écart avec l'existant »).

## Pourquoi ce document

Le système actuel empile **trois axes d'accès orthogonaux qui portent le même
vocabulaire** (compte, siège, entreprise, accès projet), et le mot **« siège »**
est surchargé sur **cinq** sens (`company_members`, `companies.seats`,
`comp_seats`, `is_comp`, `access_keys`). Résultat : « ai-je un siège ? », « suis-je
dans une entreprise ? » et « ai-je accès à ce projet ? » sont mêlés. Ce document
fige **un seul modèle mental**.

## Les 3 principes

1. **Toujours une organisation.** Même en solo = une organisation d'une personne,
   **créée automatiquement à l'inscription**. Plus de cas spécial « entreprise
   optionnelle / projet solo ».
2. **« Siège » = un seul sens** : l'appartenance active d'un utilisateur à une
   organisation. Tout le reste (`seats`, `comp_seats`, `is_comp`, `access_keys`)
   devient une **source interne** du « droit aux sièges », jamais montrée à
   l'utilisateur.
3. **Deux niveaux d'accès nets** : *appartenir à l'organisation* (siège) **puis**
   *accéder à un projet* (accès projet).

## Entités

```
Utilisateur (compte)                 Organisation  ── a un ──►  Droit aux sièges
  nom, email                           (TOUJOURS 1)             essai 14j | clés | abonnement
     │  occupe un                        │
     ▼                                   │ contient
   Siège  ───────── dans une ──────────► │
   (= appartenance active à l'orga)      ▼
   rôle : propriétaire / admin / membre  Projet
   statut : actif / invité                │
     │                                    │
     └────── accès à ─────────────────────┘   (accès projet = accordé par membre)

Utilisateur ── a une ──►  Formation / Certification   (academy_progress)
Projet ────── contient ──►  Rôles RACI                (rôle-sur-tâche, rattaché au compte si possible)
```

- **Utilisateur (compte)** — 1 compte authentifié, 1 profil (nom, email). Porte
  sa formation et sa certification.
- **Organisation** — le tenant. Il en existe **toujours une** par utilisateur
  (solo = organisation d'une personne). Porte le « droit aux sièges ».
- **Siège** — le lien `(utilisateur, organisation)` **actif**. C'est le **seul**
  sens de « siège ». Rôle (propriétaire / admin / membre) et statut (actif /
  invité). Occuper un siège = être membre actif.
- **Projet** — appartient à une organisation.
- **Accès projet** — le lien `(membre, projet)` : quels membres de l'organisation
  peuvent ouvrir tel projet.
- **Formation / Certification** — rattachée au **compte** (`academy_progress`,
  `fix-21`). « Certifié ENTAN » = tous les badges de l'Académie.
- **Rôles RACI** — au sein d'un projet, un rôle-sur-tâche ; rattaché à un membre
  de l'organisation quand c'est possible, sinon libre (nom + fonction sans compte).

## Siège & droit aux sièges

- **Siège** = une ligne d'appartenance active. Point.
- **Droit aux sièges** (allowance) = **propriété de l'organisation** = nombre max
  de membres actifs autorisés. Calculé depuis, dans l'ordre :
  **essai 14 jours** (au démarrage) → **clés** (sièges offerts) → **abonnement**
  (quantité payée Stripe). Ce sont des **sources internes**, invisibles dans le
  vocabulaire produit.
- **« Ai-je un siège ? »** = « suis-je **membre actif** d'une organisation dont le
  droit aux sièges couvre mon siège ? ». Une seule question, une seule réponse.

## Accès — les deux niveaux

1. **Appartenance à l'organisation** (siège) — donne l'accès à l'app, pas aux
   projets. Rôle propriétaire / admin / membre.
2. **Accès projet** — accordé membre par membre : qui peut ouvrir tel projet.

## Navigation cible

Les **4 surfaces « gens »** actuelles (RACI, Accès, Équipe, Abonnement) se
réduisent à **2 claires** : **mon compte** (moi) et **Organisation** (les autres).

| Route | Rôle |
|---|---|
| `/compte` | **Mon profil** : mon compte, ma formation / certification, mon organisation, déconnexion. Atteignable en cliquant mon email dans la sidebar. **Ne dépend d'aucune organisation** → marche toujours. |
| `/equipe` | **Organisation** : roster des membres (= sièges), invitations, résumé sièges / facturation. |
| `/equipe/[userId]` | **Profil d'un membre** : vraie page liée depuis le roster. |
| Projet › **Accès** | Réglage **du projet** (« qui voit ce projet »), plus un item de nav de premier niveau jumeau d'« Organisation ». |

- **RACI** reste projet (rôles-sur-tâches).
- **Abonnement / facturation** : onglet de l'Organisation ou page dédiée — *à
  trancher à l'implémentation*.

## Profil

- **`/compte`** — mon compte + ma formation / certification + mon organisation +
  déconnexion.
- **`/equipe/[userId]`** — identité + formation / certification.
  **Contenu additionnel (rôle dans l'orga, projets accessibles, activité récente,
  …) : à définir plus tard.**

## Glossaire produit (ce qu'on montre, en FR)

**Organisation · Membre · Rôle** (Propriétaire / Admin / Membre) **· Invitation ·
Sièges / Abonnement · Accès au projet · Profil · Certification.**

**Jamais montré** (mécanique interne du droit aux sièges) : « clé », `comp_seats`,
`is_comp`, `access_keys`.

## Écart avec l'existant (`fix-11` → `fix-20`)

| Aujourd'hui | Cible |
|---|---|
| Entreprise optionnelle / projet solo (`fix-14`) | **Toujours une organisation** (solo = orga d'1, auto-créée) |
| « Siège » = 5 notions mêlées | **1 sens** (appartenance active) ; le reste = sources internes du droit aux sièges |
| `has_seat()` / `user_has_seat()` : essai OU clé OU abo, parallèle à l'appartenance | **Unifié** : membre actif d'une orga dont l'allowance le couvre |
| 4 surfaces « gens » (RACI, Accès, Équipe, Abonnement) | **2** : Mon compte + Organisation (Accès = réglage projet) |
| Profil = modale greffée sur les sièges | Vraies pages **`/compte`** + **`/equipe/[userId]`** |
| Roster nommé « Équipe » | Nommé **« Organisation »** |

## Plan d'implémentation par phases

Principe : **chaque phase est livrable et vérifiable seule**, du plus sûr au plus
risqué. Invariants tenus partout : frontières `fix-15` (siège = frontière RLS) et
`fix-16` (`companies` en lecture seule) **conservées** ; migrations idempotentes ;
écritures store tolérantes ; UI FR ; vérif **preview** avant `git push origin main`.

### Phase 0 — Réconcilier l'état réel des migrations *(prérequis, bloquant, risque faible)*
- Aligner le schéma réellement appliqué sur chaque Supabase (test
  `ztbicozmnurwhmszhkvw`, et prod). Ré-appliquer (idempotent) `fix-12` (ajoute
  `companies.comp_seats` manquant), puis `fix-20` (siège d'essai, en attente) et
  `fix-21` (academy_progress, nouveau).
- **Pourquoi** : le `select company_members(...comp_seats...)` renvoie 400 →
  l'organisation ne charge pas → page Organisation inutilisable. **Bloque tout.**
- **Livrable** : la page Organisation recharge ; `academy_progress` existe.
- **Action** : user (SQL Editor) ; checklist d'ordre + requête de contrôle fournies.

### Phase 1 — Profil en vraies pages : `/compte` + `/equipe/[userId]` *(UX, risque faible)*
- `/compte` (mon profil) : identité, ma formation/certification, mon organisation +
  rôle, déconnexion ; atteignable via mon email dans la sidebar. **Indépendant du
  chargement de l'organisation** → marche toujours.
- `/equipe/[userId]` : transformer la modale `MemberProfileModal` en **vraie page**
  liée depuis le roster.
- **Dépendance** : `/equipe/[id]` a besoin de Phase 0 ; `/compte` non (peut précéder).

### Phase 2 — Navigation « gens » : 4 surfaces → 2 *(UX, risque faible-moyen)*
- Renommer **Équipe → Organisation** (sidebar + titre).
- Sortir **Accès** de la nav projet → **réglage du projet** (« Qui voit ce projet »).
- Page Organisation = roster (membres = sièges) + invitations + résumé sièges.
- Passe de vocabulaire FR ; masquer « clé / comp_seats / is_comp » côté UI.

### Phase 3 — Toujours une organisation (solo = orga d'1) *(modèle, risque moyen)*
**✅ Implémentée le 2026-07-16 — SANS migration ni trigger auth** (approche plus sûre) :
- `store.tsx` → `ensurePersonalCompany()` + effet : quand `companyFeature &&
  companyChecked && hasSeat && !company`, auto-crée l'organisation personnelle
  (nom = display_name / préfixe email, suffixe sur collision) et **rattache les
  projets solo** (`company_id` null, `fix-14`) via un `UPDATE` côté client (RLS
  fix-10 l'autorise pour l'owner). Garde `ensuredCompanyRef` = pas de double-fire.
- Ne se déclenche pas sur `/invite` et `/rejoindre` (hors `(workspace)` → provider
  non monté), donc pas de collision avec l'acceptation d'invitation.
- Vérifié : compte neuf → orga « phase3.autoorg » auto-créée (Propriétaire), 1 seul
  membre, aucun doublon. Compte existant (a déjà une orga) → l'effet ne tire pas.
- **Non fait (assumé) :** retirer la relaxation RLS `fix-14` (`company_id` null
  autorisé) — conservée comme filet de sécurité inerte (les projets ont désormais
  toujours une orga). **Reste ouvert :** l'edge « rejoindre l'orga d'un collègue »
  après avoir déjà une orga perso = multi-appartenance (`current_company_id()` prend
  la plus ancienne). À traiter en affinant le flux « rejoindre » (Phase 4 / 3.5).

### Phase 4 — Unifier « siège » & « droit aux sièges » *(modèle + facturation, en dernier)*
**⚠️ En grande partie BLOQUÉE sur le câblage Stripe self-service** (chantier
monétisation en attente) : aujourd'hui la **clé d'accès EST le mécanisme d'accès
en production** (Stripe codé mais non câblé, décision 2026-07-08). Masquer « clé »
maintenant retirerait le seul moyen d'activer un siège. À faire **avec** Stripe.

**✅ Fait de sûr le 2026-07-16 (sans toucher sécurité/facturation) :**
- `SeatsPanel` rendu **conscient de l'essai** : un compte en essai (seats=0)
  affichait « Accès par clé » (trompeur) → affiche désormais « Essai gratuit » +
  message/lien cohérents. Vérifié avec un compte d'essai.
- Constat : les termes DB bruts `comp_seats`/`is_comp` ne sont **pas** exposés en
  l'état (ils apparaissent en « Accès offert »/« sièges »).

**Reste (avec Stripe) :** présenter un seul « droit aux sièges » piloté par
l'abonnement, clés = grant interne invisible ; finaliser le glossaire (retirer
« clé »). **NE PAS** réécrire `has_seat`/`user_has_seat` pour du cosmétique
(frontières `fix-15`/`fix-16` préservées).

### Ordre & jalons
`0` (débloquer) → `1` (profils ; `/compte` peut même précéder `0`) → `2` (nav) →
`3` (toujours une orga) → `4` (unifier sièges). **Push sur `main` après chaque
phase.**

### Décisions encore ouvertes (à trancher au fil de l'eau)
- Facturation : onglet dans Organisation ou page `/abonnement` séparée ? *(Phase 2)*
- Contenu du profil membre au-delà de formation/cert. *(déjà repoussé)*
- Essai : allowance au niveau orga vs par-utilisateur. *(détail Phase 4)*
