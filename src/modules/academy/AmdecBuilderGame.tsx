'use client';

import { useState } from 'react';
import { IconCheck, IconChevronLeft } from '@/components/icons';
import { criticalityLevel } from '@/lib/types';
import { AMDEC_BUILDER, AMDEC_SCALES, AMDEC_SCENARIOS, type AmdecScenario } from './amdecBuilder';

interface Props {
  onFinish: (score: number, total: number, passed: boolean) => void;
  onExit: () => void;
}

type Field = 'mode' | 'cause' | 'effect';

const CATS: { role: Field; label: string; hint: string; tone: string }[] = [
  { role: 'mode', label: 'Mode de défaillance', hint: 'comment ça défaille', tone: 'accent' },
  { role: 'cause', label: 'Cause', hint: 'pourquoi', tone: 'warning' },
  { role: 'effect', label: 'Effet', hint: 'conséquence', tone: 'neutral' },
];
const CAT_NAME: Record<Field, string> = { mode: 'un mode de défaillance', cause: 'une cause', effect: 'un effet' };
const CAT_DEF: Record<Field, string> = {
  mode: 'la façon dont l’élément défaille',
  cause: 'l’origine de la défaillance',
  effect: 'la conséquence subie',
};

const LEVEL: Record<'low' | 'medium' | 'high', { label: string; badge: string }> = {
  high: { label: 'Critique', badge: 'crit-high' },
  medium: { label: 'À surveiller', badge: 'crit-medium' },
  low: { label: 'Faible', badge: 'crit-low' },
};

interface Stmt { role: Field; text: string; }

