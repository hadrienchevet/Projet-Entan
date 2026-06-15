'use client';

import Link from 'next/link';
import { useProjectSubjects } from '@/lib/store';
import type { WidgetProps } from './index';

export function RdpSubjectWidget({ project }: WidgetProps) {
  const subjects = useProjectSubjects(project.id);
  const retained = subjects.find((s) => s.retained);

  if (!retained) {
    return (
      <div className="card" style={{ padding: '12px 16px' }}>
        <span className="muted" style={{ fontSize: 12 }}>Sujet traité</span>
        <p style={{ marginTop: 2 }}>
          Aucun sujet retenu. <Link href="/sujet" className="link">Choisir un sujet (phase 0)</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px' }}>
      <span className="muted" style={{ fontSize: 12 }}>Sujet traité</span>
      <p style={{ fontWeight: 600, marginTop: 2 }}>{retained.label}</p>
    </div>
  );
}
