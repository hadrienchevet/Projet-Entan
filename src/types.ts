/**
 * Modèle de données central de Project Ops Hub.
 *
 * Tous les modules (RACI, AMDEC, Actions, Planning) référencent ces
 * mêmes entités : aucune donnée n'est dupliquée entre modules.
 * - Les membres appartiennent à un projet (source unique pour le RACI).
 * - Les actions référencent les membres (RACI) et éventuellement une AMDEC.
 * - Le planning est une vue des actions, pas une entité propre.
 */

export type Id = string;

export type ActionStatus = 'todo' | 'in_progress' | 'done';

export type RaciRole = 'R' | 'A' | 'C' | 'I';

export interface Member {
  id: Id;
  /** Nom complet du membre. */
  name: string;
  /** Fonction / poste (ex. "Chef de projet", "Qualité"). */
  role: string;
}

export interface Project {
  id: Id;
  name: string;
  description?: string;
  /** L'équipe appartient au projet : seule source de membres pour le RACI. */
  members: Member[];
  createdAt: string;
}

export interface Action {
  id: Id;
  projectId: Id;
  title: string;
  description: string;
  /** RACI — Responsible : obligatoire, membre du projet. */
  responsibleId: Id;
  /** RACI — Accountable : au plus un par action. */
  accountableId?: Id;
  /** RACI — Consulted. */
  consultedIds: Id[];
  /** RACI — Informed. */
  informedIds: Id[];
  status: ActionStatus;
  /** Date de début (ISO yyyy-mm-dd), optionnelle. */
  startDate?: string;
  /** Échéance (ISO yyyy-mm-dd), fortement encouragée. */
  dueDate?: string;
  /** Analyse AMDEC d'origine, si l'action en découle. */
  amdecId?: Id;
  createdAt: string;
}

export interface AmdecEntry {
  id: Id;
  projectId: Id;
  /** Fonction ou élément analysé. */
  element: string;
  /** Mode de défaillance. */
  failureMode: string;
  cause: string;
  /** Effet de la défaillance (optionnel). */
  effect?: string;
  /** Gravité, 1 à 4. */
  severity: number;
  /** Occurrence, 1 à 4. */
  occurrence: number;
  /** Détectabilité, 1 à 4. */
  detection: number;
  createdAt: string;
}

/** Borne haute de l'échelle de cotation G / O / D. */
export const AMDEC_SCALE_MAX = 4;

/** Criticité AMDEC = gravité × occurrence × détectabilité (1 à 64). */
export function criticality(entry: Pick<AmdecEntry, 'severity' | 'occurrence' | 'detection'>): number {
  return entry.severity * entry.occurrence * entry.detection;
}

export type CriticalityLevel = 'low' | 'medium' | 'high';

/** Seuils sur l'échelle 1–4 (criticité max 64) : ≥ 24 critique, ≥ 12 à surveiller. */
export function criticalityLevel(score: number): CriticalityLevel {
  if (score >= 24) return 'high';
  if (score >= 12) return 'medium';
  return 'low';
}

export const STATUS_LABELS: Record<ActionStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminée',
};

export const RACI_LABELS: Record<RaciRole, string> = {
  R: 'Responsible — réalise l’action',
  A: 'Accountable — rend des comptes',
  C: 'Consulted — consulté',
  I: 'Informed — informé',
};

export interface MemberInput {
  name: string;
  role: string;
}

export interface ActionInput {
  title: string;
  description: string;
  responsibleId: Id;
  accountableId?: Id;
  consultedIds: Id[];
  informedIds: Id[];
  status: ActionStatus;
  startDate?: string;
  dueDate?: string;
  amdecId?: Id;
}

export interface AmdecInput {
  element: string;
  failureMode: string;
  cause: string;
  effect?: string;
  severity: number;
  occurrence: number;
  detection: number;
}
