import Link from 'next/link';
import { Bloom, PaperCanvas } from '@/components/PaperCanvas';
import { EXAMPLE_CSS, FLOW, GUIDE_GROUPS } from './guideContent';

/**
 * `/methodes` — page publique de contenu, et **porte d'entrée depuis les
 * moteurs de recherche**.
 *
 * Elle partage son contenu avec le guide interne (`guideContent.tsx`) mais pas
 * sa présentation : le visiteur qui arrive ici n'a jamais entendu parler
 * d'ENTAN, et l'habillage de l'application — cartes denses pensées pour un
 * tableau de bord — lui donnait l'impression d'un panneau d'administration
 * égaré sur un site vitrine.
 *
 * Parti pris visuel : papier texturé et découpages. Chaque famille de méthodes
 * est une **feuille de papier pastel** posée sur un lavis à l'huile, aux bords
 * découpés à la main et très légèrement de travers. Tout est obtenu en CSS et
 * en SVG inline — aucune image à télécharger, ce qui compte sur une page
 * d'entrée dont la vitesse pèse sur le référencement.
 *
 * Contraintes tenues : tout le texte est dans le HTML (aucun dépli, aucun
 * rendu différé), la hiérarchie h1 › h2 › h3 reste sémantique, et toutes les
 * animations se coupent sous `prefers-reduced-motion`.
 */

