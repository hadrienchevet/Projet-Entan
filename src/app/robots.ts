import type { MetadataRoute } from 'next';

/**
 * robots.txt — autorise les pages publiques, bloque les routes de l'app (qui
 * redirigent vers /login pour un visiteur non connecté) et les API, pour ne
 * pas gaspiller le budget de crawl ni indexer des pages inutiles.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/projets',
        '/actions',
        '/raci',
        '/amdec',
        '/planning',
        '/liens',
        '/couts',
        '/a3',
        '/swot',
        '/outils',
        '/access',
        '/equipe',
        '/abonnement',
        '/help',
        '/sujet',
        '/probleme',
        '/ishikawa',
        '/solutions',
        '/capa',
        '/standardisation',
        '/cinq-pourquoi',
        '/reset-password',
        '/invite/',
        '/rejoindre/',
        '/auth/',
        '/api/',
      ],
    },
    sitemap: 'https://projetentan.fr/sitemap.xml',
  };
}
