'use client';

import Link from 'next/link';
import { useWorkspace } from '@/lib/store';
import { RDP_PHASES } from '@/lib/rdp';
import type { WidgetProps } from './index';

export function RdpPhaseWidget({ project }: WidgetProps) {
  const { setRdpPhase } = useWorkspace();
  const currentPhase = project.rdpCurrentPhase ?? 0;
  const phaseMeta = RDP_PHASES[currentPhase] ?? RDP_PHASES[0];

  return (
    <div className="card">
      <div className="card-header">
        <h2>Démarche — phase {currentPhase} sur 6</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" disabled={currentPhase === 0} onClick={() => void setRdpPhase(project.id, currentPhase - 1)}>← Phase précédente</button>
          <button className="btn btn-sm btn-primary" disabled={currentPhase === 6} onClick={() => void setRdpPhase(project.id, currentPhase + 1)}>Phase suivante →</button>
        </div>
      </div>

      <div className="pdca-steps phase-steps">
        {RDP_PHASES.map((p) => (
          <button
            key={p.num}
            type="button"
            className={`pdca-step${p.num === currentPhase ? ' active' : p.num < currentPhase ? ' done' : ''}`}
            onClick={() => void setRdpPhase(project.id, p.num)}
            title={p.description}
          >
            <span className="phase-step-num">{p.num}</span>
            <span className="pdca-step-label">{p.label}</span>
          </button>
        ))}
      </div>

      <div className="phase-current">
        <div>
          <p style={{ fontWeight: 600 }}>Phase {phaseMeta.num} — {phaseMeta.label}</p>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{phaseMeta.description}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {phaseMeta.tools.map((t) => <span key={t} className="badge source">{t}</span>)}
          </div>
        </div>
        <Link href={phaseMeta.href} className="btn btn-primary" style={{ flexShrink: 0 }}>Ouvrir la phase →</Link>
      </div>
    </div>
  );
}
