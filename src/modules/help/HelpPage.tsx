import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconHelp } from '@/components/icons';
import { EXAMPLE_CSS, FLOW, GUIDE_GROUPS } from './guideContent';
import { AcademyBridge } from './AcademyBridge';

/**
 * Guide — rendu par DEUX pages :
 * - `/help` (variant « app ») : guide produit. Checklist de démarrage en tête,
 *   blocs « Dans ENTAN » dans chaque fiche, passerelle vers l'Académie.
 * - `/methodes` (variant « public ») : page de référencement. Pas de checklist
 *   ni de mode d'emploi produit, et **fiches dépliées par défaut** — un
 *   visiteur venu d'un moteur de recherche est là pour lire, pas pour cliquer.
 *
 * Les fiches sont des `<details>/<summary>` natifs : le contenu reste dans le
 * HTML (donc indexable), et on récupère gratuitement le clavier, les lecteurs
 * d'écran et un comportement mobile correct, sans une ligne de JavaScript.
 */

const css = `
.page-header h1 .ic { color: var(--accent); display: inline-flex; }
.page-header h1 .ic svg { width: 22px; height: 22px; flex-shrink: 0; }
.guide h2 { font-size: 18px; margin: 0 0 4px; }
.guide .lead { color: var(--text-secondary); margin: 0 0 16px; line-height: 1.7; }

/* --- Par où commencer ---------------------------------------------------- */
.start-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.start-count { flex-shrink: 0; font-size: 13px; font-weight: 700; color: var(--accent-text); background: var(--accent-soft); border-radius: 999px; padding: 4px 12px; }
.start-count.done { color: var(--success); background: var(--success-soft); }
.start-bar { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; margin: 14px 0 16px; }
.start-bar span { display: block; height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; }
.start-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.start-steps li { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; }
.start-steps .tick { flex-shrink: 0; width: 19px; height: 19px; margin-top: 1px; border-radius: 50%; border: 1.5px solid var(--border-strong); display: grid; place-items: center; }
.start-steps .tick svg { width: 12px; height: 12px; }
.start-steps li.done .tick { background: var(--success); border-color: var(--success); color: #fff; }
.start-steps .txt { min-width: 0; }
.start-steps .txt a { font-size: 13.5px; font-weight: 600; color: var(--text); text-decoration: none; }
.start-steps .txt a:hover { color: var(--accent-text); text-decoration: underline; }
.start-steps li.done .txt a { color: var(--text-muted); font-weight: 500; }
.start-steps .txt small { display: block; color: var(--text-muted); font-size: 12px; line-height: 1.5; margin-top: 1px; }

/* --- Raccourcis de saut --------------------------------------------------- */
.guide-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.guide-chips a { font-size: 13px; font-weight: 600; text-decoration: none; color: var(--text-secondary); background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 6px 14px; transition: background 0.1s, color 0.1s; }
.guide-chips a:hover { background: var(--accent-soft); color: var(--accent-text); border-color: var(--accent-faint); }

/* --- Fiches repliables ---------------------------------------------------- */
.guide-group { scroll-margin-top: 16px; }
.guide-cards { display: grid; gap: 8px; }

.gcard { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); overflow: hidden; }
.gcard + .gcard { margin-top: 0; }
.gcard > summary { display: flex; align-items: center; gap: 11px; padding: 13px 14px; cursor: pointer; list-style: none; user-select: none; }
.gcard > summary::-webkit-details-marker { display: none; }
.gcard > summary:hover { background: var(--hover); }
.gcard > summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.gcard .ic { flex-shrink: 0; color: var(--accent); display: inline-flex; }
.gcard .ic svg { width: 18px; height: 18px; }
.gcard .q { flex: 1; min-width: 0; font-size: 14.5px; font-weight: 600; color: var(--text); line-height: 1.35; }
.gcard .q small { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-top: 3px; }
.gcard .chev { flex-shrink: 0; width: 16px; height: 16px; color: var(--text-muted); transition: transform 0.2s ease; }
.gcard[open] .chev { transform: rotate(180deg); }

.gcard-body { padding: 0 14px 15px; border-top: 1px solid var(--border); padding-top: 13px; }
.gcard-body p { color: var(--text-secondary); font-size: 13.5px; line-height: 1.65; margin: 0 0 10px; }
.gcard-body p .lbl { color: var(--text); font-weight: 600; }
.gcard-body .one { color: var(--text); }
.gcard-more { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); }
.gcard-more p:last-child { margin-bottom: 0; }

.gcard-app { margin-top: 13px; background: var(--accent-soft); border-radius: 8px; padding: 12px 13px; }
.gcard-app .cap { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--accent-text); margin-bottom: 8px; }
.gcard-app ol { margin: 0 0 11px; padding-left: 18px; color: var(--text); font-size: 13px; line-height: 1.7; }
.gcard-app ol li::marker { color: var(--accent-text); font-weight: 700; }

/* --- Fil rouge ------------------------------------------------------------ */
.guide-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 4px 0 14px; }
.guide-flow .step { background: var(--accent-soft); color: var(--accent-text); border-radius: 999px; padding: 6px 13px; font-weight: 600; font-size: 13px; }
.guide-flow .arrow { color: var(--text-muted); font-weight: 700; }
.guide-benefits { margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8; font-size: 13.5px; }
.guide-benefits strong { color: var(--text); }

/* --- Exemples imagés ---------------------------------------------------- */
.guide-example { margin-top: 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 11px 12px; }
.guide-example .cap { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 9px; }

${EXAMPLE_CSS}
`;

