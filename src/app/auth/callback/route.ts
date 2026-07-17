import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Callback Supabase (confirmation d'email, magic links) : échange le code
 *  contre une session puis redirige vers la destination demandée. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/projets';
  // Chemin interne simple uniquement (anti open-redirect : refuse //host et /\host).
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/projets';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
