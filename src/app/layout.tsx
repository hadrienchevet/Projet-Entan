import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
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
    default: 'ENTAN — Gestion de projet industriel et résolution de problèmes',
    template: '%s · ENTAN',
  },
  description:
    'Pilotez vos projets industriels et vos démarches qualité en un seul outil : RACI, AMDEC, plan d’action, planning, Ishikawa, 5 pourquoi, SWOT et A3. Essai gratuit 14 jours.',
  applicationName: 'ENTAN',
  authors: [{ name: 'ENTAN' }],
  // Icône sous un nouveau nom de fichier, en plus de app/icon.png et
  // app/favicon.ico (inchangés) : Google Search met en cache très longtemps
  // le favicon par nom de fichier, un nouveau nom force une réévaluation.
  icons: {
    icon: [{ url: '/entan-icon-2026.png', type: 'image/png', sizes: '256x256' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'ENTAN',
    url: '/',
  },
  verification: {
    google: 'ewKuVw48Tlb9bZcwNzC3KOhxrYUPpIKR3kTubd_qWPA',
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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
