'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/store';
import { STATUS_LABELS, type ActionStatus } from '@/lib/types';
import { formatDate, isOverdue } from '@/lib/date';
import { fetchMyActions, type MyAction } from './myActionsRemote';

const STATUS_ORDER: ActionStatus[] = ['todo', 'in_progress', 'done'];

function actionRank(late: boolean, status: ActionStatus): number {
  if (late) return 0; // en retard d'abord
  if (status === 'in_progress') return 1;
  if (status === 'todo') return 2;
  return 3; // terminées en dernier
}

/** Vue personnelle cross-projets : les actions dont je suis responsable, où qu'elles soient. */
export function MyActionsPage() {
  const router = useRouter();
  const { updateAction, logActivity, setCurrentProject } = useWorkspace();
  const [actions, setActions] = useState<MyAction[] | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchMyActions().then((list) => {
      if (alive) setActions(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const changeStatus = async (a: MyAction, status: ActionStatus) => {
    await updateAction(a.id, { status });
    if (status === 'done') {
      void logActivity(a.projectId, 'action_done', `a terminé l'action « ${a.title} »`);
    }
    setActions((list) => list?.map((x) => (x.id === a.id ? { ...x, status } : x)) ?? list);
  };

  const openProject = (a: MyAction) => {
    setCurrentProject(a.projectId);
    router.push('/dashboard');
  };

  const sorted = actions
    ? [...actions].sort((a, b) => {
        const rankA = actionRank(isOverdue(a.dueDate, a.status), a.status);
        const rankB = actionRank(isOverdue(b.dueDate, b.status), b.status);
        return rankA - rankB || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
      })
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mes actions</h1>
          <p className="subtitle">Toutes vos actions, tous projets confondus.</p>
        </div>
      </div>

      <div className="card">
        {actions === null ? (
          <div className="card-body">
            <p className="muted">Chargement…</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty">
            <p>Aucune action ne vous est assignée pour le moment.</p>
          </div>
        ) : (
          sorted.map((a) => {
            const late = isOverdue(a.dueDate, a.status);
            return (
              <div key={a.id} className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="row-main" style={{ flex: 1 }}>
                  <div className="row-title" style={{ whiteSpace: 'normal' }}>
                    {a.title}
                  </div>
                  <div className="row-sub">
                    {a.projectName}
                    {a.dueDate ? ` · échéance ${formatDate(a.dueDate)}` : ''}
                  </div>
                </div>
                {late && <span className="date-chip danger">En retard</span>}
                <div className="segmented">
                  {STATUS_ORDER.map((s) => (
                    <button key={s} className={a.status === s ? 'active' : ''} onClick={() => void changeStatus(a, s)}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => openProject(a)}>
                  Ouvrir le projet
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
