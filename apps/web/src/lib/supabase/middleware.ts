import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@emprende/db';

const RUTAS_PROTEGIDAS = ['/mi-emprendimiento', '/mi-cuenta', '/admin'];

/**
 * Refresca la sesión de Supabase en cada request y protege las rutas de
 * panel de emprendedor / administración. Se invoca desde src/proxy.ts
 * (en Next.js 16 el archivo "middleware" se renombró a "proxy").
 */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esRutaProtegida = RUTAS_PROTEGIDAS.some((ruta) =>
    request.nextUrl.pathname.startsWith(ruta),
  );

  if (esRutaProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
