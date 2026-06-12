'use client';

import type { IshikawaAnalysis, IshikawaCategory } from '@/lib/types';
import { ISHIKAWA_CATEGORIES } from '@/lib/types';

/**
 * Diagramme d'Ishikawa (arête de poisson) en SVG — rendu schématique des
 * causes saisies dans la grille 5M. Hauteur adaptée au nombre de causes ;
 * toutes les couleurs viennent des tokens CSS (thèmes clair/sombre).
 */

const TOP_CATS: IshikawaCategory[] = ISHIKAWA_CATEGORIES.slice(0, 3);
const BOTTOM_CATS: IshikawaCategory[] = ISHIKAWA_CATEGORIES.slice(3);

/** Abscisses (sur l'arête centrale) des points d'ancrage des branches. */
const TOP_ATTACH_X = [320, 590, 860];
const BOTTOM_ATTACH_X = [455, 725];
/** Décalage horizontal entre l'extrémité d'une branche et son ancrage. */
const BRANCH_DX = 140;
const WIDTH = 1120;
const TEXT_W = 158;

export function IshikawaDiagram({ analysis }: { analysis: IshikawaAnalysis }) {
  const causesOf = (cat: IshikawaCategory) =>
    analysis.causes.filter((c) => c.category === cat);

  const maxTop = Math.max(1, ...TOP_CATS.map((c) => causesOf(c).length));
  const maxBottom = Math.max(1, ...BOTTOM_CATS.map((c) => causesOf(c).length));
  const topH = Math.max(150, 70 + maxTop * 36);
  const bottomH = Math.max(150, 70 + maxBottom * 36);
  const spineY = topH + 30;
  const height = topH + bottomH + 60;

  const branch = (cat: IshikawaCategory, attachX: number, side: 'top' | 'bottom') => {
    const causes = causesOf(cat);
    const sideH = side === 'top' ? topH : bottomH;
    const outerX = attachX - BRANCH_DX;
    const outerY = side === 'top' ? spineY - sideH + 36 : spineY + sideH - 36;
    const labelY = side === 'top' ? outerY - 34 : outerY + 8;

    return (
      <g key={cat}>
        <line
          x1={outerX} y1={outerY} x2={attachX} y2={spineY}
          stroke="var(--text-secondary)" strokeWidth="1.5"
        />
        {/* Étiquette de la catégorie à l'extrémité de la branche. */}
        <rect
          x={outerX - 55} y={labelY} width="110" height="26" rx="6"
          fill="var(--accent-soft)"
        />
        <text
          x={outerX} y={labelY + 17} textAnchor="middle"
          fontSize="12" fontWeight="600" fill="var(--accent-text)"
        >
          {cat}
        </text>
        {/* Causes réparties le long de la branche, texte aligné à droite. */}
        {causes.map((cause, i) => {
          const f = (i + 1) / (causes.length + 1);
          const x = outerX + (attachX - outerX) * f;
          const y = outerY + (spineY - outerY) * f;
          return (
            <g key={cause.id}>
              <line x1={x} y1={y} x2={x - 12} y2={y} stroke="var(--border-strong)" strokeWidth="1.2" />
              <foreignObject x={x - 12 - TEXT_W} y={y - 16} width={TEXT_W} height="32">
                <div
                  style={{
                    fontSize: 10.5, lineHeight: '15px', textAlign: 'right',
                    color: 'var(--text)', overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}
                  title={cause.causeText}
                >
                  {cause.causeText}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="fishbone-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Diagramme d'Ishikawa : ${analysis.title}`}>
        {/* Arête centrale et flèche vers l'effet. */}
        <line x1="40" y1={spineY} x2="888" y2={spineY} stroke="var(--text-secondary)" strokeWidth="2" />
        <path d={`M 878 ${spineY - 6} L 890 ${spineY} L 878 ${spineY + 6}`} fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinejoin="round" />

        {TOP_CATS.map((cat, i) => branch(cat, TOP_ATTACH_X[i], 'top'))}
        {BOTTOM_CATS.map((cat, i) => branch(cat, BOTTOM_ATTACH_X[i], 'bottom'))}

        {/* Tête : l'effet (le problème analysé). */}
        <rect
          x="896" y={spineY - 42} width="210" height="84" rx="8"
          fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5"
        />
        <text x="1001" y={spineY - 24} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.6">
          EFFET
        </text>
        <foreignObject x="904" y={spineY - 16} width="194" height="52">
          <div
            style={{
              fontSize: 12, lineHeight: '16px', textAlign: 'center', fontWeight: 600,
              color: 'var(--text)', overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            }}
            title={analysis.effect}
          >
            {analysis.effect || analysis.title}
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
