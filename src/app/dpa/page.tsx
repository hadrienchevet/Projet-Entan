import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Accord de traitement des données (DPA) — Projet Entan',
};

/**
 * DPA / Contrat de sous-traitance (RGPD art. 28). MODÈLE B2B à compléter et à
 * faire relire par un professionnel avant signature avec un client.
 * Le client est responsable de traitement ; l'éditeur est sous-traitant.
 */
export default function DpaPage() {
  return (
    <LegalLayout title="Accord de traitement des données (DPA)">
      <p>
        Le présent accord (« DPA ») encadre le traitement des données à caractère personnel effectué
        par <span className="ph">[Raison sociale]</span> (« le Sous-traitant ») pour le compte du
        client professionnel (« le Responsable de traitement ») dans le cadre du service Projet Entan,
        conformément à l’article 28 du RGPD. Il complète les{' '}
        <a href="/cgv">Conditions Générales de Vente</a> et prévaut sur elles en cas de contradiction
        relative aux données personnelles.
      </p>

      <h2>1. Rôles des parties</h2>
      <p>
        Le Client détermine les finalités et les moyens du traitement des données qu’il saisit ou
        importe dans le Service : il en est le <strong>Responsable de traitement</strong>. L’éditeur
        traite ces données uniquement pour fournir le Service, sur instruction documentée du Client :
        il agit en qualité de <strong>Sous-traitant</strong>.
      </p>

      <h2>2. Description du traitement</h2>
      <ul>
        <li><strong>Objet</strong> : fourniture d’une plateforme SaaS de pilotage de projets et de résolution de problèmes.</li>
        <li><strong>Durée</strong> : durée du contrat d’abonnement.</li>
        <li><strong>Nature et finalité</strong> : hébergement, stockage, affichage et mise à disposition collaborative des données du Client.</li>
        <li>
          <strong>Catégories de données</strong> : données d’identification et de contact des
          utilisateurs (email, nom affiché), appartenance et rôle dans l’équipe, et contenu saisi par
          le Client (projets, actions, membres, analyses AMDEC / RDP, coûts, etc.).
        </li>
        <li>
          <strong>Catégories de personnes concernées</strong> : collaborateurs, salariés et membres
          d’équipe du Client disposant d’un accès, et personnes mentionnées dans les contenus saisis.
        </li>
        <li><strong>Données sensibles</strong> : le Service n’est pas destiné à héberger des catégories particulières de données (art. 9 RGPD).</li>
      </ul>

      <h2>3. Obligations du Sous-traitant</h2>
      <ul>
        <li>Traiter les données uniquement sur instruction documentée du Responsable (le présent DPA et l’usage du Service valant instructions).</li>
        <li>Garantir la confidentialité : seules les personnes habilitées accèdent aux données, sous engagement de confidentialité.</li>
        <li>
          Mettre en œuvre les mesures de sécurité appropriées (art. 32) décrites dans la{' '}
          <a href="/securite">fiche de sécurité</a> : isolation des données par projet (Row Level
          Security), chiffrement en transit et au repos, contrôle d’accès.
        </li>
        <li>Assister le Responsable pour répondre aux demandes d’exercice de droits des personnes concernées.</li>
        <li>Assister le Responsable pour la sécurité, les notifications de violation et, le cas échéant, les analyses d’impact (AIPD).</li>
        <li>
          Au terme du contrat, au choix du Responsable, <strong>supprimer ou restituer</strong> les
          données dans un délai de <span className="ph">[30]</span> jours, puis effacer les copies
          existantes, sauf obligation légale de conservation.
        </li>
      </ul>

      <h2>4. Sous-traitants ultérieurs</h2>
      <p>
        Le Responsable autorise le recours aux sous-traitants ultérieurs suivants, présentant des
        garanties suffisantes au titre du RGPD :
      </p>
      <ul>
        <li><strong>Supabase</strong> — hébergement de la base de données et authentification — <strong>Union européenne (Irlande)</strong>.</li>
        <li><strong>Vercel Inc.</strong> — hébergement et diffusion de l’application — États-Unis (garanties : clauses contractuelles types).</li>
        <li><strong>Stripe Payments Europe, Ltd.</strong> — traitement des paiements — UE / États-Unis (garanties : clauses contractuelles types).</li>
      </ul>
      <p>
        Le Sous-traitant informe le Responsable de tout changement (ajout ou remplacement) de
        sous-traitant ultérieur, et lui laisse la possibilité de s’y opposer pour motif légitime.
      </p>

      <h2>5. Transferts hors Union européenne</h2>
      <p>
        Les données applicatives sont hébergées dans l’Union européenne (Irlande). Certains
        sous-traitants ultérieurs (Vercel, Stripe) peuvent traiter des données en dehors de l’UE ; ces
        transferts sont encadrés par les clauses contractuelles types de la Commission européenne ou un
        mécanisme équivalent.
      </p>

      <h2>6. Violation de données</h2>
      <p>
        En cas de violation de données à caractère personnel, le Sous-traitant en informe le
        Responsable <strong>sans délai injustifié</strong> et au plus tard sous{' '}
        <span className="ph">[48]</span> heures après en avoir pris connaissance, en fournissant les
        éléments utiles permettant au Responsable de respecter ses propres obligations de notification
        (CNIL / personnes concernées).
      </p>

      <h2>7. Audit</h2>
      <p>
        Le Sous-traitant met à disposition du Responsable les informations nécessaires pour démontrer
        le respect de l’article 28 (notamment la <a href="/securite">fiche de sécurité</a>) et permet
        la réalisation d’audits raisonnables, sous réserve d’un préavis et de la confidentialité.
      </p>

      <h2>8. Durée et fin</h2>
      <p>
        Le présent DPA s’applique pendant toute la durée du traitement des données pour le compte du
        Responsable. Ses obligations de confidentialité et de restitution/suppression survivent à la
        fin du contrat.
      </p>

      <p className="muted">
        Dernière mise à jour : 29 juin 2026. — <span className="ph">[Modèle de contrat de
        sous-traitance à compléter et à faire valider par un professionnel du droit avant signature
        avec un client.]</span>
      </p>
    </LegalLayout>
  );
}
