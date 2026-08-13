'use client';

import { useState } from 'react';
import {
  useCurrentProject,
  useRdp,
  useRdpCapa,
  useRdpFiveWhys,
  useRdpIndicators,
  useRdpIshikawa,
  useRdpProblem,
  useRdpSolutions,
  useRdpSubjects,
} from '@/lib/store';

/**
 * Bouton « Exporter le rapport » : PDF complet d'UNE résolution de problème.
 * Depuis fix-32 l'export est rattaché au RDP, plus au projet — un projet peut
 * en contenir plusieurs, un rapport unique n'aurait plus de sens.
 */
export function RdpExportButton({ rdpId }: { rdpId: string }) {
  const project = useCurrentProject();
  const rdp = useRdp(rdpId);
  const problem = useRdpProblem(rdpId);
  const subjects = useRdpSubjects(rdpId);
  const indicators = useRdpIndicators(rdpId);
  const fiveWhys = useRdpFiveWhys(rdpId);
  const ishikawa = useRdpIshikawa(rdpId);
  const solutions = useRdpSolutions(rdpId);
  const capa = useRdpCapa(rdpId);
  const [busy, setBusy] = useState(false);

  if (!project || !rdp) return null;

  const run = async () => {
    setBusy(true);
    try {
      const { exportRdpPdf } = await import('./RdpPdf');
      await exportRdpPdf({
        project,
        rdp,
        subjects,
        problem,
        indicators,
        fiveWhys,
        ishikawa,
        solutions,
        capa,
      });
    } catch (err) {
      console.warn('Export PDF RDP échoué', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="btn btn-sm" onClick={run} disabled={busy}>
      {busy ? 'Génération…' : 'Exporter le rapport'}
    </button>
  );
}
