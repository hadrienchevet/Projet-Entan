import Link from 'next/link';
import type { ReactNode } from 'react';
import { PublicShell } from '@/components/PublicShell';

/** Habillage d'un article de blog : eyebrow, titre, date, JSON-LD BlogPosting. */
export function BlogLayout({
  title,
  description,
  date,
  slug,
  children,
}: {
  title: string;
  description: string;
  date: string;
  slug: string;
  children: ReactNode;
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

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="pub-article">
        <Link href="/blog" className="back">← Tous les articles</Link>
        <span className="eyebrow">Article</span>
        <h1>{title}</h1>
        <p className="date">{formattedDate}</p>
        {children}
      </article>
    </PublicShell>
  );
}
