import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Mentions légales',
};

/**
 * Mentions légales (obligatoires — LCEN art. 6). MODÈLE à compléter (champs
 * entre crochets) ; à faire relire avant mise en production réelle.
 */
export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales">
      <h2>1. Éditeur du site</h2>
      <p>
        Le service Projet Entan est édité par <span className="ph">[Raison sociale]</span>,{' '}
        <span className="ph">[forme juridique]</span> au capital de{' '}
        <span className="ph">[montant]</span> €, immatriculée au RCS de{' '}
        <span className="ph">[ville]</span> sous le numéro <span className="ph">[SIREN / RCS]</span>,
        dont le siège social est situé <span className="ph">[adresse complète]</span>.
      </p>
      <ul>
        <li>Directeur de la publication : <span className="ph">[nom]</span></li>
        <li>Contact : <span className="ph">[email de contact]</span> — <span className="ph">[téléphone]</span></li>
        <li>
          Numéro de TVA intracommunautaire : <span className="ph">[FR… ou « non applicable — art. 293 B du CGI »]</span>
        </li>
      </ul>

      <h2>2. Hébergement</h2>
      <p>
        L’application est hébergée par <strong>Vercel Inc.</strong> (340 S Lemon Ave #4133, Walnut,
        CA 91789, États-Unis — <a href="https://vercel.com">vercel.com</a>).
      </p>
      <p>
        La base de données et l’authentification sont fournies par <strong>Supabase</strong>, dont
        l’infrastructure de stockage utilisée pour ce service est située dans l’Union européenne
        (Irlande). Le traitement des paiements est assuré par <strong>Stripe Payments Europe, Ltd.</strong>
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments du Service (code, interface, marques, logos, contenus éditoriaux) est
        protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive de
        l’éditeur. Toute reproduction non autorisée est interdite. Les données saisies par les
        utilisateurs restent leur propriété.
      </p>

      <h2>4. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{' '}
        <a href="/confidentialite">Politique de confidentialité</a>. Les conditions de sous-traitance
        applicables aux clients professionnels figurent dans l’<a href="/dpa">accord de traitement des
        données (DPA)</a>.
      </p>

      <p className="muted">
        Dernière mise à jour : 29 juin 2026. — <span className="ph">[Modèle à compléter avant mise en
        production réelle.]</span>
      </p>
    </LegalLayout>
  );
}
