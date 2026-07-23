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
import { AMDEC_BUILDER } from './amdecBuilder';
import { quizSet } from './quizzes';
import { useAcademyProgress } from './useAcademyProgress';
import { ClassifyGame } from './ClassifyGame';
import { AmdecBuilderGame } from './AmdecBuilderGame';
import { QuizGame } from './QuizGame';

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

  // AMDEC a sa propre mécanique (constructeur de ligne) ; certains outils
  // passent par un QCM (quizzes.ts) ; les autres par le moteur de classement.
  const isPlayable = (t: AcademyToolId) => Boolean(challengeSet(t)) || Boolean(quizSet(t)) || t === 'amdec';
  const taglineOf = (t: AcademyToolId) =>
    challengeSet(t)?.tagline ?? quizSet(t)?.tagline ?? (t === 'amdec' ? AMDEC_BUILDER.tagline : 'Mini-jeu en préparation.');
  const playable = ACADEMY_TOOL_ORDER.filter(isPlayable);
  const mastered = playable.filter((t) => progress[t]?.passed).length;

  if (active === 'amdec') {
    return (
      <div className="page">
        <AmdecBuilderGame
          key="amdec"
          onFinish={(score, total, passed) => record('amdec', score, total, passed)}
          onExit={() => setActive(null)}
        />
      </div>
    );
  }
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
    const quiz = quizSet(active);
    if (quiz) {
      return (
        <div className="page">
          <QuizGame
            key={quiz.id}
            set={quiz}
            onFinish={(score, total, passed) => record(quiz.id, score, total, passed)}
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
          const state = progress[tool];
          const canPlay = isPlayable(tool);
          return (
            <button
              key={tool}
              className={`card acad-card${canPlay ? '' : ' locked'}`}
              onClick={() => canPlay && setActive(tool)}
              disabled={!canPlay}
            >
              <div className="acad-card-top">
                <span className="acad-card-ic">{ICONS[tool]}</span>
                {state?.passed ? (
                  <span className="badge done"><IconCheck /> Réussi</span>
                ) : canPlay ? (
                  <span className="badge in_progress">À faire</span>
                ) : (
                  <span className="badge todo">Bientôt</span>
                )}
              </div>
              <h3>{ACADEMY_TOOL_LABELS[tool]}</h3>
              <p>{taglineOf(tool)}</p>
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
