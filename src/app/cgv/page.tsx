import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — Projet Entan',
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
        La base de données et l’authentification sont fournies par Supabase. Le traitement des paiements
        est assuré par Stripe Payments Europe, Ltd.
      </p>

      <h2>3. Objet</h2>
      <p>
        Le Service est une plateforme SaaS de pilotage de projets industriels et de résolution de
        problèmes (RACI, AMDEC, plan d’actions, planning, démarche en 7 phases, etc.), accessible en
        ligne et en mode collaboratif.
      </p>

      <h2>4. Compte et accès</h2>
      <p>
        L’accès nécessite la création d’un compte (email et mot de passe). L’utilisateur garantit
        l’exactitude des informations fournies et est responsable de la confidentialité de ses
        identifiants ainsi que de toute activité réalisée depuis son compte.
      </p>

      <h2>5. Offres et tarifs</h2>
      <p>
        L’offre <strong>Gratuite</strong> est limitée en nombre de projets (3 projets de gestion et 3
        projets de résolution de problèmes). L’offre <strong>Pro</strong> est facturée{' '}
        <span className="ph">[24]</span> € TTC par mois et lève cette limite (projets illimités). Les
        prix sont indiqués en euros, toutes taxes comprises. Le paiement s’effectue par carte bancaire
        via Stripe. L’abonnement est mensuel et reconduit tacitement à chaque échéance, par
        prélèvement automatique.
      </p>

      <h2>6. Durée, résiliation</h2>
      <p>
        L’abonnement peut être résilié à tout moment depuis l’espace « Abonnement » (portail Stripe).
        La résiliation prend effet à la fin de la période en cours déjà réglée ; aucun remboursement
        au prorata n’est dû. L’éditeur peut suspendre ou clôturer un compte en cas de manquement aux
        présentes CGV.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Pour les consommateurs, un délai de rétractation de 14 jours s’applique. En demandant
        l’accès immédiat au Service (fourniture d’un contenu numérique), le client consent à
        l’exécution immédiate et reconnaît renoncer à son droit de rétractation pour la part déjà
        exécutée. Les clients professionnels sont exclus du droit de rétractation.
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
        <a href="/confidentialite">Politique de confidentialité</a>.
      </p>

      <h2>13. Modification des CGV</h2>
      <p>
        L’éditeur peut modifier les présentes CGV. Les clients en sont informés préalablement ; la
        poursuite de l’utilisation du Service vaut acceptation de la version mise à jour.
      </p>

      <h2>14. Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, le client consommateur
        peut recourir gratuitement au médiateur de la consommation{' '}
        <span className="ph">[coordonnées du médiateur]</span>. À défaut de résolution amiable, les
        tribunaux compétents seront saisis conformément aux règles de droit commun.
      </p>

      <p className="muted">
        Dernière mise à jour : 23 juin 2026. — <span className="ph">[Modèle à compléter et à faire
        valider par un professionnel du droit avant toute facturation réelle.]</span>
      </p>
    </LegalLayout>
  );
}