function shuffle<T>(input: readonly T[]): T[] {
  const a = input.slice();
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

function stmtsOf(sc: AmdecScenario): Stmt[] {
  return shuffle([
    { role: 'mode', text: sc.mode },
    { role: 'cause', text: sc.cause },
    { role: 'effect', text: sc.effect },
  ] as Stmt[]);
}

export function AmdecBuilderGame({ onFinish, onExit }: Props) {
  const [scenarios] = useState(() => shuffle(AMDEC_SCENARIOS));
  const [si, setSi] = useState(0);
  const [stmts, setStmts] = useState<Stmt[]>(() => stmtsOf(scenarios[0]));
  const [j, setJ] = useState(0);
  const [picked, setPicked] = useState<Field | null>(null);
  const [phase, setPhase] = useState<'label' | 'cote' | 'recap'>('label');
  const [g, setG] = useState(2);
  const [o, setO] = useState(2);
  const [d, setD] = useState(2);
  const [coted, setCoted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = scenarios.length * 3;
  const sc = scenarios[si];

  const pick = (role: Field) => {
    if (picked) return;
    setPicked(role);
    if (role === stmts[j].role) setScore((s) => s + 1);
  };

  const nextLabel = () => {
    if (j + 1 >= stmts.length) {
      setPhase('cote');
      return;
    }
    setPicked(null);
    setJ((n) => n + 1);
  };

  const nextScenario = () => {
    if (si + 1 >= scenarios.length) {
      setDone(true);
      onFinish(score, total, score / total >= AMDEC_BUILDER.passThreshold);
      return;
    }
    const ni = si + 1;
    setSi(ni);
    setStmts(stmtsOf(scenarios[ni]));
    setJ(0);
    setPicked(null);
    setPhase('label');
    setG(2); setO(2); setD(2);
    setCoted(false);
  };

  const replay = () => {
    setSi(0);
    setStmts(stmtsOf(scenarios[0]));
    setJ(0);
    setPicked(null);
    setPhase('label');
    setG(2); setO(2); setD(2);
    setCoted(false);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    const passed = score / total >= AMDEC_BUILDER.passThreshold;
    return (
      <div className="card acad-game">
        <div className="acad-result">
          <div className="acad-result-score">{score} / {total}</div>
          <div className="acad-result-pct">{pct} % de mode/cause/effet bien identifiés</div>
          {passed ? (
            <div className="acad-badge"><IconCheck /> Badge AMDEC débloqué</div>
          ) : (
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              Vise {Math.ceil(AMDEC_BUILDER.passThreshold * total)} / {total} pour décrocher le badge.
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

  const userScore = g * o * d;
  const userLevel = LEVEL[criticalityLevel(userScore)];
  const refScore = sc.g * sc.o * sc.d;
  const refLevel = LEVEL[criticalityLevel(refScore)];
  const barPct = Math.round(((si * 3 + j + (picked ? 1 : 0)) / total) * 100);

  return (
    <div className="card acad-game">
      <div className="card-header">
        <div className="card-title-group">
          <button className="btn btn-ghost btn-sm" onClick={onExit} aria-label="Retour au parcours">
            <IconChevronLeft />
          </button>
          <h2>{AMDEC_BUILDER.title}</h2>
        </div>
        <span className="badge in_progress">Ligne {si + 1} / {scenarios.length}</span>
      </div>

      <div className="acad-prog"><span className="acad-prog-bar" style={{ width: `${barPct}%` }} /></div>

      <div className="card-body">
        <div className="amdec-context">
          <span className="el">{sc.element}</span>
          {sc.situation}
        </div>

        {phase === 'label' && (
          <>
            <div className="acad-prompt">Dans la ligne AMDEC, « {stmts[j].text} » est…</div>
            <div className="acad-buckets">
              {CATS.map((c) => {
                const state = picked
                  ? c.role === stmts[j].role ? ' correct' : c.role === picked ? ' wrong' : ' dim'
                  : '';
                return (
                  <button
                    key={c.role}
                    className={`acad-bucket tone-${c.tone}${state}`}
                    onClick={() => pick(c.role)}
                    disabled={!!picked}
                  >
                    <span className="acad-bucket-label">{c.label}</span>
                    <span className="acad-bucket-hint">{c.hint}</span>
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className={`acad-feedback ${picked === stmts[j].role ? 'ok' : 'ko'}`}>
                <span>
                  {picked === stmts[j].role ? 'Bien vu — ' : `Raté — c’est ${CAT_NAME[stmts[j].role]}. `}
                  {CAT_NAME[stmts[j].role].charAt(0).toUpperCase() + CAT_NAME[stmts[j].role].slice(1)} : {CAT_DEF[stmts[j].role]}.
                </span>
                <button className="btn btn-primary btn-sm" onClick={nextLabel}>
                  {j + 1 < stmts.length ? 'Suivant' : 'Coter le risque'}
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'cote' && (
          <>
            <div className="amdec-recap">
              <div className="amdec-recap-cell"><span className="k">Mode</span><span className="v">{sc.mode}</span></div>
              <div className="amdec-recap-cell"><span className="k">Cause</span><span className="v">{sc.cause}</span></div>
              <div className="amdec-recap-cell"><span className="k">Effet</span><span className="v">{sc.effect}</span></div>
            </div>

            <p className="amdec-scale">{AMDEC_SCALES.g}<br />{AMDEC_SCALES.o}<br />{AMDEC_SCALES.d}</p>

            <div className="amdec-cote">
              <label>Gravité
                <select value={g} disabled={coted} onChange={(e) => setG(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label>Occurrence
                <select value={o} disabled={coted} onChange={(e) => setO(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label>Détectabilité
                <select value={d} disabled={coted} onChange={(e) => setD(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>

            <div className="amdec-crit">
              <span>Criticité = {g} × {o} × {d} =</span>
              <span className="val">{userScore}</span>
              <span className={`badge ${userLevel.badge}`}>{userLevel.label}</span>
            </div>

            {!coted ? (
              <div className="acad-result-actions" style={{ marginTop: 16 }}>
                <button className="btn btn-primary" onClick={() => setCoted(true)}>Valider ma cotation</button>
              </div>
            ) : (
              <>
                <div className="amdec-ref">
                  <b>Cotation de référence — {sc.g} × {sc.o} × {sc.d} = {refScore} · {refLevel.label}</b>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    <li>{sc.gWhy}</li>
                    <li>{sc.oWhy}</li>
                    <li>{sc.dWhy}</li>
                  </ul>
                </div>
                <div className="acad-result-actions" style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={() => setPhase('recap')}>Voir la ligne complète</button>
                </div>
              </>
            )}
          </>
        )}

        {phase === 'recap' && (
          <>
            <div className="amdec-recap">
              <div className="amdec-recap-cell"><span className="k">Élément</span><span className="v">{sc.element}</span></div>
              <div className="amdec-recap-cell"><span className="k">Mode</span><span className="v">{sc.mode}</span></div>
              <div className="amdec-recap-cell"><span className="k">Cause</span><span className="v">{sc.cause}</span></div>
              <div className="amdec-recap-cell"><span className="k">Effet</span><span className="v">{sc.effect}</span></div>
              <div className="amdec-recap-cell">
                <span className="k">Criticité (G·O·D)</span>
                <span className="v">{sc.g} · {sc.o} · {sc.d} = {refScore}</span>
              </div>
              <div className="amdec-recap-cell">
                <span className="k">Priorité</span>
                <span className="v"><span className={`badge ${refLevel.badge}`}>{refLevel.label}</span></span>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
              {criticalityLevel(refScore) === 'low'
                ? 'Criticité faible : à garder sous surveillance, sans action prioritaire.'
                : 'Criticité élevée : une action corrective s’impose pour faire baisser G, O ou D.'}
            </p>
            <div className="acad-result-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={nextScenario}>
                {si + 1 < scenarios.length ? 'Ligne suivante' : 'Voir le résultat'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
