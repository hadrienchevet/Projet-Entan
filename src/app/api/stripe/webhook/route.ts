import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Webhook Stripe — SOURCE DE VÉRITÉ des sièges. Vérifie la signature puis
 * synchronise `companies` (seats = quantity, status, période). Route publique.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET manquant.' }, { status: 500 });

  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Signature invalide : ${(err as Error).message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  const resolveCompanyId = async (sub: Stripe.Subscription): Promise<string | undefined> => {
    const fromMeta = sub.metadata?.company_id;
    if (fromMeta) return fromMeta;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const { data } = await admin
      .from('companies')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    return (data?.id as string | undefined) ?? undefined;
  };

  const sync = async (sub: Stripe.Subscription) => {
    const companyId = await resolveCompanyId(sub);
    if (!companyId) return;
    const item = sub.items?.data?.[0];
    const quantity = item?.quantity ?? 0;
    const active = sub.status === 'active' || sub.status === 'trialing';
    const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
    await admin
      .from('companies')
      .update({
        seats: active ? quantity : 0,
        status: sub.status,
        stripe_subscription_id: sub.id,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        await sync(await stripe.subscriptions.retrieve(subId));
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await sync(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
