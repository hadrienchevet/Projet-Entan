/**
 * Schémas explicatifs de l'AMDEC — papier découpé, animés au défilement.
 *
 * Objectif pédagogique : une méthode de cotation se comprend bien mieux en
 * voyant les trois facteurs se multiplier et la criticité franchir un seuil
 * qu'en lisant une formule. Chaque schéma isole UNE idée.
 *
 * Tout est en CSS et SVG inline — aucune image, aucun JavaScript : les pages
 * de blog restent des pages serveur statiques, ce qui compte pour leur
 * vitesse et donc leur référencement. Les animations se déclenchent au
 * défilement via `animation-timeline` et se coupent intégralement sous
 * `prefers-reduced-motion`.
 */

/** Zone de criticité selon les seuils du produit : ≥ 24 critique, ≥ 12 à surveiller. */
function zone(score: number): { label: string; cls: string } {
  if (score >= 24) return { label: 'Critique', cls: 'hot' };
  if (score >= 12) return { label: 'À surveiller', cls: 'warm' };
  return { label: 'Faible', cls: 'cool' };
}

export const AMDEC_DIAGRAMS_CSS = `
.dg { margin: 30px 0; }
.dg-cap { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-soft); margin-bottom: 12px; }
.dg-note { font-size: 13px; line-height: 1.6; color: var(--ink-soft); margin-top: 12px; }

/* Les schémas s'animent à l'entrée dans le viewport, sans JavaScript. */
@keyframes dg-pop { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: none; } }
@keyframes dg-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes dg-slide { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .dg [data-pop] { animation: dg-pop 0.5s ease both; animation-timeline: view(); animation-range: entry 8% entry 46%; }
    .dg [data-grow] { transform-origin: left center; animation: dg-grow 0.7s ease both; animation-timeline: view(); animation-range: entry 8% entry 50%; }
    .dg [data-slide] { animation: dg-slide 0.5s ease both; animation-timeline: view(); animation-range: entry 8% entry 46%; }
  }
}

/* --- Chaîne cause → mode → effet ----------------------------------------- */
.dg-chain { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: stretch; gap: 10px; }
.dg-chain .node { padding: 14px 15px; border-radius: 16px 7px 14px 9px / 9px 14px 7px 16px; }
.dg-chain .node b { display: block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-soft); margin-bottom: 6px; }
.dg-chain .node span { font-size: 14px; line-height: 1.45; color: #1f1e1d; }
.dg-chain .n1 { background: var(--p-sky); }
.dg-chain .n2 { background: var(--p-sand); }
.dg-chain .n3 { background: var(--p-rose); }
.dg-chain .arr { align-self: center; color: #b9b5a9; font-size: 20px; font-weight: 700; }
@media (max-width: 640px) {
  .dg-chain { grid-template-columns: 1fr; }
  .dg-chain .arr { transform: rotate(90deg); justify-self: center; }
}

/* --- Formule G × O × D ---------------------------------------------------- */
.dg-formula { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
.dg-factor { text-align: center; padding: 14px 18px; border-radius: 18px 8px 16px 10px / 10px 16px 8px 18px; min-width: 104px; }
.dg-factor .k { display: block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-soft); }
.dg-factor .v { display: block; font-family: var(--font-serif); font-size: 34px; line-height: 1.1; margin-top: 2px; color: #1f1e1d; }
.dg-factor .s { display: block; font-size: 11.5px; color: var(--ink-soft); margin-top: 2px; }
.dg-factor.g { background: var(--p-rose); }
.dg-factor.o { background: var(--p-sand); }
.dg-factor.d { background: var(--p-sky); }
.dg-op { font-family: var(--font-serif); font-size: 22px; color: #b9b5a9; }
.dg-result { text-align: center; padding: 14px 22px; border-radius: 20px 9px 18px 11px / 11px 18px 9px 20px; background: #fffdf9; box-shadow: 0 12px 30px rgb(31 30 27 / 0.12); }
.dg-result .v { display: block; font-family: var(--font-serif); font-size: 40px; line-height: 1; }
.dg-result .z { display: inline-block; margin-top: 7px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-radius: 999px; padding: 3px 11px; }
.dg-result.hot .v { color: #a8332a; } .dg-result.hot .z { background: #f8e2df; color: #a8332a; }
.dg-result.warm .v { color: #8a6210; } .dg-result.warm .z { background: #f7eed8; color: #8a6210; }
.dg-result.cool .v { color: #2e7d4f; } .dg-result.cool .z { background: #e6f1e9; color: #2e7d4f; }

/* --- Échelles de cotation 1→4 -------------------------------------------- */
.dg-scales { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 760px) { .dg-scales { grid-template-columns: 1fr; } }
.dg-scale { padding: 15px; border-radius: 18px 8px 16px 10px / 10px 16px 8px 18px; }
.dg-scale.g { background: var(--p-rose); } .dg-scale.o { background: var(--p-sand); } .dg-scale.d { background: var(--p-sky); }
.dg-scale h4 { font-size: 13px; margin: 0 0 3px; font-weight: 700; }
.dg-scale .q { display: block; font-size: 12px; line-height: 1.45; color: var(--ink-soft); margin-bottom: 11px; }
.dg-rung { display: flex; align-items: center; gap: 9px; margin-bottom: 7px; }
.dg-rung .lvl { flex-shrink: 0; width: 21px; height: 21px; border-radius: 50%; background: #fffdf9; display: grid; place-items: center; font-size: 11.5px; font-weight: 700; color: #1f1e1d; }
.dg-rung .meter { flex-shrink: 0; width: 46px; height: 7px; border-radius: 4px; background: rgb(255 255 255 / 0.65); overflow: hidden; }
.dg-rung .meter i { display: block; height: 100%; border-radius: 4px; background: #c15f3c; opacity: 0.75; }
.dg-rung span { font-size: 12.5px; line-height: 1.4; color: #1f1e1d; }

/* --- Jauge 1 → 64 --------------------------------------------------------- */
.dg-gauge { position: relative; }
.dg-gauge-track { position: relative; height: 26px; border-radius: 13px; overflow: hidden; display: flex; }
.dg-gauge-track i { display: block; height: 100%; }
.dg-gauge-track .z1 { background: #e6f1e9; flex: 11; }
.dg-gauge-track .z2 { background: #f7eed8; flex: 12; }
.dg-gauge-track .z3 { background: #f8e2df; flex: 41; }
.dg-gauge-marks { position: relative; height: 20px; margin-top: 5px; font-size: 10.5px; color: var(--ink-soft); }
.dg-gauge-marks b { position: absolute; transform: translateX(-50%); font-weight: 600; }
.dg-pin { position: absolute; top: -6px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
.dg-pin .bubble { font-size: 11.5px; font-weight: 700; color: #fffdf9; background: #1f1e1d; border-radius: 999px; padding: 2px 9px; white-space: nowrap; }
.dg-pin .stem { width: 2px; height: 14px; background: #1f1e1d; }
.dg-zone-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; font-size: 12.5px; color: var(--ink-soft); }
.dg-zone-legend span { display: inline-flex; align-items: center; gap: 7px; }
.dg-zone-legend em { width: 11px; height: 11px; border-radius: 3px; font-style: normal; }

/* --- Avant / après action corrective -------------------------------------- */
.dg-ba { display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: center; }
@media (max-width: 640px) { .dg-ba { grid-template-columns: 1fr; } .dg-ba .mid { transform: rotate(90deg); } }
.dg-ba .side { text-align: center; padding: 16px; border-radius: 18px 8px 16px 10px / 10px 16px 8px 18px; }
.dg-ba .side.before { background: #f8e2df; }
.dg-ba .side.after { background: #e6f1e9; }
.dg-ba .side .k { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-soft); }
.dg-ba .side .v { display: block; font-family: var(--font-serif); font-size: 36px; line-height: 1.1; margin: 4px 0 2px; }
.dg-ba .side.before .v { color: #a8332a; }
.dg-ba .side.after .v { color: #2e7d4f; }
.dg-ba .side .calc { font-size: 12.5px; color: var(--ink-soft); }
.dg-ba .mid { text-align: center; }
.dg-ba .mid .act { display: inline-block; background: #fffdf9; border-radius: 14px 7px 12px 8px / 8px 12px 7px 14px; padding: 9px 13px; font-size: 12.5px; line-height: 1.45; color: #1f1e1d; box-shadow: 0 8px 20px rgb(31 30 27 / 0.1); max-width: 190px; }
.dg-ba .mid .arr { display: block; color: #b9b5a9; font-size: 20px; font-weight: 700; margin-top: 6px; }

/* --- Boucle de la démarche ------------------------------------------------ */
.dg-loop { display: flex; flex-wrap: wrap; align-items: stretch; justify-content: center; gap: 9px; }
.dg-loop .step { flex: 1 1 150px; max-width: 190px; padding: 13px 14px; border-radius: 16px 7px 14px 9px / 9px 14px 7px 16px; background: #fffdf9; box-shadow: 0 8px 22px rgb(31 30 27 / 0.08); }
.dg-loop .step b { display: block; font-family: var(--font-serif); font-size: 15px; color: #a84f2f; }
.dg-loop .step span { display: block; font-size: 12.5px; line-height: 1.45; color: var(--ink-soft); margin-top: 3px; }
.dg-loop .back { flex-basis: 100%; text-align: center; font-size: 12.5px; color: var(--ink-soft); margin-top: 4px; }
`;