/* Grain de papier : bruit fractal SVG en data-URI (~300 octets, pas de requête). */
const css = `

@keyframes meth-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

/* --- Héros ---------------------------------------------------------------- */
.meth-hero { position: relative; text-align: center; padding: 60px 0 10px; }
/* Les taches vivent dans les marges : le texte doit rester sur du blanc. */
.meth-b-hero-l { top: -34px; left: -168px; }
.meth-b-hero-r { top: 6px; right: -150px; }
.meth-b-hero-r2 { top: 150px; right: -78px; }
.meth-b-sec-l { top: 20px; left: -176px; }
.meth-b-sec-r { bottom: 40px; right: -160px; }
@media (max-width: 1180px) { .paper-bloom { display: none; } }
.meth-eyebrow { display: inline-block; font-size: 12.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); background: rgb(255 255 255 / 0.7); border: 1px solid var(--accent-faint); border-radius: 999px; padding: 5px 15px; margin-bottom: 22px; }
.meth-hero h1 { font-size: 44px; line-height: 1.08; letter-spacing: -0.025em; max-width: 800px; margin: 0 auto 18px; }
/* Coup de pinceau sous un mot clé du titre. */
.meth-hero h1 em { font-style: normal; position: relative; white-space: nowrap; }
.meth-hero h1 em::after {
  content: ''; position: absolute; left: -2%; right: -2%; bottom: 0.04em; height: 0.4em; z-index: -1;
  background: #f2d8c3; border-radius: 60% 40% 55% 45% / 60% 55% 45% 40%;
}
.meth-hero .sub { font-size: 17.5px; line-height: 1.68; color: var(--text-secondary); max-width: 680px; margin: 0 auto; }
.meth-meta { margin-top: 24px; font-size: 13px; color: var(--ink-soft); display: flex; gap: 11px; justify-content: center; flex-wrap: wrap; }
.meth-meta span + span::before { content: '·'; margin-right: 11px; color: var(--border-strong); }
@media (prefers-reduced-motion: no-preference) {
  .meth-hero .meth-eyebrow { animation: meth-up 0.6s ease both; }
  .meth-hero h1 { animation: meth-up 0.6s ease 0.08s both; }
  .meth-hero .sub { animation: meth-up 0.6s ease 0.16s both; }
  .meth-hero .meth-meta { animation: meth-up 0.6s ease 0.24s both; }
}

/* --- Sommaire : quatre papiers posés ------------------------------------- */
.meth-toc { margin: 48px 0 10px; }
.meth-toc-title { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--ink-soft); text-align: center; margin-bottom: 20px; }
.meth-toc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 1000px) { .meth-toc-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 420px) { .meth-toc-grid { grid-template-columns: 1fr; } }
.meth-toc-grid a {
  display: block; padding: 18px 19px; background: var(--sheet);
  border-radius: 22px 10px 20px 12px / 12px 22px 10px 20px;
  box-shadow: none;
  transform: rotate(var(--rot));
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.meth-toc-grid a:hover { transform: rotate(0deg) translateY(-2px); opacity: 0.82; }
.meth-toc-grid .num { font-family: var(--font-serif); font-size: 13px; font-weight: 700; color: var(--accent-text); }
.meth-toc-grid h2 { font-size: 16px; margin: 5px 0 6px; letter-spacing: -0.01em; }
.meth-toc-grid p { font-size: 12.5px; line-height: 1.5; color: var(--ink-soft); }

/* --- Sections : une feuille par famille ----------------------------------- */
.meth-section { padding: 46px 26px 30px; margin: 64px 0; }
.meth-section-head { max-width: 720px; margin-bottom: 10px; }
.meth-num { font-family: var(--font-serif); font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: var(--accent-text); }
.meth-section-head h2 { font-family: var(--font-serif); font-size: 31px; line-height: 1.14; letter-spacing: -0.02em; margin: 10px 0 12px; }
.meth-section-head .intro { font-size: 16.5px; line-height: 1.68; color: var(--text-secondary); }

/* --- Une méthode ---------------------------------------------------------- */
.meth-item { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 44px; align-items: start; padding: 32px 0; }
.meth-item + .meth-item { border-top: 1px solid rgb(31 30 27 / 0.07); }
.meth-kicker { display: inline-flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--accent-text); }
.meth-kicker svg { width: 16px; height: 16px; }
.meth-item h3 { font-family: var(--font-serif); font-size: 24px; line-height: 1.2; letter-spacing: -0.015em; margin: 10px 0 13px; }
.meth-item .lead { font-size: 16px; line-height: 1.66; color: var(--text); margin: 0 0 14px; }
.meth-item p { font-size: 14.5px; line-height: 1.74; color: var(--text-secondary); margin: 0 0 12px; }
.meth-item p:last-child { margin-bottom: 0; }
.meth-item p .lbl { color: var(--text); font-weight: 600; }

/* La figure est un découpage blanc posé sur la feuille, penché à l'inverse. */
.meth-fig { position: sticky; top: 24px; margin: 0; padding: 16px; transform: rotate(0.6deg); transition: transform 0.25s ease; }
.meth-item:nth-child(even) .meth-fig { transform: rotate(-0.8deg); }
.meth-fig:hover { transform: rotate(0deg) translateY(-2px); }
.meth-fig .cap { font-size: 10px; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 11px; }

/* --- Fil rouge ------------------------------------------------------------ */
.meth-flow-block { margin: 64px 0 10px; padding: 38px 26px; text-align: center; }
.meth-flow-block h2 { font-family: var(--font-serif); font-size: 27px; letter-spacing: -0.02em; margin-bottom: 10px; }
.meth-flow-block .intro { font-size: 15.5px; line-height: 1.68; color: var(--text-secondary); max-width: 640px; margin: 0 auto 24px; }
.meth-flow { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 9px; }
.meth-flow .step { background: var(--p-sand); border-radius: 999px; padding: 7px 16px; font-weight: 600; font-size: 13.5px; color: #8a4a2c; }
.meth-flow .step:nth-child(odd) { background: var(--p-rose); }
.meth-flow .arrow { color: var(--border-strong); font-weight: 700; }
.meth-points { display: grid; grid-template-columns: repeat(auto-fit, minmax(235px, 1fr)); gap: 15px; margin-top: 28px; text-align: left; }
.meth-points div { background: var(--p-sky); border-radius: 16px 8px 14px 10px / 10px 14px 8px 16px; padding: 16px 17px; }
.meth-points div:nth-child(2) { background: var(--p-sage); }
.meth-points div:nth-child(3) { background: var(--p-rose); }
.meth-points b { display: block; font-size: 14px; margin-bottom: 5px; }
.meth-points span { font-size: 13.5px; line-height: 1.6; color: var(--text-secondary); }

.meth-outro { text-align: center; margin: 36px 0 0; font-size: 14px; color: var(--ink-soft); }
.meth-outro a { color: var(--accent-text); font-weight: 600; }

@media (max-width: 900px) {
  .meth-hero { padding: 40px 0 4px; }
  .meth-hero h1 { font-size: 31px; }
  .meth-hero .sub { font-size: 16px; }
  .meth-section { padding: 30px 20px 24px; margin: 34px 0; border-radius: 26px 12px 24px 14px / 14px 24px 12px 26px; }
  .meth-section-head h2 { font-size: 25px; }
  .meth-item { grid-template-columns: 1fr; gap: 22px; padding: 26px 0; }
  .meth-fig { position: static; transform: none; }
  .meth-item:nth-child(even) .meth-fig { transform: none; }
  .meth-flow-block { padding: 28px 18px; }
}

${EXAMPLE_CSS}
`;

/** Une teinte de papier par famille — l'ordre suit `GUIDE_GROUPS`. */
const SHEETS = [
  { tint: 'var(--p-sage)', rot: '-0.4deg' },
  { tint: 'var(--p-sand)', rot: '0.35deg' },
  { tint: 'var(--p-rose)', rot: '-0.3deg' },
  { tint: 'var(--p-sky)', rot: '0.4deg' },
];

