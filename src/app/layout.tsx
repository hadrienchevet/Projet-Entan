import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pilotix',
  description:
    'Pilotage de projets industriels — RACI, AMDEC, actions et planning, en équipe et en temps réel.',
};

/** Applique le thème avant le premier rendu (pas de flash clair/sombre). */
const themeInit = `(function(){try{var t=localStorage.getItem('pilotix-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

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
