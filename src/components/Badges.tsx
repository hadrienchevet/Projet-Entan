import type { ActionStatus, CapaStatus, CapaType, PdcaPhase } from '@/lib/types';
import { CAPA_STATUS_LABELS, CAPA_TYPE_LABELS, PDCA_LABELS, STATUS_LABELS, criticalityLevel } from '@/lib/types';
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

export function PdcaBadge({ phase }: { phase: PdcaPhase }) {
  return <span className={`badge pdca-${phase}`}>{PDCA_LABELS[phase]}</span>;
}

export function CapaTypeBadge({ type }: { type: CapaType }) {
  return <span className={`badge capa-type-${type}`}>{CAPA_TYPE_LABELS[type]}</span>;
}

export function CapaStatusBadge({ status }: { status: CapaStatus }) {
  return <span className={`badge capa-status-${status}`}>{CAPA_STATUS_LABELS[status]}</span>;
}
