/**
 * Modèle de données central de Projet Entan — identique à la V1 (Project Ops Hub).
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

import type { ToolId } from './tools';

export type Id = string;

export type ProjectType = 'gestion' | 'rdp';

export type ProjectStatus = 'active' | 'completed';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'En cours',
  completed: 'Terminé',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  gestion: 'Gestion de projet',
  rdp: 'Résolution de problèmes',
};

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
  projectType: ProjectType;
  status: ProjectStatus;
  /** Outils de gestion activés (null = jeu par défaut). */
  tools?: ToolId[] | null;
  /** Phase courante de la démarche RDP (0 = sujet … 6 = standardiser). */
  rdpCurrentPhase: number;
  project_members?: ProjectMember[];
}

export interface Project {
  id: Id;
  name: string;
  description?: string;
  ownerId: string;
  projectType: ProjectType;
  status: ProjectStatus;
  tools?: ToolId[] | null;
  rdpCurrentPhase: number;
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
  /** Cotation après actions correctives (undefined = pas encore réévalué). */
  severityAfter?: number;
  occurrenceAfter?: number;
  detectionAfter?: number;
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

/** Criticité résiduelle (après actions) — null tant que les 3 cotes ne sont pas saisies. */
export function residualCriticality(
  entry: Pick<AmdecEntry, 'severityAfter' | 'occurrenceAfter' | 'detectionAfter'>,
): number | null {
  if (!entry.severityAfter || !entry.occurrenceAfter || !entry.detectionAfter) return null;
  return entry.severityAfter * entry.occurrenceAfter * entry.detectionAfter;
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
  severityAfter?: number;
  occurrenceAfter?: number;
  detectionAfter?: number;
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
  severity_after: number | null;
  occurrence_after: number | null;
  detection_after: number | null;
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
    severityAfter: r.severity_after ?? undefined,
    occurrenceAfter: r.occurrence_after ?? undefined,
    detectionAfter: r.detection_after ?? undefined,
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
  if ('severityAfter' in input) row.severity_after = input.severityAfter ?? null;
  if ('occurrenceAfter' in input) row.occurrence_after = input.occurrenceAfter ?? null;
  if ('detectionAfter' in input) row.detection_after = input.detectionAfter ?? null;
  return row;
}

/* --- Modèle RDP (Résolution de Problèmes) --------------------------------- */

export type PdcaPhase = 'plan' | 'do' | 'check' | 'act' | 'closed';

export const PDCA_LABELS: Record<PdcaPhase, string> = {
  plan: 'Plan',
  do: 'Do',
  check: 'Check',
  act: 'Act',
  closed: 'Clôturée',
};

/** 5 Pourquoi — une analyse = un problème + jusqu'à 5 niveaux de "Pourquoi / Parce que". */
export interface FiveWhyAnalysis {
  id: Id;
  projectId: Id;
  title: string;
  problemStatement: string;
  pdcaPhase: PdcaPhase;
  levels: FiveWhyLevel[];
  createdAt: string;
}

export interface FiveWhyLevel {
  id: Id;
  analysisId: Id;
  projectId: Id;
  levelNum: number;
  whyQuestion: string;
  becauseAnswer: string;
  isRootCause: boolean;
  createdAt: string;
}

export interface FiveWhyAnalysisInput {
  title: string;
  problemStatement: string;
  pdcaPhase: PdcaPhase;
}

export interface FiveWhyLevelInput {
  whyQuestion: string;
  becauseAnswer: string;
  isRootCause: boolean;
}

/** Ishikawa 5M (méthodologie RDP) — un effet + des causes classées par nature. */
export type IshikawaCategory =
  | 'Matière'
  | 'Méthode'
  | 'Machine'
  | "Main-d'œuvre"
  | 'Milieu'
  | 'Mesure';

export const ISHIKAWA_CATEGORIES: IshikawaCategory[] = [
  'Matière',
  'Méthode',
  'Machine',
  "Main-d'œuvre",
  'Milieu',
];

export interface IshikawaAnalysis {
  id: Id;
  projectId: Id;
  title: string;
  effect: string;
  causes: IshikawaCause[];
  createdAt: string;
}

export interface IshikawaCause {
  id: Id;
  analysisId: Id;
  projectId: Id;
  category: IshikawaCategory;
  causeText: string;
  createdAt: string;
}

export interface IshikawaAnalysisInput {
  title: string;
  effect: string;
}

export interface IshikawaCauseInput {
  category: IshikawaCategory;
  causeText: string;
}

/** CAPA — actions correctives et préventives. */
export type CapaType = 'corrective' | 'preventive';
export type CapaStatus = 'open' | 'in_progress' | 'closed' | 'verified';

export const CAPA_TYPE_LABELS: Record<CapaType, string> = {
  corrective: 'Corrective',
  preventive: 'Préventive',
};

export const CAPA_STATUS_LABELS: Record<CapaStatus, string> = {
  open: 'Ouverte',
  in_progress: 'En cours',
  closed: 'Clôturée',
  verified: 'Vérifiée',
};

export interface CapaAction {
  id: Id;
  projectId: Id;
  type: CapaType;
  title: string;
  description: string;
  responsibleId?: Id;
  status: CapaStatus;
  dueDate?: string;
  source?: string;
  /** Phase de la démarche : 5 = mise en œuvre, 6 = standardisation. */
  phase: 5 | 6;
  createdAt: string;
}

export interface CapaActionInput {
  type: CapaType;
  title: string;
  description: string;
  responsibleId?: Id;
  status: CapaStatus;
  dueDate?: string;
  source?: string;
  phase: 5 | 6;
}

/* --- Row types Supabase pour le mode RDP ----------------------------------- */

export interface FiveWhyAnalysisRow {
  id: string;
  project_id: string;
  title: string;
  problem_statement: string;
  pdca_phase: PdcaPhase;
  created_at: string;
  five_why_levels?: FiveWhyLevelRow[];
}

export interface FiveWhyLevelRow {
  id: string;
  analysis_id: string;
  project_id: string;
  level_num: number;
  why_question: string;
  because_answer: string;
  is_root_cause: boolean;
  created_at: string;
}

export interface IshikawaAnalysisRow {
  id: string;
  project_id: string;
  title: string;
  effect: string;
  created_at: string;
  ishikawa_causes?: IshikawaCauseRow[];
}

export interface IshikawaCauseRow {
  id: string;
  analysis_id: string;
  project_id: string;
  category: IshikawaCategory;
  cause_text: string;
  created_at: string;
}

export interface CapaActionRow {
  id: string;
  project_id: string;
  type: CapaType;
  title: string;
  description: string;
  responsible_id: string | null;
  status: CapaStatus;
  due_date: string | null;
  source: string | null;
  phase: number | null;
  created_at: string;
}

/* --- Mappers RDP ----------------------------------------------------------- */

export function fiveWhyAnalysisFromRow(r: FiveWhyAnalysisRow): FiveWhyAnalysis {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    problemStatement: r.problem_statement,
    pdcaPhase: r.pdca_phase,
    levels: ((r.five_why_levels ?? []) as FiveWhyLevelRow[])
      .map(fiveWhyLevelFromRow)
      .sort((a, b) => a.levelNum - b.levelNum),
    createdAt: r.created_at,
  };
}

