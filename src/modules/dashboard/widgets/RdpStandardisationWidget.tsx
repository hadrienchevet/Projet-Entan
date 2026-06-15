'use client';

import Link from 'next/link';
import { useProjectCapa } from '@/lib/store';
import type { WidgetProps } from './index';

export function RdpStandardisationWidget({ project }: WidgetProps) {
  const capa = useProjectCapa(project.id);
  const phase6 = capa.filter((a) => a.phase === 6);

  return (
    <div className="card" style={{ padding: '12px 16px' }}>
      <span className="muted" style={{ fontSize: 12 }}>Standardisation</span>
      <p style={{ marginTop: 2 }}>
        {phase6.length === 0
          ? 'Aucune action de standardisation pour le moment.'
          : `${phase6.length} action(s) de standardisation planifiée(s).`}{' '}
        <Link href="/standardisation" className="link">Ouvrir la phase 6</Link>
      </p>
    </div>
  );
}
