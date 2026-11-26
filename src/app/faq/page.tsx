import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { PaperCanvas } from '@/components/PaperCanvas';

/**
 * FAQ publique — les questions posées avant de choisir un outil.
 *
 * Règle de rédaction : **ne rien affirmer qu'on ne puisse tenir**. Pas de
 * référence client inventée, pas de SLA, pas de délai d'engagement tant que
 * les conditions ne sont pas arrêtées. Une question sans réponse honnête
 * n'est pas posée ici.
 *
 * Les réponses sont du texte simple : elles alimentent aussi le balisage
 * FAQPage, qui ne sait pas lire du JSX. Les liens éventuels vont dans `more`.
 */

export const metadata: Metadata = {
  title: { absolute: 'Questions fréquentes — sécurité, données, tarif | ENTAN' },
  description:
    'Les réponses aux questions posées avant d’adopter ENTAN : hébergement des données en Europe, RGPD, utilisation de l’IA, différence avec Excel, adoption par l’équipe, export et réversibilité.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Questions fréquentes | ENTAN',
    description:
      'Hébergement, RGPD, IA, différence avec Excel, adoption, réversibilité : les réponses avant de choisir.',
    url: '/faq',
    type: 'article',
  },
};

interface Qa {
  q: string;
  /** Texte simple — sert à l'affichage ET au balisage FAQPage. */
  a: string;
  /** Complément affiché seulement sur la page (liens). */
  more?: ReactNode;
}

interface Group {
  id: string;
  label: string;
  tint: string;
  rot: string;
  items: Qa[];
}