/* --- Composants ------------------------------------------------------------ */

/** Ce que les gens confondent le plus : la cause n'est pas le mode, ni l'effet. */
export function ChaineDefaillance() {
  return (
    <figure className="dg">
      <figcaption className="dg-cap">Ce qu’on cote, et ce qu’on ne cote pas</figcaption>
      <div className="dg-chain">
        <div className="node n1" data-slide>
          <b>Cause</b>
          <span>Réglage de la sertisseuse non verrouillé</span>
        </div>
        <span className="arr" aria-hidden="true">→</span>
        <div className="node n2" data-slide style={{ animationDelay: '0.1s' }}>
          <b>Mode de défaillance</b>
          <span>Connecteur mal serti</span>
        </div>
        <span className="arr" aria-hidden="true">→</span>
        <div className="node n3" data-slide style={{ animationDelay: '0.2s' }}>
          <b>Effet</b>
          <span>Panne intermittente chez le client</span>
        </div>
      </div>
      <p className="dg-note">
        L’<strong>Occurrence</strong> se cote sur la <strong>cause</strong>, la{' '}
        <strong>Gravité</strong> sur l’<strong>effet</strong>. Les coter toutes deux sur le mode de
        défaillance est l’erreur la plus fréquente — et elle fausse la criticité dans les deux sens.
      </p>
    </figure>
  );
}

