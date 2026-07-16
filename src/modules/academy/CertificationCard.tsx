'use client';

import type { ReactNode } from 'react';
import {
  IconA3,
  IconActions,
  IconAmdec,
  IconCheck,
  IconFiveWhys,
  IconIshikawa,
  IconPlanning,
  IconRaci,
  IconStar,
  IconSwot,
} from '@/components/icons';
import { ACADEMY_TOOL_LABELS, ACADEMY_TOOL_ORDER, type AcademyToolId } from './challenges';
import { certificationStatus } from './certification';
import type { AcademyProgress } from './useAcademyProgress';

const ICONS: Record<AcademyToolId, ReactNode> = {
  swot: <IconSwot />,
  raci: <IconRaci />,
  amdec: <IconAmdec />,
  actions: <IconActions />,
  planning: <IconPlanning />,
  ishikawa: <IconIshikawa />,
  'cinq-pourquoi': <IconFiveWhys />,
  a3: <IconA3 />,
};

/**
 * Bloc « formation & certification » d'un profil : bandeau certification
 * (X / N badges, « Certifié ENTAN » au complet) + détail des outils.
 * Présentation pure — la progression est fournie par l'appelant (soi via
 * `useAcademyProgress`, ou un membre via `fetchAcademyProgressFor`).
 */
export function CertificationCard({
  progress,
  loading = false,
}: {
  progress: AcademyProgress;
  loading?: boolean;
}) {
  const cert = certificationStatus(progress);
  const pct = Math.round((cert.mastered / cert.total) * 100);

  return (
    <>
      <div className={`cert-banner${cert.certified ? ' certified' : ''}`}>
        <span className="cert-ic">{cert.certified ? <IconCheck /> : <IconStar />}</span>
        <div className="cert-main">
          <div className="cert-title">
            {cert.certified ? 'Certifié ENTAN' : 'Formation en cours'}
          </div>
          <div className="cert-sub">
            {cert.mastered} / {cert.total} outils maîtrisés
          </div>
          <div className="cert-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="member-badges">
        {ACADEMY_TOOL_ORDER.map((tool) => {
          const state = progress[tool];
          const done = Boolean(state?.passed);
          return (
            <div key={tool} className={`member-badge${done ? ' done' : ''}`}>
              <span className="member-badge-ic">{ICONS[tool]}</span>
              <div className="member-badge-main">
                <div className="member-badge-name">{ACADEMY_TOOL_LABELS[tool]}</div>
                {state ? (
                  <div className="member-badge-score">
                    Meilleur : {state.best} / {state.total}
                  </div>
                ) : (
                  <div className="member-badge-score muted">Pas encore commencé</div>
                )}
              </div>
              {done ? (
                <span className="badge done">
                  <IconCheck /> Réussi
                </span>
              ) : (
                <span className="badge todo">À faire</span>
              )}
            </div>
          );
        })}
      </div>

      {loading && <p className="muted">Chargement du parcours…</p>}
    </>
  );
}