const GROUPS: Group[] = [
  {
    id: 'demarrer',
    label: 'Démarrer',
    tint: 'var(--p-sage)',
    rot: '-0.35deg',
    items: [
      {
        q: 'Combien de temps faut-il pour mettre un projet en route ?',
        a: "Il n'y a ni WBS ni OBS à construire avant de commencer. Vous créez un projet, vous ajoutez votre équipe, vous saisissez vos premières actions. Les outils — AMDEC, RACI, planning, coûts, revue de projet, résolution de problème — s'activent un par un, et seulement ceux dont vous avez besoin. Vous pouvez aussi ouvrir un projet de démonstration déjà rempli pour voir à quoi ressemble le résultat avant de saisir quoi que ce soit.",
        more: (
          <p>
            <Link href="/demo-amdec">Ouvrir un exemple rempli →</Link>
          </p>
        ),
      },
      {
        q: 'Dois-je ressaisir tous mes fichiers Excel existants ?',
        a: "Non, et ce n'est pas conseillé. Il n'existe pas d'import automatique aujourd'hui. En pratique, on ne reprend pas l'historique : on démarre sur un projet en cours, avec les actions et les risques encore ouverts. C'est en général une poignée de lignes, pas un chantier de reprise.",
      },
      {
        q: 'Est-ce que ça fonctionne sur téléphone et tablette ?',
        a: "Oui. L'interface s'adapte aux écrans de téléphone : la navigation passe en menu latéral, et les vues larges comme le planning ou les tableaux AMDEC défilent horizontalement sans déformer la page.",
      },
      {
        q: 'Qui peut voir quoi dans mon organisation ?',
        a: "L'accès se règle projet par projet. Un membre de votre organisation ne voit que les projets auxquels il a été explicitement ajouté. Le cloisonnement est appliqué côté base de données, pas seulement dans l'interface.",
        more: (
          <p>
            Détail dans la <Link href="/securite">fiche sécurité</Link>.
          </p>
        ),
      },
    ],
  },
  {
    id: 'excel',
    label: 'Par rapport à Excel et aux autres outils',
    tint: 'var(--p-sand)',
    rot: '0.3deg',
    items: [
      {
        q: 'En quoi est-ce différent d’un fichier Excel partagé ?',
        a: "Une information n'est saisie qu'une seule fois. Un risque coté en AMDEC au-dessus du seuil critique génère son action corrective ; cette action porte son responsable au sens RACI, apparaît dans le planning à son échéance, peut être chiffrée dans les coûts, et remonte d'elle-même dans le compte-rendu de revue. Dans Excel, ces cinq vues sont cinq fichiers qu'il faut maintenir cohérents à la main — et c'est ce travail de recopie qui finit par être abandonné.",
      },
      {
        q: 'Ce n’est pas simplement de la centralisation d’informations ?',
        a: "La centralisation seule n'apporte pas grand-chose : un dossier partagé la fait déjà. Ce qui change ici, c'est le lien entre les outils. Changer une échéance met le planning à jour ; clôturer une revue fige un compte-rendu qui reprend l'avancement réel ; supprimer un doublon est impossible puisque la donnée n'existe qu'à un endroit. C'est la suppression de la double saisie qui crée la valeur, pas le fait de tout ranger au même endroit.",
      },
      {
        q: 'J’utilise déjà MS Project, Monday ou Notion. Pourquoi changer ?',
        a: "Ces outils planifient très bien, mais ils ne connaissent pas les méthodes industrielles : l'AMDEC et le calcul de criticité, la matrice RACI, la revue de projet avec compte-rendu figé, la résolution de problème en sept phases. Vous finissez par les reconstruire dans des tableurs à côté, et le lien entre les deux se perd. ENTAN les intègre nativement.",
        more: (
          <p>
            Le détail de chaque méthode est expliqué dans le{' '}
            <Link href="/methodes">guide des méthodes</Link>.
          </p>
        ),
      },
    ],
  },
  {
    id: 'adoption',
    label: 'Adoption par l’équipe',
    tint: 'var(--p-rose)',
    rot: '-0.3deg',
    items: [
      {
        q: 'Mon équipe n’est pas à l’aise avec l’informatique. Va-t-elle s’en servir ?',
        a: "C'est la difficulté la plus citée par les chefs de projet que nous avons interrogés, et il faut être honnête : aucun logiciel ne la résout à lui seul. Ce qu'un outil peut faire, c'est réduire la friction — pas de paramétrage préalable, pas de double saisie, et une valeur visible dès la première semaine. La décision d'y aller, elle, reste managériale. Nous préférons le dire plutôt que de promettre l'inverse.",
      },
      {
        q: 'Y a-t-il une formation ?',
        a: "Oui, intégrée et sans supplément. Un guide explique chaque méthode, à quoi elle sert, quand s'en servir et comment la mener dans l'outil. Une académie propose ensuite des exercices courts sur des cas concrets, avec un badge par outil et une certification quand le parcours est complet.",
      },
      {
        q: 'Que se passe-t-il si le chef de projet quitte l’entreprise ?',
        a: "Le projet appartient à l'organisation, pas à la personne. Les actions, les risques et les comptes-rendus restent en place, et un autre membre reprend la main. Le résumé de projet exportable permet aussi de transmettre l'état complet d'un dossier à quelqu'un qui le découvre.",
      },
    ],
  },
  {
    id: 'donnees',
    label: 'Sécurité et données',
    tint: 'var(--p-sky)',
    rot: '0.35deg',
    items: [
      {
        q: 'Où sont hébergées nos données ?',
        a: "Dans l'Union européenne, en Irlande. Aucune donnée de projet n'est stockée hors UE.",
        more: (
          <p>
            Hébergement, chiffrement, sauvegardes et sous-traitants sont détaillés dans la{' '}
            <Link href="/securite">fiche sécurité</Link>.
          </p>
        ),
      },
      {
        q: 'Êtes-vous conformes au RGPD ? Un DPA est-il disponible ?',
        a: "Oui. Un accord de sous-traitance (DPA) est mis à disposition, ainsi qu'une politique de confidentialité détaillant les données traitées et leur durée de conservation.",
        more: (
          <p>
            <Link href="/dpa">Accord de sous-traitance</Link> ·{' '}
            <Link href="/confidentialite">Politique de confidentialité</Link>
          </p>
        ),
      },
      {
        q: 'Utilisez-vous nos données pour entraîner une intelligence artificielle ?',
        a: "Non. Il n'y a aucune intelligence artificielle dans ENTAN, et vos données ne servent à entraîner aucun modèle. La fonction « Contexte IA » fabrique un résumé de votre projet directement dans votre navigateur : rien n'est transmis, ni à nous ni à un tiers, tant que vous ne collez pas vous-même ce texte dans l'assistant de votre choix. Une option permet d'anonymiser les noms de l'équipe avant de le faire.",
      },
      {
        q: 'Puis-je récupérer mes données si j’arrête ?',
        a: "Oui. Chaque outil s'exporte en PDF — AMDEC, coûts, charte A3, SWOT, compte-rendu de revue, résolution de problème — et le résumé complet d'un projet s'exporte en Markdown. Pour un export intégral de vos données brutes, il suffit de le demander : nous ne retenons pas les données de nos utilisateurs.",
      },
    ],
  },
  {
    id: 'tarif',
    label: 'Tarif',
    tint: 'var(--p-lilac)',
    rot: '-0.25deg',
    items: [
      {
        q: 'Combien ça coûte ?',
        a: "La facturation se fait par utilisateur actif : vous ne payez que pour les personnes qui se servent réellement de l'outil, pas pour des comptes dormants. L'essai est gratuit et ne demande pas de carte bancaire. ENTAN est aujourd'hui en phase d'accès anticipé : les premiers utilisateurs bénéficient d'un accès offert, et la grille tarifaire sera communiquée avant toute facturation.",
      },
      {
        q: 'Faut-il une carte bancaire pour essayer ?',
        a: "Non. La création de compte et l'essai ne demandent aucun moyen de paiement.",
      },
    ],
  },
];