/** La formule, rendue tangible. */
export function FormuleCriticite({
  g = 4,
  o = 2,
  d = 4,
  caption = 'Criticité = Gravité × Occurrence × Détectabilité',
}: {
  g?: number;
  o?: number;
  d?: number;
  caption?: string;
}) {
  const score = g * o * d;
  const z = zone(score);
  return (
    <figure className="dg">
      <figcaption className="dg-cap">{caption}</figcaption>
      <div className="dg-formula">
        <div className="dg-factor g" data-pop>
          <span className="k">Gravité</span>
          <span className="v">{g}</span>
          <span className="s">l’effet</span>
        </div>
        <span className="dg-op" aria-hidden="true">×</span>
        <div className="dg-factor o" data-pop style={{ animationDelay: '0.08s' }}>
          <span className="k">Occurrence</span>
          <span className="v">{o}</span>
          <span className="s">la cause</span>
        </div>
        <span className="dg-op" aria-hidden="true">×</span>
        <div className="dg-factor d" data-pop style={{ animationDelay: '0.16s' }}>
          <span className="k">Détectabilité</span>
          <span className="v">{d}</span>
          <span className="s">le filet</span>
        </div>
        <span className="dg-op" aria-hidden="true">=</span>
        <div className={`dg-result ${z.cls}`} data-pop style={{ animationDelay: '0.26s' }}>
          <span className="v">{score}</span>
          <span className="z">{z.label}</span>
        </div>
      </div>
    </figure>
  );
}

const SCALES = [
  {
    cls: 'g',
    name: 'Gravité',
    q: 'Si ça arrive, c’est grave à quel point ?',
    rungs: ['Effet à peine perceptible', 'Gêne interne, rattrapable', 'Client impacté, retard', 'Arrêt, sécurité, non-conformité'],
  },
  {
    cls: 'o',
    name: 'Occurrence',
    q: 'À quelle fréquence la cause survient-elle ?',
    rungs: ['Jamais observée', 'Rare, isolée', 'Plusieurs fois par an', 'Régulière, presque attendue'],
  },
  {
    cls: 'd',
    name: 'Détectabilité',
    q: 'Le verra-t-on avant que ça fasse mal ?',
    rungs: ['Détecté à coup sûr', 'Détecté en général', 'Souvent manqué', 'Découvert trop tard'],
  },
];

