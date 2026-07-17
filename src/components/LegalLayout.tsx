import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

const css = `
.legal-wrap { min-height: 100vh; padding: 32px 20px; }
.legal-inner { max-width: 760px; margin: 0 auto; }
.legal-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; gap: 16px; }
.legal-brand { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text); font-weight: 700; }
.legal-brand .logo { width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 12px; }
.legal-top nav { display: flex; gap: 16px; font-size: 13px; }
.legal-top nav a { color: var(--accent); text-decoration: none; }
.legal { color: var(--text-secondary); line-height: 1.7; font-size: 14px; }
.legal h1 { color: var(--text); font-size: 26px; margin: 0 0 6px; }
.legal h2 { color: var(--text); font-size: 16px; margin: 28px 0 8px; }
.legal ul { padding-left: 20px; margin: 8px 0; }
.legal a { color: var(--accent); }
.legal .muted { color: var(--text-muted); font-size: 12.5px; margin-top: 32px; }
.legal .ph { color: var(--warning); font-weight: 600; }
`;

/** Coquille simple et lisible pour les pages légales (publiques, hors workspace). */
export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="legal-wrap">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="legal-inner">
        <div className="legal-top">
          <Link href="/" className="legal-brand">
            <Image src="/entan-logo-t.png" alt="" width={28} height={28} /> Projet Entan
          </Link>
          <nav>
            <Link href="/cgv">CGV</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/dpa">DPA</Link>
          </nav>
        </div>
        <article className="legal">
          <h1>{title}</h1>
          {children}
        </article>
      </div>
    </main>
  );
}
