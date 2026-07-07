'use client';

import { useState, type ReactNode } from 'react';
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
import {
  ACADEMY_TOOL_LABELS,
  ACADEMY_TOOL_ORDER,
  challengeSet,
  type AcademyToolId,
} from './challenges';
import { useAcademyProgress } from './useAcademyProgress';
import { ClassifyGame } from './ClassifyGame';

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

/** Hub de l'Académie : parcours par outil, badges, et lancement des jeux. */
export function AcademyPanel() {
  const { progress, record } = useAcademyProgress();
  const [active, setActive] = useState<AcademyToolId | null>(null);

  const playable = ACADEMY_TOOL_ORDER.filter((t) => challengeSet(t));
  const mastered = playable.filter((t) => progress[t]?.passed).length;

  if (active) {
    const set = challengeSet(active);
    if (set) {
      return (
        <div className="page">
          <ClassifyGame
            key={set.id}
            set={set}
            onFinish={(score, total, passed) => record(set.id, score, total, passed)}
            onExit={() => setActive(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className="page">
      <div className="acad-hub">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconStar /> S’entraîner
          </h1>
          <p className="subtitle">
            Prends en main chaque outil par la pratique — courts défis, correction immédiate.
          </p>
        </div>
        <div className="acad-mastery">
          <span className="acad-mastery-num">{mastered} / {ACADEMY_TOOL_ORDER.length}</span>
          <span className="acad-mastery-lbl">outils maîtrisés</span>
        </div>
      </div>

      <div className="acad-cards">
        {ACADEMY_TOOL_ORDER.map((tool) => {
          const set = challengeSet(tool);
          const state = progress[tool];
          return (
            <button
              key={tool}
              className={`card acad-card${set ? '' : ' locked'}`}
              onClick={() => set && setActive(tool)}
              disabled={!set}
            >
              <div className="acad-card-top">
                <span className="acad-card-ic">{ICONS[tool]}</span>
                {state?.passed ? (
                  <span className="badge done"><IconCheck /> Réussi</span>
                ) : set ? (
                  <span className="badge in_progress">À faire</span>
                ) : (
                  <span className="badge todo">Bientôt</span>
                )}
              </div>
              <h3>{ACADEMY_TOOL_LABELS[tool]}</h3>
              <p>{set ? set.tagline : 'Mini-jeu en préparation.'}</p>
              {state && (
                <div className="acad-card-best">Meilleur score : {state.best} / {state.total}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
