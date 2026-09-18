import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@emprende/db';

/**
 * Cliente de Supabase para Server Components, Server Actions y Route
 * Handlers. `cookies()` es asíncrono desde Next.js 15+ (ver AGENTS.md).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` se llamó desde un Server Component: se puede ignorar
            // si hay un proxy.ts refrescando la sesión en cada request.
          }
        },
      },
    },
  );
}