export function fiveWhyLevelFromRow(r: FiveWhyLevelRow): FiveWhyLevel {
  return {
    id: r.id,
    analysisId: r.analysis_id,
    projectId: r.project_id,
    levelNum: r.level_num,
    whyQuestion: r.why_question,
    becauseAnswer: r.because_answer,
    isRootCause: r.is_root_cause,
    createdAt: r.created_at,
  };
}

export function ishikawaAnalysisFromRow(r: IshikawaAnalysisRow): IshikawaAnalysis {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    effect: r.effect,
    causes: ((r.ishikawa_causes ?? []) as IshikawaCauseRow[]).map(ishikawaCauseFromRow),
    createdAt: r.created_at,
  };
}

export function ishikawaCauseFromRow(r: IshikawaCauseRow): IshikawaCause {
  return {
    id: r.id,
    analysisId: r.analysis_id,
    projectId: r.project_id,
    category: r.category,
    causeText: r.cause_text,
    createdAt: r.created_at,
  };
}

export function capaActionFromRow(r: CapaActionRow): CapaAction {
  return {
    id: r.id,
    projectId: r.project_id,
    type: r.type,
    title: r.title,
    description: r.description,
    responsibleId: r.responsible_id ?? undefined,
    status: r.status,
    dueDate: r.due_date ?? undefined,
    source: r.source ?? undefined,
    phase: r.phase === 6 ? 6 : 5,
    createdAt: r.created_at,
  };
}

/* --- Méthodologie RDP en 7 phases (0 → 6) ----------------------------------- */

/** Phase 0 — sujet issu du brainstorming, priorisé par fréquence × impact. */
export interface RdpSubject {
  id: Id;
  projectId: Id;
  label: string;
  /** Fréquence d'apparition du problème, 1 à 4. */
  frequency: number;
  /** Impact du problème, 1 à 4. */
  impact: number;
  /** Sujet retenu pour la démarche (un seul par projet). */
  retained: boolean;
  createdAt: string;
}

