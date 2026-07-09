import type { MetadataRoute } from 'next';

/** Plan du site — uniquement les pages publiques et indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://projetentan.fr';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/methodes`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/cgv`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/dpa`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/securite`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
