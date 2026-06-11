'use client';

import { useEffect, useState } from 'react';

/**
 * Bascule clair / sombre : classe .dark sur <html>, persistée en
 * localStorage. Le choix initial (script anti-flash dans le layout racine)
 * suit la préférence système si l'utilisateur n'a rien choisi.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('pilotix-theme', next ? 'dark' : 'light');
    } catch {
      // stockage indisponible (navigation privée…) : le choix vaut pour la session
    }
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
      title={dark ? 'Thème clair' : 'Thème sombre'}
    >
      {dark ? (
        /* soleil */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        /* lune */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
      )}
    </button>
  );
}
