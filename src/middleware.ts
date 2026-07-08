import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (ex-middleware) : rafraîchit la session Supabase à chaque requête
 * et protège les routes de l'application. Les pages publiques : /login,
 * /auth/* (callbacks). /invite/* exige une session mais gère lui-même la
 * redirection avec retour post-login.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Ne rien insérer entre la création du client et getUser() : c'est cet
  // appel qui rafraîchit le token si nécessaire.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // Le webhook Stripe est appelé sans session (serveur à serveur) → public.
  // Les pages légales (CGV / confidentialité) sont consultables sans compte.
  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/auth') ||
    pathname === '/api/stripe/webhook' ||
    pathname === '/api/auth/send-email' ||
    pathname.startsWith('/api/cron/') ||
    pathname === '/cgv' ||
    pathname === '/confidentialite' ||
    pathname === '/mentions-legales' ||
    pathname === '/dpa' ||
    pathname === '/securite';

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Tout sauf les assets statiques (dont les pages HTML autonomes de public/,
  // comme /lancement.html — partageables sans compte).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|mp4)$).*)'],
};
