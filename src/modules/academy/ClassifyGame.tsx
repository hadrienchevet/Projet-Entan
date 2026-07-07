'use client';

import { useMemo, useState } from 'react';
import { IconCheck, IconChevronLeft } from '@/components/icons';
import { ACADEMY_TOOL_LABELS, type ChallengeSet } from './challenges';

interface Props {
  set: ChallengeSet;
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

/**
 * Moteur générique de défi « classement » : un énoncé, des paniers, une
 * correction immédiate, un score et un badge. Réutilisable pour SWOT, RACI,
 * Ishikawa 5M… — seul le jeu de données change.
 */
export function ClassifyGame({ set, onFinish, onExit }: Props) {
  // Ordre tiré au sort à l'ouverture ; re-mélangé à chaque relance.
  const [items, setItems] = useState(() => shuffle(set.items));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const total = items.length;
  const item = items[i];
  const bucketById = useMemo(
    () => Object.fromEntries(set.buckets.map((b) => [b.id, b])),
    [set.buckets],
  );

  const pick = (bucketId: string) => {
    if (picked) return;
    setPicked(bucketId);
    if (bucketId === item.answer) setScore((s) => s + 1);
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
    setItems(shuffle(set.items));
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

  const correctId = item.answer;
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
        <div className="acad-prompt">« {item.prompt} »</div>

        <div className="acad-buckets">
          {set.buckets.map((b) => {
            const state = picked
              ? b.id === correctId ? ' correct' : b.id === picked ? ' wrong' : ' dim'
              : '';
            return (
              <button
                key={b.id}
                className={`acad-bucket tone-${b.tone}${state}`}
                onClick={() => pick(b.id)}
                disabled={!!picked}
              >
                <span className="acad-bucket-label">{b.label}</span>
                <span className="acad-bucket-hint">{b.hint}</span>
              </button>
            );
          })}
        </div>

        {picked && (
          <div className={`acad-feedback ${picked === correctId ? 'ok' : 'ko'}`}>
            <span>
              {picked === correctId ? 'Bien vu — ' : `Raté — c’est « ${bucketById[correctId].label} ». `}
              {item.why}
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
