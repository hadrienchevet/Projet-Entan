import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente',
};

/**
 * CGV — MODÈLE à compléter (champs entre crochets en surbrillance) et à faire
 * relire par un professionnel avant toute facturation réelle.
 */
export default function CgvPage() {
  return (
    <LegalLayout title="Conditions Générales de Vente">
      <p>
        Les présentes Conditions Générales de Vente (« CGV ») régissent l’accès et l’utilisation du
        service Projet Entan (« le Service »), édité par <span className="ph">[Raison sociale]</span>.
        Toute souscription à une offre payante implique l’acceptation sans réserve des présentes CGV.
      </p>

      <h2>1. Éditeur</h2>
      <p>
        <span className="ph">[Raison sociale]</span>, <span className="ph">[forme juridique]</span> au
        capital de <span className="ph">[montant]</span> €, immatriculée au RCS de{' '}
        <span className="ph">[ville]</span> sous le numéro <span className="ph">[SIREN / RCS]</span>,
        dont le siège social est situé <span className="ph">[adresse complète]</span>. Directeur de la
        publication : <span className="ph">[nom]</span>. Contact :{' '}
        <span className="ph">[email de contact]</span>.
      </p>

      <h2>2. Hébergement</h2>
      <p>
        L’application est hébergée par Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis).
        La base de données et l’authentification sont fournies par Supabase, dont l’infrastructure de
        stockage utilisée pour ce service est située dans l’Union européenne (Irlande). Le traitement
        des paiements est assuré par Stripe Payments Europe, Ltd.
      </p>

      <h2>3. Objet</h2>
      <p>
        Le Service est une plateforme SaaS de pilotage de projets industriels et de résolution de
        problèmes (RACI, AMDEC, plan d’actions, planning, démarche en 7 phases, etc.), accessible en
        ligne et en mode collaboratif.
      </p>

      <h2>4. Compte et accès</h2>
      <p>
        L’accès nécessite la création d’un compte (email et mot de passe) ainsi qu’un siège actif,
        obtenu par abonnement ou par une clé d’accès. L’utilisateur garantit l’exactitude des
        informations fournies et est responsable de la confidentialité de ses identifiants ainsi que
        de toute activité réalisée depuis son compte.
      </p>

      <h2>5. Offres et tarifs</h2>
      <p>
        L’accès au Service repose sur un modèle <strong>par siège</strong> : chaque utilisateur actif
        requiert un siège. Les sièges sont souscrits sous forme d’abonnement, au tarif de{' '}
        <span className="ph">[montant]</span> € <span className="ph">[HT / TTC]</span> par siège et par
        mois. Un siège peut également être attribué au moyen d’une clé d’accès fournie par l’éditeur.
        Les prix sont indiqués en euros ; le paiement s’effectue par carte bancaire via Stripe.
        L’abonnement est mensuel et reconduit tacitement à chaque échéance, par prélèvement
        automatique ; le nombre de sièges peut être ajusté à tout moment, la facturation étant mise à
        jour en conséquence.
      </p>

      <h2>6. Durée, résiliation</h2>
      <p>
        L’abonnement peut être résilié à tout moment depuis l’espace « Abonnement » (portail Stripe).
        La résiliation prend effet à la fin de la période en cours déjà réglée ; aucun remboursement
        au prorata n’est dû. L’éditeur peut suspendre ou clôturer un compte en cas de manquement aux
        présentes CGV.
      </p>

      <h2>7. Clientèle professionnelle</h2>
      <p>
        Le Service s’adresse exclusivement à des professionnels (personnes morales ou personnes
        physiques agissant dans le cadre de leur activité). Le client reconnaît souscrire pour les
        besoins de son activité professionnelle ; le droit de rétractation prévu pour les
        consommateurs ne s’applique pas.
      </p>

      <h2>8. Obligations de l’utilisateur</h2>
      <p>
        L’utilisateur s’engage à un usage licite du Service, à ne pas en perturber le fonctionnement,
        à ne pas tenter d’y accéder de manière non autorisée et à ne pas y héberger de contenu
        illicite.
      </p>

      <h2>9. Disponibilité</h2>
      <p>
        L’éditeur met en œuvre des moyens raisonnables pour assurer la disponibilité du Service, sans
        garantie d’absence d’interruption. Des opérations de maintenance peuvent entraîner des
        indisponibilités temporaires.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        Le Service est fourni « en l’état ». La responsabilité de l’éditeur, à supposer qu’elle soit
        engagée, est limitée au montant des sommes effectivement versées par le client au cours des 12
        derniers mois. L’éditeur ne saurait être tenu responsable des dommages indirects. Il appartient
        à l’utilisateur de sauvegarder ses données.
      </p>

      <h2>11. Propriété intellectuelle</h2>
      <p>
        L’éditeur demeure titulaire de l’ensemble des droits de propriété intellectuelle sur le
        Service. L’utilisateur conserve la pleine propriété des données qu’il saisit.
      </p>

      <h2>12. Données personnelles</h2>
      <p>
        Les données personnelles sont traitées conformément à notre{' '}
        <a href="/confidentialite">Politique de confidentialité</a>. Lorsque le client confie, dans le
        cadre du Service, des données personnelles dont il est responsable de traitement, l’éditeur
        agit comme sous-traitant selon notre <a href="/dpa">accord de traitement des données (DPA)</a>.
      </p>

      <h2>13. Modification des CGV</h2>
      <p>
        L’éditeur peut modifier les présentes CGV. Les clients en sont informés préalablement ; la
        poursuite de l’utilisation du Service vaut acceptation de la version mise à jour.
      </p>

      <h2>14. Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. Les parties s’efforceront de résoudre tout
        différend à l’amiable. À défaut d’accord, compétence est expressément attribuée au tribunal du
        ressort de <span className="ph">[ville du siège de l’éditeur]</span>, y compris en cas de
        pluralité de défendeurs ou d’appel en garantie.
      </p>

      <p className="muted">
        Dernière mise à jour : 29 juin 2026. — <span className="ph">[Modèle à compléter et à faire
        valider par un professionnel du droit avant toute facturation réelle.]</span>
      </p>
    </LegalLayout>
  );
}
