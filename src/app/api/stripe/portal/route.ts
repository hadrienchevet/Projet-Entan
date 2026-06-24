import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/** Ouvre le portail Stripe (gérer les sièges / la facturation) pour l'entreprise. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from('company_members')
    .select('role, companies(id, stripe_customer_id)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  const company = mem?.companies as { id: string; stripe_customer_id: string | null } | undefined;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  if (!company?.stripe_customer_id || (mem?.role !== 'owner' && mem?.role !== 'admin')) {
    return NextResponse.redirect(new URL('/abonnement', request.url));
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: `${origin}/abonnement`,
  });
  return NextResponse.redirect(portal.url, { status: 303 });
}