export interface RdpSubjectInput {
  label: string;
  frequency: number;
  impact: number;
}

/** Phase 1 — fiche problème : QQOQCP + situations + écart (une par projet). */
export interface RdpProblem {
  projectId: Id;
  quoi: string;
  qui: string;
  ou: string;
  quand: string;
  comment: string;
  pourquoi: string;
  situationActuelle: string;
  situationSouhaitee: string;
  ecart: string;
  objectifs: string;
}

export type RdpProblemInput = Omit<RdpProblem, 'projectId'>;

/** Indicateur du tableau de bord (phases 1 et 5). */
export interface RdpIndicator {
  id: Id;
  projectId: Id;
  name: string;
  unit: string;
  currentValue: string;
  targetValue: string;
  /** Fréquence de relevé (ex. « hebdomadaire »). */
  frequency: string;
  /** Responsable de la mise à jour (membre de l'équipe). */
  responsibleId?: Id;
  createdAt: string;
}

export interface RdpIndicatorInput {
  name: string;
  unit: string;
  currentValue: string;
  targetValue: string;
  frequency: string;
  responsibleId?: Id;
}

/** Phases 3-4 — solution évaluée par la matrice de décision. */
export interface RdpSolution {
  id: Id;
  projectId: Id;
  /** Cause traitée (issue de l'Ishikawa). */
  causeId?: Id;
  title: string;
  description: string;
  /** Efficacité attendue, 1 à 4. */
  effectiveness: number;
  /** Facilité de mise en œuvre, 1 à 4. */
  ease: number;
  /** Coût : 4 = très peu coûteux, 1 = très coûteux. */
  cost: number;
  retained: boolean;
  createdAt: string;
}

export interface RdpSolutionInput {
  causeId?: Id;
  title: string;
  description: string;
  effectiveness: number;
  ease: number;
  cost: number;
}

/** Score de la matrice de décision (3 à 12). */
export function solutionScore(s: Pick<RdpSolution, 'effectiveness' | 'ease' | 'cost'>): number {
  return s.effectiveness + s.ease + s.cost;
}

/** Score de priorisation d'un sujet (1 à 16). */
export function subjectScore(s: Pick<RdpSubject, 'frequency' | 'impact'>): number {
  return s.frequency * s.impact;
}

/* --- Rows Supabase (méthodologie) ------------------------------------------- */

export interface RdpSubjectRow {
  id: string;
  project_id: string;
  label: string;
  frequency: number;
  impact: number;
  retained: boolean;
  created_at: string;
}

export interface RdpProblemRow {
  project_id: string;
  quoi: string;
  qui: string;
  ou: string;
  quand: string;
  comment: string;
  pourquoi: string;
  situation_actuelle: string;
  situation_souhaitee: string;
  ecart: string;
  objectifs: string;
}

export interface RdpIndicatorRow {
  id: string;
  project_id: string;
  name: string;
  unit: string;
  current_value: string;
  target_value: string;
  frequency: string;
  responsible_id: string | null;
  created_at: string;
}

export interface RdpSolutionRow {
  id: string;
  project_id: string;
  cause_id: string | null;
  title: string;
  description: string;
  effectiveness: number;
  ease: number;
  cost: number;
  retained: boolean;
  created_at: string;
}

export function rdpSubjectFromRow(r: RdpSubjectRow): RdpSubject {
  return {
    id: r.id,
    projectId: r.project_id,
    label: r.label,
    frequency: r.frequency,
    impact: r.impact,
    retained: r.retained,
    createdAt: r.created_at,
  };
}

export function rdpProblemFromRow(r: RdpProblemRow): RdpProblem {
  return {
    projectId: r.project_id,
    quoi: r.quoi,
    qui: r.qui,
    ou: r.ou,
    quand: r.quand,
    comment: r.comment,
    pourquoi: r.pourquoi,
    situationActuelle: r.situation_actuelle,
    situationSouhaitee: r.situation_souhaitee,
    ecart: r.ecart,
    objectifs: r.objectifs,
  };
}