/** Les trois échelles, avec ce que chaque niveau veut dire concrètement. */
export function EchellesCotation() {
  return (
    <figure className="dg">
      <figcaption className="dg-cap">Ce que valent 1, 2, 3 et 4</figcaption>
      <div className="dg-scales">
        {SCALES.map((s, si) => (
          <div key={s.name} className={`dg-scale ${s.cls}`} data-pop style={{ animationDelay: `${si * 0.08}s` }}>
            <h4>{s.name}</h4>
            <span className="q">{s.q}</span>
            {s.rungs.map((r, i) => (
              <div key={r} className="dg-rung">
                <span className="lvl">{i + 1}</span>
                <span className="meter">
                  <i data-grow style={{ width: `${(i + 1) * 25}%`, animationDelay: `${si * 0.08 + i * 0.06}s` }} />
                </span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="dg-note">
        Cette grille est à écrire <strong>avant</strong> de coter, et à partager. Sans elle, deux
        personnes notent le même risque différemment et la criticité ne veut plus rien dire.
      </p>
    </figure>
  );
}

/** La règle du seuil, sur une échelle de 1 à 64. */
export function JaugeCriticite({ score = 32 }: { score?: number }) {
  /* L'échelle 1→64 est linéaire : la position du repère suit le score. */
  const pos = Math.min(100, Math.max(0, (score / 64) * 100));
  return (
    <figure className="dg">
      <figcaption className="dg-cap">Les seuils, de 1 à 64</figcaption>
      <div className="dg-gauge">
        <div className="dg-gauge-track">
          <i className="z1" />
          <i className="z2" />
          <i className="z3" />
        </div>
        <div className="dg-pin" style={{ left: `${pos}%` }} data-pop>
          <span className="bubble">{score}</span>
          <span className="stem" />
        </div>
        <div className="dg-gauge-marks">
          <b style={{ left: '0%' }}>1</b>
          <b style={{ left: '18.75%' }}>12</b>
          <b style={{ left: '37.5%' }}>24</b>
          <b style={{ left: '100%' }}>64</b>
        </div>
      </div>
      <div className="dg-zone-legend">
        <span><em style={{ background: '#e6f1e9' }} />Moins de 12 — faible</span>
        <span><em style={{ background: '#f7eed8' }} />12 à 23 — à surveiller</span>
        <span><em style={{ background: '#f8e2df' }} />24 et plus — action corrective obligatoire</span>
      </div>
    </figure>
  );
}

/** Ce que l'action corrective change réellement — la criticité résiduelle. */
export function AvantApres() {
  return (
    <figure className="dg">
      <figcaption className="dg-cap">L’effet d’une action corrective</figcaption>
      <div className="dg-ba">
        <div className="side before" data-pop>
          <span className="k">Avant</span>
          <span className="v">32</span>
          <span className="calc">4 × 2 × 4</span>
        </div>
        <div className="mid" data-pop style={{ animationDelay: '0.1s' }}>
          <span className="act">Contrôle visuel systématique en sortie de sertissage</span>
          <span className="arr" aria-hidden="true">→</span>
        </div>
        <div className="side after" data-pop style={{ animationDelay: '0.2s' }}>
          <span className="k">Après</span>
          <span className="v">8</span>
          <span className="calc">4 × 2 × 1</span>
        </div>
      </div>
      <p className="dg-note">
        L’action n’a touché <strong>ni la gravité ni l’occurrence</strong> : le connecteur peut toujours
        être mal serti, et ça reste aussi grave. Elle a fait chuter la{' '}
        <strong>détectabilité de 4 à 1</strong>. C’est souvent le facteur le plus rapide à améliorer.
      </p>
    </figure>
  );
}

const LOOP = [
  { t: 'Lister', s: 'Modes de défaillance, avec cause et effet' },
  { t: 'Coter', s: 'G, O et D sur la grille partagée' },
  { t: 'Prioriser', s: 'Trier par criticité décroissante' },
  { t: 'Agir', s: 'Une action, un responsable, une échéance' },
  { t: 'Recoter', s: 'Mesurer la criticité résiduelle' },
];

/** La démarche est un cycle, pas une liste à cocher une fois. */
export function BoucleAmdec() {
  return (
    <figure className="dg">
      <figcaption className="dg-cap">La démarche, en cycle</figcaption>
      <div className="dg-loop">
        {LOOP.map((s, i) => (
          <div key={s.t} className="step" data-pop style={{ animationDelay: `${i * 0.07}s` }}>
            <b>{s.t}</b>
            <span>{s.s}</span>
          </div>
        ))}
        <div className="back">↻ et on recommence : une AMDEC se met à jour, elle ne se termine pas.</div>
      </div>
    </figure>
  );
}
