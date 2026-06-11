'use client';

/**
 * Store central de Pilotix — même API que le store Zustand de la V1, mais
 * persisté dans Supabase et synchronisé en temps réel entre les membres.
 *
 * - Les lectures viennent d'un état local (chargé par projet) : les pages
 *   sont identiques à la V1, elles ne savent pas que Supabase existe.
 * - Les écritures sont optimistes : état local mis à jour immédiatement,
 *   écriture Supabase derrière (RLS), refetch en cas d'erreur.
 * - Supabase Realtime re-charge les données du projet quand un AUTRE membre
 *   modifie quelque chose (le canal porte le jeton de session : sans lui,
 *   la RLS filtrerait tous les événements).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { daysFromToday } from '@/lib/date';
import type {
  Action,
  ActionInput,
  ActionRow,
  AmdecEntry,
  AmdecInput,
  AmdecRow,
  CapaAction,
  CapaActionInput,
  CapaActionRow,
  FiveWhyAnalysis,
  FiveWhyAnalysisInput,
  FiveWhyAnalysisRow,
  FiveWhyLevel,
  FiveWhyLevelInput,
  FiveWhyLevelRow,
  Id,
  Invitation,
  IshikawaAnalysis,
  IshikawaAnalysisInput,
  IshikawaAnalysisRow,
  IshikawaCause,
  IshikawaCauseInput,
  IshikawaCauseRow,
  Member,
  MemberInput,
  MemberRow,
  Project,
  ProjectType,
  ActionStatus,
  RaciRole,
  ProjectMember,
  ProjectMeta as ProjectMetaType,
} from '@/lib/types';
import {
  actionFromRow,
  actionInputToRow,
  amdecFromRow,
  amdecInputToRow,
  capaActionFromRow,
  fiveWhyAnalysisFromRow,
  fiveWhyLevelFromRow,
  ishikawaAnalysisFromRow,
  ishikawaCauseFromRow,
  memberFromRow,
  projectMemberFromRow,
} from '@/lib/types';

export type Result = { ok: true } | { ok: false; error: string };

interface ProjectMeta {
  id: Id;
  name: string;
  description?: string;
  ownerId: string;
  projectType: ProjectType;
  project_members?: ProjectMember[];
  createdAt: string;
}

interface WorkspaceState {
  loading: boolean;
  userEmail: string | null;
  metas: ProjectMeta[];
  projects: Project[];
  members: Member[];
  currentProjectId: Id | null;
  actions: Action[];
  amdecs: AmdecEntry[];
  invitations: Invitation[];
  fiveWhyAnalyses: FiveWhyAnalysis[];
  ishikawaAnalyses: IshikawaAnalysis[];
  capaActions: CapaAction[];

  setCurrentProject: (id: Id) => void;
  createProject: (name: string, description?: string, projectType?: ProjectType) => Promise<void>;
  updateProject: (id: Id, patch: { name?: string; description?: string }) => Promise<void>;
  seedDemoProject: () => Promise<void>;

  addMember: (projectId: Id, input: MemberInput) => Promise<void>;
  updateMember: (projectId: Id, memberId: Id, patch: Partial<MemberInput>) => Promise<void>;
  removeMember: (projectId: Id, memberId: Id) => Result;
  removeProjectMember: (projectId: Id, userId: string) => Promise<void>;

  addAction: (projectId: Id, input: ActionInput) => Promise<void>;
  updateAction: (id: Id, patch: Partial<ActionInput>) => Promise<void>;
  deleteAction: (id: Id) => Promise<void>;
  setActionStatus: (id: Id, status: ActionStatus) => Promise<void>;
  setRaciRole: (actionId: Id, memberId: Id, role: RaciRole | null) => Result;

  addAmdec: (projectId: Id, input: AmdecInput) => Promise<void>;
  updateAmdec: (id: Id, patch: Partial<AmdecInput>) => Promise<void>;
  deleteAmdec: (id: Id) => Promise<void>;

  createInvitation: (projectId: Id) => Promise<void>;
  revokeInvitation: (id: Id) => Promise<void>;

  addFiveWhyAnalysis: (projectId: Id, input: FiveWhyAnalysisInput) => Promise<void>;
  updateFiveWhyAnalysis: (id: Id, patch: Partial<FiveWhyAnalysisInput>) => Promise<void>;
  deleteFiveWhyAnalysis: (id: Id) => Promise<void>;
  addFiveWhyLevel: (analysisId: Id, projectId: Id) => Promise<void>;
  updateFiveWhyLevel: (levelId: Id, analysisId: Id, patch: Partial<FiveWhyLevelInput>) => Promise<void>;
  deleteFiveWhyLevel: (levelId: Id, analysisId: Id, projectId: Id) => Promise<void>;

  addIshikawaAnalysis: (projectId: Id, input: IshikawaAnalysisInput) => Promise<void>;
  updateIshikawaAnalysis: (id: Id, patch: Partial<IshikawaAnalysisInput>) => Promise<void>;
  deleteIshikawaAnalysis: (id: Id) => Promise<void>;
  addIshikawaCause: (analysisId: Id, projectId: Id, input: IshikawaCauseInput) => Promise<void>;
  deleteIshikawaCause: (causeId: Id, analysisId: Id) => Promise<void>;

  addCapaAction: (projectId: Id, input: CapaActionInput) => Promise<void>;
  updateCapaAction: (id: Id, patch: Partial<CapaActionInput>) => Promise<void>;
  deleteCapaAction: (id: Id) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

const CURRENT_KEY = 'pilotix-current-project';

/** Retire un membre des champs A / C / I d'une action (jamais du R). */
function stripRaci(action: Action, memberId: Id): Action {
  return {
    ...action,
    accountableId: action.accountableId === memberId ? undefined : action.accountableId,
    consultedIds: action.consultedIds.filter((id) => id !== memberId),
    informedIds: action.informedIds.filter((id) => id !== memberId),
  };
}

