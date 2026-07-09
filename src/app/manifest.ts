import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ENTAN — Gestion de projet industriel',
    short_name: 'ENTAN',
    description:
      'Le logiciel de gestion de projet pour l’industrie : planning, actions, risques et reporting au même endroit.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#faf9f5',
    theme_color: '#c15f3c',
    lang: 'fr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
