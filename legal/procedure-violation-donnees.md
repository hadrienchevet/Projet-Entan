# Procédure de gestion des violations de données

> **Document interne** (RGPD art. 33 et 34). Ne pas publier.
> Objectif : réagir vite et conformément en cas de violation (fuite, perte, altération ou
> accès non autorisé à des données personnelles).

## Rappel des délais légaux

- **Notification à la CNIL** : dans les **72 heures** après en avoir pris connaissance, **si** la
  violation présente un risque pour les personnes concernées.
- **Information des personnes concernées** : **sans délai injustifié** si le risque est **élevé**.
- **En tant que sous-traitant d'un client** (données saisies dans le Service) : informer le
  **client (responsable de traitement) sans délai injustifié** (≤ [48] h, cf. DPA) — c'est **lui**
  qui notifie la CNIL et ses personnes concernées.

## Étapes

### 1. Détection & alerte
- Toute personne détectant un incident prévient immédiatement le responsable : **[nom / email]**.
- Consigner : date/heure de détection, source, description initiale.

### 2. Confinement
- Stopper la fuite (révoquer un accès/clé, couper un service, corriger la faille).
- Préserver les preuves (journaux, captures).

### 3. Qualification
- S'agit-il bien de données personnelles ? Quelles catégories, quel volume, combien de personnes ?
- Origine : interne / externe / sous-traitant (Supabase, Vercel, Stripe) ?

### 4. Évaluation du risque pour les personnes
- Conséquences possibles (usurpation, divulgation, perte d'accès…).
- Niveau : **faible / moyen / élevé** → conditionne les notifications.

### 5. Notifications
- **Risque pour les personnes** → notifier la **CNIL** sous 72 h (formulaire en ligne CNIL).
- **Risque élevé** → informer les **personnes concernées** sans délai injustifié.
- **Données de clients (sous-traitance)** → informer les **clients concernés** sous [48] h avec les
  éléments utiles (nature, données, mesures prises).

### 6. Documentation
- Renseigner le **registre des violations** ci-dessous (obligatoire, art. 33-5, **même si non
  notifiée** à la CNIL).
- Mesures correctives et préventives mises en place.

## Registre des violations (à tenir)

| Date | Description | Données concernées | Nb personnes | Risque | CNIL notifiée ? | Personnes informées ? | Mesures prises |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Contacts utiles

- Responsable incident : **[nom / email / téléphone]**
- CNIL : https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles
- Sous-traitants (en cas d'incident de leur côté) : Supabase, Vercel, Stripe (consulter leurs pages status / sécurité).