export function MethodesPage() {
  const total = GUIDE_GROUPS.reduce((n, g) => n + g.cards.length, 0);

  return (
    <PaperCanvas className="meth">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="paper-wrap">
        <header className="meth-hero">
          <Bloom color="#5b86d6" seed={7} size={300} className="meth-b-hero-l" />
          <Bloom color="#d94f86" seed={23} size={270} className="meth-b-hero-r" />
          <Bloom color="#e9b63a" seed={41} size={180} className="meth-b-hero-r2" />
          <span className="meth-eyebrow">Guide des méthodes</span>
          <h1>
            Les méthodes de <em>gestion de projet</em> industriel
          </h1>
          <p className="sub">
            RACI, AMDEC, planning, SWOT, charte A3 et résolution de problèmes : à quoi sert chaque
            outil, quand s’en servir, et comment les combiner pour piloter un projet de bout en bout.
          </p>
          <div className="meth-meta">
            <span>{total} méthodes</span>
            <span>Exemples industriels</span>
            <span>Lecture ~12 min</span>
          </div>
        </header>

        <nav className="meth-toc" aria-label="Sommaire">
          <div className="meth-toc-title">Au sommaire</div>
          <div className="meth-toc-grid">
            {GUIDE_GROUPS.map((g, i) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                style={
                  {
                    '--sheet': SHEETS[i % SHEETS.length].tint,
                    '--rot': SHEETS[i % SHEETS.length].rot,
                  } as React.CSSProperties
                }
              >
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <h2>{g.label}</h2>
                <p>{g.cards.map((c) => c.tool).join(' · ')}</p>
              </a>
            ))}
          </div>
        </nav>

        {GUIDE_GROUPS.map((group, i) => (
          <section
            key={group.id}
            id={group.id}
            className="paper-sheet meth-section"
            style={
              {
                '--sheet': SHEETS[i % SHEETS.length].tint,
                '--rot': SHEETS[i % SHEETS.length].rot,
              } as React.CSSProperties
            }
          >
            <Bloom
              color={['#6a9b4a', '#e9b63a', '#d6452f', '#5b86d6'][i % 4]}
              seed={13 + i * 9}
              size={i % 2 === 0 ? 290 : 250}
              className={i % 2 === 0 ? 'meth-b-sec-l' : 'meth-b-sec-r'}
            />
            <div className="meth-section-head" data-reveal>
              <span className="meth-num">{String(i + 1).padStart(2, '0')}</span>
              <h2>{group.label}</h2>
              <p className="intro">{group.intro}</p>
            </div>

            {group.cards.map((card) => (
              <article key={card.id} className="meth-item" data-reveal>
                <div>
                  <span className="meth-kicker">
                    {card.icon}
                    {card.tool}
                  </span>
                  <h3>{card.question}</h3>
                  <p className="lead">{card.oneLine}</p>
                  <p>
                    <span className="lbl">Quand s’en servir — </span>
                    {card.when}
                  </p>
                  <p>
                    <span className="lbl">L’intérêt — </span>
                    {card.why}
                  </p>
                  <p>
                    <span className="lbl">Lien avec le reste — </span>
                    {card.link}
                  </p>
                </div>
                <figure className="paper-cut meth-fig">
                  <div className="cap">Exemple</div>
                  {card.example}
                </figure>
              </article>
            ))}
          </section>
        ))}

        <section className="paper-cut meth-flow-block" data-reveal>
          <h2>Comment tout s’articule</h2>
          <p className="intro">
            Pris isolément, chaque outil est utile. Reliés, ils forment un système où l’information
            circule sans rupture — c’est là que se crée la vraie valeur.
          </p>
          <div className="meth-flow" aria-label="Enchaînement des méthodes">
            {FLOW.map((step, i) => (
              <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                <span className="step">{step}</span>
                {i < FLOW.length - 1 && <span className="arrow">→</span>}
              </span>
            ))}
          </div>
          <div className="meth-points">
            <div>
              <b>Zéro double saisie</b>
              <span>
                Une action n’existe qu’une fois : elle apparaît dans le plan d’action, le planning, le
                RACI et les coûts — toujours la même donnée.
              </span>
            </div>
            <div>
              <b>Traçabilité de bout en bout</b>
              <span>Du risque stratégique jusqu’à la tâche datée et son responsable.</span>
            </div>
            <div>
              <b>Un dossier présentable</b>
              <span>
                La charte A3, la vue Liens et le compte-rendu de revue donnent une synthèse cohérente,
                sans repartir d’une feuille blanche.
              </span>
            </div>
          </div>
        </section>

        <p className="meth-outro">
          Pour aller plus loin, le <Link href="/blog">blog</Link> détaille l’AMDEC et la matrice RACI
          avec des exemples chiffrés.
        </p>
      </div>
    </PaperCanvas>
  );
}
