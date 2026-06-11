import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Action, ActionStatus, AmdecEntry, Id, Member, Project, RaciRole } from '../types';
import { uid } from '../lib/id';
import { daysFromToday, todayISO } from '../lib/date';

/**
 * Store central unique : tous les modules lisent et écrivent ici.
 * Données normalisées (projects / actions / amdecs à plat) pour éviter
 * toute duplication — le planning et le dashboard sont des vues dérivées.
 */

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

export type Result = { ok: true } | { ok: false; error: string };

interface StoreState {
  projects: Project[];
  actions: Action[];
  amdecs: AmdecEntry[];
  currentProjectId: Id | null;

  // Projets
  createProject: (name: string, description?: string) => Id;
  updateProject: (id: Id, patch: Partial<Pick<Project, 'name' | 'description'>>) => void;
  deleteProject: (id: Id) => void;
  setCurrentProject: (id: Id) => void;

  // Équipe (module RACI)
  addMember: (projectId: Id, input: MemberInput) => Id;
  updateMember: (projectId: Id, memberId: Id, patch: Partial<MemberInput>) => void;
  removeMember: (projectId: Id, memberId: Id) => Result;

  // Actions
  addAction: (projectId: Id, input: ActionInput) => Id;
  updateAction: (id: Id, patch: Partial<ActionInput>) => void;
  deleteAction: (id: Id) => void;
  setActionStatus: (id: Id, status: ActionStatus) => void;
  /** Affecte un rôle RACI à un membre sur une action (null = retirer). */
  setRaciRole: (actionId: Id, memberId: Id, role: RaciRole | null) => Result;

  // AMDEC
  addAmdec: (projectId: Id, input: AmdecInput) => Id;
  updateAmdec: (id: Id, patch: Partial<AmdecInput>) => void;
  deleteAmdec: (id: Id) => void;

  seedDemoProject: () => void;
}

