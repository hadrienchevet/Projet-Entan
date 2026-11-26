import type { ReactNode } from 'react';

/**
 * Langage visuel « aquarelle » des pages publiques de contenu.
 *
 * Référence : une aquarelle florale — du pigment qui diffuse sur du papier
 * blanc, des bords irréguliers, des lavis qui foncent là où ils se
 * superposent, et surtout **beaucoup de blanc**. Le contraire d'un aplat.
 *
 * Trois mécanismes font le rendu, et aucun n'utilise d'image :
 * - `feTurbulence` + `feDisplacementMap` déforment le bord des taches : c'est
 *   ce qui remplace le cercle net par une frange d'aquarelle.
 * - `mix-blend-mode: multiply` fait foncer les recouvrements, comme deux
 *   couches de pigment.
 * - un grain de papier recouvre l'ensemble.
 *
 * Ces pages sont des portes d'entrée depuis les moteurs de recherche : tout
 * est inline, rien à télécharger.
 */

/* Grain de papier : bruit fractal SVG en data-URI (~300 octets, pas de requête). */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const PAPER_CSS = `
.paper {
  position: relative;
  /* Isolation indispensable : sans contexte d'empilement propre, le lavis en
     position fixed avec mix-blend-mode se compose par-dessus le texte, malgré
     son z-index inférieur. Elle confine aussi le multiply au papier. */
  isolation: isolate;
  overflow-x: clip;
  background: #fffdfa;
  /* Pigments — saturés, mais posés à faible couverture sur du blanc. */
  --w-rose: #d94f86;
  --w-jaune: #e9b63a;
  --w-bleu: #5b86d6;
  --w-rouge: #d6452f;
  --w-vert: #6a9b4a;
  --w-violet: #9a7ec0;
  /* Teintes pâles des mêmes pigments — taches de fond des sections et fonds
     des schémas. Conservées : les diagrammes AMDEC s'appuient dessus. */
  --p-sage: #e9f0e3;
  --p-sand: #fbf1dc;
  --p-rose: #fbe9ee;
  --p-sky: #e9f0f8;
  --p-lilac: #efe9f5;
  --ink-soft: #6b6a63;
}

/* --- Lavis décoratifs ----------------------------------------------------- */
/* Une tache, posée dans une section. En absolute et non fixed : une couche
   fixe avec mix-blend-mode se compose au-dessus du texte quel que soit son
   z-index. */
.paper-bloom {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
}
@keyframes paper-bloom { to { transform: translate3d(10px, -12px, 0) scale(1.05); } }
@media (prefers-reduced-motion: no-preference) {
  .paper-bloom { animation: paper-bloom 70s ease-in-out infinite alternate; }
  .paper-bloom:nth-of-type(even) { animation-duration: 88s; animation-direction: alternate-reverse; }
}

/* Grain sur toute la page. */
.paper::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: ${GRAIN};
  opacity: 0.055;
  mix-blend-mode: multiply;
}

.paper-wrap { position: relative; z-index: 2; max-width: 1040px; margin: 0 auto; padding: 0 24px; }

/* Apparition au défilement — 100 % CSS. Sans support navigateur, rien n'est
   masqué : la page reste entièrement lisible. */
@keyframes paper-reveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .paper [data-reveal] { animation: paper-reveal both; animation-timeline: view(); animation-range: entry 4% entry 38%; }
  }
}
@keyframes paper-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

/**
 * Une section : plus une carte, une TACHE. Deux lavis décentrés qui se fondent
 * dans le blanc, sans bord ni ombre — le papier reste visible au travers.
 */
.paper-sheet {
  position: relative;
  /* Un voile sous le titre, pas un aplat : le papier blanc doit rester
     majoritaire, ce sont les taches qui portent la couleur. */
  background: radial-gradient(64% 34% at 16% 0%, var(--sheet, #f4ece0) 0%, transparent 74%);
}
.paper-sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: ${GRAIN};
  opacity: 0.05;
  mix-blend-mode: multiply;
}
.paper-sheet > * { position: relative; }

/** Une figure : un bout de papier posé, à peine détaché du fond. */
.paper-cut {
  position: relative;
  background: #fffdfa;
  border: 1px solid rgb(31 30 27 / 0.07);
  border-radius: 14px 6px 12px 8px / 8px 12px 6px 14px;
  box-shadow: 0 6px 18px rgb(31 30 27 / 0.05);
}

@media (prefers-reduced-motion: reduce) {
  .paper-sheet, .paper-cut { transform: none; }
}
`;

/**
 * Une tache d'aquarelle.
 *
 * Le filtre déplace le bord selon un bruit fractal : c'est ce qui remplace
 * l'ellipse nette par la frange irrégulière d'un pigment qui a diffusé. Le
 * dégradé garde la couleur au cœur puis la laisse mourir — une tache qui sèche.
 *
 * Chaque tache porte son propre filtre et son propre dégradé (identifiants
 * uniques) : deux taches de la même page ne doivent pas se partager une graine
 * de bruit, sinon elles sortent identiques.
 */
export function Bloom({
  color,
  seed = 11,
  className,
  size = 260,
}: {
  color: string;
  seed?: number;
  className?: string;
  size?: number;
}) {
  const uid = `bloom-${seed}-${color.replace('#', '')}`;
  return (
    <svg
      className={className ? `paper-bloom ${className}` : 'paper-bloom'}
      width={size}
      height={size * 0.86}
      viewBox="0 0 300 258"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={`f-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id={`g-${uid}`}>
          <stop offset="0%" stopColor={color} stopOpacity="0.52" />
          <stop offset="58%" stopColor={color} stopOpacity="0.4" />
          <stop offset="82%" stopColor={color} stopOpacity="0.14" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="129" rx="104" ry="88" fill={`url(#g-${uid})`} filter={`url(#f-${uid})`} />
    </svg>
  );
}

/** Papier texturé. Les taches se posent dans les sections, pas en fond. */
export function PaperCanvas({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className ? `paper ${className}` : 'paper'}>
      <style dangerouslySetInnerHTML={{ __html: PAPER_CSS }} />
      {children}
    </div>
  );
}
