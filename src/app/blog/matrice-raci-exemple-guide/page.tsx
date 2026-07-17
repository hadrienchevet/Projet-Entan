import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogLayout } from '@/components/BlogLayout';
import { BLOG_POSTS } from '@/content/blog-posts';

const post = BLOG_POSTS.find((p) => p.slug === 'matrice-raci-exemple-guide')!;

export const metadata: Metadata = {
  title: { absolute: `${post.title} | ENTAN` },
  description: post.description,
  keywords: [
    'matrice raci',
    'raci exemple',
    'modèle raci',
    'raci gestion de projet',
    'responsible accountable consulted informed',
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
        Une matrice RACI mal construite ne sert à rien : tout le monde est « informé » de tout, personne
        n’est vraiment responsable, et à la première dérive de planning, aucun nom précis à qui demander
        des comptes. Voici comment en construire une qui tient réellement la route, avec un exemple
        complet sur un projet industriel.
      </p>

      <h2>RACI, ça veut dire quoi exactement ?</h2>
      <p>
        RACI est un acronyme qui clarifie, pour chaque tâche d’un projet, qui fait quoi parmi quatre
        rôles possibles :
      </p>
      <ul>
        <li><strong>R — Responsible (Réalisateur) :</strong> la ou les personnes qui exécutent la tâche.</li>
        <li><strong>A — Accountable (Approbateur) :</strong> la personne qui rend des comptes sur le résultat. Une seule par tâche, sans exception.</li>
        <li><strong>C — Consulted (Consulté) :</strong> les personnes dont l’avis est sollicité avant ou pendant la tâche (échange à double sens).</li>
        <li><strong>I — Informed (Informé) :</strong> les personnes tenues au courant de l’avancement ou du résultat (sens unique, pas de dialogue attendu).</li>
      </ul>

      <div className="callout">
        <p>
          <strong>La règle qui change tout :</strong> chaque tâche doit avoir <strong>exactement un A</strong>.
          Zéro A, et personne n’est responsable du résultat. Plusieurs A, et vous avez recréé le flou que
          RACI est censé éliminer.
        </p>
      </div>

      <h2>Les erreurs qui rendent une matrice RACI inutile</h2>
      <ul>
        <li>
          <strong>Trop de R sur une même tâche.</strong> Si cinq personnes sont « Responsible » sur la même
          ligne, aucune ne se sent vraiment propriétaire du livrable.
        </li>
        <li>
          <strong>Confondre A et R.</strong> L’Accountable n’exécute pas forcément — un chef de projet peut
          être A sur une tâche technique réalisée par un ingénieur (R), tant que c’est lui qui porte le
          résultat devant la direction.
        </li>
        <li>
          <strong>Trop de C.</strong> Consulter dix personnes avant chaque décision ralentit tout. Réservez
          le C aux avis qui changent réellement la décision.
        </li>
        <li>
          <strong>La matrice remplie une fois puis oubliée.</strong> Une RACI figée dans un fichier que
          personne ne rouvre ne sert à rien dès que le projet évolue — les rôles doivent rester visibles au
          même endroit que le plan d’action, pas dans un tableau à part.
        </li>
      </ul>

      <h2>Exemple concret : lancement d’une nouvelle référence produit</h2>
      <p>
        Prenons un projet industriel classique — l’industrialisation d’une nouvelle référence produit —
        avec quatre rôles : le Chef de projet, le Responsable méthodes, le Responsable qualité et le
        Responsable production.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tâche</th>
              <th>Chef de projet</th>
              <th>Resp. méthodes</th>
              <th>Resp. qualité</th>
              <th>Resp. production</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cahier des charges validé</td>
              <td>A</td>
              <td>R</td>
              <td>C</td>
              <td>C</td>
            </tr>
            <tr>
              <td>Gamme de fabrication</td>
              <td>I</td>
              <td>A / R</td>
              <td>C</td>
              <td>C</td>
            </tr>
            <tr>
              <td>AMDEC process</td>
              <td>I</td>
              <td>R</td>
              <td>A</td>
              <td>C</td>
            </tr>
            <tr>
              <td>Plan de contrôle qualité</td>
              <td>I</td>
              <td>C</td>
              <td>A / R</td>
              <td>C</td>
            </tr>
            <tr>
              <td>Formation des opérateurs</td>
              <td>I</td>
              <td>C</td>
              <td>I</td>
              <td>A / R</td>
            </tr>
            <tr>
              <td>Premières pièces produites</td>
              <td>A</td>
              <td>C</td>
              <td>C</td>
              <td>R</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Remarquez que le Chef de projet n’est <strong>A</strong> que sur les jalons qu’il porte réellement
        devant la direction (le cahier des charges, la sortie des premières pièces) — pas sur chaque tâche
        technique. Sur la gamme de fabrication ou l’AMDEC, c’est l’expert métier qui est à la fois R et A :
        il exécute et répond du résultat, le chef de projet reste seulement informé.
      </p>

      <h2>Comment construire la vôtre en 4 étapes</h2>
      <ul>
        <li><strong>1. Listez les tâches ou jalons</strong> du projet — pas trop fin (pas de RACI à la sous-tâche de 2 heures), pas trop large (pas un seul A pour tout le projet).</li>
        <li><strong>2. Listez les rôles</strong>, pas les noms de personnes si possible — une matrice RACI par fonction reste valable si les personnes changent.</li>
        <li><strong>3. Attribuez un A unique par ligne</strong> avant de remplir le reste. C’est la colonne qui structure tout.</li>
        <li><strong>4. Faites-la valider en réunion de lancement</strong>, à voix haute, avec les personnes concernées — une RACI décidée seule dans son coin sera contestée dès le premier désaccord.</li>
      </ul>

      <h2>Et après ?</h2>
      <p>
        Une matrice RACI qui vit isolée dans un fichier perd vite sa valeur. L’intérêt réel apparaît
        quand chaque action du plan de projet porte directement son Responsible et son Accountable, et
        que l’<Link href="/blog/amdec-methode-exemple">AMDEC</Link> ou le planning s’y réfèrent sans
        ressaisie. C’est le sujet du guide{' '}
        <Link href="/methodes">méthodes de gestion de projet industriel</Link>, qui détaille comment RACI,
        AMDEC, planning et reporting se connectent entre eux.
      </p>
    </BlogLayout>
  );
}