/** Retire un membre des champs A / C / I d'une action (jamais du R). */
function stripRaci(action: Action, memberId: Id): Action {
  return {
    ...action,
    accountableId: action.accountableId === memberId ? undefined : action.accountableId,
    consultedIds: action.consultedIds.filter((id) => id !== memberId),
    informedIds: action.informedIds.filter((id) => id !== memberId),
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      projects: [],
      actions: [],
      amdecs: [],
      currentProjectId: null,

      createProject: (name, description) => {
        const id = uid();
        const project: Project = { id, name, description, members: [], createdAt: todayISO() };
        set((s) => ({ projects: [...s.projects, project], currentProjectId: id }));
        return id;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProject: (id) =>
        set((s) => {
          const projects = s.projects.filter((p) => p.id !== id);
          return {
            projects,
            // Cascade : un projet emporte ses actions et ses analyses AMDEC.
            actions: s.actions.filter((a) => a.projectId !== id),
            amdecs: s.amdecs.filter((a) => a.projectId !== id),
            currentProjectId:
              s.currentProjectId === id ? (projects[0]?.id ?? null) : s.currentProjectId,
          };
        }),

      setCurrentProject: (id) => set({ currentProjectId: id }),

      addMember: (projectId, input) => {
        const id = uid();
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, members: [...p.members, { id, ...input }] } : p,
          ),
        }));
        return id;
      },

      updateMember: (projectId, memberId, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  members: p.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
                }
              : p,
          ),
        })),

      removeMember: (projectId, memberId) => {
        // Règle RACI : une action a toujours un Responsible. On bloque la
        // suppression d'un membre encore responsable d'au moins une action.
        const responsibleOf = get().actions.filter(
          (a) => a.projectId === projectId && a.responsibleId === memberId,
        );
        if (responsibleOf.length > 0) {
          return {
            ok: false,
            error: `Ce membre est Responsible de ${responsibleOf.length} action(s). Réassignez-les avant de le retirer de l'équipe.`,
          };
        }
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, members: p.members.filter((m) => m.id !== memberId) }
              : p,
          ),
          actions: s.actions.map((a) => (a.projectId === projectId ? stripRaci(a, memberId) : a)),
        }));
        return { ok: true };
      },

      addAction: (projectId, input) => {
        const id = uid();
        const action: Action = { id, projectId, createdAt: todayISO(), ...input };
        set((s) => ({ actions: [...s.actions, action] }));
        return id;
      },

      updateAction: (id, patch) =>
        set((s) => ({
          actions: s.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteAction: (id) => set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),

      setActionStatus: (id, status) =>
        set((s) => ({
          actions: s.actions.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      setRaciRole: (actionId, memberId, role) => {
        const action = get().actions.find((a) => a.id === actionId);
        if (!action) return { ok: false, error: 'Action introuvable.' };

        if (action.responsibleId === memberId && role !== 'R') {
          return {
            ok: false,
            error:
              'Une action doit toujours avoir un Responsible. Attribuez d’abord le rôle R à un autre membre.',
          };
        }

        set((s) => ({
          actions: s.actions.map((a) => {
            if (a.id !== actionId) return a;
            // On repart d'une action où le membre n'a plus aucun rôle A/C/I…
            let next = stripRaci(a, memberId);
            // …puis on applique le nouveau rôle demandé.
            if (role === 'R') {
              next = { ...next, responsibleId: memberId };
            } else if (role === 'A') {
              // Au plus un Accountable : remplace l'éventuel précédent.
              next = { ...next, accountableId: memberId };
            } else if (role === 'C') {
              next = { ...next, consultedIds: [...next.consultedIds, memberId] };
            } else if (role === 'I') {
              next = { ...next, informedIds: [...next.informedIds, memberId] };
            }
            return next;
          }),
        }));
        return { ok: true };
      },

      addAmdec: (projectId, input) => {
        const id = uid();
        const entry: AmdecEntry = { id, projectId, createdAt: todayISO(), ...input };
        set((s) => ({ amdecs: [...s.amdecs, entry] }));
        return id;
      },

      updateAmdec: (id, patch) =>
        set((s) => ({
          amdecs: s.amdecs.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteAmdec: (id) =>
        set((s) => ({
          amdecs: s.amdecs.filter((a) => a.id !== id),
          // Les actions issues de cette AMDEC restent : on coupe juste le lien.
          actions: s.actions.map((a) => (a.amdecId === id ? { ...a, amdecId: undefined } : a)),
        })),

      seedDemoProject: () => seedDemo(set as SetState),
    }),
    {
      name: 'project-ops-hub',
      version: 1,
      // v0 → v1 : la cotation AMDEC passe de 1–10 à 1–4. On recote les
      // données existantes : 1-2 → 1, 3-5 → 2, 6-7 → 3, 8-10 → 4.
      migrate: (persisted, version) => {
        const state = persisted as Partial<StoreState>;
        if (version < 1 && state.amdecs) {
          const rescale = (v: number) => Math.min(4, Math.max(1, Math.ceil(v / 2.5)));
          state.amdecs = state.amdecs.map((a) => ({
            ...a,
            severity: rescale(a.severity),
            occurrence: rescale(a.occurrence),
            detection: rescale(a.detection),
          }));
        }
        return state as StoreState;
      },
    },
  ),
);

type SetState = (fn: (s: StoreState) => Partial<StoreState>) => void;

/** Projet de démonstration : permet de découvrir les 4 modules déjà reliés. */
function seedDemo(set: SetState) {
  const projectId = uid();
  const claire: Member = { id: uid(), name: 'Claire Dubois', role: 'Chef de projet' };
  const marc: Member = { id: uid(), name: 'Marc Lefèvre', role: 'Responsable maintenance' };
  const sonia: Member = { id: uid(), name: 'Sonia Benali', role: 'Ingénieure qualité' };
  const thomas: Member = { id: uid(), name: 'Thomas Royer', role: 'Méthodes / industrialisation' };

  const project: Project = {
    id: projectId,
    name: "Ligne d'assemblage A3",
    description: 'Fiabilisation de la ligne A3 avant montée en cadence.',
    members: [claire, marc, sonia, thomas],
    createdAt: todayISO(),
  };

  const amdec1: AmdecEntry = {
    id: uid(),
    projectId,
    element: 'Convoyeur principal',
    failureMode: 'Arrêt inopiné du convoyeur',
    cause: 'Usure prématurée des roulements',
    effect: 'Arrêt complet de la ligne, perte de production',
    severity: 4,
    occurrence: 3,
    detection: 3,
    createdAt: todayISO(),
  };
  const amdec2: AmdecEntry = {
    id: uid(),
    projectId,
    element: 'Poste de vissage',
    failureMode: 'Couple de serrage hors tolérance',
    cause: 'Dérive de la visseuse non détectée',
    effect: 'Non-conformité produit, risque client',
    severity: 4,
    occurrence: 2,
    detection: 3,
    createdAt: todayISO(),
  };
  const amdec3: AmdecEntry = {
    id: uid(),
    projectId,
    element: 'Approvisionnement bord de ligne',
    failureMode: 'Rupture de composants',
    cause: 'Seuil de réapprovisionnement mal calibré',
    effect: 'Micro-arrêts répétés',
    severity: 2,
    occurrence: 3,
    detection: 2,
    createdAt: todayISO(),
  };

  const mkAction = (a: Omit<Action, 'id' | 'projectId' | 'createdAt'>): Action => ({
    id: uid(),
    projectId,
    createdAt: todayISO(),
    ...a,
  });

  const actions: Action[] = [
    mkAction({
      title: 'Plan de maintenance préventive des roulements',
      description: 'Définir la gamme et la fréquence de remplacement des roulements du convoyeur.',
      responsibleId: marc.id,
      accountableId: claire.id,
      consultedIds: [thomas.id],
      informedIds: [sonia.id],
      status: 'in_progress',
      startDate: daysFromToday(-10),
      dueDate: daysFromToday(5),
      amdecId: amdec1.id,
    }),
    mkAction({
      title: 'Étalonnage hebdomadaire des visseuses',
      description: 'Mettre en place un contrôle de couple hebdomadaire avec enregistrement.',
      responsibleId: sonia.id,
      accountableId: claire.id,
      consultedIds: [marc.id],
      informedIds: [],
      status: 'todo',
      dueDate: daysFromToday(12),
      amdecId: amdec2.id,
    }),
    mkAction({
      title: 'Recalculer les seuils de réapprovisionnement',
      description: 'Analyser les consommations réelles et ajuster les seuils kanban.',
      responsibleId: thomas.id,
      consultedIds: [],
      informedIds: [claire.id],
      status: 'todo',
      dueDate: daysFromToday(-2),
      amdecId: amdec3.id,
    }),
    mkAction({
      title: 'Former les opérateurs au poste de vissage',
      description: 'Session de formation sur les bonnes pratiques de serrage et les contrôles.',
      responsibleId: sonia.id,
      accountableId: claire.id,
      consultedIds: [],
      informedIds: [marc.id, thomas.id],
      status: 'done',
      startDate: daysFromToday(-20),
      dueDate: daysFromToday(-7),
      amdecId: amdec2.id,
    }),
    mkAction({
      title: 'Rédiger le rapport d’avancement mensuel',
      description: 'Synthèse pour le comité de pilotage : avancement, risques, jalons.',
      responsibleId: claire.id,
      consultedIds: [marc.id, sonia.id, thomas.id],
      informedIds: [],
      status: 'in_progress',
      startDate: daysFromToday(-3),
      dueDate: daysFromToday(2),
    }),
    mkAction({
      title: 'Audit 5S de la zone bord de ligne',
      description: 'Audit terrain et plan de remise à niveau du rangement bord de ligne.',
      responsibleId: marc.id,
      consultedIds: [thomas.id],
      informedIds: [claire.id],
      status: 'todo',
      dueDate: daysFromToday(20),
    }),
  ];

  set((s) => ({
    projects: [...s.projects, project],
    amdecs: [...s.amdecs, amdec1, amdec2, amdec3],
    actions: [...s.actions, ...actions],
    currentProjectId: projectId,
  }));
}

// ---------------------------------------------------------------------------
// Sélecteurs dérivés (utilisés par les vues — aucune donnée recopiée).
// ---------------------------------------------------------------------------

export function useCurrentProject(): Project | null {
  return useStore((s) => s.projects.find((p) => p.id === s.currentProjectId) ?? null);
}

export function useProjectActions(projectId: Id | undefined): Action[] {
  const actions = useStore((s) => s.actions);
  if (!projectId) return [];
  return actions.filter((a) => a.projectId === projectId);
}

export function useProjectAmdecs(projectId: Id | undefined): AmdecEntry[] {
  const amdecs = useStore((s) => s.amdecs);
  if (!projectId) return [];
  return amdecs.filter((a) => a.projectId === projectId);
}

export function memberName(project: Project | null, id: Id | undefined): string {
  if (!id || !project) return '—';
  return project.members.find((m) => m.id === id)?.name ?? 'Membre supprimé';
}
