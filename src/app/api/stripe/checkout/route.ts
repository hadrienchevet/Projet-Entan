import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/**
 * Démarre l'abonnement par siège de l'entreprise : crée/réutilise le customer
 * Stripe puis une Checkout Session avec `quantity` = membres actifs. Redirige
 * vers Stripe. Réservé aux admins de l'entreprise.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const priceId = process.env.STRIPE_PRICE_SEAT;
  if (!priceId) return NextResponse.json({ error: 'STRIPE_PRICE_SEAT manquant.' }, { status: 500 });

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from('company_members')
    .select('role, companies(id, name, stripe_customer_id)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  const company = mem?.companies as
    | { id: string; name: string; stripe_customer_id: string | null }
    | undefined;
  if (!company || (mem?.role !== 'owner' && mem?.role !== 'admin')) {
    return NextResponse.redirect(new URL('/abonnement', request.url));
  }

  const stripe = getStripe();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  let customerId = company.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: company.name,
      metadata: { company_id: company.id },
    });
    customerId = customer.id;
    await admin.from('companies').update({ stripe_customer_id: customerId }).eq('id', company.id);
  }

  const { count } = await admin
    .from('company_members')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company.id)
    .eq('status', 'active');
  const quantity = Math.max(count ?? 1, 1);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity }],
    client_reference_id: company.id,
    metadata: { company_id: company.id },
    subscription_data: { metadata: { company_id: company.id } },
    success_url: `${origin}/abonnement?success=1`,
    cancel_url: `${origin}/abonnement?canceled=1`,
  });

  if (!session.url) return NextResponse.json({ error: 'Session Stripe sans URL.' }, { status: 500 });
  return NextResponse.redirect(session.url, { status: 303 });
}
