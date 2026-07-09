import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f5' },
    { media: '(prefers-color-scheme: dark)', color: '#262624' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://projetentan.fr'),
  title: {
    default: 'Projet Entan — Gestion de projet industriel et résolution de problèmes',
    template: '%s · Projet Entan',
  },
  description:
    'Pilotez vos projets industriels et vos démarches qualité en un seul outil : RACI, AMDEC, plan d’action, planning, Ishikawa, 5 pourquoi, SWOT et A3. Essai gratuit 14 jours.',
  applicationName: 'Projet Entan',
  authors: [{ name: 'Projet Entan' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Projet Entan',
    url: '/',
  },
};

/** Applique le thème avant le premier rendu (pas de flash clair/sombre). */
const themeInit = `(function(){try{var t=localStorage.getItem('entan-theme')||localStorage.getItem('pilotix-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
