import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Projet Entan',
};

/**
 * Politique de confidentialité (RGPD) — MODÈLE à compléter (champs entre
 * crochets) et à faire relire avant mise en production réelle.
 */
export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <p>
        La présente politique décrit la manière dont <span className="ph">[Raison sociale]</span> («
        nous ») traite vos données à caractère personnel dans le cadre du service Projet Entan,
        conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
        et Libertés.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        <span className="ph">[Raison sociale]</span>, <span className="ph">[adresse complète]</span>.
        Contact pour toute question relative aux données :{' '}
        <span className="ph">[email de contact / DPO]</span>.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>
          <strong>Compte</strong> : adresse email, nom affiché.
        </li>
        <li>
          <strong>Contenu</strong> : les données que vous saisissez (projets, actions, membres,
          analyses AMDEC / RDP, etc.).
        </li>
        <li>
          <strong>Données techniques</strong> : journaux de connexion, cookie de session
          d’authentification.
        </li>
        <li>
          <strong>Paiement</strong> : géré par Stripe. Nous ne stockons pas vos numéros de carte ;
          nous conservons un identifiant client/abonnement Stripe et le statut de l’abonnement.
        </li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>Fourniture et fonctionnement du Service — exécution du contrat.</li>
        <li>Facturation et gestion des abonnements — exécution du contrat et obligation légale.</li>
        <li>Sécurité et prévention de la fraude — intérêt légitime.</li>
        <li>Support et communication liée au Service — intérêt légitime.</li>
      </ul>

      <h2>4. Destinataires et sous-traitants</h2>
      <p>
        Vos données sont accessibles à nos sous-traitants techniques : Supabase (hébergement de la base
        de données et authentification), Vercel (hébergement de l’application) et Stripe (traitement des
        paiements). Aucune donnée n’est vendue. Un partage peut intervenir si la loi l’exige.
      </p>

      <h2>5. Durées de conservation</h2>
      <ul>
        <li>Compte et contenu : pendant la durée de vie du compte, puis <span className="ph">[X]</span> mois après suppression.</li>
        <li>Données de facturation : conservées <span className="ph">[10 ans]</span> au titre des obligations comptables.</li>
        <li>Journaux techniques : <span className="ph">[durée]</span>.</li>
      </ul>

      <h2>6. Transferts hors Union européenne</h2>
      <p>
        Certains sous-traitants (notamment Vercel et Stripe) peuvent traiter des données en dehors de
        l’Union européenne. Ces transferts sont encadrés par des garanties appropriées (clauses
        contractuelles types de la Commission européenne).
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement
        des échanges (HTTPS), contrôle d’accès aux données par isolation au niveau de la base (Row Level
        Security).
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, de portabilité
        et d’opposition au traitement de vos données. Vous pouvez les exercer en écrivant à{' '}
        <span className="ph">[email de contact]</span>. Une réponse vous sera apportée dans les délais
        légaux.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Le Service utilise uniquement des cookies strictement nécessaires à son fonctionnement
        (maintien de la session d’authentification). Aucun cookie publicitaire ou de traçage tiers
        n’est déposé.
      </p>

      <h2>10. Réclamation</h2>
      <p>
        Vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de
        l’Informatique et des Libertés, <a href="https://www.cnil.fr">www.cnil.fr</a>) si vous estimez
        que le traitement de vos données n’est pas conforme à la réglementation.
      </p>

      <p className="muted">
        Dernière mise à jour : 23 juin 2026. — <span className="ph">[Modèle à compléter et à faire
        valider avant mise en production réelle.]</span>
      </p>
    </LegalLayout>
  );
}
