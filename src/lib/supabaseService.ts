import { supabase } from './supabase';
import type { Project, Action, AmdecEntry, Member, ActionInput, AmdecInput, MemberInput } from '../types';

// Projects
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      members (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(p => ({
    ...p,
    createdAt: p.created_at,
  }));
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    createdAt: data.created_at,
    members: [],
  };
}

export async function updateProject(id: string, patch: Partial<Pick<Project, 'name' | 'description'>>): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Members
export async function addMember(projectId: string, input: MemberInput): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert([{ project_id: projectId, ...input }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMember(projectId: string, memberId: string, patch: Partial<MemberInput>): Promise<void> {
  const { error } = await supabase
    .from('members')
    .update(patch)
    .eq('id', memberId)
    .eq('project_id', projectId);

  if (error) throw error;
}

export async function removeMember(projectId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId)
    .eq('project_id', projectId);

  if (error) throw error;
}

// Actions
export async function fetchActions(projectId: string): Promise<Action[]> {
  const { data, error } = await supabase
    .from('actions')
    .select(`
      *,
      consulted:action_consulted(member_id),
      informed:action_informed(member_id)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform the data to match the expected format
  return (data || []).map(action => ({
    ...action,
    projectId: action.project_id,
    responsibleId: action.responsible_id,
    accountableId: action.accountable_id,
    startDate: action.start_date,
    dueDate: action.due_date,
    amdecId: action.amdec_id,
    createdAt: action.created_at,
    consultedIds: action.consulted?.map((c: any) => c.member_id) || [],
    informedIds: action.informed?.map((i: any) => i.member_id) || [],
    consulted: undefined,
    informed: undefined,
  })) as Action[];
}

export async function addAction(projectId: string, input: ActionInput): Promise<Action> {
  const { data: action, error: actionError } = await supabase
    .from('actions')
    .insert([{
      project_id: projectId,
      title: input.title,
      description: input.description,
      responsible_id: input.responsibleId,
      accountable_id: input.accountableId,
      status: input.status,
      start_date: input.startDate,
      due_date: input.dueDate,
      amdec_id: input.amdecId,
    }])
    .select()
    .single();

  if (actionError) throw actionError;

  // Add consulted members
  if (input.consultedIds.length > 0) {
    const consultedData = input.consultedIds.map((memberId: string) => ({
      action_id: action.id,
      member_id: memberId,
    }));
    await supabase.from('action_consulted').insert(consultedData);
  }

  // Add informed members
  if (input.informedIds.length > 0) {
    const informedData = input.informedIds.map((memberId: string) => ({
      action_id: action.id,
      member_id: memberId,
    }));
    await supabase.from('action_informed').insert(informedData);
  }

  return {
    ...action,
    projectId: action.project_id,
    responsibleId: action.responsible_id,
    accountableId: action.accountable_id,
    startDate: action.start_date,
    dueDate: action.due_date,
    amdecId: action.amdec_id,
    createdAt: action.created_at,
    consultedIds: input.consultedIds,
    informedIds: input.informedIds,
  } as Action;
}

export async function updateAction(id: string, patch: Partial<ActionInput>): Promise<void> {
  const updateData: any = {};
  if (patch.title !== undefined) updateData.title = patch.title;
  if (patch.description !== undefined) updateData.description = patch.description;
  if (patch.responsibleId !== undefined) updateData.responsible_id = patch.responsibleId;
  if (patch.accountableId !== undefined) updateData.accountable_id = patch.accountableId;
  if (patch.status !== undefined) updateData.status = patch.status;
  if (patch.startDate !== undefined) updateData.start_date = patch.startDate;
  if (patch.dueDate !== undefined) updateData.due_date = patch.dueDate;
  if (patch.amdecId !== undefined) updateData.amdec_id = patch.amdecId;

  const { error } = await supabase
    .from('actions')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;

  // Update consulted members if provided
  if (patch.consultedIds !== undefined) {
    await supabase.from('action_consulted').delete().eq('action_id', id);
    if (patch.consultedIds.length > 0) {
      const consultedData = patch.consultedIds.map(memberId => ({
        action_id: id,
        member_id: memberId,
      }));
      await supabase.from('action_consulted').insert(consultedData);
    }
  }

  // Update informed members if provided
  if (patch.informedIds !== undefined) {
    await supabase.from('action_informed').delete().eq('action_id', id);
    if (patch.informedIds.length > 0) {
      const informedData = patch.informedIds.map(memberId => ({
        action_id: id,
        member_id: memberId,
      }));
      await supabase.from('action_informed').insert(informedData);
    }
  }
}

export async function deleteAction(id: string): Promise<void> {
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function setActionStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('actions')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function setRaciRole(actionId: string, memberId: string, role: string | null): Promise<void> {
  if (role === 'R') {
    const { error } = await supabase
      .from('actions')
      .update({ responsible_id: memberId })
      .eq('id', actionId);
    if (error) throw error;
  } else if (role === 'A') {
    const { error } = await supabase
      .from('actions')
      .update({ accountable_id: memberId })
      .eq('id', actionId);
    if (error) throw error;
  } else if (role === 'C') {
    const { error } = await supabase
      .from('action_consulted')
      .insert([{ action_id: actionId, member_id: memberId }]);
    if (error) throw error;
  } else if (role === 'I') {
    const { error } = await supabase
      .from('action_informed')
      .insert([{ action_id: actionId, member_id: memberId }]);
    if (error) throw error;
  } else if (role === null) {
    // Remove from all RACI roles
    await supabase.from('action_consulted').delete().eq('action_id', actionId).eq('member_id', memberId);
    await supabase.from('action_informed').delete().eq('action_id', actionId).eq('member_id', memberId);
  }
}

// AMDEC
export async function fetchAmdecs(projectId: string): Promise<AmdecEntry[]> {
  const { data, error } = await supabase
    .from('amdecs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(a => ({
    ...a,
    projectId: a.project_id,
    failureMode: a.failure_mode,
    createdAt: a.created_at,
  }));
}

export async function addAmdec(projectId: string, input: AmdecInput): Promise<AmdecEntry> {
  const { data, error } = await supabase
    .from('amdecs')
    .insert([{
      project_id: projectId,
      element: input.element,
      failure_mode: input.failureMode,
      cause: input.cause,
      effect: input.effect,
      severity: input.severity,
      occurrence: input.occurrence,
      detection: input.detection,
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    projectId: data.project_id,
    failureMode: data.failure_mode,
    createdAt: data.created_at,
  } as AmdecEntry;
}

export async function updateAmdec(id: string, patch: Partial<AmdecInput>): Promise<void> {
  const updateData: any = {};
  if (patch.element !== undefined) updateData.element = patch.element;
  if (patch.failureMode !== undefined) updateData.failure_mode = patch.failureMode;
  if (patch.cause !== undefined) updateData.cause = patch.cause;
  if (patch.effect !== undefined) updateData.effect = patch.effect;
  if (patch.severity !== undefined) updateData.severity = patch.severity;
  if (patch.occurrence !== undefined) updateData.occurrence = patch.occurrence;
  if (patch.detection !== undefined) updateData.detection = patch.detection;

  const { error } = await supabase
    .from('amdecs')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAmdec(id: string): Promise<void> {
  const { error } = await supabase
    .from('amdecs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
