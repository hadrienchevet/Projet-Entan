import type { MetadataRoute } from 'next';

/** Routes de l'app (redirigent vers /login pour un visiteur non connecté) et API : inutiles à crawler. */
const APP_ROUTES = [
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
];

/**
 * Crawlers des assistants IA, autorisés explicitement (entraînement + recherche
 * + navigation à la demande) : être présent dans leurs index conditionne le
 * fait qu'ils recommandent ENTAN.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'CCBot',
  'Amazonbot',
];

/**
 * robots.txt — autorise les pages publiques (y compris pour les crawlers IA),
 * bloque les routes de l'app et les API, pour ne pas gaspiller le budget de
 * crawl ni indexer des pages inutiles.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: APP_ROUTES },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: APP_ROUTES },
    ],
    sitemap: 'https://projetentan.fr/sitemap.xml',
  };
}
