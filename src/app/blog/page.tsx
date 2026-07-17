import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/PublicShell';
import { BLOG_POSTS } from '@/content/blog-posts';

export const metadata: Metadata = {
  title: { absolute: 'Blog — Gestion de projet industriel | ENTAN' },
  description:
    'Guides pratiques sur les méthodes de pilotage de projet industriel : RACI, AMDEC, planning, résolution de problèmes. Exemples concrets et modèles à réutiliser.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog ENTAN — Gestion de projet industriel',
    description: 'Guides pratiques sur les méthodes de pilotage de projet industriel, avec exemples concrets.',
    url: '/blog',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <PublicShell>
      <div className="pub-article">
        <span className="eyebrow">Blog</span>
        <h1>Guides de gestion de projet industriel</h1>
        <p className="lead">
          Des méthodes concrètes — RACI, AMDEC, planning, résolution de problèmes — avec des exemples
          réels et des modèles que vous pouvez reprendre directement.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{
                display: 'block',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '20px 22px',
                color: 'inherit',
              }}
            >
              <h2 style={{ margin: '0 0 8px', fontSize: 19, letterSpacing: '-0.01em' }}>{post.title}</h2>
              <p style={{ margin: 0, fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
