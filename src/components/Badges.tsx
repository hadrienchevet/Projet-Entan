import type { ActionStatus } from '@/lib/types';
import { STATUS_LABELS, criticalityLevel } from '@/lib/types';
import { isOverdue } from '@/lib/date';

export function StatusBadge({ status, dueDate }: { status: ActionStatus; dueDate?: string }) {
  if (isOverdue(dueDate, status)) {
    return <span className="badge overdue">En retard</span>;
  }
  return <span className={`badge ${status}`}>{STATUS_LABELS[status]}</span>;
}

const CRIT_LABELS = { low: 'Faible', medium: 'À surveiller', high: 'Critique' } as const;

export function CriticalityBadge({ score }: { score: number }) {
  const level = criticalityLevel(score);
  return (
    <span className={`badge crit-${level}`} title={`Criticité = G × O × D = ${score}`}>
      {score} · {CRIT_LABELS[level]}
    </span>
  );
}

export function SourceBadge({ amdec }: { amdec: boolean }) {
  return amdec ? <span className="badge source">AMDEC</span> : null;
}
