# Registre des activités de traitement — Projet Entan

> **Document interne** (RGPD art. 30). Ne pas publier. À tenir à jour et à présenter à la CNIL sur demande.
> Champs `[à compléter]` à renseigner une fois l'entité immatriculée.

## Responsable du traitement (l'éditeur, pour ses propres traitements)

- **Raison sociale** : [Raison sociale]
- **SIREN / RCS** : [SIREN]
- **Adresse** : [adresse complète]
- **Contact / DPO** : [email de contact]
- **Date de création du registre** : 2026-06-29
- **Dernière révision** : 2026-06-29

> Note : pour les **données saisies par les clients dans le Service**, l'éditeur agit comme
> **sous-traitant** (le client est responsable de traitement). Ce registre couvre les traitements
> dont l'éditeur est lui-même responsable. La sous-traitance est encadrée par le DPA (`/dpa`).

---

## 1. Gestion des comptes utilisateurs

| Élément | Détail |
|---|---|
| Finalité | Création et gestion des comptes, authentification |
| Base légale | Exécution du contrat (CGV) |
| Catégories de données | Email, nom affiché, mot de passe (haché par Supabase) |
| Personnes concernées | Utilisateurs du Service |
| Destinataires / sous-traitants | Supabase (UE/Irlande) |
| Transferts hors UE | Non (données en UE) |
| Durée de conservation | Durée de vie du compte + [X] mois après suppression |
| Mesures de sécurité | TLS, chiffrement au repos, RLS, mots de passe hachés |

## 2. Fourniture du Service (contenu des projets)

| Élément | Détail |
|---|---|
| Finalité | Hébergement et mise à disposition collaborative des données projets |
| Base légale | Exécution du contrat |
| Catégories de données | Contenu saisi : projets, actions, membres, AMDEC, RDP, coûts… |
| Personnes concernées | Membres d'équipe et personnes mentionnées dans les contenus |
| Destinataires / sous-traitants | Supabase (UE/Irlande), Vercel (US — CCT) |
| Transferts hors UE | Vercel (US) sous clauses contractuelles types |
| Durée de conservation | Durée du contrat + [X] mois après suppression |
| Mesures de sécurité | RLS par projet, TLS, chiffrement au repos |

## 3. Facturation et abonnements

| Élément | Détail |
|---|---|
| Finalité | Encaissement, gestion des abonnements, comptabilité |
| Base légale | Exécution du contrat + obligation légale (comptable) |
| Catégories de données | Identifiant client/abonnement Stripe, statut, montants |
| Personnes concernées | Clients (entreprises et leurs représentants) |
| Destinataires / sous-traitants | Stripe (UE/US — CCT) |
| Transferts hors UE | Stripe sous clauses contractuelles types |
| Durée de conservation | [10] ans (obligations comptables) |
| Mesures de sécurité | Aucun numéro de carte stocké ; tokenisation Stripe |

## 4. Sécurité et journaux techniques

| Élément | Détail |
|---|---|
| Finalité | Sécurité, prévention de la fraude, diagnostic |
| Base légale | Intérêt légitime |
| Catégories de données | Journaux de connexion, adresses IP, identifiants techniques |
| Personnes concernées | Utilisateurs du Service |
| Destinataires / sous-traitants | Supabase, Vercel |
| Durée de conservation | [durée — ex. 12 mois] |
| Mesures de sécurité | Accès restreint, TLS |

## 5. Support et communication

| Élément | Détail |
|---|---|
| Finalité | Répondre aux demandes, communiquer sur le Service |
| Base légale | Intérêt légitime / exécution du contrat |
| Catégories de données | Email, contenu des échanges |
| Personnes concernées | Utilisateurs / prospects |
| Destinataires / sous-traitants | [outil email / support si applicable] |
| Durée de conservation | [durée] |
| Mesures de sécurité | Accès restreint |