function uid(): Id {
  return crypto.randomUUID();
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo<SupabaseClient>(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [metas, setMetas] = useState<ProjectMeta[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [amdecs, setAmdecs] = useState<AmdecEntry[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [fiveWhyAnalyses, setFiveWhyAnalyses] = useState<FiveWhyAnalysis[]>([]);
  const [ishikawaAnalyses, setIshikawaAnalyses] = useState<IshikawaAnalysis[]>([]);
  const [capaActions, setCapaActions] = useState<CapaAction[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<Id | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const onError = (context: string, message: string) => {
    console.error(`[pilotix] ${context}:`, message);
    window.alert(`${context} : ${message}`);
  };

  /* --- Chargement -------------------------------------------------------- */

  const fetchProjects = useCallback(async (): Promise<ProjectMeta[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, project_type, created_at, owner_id, project_members(project_id, user_id, role, joined_at, profiles(id, email, display_name))')
      .order('created_at');
    if (error) {
      console.error('[pilotix] fetchProjects:', error.message);
      return [];
    }
    const list = (data ?? []).map((r: any) => ({
      id: r.id as Id,
      name: r.name as string,
      description: (r.description as string | null) ?? undefined,
      createdAt: r.created_at as string,
      ownerId: r.owner_id as string,
      projectType: (r.project_type as ProjectType) ?? 'gestion',
      project_members: (r.project_members || []).map(projectMemberFromRow),
    }));
    setMetas(list);
    return list;
  }, [supabase]);

  const fetchProjectData = useCallback(
    async (projectId: Id) => {
      const [m, a, z, inv, fwa, isha, capa] = await Promise.all([
        supabase.from('members').select('*').eq('project_id', projectId).order('created_at'),
        supabase.from('actions').select('*').eq('project_id', projectId).order('created_at'),
        supabase.from('amdec_items').select('*').eq('project_id', projectId).order('created_at'),
        supabase
          .from('invitations')
          .select('id, token, expires_at')
          .eq('project_id', projectId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('five_why_analyses')
          .select('*, five_why_levels(*)')
          .eq('project_id', projectId)
          .order('created_at'),
        supabase
          .from('ishikawa_analyses')
          .select('*, ishikawa_causes(*)')
          .eq('project_id', projectId)
          .order('created_at'),
        supabase.from('capa_actions').select('*').eq('project_id', projectId).order('created_at'),
      ]);
      setMembers(((m.data ?? []) as MemberRow[]).map(memberFromRow));
      setActions(((a.data ?? []) as ActionRow[]).map(actionFromRow));
      setAmdecs(((z.data ?? []) as AmdecRow[]).map(amdecFromRow));
      setInvitations(
        (inv.data ?? []).map((r) => ({
          id: r.id as Id,
          token: r.token as string,
          expiresAt: r.expires_at as string,
        })),
      );
      if (!fwa.error) setFiveWhyAnalyses(((fwa.data ?? []) as FiveWhyAnalysisRow[]).map(fiveWhyAnalysisFromRow));
      if (!isha.error) setIshikawaAnalyses(((isha.data ?? []) as IshikawaAnalysisRow[]).map(ishikawaAnalysisFromRow));
      if (!capa.error) setCapaActions(((capa.data ?? []) as CapaActionRow[]).map(capaActionFromRow));
    },
    [supabase],
  );

  // Démarrage : session, projets, projet courant (?project= > localStorage > premier).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setUserEmail(session?.user.email ?? null);

      const list = await fetchProjects();
      if (cancelled) return;

      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get('project');
      if (fromUrl) {
        url.searchParams.delete('project');
        window.history.replaceState(null, '', url.pathname + url.search);
      }
      const stored = localStorage.getItem(CURRENT_KEY);
      const initial =
        (fromUrl && list.some((p) => p.id === fromUrl) && fromUrl) ||
        (stored && list.some((p) => p.id === stored) && stored) ||
        list[0]?.id ||
        null;

      if (initial) {
        setCurrentProjectId(initial);
        await fetchProjectData(initial);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, fetchProjects, fetchProjectData]);

  // Realtime : recharge les données du projet courant à chaque changement
  // fait par un autre membre (ou soi-même — refetch idempotent).
  useEffect(() => {
    if (!currentProjectId) return;
    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      await supabase.realtime.setAuth(session.access_token);

      const filter = `project_id=eq.${currentProjectId}`;
      let ch = supabase.channel(`project-${currentProjectId}`);
      for (const table of ['members', 'actions', 'amdec_items', 'five_why_analyses', 'five_why_levels', 'ishikawa_analyses', 'ishikawa_causes', 'capa_actions']) {
        ch = ch.on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter },
          () => fetchProjectData(currentProjectId),
        );
      }
      channelRef.current = ch.subscribe();
    })();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, currentProjectId, fetchProjectData]);

  /* --- Projets ------------------------------------------------------------ */

  const setCurrentProject = useCallback(
    (id: Id) => {
      setCurrentProjectId(id);
      localStorage.setItem(CURRENT_KEY, id);
      setMembers([]);
      setActions([]);
      setAmdecs([]);
      setInvitations([]);
      setFiveWhyAnalyses([]);
      setIshikawaAnalyses([]);
      setCapaActions([]);
      void fetchProjectData(id);
    },
    [fetchProjectData],
  );

  const createProject = useCallback(
    async (name: string, description?: string, projectType: ProjectType = 'gestion') => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, description: description ?? null, owner_id: user.id, project_type: projectType })
        .select('id')
        .single();
      if (error) return onError('Création du projet impossible', error.message);
      await fetchProjects();
      setCurrentProject(data.id as Id);
    },
    [supabase, fetchProjects, setCurrentProject],
  );

  const updateProject = useCallback(
    async (id: Id, patch: { name?: string; description?: string }) => {
      setMetas((s) => s.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      const { error } = await supabase
        .from('projects')
        .update({ name: patch.name, description: patch.description ?? null })
        .eq('id', id);
      if (error) {
        onError('Modification du projet impossible', error.message);
        await fetchProjects();
      }
    },
    [supabase, fetchProjects],
  );

  /* --- Équipe -------------------------------------------------------------- */

  const addMember = useCallback(
    async (projectId: Id, input: MemberInput) => {
      const id = uid();
      setMembers((s) => [...s, { id, name: input.name, role: input.role, userId: input.userId }]);
      const { error } = await supabase
        .from('members')
        .insert({
          id,
          project_id: projectId,
          name: input.name,
          job_role: input.role,
          user_id: input.userId || null,
        });
      if (error) {
        onError('Ajout du membre impossible', error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const updateMember = useCallback(
    async (projectId: Id, memberId: Id, patch: Partial<MemberInput>) => {
      setMembers((s) => s.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.role !== undefined) row.job_role = patch.role;
      const { error } = await supabase.from('members').update(row).eq('id', memberId);
      if (error) {
        onError('Modification du membre impossible', error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const removeMember = useCallback(
    (projectId: Id, memberId: Id): Result => {
      // Règle RACI (V1) : une action a toujours un Responsible — on bloque la
      // suppression d'un membre encore responsable (garanti aussi par la FK).
      const responsibleOf = actions.filter(
        (a) => a.projectId === projectId && a.responsibleId === memberId,
      );
      if (responsibleOf.length > 0) {
        return {
          ok: false,
          error: `Ce membre est Responsible de ${responsibleOf.length} action(s). Réassignez-les avant de le retirer de l'équipe.`,
        };
      }

      const member = members.find((m) => m.id === memberId);
      const touched = actions.filter(
        (a) =>
          a.projectId === projectId &&
          (a.accountableId === memberId ||
            a.consultedIds.includes(memberId) ||
            a.informedIds.includes(memberId)),
      );

      setMembers((s) => s.filter((m) => m.id !== memberId));
      setActions((s) => s.map((a) => (a.projectId === projectId ? stripRaci(a, memberId) : a)));

      void (async () => {
        // Retire le membre des rôles A / C / I des actions concernées.
        for (const a of touched) {
          const next = stripRaci(a, memberId);
          await supabase
            .from('actions')
            .update({
              accountable_id: next.accountableId ?? null,
              consulted_ids: next.consultedIds,
              informed_ids: next.informedIds,
            })
            .eq('id', a.id);
        }
        const { error } = await supabase.from('members').delete().eq('id', memberId);
        if (error) {
          onError('Retrait du membre impossible', error.message);
          await fetchProjectData(projectId);
          return;
        }
        if (member?.userId) {
          // On ne retire plus l'accès d'office : on délie juste le membre RACI.
          // Le membre garde son accès au projet jusqu'à retrait via l'onglet "Accès".
        }
      })();

      return { ok: true };
    },
    [supabase, actions, members, fetchProjectData],
  );

  const removeProjectMember = useCallback(
    async (projectId: Id, userId: string) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        onError("Erreur lors de la suppression de l'accès", error.message);
      } else {
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  /* --- Actions -------------------------------------------------------------- */

  const addAction = useCallback(
    async (projectId: Id, input: ActionInput) => {
      const id = uid();
      const createdAt = new Date().toISOString();
      setActions((s) => [...s, { id, projectId, createdAt, ...input }]);
      const { error } = await supabase
        .from('actions')
        .insert({ id, project_id: projectId, ...actionInputToRow(input) });
      if (error) {
        onError("Création de l'action impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const updateAction = useCallback(
    async (id: Id, patch: Partial<ActionInput>) => {
      setActions((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      const { error } = await supabase.from('actions').update(actionInputToRow(patch)).eq('id', id);
      if (error) {
        onError("Modification de l'action impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const deleteAction = useCallback(
    async (id: Id) => {
      setActions((s) => s.filter((a) => a.id !== id));
      const { error } = await supabase.from('actions').delete().eq('id', id);
      if (error) {
        onError("Suppression de l'action impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const setActionStatus = useCallback(
    (id: Id, status: ActionStatus) => updateAction(id, { status }),
    [updateAction],
  );

  const setRaciRole = useCallback(
    (actionId: Id, memberId: Id, role: RaciRole | null): Result => {
      const action = actions.find((a) => a.id === actionId);
      if (!action) return { ok: false, error: 'Action introuvable.' };

      if (action.responsibleId === memberId && role !== 'R') {
        return {
          ok: false,
          error:
            'Une action doit toujours avoir un Responsible. Attribuez d’abord le rôle R à un autre membre.',
        };
      }

      // On repart d'une action où le membre n'a plus aucun rôle A/C/I…
      let next = stripRaci(action, memberId);
      // …puis on applique le nouveau rôle demandé.
      if (role === 'R') {
        next = { ...next, responsibleId: memberId };
      } else if (role === 'A') {
        next = { ...next, accountableId: memberId };
      } else if (role === 'C') {
        next = { ...next, consultedIds: [...next.consultedIds, memberId] };
      } else if (role === 'I') {
        next = { ...next, informedIds: [...next.informedIds, memberId] };
      }

      void updateAction(actionId, {
        responsibleId: next.responsibleId,
        accountableId: next.accountableId,
        consultedIds: next.consultedIds,
        informedIds: next.informedIds,
      });
      return { ok: true };
    },
    [actions, updateAction],
  );

  /* --- AMDEC ----------------------------------------------------------------- */

  const addAmdec = useCallback(
    async (projectId: Id, input: AmdecInput) => {
      const id = uid();
      const createdAt = new Date().toISOString();
      setAmdecs((s) => [...s, { id, projectId, createdAt, ...input }]);
      const { error } = await supabase
        .from('amdec_items')
        .insert({ id, project_id: projectId, ...amdecInputToRow(input) });
      if (error) {
        onError("Création de l'analyse impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const updateAmdec = useCallback(
    async (id: Id, patch: Partial<AmdecInput>) => {
      setAmdecs((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      const { error } = await supabase
        .from('amdec_items')
        .update(amdecInputToRow(patch))
        .eq('id', id);
      if (error) {
        onError("Modification de l'analyse impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const deleteAmdec = useCallback(
    async (id: Id) => {
      setAmdecs((s) => s.filter((a) => a.id !== id));
      // Les actions issues de cette AMDEC restent : la FK détache le lien en
      // base (on delete set null) ; on fait pareil dans l'état local.
      setActions((s) => s.map((a) => (a.amdecId === id ? { ...a, amdecId: undefined } : a)));
      const { error } = await supabase.from('amdec_items').delete().eq('id', id);
      if (error) {
        onError("Suppression de l'analyse impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  /* --- RDP : 5 Pourquoi ------------------------------------------------------- */

  const addFiveWhyAnalysis = useCallback(
    async (projectId: Id, input: FiveWhyAnalysisInput) => {
      const id = uid();
      const createdAt = new Date().toISOString();
      setFiveWhyAnalyses((s) => [...s, { id, projectId, ...input, levels: [], createdAt }]);
      const { error } = await supabase.from('five_why_analyses').insert({
        id,
        project_id: projectId,
        title: input.title,
        problem_statement: input.problemStatement,
        pdca_phase: input.pdcaPhase,
      });
      if (error) {
        onError("Création de l'analyse impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const updateFiveWhyAnalysis = useCallback(
    async (id: Id, patch: Partial<FiveWhyAnalysisInput>) => {
      setFiveWhyAnalyses((s) =>
        s.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.problemStatement !== undefined) row.problem_statement = patch.problemStatement;
      if (patch.pdcaPhase !== undefined) row.pdca_phase = patch.pdcaPhase;
      const { error } = await supabase.from('five_why_analyses').update(row).eq('id', id);
      if (error) {
        onError("Modification de l'analyse impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const deleteFiveWhyAnalysis = useCallback(
    async (id: Id) => {
      setFiveWhyAnalyses((s) => s.filter((a) => a.id !== id));
      const { error } = await supabase.from('five_why_analyses').delete().eq('id', id);
      if (error) {
        onError("Suppression de l'analyse impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const addFiveWhyLevel = useCallback(
    async (analysisId: Id, projectId: Id) => {
      const id = uid();
      const createdAt = new Date().toISOString();
      setFiveWhyAnalyses((s) =>
        s.map((a) => {
          if (a.id !== analysisId) return a;
          const nextNum = (a.levels[a.levels.length - 1]?.levelNum ?? 0) + 1;
          if (nextNum > 5) return a;
          const newLevel: FiveWhyLevel = {
            id, analysisId, projectId, levelNum: nextNum,
            whyQuestion: '', becauseAnswer: '', isRootCause: false, createdAt,
          };
          return { ...a, levels: [...a.levels, newLevel] };
        }),
      );
      const analysis = fiveWhyAnalyses.find((a) => a.id === analysisId);
      const nextNum = (analysis?.levels[analysis.levels.length - 1]?.levelNum ?? 0) + 1;
      if (nextNum > 5) return;
      const { error } = await supabase.from('five_why_levels').insert({
        id, analysis_id: analysisId, project_id: projectId,
        level_num: nextNum, why_question: '', because_answer: '', is_root_cause: false,
      });
      if (error) {
        onError("Ajout du niveau impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fiveWhyAnalyses, fetchProjectData],
  );

  const updateFiveWhyLevel = useCallback(
    async (levelId: Id, analysisId: Id, patch: Partial<FiveWhyLevelInput>) => {
      setFiveWhyAnalyses((s) =>
        s.map((a) => {
          if (a.id !== analysisId) return a;
          return { ...a, levels: a.levels.map((l) => (l.id === levelId ? { ...l, ...patch } : l)) };
        }),
      );
      const row: Record<string, unknown> = {};
      if (patch.whyQuestion !== undefined) row.why_question = patch.whyQuestion;
      if (patch.becauseAnswer !== undefined) row.because_answer = patch.becauseAnswer;
      if (patch.isRootCause !== undefined) row.is_root_cause = patch.isRootCause;
      const { error } = await supabase.from('five_why_levels').update(row).eq('id', levelId);
      if (error) {
        onError("Modification du niveau impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const deleteFiveWhyLevel = useCallback(
    async (levelId: Id, analysisId: Id, projectId: Id) => {
      setFiveWhyAnalyses((s) =>
        s.map((a) => {
          if (a.id !== analysisId) return a;
          const filtered = a.levels.filter((l) => l.id !== levelId);
          return { ...a, levels: filtered };
        }),
      );
      const { error } = await supabase.from('five_why_levels').delete().eq('id', levelId);
      if (error) {
        onError("Suppression du niveau impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  /* --- RDP : Ishikawa --------------------------------------------------------- */

  const addIshikawaAnalysis = useCallback(
    async (projectId: Id, input: IshikawaAnalysisInput) => {
      const id = uid();
      const createdAt = new Date().toISOString();
      setIshikawaAnalyses((s) => [...s, { id, projectId, ...input, causes: [], createdAt }]);
      const { error } = await supabase.from('ishikawa_analyses').insert({
        id, project_id: projectId, title: input.title, effect: input.effect,
      });
      if (error) {
        onError("Création de l'analyse impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const updateIshikawaAnalysis = useCallback(
    async (id: Id, patch: Partial<IshikawaAnalysisInput>) => {
      setIshikawaAnalyses((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      const { error } = await supabase.from('ishikawa_analyses').update(patch).eq('id', id);
      if (error) {
        onError("Modification de l'analyse impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const deleteIshikawaAnalysis = useCallback(
    async (id: Id) => {
      setIshikawaAnalyses((s) => s.filter((a) => a.id !== id));
      const { error } = await supabase.from('ishikawa_analyses').delete().eq('id', id);
      if (error) {
        onError("Suppression de l'analyse impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const addIshikawaCause = useCallback(
    async (analysisId: Id, projectId: Id, input: IshikawaCauseInput) => {
      const id = uid();
      const createdAt = new Date().toISOString();
      const newCause: IshikawaCause = { id, analysisId, projectId, ...input, createdAt };
      setIshikawaAnalyses((s) =>
        s.map((a) => (a.id === analysisId ? { ...a, causes: [...a.causes, newCause] } : a)),
      );
      const { error } = await supabase.from('ishikawa_causes').insert({
        id, analysis_id: analysisId, project_id: projectId,
        category: input.category, cause_text: input.causeText,
      });
      if (error) {
        onError("Ajout de la cause impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const deleteIshikawaCause = useCallback(
    async (causeId: Id, analysisId: Id) => {
      setIshikawaAnalyses((s) =>
        s.map((a) =>
          a.id === analysisId ? { ...a, causes: a.causes.filter((c) => c.id !== causeId) } : a,
        ),
      );
      const { error } = await supabase.from('ishikawa_causes').delete().eq('id', causeId);
      if (error) onError("Suppression de la cause impossible", error.message);
    },
    [supabase],
  );

  /* --- RDP : CAPA ------------------------------------------------------------- */

  const addCapaAction = useCallback(
    async (projectId: Id, input: CapaActionInput) => {
      const id = uid();
      const createdAt = new Date().toISOString();
      setCapaActions((s) => [...s, { id, projectId, createdAt, ...input }]);
      const { error } = await supabase.from('capa_actions').insert({
        id, project_id: projectId,
        type: input.type, title: input.title, description: input.description,
        responsible_id: input.responsibleId ?? null,
        status: input.status,
        due_date: input.dueDate ?? null,
        source: input.source ?? null,
      });
      if (error) {
        onError("Création de l'action CAPA impossible", error.message);
        await fetchProjectData(projectId);
      }
    },
    [supabase, fetchProjectData],
  );

  const updateCapaAction = useCallback(
    async (id: Id, patch: Partial<CapaActionInput>) => {
      setCapaActions((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      const row: Record<string, unknown> = {};
      if (patch.type !== undefined) row.type = patch.type;
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.description !== undefined) row.description = patch.description;
      if ('responsibleId' in patch) row.responsible_id = patch.responsibleId ?? null;
      if (patch.status !== undefined) row.status = patch.status;
      if ('dueDate' in patch) row.due_date = patch.dueDate ?? null;
      if ('source' in patch) row.source = patch.source ?? null;
      const { error } = await supabase.from('capa_actions').update(row).eq('id', id);
      if (error) {
        onError("Modification de l'action CAPA impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  const deleteCapaAction = useCallback(
    async (id: Id) => {
      setCapaActions((s) => s.filter((a) => a.id !== id));
      const { error } = await supabase.from('capa_actions').delete().eq('id', id);
      if (error) {
        onError("Suppression de l'action CAPA impossible", error.message);
        if (currentProjectId) await fetchProjectData(currentProjectId);
      }
    },
    [supabase, currentProjectId, fetchProjectData],
  );

  /* --- Invitations ------------------------------------------------------------ */

  const createInvitation = useCallback(
    async (projectId: Id) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('invitations')
        .insert({ project_id: projectId, created_by: user.id });
      if (error) return onError("Création de l'invitation impossible", error.message);
      await fetchProjectData(projectId);
    },
    [supabase, fetchProjectData],
  );

  const revokeInvitation = useCallback(
    async (id: Id) => {
      setInvitations((s) => s.filter((i) => i.id !== id));
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) onError("Révocation de l'invitation impossible", error.message);
    },
    [supabase],
  );

  /* --- Projet de démonstration (porté de la V1) -------------------------------- */

  const seedDemoProject = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: proj, error } = await supabase
      .from('projects')
      .insert({
        name: "Ligne d'assemblage A3",
        description: 'Fiabilisation de la ligne A3 avant montée en cadence.',
        owner_id: user.id,
      })
      .select('id')
      .single();
    if (error) return onError('Création du projet de démo impossible', error.message);
    const projectId = proj.id as Id;

    const demoMembers = [
      { id: uid(), name: 'Claire Dubois', job_role: 'Chef de projet' },
      { id: uid(), name: 'Marc Lefèvre', job_role: 'Responsable maintenance' },
      { id: uid(), name: 'Sonia Benali', job_role: 'Ingénieure qualité' },
      { id: uid(), name: 'Thomas Royer', job_role: 'Méthodes / industrialisation' },
    ];
    const [claire, marc, sonia, thomas] = demoMembers;
    await supabase
      .from('members')
      .insert(demoMembers.map((m) => ({ ...m, project_id: projectId })));

    const demoAmdecs = [
      {
        id: uid(),
        element: 'Convoyeur principal',
        failure_mode: 'Arrêt inopiné du convoyeur',
        cause: 'Usure prématurée des roulements',
        effect: 'Arrêt complet de la ligne, perte de production',
        severity: 4, occurrence: 3, detection: 3,
      },
      {
        id: uid(),
        element: 'Poste de vissage',
        failure_mode: 'Couple de serrage hors tolérance',
        cause: 'Dérive de la visseuse non détectée',
        effect: 'Non-conformité produit, risque client',
        severity: 4, occurrence: 2, detection: 3,
      },
      {
        id: uid(),
        element: 'Approvisionnement bord de ligne',
        failure_mode: 'Rupture de composants',
        cause: 'Seuil de réapprovisionnement mal calibré',
        effect: 'Micro-arrêts répétés',
        severity: 2, occurrence: 3, detection: 2,
      },
    ];
    const [amdec1, amdec2, amdec3] = demoAmdecs;
    await supabase
      .from('amdec_items')
      .insert(demoAmdecs.map((a) => ({ ...a, project_id: projectId, created_by: user.id })));

    const demoActions = [
      {
        title: 'Plan de maintenance préventive des roulements',
        description: 'Définir la gamme et la fréquence de remplacement des roulements du convoyeur.',
        responsible_id: marc.id, accountable_id: claire.id,
        consulted_ids: [thomas.id], informed_ids: [sonia.id],
        status: 'in_progress', start_date: daysFromToday(-10), due_date: daysFromToday(5),
        amdec_item_id: amdec1.id,
      },
      {
        title: 'Étalonnage hebdomadaire des visseuses',
        description: 'Mettre en place un contrôle de couple hebdomadaire avec enregistrement.',
        responsible_id: sonia.id, accountable_id: claire.id,
        consulted_ids: [marc.id], informed_ids: [],
        status: 'todo', due_date: daysFromToday(12), amdec_item_id: amdec2.id,
      },
      {
        title: 'Recalculer les seuils de réapprovisionnement',
        description: 'Analyser les consommations réelles et ajuster les seuils kanban.',
        responsible_id: thomas.id,
        consulted_ids: [], informed_ids: [claire.id],
        status: 'todo', due_date: daysFromToday(-2), amdec_item_id: amdec3.id,
      },
      {
        title: 'Former les opérateurs au poste de vissage',
        description: 'Session de formation sur les bonnes pratiques de serrage et les contrôles.',
        responsible_id: sonia.id, accountable_id: claire.id,
        consulted_ids: [], informed_ids: [marc.id, thomas.id],
        status: 'done', start_date: daysFromToday(-20), due_date: daysFromToday(-7),
        amdec_item_id: amdec2.id,
      },
      {
        title: 'Rédiger le rapport d’avancement mensuel',
        description: 'Synthèse pour le comité de pilotage : avancement, risques, jalons.',
        responsible_id: claire.id,
        consulted_ids: [marc.id, sonia.id, thomas.id], informed_ids: [],
        status: 'in_progress', start_date: daysFromToday(-3), due_date: daysFromToday(2),
      },
      {
        title: 'Audit 5S de la zone bord de ligne',
        description: 'Audit terrain et plan de remise à niveau du rangement bord de ligne.',
        responsible_id: marc.id,
        consulted_ids: [thomas.id], informed_ids: [claire.id],
        status: 'todo', due_date: daysFromToday(20),
      },
    ];
    await supabase
      .from('actions')
      .insert(demoActions.map((a) => ({ ...a, project_id: projectId })));

    await fetchProjects();
    setCurrentProject(projectId);
  }, [supabase, fetchProjects, setCurrentProject]);

  /* --- Assemblage --------------------------------------------------------------- */

  const projects = useMemo<Project[]>(
    () =>
      metas.map((p) => ({
        ...p,
        members: p.id === currentProjectId ? members : [],
      })),
    [metas, members, currentProjectId],
  );

  const value: WorkspaceState = {
    loading,
    userEmail,
    metas,
    projects,
    members,
    fiveWhyAnalyses,
    ishikawaAnalyses,
    capaActions,
    currentProjectId,
    actions,
    amdecs,
    invitations,
    setCurrentProject,
    createProject,
    updateProject,
    seedDemoProject,
    addMember,
    updateMember,
    removeMember,
    removeProjectMember,
    addAction,
    updateAction,
    deleteAction,
    setActionStatus,
    setRaciRole,
    addAmdec,
    updateAmdec,
    deleteAmdec,
    createInvitation,
    revokeInvitation,
    addFiveWhyAnalysis,
    updateFiveWhyAnalysis,
    deleteFiveWhyAnalysis,
    addFiveWhyLevel,
    updateFiveWhyLevel,
    deleteFiveWhyLevel,
    addIshikawaAnalysis,
    updateIshikawaAnalysis,
    deleteIshikawaAnalysis,
    addIshikawaCause,
    deleteIshikawaCause,
    addCapaAction,
    updateCapaAction,
    deleteCapaAction,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/* --- Hooks (mêmes noms et usages qu'en V1) -------------------------------------- */

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace doit être utilisé sous <WorkspaceProvider>.');
  return ctx;
}

export function useCurrentProject(): Project | null {
  const { metas, currentProjectId, members, invitations } = useWorkspace();
  const meta = metas.find((p) => p.id === currentProjectId);
  if (!meta) return null;

  return {
    ...meta,
    members,
    // Invitations n'est pas dans le type Project mais pourrait l'être.
    // Pour l'instant on garde la compatibilité avec l'interface Project.
  };
}

export function useProjectActions(projectId: Id | undefined): Action[] {
  const { actions } = useWorkspace();
  if (!projectId) return [];
  return actions.filter((a) => a.projectId === projectId);
}

export function useProjectAmdecs(projectId: Id | undefined): AmdecEntry[] {
  const { amdecs } = useWorkspace();
  if (!projectId) return [];
  return amdecs.filter((a) => a.projectId === projectId);
}

export function memberName(project: Project | null, id: Id | undefined): string {
  if (!id || !project) return '—';
  return project.members.find((m) => m.id === id)?.name ?? 'Membre supprimé';
}

export function useProjectFiveWhys(projectId: Id | undefined): FiveWhyAnalysis[] {
  const { fiveWhyAnalyses } = useWorkspace();
  if (!projectId) return [];
  return fiveWhyAnalyses.filter((a) => a.projectId === projectId);
}

export function useProjectIshikawa(projectId: Id | undefined): IshikawaAnalysis[] {
  const { ishikawaAnalyses } = useWorkspace();
  if (!projectId) return [];
  return ishikawaAnalyses.filter((a) => a.projectId === projectId);
}

export function useProjectCapa(projectId: Id | undefined): CapaAction[] {
  const { capaActions } = useWorkspace();
  if (!projectId) return [];
  return capaActions.filter((a) => a.projectId === projectId);
}
