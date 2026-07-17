import type { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/content/blog-posts';

/** Plan du site — uniquement les pages publiques et indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://projetentan.fr';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/methodes`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...BLOG_POSTS.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    { url: `${base}/cgv`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/dpa`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/securite`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
