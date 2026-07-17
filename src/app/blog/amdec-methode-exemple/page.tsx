import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogLayout } from '@/components/BlogLayout';
import { BLOG_POSTS } from '@/content/blog-posts';

const post = BLOG_POSTS.find((p) => p.slug === 'amdec-methode-exemple')!;

export const metadata: Metadata = {
  title: { absolute: `${post.title} | ENTAN` },
  description: post.description,
  keywords: [
    'amdec',
    'amdec exemple',
    'méthode amdec',
    'criticité amdec',
    'analyse des modes de défaillance',
    'fmea',
  ],
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `/blog/${post.slug}`,
    type: 'article',
  },
};

export default function Page() {
  return (
    <BlogLayout title={post.title} description={post.description} date={post.date} slug={post.slug}>
      <p className="lead">
        Un risque identifié en réunion, coté « à l’instinct », puis oublié dans un compte-rendu — c’est la
        façon la plus sûre de le voir se transformer en non-conformité six mois plus tard. L’AMDEC sert
        exactement à éviter ça, à condition de savoir vraiment calculer une criticité et d’agir quand elle
        dépasse un seuil. Voici la méthode, avec un exemple chiffré sur un procédé industriel.
      </p>

      <h2>AMDEC, ça veut dire quoi ?</h2>
      <p>
        AMDEC signifie <strong>Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité</strong>{' '}
        (l’équivalent anglais est FMEA — Failure Mode and Effects Analysis). C’est une méthode qui liste,
        pour un produit ou un procédé, tout ce qui peut mal tourner, pourquoi, avec quelles conséquences —
        et qui chiffre la priorité à traiter chaque risque plutôt que de les traiter tous pareil.
      </p>

      <h2>Les trois facteurs qui composent la criticité</h2>
      <p>Chaque mode de défaillance est coté sur trois facteurs, en général sur une échelle de 1 à 4 :</p>
      <ul>
        <li>
          <strong>Gravité (G)</strong> — l’impact si la défaillance se produit. 1 = effet mineur, à peine
          perceptible ; 4 = catastrophique (arrêt de production, non-conformité client, sécurité).
        </li>
        <li>
          <strong>Occurrence (O)</strong> — la fréquence probable de la défaillance. 1 = rare, jamais
          observée ; 4 = fréquente, déjà arrivée plusieurs fois.
        </li>
        <li>
          <strong>Détectabilité (D)</strong> — la capacité à repérer le problème avant qu’il n’ait un
          impact. 1 = toujours détecté avant conséquence ; 4 = indétectable, découvert trop tard.
        </li>
      </ul>

      <div className="callout">
        <p>
          <strong>Criticité = Gravité × Occurrence × Détectabilité.</strong> Sur une échelle 1-4, le score
          maximum est 64. Au-delà de <strong>24</strong>, le risque est considéré critique et doit
          déclencher une action corrective tracée — pas juste une note dans un compte-rendu de réunion.
        </p>
      </div>

      <h2>Pourquoi la cotation part souvent en vrille</h2>
      <ul>
        <li>
          <strong>Pas de grille de référence.</strong> Sans définition écrite de ce que veut dire « Gravité
          = 3 » pour votre activité, chaque participant cote avec son propre curseur — deux personnes
          notent différemment le même risque.
        </li>
        <li>
          <strong>Confondre Occurrence produit et Occurrence process.</strong> La fréquence à coter est
          celle de la <em>cause</em>, pas celle du symptôme final — sinon la Détectabilité compense
          artificiellement une cause mal maîtrisée.
        </li>
        <li>
          <strong>Une criticité calculée mais jamais reprise.</strong> Coter un risque à 32 sans assigner
          d’action corrective avec un responsable et une échéance ne fait que documenter le problème, pas
          le réduire.
        </li>
        <li>
          <strong>Pas de re-cotation après action.</strong> L’intérêt de l’AMDEC est de mesurer la
          criticité <em>résiduelle</em> une fois l’action corrective en place — sans ça, impossible de
          prouver qu’un risque est réellement sous contrôle.
        </li>
      </ul>

      <h2>Exemple chiffré : ligne d’assemblage</h2>
      <p>
        Sur une ligne d’assemblage de sous-ensembles électroniques, trois modes de défaillance identifiés
        en revue :
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mode de défaillance</th>
              <th>Effet</th>
              <th>G</th>
              <th>O</th>
              <th>D</th>
              <th>Criticité</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Connecteur mal serti</td>
              <td>Panne intermittente chez le client</td>
              <td>4</td>
              <td>2</td>
              <td>4</td>
              <td>32 — critique</td>
            </tr>
            <tr>
              <td>Étiquette de traçabilité illisible</td>
              <td>Retard au contrôle qualité</td>
              <td>2</td>
              <td>3</td>
              <td>2</td>
              <td>12</td>
            </tr>
            <tr>
              <td>Vis de fixation sous-couple</td>
              <td>Jeu mécanique après vibrations</td>
              <td>3</td>
              <td>2</td>
              <td>3</td>
              <td>18</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Seul le connecteur mal serti (32, au-dessus du seuil de 24) déclenche une action corrective
        immédiate — ici, l’ajout d’un contrôle visuel systématique en sortie de sertissage, qui fait
        chuter la Détectabilité de 4 à 1. Recalculée : 4 × 2 × 1 = 8. Le risque est sorti de la zone
        critique, et cette criticité résiduelle est ce qui prouve — en revue de projet — que l’action a
        été efficace, pas juste mise en œuvre.
      </p>

      <h2>Comment la mettre en place en 4 étapes</h2>
      <ul>
        <li><strong>1. Listez les modes de défaillance</strong> par composant ou étape de procédé, avec leur cause et leur effet — pas juste « ça casse », mais pourquoi et sur quoi ça se répercute.</li>
        <li><strong>2. Fixez une grille de cotation partagée</strong> avant de coter quoi que ce soit : ce que signifie concrètement chaque niveau de 1 à 4 pour votre activité, pour que deux personnes cotent pareil.</li>
        <li><strong>3. Cotez en groupe</strong>, pas seul — la valeur de l’AMDEC vient autant de la discussion que du chiffre final.</li>
        <li><strong>4. Assignez une action corrective à tout ce qui dépasse le seuil critique</strong>, avec un responsable et une échéance, puis recotez après mise en œuvre pour vérifier la criticité résiduelle.</li>
      </ul>

      <h2>Et après ?</h2>
      <p>
        Une AMDEC isolée dans un fichier Excel perd de sa valeur dès que l’action corrective se perd dans
        un autre outil. L’intérêt réel apparaît quand chaque risque coté au-dessus du seuil critique
        alimente directement le plan d’action du projet, avec le bon responsable au sens{' '}
        <Link href="/blog/matrice-raci-exemple-guide">RACI</Link> — c’est le sujet du guide{' '}
        <Link href="/methodes">méthodes de gestion de projet industriel</Link>.
      </p>
    </BlogLayout>
  );
}
