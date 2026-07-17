import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Coquille des pages publiques (hors app) : nav + bandeau CTA + footer, et
 * surtout les tokens du **mode clair redéfinis** sur `.pub` — la page reste
 * claire même si l'app est en thème sombre. Réutilisée par les pages de contenu
 * SEO (ex. /methodes).
 */

const css = `
.pub {
  --bg: #faf9f5; --surface: #ffffff; --surface-2: #ece9e0; --sidebar-bg: #f0eee6;
  --border: #e6e4db; --border-strong: #d5d2c6;
  --text: #1f1e1d; --text-secondary: #5d5c56; --text-muted: #9d9a8f;
  --hover: rgb(0 0 0 / 0.05); --stripe: rgb(0 0 0 / 0.03);
  --accent: #c15f3c; --accent-hover: #a84f2f; --accent-soft: #f5e9e2;
  --accent-text: #a84f2f; --accent-faint: #ecd0c2;
  --danger: #b3372e; --danger-soft: #f8e9e7; --danger-border: #ecc8c2;
  --warning: #92660f; --warning-soft: #f6eed9;
  --success: #2e7d4f; --success-soft: #e8f2ea;
  --radius: 8px; --radius-sm: 6px;
  --shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.04);
  --shadow-modal: 0 8px 30px rgb(0 0 0 / 0.16);
  background: var(--bg); color: var(--text); min-height: 100vh;
}
.pub a { text-decoration: none; }
.pub-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.pub-nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
.pub-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 17px; letter-spacing: 0.02em; color: var(--text); }
.pub-brand .mark { width: 34px; height: 34px; border-radius: 9px; background: var(--accent); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 13px; }
.pub-nav-actions { display: flex; align-items: center; gap: 10px; }
.pub-band { text-align: center; background: var(--accent-soft); border: 1px solid var(--accent-faint); border-radius: 18px; padding: 40px 24px; margin: 40px 0; }
.pub-band h2 { font-size: 26px; margin: 0 0 10px; }
.pub-band p { color: var(--text-secondary); font-size: 15px; margin: 0 auto 20px; max-width: 520px; line-height: 1.6; }
.pub-foot { border-top: 1px solid var(--border); padding: 28px 0 52px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.pub-foot-links { display: flex; gap: 18px; flex-wrap: wrap; }
.pub-foot a { color: var(--text-secondary); font-size: 13px; }
.pub-foot a:hover { color: var(--text); }
.pub-foot .cr { color: var(--text-muted); font-size: 13px; }

/* Article de blog — typographie longue lecture */
.pub-article { max-width: 720px; margin: 0 auto; padding: 8px 0 20px; }
.pub-article .back { display: inline-block; font-size: 13.5px; color: var(--text-secondary); margin-bottom: 22px; }
.pub-article .back:hover { color: var(--text); }
.pub-article .eyebrow { display: inline-block; font-size: 12.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); background: var(--accent-soft); border-radius: 999px; padding: 5px 14px; margin-bottom: 16px; }
.pub-article h1 { font-family: inherit; font-size: 34px; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 10px; }
.pub-article .date { font-size: 13.5px; color: var(--text-muted); margin-bottom: 36px; }
.pub-article .lead { font-size: 17px; line-height: 1.6; color: var(--text-secondary); margin: 0 0 32px; }
.pub-article h2 { font-size: 23px; letter-spacing: -0.01em; margin: 40px 0 14px; }
.pub-article h3 { font-size: 17px; margin: 26px 0 10px; }
.pub-article p { font-size: 15.5px; line-height: 1.7; color: var(--text-secondary); margin: 0 0 16px; }
.pub-article strong { color: var(--text); }
.pub-article ul, .pub-article ol { margin: 0 0 16px; padding-left: 22px; }
.pub-article li { font-size: 15.5px; line-height: 1.65; color: var(--text-secondary); margin-bottom: 8px; }
.pub-article .table-wrap { overflow-x: auto; margin: 24px 0; }
.pub-article table { width: 100%; border-collapse: collapse; min-width: 480px; }
.pub-article th, .pub-article td { text-align: left; padding: 10px 14px; font-size: 14px; border: 1px solid var(--border); }
.pub-article thead th { background: var(--surface-2); font-weight: 600; }
.pub-article .callout { background: var(--accent-soft); border: 1px solid var(--accent-faint); border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
.pub-article .callout p { margin: 0; color: var(--text); font-size: 14.5px; }
`;

export function PublicShell({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="pub">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="pub-wrap">
        <nav className="pub-nav">
          <Link href="/" className="pub-brand"><span className="mark">EN</span> ENTAN</Link>
          <span className="pub-nav-actions">
            <Link href="/login" className="btn btn-sm">Se connecter</Link>
            <Link href="/login?mode=signup" className="btn btn-primary btn-sm">Essai gratuit</Link>
          </span>
        </nav>
      </div>

      {children}

      <div className="pub-wrap">
        <div className="pub-band">
          <h2>Prêt à appliquer ces méthodes ?</h2>
          <p>Créez votre compte et pilotez votre premier projet gratuitement pendant 14 jours.</p>
          <Link href="/login?mode=signup" className="btn btn-primary">Démarrer gratuitement</Link>
        </div>

        <footer className="pub-foot">
          <span className="pub-brand"><span className="mark">EN</span> ENTAN</span>
          <span className="pub-foot-links">
            <Link href="/">Accueil</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/login">Connexion</Link>
            <Link href="/cgv">CGV</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </span>
          <span className="cr">© {year} ENTAN</span>
        </footer>
      </div>
    </div>
  );
}
