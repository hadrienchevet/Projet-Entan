import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/**
 * Démarre un abonnement Pro : crée (ou réutilise) le customer Stripe puis une
 * Checkout Session, et redirige le navigateur vers Stripe. Déclenché par un
 * <form method="post"> côté abonnement.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const priceId = process.env.STRIPE_PRICE_PRO;
  if (!priceId) {
    return NextResponse.json({ error: 'STRIPE_PRICE_PRO manquant.' }, { status: 500 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  // Customer Stripe déjà connu ?
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from('subscriptions')
      .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${origin}/abonnement?success=1`,
    cancel_url: `${origin}/abonnement?canceled=1`,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Session Stripe sans URL.' }, { status: 500 });
  }
  return NextResponse.redirect(session.url, { status: 303 });
}
