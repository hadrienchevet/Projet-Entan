import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Instance Stripe serveur (lazy : aucune initialisation au build si la clé
 * n'est pas présente). À n'utiliser que dans des Route Handlers / code serveur.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY manquant.');
    _stripe = new Stripe(key);
  }
  return _stripe;
}
