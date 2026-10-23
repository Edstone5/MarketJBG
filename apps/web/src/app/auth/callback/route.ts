import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rutaInterna } from '@/lib/rutas';

/** Intercambia el código de confirmación de correo por una sesión activa. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Solo rutas internas: `next=@otro.sitio` terminaría en https://nuestrositio@otro.sitio
  const next = rutaInterna(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmacion`);
}
