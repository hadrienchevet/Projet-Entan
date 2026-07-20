import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogLayout } from '@/components/BlogLayout';
import { BLOG_POSTS } from '@/content/blog-posts';

const post = BLOG_POSTS.find((p) => p.slug === 'meilleur-logiciel-gestion-projet-industriel')!;

export const metadata: Metadata = {
  title: { absolute: `${post.title} | ENTAN` },
  description: post.description,
  keywords: [
    'meilleur logiciel gestion de projet industriel',
    'logiciel gestion de projet industrie',
    'comparatif logiciel gestion de projet',
    'alternative ms project',
    'logiciel gestion de projet PME industrielle',
    'outil pilotage projet industriel',
  ],
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `/blog/${post.slug}`,
    type: 'article',
  },
};

/** FAQ de l'article, exposée aussi en JSON-LD FAQPage (format repris par les moteurs et assistants IA). */
const FAQ = [
  {
    q: 'Quel est le meilleur logiciel de gestion de projet pour une PME industrielle ?',
    a: 'Cela dépend de ce qui pilote vos projets. Si vos revues de projet reposent sur des méthodes qualité (AMDEC, RACI, Ishikawa, A3), un outil spécialisé industrie comme ENTAN les intègre nativement. Si votre besoin est un planning multi-ressources très complexe, MS Project reste la référence. Pour un simple suivi de tâches, un généraliste comme Monday ou Trello suffit.',
  },
  {
    q: 'Peut-on gérer un projet industriel avec Excel ?',
    a: 'Oui, et c’est le point de départ de la plupart des équipes. Les limites apparaissent quand le projet grossit : planning, plan d’action et risques vivent dans des fichiers séparés jamais à jour en même temps, personne ne sait quelle version fait foi, et chaque revue de projet se prépare à la main.',
  },
  {
    q: 'Quelle alternative à MS Project pour l’industrie ?',
    a: 'MS Project excelle sur le planning mais ne couvre ni l’AMDEC, ni le RACI, ni le plan d’action, ni la résolution de problèmes. Une alternative comme ENTAN couvre le planning Gantt à un niveau suffisant pour la plupart des projets industriels et y ajoute les méthodes métier connectées entre elles, avec une prise en main en minutes plutôt qu’en semaines.',
  },
  {
    q: 'Trello, Monday ou Notion conviennent-ils à un projet industriel ?',
    a: 'Ils peuvent convenir, mais tout est à construire soi-même : la cotation de criticité AMDEC, la matrice RACI, les gabarits A3 deviennent des colonnes et des bases bricolées, sans lien entre elles. Beaucoup d’équipes finissent avec un tableau de tâches que plus personne ne met à jour.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Page() {
  return (
    <BlogLayout title={post.title} description={post.description} date={post.date} slug={post.slug}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <p className="lead">
        La plupart des comparatifs de logiciels de gestion de projet alignent les mêmes outils
        généralistes et les départagent sur des critères qui ne concernent pas l’industrie. Or piloter
        une industrialisation, un transfert de ligne ou un projet d’amélioration continue ne pose pas
        les mêmes questions que gérer une campagne marketing : où vivent l’AMDEC, le RACI et le plan
        d’action ? Qui prépare la revue de projet ? Voici un comparatif construit sur ces critères-là —
        avec les forces et les limites réelles de chaque option, y compris la nôtre.
      </p>

      <h2>Les critères qui comptent pour un projet industriel</h2>
      <p>
        Avant de comparer, posons ce qu’un chef de projet, un responsable méthodes ou un responsable
        industrialisation demande réellement à son outil :
      </p>
      <ul>
        <li>
          <strong>Les méthodes métier intégrées.</strong> AMDEC avec cotation de criticité,{' '}
          <Link href="/blog/matrice-raci-exemple-guide">matrice RACI</Link>, Ishikawa, 5 Pourquoi,
          charte A3 : si l’outil ne les connaît pas, vous les reconstruirez dans des fichiers à côté —
          et le problème des données dispersées reste entier.
        </li>
        <li>
          <strong>Le lien entre les méthodes.</strong> Une cause identifiée en Ishikawa doit devenir une
          action du plan d’action ; une action corrective d’<Link href="/blog/amdec-methode-exemple">AMDEC</Link>{' '}
          doit être suivie jusqu’à sa résolution. Des méthodes juxtaposées sans lien se désynchronisent.
        </li>
        <li>
          <strong>La revue de projet.</strong> Combien de temps faut-il pour produire un état d’avancement
          fiable ? C’est le coût caché numéro un des outils génériques.
        </li>
        <li>
          <strong>La prise en main.</strong> Un outil que l’équipe projet n’adopte pas en quelques jours
          finira abandonné au profit des fichiers Excel qu’il devait remplacer.
        </li>
        <li>
          <strong>La collaboration et l’hébergement.</strong> Travail à plusieurs en temps réel, et pour
          les données industrielles, hébergement dans l’Union européenne conforme RGPD.
        </li>
      </ul>

      <h2>Excel : le point de départ (et le vrai concurrent de tous les autres)</h2>
      <p>
        Soyons honnêtes : la majorité des projets industriels sont aujourd’hui pilotés dans Excel, et ce
        n’est pas par ignorance. Excel est déjà payé, tout le monde sait s’en servir, et il fait tout —
        planning, plan d’action, AMDEC, budget.
      </p>
      <p>
        Le problème n’est pas Excel, c’est <strong>la multiplication des fichiers</strong> : le planning
        dans un classeur, les actions dans un autre, les risques dans un troisième, jamais à jour en même
        temps. Pas de collaboration temps réel fiable, pas d’alerte quand une échéance dérape, et chaque
        revue de projet est une soirée de consolidation manuelle — pour un état déjà périmé le lendemain.
      </p>
      <p>
        <strong>Pour qui :</strong> un projet ponctuel et simple, mené seul ou presque.
      </p>

      <h2>MS Project : la référence du planning pur</h2>
      <p>
        Microsoft Project reste l’outil de planification le plus puissant du marché : dépendances
        complexes, nivellement de ressources, chemin critique, plannings de plusieurs milliers de lignes.
        C’est le standard chez beaucoup de grands donneurs d’ordres.
      </p>
      <p>
        Ses limites sont le miroir de sa force : une courbe d’apprentissage sérieuse (c’est souvent
        l’outil d’un planificateur dédié, pas de toute l’équipe), un coût par utilisateur significatif,
        et surtout un périmètre centré sur le planning. AMDEC, RACI, plan d’action, résolution de
        problèmes, reporting de revue : tout le reste du pilotage industriel se fait ailleurs.
      </p>
      <p>
        <strong>Pour qui :</strong> des plannings très complexes multi-ressources, avec un planificateur
        dédié dans l’équipe.
      </p>

      <h2>Monday, Asana, Trello : les généralistes modernes</h2>
      <p>
        Collaboratifs, agréables à utiliser, riches en intégrations : les généralistes ont largement
        remplacé Excel pour le suivi de tâches dans les équipes marketing, RH ou services. Sur ce
        terrain-là, ils sont excellents.
      </p>
      <p>
        Pour un projet industriel, ils partent d’une page blanche : la cotation de criticité AMDEC
        devient une colonne de chiffres sans formule métier, le RACI un champ texte, la charte A3 un
        document à côté. Rien n’est relié, le vocabulaire ne parle pas industrie, et l’expérience montre
        que ces tableaux dérivent vite en murs de post-its numériques que plus personne ne met à jour.
      </p>
      <p>
        <strong>Pour qui :</strong> du suivi de tâches générique, des équipes hors production.
      </p>

      <h2>Jira : excellent — pour le développement logiciel</h2>
      <p>
        Jira est la référence des équipes logicielles : sprints, backlog, tickets, workflows
        personnalisables à l’infini. Si vos projets sont des projets de développement, c’est un très bon
        choix. Mais sa logique — itérations courtes, flux de tickets — correspond mal au cycle d’un
        projet industriel jalonné (conception, industrialisation, qualification, production), et son
        paramétrage est un projet en soi.
      </p>
      <p>
        <strong>Pour qui :</strong> les équipes de développement logiciel, sans hésiter. Les autres, très
        rarement.
      </p>

      <h2>Notion : le couteau suisse documentaire</h2>
      <p>
        Notion brille comme wiki d’équipe et base documentaire, et certains y construisent leur suivi de
        projet. C’est précisément sa limite : c’est un outil de construction. Gantt et dépendances
        restent sommaires, aucune méthode industrielle n’existe nativement, et la qualité du résultat
        dépend entièrement du temps que quelqu’un investit à bâtir puis maintenir le système.
      </p>
      <p>
        <strong>Pour qui :</strong> la documentation et la connaissance d’équipe — en complément d’un
        outil de pilotage, pas à sa place.
      </p>

      <h2>ENTAN : le spécialiste du pilotage industriel</h2>
      <p>
        <Link href="/">ENTAN</Link> — c’est nous, jugez donc ce paragraphe avec la distance qui s’impose —
        prend le problème à l’envers des généralistes : plutôt qu’une page blanche à configurer, les
        méthodes de pilotage industriel sont intégrées <em>et reliées entre elles</em>. L’AMDEC cote la
        criticité (Gravité × Occurrence × Détectabilité) et ses actions correctives vivent dans le plan
        d’action ; chaque action porte son RACI ; une cause d’Ishikawa devient une action suivie ; le
        reporting de revue de projet et la charte A3 se génèrent à partir des données, sans consolidation
        manuelle. Le planning Gantt, le suivi des coûts et un tableau de bord d’avancement complètent le
        pilotage. L’application est 100 % web, en français, hébergée dans l’Union européenne (RGPD), avec
        des exercices de formation intégrés et un essai gratuit de 14 jours sans carte bancaire.
      </p>
      <p>
        Les limites, honnêtement : ENTAN est un produit jeune, édité par une startup française — le
        périmètre est volontairement resserré sur le pilotage industriel, sans la profondeur de
        planification d’un MS Project ni l’écosystème d’intégrations d’un Monday. Si vos projets sont du
        développement logiciel, Jira vous servira mieux.
      </p>
      <p>
        <strong>Pour qui :</strong> chefs de projet, responsables méthodes, industrialisation et
        amélioration continue en PME et ETI industrielles, qui pilotent aujourd’hui dans Excel.
      </p>

      <h2>Tableau comparatif</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Critère</th>
              <th>Excel</th>
              <th>MS Project</th>
              <th>Monday / Asana / Trello</th>
              <th>Jira</th>
              <th>ENTAN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Méthodes industrielles (AMDEC, RACI, Ishikawa, A3)</td>
              <td>À construire soi-même</td>
              <td>Absentes</td>
              <td>À reconstruire en colonnes</td>
              <td>Absentes</td>
              <td>Intégrées et connectées</td>
            </tr>
            <tr>
              <td>Planning Gantt</td>
              <td>Rudimentaire</td>
              <td>Le plus puissant du marché</td>
              <td>Correct</td>
              <td>Orienté sprints</td>
              <td>Intégré, retards visibles</td>
            </tr>
            <tr>
              <td>Reporting de revue de projet</td>
              <td>Manuel</td>
              <td>Centré planning</td>
              <td>Manuel</td>
              <td>Orienté dev</td>
              <td>Généré automatiquement</td>
            </tr>
            <tr>
              <td>Prise en main</td>
              <td>Immédiate (mais tout à bâtir)</td>
              <td>Longue</td>
              <td>Rapide</td>
              <td>Paramétrage lourd</td>
              <td>Quelques minutes</td>
            </tr>
            <tr>
              <td>Collaboration temps réel</td>
              <td>Limitée</td>
              <td>Limitée</td>
              <td>Oui</td>
              <td>Oui</td>
              <td>Oui</td>
            </tr>
            <tr>
              <td>Pensé pour</td>
              <td>Tout (donc rien)</td>
              <td>Les planificateurs</td>
              <td>Le suivi de tâches générique</td>
              <td>Le développement logiciel</td>
              <td>Les projets industriels</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Comment choisir selon votre situation</h2>
      <ul>
        <li>
          <strong>Vos projets sont du développement logiciel :</strong> Jira, sans débat.
        </li>
        <li>
          <strong>Votre enjeu est un planning multi-ressources très complexe</strong>, avec un
          planificateur dédié : MS Project reste la référence.
        </li>
        <li>
          <strong>Vous suivez des tâches génériques hors production :</strong> un généraliste type Monday
          ou Trello fera très bien l’affaire.
        </li>
        <li>
          <strong>Vous pilotez des projets industriels dans Excel</strong> et vos revues reposent sur
          l’AMDEC, le RACI et un plan d’action : c’est exactement le cas pour lequel ENTAN est construit —
          l’<Link href="/login?mode=signup">essai de 14 jours</Link> se fait sans carte bancaire, sur vos
          vrais projets.
        </li>
      </ul>

      <div className="callout">
        <p>
          <strong>Le conseil qui vaut pour tous les outils :</strong> testez sur un projet réel, pas sur
          une démo. Un logiciel de gestion de projet se juge à la deuxième revue de projet — celle où
          l’équipe l’a adopté, ou est déjà retournée à ses fichiers.
        </p>
      </div>

      <h2>Questions fréquentes</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <h2>Pour aller plus loin</h2>
      <p>
        Le choix de l’outil ne remplace pas la maîtrise des méthodes. Nos guides pratiques détaillent
        comment construire une <Link href="/blog/matrice-raci-exemple-guide">matrice RACI qui tient la route</Link>{' '}
        et mener une <Link href="/blog/amdec-methode-exemple">AMDEC avec une cotation de criticité utile</Link> —
        et la page <Link href="/methodes">méthodes de gestion de projet industriel</Link> montre comment
        elles se connectent entre elles.
      </p>
    </BlogLayout>
  );
}
