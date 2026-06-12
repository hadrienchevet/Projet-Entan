import { create } from 'zustand';
import type { Action, ActionStatus, AmdecEntry, Id, Project, RaciRole, MemberInput, ActionInput, AmdecInput } from '../types';
import * as supabaseService from '../lib/supabaseService';

/**
 * Store central unique : tous les modules lisent et écrivent ici.
 */

export type Result = { ok: true } | { ok: false; error: string };

/** Retire un membre des champs A / C / I d'une action (jamais du R). */
function stripRaci(action: Action, memberId: Id): Action {
  return {
    ...action,
    accountableId: action.accountableId === memberId ? undefined : action.accountableId,
    consultedIds: action.consultedIds.filter((id) => id !== memberId),
    informedIds: action.informedIds.filter((id) => id !== memberId),
  };
}

interface StoreState {
  projects: Project[];
  actions: Action[];
  amdecs: AmdecEntry[];
  currentProjectId: Id | null;
  loading: boolean;

  // Initialisation
  loadProjects: () => Promise<void>;
  loadProjectData: (projectId: Id) => Promise<void>;

  // Projets
  createProject: (name: string, description?: string) => Promise<Id>;
  updateProject: (id: Id, patch: Partial<Pick<Project, 'name' | 'description'>>) => Promise<void>;
  deleteProject: (id: Id) => Promise<void>;
  setCurrentProject: (id: Id) => void;

  // Équipe (module RACI)
  addMember: (projectId: Id, input: MemberInput) => Promise<Id>;
  updateMember: (projectId: Id, memberId: Id, patch: Partial<MemberInput>) => Promise<void>;
  removeMember: (projectId: Id, memberId: Id) => Promise<Result>;

  // Actions
  addAction: (projectId: Id, input: ActionInput) => Promise<Id>;
  updateAction: (id: Id, patch: Partial<ActionInput>) => Promise<void>;
  deleteAction: (id: Id) => Promise<void>;
  setActionStatus: (id: Id, status: ActionStatus) => Promise<void>;
  /** Affecte un rôle RACI à un membre sur une action (null = retirer). */
  setRaciRole: (actionId: Id, memberId: Id, role: RaciRole | null) => Promise<Result>;

  // AMDEC
  addAmdec: (projectId: Id, input: AmdecInput) => Promise<Id>;
  updateAmdec: (id: Id, patch: Partial<AmdecInput>) => Promise<void>;
  deleteAmdec: (id: Id) => Promise<void>;

  seedDemoProject: () => Promise<void>;
}

