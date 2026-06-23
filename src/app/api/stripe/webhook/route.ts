import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Webhook Stripe — SOURCE DE VÉRITÉ du plan. Vérifie la signature puis
 * synchronise la table `subscriptions` (service-role, hors RLS).
 * Route publique (cf. middleware) : Stripe appelle sans session.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET manquant.' }, { status: 500 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide : ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const resolveUserId = async (
    sub: Stripe.Subscription,
    hint?: string | null,
  ): Promise<string | undefined> => {
    if (hint) return hint;
    const fromMeta = sub.metadata?.user_id;
    if (fromMeta) return fromMeta;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const { data } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    return (data?.user_id as string | undefined) ?? undefined;
  };

  const syncFromSubscription = async (sub: Stripe.Subscription, hint?: string | null) => {
    const userId = await resolveUserId(sub, hint);
    if (!userId) return;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const active = sub.status === 'active' || sub.status === 'trialing';
    // `current_period_end` selon la version d'API : accès défensif.
    const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
    await admin.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: active ? 'pro' : 'free',
        status: sub.status,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const hint = session.metadata?.user_id ?? session.client_reference_id ?? null;
      if (session.subscription) {
        const subId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncFromSubscription(sub, hint);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
