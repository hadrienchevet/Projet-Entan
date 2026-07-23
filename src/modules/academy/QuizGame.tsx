'use client';

import { useMemo, useState } from 'react';
import { IconCheck, IconChevronLeft } from '@/components/icons';
import { ACADEMY_TOOL_LABELS } from './challenges';
import type { QuizQuestion, QuizSet } from './quizzes';

interface Props {
  set: QuizSet;
  /** Enregistre le résultat (score, total, badge décroché). */
  onFinish: (score: number, total: number, passed: boolean) => void;
  onExit: () => void;
}

/** Fisher-Yates : renvoie une copie mélangée (l'ordre change à chaque partie). */
function shuffle<T>(input: readonly T[]): T[] {
  const a = input.slice();
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

/** Question + choix déjà mélangés (posé une fois par apparition de la question). */
function shuffleQuestions(questions: readonly QuizQuestion[]): QuizQuestion[] {
  return shuffle(questions).map((q) => ({ ...q, choices: shuffle(q.choices) }));
}

/**
 * Moteur générique de quiz (QCM) : une question, plusieurs choix, correction
 * immédiate avec justification, score et badge. Réutilisable pour tout outil
 * dont la notion se prête mal à un simple classement par panier (Planning,
 * 5 Pourquoi, Charte A3…) — seul le jeu de données change.
 */
export function QuizGame({ set, onFinish, onExit }: Props) {
  const [questions, setQuestions] = useState(() => shuffleQuestions(set.questions));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const question = questions[i];
  const choiceById = useMemo(
    () => Object.fromEntries(question.choices.map((c) => [c.id, c])),
    [question],
  );

  const pick = (choiceId: string) => {
    if (picked) return;
    setPicked(choiceId);
    if (choiceId === question.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= total) {
      setDone(true);
      onFinish(score, total, score / total >= set.passThreshold);
      return;
    }
    setPicked(null);
    setI((n) => n + 1);
  };

  const replay = () => {
    setQuestions(shuffleQuestions(set.questions));
    setI(0);
    setScore(0);
    setPicked(null);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    const passed = score / total >= set.passThreshold;
    return (
      <div className="card acad-game">
        <div className="acad-result">
          <div className="acad-result-score">{score} / {total}</div>
          <div className="acad-result-pct">{pct} % de bonnes réponses</div>
          {passed ? (
            <div className="acad-badge"><IconCheck /> Badge {ACADEMY_TOOL_LABELS[set.tool]} débloqué</div>
          ) : (
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              Vise {Math.ceil(set.passThreshold * total)} / {total} pour décrocher le badge.
            </p>
          )}
          <div className="acad-result-actions">
            <button className="btn btn-primary" onClick={replay}>Rejouer</button>
            <button className="btn" onClick={onExit}>Retour au parcours</button>
          </div>
        </div>
      </div>
    );
  }

  const correctId = question.answer;
  const barPct = Math.round(((i + (picked ? 1 : 0)) / total) * 100);

  return (
    <div className="card acad-game">
      <div className="card-header">
        <div className="card-title-group">
          <button className="btn btn-ghost btn-sm" onClick={onExit} aria-label="Retour au parcours">
            <IconChevronLeft />
          </button>
          <h2>{set.title}</h2>
        </div>
        <span className="badge in_progress">{i + 1} / {total}</span>
      </div>

      <div className="acad-prog"><span className="acad-prog-bar" style={{ width: `${barPct}%` }} /></div>

      <div className="card-body">
        <div className="acad-prompt">{question.prompt}</div>

        <div className="acad-choices">
          {question.choices.map((c, idx) => {
            const state = picked
              ? c.id === correctId ? ' correct' : c.id === picked ? ' wrong' : ' dim'
              : '';
            return (
              <button
                key={c.id}
                className={`acad-choice${state}`}
                onClick={() => pick(c.id)}
                disabled={!!picked}
              >
                <span className="acad-choice-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="acad-choice-label">{c.label}</span>
              </button>
            );
          })}
        </div>

        {picked && (
          <div className={`acad-feedback ${picked === correctId ? 'ok' : 'ko'}`}>
            <span>
              {picked === correctId ? 'Bien vu — ' : `Raté — c’était « ${choiceById[correctId].label} ». `}
              {question.why}
            </span>
            <button className="btn btn-primary btn-sm" onClick={next}>
              {i + 1 < total ? 'Suivant' : 'Voir le résultat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
