# Project Ops Hub — V1

Application web de gestion de projet pour chefs de projet industriels et techniques.
Quatre modules connectés autour d'un modèle de données unique : **RACI**, **AMDEC**, **Actions**, **Planning**.

## Démarrer

```bash
npm install
npm run dev        # serveur de développement → http://localhost:5173
npm run build      # vérification TypeScript + build de production (dist/)
```

Les données sont persistées localement dans le navigateur (`localStorage`).
Au premier lancement, un écran d'accueil propose de créer un projet ou de charger un **projet de démonstration** complet.

## Stack

- **React 19 + TypeScript (strict)** — UI
- **Vite 7** — build / dev server
- **Zustand** (+ middleware `persist`) — store central unique, persistance localStorage
- **React Router (HashRouter)** — navigation, déployable en statique sans configuration serveur
- CSS maison (design system type Linear/Notion), aucune dépendance UI

## Architecture

```
src/
  types.ts                 # Modèle de données central + règles (criticité, seuils)
  store/useStore.ts        # Store unique : état, règles métier, sélecteurs dérivés
  lib/                     # Utilitaires purs (dates, ids)
  components/              # UI partagée (Layout, Modal, Badges, icônes…)
  modules/
    dashboard/             # Pilotage : retards/urgences, risques, charge équipe, à venir
    raci/                  # Équipe + matrice RACI
    amdec/                 # Analyses de défaillance + génération d'actions
    actions/               # CRUD actions (cœur du produit) + formulaire partagé
    planning/              # Calendrier + Gantt simple + liste chrono (vues des actions)
```

### Modèle de données (aucune duplication)

- **Project** : nom, description, **membres** (source unique de l'équipe)
- **Action** : titre, description, **responsibleId obligatoire** (membre du projet),
  accountable / consulted / informed (RACI), statut, dates, **amdecId** optionnel (source)
- **AmdecEntry** : élément, mode de défaillance, cause, effet, G / O / D (1–4)
  → criticité **calculée** = G × O × D (1–64, jamais stockée ; ≥ 24 critique, ≥ 12 à surveiller)

### Liens entre modules

| Lien | Implémentation |
|---|---|
| AMDEC → Actions | bouton « + action » sur chaque analyse, action pré-liée (`amdecId`) |
| Actions → RACI | `responsibleId` obligatoire, choisi parmi les membres du projet |
| Actions → Planning | le planning lit les dates des actions (pure vue, zéro stockage) — calendrier, Gantt (début → échéance) ou liste |
| RACI → Actions | la matrice modifie directement les champs R/A/C/I des actions |

### Règles métier garanties par le store

- Une action a **toujours** un Responsible ; impossible de retirer le R dans la matrice
  ou de supprimer un membre encore responsable d'actions.
- Un membre n'a qu'un rôle RACI par action (R prime sur A, A sur C, C sur I).
- Supprimer une AMDEC conserve les actions générées (lien simplement détaché).
- Supprimer un projet emporte ses actions et analyses (cascade).

## Périmètre V1 / évolutions prévues

V1 volontairement sans : IA, dépendances entre tâches, Gantt avancé, backend.
La structure (store normalisé, modules isolés, vues dérivées) est prête pour :
synchronisation serveur, automatisations (AMDEC critique → action suggérée),
dépendances entre actions, multi-utilisateurs.
