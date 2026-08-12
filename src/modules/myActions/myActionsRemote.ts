/**
 * Requête cross-projets pour « Mes actions » : les actions dont l'utilisateur
 * courant est responsable, tous projets confondus. Volontairement en dehors du
 * cycle `fetchProjectData` du store (mono-projet) — même pattern que
 * `academyRemote.ts` : fetch autonome à l'appel, RLS fait le filtrage d'accès.
 */

import { createClient } from '@/lib/supabase/client';
import type { ActionStatus, Id } from '@/lib/types';

export interface MyAction {
  id: Id;
  projectId: Id;
  projectName: string;
  title: string;
  status: ActionStatus;
  dueDate?: string;
  startDate?: string;
}

export async function fetchMyActions(): Promise<MyAction[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberRows, error: mErr } = await supabase
    .from('members')
    .select('id, project_id')
    .eq('user_id', user.id);
  if (mErr) {
    console.warn('myActions (members) fetch:', mErr.message);
    return [];
  }
  if (!memberRows?.length) return [];

  const memberIds = memberRows.map((m) => m.id);
  const projectIds = [...new Set(memberRows.map((m) => m.project_id))];

  const { data: actionRows, error: aErr } = await supabase
    .from('actions')
    .select('id, project_id, title, status, due_date, start_date')
    .in('responsible_id', memberIds);
  if (aErr) {
    console.warn('myActions (actions) fetch:', aErr.message);
    return [];
  }

  const { data: projectRows, error: pErr } = await supabase
    .from('projects')
    .select('id, name')
    .in('id', projectIds);
  if (pErr) console.warn('myActions (projects) fetch:', pErr.message);
  const nameById = new Map((projectRows ?? []).map((p) => [p.id as string, p.name as string]));

  return (actionRows ?? []).map((r) => ({
    id: r.id as string,
    projectId: r.project_id as string,
    projectName: nameById.get(r.project_id as string) ?? '',
    title: r.title as string,
    status: r.status as ActionStatus,
    dueDate: (r.due_date as string | null) ?? undefined,
    startDate: (r.start_date as string | null) ?? undefined,
  }));
}