const css = `
.faq-hero { text-align: center; padding: 58px 0 6px; }
.faq-eyebrow { display: inline-block; font-size: 12.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); background: rgb(255 255 255 / 0.7); border: 1px solid var(--accent-faint); border-radius: 999px; padding: 5px 15px; margin-bottom: 20px; }
.faq-hero h1 { font-size: 42px; line-height: 1.1; letter-spacing: -0.025em; max-width: 720px; margin: 0 auto 16px; }
.faq-hero .sub { font-size: 17px; line-height: 1.65; color: var(--text-secondary); max-width: 640px; margin: 0 auto; }

.faq-group { padding: 34px 32px 28px; margin: 40px 0; }
.faq-group > h2 { font-family: var(--font-serif); font-size: 26px; letter-spacing: -0.02em; margin: 0 0 18px; }

.faq-item { background: #fffdf9; border-radius: 18px 8px 16px 10px / 10px 16px 8px 18px; margin-bottom: 10px; box-shadow: 0 1px 0 rgb(255 255 255 / 0.9) inset, 0 8px 22px rgb(31 30 27 / 0.06); }
.faq-item:last-child { margin-bottom: 0; }
.faq-item > summary { display: flex; align-items: center; gap: 12px; padding: 15px 17px; cursor: pointer; list-style: none; font-size: 15.5px; font-weight: 600; line-height: 1.4; color: #1f1e1d; }
.faq-item > summary::-webkit-details-marker { display: none; }
.faq-item > summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: inherit; }
.faq-item .chev { flex-shrink: 0; width: 16px; height: 16px; margin-left: auto; color: #b9b5a9; transition: transform 0.2s ease; }
.faq-item[open] .chev { transform: rotate(180deg); }
.faq-body { padding: 0 17px 16px; }
.faq-body p { font-size: 14.5px; line-height: 1.75; color: var(--text-secondary); margin: 0; }
.faq-body p + p { margin-top: 10px; }
.faq-body a { color: var(--accent-text); font-weight: 600; }

.faq-outro { text-align: center; margin: 38px 0 0; font-size: 14.5px; line-height: 1.7; color: var(--ink-soft); }
.faq-outro a { color: var(--accent-text); font-weight: 600; }

@media (max-width: 760px) {
  .faq-hero { padding: 38px 0 4px; }
  .faq-hero h1 { font-size: 30px; }
  .faq-group { padding: 24px 17px 20px; margin: 28px 0; border-radius: 26px 12px 24px 14px / 14px 24px 12px 26px; }
  .faq-group > h2 { font-size: 22px; }
}
`;

const Chevron = () => (
  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function Page() {
  /* Balisage FAQPage : c'est lui qui peut faire apparaître les questions
     directement dans les résultats de recherche. Il reprend mot pour mot les
     réponses affichées — Google pénalise un balisage qui diverge de la page. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GROUPS.flatMap((g) =>
      g.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  };

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PaperCanvas>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="paper-wrap">
          <header className="faq-hero">
            <span className="faq-eyebrow">Questions fréquentes</span>
            <h1>Ce qu’on nous demande avant de se lancer</h1>
            <p className="sub">
              Hébergement des données, différence avec un tableur, adoption par l’équipe,
              réversibilité, tarif. Les réponses sont volontairement directes — y compris quand
              elles ne vont pas dans notre sens.
            </p>
          </header>

          {GROUPS.map((group) => (
            <section
              key={group.id}
              id={group.id}
              className="paper-sheet faq-group"
              style={{ ['--sheet' as string]: group.tint, ['--rot' as string]: group.rot }}
            >
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>
                    {item.q}
                    <Chevron />
                  </summary>
                  <div className="faq-body">
                    <p>{item.a}</p>
                    {item.more}
                  </div>
                </details>
              ))}
            </section>
          ))}

          <p className="faq-outro">
            Une question qui ne figure pas ici ? Le <Link href="/methodes">guide des méthodes</Link>{' '}
            détaille chaque outil, et la <Link href="/securite">fiche sécurité</Link> répond aux
            questions techniques de votre service informatique.
          </p>
        </div>
      </PaperCanvas>
    </PublicShell>
  );
}
