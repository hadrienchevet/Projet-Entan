'use client';

/**
 * Menu utilisateur du bas de la sidebar.
 *
 * Regroupe ce qui relève du compte et non du projet — compte, organisation,
 * abonnement, thème, déconnexion — pour que la sidebar ne montre en
 * permanence que la navigation projet. Va dans le sens du modèle cible
 * (MODELE-ORGANISATION.md) : les surfaces « gens » se réduisent, et le point
 * d'entrée reste « mon email dans la sidebar ».
 *
 * S'ouvre vers le HAUT : il est ancré en bas de l'écran.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconHelp, IconLogout, IconStar, IconUser, IconUsers } from './icons';
import { IconMoon, IconSun, useTheme } from './ThemeToggle';

/** Routes accessibles depuis ce menu — sert à marquer le déclencheur actif. */
const MENU_ROUTES = ['/compte', '/equipe', '/abonnement'];

export function SidebarUserMenu({
  userEmail,
  subscriptionNote,
}: {
  userEmail: string | null;
  /** Ex. « Offert » — affiché à côté d'Abonnement. */
  subscriptionNote?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const { dark, toggle } = useTheme();

  const close = () => setOpen(false);

  // Fermeture au clic extérieur et à Échap (Échap rend le focus au déclencheur,
  // sinon la navigation au clavier repart du début du document).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // À l'ouverture, le focus entre dans le menu : sans ça, ouvrir au clavier
  // laisse l'utilisateur en dehors de ce qu'il vient d'ouvrir.
  useEffect(() => {
    if (!open) return;
    const first = pop.current?.querySelector<HTMLElement>('[role="menuitem"]');
    first?.focus();
  }, [open]);

  /** Flèches haut / bas entre les entrées, comme un vrai menu. */
  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(pop.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const onRouteFromMenu = MENU_ROUTES.includes(pathname);

  return (
    <div className="user-menu" ref={wrap}>
      {open && (
        <div
          className="user-menu-pop"
          role="menu"
          aria-label="Menu du compte"
          ref={pop}
          onKeyDown={onMenuKeyDown}
        >
          <div className="user-menu-head" title={userEmail ?? undefined}>
            {userEmail ?? '…'}
          </div>

          <Link href="/compte" role="menuitem" className="user-menu-item" onClick={close}>
            <IconUser /> Mon compte
          </Link>
          <Link href="/equipe" role="menuitem" className="user-menu-item" onClick={close}>
            <IconUsers /> Organisation
          </Link>
          <Link href="/abonnement" role="menuitem" className="user-menu-item" onClick={close}>
            <IconStar /> Abonnement
            {subscriptionNote && <span className="user-menu-note">{subscriptionNote}</span>}
          </Link>

          <div className="user-menu-sep" />

          <Link href="/help" role="menuitem" className="user-menu-item" onClick={close}>
            <IconHelp /> Aide &amp; Tutoriel
          </Link>

          {/* Le menu reste ouvert : on voit le thème basculer sans le rouvrir. */}
          <button type="button" role="menuitem" className="user-menu-item" onClick={toggle}>
            {dark ? <IconSun /> : <IconMoon />}
            {dark ? 'Thème clair' : 'Thème sombre'}
          </button>

          <div className="user-menu-sep" />

          <form action="/auth/signout" method="post">
            <button type="submit" role="menuitem" className="user-menu-item danger">
              <IconLogout /> Déconnexion
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        ref={trigger}
        className={`user-menu-trigger${open || onRouteFromMenu ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={userEmail ?? undefined}
      >
        <span className="user-menu-avatar" aria-hidden="true">
          {(userEmail ?? '?').charAt(0).toUpperCase()}
        </span>
        <span className="user-menu-email">{userEmail ?? '…'}</span>
        <svg
          className="user-menu-caret"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 15 12 9 18 15" />
        </svg>
      </button>
    </div>
  );
}
