import type { ReactNode } from 'react';

/**
 * Langage visuel « papier découpé » des pages publiques de contenu.
 *
 * Une toile ivoire, trois lavis pastel qui dérivent lentement, un grain de
 * papier, et des feuilles de couleur posées dessus aux bords découpés à la
 * main. Partagé par `/methodes` et les articles de blog illustrés : la même
 * identité, une seule source.
 *
 * Tout est en CSS et SVG inline — aucune image à télécharger. Ces pages sont
 * des portes d'entrée depuis les moteurs de recherche, leur vitesse compte.
 * Les lavis sont des dégradés radiaux plutôt que des flous, qui coûteraient un
 * recalcul à chaque défilement.
 */

/* Grain de papier : bruit fractal SVG en data-URI (~300 octets, pas de requête). */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const PAPER_CSS = `
.paper {
  position: relative;
  overflow-x: clip;
  /* Papiers pastel — déclinés de la terracotta de la marque, jamais criards. */
  --p-sage: #e7efe5;
  --p-sand: #f8eedd;
  --p-rose: #f9e8e2;
  --p-sky: #e6eef4;
  --p-lilac: #ece6f2;
  --ink-soft: #6b6a63;
}

.paper-wash { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.paper-wash i {
  position: absolute; display: block; border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, var(--c) 0%, transparent 68%);
  opacity: 0.75;
}
.paper-wash i:nth-child(1) { --c: #f3d9cc; width: 760px; height: 760px; top: -220px; left: -200px; }
.paper-wash i:nth-child(2) { --c: #dde9e1; width: 680px; height: 680px; top: 42%; right: -260px; }
.paper-wash i:nth-child(3) { --c: #e8dff0; width: 620px; height: 620px; bottom: -180px; left: 8%; }
@keyframes paper-drift-a { to { transform: translate3d(60px, 40px, 0) scale(1.07); } }
@keyframes paper-drift-b { to { transform: translate3d(-70px, -30px, 0) scale(1.05); } }
@media (prefers-reduced-motion: no-preference) {
  .paper-wash i:nth-child(1) { animation: paper-drift-a 46s ease-in-out infinite alternate; }
  .paper-wash i:nth-child(2) { animation: paper-drift-b 58s ease-in-out infinite alternate; }
  .paper-wash i:nth-child(3) { animation: paper-drift-a 52s ease-in-out infinite alternate reverse; }
}

/* Grain sur toute la page. */
.paper::after {
  content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background-image: ${GRAIN}; opacity: 0.05; mix-blend-mode: multiply;
}

.paper-wrap { position: relative; z-index: 2; max-width: 1080px; margin: 0 auto; padding: 0 24px; }

/* Apparition au défilement — 100 % CSS. Sans support navigateur, rien n'est
   masqué : la page reste entièrement lisible. */
@keyframes paper-reveal { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .paper [data-reveal] { animation: paper-reveal both; animation-timeline: view(); animation-range: entry 4% entry 38%; }
  }
}
@keyframes paper-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

/* Une feuille de papier de couleur posée sur la toile. */
.paper-sheet {
  position: relative; background: var(--sheet, var(--p-sand));
  border-radius: 34px 14px 30px 16px / 16px 32px 14px 30px;
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.75) inset, 0 16px 40px rgb(31 30 27 / 0.08);
  transform: rotate(var(--rot, 0deg));
}
.paper-sheet::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background-image: ${GRAIN}; opacity: 0.07; mix-blend-mode: multiply;
}
.paper-sheet > * { position: relative; }

/* Un découpage blanc posé par-dessus. */
.paper-cut {
  position: relative; background: #fffdf9;
  border-radius: 18px 8px 16px 10px / 10px 18px 8px 16px;
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.9) inset, 0 14px 32px rgb(31 30 27 / 0.12);
}

/* Papier immobile pour qui préfère : plus de rotation ni de dérive. */
@media (prefers-reduced-motion: reduce) {
  .paper-sheet, .paper-cut { transform: none; }
}
`;

/** Toile + lavis. Les styles propres à la page s'ajoutent par-dessus. */
export function PaperCanvas({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className ? `paper ${className}` : 'paper'}>
      <style dangerouslySetInnerHTML={{ __html: PAPER_CSS }} />
      <div className="paper-wash" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {children}
    </div>
  );
}