export const useStore = create<StoreState>()((set, get) => ({
  projects: [],
  actions: [],
  amdecs: [],
  currentProjectId: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await supabaseService.fetchProjects();
      set({ projects, loading: false });

      // Auto-select first project if none selected or if current project no longer exists
      const currentId = get().currentProjectId;
      if (projects.length > 0 && (!currentId || !projects.find((p) => p.id === currentId))) {
        get().setCurrentProject(projects[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      set({ loading: false });
    }
  },

  loadProjectData: async (projectId) => {
    set({ loading: true });
    try {
      const [actions, amdecs] = await Promise.all([
        supabaseService.fetchActions(projectId),
        supabaseService.fetchAmdecs(projectId),
      ]);
      set({ actions, amdecs, loading: false });
    } catch (error) {
      console.error('Error loading project data:', error);
      set({ loading: false });
    }
  },

  createProject: async (name, description) => {
    try {
      const project = await supabaseService.createProject(name, description);
      set((s) => ({ projects: [...s.projects, project] }));
      get().setCurrentProject(project.id);
      return project.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (id, patch) => {
    try {
      await supabaseService.updateProject(id, patch);
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await supabaseService.deleteProject(id);
      set((s) => {
        const projects = s.projects.filter((p) => p.id !== id);
        const nextProjectId = s.currentProjectId === id ? (projects[0]?.id ?? null) : s.currentProjectId;
        return {
          projects,
          actions: s.actions.filter((a) => a.projectId !== id),
          amdecs: s.amdecs.filter((a) => a.projectId !== id),
          currentProjectId: nextProjectId,
        };
      });
      
      const nextId = get().currentProjectId;
      if (nextId) {
        get().loadProjectData(nextId);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  setCurrentProject: (id) => {
    set({ currentProjectId: id });
    get().loadProjectData(id);
  },

  addMember: async (projectId, input) => {
    try {
      const member = await supabaseService.addMember(projectId, input);
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === projectId ? { ...p, members: [...p.members, member] } : p,
        ),
      }));
      return member.id;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  },

  updateMember: async (projectId, memberId, patch) => {
    try {
      await supabaseService.updateMember(projectId, memberId, patch);
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                members: p.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
              }
            : p,
        ),
      }));
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  removeMember: async (projectId, memberId) => {
    try {
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

      await supabaseService.removeMember(projectId, memberId);
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === projectId
            ? { ...p, members: p.members.filter((m) => m.id !== memberId) }
            : p,
        ),
        actions: s.actions.map((a) => (a.projectId === projectId ? stripRaci(a, memberId) : a)),
      }));
      return { ok: true };
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  addAction: async (projectId, input) => {
    try {
      const action = await supabaseService.addAction(projectId, input);
      set((s) => ({ actions: [...s.actions, action] }));
      return action.id;
    } catch (error) {
      console.error('Error adding action:', error);
      throw error;
    }
  },

  updateAction: async (id, patch) => {
    try {
      await supabaseService.updateAction(id, patch);
      set((s) => ({
        actions: s.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
    } catch (error) {
      console.error('Error updating action:', error);
      throw error;
    }
  },

  deleteAction: async (id) => {
    try {
      await supabaseService.deleteAction(id);
      set((s) => ({ actions: s.actions.filter((a) => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting action:', error);
      throw error;
    }
  },

  setActionStatus: async (id, status) => {
    try {
      await supabaseService.setActionStatus(id, status);
      set((s) => ({
        actions: s.actions.map((a) => (a.id === id ? { ...a, status } : a)),
      }));
    } catch (error) {
      console.error('Error setting action status:', error);
      throw error;
    }
  },

  setRaciRole: async (actionId, memberId, role) => {
    try {
      const action = get().actions.find((a) => a.id === actionId);
      if (!action) return { ok: false, error: 'Action introuvable.' };

      if (action.responsibleId === memberId && role !== 'R') {
        return {
          ok: false,
          error:
            "Une action doit toujours avoir un Responsible. Attribuez d'abord le rôle R à un autre membre.",
        };
      }

      await supabaseService.setRaciRole(actionId, memberId, role);

      set((s) => ({
        actions: s.actions.map((a) => {
          if (a.id !== actionId) return a;
          let next = stripRaci(a, memberId);
          if (role === 'R') {
            next = { ...next, responsibleId: memberId };
          } else if (role === 'A') {
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
    } catch (error) {
      console.error('Error setting RACI role:', error);
      throw error;
    }
  },

  addAmdec: async (projectId, input) => {
    try {
      const amdec = await supabaseService.addAmdec(projectId, input);
      set((s) => ({ amdecs: [...s.amdecs, amdec] }));
      return amdec.id;
    } catch (error) {
      console.error('Error adding AMDEC:', error);
      throw error;
    }
  },

  updateAmdec: async (id, patch) => {
    try {
      await supabaseService.updateAmdec(id, patch);
      set((s) => ({
        amdecs: s.amdecs.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
    } catch (error) {
      console.error('Error updating AMDEC:', error);
      throw error;
    }
  },

  deleteAmdec: async (id) => {
    try {
      await supabaseService.deleteAmdec(id);
      set((s) => ({
        amdecs: s.amdecs.filter((a) => a.id !== id),
        actions: s.actions.map((a) => (a.amdecId === id ? { ...a, amdecId: undefined } : a)),
      }));
    } catch (error) {
      console.error('Error deleting AMDEC:', error);
      throw error;
    }
  },

  seedDemoProject: async () => {
    // Demo seeding not implemented for Supabase version
    console.warn('Demo seeding not available in Supabase mode');
  },
}));

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
