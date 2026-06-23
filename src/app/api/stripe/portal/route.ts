import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/**
 * Ouvre le portail de facturation Stripe (gérer / annuler l'abonnement) pour
 * le customer du compte courant.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const customerId = sub?.stripe_customer_id as string | undefined;
  if (!customerId) {
    // Pas encore client Stripe : rien à gérer.
    return NextResponse.redirect(new URL('/abonnement', request.url));
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/abonnement`,
  });
  return NextResponse.redirect(portal.url, { status: 303 });
}
