import Link from 'next/link';
import type { ReactNode } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { PaperCanvas } from '@/components/PaperCanvas';

/** Habillage d'un article de blog : eyebrow, titre, date, JSON-LD BlogPosting. */
export function BlogLayout({
  title,
  description,
  date,
  slug,
  children,
  paper = false,
}: {
  title: string;
  description: string;
  date: string;
  slug: string;
  children: ReactNode;
  /** Article illustré : toile « papier découpé » et colonne élargie. */
  paper?: boolean;
}) {
  const url = `https://projetentan.fr/blog/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'ENTAN' },
    publisher: { '@type': 'Organization', name: 'ENTAN' },
  };

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const head = (
    <>
      <Link href="/blog" className="back">← Tous les articles</Link>
      <span className="eyebrow">Article</span>
      <h1>{title}</h1>
      <p className="date">{formattedDate}</p>
    </>
  );

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {paper ? (
        <PaperCanvas>
          <div className="paper-wrap">
            <article className="pub-article paper-article">
              {head}
              {children}
            </article>
          </div>
        </PaperCanvas>
      ) : (
        <article className="pub-article">
          {head}
          {children}
        </article>
      )}
    </PublicShell>
  );
}
