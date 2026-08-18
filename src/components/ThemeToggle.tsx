'use client';

import { useSyncExternalStore } from 'react';

/* La source de vérité du thème est le DOM (classe .dark sur <html>), posée
   avant l'hydratation par le script anti-flash du layout racine. On s'y
   abonne plutôt que d'en recopier l'état dans un useState : deux surfaces le
   pilotent en même temps (ce bouton et le menu utilisateur), et une copie
   locale les désynchroniserait. */
let listeners: (() => void)[] = [];

function subscribe(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function isDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

/** Au rendu serveur la classe n'existe pas encore : on part du thème clair. */
function isDarkOnServer(): boolean {
  return false;
}

/**
 * État du thème clair / sombre : classe .dark sur <html>, persistée en
 * localStorage. Le choix initial suit la préférence système si l'utilisateur
 * n'a rien choisi. La clé localStorage et le nom de la classe ne doivent
 * exister qu'ici.
 */
export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark, isDarkOnServer);

  const toggle = () => {
    const next = !isDark();
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('entan-theme', next ? 'dark' : 'light');
    } catch {
      // stockage indisponible (navigation privée…) : le choix vaut pour la session
    }
    listeners.forEach((l) => l());
  };

  return { dark, toggle };
}

/** Soleil (thème sombre actif → on propose le clair). */
export const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
  </svg>
);

/** Lune (thème clair actif → on propose le sombre). */
export const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
  </svg>
);

export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
      title={dark ? 'Thème clair' : 'Thème sombre'}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
