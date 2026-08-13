'use client';

/**
 * Coque d'une résolution de problème : en-tête + stepper des 7 phases.
 *
 * Depuis fix-32, la RDP est un outil et un projet peut en contenir plusieurs :
 * la navigation entre phases ne peut donc plus vivre dans la sidebar (elle est
 * relative à UNE résolution). Le stepper joue ce rôle — la CSS `.phase-steps` /
 * `.pdca-step` existait déjà, écrite pour cette méthodologie.
 *
 * Deux notions distinctes, volontairement :
 *   • la phase AFFICHÉE = celle de l'URL (style `active`) ;
 *   • la phase ATTEINTE = `rdp.currentPhase`, avancée explicitement par le
 *     bouton « Phase suivante » (style `done` pour les précédentes).
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRdp, useWorkspace } from '@/lib/store';
import { RDP_PHASES, rdpPhaseHref } from '@/lib/rdp';
import { RdpExportButton } from './RdpExportButton';

export function RdpShell({
  rdpId,
  slug,
  children,
}: {
  rdpId: string;
  slug: string;
  children: ReactNode;
}) {
  const rdp = useRdp(rdpId);
  const { setRdpPhase } = useWorkspace();
  const router = useRouter();

  if (!rdp) {
    return (
      <div className="page">
        <div className="empty">
          <p>Résolution de problème introuvable.</p>
          <Link className="btn" href="/rdp" style={{ marginTop: 12 }}>
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const reached = rdp.currentPhase;
  /* « solutions » porte les phases 3 et 4 : on retient la première. */
  const viewed = RDP_PHASES.find((p) => p.slug === slug);

  const goToPhase = (num: number) => {
    const target = RDP_PHASES.find((p) => p.num === num);
    if (!target) return;
    if (num > reached) void setRdpPhase(rdpId, num);
    router.push(rdpPhaseHref(rdpId, target.slug));
  };

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <Link className="link" href="/rdp">
            ← Résolutions de problèmes
          </Link>
          <h1 style={{ marginTop: 8 }}>{rdp.title}</h1>
          <p className="subtitle">
            {viewed
              ? `Phase ${viewed.num} — ${viewed.label} · ${viewed.description}`
              : 'Outil complémentaire de la démarche.'}
          </p>
        </div>
        <div className="header-actions">
          <RdpExportButton rdpId={rdpId} />
          <button
            className="btn btn-sm"
            disabled={reached === 0}
            onClick={() => goToPhase(reached - 1)}
          >
            ← Phase précédente
          </button>
          <button
            className="btn btn-sm btn-primary"
            disabled={reached === 6}
            onClick={() => goToPhase(reached + 1)}
          >
            Phase suivante →
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="pdca-steps phase-steps">
          {RDP_PHASES.map((p) => (
            <Link
              key={`${p.num}-${p.slug}`}
              href={rdpPhaseHref(rdpId, p.slug)}
              className={`pdca-step${
                viewed && p.num === viewed.num ? ' active' : p.num < reached ? ' done' : ''
              }`}
              title={p.description}
            >
              <span className="phase-step-num">{p.num}</span>
              <span className="pdca-step-label">{p.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}