const Chevron = () => (
  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export interface HelpPageProps {
  title?: string;
  subtitle?: string;
  /** Checklist de démarrage — injectée par `/help` seulement (a besoin du store). */
  checklist?: ReactNode;
}

export function HelpPage({
  title = 'Aide & Tutoriel',
  subtitle = 'Ce que fait chaque outil, quand vous en servir, et comment le faire dans ENTAN.',
  checklist,
}: HelpPageProps = {}) {

  return (
    <div className="page guide">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="ic"><IconHelp /></span> {title}
          </h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>

      {checklist}

      <div className="guide-chips">
        {GUIDE_GROUPS.map((g) => (
          <a key={g.id} href={`#${g.id}`}>{g.chip}</a>
        ))}
      </div>

      {GUIDE_GROUPS.map((group) => (
        <section key={group.id} id={group.id} className="card guide-group">
          <div className="card-body">
            <h2>{group.label}</h2>
            <p className="lead">{group.intro}</p>
            <div className="guide-cards">
              {group.cards.map((card) => (
                <details key={card.id} className="gcard">
                  <summary>
                    <span className="ic">{card.icon}</span>
                    <span className="q">
                      {card.question}
                      <small>{card.tool}</small>
                    </span>
                    <Chevron />
                  </summary>
                  <div className="gcard-body">
                    <p className="one">{card.oneLine}</p>
                    <p>
                      <span className="lbl">Quand s’en servir — </span>
                      {card.when}
                    </p>

                    <div className="guide-example">
                      <div className="cap">Exemple</div>
                      {card.example}
                    </div>

                    {(
                      <div className="gcard-app">
                        <div className="cap">Dans ENTAN</div>
                        <ol>
                          {card.inApp.steps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ol>
                        <Link className="btn btn-sm" href={card.inApp.href}>
                          {card.inApp.cta} →
                        </Link>
                      </div>
                    )}

                    <div className="gcard-more">
                      <p>
                        <span className="lbl">L’intérêt — </span>
                        {card.why}
                      </p>
                      <p>
                        <span className="lbl">Lien avec le reste — </span>
                        {card.link}
                      </p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}

      <div className="card">
        <div className="card-body">
          <h2>Comment tout s’articule</h2>
          <p className="lead">
            Pris isolément, chaque outil est utile. Reliés, ils forment un système où l’information
            circule sans rupture — c’est là que se crée la vraie valeur.
          </p>
          <div className="guide-flow" aria-label="Enchaînement des outils">
            {FLOW.map((step, i) => (
              <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="step">{step}</span>
                {i < FLOW.length - 1 && <span className="arrow">→</span>}
              </span>
            ))}
          </div>
          <ul className="guide-benefits">
            <li>
              <strong>Zéro double saisie</strong> : une action n’existe qu’une fois ; elle apparaît dans le
              plan d’action, le planning, le RACI et les coûts — toujours la même donnée.
            </li>
            <li>
              <strong>Traçabilité de bout en bout</strong> : du risque stratégique jusqu’à la tâche datée et
              son responsable.
            </li>
            <li>
              <strong>Un dossier projet présentable</strong> : l’A3, les Liens et le compte-rendu de revue
              donnent une synthèse cohérente, sans repartir d’une feuille blanche.
            </li>
          </ul>
        </div>
      </div>

      <AcademyBridge />
    </div>
  );
}
