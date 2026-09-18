import { createSupabaseClient } from '@emprende/db';

/**
 * Cliente de Supabase con la service role key: se salta Row Level Security,
 * así que solo debe usarse en Route Handlers / Server Actions después de
 * verificar la identidad del usuario (ver /api/cuenta). Nunca lo importes
 * desde un Client Component ni expongas SUPABASE_SERVICE_ROLE_KEY con el
 * prefijo NEXT_PUBLIC_.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
