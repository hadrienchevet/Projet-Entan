/**
 * Modèle de données central de Pilotix — identique à la V1 (Project Ops Hub).
 *
 * Tous les modules (RACI, AMDEC, Actions, Planning) référencent ces mêmes
 * entités : aucune donnée n'est dupliquée entre modules.
 * - Les membres appartiennent à un projet (source unique pour le RACI) ;
 *   un membre peut être rattaché à un compte (collaboration) ou non.
 * - Les actions référencent les membres (RACI) et éventuellement une AMDEC.
 * - Le planning est une vue des actions, pas une entité propre.
 *
 * La persistance est assurée par Supabase (tables snake_case) ; les mappers
 * en bas de fichier font la conversion ligne ↔ entité.
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
  /** Compte rattaché (undefined = membre ajouté à la main, sans compte). */
  userId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
}

export interface ProjectMember {
  projectId: Id;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  profile?: UserProfile;
}

export interface ProjectMeta {
  id: Id;
  name: string;
  description?: string;
  createdAt: string;
  ownerId: string;
  project_members?: ProjectMember[];
}

export interface Project {
  id: Id;
  name: string;
  description?: string;
  ownerId: string;
  /** L'équipe appartient au projet : seule source de membres pour le RACI. */
  members: Member[];
  project_members?: ProjectMember[];
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
  consultedIds: Id[];
  informedIds: Id[];
  status: ActionStatus;
  startDate?: string;
  dueDate?: string;
  /** Analyse AMDEC d'origine, si l'action en découle. */
  amdecId?: Id;
  createdAt: string;
}

export interface AmdecEntry {
  id: Id;
  projectId: Id;
  element: string;
  failureMode: string;
  cause: string;
  effect?: string;
  /** Gravité, 1 à 4. */
  severity: number;
  /** Occurrence, 1 à 4. */
  occurrence: number;
  /** Détectabilité, 1 à 4. */
  detection: number;
  createdAt: string;
}

export interface Invitation {
  id: Id;
  token: string;
  expiresAt: string;
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

/* --- Entrées des formulaires (mêmes formes qu'en V1) ----------------------- */

export interface MemberInput {
  name: string;
  role: string;
  userId?: string;
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

/* --- Mappers lignes Supabase (snake_case) ↔ entités V1 (camelCase) --------- */

export interface MemberRow {
  id: string;
  project_id: string;
  user_id: string | null;
  name: string;
  job_role: string;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
}

export interface ProjectMemberRow {
  project_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profiles?: ProfileRow;
}

export interface ActionRow {
  id: string;
  project_id: string;
  amdec_item_id: string | null;
  title: string;
  description: string;
  responsible_id: string;
  accountable_id: string | null;
  consulted_ids: string[];
  informed_ids: string[];
  status: ActionStatus;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
}

export interface AmdecRow {
  id: string;
  project_id: string;
  element: string;
  failure_mode: string;
  cause: string;
  effect: string | null;
  severity: number;
  occurrence: number;
  detection: number;
  created_at: string;
}

export function memberFromRow(r: MemberRow): Member {
  return { id: r.id, name: r.name, role: r.job_role, userId: r.user_id ?? undefined };
}

export function profileFromRow(r: ProfileRow): UserProfile {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name ?? undefined,
  };
}

export function projectMemberFromRow(r: ProjectMemberRow): ProjectMember {
  return {
    projectId: r.project_id,
    userId: r.user_id,
    role: r.role,
    joinedAt: r.joined_at,
    profile: r.profiles ? profileFromRow(r.profiles) : undefined,
  };
}

export function actionFromRow(r: ActionRow): Action {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description,
    responsibleId: r.responsible_id,
    accountableId: r.accountable_id ?? undefined,
    consultedIds: r.consulted_ids ?? [],
    informedIds: r.informed_ids ?? [],
    status: r.status,
    startDate: r.start_date ?? undefined,
    dueDate: r.due_date ?? undefined,
    amdecId: r.amdec_item_id ?? undefined,
    createdAt: r.created_at,
  };
}

export function actionInputToRow(input: Partial<ActionInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.responsibleId !== undefined) row.responsible_id = input.responsibleId;
  if ('accountableId' in input) row.accountable_id = input.accountableId ?? null;
  if (input.consultedIds !== undefined) row.consulted_ids = input.consultedIds;
  if (input.informedIds !== undefined) row.informed_ids = input.informedIds;
  if (input.status !== undefined) row.status = input.status;
  if ('startDate' in input) row.start_date = input.startDate ?? null;
  if ('dueDate' in input) row.due_date = input.dueDate ?? null;
  if ('amdecId' in input) row.amdec_item_id = input.amdecId ?? null;
  return row;
}

export function amdecFromRow(r: AmdecRow): AmdecEntry {
  return {
    id: r.id,
    projectId: r.project_id,
    element: r.element,
    failureMode: r.failure_mode,
    cause: r.cause,
    effect: r.effect ?? undefined,
    severity: r.severity,
    occurrence: r.occurrence,
    detection: r.detection,
    createdAt: r.created_at,
  };
}

export function amdecInputToRow(input: Partial<AmdecInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.element !== undefined) row.element = input.element;
  if (input.failureMode !== undefined) row.failure_mode = input.failureMode;
  if (input.cause !== undefined) row.cause = input.cause;
  if ('effect' in input) row.effect = input.effect ?? null;
  if (input.severity !== undefined) row.severity = input.severity;
  if (input.occurrence !== undefined) row.occurrence = input.occurrence;
  if (input.detection !== undefined) row.detection = input.detection;
  return row;
}
