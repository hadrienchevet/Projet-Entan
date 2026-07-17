/**
 * Registre des articles de blog — source unique utilisée par l'index /blog
 * et par le sitemap. Le contenu de chaque article vit dans sa propre route
 * (src/app/blog/{slug}/page.tsx), comme /methodes ou les pages légales.
 */
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO (YYYY-MM-DD)
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'matrice-raci-exemple-guide',
    title: 'Matrice RACI : définition, exemple concret et modèle à utiliser',
    description:
      'Ce que signifie vraiment R, A, C, I, les erreurs qui rendent une matrice RACI inutile, et un exemple complet sur un projet industriel à adapter directement.',
    date: '2026-07-17',
  },
  {
    slug: 'amdec-methode-exemple',
    title: 'AMDEC : méthode, calcul de la criticité et exemple chiffré',
    description:
      'Comment coter Gravité, Occurrence et Détectabilité sans que ça reste subjectif, le seuil qui déclenche une action corrective, et un exemple complet sur un procédé industriel.',
    date: '2026-07-17',
  },
];
