'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/store';
import { criticality } from '@/lib/types';
import type { Action, AmdecEntry, ActivityEvent } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { Modal } from './Modal';

const ISO = (d: Date) => d.toISOString().slice(0, 10);

function relative(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j} j`;
  return formatDate(iso.slice(0, 10));
}

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

interface Alerts {
  overdue: Action[];
  dueSoon: Action[];
  criticalNoPlan: AmdecEntry[];
  total: number;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { actions, amdecs, activityEvents, currentProjectId } = useWorkspace();

  const alerts = useMemo<Alerts>(() => {
    const now = new Date();
    const todayStr = ISO(now);
    const in3Str = ISO(new Date(now.getTime() + 3 * 86400000));
    const openA = actions.filter((a) => a.status !== 'done');
    const overdue = openA.filter((a) => a.dueDate && a.dueDate < todayStr);
    const dueSoon = openA.filter((a) => a.dueDate && a.dueDate >= todayStr && a.dueDate <= in3Str);
    const withPlan = new Set(actions.map((a) => a.amdecId).filter(Boolean) as string[]);
    const criticalNoPlan = amdecs.filter((a) => criticality(a) >= 24 && !withPlan.has(a.id));
    return { overdue, dueSoon, criticalNoPlan, total: overdue.length + dueSoon.length + criticalNoPlan.length };
  }, [actions, amdecs]);

  // Clés des éléments « à traiter » — sert au suivi « vu / non vu ».
  const currentKeys = useMemo(
    () => [
      ...alerts.overdue.map((a) => `o:${a.id}`),
      ...alerts.dueSoon.map((a) => `s:${a.id}`),
      ...alerts.criticalNoPlan.map((r) => `c:${r.id}`),
    ],
    [alerts],
  );

  // « Vu » persistant par projet : le badge ne compte que les nouveautés et
  // disparaît dès l'ouverture du panneau (réapparaît si une nouvelle alerte arrive).
  const storeKey = currentProjectId ? `entan-notif-seen-${currentProjectId}` : null;
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => {
    if (!storeKey) return;
    try {
      setSeen(JSON.parse(localStorage.getItem(storeKey) ?? '[]'));
    } catch {
      setSeen([]);
    }
  }, [storeKey]);

  const seenSet = useMemo(() => new Set(seen), [seen]);
  const unseen = currentKeys.filter((k) => !seenSet.has(k)).length;

  const openPanel = () => {
    setOpen(true);
    if (storeKey) {
      localStorage.setItem(storeKey, JSON.stringify(currentKeys));
      setSeen(currentKeys);
    }
  };

  if (!currentProjectId) return null;

  return (
    <>
      <button
        className="icon-btn"
        onClick={openPanel}
        title="Notifications"
        aria-label="Notifications"
        style={{ position: 'relative' }}
      >
        <IconBell />
        {unseen > 0 && (
          <span
            style={{
              position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15, padding: '0 3px',
              borderRadius: 8, background: 'var(--danger)', color: '#fff', fontSize: 9, fontWeight: 700,
              display: 'grid', placeItems: 'center', lineHeight: 1,
            }}
          >
            {unseen}
          </span>
        )}
      </button>
      {open && <NotificationsModal onClose={() => setOpen(false)} alerts={alerts} events={activityEvents} />}
    </>
  );
}

function NotificationsModal({
  onClose,
  alerts,
  events,
}: {
  onClose: () => void;
  alerts: Alerts;
  events: ActivityEvent[];
}) {
  const alertRow = (key: string, title: string, sub: string, href: string, tone: string) => (
    <Link
      key={key}
      href={href}
      onClick={onClose}
      className="list-row"
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 4, background: tone, flexShrink: 0 }} />
      <div className="row-main">
        <div className="row-title">{title}</div>
        <div className="row-sub">{sub}</div>
      </div>
    </Link>
  );

  return (
    <Modal title="Notifications" onClose={onClose}>
      <h3 style={{ fontSize: 13, margin: '0 0 6px', color: 'var(--text-secondary)' }}>À traiter</h3>
      {alerts.total === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>Rien à signaler pour le moment 🎉</p>
      ) : (
        <div>
          {alerts.overdue.map((a) =>
            alertRow(`o-${a.id}`, a.title, `En retard · échéance ${formatDate(a.dueDate)}`, '/actions', 'var(--danger)'),
          )}
          {alerts.dueSoon.map((a) =>
            alertRow(`s-${a.id}`, a.title, `Échéance proche · ${formatDate(a.dueDate)}`, '/actions', 'var(--accent)'),
          )}
          {alerts.criticalNoPlan.map((r) =>
            alertRow(
              `c-${r.id}`,
              `${r.element} — ${r.failureMode}`,
              `Risque critique (C=${criticality(r)}) sans action corrective`,
              '/amdec',
              'var(--danger)',
            ),
          )}
        </div>
      )}

      <h3 style={{ fontSize: 13, margin: '18px 0 6px', color: 'var(--text-secondary)' }}>Activité récente</h3>
      {events.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>Aucune activité récente.</p>
      ) : (
        <div>
          {events.slice(0, 15).map((e) => (
            <div key={e.id} className="list-row">
              <div className="row-main">
                <div className="row-title" style={{ fontWeight: 400 }}>
                  <strong>{e.actorName}</strong> {e.summary}
                </div>
                <div className="row-sub">{relative(e.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
