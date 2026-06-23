import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase **service-role** (contourne la RLS) — RÉSERVÉ au serveur
 * (webhook Stripe). Ne JAMAIS l'importer dans un composant client.
 * Lazy : pas d'initialisation au build si la clé manque.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Config admin Supabase manquante (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