export function rdpProblemInputToRow(input: Partial<RdpProblemInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.quoi !== undefined) row.quoi = input.quoi;
  if (input.qui !== undefined) row.qui = input.qui;
  if (input.ou !== undefined) row.ou = input.ou;
  if (input.quand !== undefined) row.quand = input.quand;
  if (input.comment !== undefined) row.comment = input.comment;
  if (input.pourquoi !== undefined) row.pourquoi = input.pourquoi;
  if (input.situationActuelle !== undefined) row.situation_actuelle = input.situationActuelle;
  if (input.situationSouhaitee !== undefined) row.situation_souhaitee = input.situationSouhaitee;
  if (input.ecart !== undefined) row.ecart = input.ecart;
  if (input.objectifs !== undefined) row.objectifs = input.objectifs;
  return row;
}

export function rdpIndicatorFromRow(r: RdpIndicatorRow): RdpIndicator {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    unit: r.unit,
    currentValue: r.current_value,
    targetValue: r.target_value,
    frequency: r.frequency,
    responsibleId: r.responsible_id ?? undefined,
    createdAt: r.created_at,
  };
}

export function rdpSolutionFromRow(r: RdpSolutionRow): RdpSolution {
  return {
    id: r.id,
    projectId: r.project_id,
    causeId: r.cause_id ?? undefined,
    title: r.title,
    description: r.description,
    effectiveness: r.effectiveness,
    ease: r.ease,
    cost: r.cost,
    retained: r.retained,
    createdAt: r.created_at,
  };
}

/* --- Suivi des coûts -------------------------------------------------------- */

/** Un poste de dépense : budget prévu vs coût réel. */
export interface CostItem {
  id: Id;
  projectId: Id;
  label: string;
  planned: number;
  actual: number;
  createdAt: string;
}

export interface CostItemInput {
  label: string;
  planned: number;
  actual: number;
}

export interface CostItemRow {
  id: string;
  project_id: string;
  label: string;
  planned: number | string;
  actual: number | string;
  created_at: string;
}

export function costItemFromRow(r: CostItemRow): CostItem {
  return {
    id: r.id,
    projectId: r.project_id,
    label: r.label,
    planned: Number(r.planned) || 0,
    actual: Number(r.actual) || 0,
    createdAt: r.created_at,
  };
}

export function costItemInputToRow(input: Partial<CostItemInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.label !== undefined) row.label = input.label;
  if (input.planned !== undefined) row.planned = input.planned;
  if (input.actual !== undefined) row.actual = input.actual;
  return row;
}

/** Écart = réel − prévu (positif = dépassement). */
export function costVariance(c: Pick<CostItem, 'planned' | 'actual'>): number {
  return c.actual - c.planned;
}

/* --- SWOT ------------------------------------------------------------------- */

export type SwotQuadrant = 'forces' | 'faiblesses' | 'opportunites' | 'menaces';

export const SWOT_QUADRANTS: { id: SwotQuadrant; label: string; hint: string; tone: string }[] = [
  { id: 'forces', label: 'Forces', hint: 'Atouts internes', tone: 'green' },
  { id: 'faiblesses', label: 'Faiblesses', hint: 'Limites internes', tone: 'red' },
  { id: 'opportunites', label: 'Opportunités', hint: 'Leviers externes', tone: 'accent' },
  { id: 'menaces', label: 'Menaces', hint: 'Risques externes', tone: 'amber' },
];

export interface SwotItem {
  id: Id;
  projectId: Id;
  quadrant: SwotQuadrant;
  text: string;
  createdAt: string;
}

export interface SwotItemRow {
  id: string;
  project_id: string;
  quadrant: SwotQuadrant;
  text: string;
  created_at: string;
}

export function swotItemFromRow(r: SwotItemRow): SwotItem {
  return { id: r.id, projectId: r.project_id, quadrant: r.quadrant, text: r.text, createdAt: r.created_at };
}

/* --- Charte A3 (fiche singleton par projet) -------------------------------- */

export interface A3Report {
  projectId: Id;
  contexte: string;
  situation: string;
  objectifs: string;
  analyse: string;
  plan: string;
  suivi: string;
}

export type A3ReportInput = Omit<A3Report, 'projectId'>;

export interface A3ReportRow {
  project_id: string;
  contexte: string;
  situation: string;
  objectifs: string;
  analyse: string;
  plan: string;
  suivi: string;
}

export function a3ReportFromRow(r: A3ReportRow): A3Report {
  return {
    projectId: r.project_id,
    contexte: r.contexte,
    situation: r.situation,
    objectifs: r.objectifs,
    analyse: r.analyse,
    plan: r.plan,
    suivi: r.suivi,
  };
}

export function a3ReportInputToRow(input: Partial<A3ReportInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const k of ['contexte', 'situation', 'objectifs', 'analyse', 'plan', 'suivi'] as const) {
    if (input[k] !== undefined) row[k] = input[k];
  }
  return row;
}
