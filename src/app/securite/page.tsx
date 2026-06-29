import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Sécurité — Projet Entan',
};

/**
 * Fiche de sécurité : page partageable répondant aux questionnaires sécurité
 * des clients (hébergement, chiffrement, isolation, sauvegardes…).
 */
export default function SecuritePage() {
  return (
    <LegalLayout title="Fiche de sécurité">
      <p>
        Cette fiche résume les mesures techniques et organisationnelles mises en œuvre pour protéger
        les données de nos clients. Elle peut être transmise dans le cadre d’une évaluation
        fournisseur.
      </p>

      <h2>Hébergement & localisation</h2>
      <ul>
        <li>Base de données et authentification : <strong>Supabase</strong>, infrastructure en <strong>Union européenne (Irlande)</strong>.</li>
        <li>Application : <strong>Vercel</strong> (réseau de diffusion mondial ; transferts encadrés par clauses contractuelles types).</li>
        <li>Paiements : <strong>Stripe</strong> — aucun numéro de carte n’est stocké par nos soins.</li>
      </ul>

      <h2>Chiffrement</h2>
      <ul>
        <li>En transit : <strong>HTTPS / TLS</strong> sur l’ensemble des échanges.</li>
        <li>Au repos : chiffrement <strong>AES-256</strong> de la base de données (Supabase).</li>
      </ul>

      <h2>Isolation des données (multi-tenant)</h2>
      <ul>
        <li>Cloisonnement appliqué au niveau de la base via <strong>Row Level Security (PostgreSQL)</strong>.</li>
        <li>L’accès aux données est strictement <strong>limité aux membres de chaque projet</strong> : appartenir à la même entreprise ne donne pas accès aux projets.</li>
        <li>Les règles d’isolation sont appliquées côté serveur (base de données), non contournables depuis le navigateur.</li>
      </ul>

      <h2>Authentification & contrôle d’accès</h2>
      <ul>
        <li>Authentification par email / mot de passe (Supabase Auth) ; sessions par cookie sécurisé.</li>
        <li>Accès par siège, avec rôles (propriétaire / administrateur / membre).</li>
        <li>Les clés d’administration (service-role) sont utilisées exclusivement côté serveur, jamais exposées au navigateur.</li>
      </ul>

      <h2>Durcissement applicatif</h2>
      <ul>
        <li>En-têtes de sécurité : HSTS, X-Frame-Options (anti-clickjacking), nosniff, Referrer-Policy, Permissions-Policy.</li>
        <li>Validation des redirections (protection contre les redirections ouvertes).</li>
        <li>Webhooks (paiement, emails) vérifiés par signature.</li>
      </ul>

      <h2>Sauvegardes & continuité</h2>
      <ul>
        <li>Sauvegardes automatiques de la base de données : <span className="ph">[fréquence / rétention selon le plan Supabase]</span>.</li>
        <li>Restauration possible à partir des sauvegardes du fournisseur d’hébergement.</li>
      </ul>

      <h2>Sous-traitants</h2>
      <p>
        Supabase (UE/Irlande), Vercel, Stripe. Le détail des rôles et garanties figure dans notre{' '}
        <a href="/dpa">accord de traitement des données (DPA)</a>.
      </p>

      <h2>Gestion des incidents</h2>
      <p>
        En cas de violation de données, nos clients sont informés sans délai injustifié, avec les
        éléments nécessaires à leurs propres obligations réglementaires.
      </p>

      <h2>Contact sécurité</h2>
      <p>
        Pour toute question ou signalement : <span className="ph">[email de contact sécurité]</span>.
      </p>

      <p className="muted">
        Dernière mise à jour : 29 juin 2026. — <span className="ph">[Compléter les champs entre
        crochets selon votre plan d’hébergement.]</span>
      </p>
    </LegalLayout>
  );
}
